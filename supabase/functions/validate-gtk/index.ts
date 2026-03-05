// Validate GTK public endpoint - returns GTK data for QR code verification
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try nuptk first, then nip
    let { data: gtk } = await supabase
      .from("gtk_ptk")
      .select("nama, nip, nuptk, jabatan, email, pendidikan, mapel, foto_path")
      .eq("nuptk", id)
      .maybeSingle();

    if (!gtk) {
      const res = await supabase
        .from("gtk_ptk")
        .select("nama, nip, nuptk, jabatan, email, pendidikan, mapel, foto_path")
        .eq("nip", id)
        .maybeSingle();
      gtk = res.data;
    }

    if (!gtk) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get madrasah info
    const { data: madrasah } = await supabase
      .from("madrasah_settings")
      .select("nama_madrasah, alamat, npsn, nsm")
      .limit(1)
      .single();

    // Get foto public URL
    let fotoUrl = null;
    if (gtk.foto_path) {
      const { data } = supabase.storage.from("gtk-photos").getPublicUrl(gtk.foto_path);
      fotoUrl = data?.publicUrl || null;
    }

    return new Response(
      JSON.stringify({
        found: true,
        gtk: { ...gtk, foto_url: fotoUrl },
        madrasah,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
