import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';

/**
 * Klasifikasi asal sekolah pendaftar SPMB:
 * - MI / Madrasah (Kemenag): nama mengandung MI, MIN, MIS, MADRASAH, RA
 * - SD / Diknas (Kemdikbud): nama mengandung SD, SDN, SDS, SDIT, SDI
 * - Lainnya: ada isi tapi tak match
 * - Belum diisi: kosong
 */
export function klasifikasiAsalSekolah(
  nama: string | null | undefined
): 'MI' | 'SD' | 'LAINNYA' | 'KOSONG' {
  const s = (nama ?? '').trim().toUpperCase();
  if (!s) return 'KOSONG';
  if (/\b(MI|MIN|MIS|MADRASAH|RA)\b/.test(s)) return 'MI';
  if (/\b(SD|SDN|SDS|SDIT|SDI)\b/.test(s)) return 'SD';
  return 'LAINNYA';
}

interface DonutProps {
  mi: number;
  sd: number;
  lainnya: number;
  kosong: number;
  /** Tampilan ringkas tanpa kartu pembungkus (untuk dipakai di rekap cetak). */
  bare?: boolean;
}

/** Donut chart SVG (no deps, print-friendly). */
export function PPDBAsalSekolahDonut({ mi, sd, lainnya, kosong, bare }: DonutProps) {
  const total = mi + sd + lainnya + kosong;
  const segments = [
    { label: 'MI / Madrasah', value: mi, color: '#0d9488' },
    { label: 'SD / Diknas', value: sd, color: '#2563eb' },
    { label: 'Lainnya', value: lainnya, color: '#f59e0b' },
    { label: 'Belum Diisi', value: kosong, color: '#94a3b8' },
  ].filter((s) => s.value > 0);

  const size = 160;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  const inner = (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {total > 0 &&
          segments.map((s, i) => {
            const len = (s.value / total) * circ;
            const dasharray = `${len} ${circ - len}`;
            const dashoffset = -offset;
            offset += len;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.6}>
          PENDAFTAR
        </text>
      </svg>

      <div className="flex-1 min-w-[180px] space-y-1.5">
        {segments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada data pendaftar.</p>
        ) : (
          segments.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1">{s.label}</span>
                <span className="font-semibold tabular-nums">{s.value}</span>
                <span className="text-muted-foreground w-10 text-right tabular-nums">{pct}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (bare) return <div className="border rounded p-3 bg-white text-black">{inner}</div>;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          Distribusi Asal Sekolah
        </h3>
        {inner}
      </CardContent>
    </Card>
  );
}

/** Hook ringkas untuk menghitung breakdown dari list pendaftar. */
export function useAsalSekolahBreakdown(
  pendaftar: Array<{ asal_sekolah: string | null }>
) {
  return useMemo(() => {
    let mi = 0, sd = 0, lainnya = 0, kosong = 0;
    for (const p of pendaftar) {
      const k = klasifikasiAsalSekolah(p.asal_sekolah);
      if (k === 'MI') mi++;
      else if (k === 'SD') sd++;
      else if (k === 'LAINNYA') lainnya++;
      else kosong++;
    }
    return { mi, sd, lainnya, kosong };
  }, [pendaftar]);
}
