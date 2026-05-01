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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth guard: require admin or bendahara role ---
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
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('bendahara')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or bendahara role required' }), { status: 403, headers: corsHeaders });
    }
    // --- End auth guard ---

    const FONNTE_API_TOKEN = Deno.env.get('FONNTE_API_TOKEN');
    if (!FONNTE_API_TOKEN) throw new Error('FONNTE_API_TOKEN tidak diset');

    let body: any = {};
    try { body = await req.json(); } catch {}
    const siswaIds: string[] | undefined = body?.siswa_ids;
    const isTest = body?.test === true;

    // Get template from settings
    const { data: setting } = await supabase
      .from('notifikasi_wa_settings')
      .select('*')
      .eq('jenis', 'tunggakan')
      .maybeSingle();

    if (!isTest && setting && !setting.is_active) {
      return new Response(JSON.stringify({ message: 'Notifikasi tunggakan nonaktif', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const template = setting?.template_pesan ||
      "Assalamu'alaikum Bapak/Ibu Wali dari {nama_siswa} ({kelas}),\n\n" +
      "Kami informasikan bahwa terdapat tunggakan pembayaran:\n{rincian}\n\n" +
      "Total Tunggakan: *{total}*\n\nMohon segera melakukan pembayaran. Terima kasih.";

    // Fetch unpaid pembayaran
    let query = supabase
      .from('pembayaran')
      .select('siswa_id, nominal, nominal_bayar, bulan, tahun, status, jenis_tagihan(nama_tagihan), siswa(id, nama, nis, wa_ortu, kelas(nama_kelas))')
      .or('status.eq.belum_lunas,status.eq.cicil');

    if (siswaIds && siswaIds.length > 0) {
      query = query.in('siswa_id', siswaIds);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    // Group by siswa
    const grouped = new Map<string, any>();
    (rows || []).forEach((r: any) => {
      if (!r.siswa?.wa_ortu) return;
      const sid = r.siswa_id;
      const sisa = Number(r.nominal) - Number(r.nominal_bayar);
      if (sisa <= 0) return;
      if (!grouped.has(sid)) {
        grouped.set(sid, {
          nama: r.siswa.nama,
          kelas: r.siswa.kelas?.nama_kelas || '-',
          wa: r.siswa.wa_ortu,
          items: [],
          total: 0,
        });
      }
      const g = grouped.get(sid);
      const periode = r.bulan && r.tahun ? ` (${BULAN[r.bulan - 1]} ${r.tahun})` : '';
      g.items.push(`• ${r.jenis_tagihan?.nama_tagihan || 'Tagihan'}${periode}: ${formatCurrency(sisa)}`);
      g.total += sisa;
    });

    if (grouped.size === 0) {
      return new Response(JSON.stringify({ message: 'Tidak ada tunggakan dengan WA wali', sent: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const [sid, g] of grouped.entries()) {
      const phone = formatPhoneNumber(g.wa);
      if (!phone) continue;

      const message = template
        .replace(/{nama_siswa}/g, g.nama)
        .replace(/{kelas}/g, g.kelas)
        .replace(/{rincian}/g, g.items.join('\n'))
        .replace(/{total}/g, formatCurrency(g.total));

      try {
        const fd = new FormData();
        fd.append('target', phone);
        fd.append('message', message);
        const res = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Authorization': FONNTE_API_TOKEN },
          body: fd,
        });
        const json = await res.json();
        results.push({ siswa_id: sid, nama: g.nama, phone, status: json.status ? 'sent' : `failed: ${json.reason || 'unknown'}` });
      } catch (e) {
        results.push({ siswa_id: sid, nama: g.nama, phone, status: `error: ${e instanceof Error ? e.message : 'unknown'}` });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    return new Response(JSON.stringify({
      message: 'Reminder tunggakan terkirim',
      total: grouped.size,
      sent,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
