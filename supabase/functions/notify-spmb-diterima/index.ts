import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  else if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('operator')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or operator role required' }), { status: 403, headers: corsHeaders });
    }

    const FONNTE_API_TOKEN = Deno.env.get('FONNTE_API_TOKEN');
    if (!FONNTE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'FONNTE_API_TOKEN is not configured' }), {
        status: 500, headers: corsHeaders
      });
    }

    let body: any = {};
    try { body = await req.json(); } catch {}

    const siswaIds: string[] = body?.siswa_ids || [];
    const pendaftarIds: string[] = body?.pendaftar_ids || [];

    if (siswaIds.length === 0 && pendaftarIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No siswa_ids or pendaftar_ids provided' }), {
        status: 400, headers: corsHeaders
      });
    }

    // Load template
    const { data: settingsData } = await supabaseAdmin
      .from('notifikasi_wa_settings')
      .select('*')
      .eq('jenis', 'spmb_diterima')
      .maybeSingle();

    if (!settingsData?.is_active) {
      return new Response(JSON.stringify({ message: 'Notifikasi SPMB tidak aktif', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const templatePesan = settingsData?.template_pesan ||
      "Alhamdulillah, {nama_siswa} telah DITERIMA di MTs Al Wathoniyah 43 untuk Tahun Ajaran {tahun_ajaran}.\n\nNomor Pendaftaran: {no_pendaftaran}\nNIS: {nis}\n\nSilakan login ke aplikasi:\nUsername: {email}\nPassword: {password}\n\nLink: {link_app}\n\nSelamat bergabung!";

    // Get SPMB settings for tahun ajaran
    const { data: spmbSettings } = await supabaseAdmin
      .from('ppdb_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const tahunAjaran = spmbSettings?.tahun_ajaran || new Date().getFullYear().toString();
    const linkApp = Deno.env.get('APP_URL') || 'https://sim.mtsalwathoniyah43.sch.id';

    type Recipient = {
      nama: string;
      nis?: string;
      no_pendaftaran?: string;
      email?: string;
      password?: string;
      wa_ortu?: string;
    };

    const recipients: Recipient[] = [];

    // Get from siswa if siswaIds provided
    if (siswaIds.length > 0) {
      const { data: siswaList } = await supabaseAdmin
        .from('siswa')
        .select('id, nama, nis, wa_ortu, user_id')
        .in('id', siswaIds);

      // Get auth emails for these siswa
      const userIds = (siswaList || []).filter(s => s.user_id).map(s => s.user_id);
      let userMap = new Map<string, { email: string }>();

      if (userIds.length > 0) {
        const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsersByIds(userIds.map(String));
        authUsers?.forEach((u: any) => {
          userMap.set(u.id, { email: u.email || '' });
        });
      }

      // Get profiles for passwords
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, initial_password')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.initial_password]));

      for (const s of siswaList || []) {
        const userInfo = s.user_id ? userMap.get(s.user_id) : null;
        recipients.push({
          nama: s.nama,
          nis: s.nis,
          wa_ortu: s.wa_ortu,
          email: userInfo?.email,
          password: s.user_id ? profileMap.get(s.user_id) || '' : '',
        });
      }
    }

    // Get from pendaftar if pendaftarIds provided
    if (pendaftarIds.length > 0) {
      const { data: pendaftarList } = await supabaseAdmin
        .from('ppdb_pendaftar')
        .select('id, nama, nomor_pendaftaran, wa_ortu')
        .in('id', pendaftarIds);

      for (const p of pendaftarList || []) {
        recipients.push({
          nama: p.nama,
          no_pendaftaran: p.nomor_pendaftaran,
          wa_ortu: p.wa_ortu,
        });
      }
    }

    const results: any[] = [];
    let sent = 0;

    for (const r of recipients) {
      if (!r.wa_ortu) {
        results.push({ nama: r.nama, status: 'no_phone' });
        continue;
      }

      const phone = formatPhoneNumber(r.wa_ortu);
      if (!phone) {
        results.push({ nama: r.nama, status: 'invalid_phone' });
        continue;
      }

      const message = templatePesan
        .replace(/\{nama_siswa\}/g, r.nama)
        .replace(/\{nama\}/g, r.nama)
        .replace(/\{tahun_ajaran\}/g, tahunAjaran)
        .replace(/\{no_pendaftaran\}/g, r.no_pendaftaran || '-')
        .replace(/\{nis\}/g, r.nis || '-')
        .replace(/\{email\}/g, r.email || '-')
        .replace(/\{password\}/g, r.password || '-')
        .replace(/\{link_app\}/g, linkApp);

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
          nama: r.nama,
          phone,
          status: ok ? 'sent' : `failed: ${result.reason || 'unknown'}`,
        });
      } catch (err) {
        results.push({
          nama: r.nama,
          phone,
          status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifikasi SPMB diproses',
      total: recipients.length,
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
