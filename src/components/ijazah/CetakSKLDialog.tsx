import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { rataRapor, nilaiAkhir, terbilangPerDigit, terbilangDesimalPerDigit } from '@/lib/pdum-calc';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  siswaId: string;
  taId: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function normalKelompok(k: string): 'A' | 'B' | 'mulok' {
  if (k === 'B') return 'B';
  if (k === 'mulok' || k === 'muatan_lokal') return 'mulok';
  return 'A';
}

export function CetakSKLDialog({ open, onOpenChange, siswaId, taId }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['skl-full', siswaId, taId],
    enabled: open && !!siswaId && !!taId,
    queryFn: async () => {
      const [siswaRes, kelulusanRes, kelSetRes, taRes, madrasahRes, pesertaRes, mapelRes, settingsRes, raporRes, umRes] = await Promise.all([
        supabase.from('siswa').select('id, nama, nis, nisn, tempat_lahir, tanggal_lahir, kelas_id, nama_ayah_kandung, nama_ibu_kandung, foto_path').eq('id', siswaId).maybeSingle(),
        supabase.from('kelulusan').select('*').eq('siswa_id', siswaId).eq('ta_id', taId).maybeSingle(),
        supabase.from('kelulusan_settings').select('*').eq('ta_id', taId).maybeSingle(),
        supabase.from('tahun_ajaran').select('nama_ta').eq('id', taId).maybeSingle(),
        supabase.from('madrasah_settings').select('*').maybeSingle(),
        supabase.from('pdum_peserta').select('*').eq('siswa_id', siswaId).eq('ta_id', taId).maybeSingle(),
        supabase.from('pdum_mapel').select('*').eq('is_active', true).order('urutan'),
        supabase.from('pdum_settings').select('*').eq('ta_id', taId).maybeSingle(),
        supabase.from('pdum_nilai_rapor').select('siswa_id, kode_mapel, semester, nilai').eq('siswa_id', siswaId).eq('ta_id', taId),
        supabase.from('pdum_nilai_um').select('siswa_id, kode_mapel, nilai').eq('siswa_id', siswaId).eq('ta_id', taId),
      ]);
      let nama_kelas = '';
      if (siswaRes.data?.kelas_id) {
        const { data: k } = await supabase.from('kelas').select('nama_kelas').eq('id', siswaRes.data.kelas_id).maybeSingle();
        nama_kelas = k?.nama_kelas || '';
      }
      return {
        siswa: siswaRes.data,
        kelulusan: kelulusanRes.data,
        ta: taRes.data,
        madrasah: madrasahRes.data,
        peserta: pesertaRes.data,
        mapelList: (mapelRes.data || []) as any[],
        settings: settingsRes.data,
        rapor: (raporRes.data || []) as any[],
        um: (umRes.data || []) as any[],
        nama_kelas,
      };
    },
  });

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>SKL ${data?.siswa?.nama}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4; margin: 18mm 18mm 14mm 18mm; }
        body { font-family: 'Times New Roman', serif; color: #000; }
        .skl-page { page-break-after: always; }
        .skl-page:last-child { page-break-after: auto; }
        table { border-collapse: collapse; }
        .skl-table th, .skl-table td { border: 1px solid #000; padding: 4px 6px; }
        .underline-dot { border-bottom: 1px solid #000; display: inline-block; min-width: 100%; padding: 1px 4px; }
      </style>
    </head><body>${html}</body><script>window.onload=()=>setTimeout(()=>window.print(),600)</script></html>`);
    w.document.close();
  };

  if (!data?.siswa) return null;
  const s = data.siswa;
  const k = data.kelulusan;
  const m = data.madrasah;
  const p = data.peserta;
  const isLulus = k?.status === 'lulus';

  const tglLahir = s.tanggal_lahir
    ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';
  const tglSk = k?.tanggal_lulus
    ? new Date(k.tanggal_lulus).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const namaOrtu = p?.nama_ayah_override || s.nama_ayah_kandung || p?.nama_ibu_override || s.nama_ibu_kandung || '-';

  // Hitung nilai akhir per mapel
  const bobotR = Number(data.settings?.bobot_rapor ?? 60);
  const bobotU = Number(data.settings?.bobot_um ?? 40);
  const mapelWithNA = data.mapelList.map((mp: any) => {
    const rata = rataRapor(data.rapor as any, s.id, mp.kode_mapel);
    const um = data.um.find((u: any) => u.kode_mapel === mp.kode_mapel)?.nilai ?? null;
    const na = nilaiAkhir(rata, um as number | null, bobotR, bobotU);
    return { ...mp, na };
  });

  const kelompokA = mapelWithNA.filter((mp: any) => normalKelompok(mp.kelompok) === 'A');
  const kelompokB = mapelWithNA.filter((mp: any) => normalKelompok(mp.kelompok) === 'B');
  const kelompokMulok = mapelWithNA.filter((mp: any) => normalKelompok(mp.kelompok) === 'mulok');

  const allNA = mapelWithNA.map((mp: any) => mp.na).filter((v: any) => v != null) as number[];
  const rataRataNA = allNA.length ? Math.round((allNA.reduce((a, b) => a + b, 0) / allNA.length) * 100) / 100 : null;

  // Foto siswa (public bucket)
  const fotoUrl = s.foto_path
    ? `${SUPABASE_URL}/storage/v1/object/public/siswa-photos/${s.foto_path}`
    : null;

  // QR ke halaman cek kelulusan
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cekUrl = `${origin}/kelulusan${s.nisn ? `?nisn=${encodeURIComponent(s.nisn)}` : ''}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cekUrl)}`;

  const renderRowMapel = (mp: any, idx: number, isSub = false) => (
    <tr key={mp.id}>
      <td className="text-center" style={{ width: 30 }}>{isSub ? '' : idx}</td>
      <td className={isSub ? 'pl-6' : ''}>{mp.nama_mapel}</td>
      <td className="text-center" style={{ width: 70 }}>{mp.na != null ? mp.na.toFixed(0) : ''}</td>
      <td className="italic" style={{ width: 260 }}>{mp.na != null ? terbilangPerDigit(mp.na) : ''}</td>
    </tr>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Surat Keterangan Lulus</DialogTitle>
            <Button onClick={handlePrint} size="sm"><Printer className="h-4 w-4 mr-2" />Cetak</Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="bg-white text-black text-[12pt] leading-relaxed">
          {/* ====================== HALAMAN 1: SURAT KETERANGAN LULUS ====================== */}
          <div className="skl-page p-2">
            {/* KOP */}
            <div className="flex items-start gap-3 border-b-2 border-black pb-2">
              <img src="/logo-kemenag.png" alt="Logo" className="h-20 w-20 object-contain shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-[13pt] font-semibold leading-tight">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
                <p className="text-[14pt] font-bold leading-tight">{m?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</p>
                {m?.alamat && <p className="text-[11pt] italic leading-tight">{m.alamat}</p>}
                <p className="text-[11pt] italic leading-tight">
                  {[m?.kabupaten_kota, m?.provinsi].filter(Boolean).join(' - ')}
                </p>
              </div>
            </div>

            {/* JUDUL */}
            <div className="text-center mt-4">
              <p className="text-[13pt] font-bold underline">SURAT KETERANGAN LULUS</p>
              <p className="text-[12pt] font-bold">TAHUN PELAJARAN {data.ta?.nama_ta || '-'}</p>
              {k?.nomor_sk && <p className="text-[11pt]">Nomor : {k.nomor_sk}</p>}
            </div>

            {/* ISI */}
            <div className="mt-5">
              <p>Yang bertanda tangan di bawah ini kepala <strong>{m?.nama_madrasah || 'MTs Al-Wathoniyah 43'}</strong>:</p>

              <table className="ml-6 mt-2 text-[12pt]" style={{ width: 'calc(100% - 24px)' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 250 }}>nomor pokok sekolah nasional</td>
                    <td style={{ width: 12 }}>:</td>
                    <td><span className="underline-dot">{m?.npsn || '-'}</span></td>
                  </tr>
                  <tr>
                    <td>Kabupaten/Kota</td><td>:</td>
                    <td><span className="underline-dot">{m?.kabupaten_kota || '-'}</span></td>
                  </tr>
                  <tr>
                    <td>Provinsi</td><td>:</td>
                    <td><span className="underline-dot">{m?.provinsi || '-'}</span></td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-4">menerangkan bahwa:</p>
              <table className="ml-6 mt-2 text-[12pt]" style={{ width: 'calc(100% - 24px)' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 250 }}>nama</td><td style={{ width: 12 }}>:</td>
                    <td><span className="underline-dot font-semibold">{s.nama}</span></td>
                  </tr>
                  <tr>
                    <td>tempat dan tanggal lahir</td><td>:</td>
                    <td><span className="underline-dot">{(s.tempat_lahir || '-') + ', ' + tglLahir}</span></td>
                  </tr>
                  <tr>
                    <td>nama orang tua/wali</td><td>:</td>
                    <td><span className="underline-dot">{namaOrtu}</span></td>
                  </tr>
                  <tr>
                    <td>nomor induk siswa</td><td>:</td>
                    <td><span className="underline-dot">{s.nis || '-'}</span></td>
                  </tr>
                  <tr>
                    <td>nomor induk siswa nasional</td><td>:</td>
                    <td><span className="underline-dot">{s.nisn || '-'}</span></td>
                  </tr>
                  <tr>
                    <td>nomor peserta asesmen madrasah</td><td>:</td>
                    <td><span className="underline-dot">{p?.nomor_peserta || '-'}</span></td>
                  </tr>
                  <tr>
                    <td>madrasah asal</td><td>:</td>
                    <td><span className="underline-dot">{m?.nama_madrasah || '-'}</span></td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-4 text-justify">
                dinyatakan <strong>{isLulus ? 'LULUS' : k?.status === 'tidak_lulus' ? 'TIDAK LULUS' : 'BELUM DITETAPKAN'}</strong> dari satuan pendidikan setelah memenuhi seluruh kriteria sesuai dengan peraturan perundang-undangan.
              </p>
              <p className="mt-3">Demikian surat keterangan ini dibuat untuk digunakan sebagaimana mestinya.</p>
            </div>

            {/* FOOTER: QR + FOTO + TTD */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="flex flex-col items-start">
                <img src={qrUrl} alt="QR Verifikasi" style={{ width: 110, height: 110 }} />
                <p className="text-[9pt] mt-1">Scan untuk verifikasi</p>
              </div>
              <div className="flex flex-col items-center">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto siswa" style={{ width: 90, height: 120, objectFit: 'cover', border: '1px solid #000' }} />
                ) : (
                  <div style={{ width: 90, height: 120, border: '1px solid #000' }} className="flex items-center justify-center text-[9pt] text-center">Foto<br />3 x 4</div>
                )}
              </div>
              <div className="text-[12pt]">
                <p>{m?.kabupaten_kota || 'Jakarta'}, {tglSk}</p>
                <p>Kepala Madrasah</p>
                <div style={{ height: 70 }} />
                <p className="font-bold underline">{m?.kepala_madrasah || '...........................'}</p>
                {m?.nip_kepala && <p>NIP. {m.nip_kepala}</p>}
              </div>
            </div>
          </div>

          {/* ====================== HALAMAN 2: DAFTAR NILAI ====================== */}
          <div className="skl-page p-2">
            <div className="text-center">
              <p className="text-[13pt] font-bold">DAFTAR NILAI</p>
              <p className="text-[12pt] font-bold">MADRASAH TSANAWIYAH</p>
              <p className="text-[11pt]">TAHUN PELAJARAN {data.ta?.nama_ta || '-'}</p>
            </div>

            <table className="mt-4 text-[12pt]" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: 220 }}>Nama</td>
                  <td style={{ width: 12 }}>:</td>
                  <td><span className="underline-dot font-semibold">{s.nama}</span></td>
                </tr>
                <tr>
                  <td>Tempat dan Tanggal Lahir</td><td>:</td>
                  <td><span className="underline-dot">{(s.tempat_lahir || '-') + ', ' + tglLahir}</span></td>
                </tr>
                <tr>
                  <td>Nomor Induk Siswa</td><td>:</td>
                  <td><span className="underline-dot">{s.nis || '-'}</span></td>
                </tr>
                <tr>
                  <td>Nomor Induk Siswa Nasional</td><td>:</td>
                  <td><span className="underline-dot">{s.nisn || '-'}</span></td>
                </tr>
              </tbody>
            </table>

            <table className="skl-table mt-4 text-[11pt]" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th colSpan={2} rowSpan={2} className="text-center">Mata Pelajaran</th>
                  <th colSpan={2} className="text-center">Nilai</th>
                </tr>
                <tr>
                  <th className="text-center">Angka</th>
                  <th className="text-center">Huruf</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok A */}
                <tr><td colSpan={4} className="font-semibold">Kelompok A</td></tr>
                {kelompokA.map((mp: any, i: number) => renderRowMapel(mp, i + 1))}

                {/* Kelompok B */}
                {kelompokB.length > 0 && <>
                  <tr><td colSpan={4} className="font-semibold">Kelompok B</td></tr>
                  {kelompokB.map((mp: any, i: number) => renderRowMapel(mp, i + 1))}
                </>}

                {/* Muatan Lokal */}
                {kelompokMulok.length > 0 && <>
                  <tr><td colSpan={4} className="font-semibold">Muatan Lokal</td></tr>
                  {kelompokMulok.map((mp: any, i: number) => renderRowMapel(mp, i + 1))}
                </>}

                {/* Rata-rata */}
                <tr className="font-bold">
                  <td colSpan={2} className="text-center">Rata-Rata</td>
                  <td className="text-center">{rataRataNA != null ? rataRataNA.toFixed(2).replace('.', ',') : ''}</td>
                  <td className="italic">{rataRataNA != null ? terbilangDesimalPerDigit(rataRataNA, 2) : ''}</td>
                </tr>
              </tbody>
            </table>

            {/* QR + TTD halaman 2 */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div>
                <img src={qrUrl} alt="QR Verifikasi" style={{ width: 110, height: 110 }} />
                <p className="text-[9pt] mt-1">Scan untuk verifikasi</p>
              </div>
              <div className="text-[12pt]">
                <p>{m?.kabupaten_kota || 'Jakarta'}, {tglSk}</p>
                <p>Kepala Madrasah</p>
                <div style={{ height: 70 }} />
                <p className="font-bold underline">{m?.kepala_madrasah || '...........................'}</p>
                {m?.nip_kepala && <p>NIP. {m.nip_kepala}</p>}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
