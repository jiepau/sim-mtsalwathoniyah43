import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { nisn, tanggal_lahir } = await req.json();

    if (!nisn || typeof nisn !== 'string' || nisn.trim().length < 4) {
      return new Response(JSON.stringify({ error: 'NISN tidak valid' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Cek pengaturan pengumuman
    const { data: settings } = await supabase
      .from('kelulusan_settings')
      .select('is_published, published_at, judul_pengumuman, pesan_ucapan, ta_id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.is_published) {
      return new Response(JSON.stringify({
        status: 'not_published',
        message: 'Pengumuman kelulusan belum dibuka.',
        published_at: settings?.published_at ?? null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Belum waktunya?
    if (settings.published_at && new Date(settings.published_at) > new Date()) {
      return new Response(JSON.stringify({
        status: 'not_yet',
        message: 'Pengumuman kelulusan akan dibuka pada waktu yang ditentukan.',
        published_at: settings.published_at,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cari siswa by NISN
    let query = supabase.from('siswa').select('id, nama, nisn, nis, tanggal_lahir, kelas_id').eq('nisn', nisn.trim());
    const { data: siswa } = await query.maybeSingle();

    if (!siswa) {
      return new Response(JSON.stringify({ status: 'not_found', message: 'NISN tidak ditemukan.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verifikasi tanggal lahir (opsional)
    if (tanggal_lahir && siswa.tanggal_lahir && tanggal_lahir !== siswa.tanggal_lahir) {
      return new Response(JSON.stringify({ status: 'mismatch', message: 'Data tidak cocok. Periksa kembali NISN dan tanggal lahir.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ambil status kelulusan
    const { data: kelulusan } = await supabase
      .from('kelulusan')
      .select('status, nomor_sk, tanggal_lulus')
      .eq('siswa_id', siswa.id)
      .maybeSingle();

    if (!kelulusan || kelulusan.status === 'pending') {
      return new Response(JSON.stringify({
        status: 'pending',
        message: 'Status kelulusan untuk peserta didik ini belum ditetapkan.',
        nama: siswa.nama,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ambil nama kelas
    let nama_kelas: string | null = null;
    if (siswa.kelas_id) {
      const { data: kelas } = await supabase.from('kelas').select('nama_kelas').eq('id', siswa.kelas_id).maybeSingle();
      nama_kelas = kelas?.nama_kelas ?? null;
    }

    return new Response(JSON.stringify({
      status: kelulusan.status, // 'lulus' | 'tidak_lulus'
      siswa: {
        id: siswa.id,
        nama: siswa.nama,
        nisn: siswa.nisn,
        nis: siswa.nis,
        nama_kelas,
      },
      kelulusan: {
        nomor_sk: kelulusan.nomor_sk,
        tanggal_lulus: kelulusan.tanggal_lulus,
      },
      pengumuman: {
        judul: settings.judul_pengumuman,
        pesan: settings.pesan_ucapan,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
