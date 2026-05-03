/**
 * Kop laporan standar — dua-logo (Madrasah kiri + Kemenag kanan).
 * Mengikuti acuan PPDBRekapPrintDialog. Pakai di SEMUA dialog cetak A4
 * format laporan (bukan kartu/struk).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  /** Judul laporan, mis. "Rekap Pendaftar SPMB" */
  judul: string;
  /** Sub-judul opsional, mis. "Semester Ganjil — TA 2025/2026" */
  subjudul?: string;
  /** Baris periode opsional, mis. "Periode: 1 Juli 2025 s.d. 30 Juni 2026" */
  periode?: string;
}

interface MadrasahSettings {
  nama_madrasah: string;
  alamat: string | null;
  npsn: string | null;
  nsm: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

export function PrintKopMadrasah({ judul, subjudul, periode }: Props) {
  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-settings-print-kop'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data as MadrasahSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 border-b-2 border-black pb-2">
        <img
          src="/logo-alwathoniyah.png"
          alt="Logo Madrasah"
          className="print-kop-logo h-20 w-20 object-contain shrink-0"
        />
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase leading-tight">
            Kementerian Agama Republik Indonesia
          </p>
          <h2 className="text-base font-bold uppercase leading-tight">
            {madrasah?.nama_madrasah ?? 'MTs Al-Wathoniyah 43'}
          </h2>
          {madrasah?.alamat && (
            <p className="text-[11px] leading-tight">{madrasah.alamat}</p>
          )}
          {(madrasah?.npsn || madrasah?.nsm) && (
            <p className="text-[11px] leading-tight">
              {madrasah?.nsm && `NSM: ${madrasah.nsm}`}
              {madrasah?.nsm && madrasah?.npsn && ' • '}
              {madrasah?.npsn && `NPSN: ${madrasah.npsn}`}
            </p>
          )}
        </div>
        <img
          src="/logo-kemenag.png"
          alt="Logo Kemenag"
          className="print-kop-logo h-20 w-20 object-contain shrink-0"
        />
      </div>

      <div className="text-center">
        <h3 className="text-sm font-bold uppercase">{judul}</h3>
        {subjudul && <p className="text-xs font-semibold">{subjudul}</p>}
        {periode && <p className="text-[11px]">{periode}</p>}
      </div>
    </div>
  );
}

interface TtdProps {
  /** Kota TTD, default "Jakarta" */
  kota?: string;
  /** Tanggal TTD (Date object atau ISO string). Default sekarang. */
  tanggal?: Date | string;
  /** Jika true, render dua kolom (kiri kosong / kiri custom + kanan Kepala). */
  twoColumn?: boolean;
  /** Jabatan & nama untuk kolom kiri saat twoColumn=true. */
  kiri?: { jabatan: string; nama?: string | null; nip?: string | null };
}

export function PrintTtdKepala({
  kota = 'Jakarta', tanggal, twoColumn = false, kiri,
}: TtdProps) {
  const { data: madrasah } = useQuery({
    queryKey: ['madrasah-settings-print-kop'],
    queryFn: async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').maybeSingle();
      return data as MadrasahSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const date = tanggal ? (typeof tanggal === 'string' ? new Date(tanggal) : tanggal) : new Date();
  const tglStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (twoColumn) {
    return (
      <div className="grid grid-cols-2 gap-8 pt-6 text-xs avoid-break">
        <div className="text-center">
          <p>&nbsp;</p>
          <p>{kiri?.jabatan ?? ''},</p>
          <div className="h-20" />
          <p className="font-semibold underline">{kiri?.nama || '...........................'}</p>
          {kiri?.nip && <p>NIP. {kiri.nip}</p>}
        </div>
        <div className="text-center">
          <p>{kota}, {tglStr}</p>
          <p>Kepala Madrasah,</p>
          <div className="h-20" />
          <p className="font-semibold underline">{madrasah?.kepala_madrasah || '...........................'}</p>
          {madrasah?.nip_kepala && <p>NIP. {madrasah.nip_kepala}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-6 text-xs avoid-break">
      <div className="text-center w-64">
        <p>{kota}, {tglStr}</p>
        <p>Kepala Madrasah,</p>
        <div className="h-20" />
        <p className="font-semibold underline">{madrasah?.kepala_madrasah || '...........................'}</p>
        {madrasah?.nip_kepala && <p>NIP. {madrasah.nip_kepala}</p>}
      </div>
    </div>
  );
}
