import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth guard: require admin or operator role ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('operator')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or operator role required' }), { status: 403, headers: corsHeaders });
    }
    // --- End auth guard ---

    const FONNTE_API_TOKEN = Deno.env.get('FONNTE_API_TOKEN');
    if (!FONNTE_API_TOKEN) {
      throw new Error('FONNTE_API_TOKEN is not configured');
    }

    const today = new Date().toISOString().split('T')[0];

    // Determine reminder type based on current hour (WIB = UTC+7)
    const now = new Date();
    const wibHour = (now.getUTCHours() + 7) % 24;
    const reminderType = wibHour < 12 ? 'absensi_pagi' : 'absensi_siang';

    // Read body for override type (for test calls)
    let bodyType: string | null = null;
    try {
      const body = await req.json();
      bodyType = body?.type;
    } catch { /* no body */ }

    const settingsJenis = bodyType === 'test' ? reminderType : reminderType;

    // Fetch settings from database
    const { data: settingsData } = await supabase
      .from('notifikasi_wa_settings')
      .select('*')
      .eq('jenis', settingsJenis)
      .single();

    // Check if setting is active (skip check for test calls)
    if (bodyType !== 'test' && settingsData && !settingsData.is_active) {
      return new Response(JSON.stringify({ message: 'Notifikasi nonaktif', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check hari aktif (skip for test) - WIB day: 0=Sunday, 1=Monday..6=Saturday
    if (bodyType !== 'test' && settingsData) {
      const wibDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dayOfWeek = wibDate.getUTCDay(); // 0=Sunday
      // Convert to our format: 1=Monday..6=Saturday, Sunday=7
      const ourDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      if (!settingsData.hari_aktif.includes(ourDay)) {
        return new Response(JSON.stringify({ message: 'Hari ini bukan hari aktif', sent: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const templatePesan = settingsData?.template_pesan || (
      reminderType === 'absensi_pagi'
        ? "Assalamu'alaikum {nama},\n\nPengingat: Mohon segera mengisi absensi kehadiran hari ini.\n\nTerima kasih.\n\n- Admin MTs Al-Wathoniyah 43"
        : "Assalamu'alaikum {nama},\n\nPengingat: Anda belum mengisi absensi kehadiran hari ini. Mohon segera diisi sebelum jam pulang.\n\nTerima kasih.\n\n- Admin MTs Al-Wathoniyah 43"
    );

    // Get all GTK/PTK with phone numbers
    const { data: allGtk, error: gtkError } = await supabase
      .from('gtk_ptk')
      .select('id, nama, no_hp')
      .not('no_hp', 'is', null);

    if (gtkError) throw gtkError;

    if (!allGtk || allGtk.length === 0) {
      return new Response(JSON.stringify({ message: 'Tidak ada data GTK dengan nomor HP', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get GTK who already filled attendance today
    const { data: attendedGtk, error: absError } = await supabase
      .from('absensi_gtk')
      .select('gtk_id')
      .eq('tanggal', today);

    if (absError) throw absError;

    const attendedIds = new Set((attendedGtk || []).map((a: any) => a.gtk_id));

    // Filter GTK who haven't filled attendance
    const pendingGtk = allGtk.filter(
      (gtk: any) => !attendedIds.has(gtk.id) && gtk.no_hp
    );

    if (pendingGtk.length === 0) {
      return new Response(JSON.stringify({ message: 'Semua guru sudah mengisi absensi hari ini', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { nama: string; phone: string; status: string }[] = [];

    for (const gtk of pendingGtk) {
      const phone = formatPhoneNumber(gtk.no_hp!);
      if (!phone) continue;

      const message = templatePesan.replace(/{nama}/g, gtk.nama);

      try {
        const formData = new FormData();
        formData.append('target', phone);
        formData.append('message', message);

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Authorization': FONNTE_API_TOKEN },
          body: formData,
        });

        const result = await response.json();
        results.push({
          nama: gtk.nama,
          phone,
          status: result.status ? 'sent' : `failed: ${result.reason || 'unknown'}`,
        });
      } catch (err) {
        results.push({
          nama: gtk.nama,
          phone,
          status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
        });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    console.log(`Absensi reminder (${settingsJenis}): ${sent}/${pendingGtk.length} sent`);

    return new Response(
      JSON.stringify({
        message: `Pengingat terkirim`,
        total_pending: pendingGtk.length,
        sent,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
