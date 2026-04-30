import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize email local-part (alfanumerik + . _ -)
const sanitizeLocal = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "");

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Determine role from jabatan dengan prioritas: admin > bendahara > guru > operator
const roleFromJabatan = (jabatan: string | null): "admin" | "bendahara" | "guru" | "operator" => {
  const s = (jabatan || "").toLowerCase();
  // Admin: Kepala Madrasah / Wakil Kepala / Wakamad
  if (
    s.includes("kepala madrasah") ||
    s.includes("kepala sekolah") ||
    s.includes("wakil kepala") ||
    s.includes("wakamad") ||
    s.includes("waka ") ||
    s === "kepala" ||
    s.startsWith("kepala ")
  ) return "admin";
  // Bendahara
  if (s.includes("bendahara")) return "bendahara";
  // Guru (termasuk "guru mapel", "guru kelas", "guru BK")
  if (s.includes("guru")) return "guru";
  // Default: TU, Tendik, Operator, Staf, dll
  return "operator";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Only admins can generate GTK accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ambil GTK aktif yang belum punya user_id
    const { data: gtkList, error: gtkError } = await supabaseAdmin
      .from("gtk_ptk")
      .select("id, nama, nuptk, nip, nik, email, jabatan, status_aktif")
      .is("user_id", null)
      .or("status_aktif.is.null,status_aktif.eq.aktif")
      .order("nama");

    if (gtkError) throw gtkError;

    if (!gtkList || gtkList.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          created: 0,
          total: 0,
          results: [],
          message: "Semua GTK aktif sudah memiliki akun",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Array<{
      nama: string;
      identifier: string;
      email: string;
      password: string;
      role: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const gtk of gtkList) {
      // Tentukan identifier (NUPTK > NIP > NIK)
      const identifier =
        (gtk.nuptk && String(gtk.nuptk).trim()) ||
        (gtk.nip && String(gtk.nip).trim()) ||
        (gtk.nik && String(gtk.nik).trim()) ||
        "";

      // Tentukan email: pakai email asli kalau valid, fallback ke <identifier>@gtk.mts
      let email = "";
      const rawEmail = (gtk.email || "").trim();
      if (rawEmail && isValidEmail(rawEmail)) {
        email = rawEmail.toLowerCase();
      } else if (identifier) {
        email = `${sanitizeLocal(identifier)}@gtk.mts`;
      } else {
        // Fallback terakhir: pakai sanitized nama
        const local = sanitizeLocal(gtk.nama || "gtk");
        email = `${local}-${gtk.id.slice(0, 8)}@gtk.mts`;
      }

      // Password default: identifier (min 8 char) atau Gtk + identifier
      const basePwd = identifier || gtk.id.slice(0, 12);
      const password = basePwd.length >= 8 ? `Gtk${basePwd}` : `Gtk${basePwd}${gtk.id.slice(0, 8)}`;

      const role = roleFromJabatan(gtk.jabatan);

      try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: gtk.nama },
        });

        if (createError) {
          results.push({
            nama: gtk.nama,
            identifier,
            email,
            password,
            role,
            success: false,
            error: createError.message,
          });
          continue;
        }

        if (newUser.user) {
          await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role });

          await supabaseAdmin
            .from("profiles")
            .update({ initial_password: password })
            .eq("user_id", newUser.user.id);

          await supabaseAdmin
            .from("gtk_ptk")
            .update({ user_id: newUser.user.id })
            .eq("id", gtk.id);

          results.push({ nama: gtk.nama, identifier, email, password, role, success: true });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({
          nama: gtk.nama,
          identifier,
          email,
          password,
          role,
          success: false,
          error: msg,
        });
      }
    }

    const created = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({ success: true, created, total: gtkList.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
