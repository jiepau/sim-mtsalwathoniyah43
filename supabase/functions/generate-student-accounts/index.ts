import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Only admins can generate student accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get siswa without user_id (no account yet)
    const { data: siswaList, error: siswaError } = await supabaseAdmin
      .from("siswa")
      .select("id, nis, nama")
      .is("user_id", null)
      .eq("status", "aktif")
      .order("nama");

    if (siswaError) throw siswaError;

    if (!siswaList || siswaList.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, created: 0, results: [], 
        message: "Semua siswa aktif sudah memiliki akun" 
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ nis: string; nama: string; email: string; password: string; success: boolean; error?: string }> = [];

    for (const siswa of siswaList) {
      const email = `${siswa.nis}@siswa.mts`;
      const password = `Siswa${siswa.nis}`;

      try {
        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: siswa.nama },
        });

        if (createError) {
          results.push({ nis: siswa.nis, nama: siswa.nama, email, password, success: false, error: createError.message });
          continue;
        }

        if (newUser.user) {
          // Assign siswa role
          await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "siswa" });

          // Save initial password
          await supabaseAdmin.from("profiles")
            .update({ initial_password: password })
            .eq("user_id", newUser.user.id);

          // Link siswa to user
          await supabaseAdmin.from("siswa")
            .update({ user_id: newUser.user.id })
            .eq("id", siswa.id);

          results.push({ nis: siswa.nis, nama: siswa.nama, email, password, success: true });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ nis: siswa.nis, nama: siswa.nama, email, password, success: false, error: msg });
      }
    }

    const created = results.filter(r => r.success).length;

    return new Response(JSON.stringify({ success: true, created, total: siswaList.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
