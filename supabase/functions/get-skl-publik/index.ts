import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { siswa_id, ta_id, nisn } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Pastikan pengumuman sudah dibuka (gate)
    const { data: kelSet } = await supabase
      .from('kelulusan_settings')
      .select('*')
      .eq('ta_id', ta_id)
      .maybeSingle();

    if (!kelSet || !kelSet.is_published) {
      return new Response(JSON.stringify({ error: 'Pengumuman belum dibuka' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (kelSet.published_at && new Date(kelSet.published_at) > new Date()) {
      return new Response(JSON.stringify({ error: 'Pengumuman belum waktunya' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cari siswa: by id atau nisn
    let siswaQuery = supabase.from('siswa').select(
      'id, nama, nis, nisn, tempat_lahir, tanggal_lahir, kelas_id, nama_ayah_kandung, nama_ibu_kandung, foto_path'
    );
    if (siswa_id) siswaQuery = siswaQuery.eq('id', siswa_id);
    else if (nisn) siswaQuery = siswaQuery.eq('nisn', String(nisn).trim());
    else {
      return new Response(JSON.stringify({ error: 'siswa_id atau nisn wajib' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: siswa } = await siswaQuery.maybeSingle();
    if (!siswa) {
      return new Response(JSON.stringify({ error: 'Siswa tidak ditemukan' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hanya boleh akses SKL jika status = lulus
    const { data: kelulusan } = await supabase
      .from('kelulusan').select('*').eq('siswa_id', siswa.id).eq('ta_id', ta_id).maybeSingle();
    if (!kelulusan || kelulusan.status !== 'lulus') {
      return new Response(JSON.stringify({ error: 'SKL tidak tersedia' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [taRes, madrasahRes, pesertaRes, mapelRes, settingsRes, raporRes, umRes, kelasRes] = await Promise.all([
      supabase.from('tahun_ajaran').select('nama_ta').eq('id', ta_id).maybeSingle(),
      supabase.from('madrasah_settings').select('*').maybeSingle(),
      supabase.from('pdum_peserta').select('*').eq('siswa_id', siswa.id).eq('ta_id', ta_id).maybeSingle(),
      supabase.from('pdum_mapel').select('*').eq('is_active', true).order('urutan'),
      supabase.from('pdum_settings').select('*').eq('ta_id', ta_id).maybeSingle(),
      supabase.from('pdum_nilai_rapor').select('siswa_id, kode_mapel, semester, nilai').eq('siswa_id', siswa.id).eq('ta_id', ta_id),
      supabase.from('pdum_nilai_um').select('siswa_id, kode_mapel, nilai').eq('siswa_id', siswa.id).eq('ta_id', ta_id),
      siswa.kelas_id ? supabase.from('kelas').select('nama_kelas').eq('id', siswa.kelas_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    return new Response(JSON.stringify({
      siswa,
      kelulusan,
      ta: taRes.data,
      madrasah: madrasahRes.data,
      peserta: pesertaRes.data,
      mapelList: mapelRes.data || [],
      settings: settingsRes.data,
      kelSet,
      rapor: raporRes.data || [],
      um: umRes.data || [],
      nama_kelas: (kelasRes as any).data?.nama_kelas || '',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
