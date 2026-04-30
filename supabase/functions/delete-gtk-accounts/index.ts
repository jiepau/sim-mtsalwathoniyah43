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
      return new Response(JSON.stringify({ error: "Only admins can delete GTK accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ambil semua GTK yang sudah ter-link ke akun (punya user_id)
    const { data: linkedGtk, error: gtkError } = await supabaseAdmin
      .from("gtk_ptk")
      .select("id, user_id, nama")
      .not("user_id", "is", null);

    if (gtkError) throw gtkError;

    if (!linkedGtk || linkedGtk.length === 0) {
      return new Response(JSON.stringify({
        success: true, deleted: 0,
        message: "Tidak ada akun GTK yang terdaftar",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gtkUserIds = linkedGtk.map((g) => g.user_id as string);
    let deleted = 0;
    const errors: string[] = [];

    for (const userId of gtkUserIds) {
      // Jangan hapus akun admin yang sedang request
      if (userId === user.id) continue;

      // Safety: jangan hapus jika user juga seorang admin
      const { data: isAdmin } = await supabaseAdmin
        .from("user_roles").select("role")
        .eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (isAdmin) {
        errors.push(`${userId}: dilewati (user juga admin)`);
        continue;
      }

      try {
        // Clear user_id reference di gtk_ptk
        await supabaseAdmin
          .from("gtk_ptk")
          .update({ user_id: null })
          .eq("user_id", userId);

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
          errors.push(`${userId}: ${deleteError.message}`);
        } else {
          deleted++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${userId}: ${msg}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted,
      total: gtkUserIds.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
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
