import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format phone number to international format (62xx)
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
    const FONNTE_API_TOKEN = Deno.env.get('FONNTE_API_TOKEN');
    if (!FONNTE_API_TOKEN) {
      throw new Error('FONNTE_API_TOKEN is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Get all GTK/PTK with phone numbers
    const { data: allGtk, error: gtkError } = await supabase
      .from('gtk_ptk')
      .select('id, nama, no_hp')
      .not('no_hp', 'is', null);

    if (gtkError) throw gtkError;

    if (!allGtk || allGtk.length === 0) {
      return new Response(JSON.stringify({ message: 'Tidak ada data GTK dengan nomor HP' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get GTK who already filled attendance today
    const { data: attendedGtk, error: absError } = await supabase
      .from('absensi_gtk')
      .select('gtk_id')
      .eq('tanggal', today);

    if (absError) throw absError;

    const attendedIds = new Set((attendedGtk || []).map((a) => a.gtk_id));

    // Filter GTK who haven't filled attendance
    const pendingGtk = allGtk.filter(
      (gtk) => !attendedIds.has(gtk.id) && gtk.no_hp
    );

    if (pendingGtk.length === 0) {
      return new Response(JSON.stringify({ message: 'Semua guru sudah mengisi absensi hari ini', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine reminder type based on current hour (WIB = UTC+7)
    const now = new Date();
    const wibHour = (now.getUTCHours() + 7) % 24;
    const reminderType = wibHour < 12 ? 'pagi' : 'siang';

    const results: { nama: string; phone: string; status: string }[] = [];

    for (const gtk of pendingGtk) {
      const phone = formatPhoneNumber(gtk.no_hp!);
      if (!phone) continue;

      const message = reminderType === 'pagi'
        ? `Assalamu'alaikum ${gtk.nama},\n\nPengingat: Mohon segera mengisi absensi kehadiran hari ini.\n\nTerima kasih.\n\n- Admin MTs Al-Wathoniyah 43`
        : `Assalamu'alaikum ${gtk.nama},\n\nPengingat: Anda belum mengisi absensi kehadiran hari ini. Mohon segera diisi sebelum jam pulang.\n\nTerima kasih.\n\n- Admin MTs Al-Wathoniyah 43`;

      try {
        const formData = new FormData();
        formData.append('target', phone);
        formData.append('message', message);

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': FONNTE_API_TOKEN,
          },
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

    console.log(`Absensi reminder (${reminderType}): ${sent}/${pendingGtk.length} sent`);

    return new Response(
      JSON.stringify({
        message: `Pengingat ${reminderType} terkirim`,
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
