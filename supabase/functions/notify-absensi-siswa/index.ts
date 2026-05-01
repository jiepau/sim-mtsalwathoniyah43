import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  else if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;
}

const STATUS_LABEL: Record<string, string> = {
  alfa: 'tidak masuk tanpa keterangan (Alfa)',
  sakit: 'tidak masuk karena sakit',
  izin: 'tidak masuk karena izin',
};

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
    // Check role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('operator')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or operator role required' }), { status: 403, headers: corsHeaders });
    }
    // --- End auth guard ---

    const FONNTE_API_TOKEN = Deno.env.get('FONNTE_API_TOKEN');
    if (!FONNTE_API_TOKEN) throw new Error('FONNTE_API_TOKEN is not configured');

    const supabase = supabaseAdmin;

    // Parse body — optional date & status filter
    let body: any = {};
    try { body = await req.json(); } catch {}
    const tanggal: string = body?.tanggal || new Date().toISOString().split('T')[0];
    const statusFilter: string[] = Array.isArray(body?.status) && body.status.length > 0
      ? body.status
      : ['alfa', 'sakit', 'izin'];

    // Load template setting (jenis = 'absensi_siswa_alfa')
    const { data: settingsData } = await supabase
      .from('notifikasi_wa_settings')
      .select('*')
      .eq('jenis', 'absensi_siswa_alfa')
      .maybeSingle();

    const isTest = body?.type === 'test';
    if (!isTest && settingsData && !settingsData.is_active) {
      return new Response(JSON.stringify({ message: 'Notifikasi nonaktif', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const templatePesan = settingsData?.template_pesan ||
      "Assalamu'alaikum Bapak/Ibu wali dari ananda *{nama_siswa}* ({kelas}),\n\nKami informasikan bahwa pada hari ini ({tanggal}) ananda tercatat *{status_label}*.\n\nMohon konfirmasi atau perhatiannya. Terima kasih.\n\n— Admin MTs Al-Wathoniyah 43";

    // Fetch absensi entries for the day with given statuses
    const { data: absensi, error: absErr } = await supabase
      .from('absensi_siswa')
      .select('siswa_id, status, keterangan, tanggal')
      .eq('tanggal', tanggal)
      .in('status', statusFilter);

    if (absErr) throw absErr;
    if (!absensi || absensi.length === 0) {
      return new Response(JSON.stringify({ message: 'Tidak ada siswa Alfa/Sakit/Izin pada tanggal ini', sent: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch siswa + kelas info
    const siswaIds = absensi.map(a => a.siswa_id);
    const { data: siswaList } = await supabase
      .from('siswa')
      .select('id, nama, wa_ortu, kelas_id')
      .in('id', siswaIds);

    const kelasIds = Array.from(new Set((siswaList || []).map(s => s.kelas_id).filter(Boolean)));
    const { data: kelasList } = kelasIds.length > 0
      ? await supabase.from('kelas').select('id, nama_kelas').in('id', kelasIds)
      : { data: [] as any[] };
    const kelasMap = new Map((kelasList || []).map(k => [k.id, k.nama_kelas]));
    const siswaMap = new Map((siswaList || []).map(s => [s.id, s]));

    const tanggalFormatted = new Date(tanggal).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const results: any[] = [];
    let sent = 0;

    for (const a of absensi) {
      const siswa: any = siswaMap.get(a.siswa_id);
      if (!siswa) continue;
      if (!siswa.wa_ortu) {
        results.push({ nama: siswa.nama, status: 'no_phone' });
        continue;
      }
      const phone = formatPhoneNumber(siswa.wa_ortu);
      if (!phone) {
        results.push({ nama: siswa.nama, status: 'invalid_phone' });
        continue;
      }

      const message = templatePesan
        .replace(/\{nama_siswa\}/g, siswa.nama)
        .replace(/\{nama\}/g, siswa.nama)
        .replace(/\{kelas\}/g, kelasMap.get(siswa.kelas_id) || '-')
        .replace(/\{tanggal\}/g, tanggalFormatted)
        .replace(/\{status\}/g, a.status)
        .replace(/\{status_label\}/g, STATUS_LABEL[a.status] || a.status)
        .replace(/\{keterangan\}/g, a.keterangan || '-');

      try {
        const formData = new FormData();
        formData.append('target', phone);
        formData.append('message', message);
        const resp = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Authorization': FONNTE_API_TOKEN },
          body: formData,
        });
        const result = await resp.json();
        const ok = !!result.status;
        if (ok) sent++;
        results.push({
          nama: siswa.nama,
          phone,
          status: ok ? 'sent' : `failed: ${result.reason || 'unknown'}`,
        });
      } catch (err) {
        results.push({
          nama: siswa.nama,
          phone,
          status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
        });
      }
    }

    console.log(`Notifikasi siswa Alfa/Sakit (${tanggal}): ${sent}/${absensi.length} sent`);

    return new Response(JSON.stringify({
      message: 'Notifikasi diproses',
      tanggal,
      total: absensi.length,
      sent,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
