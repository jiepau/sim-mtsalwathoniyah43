import { supabase } from '@/integrations/supabase/client';
import { NAMA_BULAN } from '@/lib/terbilang';

interface GenerateOptions {
  bulan: number;
  tahun: number;
  overwrite: boolean;
}

interface Settings {
  tarif_per_hadir: number;
  potongan_per_alpa: number;
  potongan_per_izin: number;
  potongan_per_sakit: number;
  format_nomor_slip: string;
  hari_kerja_per_minggu: number;
}

function hitungHariKerja(bulan: number, tahun: number, hariKerjaPerMinggu: number): number {
  // bulan 1-12. hariKerjaPerMinggu: 5=Sen-Jum, 6=Sen-Sab, 7=tiap hari
  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(tahun, bulan - 1, d).getDay(); // 0=Min, 6=Sab
    if (hariKerjaPerMinggu === 7) count++;
    else if (hariKerjaPerMinggu === 6 && dow !== 0) count++;
    else if (hariKerjaPerMinggu === 5 && dow !== 0 && dow !== 6) count++;
    else if (hariKerjaPerMinggu < 5 && dow >= 1 && dow <= hariKerjaPerMinggu) count++;
  }
  return count;
}

function applyFormat(fmt: string, bulan: number, tahun: number, seq: number): string {
  return fmt
    .replace(/\{bulan\}/g, String(bulan).padStart(2, '0'))
    .replace(/\{tahun\}/g, String(tahun))
    .replace(/\{seq\}/g, String(seq).padStart(3, '0'));
}

export async function generateGajiBulanan({ bulan, tahun, overwrite }: GenerateOptions) {
  // 1. Ambil settings
  const { data: settings } = await supabase.from('gaji_settings').select('*').limit(1).maybeSingle();
  const s: Settings = settings ?? {
    tarif_per_hadir: 0, potongan_per_alpa: 0, potongan_per_izin: 0,
    potongan_per_sakit: 0, format_nomor_slip: 'SLIP/{bulan}/{tahun}/{seq}',
    hari_kerja_per_minggu: 6,
  };

  // 2. Ambil semua GTK aktif
  const { data: gtkList, error: e1 } = await supabase
    .from('gtk_ptk').select('id,nama').eq('status_aktif', 'aktif').order('nama');
  if (e1) throw e1;
  if (!gtkList || gtkList.length === 0) throw new Error('Tidak ada GTK aktif');

  // 3. Ambil periode existing
  const { data: existing } = await supabase
    .from('gaji_periode').select('id,gtk_id,status').eq('bulan', bulan).eq('tahun', tahun);
  const existingMap = new Map((existing || []).map((r) => [r.gtk_id, r]));

  // 4. Ambil absensi bulan ini (1 query, group sendiri)
  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(new Date(tahun, bulan, 0).getDate()).padStart(2, '0')}`;
  const { data: absensi } = await supabase
    .from('absensi_gtk').select('gtk_id,status').gte('tanggal', startDate).lte('tanggal', endDate);
  const absenMap = new Map<string, { hadir: number; izin: number; sakit: number; alpa: number }>();
  for (const a of absensi || []) {
    const m = absenMap.get(a.gtk_id) || { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    const st = (a.status || '').toLowerCase();
    if (st === 'hadir') m.hadir++;
    else if (st === 'izin') m.izin++;
    else if (st === 'sakit') m.sakit++;
    else if (st === 'alpa' || st === 'alfa') m.alpa++;
    absenMap.set(a.gtk_id, m);
  }

  // 5. Ambil komponen master
  const gtkIds = gtkList.map((g) => g.id);
  const { data: komponenAll } = await supabase
    .from('gaji_komponen_master').select('*').in('gtk_id', gtkIds).eq('is_active', true);
  const komponenMap = new Map<string, typeof komponenAll>();
  for (const k of komponenAll || []) {
    const arr = komponenMap.get(k.gtk_id) || [];
    arr.push(k);
    komponenMap.set(k.gtk_id, arr);
  }

  const hariKerja = hitungHariKerja(bulan, tahun, s.hari_kerja_per_minggu);
  let seq = 1;
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const g of gtkList) {
    const ex = existingMap.get(g.id);
    if (ex && !overwrite) { skipped++; continue; }
    if (ex && ex.status !== 'draft' && !overwrite) { skipped++; continue; }

    const a = absenMap.get(g.id) || { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    const komponen = komponenMap.get(g.id) || [];

    // Bangun detail: master + auto kehadiran (tarif & potongan otomatis)
    const detailRows: { nama_komponen: string; kategori: 'pendapatan' | 'potongan'; nominal: number; urutan: number }[] = [];
    let urutan = 0;
    for (const k of komponen) {
      detailRows.push({
        nama_komponen: k.nama_komponen, kategori: k.kategori as 'pendapatan' | 'potongan',
        nominal: Number(k.nominal), urutan: urutan++,
      });
    }
    if (Number(s.tarif_per_hadir) > 0 && a.hadir > 0) {
      detailRows.push({ nama_komponen: `Insentif Kehadiran (${a.hadir} hari)`, kategori: 'pendapatan', nominal: a.hadir * Number(s.tarif_per_hadir), urutan: urutan++ });
    }
    if (Number(s.potongan_per_alpa) > 0 && a.alpa > 0) {
      detailRows.push({ nama_komponen: `Potongan Alpa (${a.alpa} hari)`, kategori: 'potongan', nominal: a.alpa * Number(s.potongan_per_alpa), urutan: urutan++ });
    }
    if (Number(s.potongan_per_izin) > 0 && a.izin > 0) {
      detailRows.push({ nama_komponen: `Potongan Izin (${a.izin} hari)`, kategori: 'potongan', nominal: a.izin * Number(s.potongan_per_izin), urutan: urutan++ });
    }
    if (Number(s.potongan_per_sakit) > 0 && a.sakit > 0) {
      detailRows.push({ nama_komponen: `Potongan Sakit (${a.sakit} hari)`, kategori: 'potongan', nominal: a.sakit * Number(s.potongan_per_sakit), urutan: urutan++ });
    }

    const totalPendapatan = detailRows.filter((d) => d.kategori === 'pendapatan').reduce((x, y) => x + y.nominal, 0);
    const totalPotongan = detailRows.filter((d) => d.kategori === 'potongan').reduce((x, y) => x + y.nominal, 0);
    const totalBersih = totalPendapatan - totalPotongan;
    const nomorSlip = applyFormat(s.format_nomor_slip, bulan, tahun, seq++);

    const headerPayload = {
      gtk_id: g.id, bulan, tahun,
      jumlah_hadir: a.hadir, jumlah_izin: a.izin, jumlah_sakit: a.sakit, jumlah_alpa: a.alpa,
      hari_kerja: hariKerja,
      total_pendapatan: totalPendapatan, total_potongan: totalPotongan, total_bersih: totalBersih,
      status: 'draft', nomor_slip: nomorSlip,
    };

    let periodeId: string;
    if (ex) {
      const { error } = await supabase.from('gaji_periode').update(headerPayload).eq('id', ex.id);
      if (error) throw error;
      periodeId = ex.id;
      await supabase.from('gaji_detail').delete().eq('gaji_periode_id', periodeId);
      updated++;
    } else {
      const { data: ins, error } = await supabase.from('gaji_periode').insert(headerPayload).select('id').single();
      if (error) throw error;
      periodeId = ins.id;
      created++;
    }

    if (detailRows.length > 0) {
      const { error } = await supabase.from('gaji_detail').insert(
        detailRows.map((d) => ({ ...d, gaji_periode_id: periodeId }))
      );
      if (error) throw error;
    }
  }

  return {
    created, updated, skipped,
    label: `${NAMA_BULAN[bulan - 1]} ${tahun}`,
  };
}
