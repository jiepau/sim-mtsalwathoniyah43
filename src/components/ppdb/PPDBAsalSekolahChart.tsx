import { useMemo, useState } from 'react';
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

interface SegmentDef {
  key: 'MI' | 'SD' | 'LAINNYA' | 'KOSONG';
  label: string;
  value: number;
  color: string;
  desc: string;
}

/** Donut chart SVG (no deps, print-friendly) dengan tooltip interaktif. */
export function PPDBAsalSekolahDonut({ mi, sd, lainnya, kosong, bare }: DonutProps) {
  const total = mi + sd + lainnya + kosong;
  const allSegments: SegmentDef[] = [
    {
      key: 'MI',
      label: 'MI / Madrasah',
      value: mi,
      color: '#0d9488',
      desc: 'Madrasah Ibtidaiyah (Kemenag) — termasuk MIN, MIS, MI Swasta',
    },
    {
      key: 'SD',
      label: 'SD / Diknas',
      value: sd,
      color: '#2563eb',
      desc: 'Sekolah Dasar umum (Kemdikbud) — SDN, SDS, SDIT, SDI',
    },
    {
      key: 'LAINNYA',
      label: 'Lainnya',
      value: lainnya,
      color: '#f59e0b',
      desc: 'Asal sekolah terisi namun tidak terdeteksi sebagai MI/SD',
    },
    {
      key: 'KOSONG',
      label: 'Belum Diisi',
      value: kosong,
      color: '#94a3b8',
      desc: 'Pendaftar belum mengisi field asal sekolah',
    },
  ];
  const segments = allSegments.filter((s) => s.value > 0);

  const size = 180;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  const [hovered, setHovered] = useState<SegmentDef['key'] | null>(null);
  const hoveredSeg = hovered ? segments.find((s) => s.key === hovered) ?? null : null;
  const hoveredPct =
    hoveredSeg && total > 0 ? Math.round((hoveredSeg.value / total) * 100) : 0;

  let offset = 0;
  const inner = (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * circ;
              const dasharray = `${len} ${circ - len}`;
              const dashoffset = -offset;
              offset += len;
              const isActive = hovered === s.key;
              const isDimmed = hovered !== null && !isActive;
              return (
                <circle
                  key={s.key}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isActive ? stroke + 4 : stroke}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{
                    opacity: isDimmed ? 0.35 : 1,
                    cursor: 'pointer',
                    transition: 'opacity 150ms, stroke-width 150ms',
                  }}
                  onMouseEnter={() => setHovered(s.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>
                    {s.label}: {s.value} pendaftar ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
                    {'\n'}
                    {s.desc}
                  </title>
                </circle>
              );
            })}
          {hoveredSeg ? (
            <>
              <text
                x={cx}
                y={cy - 8}
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill={hoveredSeg.color}
              >
                {hoveredPct}%
              </text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.7}>
                {hoveredSeg.value} dari {total}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
                {total}
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.6}>
                PENDAFTAR
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="flex-1 min-w-[200px] space-y-1.5">
        {segments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada data pendaftar.</p>
        ) : (
          segments.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
            const isActive = hovered === s.key;
            return (
              <div
                key={s.key}
                className="rounded transition-colors"
                style={{
                  backgroundColor: isActive ? `${s.color}15` : 'transparent',
                }}
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
                title={s.desc}
              >
                <div className="flex items-center gap-2 text-xs px-1.5 py-1 cursor-default">
                  <span
                    className="inline-block h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="flex-1 font-medium">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.value}</span>
                  <span
                    className="w-10 text-right tabular-nums font-semibold"
                    style={{ color: s.color }}
                  >
                    {pct}%
                  </span>
                </div>
                {isActive && (
                  <p className="text-[10px] text-muted-foreground px-1.5 pb-1.5 leading-snug">
                    {s.desc}
                  </p>
                )}
              </div>
            );
          })
        )}
        {segments.length > 0 && (
          <p className="text-[10px] text-muted-foreground pt-1 border-t">
            Arahkan kursor ke segmen untuk detail.
          </p>
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
