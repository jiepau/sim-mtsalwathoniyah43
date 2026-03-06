import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const BULAN_GANJIL = [
  { bulan: 7, nama: 'Juli' },
  { bulan: 8, nama: 'Agustus' },
  { bulan: 9, nama: 'September' },
  { bulan: 10, nama: 'Oktober' },
  { bulan: 11, nama: 'November' },
  { bulan: 12, nama: 'Desember' },
];

const BULAN_GENAP = [
  { bulan: 1, nama: 'Januari' },
  { bulan: 2, nama: 'Februari' },
  { bulan: 3, nama: 'Maret' },
  { bulan: 4, nama: 'April' },
  { bulan: 5, nama: 'Mei' },
  { bulan: 6, nama: 'Juni' },
];

export interface TPSubItem {
  subNo: string;
  text: string;
}

export interface TPGroup {
  no: number;
  items: TPSubItem[];
  alokasiWaktu: number;
  // Schedule: key = "subNo:bulan-minggu", value = checked
  schedule: Record<string, boolean>;
}

export interface PromesSpreadsheetData {
  groups: TPGroup[];
  cadangan: number;
}

interface PromesDetailRecord {
  bulan: number;
  minggu: number;
  tema: string | null;
  sub_tema: string | null;
  tujuan_pembelajaran: string | null;
  alokasi_waktu: string | null;
  keterangan: string | null;
}

interface Props {
  semester: string;
  initialDetails: PromesDetailRecord[];
  atpTujuanPembelajaran?: string[];
  onChange: (data: PromesSpreadsheetData) => void;
}

// Parse existing promes_detail into spreadsheet data
function parseDetailsToSpreadsheet(details: PromesDetailRecord[], atpTP?: string[]): PromesSpreadsheetData {
  // Group by tema (group number)
  const groupMap = new Map<string, {
    items: Map<string, string>;
    alokasiWaktu: number;
    schedule: Record<string, boolean>;
  }>();

  details.forEach(d => {
    const groupNo = d.tema || '1';
    const subNo = d.sub_tema || `${groupNo}.1`;
    const tpText = d.tujuan_pembelajaran || '';

    if (!groupMap.has(groupNo)) {
      groupMap.set(groupNo, {
        items: new Map(),
        alokasiWaktu: 0,
        schedule: {},
      });
    }

    const group = groupMap.get(groupNo)!;
    if (tpText && !group.items.has(subNo)) {
      group.items.set(subNo, tpText);
    }
    
    // Parse alokasi_waktu 
    if (d.alokasi_waktu) {
      const jp = parseInt(d.alokasi_waktu);
      if (!isNaN(jp) && jp > group.alokasiWaktu) {
        group.alokasiWaktu = jp;
      }
    }

    // Mark schedule
    const scheduleKey = `${subNo}:${d.bulan}-${d.minggu}`;
    group.schedule[scheduleKey] = true;
  });

  // If no existing data but we have ATP TPs, create groups from them
  if (groupMap.size === 0 && atpTP && atpTP.length > 0) {
    const group: typeof groupMap extends Map<string, infer V> ? V : never = {
      items: new Map(),
      alokasiWaktu: 0,
      schedule: {},
    };
    atpTP.forEach((tp, idx) => {
      group.items.set(`1.${idx + 1}`, tp);
    });
    groupMap.set('1', group);
  }

  const groups: TPGroup[] = [];
  const sortedKeys = [...groupMap.keys()].sort((a, b) => parseInt(a) - parseInt(b));
  
  sortedKeys.forEach((key, idx) => {
    const g = groupMap.get(key)!;
    const items: TPSubItem[] = [];
    const sortedSubKeys = [...g.items.keys()].sort((a, b) => {
      const [, aNum] = a.split('.');
      const [, bNum] = b.split('.');
      return parseInt(aNum || '0') - parseInt(bNum || '0');
    });
    
    sortedSubKeys.forEach(subKey => {
      items.push({ subNo: subKey, text: g.items.get(subKey)! });
    });

    groups.push({
      no: idx + 1,
      items: items.length > 0 ? items : [{ subNo: `${idx + 1}.1`, text: '' }],
      alokasiWaktu: g.alokasiWaktu,
      schedule: g.schedule,
    });
  });

  // Ensure at least one group
  if (groups.length === 0) {
    groups.push({
      no: 1,
      items: [{ subNo: '1.1', text: '' }],
      alokasiWaktu: 0,
      schedule: {},
    });
  }

  return { groups, cadangan: 0 };
}

export default function PromesSpreadsheetView({ semester, initialDetails, atpTujuanPembelajaran, onChange }: Props) {
  const [data, setData] = useState<PromesSpreadsheetData>(() => 
    parseDetailsToSpreadsheet(initialDetails, atpTujuanPembelajaran)
  );

  const bulanList = semester === 'ganjil' ? BULAN_GANJIL : BULAN_GENAP;

  useEffect(() => {
    onChange(data);
  }, [data]);

  const updateData = (updater: (prev: PromesSpreadsheetData) => PromesSpreadsheetData) => {
    setData(prev => {
      const next = updater(prev);
      return next;
    });
  };

  const addGroup = () => {
    updateData(prev => {
      const newNo = prev.groups.length + 1;
      return {
        ...prev,
        groups: [...prev.groups, {
          no: newNo,
          items: [{ subNo: `${newNo}.1`, text: '' }],
          alokasiWaktu: 0,
          schedule: {},
        }],
      };
    });
  };

  const removeGroup = (groupIdx: number) => {
    updateData(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== groupIdx).map((g, i) => ({
        ...g,
        no: i + 1,
        items: g.items.map(item => ({
          ...item,
          subNo: `${i + 1}.${item.subNo.split('.')[1]}`,
        })),
      })),
    }));
  };

  const addSubItem = (groupIdx: number) => {
    updateData(prev => {
      const groups = [...prev.groups];
      const group = { ...groups[groupIdx] };
      const newSubNo = `${group.no}.${group.items.length + 1}`;
      group.items = [...group.items, { subNo: newSubNo, text: '' }];
      groups[groupIdx] = group;
      return { ...prev, groups };
    });
  };

  const removeSubItem = (groupIdx: number, itemIdx: number) => {
    updateData(prev => {
      const groups = [...prev.groups];
      const group = { ...groups[groupIdx] };
      if (group.items.length <= 1) return prev;
      group.items = group.items.filter((_, i) => i !== itemIdx).map((item, i) => ({
        ...item,
        subNo: `${group.no}.${i + 1}`,
      }));
      groups[groupIdx] = group;
      return { ...prev, groups };
    });
  };

  const updateSubItemText = (groupIdx: number, itemIdx: number, text: string) => {
    updateData(prev => {
      const groups = [...prev.groups];
      const group = { ...groups[groupIdx] };
      group.items = group.items.map((item, i) => 
        i === itemIdx ? { ...item, text } : item
      );
      groups[groupIdx] = group;
      return { ...prev, groups };
    });
  };

  const updateAlokasiWaktu = (groupIdx: number, value: string) => {
    updateData(prev => {
      const groups = [...prev.groups];
      groups[groupIdx] = { ...groups[groupIdx], alokasiWaktu: parseInt(value) || 0 };
      return { ...prev, groups };
    });
  };

  const toggleSchedule = (groupIdx: number, subNo: string, bulan: number, minggu: number) => {
    updateData(prev => {
      const groups = [...prev.groups];
      const group = { ...groups[groupIdx] };
      const key = `${subNo}:${bulan}-${minggu}`;
      group.schedule = { ...group.schedule, [key]: !group.schedule[key] };
      groups[groupIdx] = group;
      return { ...prev, groups };
    });
  };

  // Calculate totals per week
  const getWeekTotal = (bulan: number, minggu: number): number => {
    let total = 0;
    data.groups.forEach(group => {
      const hasAnyInWeek = group.items.some(item => {
        const key = `${item.subNo}:${bulan}-${minggu}`;
        return group.schedule[key];
      });
      if (hasAnyInWeek) {
        // Distribute alokasi_waktu across marked weeks
        const totalMarkedWeeks = new Set(
          Object.keys(group.schedule)
            .filter(k => group.schedule[k])
            .map(k => k.split(':')[1])
        ).size;
        if (totalMarkedWeeks > 0) {
          total += Math.round(group.alokasiWaktu / totalMarkedWeeks);
        }
      }
    });
    return total;
  };

  const totalAlokasiWaktu = data.groups.reduce((sum, g) => sum + g.alokasiWaktu, 0) + data.cadangan;

  // Calculate sumatif for each group (count of marked weeks * some factor - simplified to 0 as in template)
  const getSumatifValue = (_groupIdx: number): number => 0;

  return (
    <div className="space-y-3">
      <ScrollArea className="w-full">
        <div className="min-w-[1200px]">
          <table className="w-full text-xs border-collapse border border-border">
            {/* Header row 1: Month names */}
            <thead>
              <tr className="bg-primary/10">
                <th className="border border-border p-2 text-left w-10" rowSpan={2}>No</th>
                <th className="border border-border p-2 text-left min-w-[300px]" rowSpan={2} colSpan={2}>Kompetensi Dasar / Tujuan Pembelajaran</th>
                <th className="border border-border p-2 text-center w-16" rowSpan={2}>Alokasi Waktu</th>
                {bulanList.map(b => (
                  <th key={b.bulan} className="border border-border p-1 text-center" colSpan={5}>
                    {b.nama}
                  </th>
                ))}
              </tr>
              {/* Header row 2: Week numbers */}
              <tr className="bg-primary/5">
                {bulanList.map(b => (
                  [1, 2, 3, 4, 5].map(w => (
                    <th key={`${b.bulan}-${w}`} className="border border-border p-1 text-center w-8">
                      {w}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {data.groups.map((group, groupIdx) => (
                <>
                  {/* Sub items */}
                  {group.items.map((item, itemIdx) => (
                    <tr key={`${groupIdx}-${itemIdx}`} className="hover:bg-muted/30">
                      {/* No column - only on first row of group */}
                      {itemIdx === 0 && (
                        <td className="border border-border p-1 text-center align-top font-medium" rowSpan={group.items.length}>
                          {group.no}
                        </td>
                      )}
                      {/* Sub number */}
                      <td className="border border-border p-1 w-10 text-center align-top text-muted-foreground">
                        <div className="flex items-center gap-0.5">
                          <span>{item.subNo}</span>
                          {group.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubItem(groupIdx, itemIdx)}
                              className="text-destructive/50 hover:text-destructive ml-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      {/* TP Text */}
                      <td className="border border-border p-0">
                        <Textarea
                          value={item.text}
                          onChange={(e) => updateSubItemText(groupIdx, itemIdx, e.target.value)}
                          placeholder="Tujuan Pembelajaran..."
                          className="border-0 rounded-none text-xs min-h-[40px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          rows={2}
                        />
                      </td>
                      {/* Alokasi Waktu - only on first row */}
                      {itemIdx === 0 && (
                        <td className="border border-border p-0 text-center align-top" rowSpan={group.items.length}>
                          <Input
                            type="number"
                            value={group.alokasiWaktu || ''}
                            onChange={(e) => updateAlokasiWaktu(groupIdx, e.target.value)}
                            className="border-0 rounded-none text-xs text-center h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </td>
                      )}
                      {/* Week checkboxes */}
                      {bulanList.map(b => (
                        [1, 2, 3, 4, 5].map(w => (
                          <td key={`${b.bulan}-${w}`} className="border border-border p-0 text-center">
                            <div className="flex items-center justify-center h-full py-1">
                              <Checkbox
                                checked={!!group.schedule[`${item.subNo}:${b.bulan}-${w}`]}
                                onCheckedChange={() => toggleSchedule(groupIdx, item.subNo, b.bulan, w)}
                                className="h-3.5 w-3.5"
                              />
                            </div>
                          </td>
                        ))
                      ))}
                    </tr>
                  ))}
                  {/* Add sub-item button row */}
                  <tr className="bg-muted/10">
                    <td className="border border-border p-0" colSpan={2}>
                      <button
                        type="button"
                        onClick={() => addSubItem(groupIdx)}
                        className="text-xs text-primary/60 hover:text-primary px-2 py-0.5 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Sub TP
                      </button>
                    </td>
                    <td className="border border-border p-1 text-center" colSpan={2}>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground font-medium">SUMATIF {group.no}</span>
                        <span>{getSumatifValue(groupIdx)}</span>
                      </div>
                    </td>
                    {bulanList.map(b => (
                      [1, 2, 3, 4, 5].map(w => (
                        <td key={`s-${b.bulan}-${w}`} className="border border-border p-1 bg-muted/20"></td>
                      ))
                    ))}
                  </tr>
                </>
              ))}
              {/* CADANGAN row */}
              <tr className="bg-muted/30">
                <td className="border border-border p-2 font-medium" colSpan={3}>CADANGAN</td>
                <td className="border border-border p-1 text-center">
                  <Input
                    type="number"
                    value={data.cadangan || ''}
                    onChange={(e) => updateData(prev => ({ ...prev, cadangan: parseInt(e.target.value) || 0 }))}
                    className="border-0 rounded-none text-xs text-center h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </td>
                {bulanList.map(b => (
                  [1, 2, 3, 4, 5].map(w => (
                    <td key={`c-${b.bulan}-${w}`} className="border border-border p-1 bg-muted/20"></td>
                  ))
                ))}
              </tr>
              {/* JUMLAH row */}
              <tr className="bg-primary/10 font-bold">
                <td className="border border-border p-2" colSpan={3}>JUMLAH</td>
                <td className="border border-border p-2 text-center">{totalAlokasiWaktu}</td>
                {bulanList.map(b => (
                  [1, 2, 3, 4, 5].map(w => {
                    const weekTotal = getWeekTotal(b.bulan, w);
                    return (
                      <td key={`t-${b.bulan}-${w}`} className="border border-border p-1 text-center">
                        {weekTotal > 0 ? weekTotal : ''}
                      </td>
                    );
                  })
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Tambah Kelompok TP
        </Button>
        {data.groups.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => removeGroup(data.groups.length - 1)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Hapus Kelompok Terakhir
          </Button>
        )}
      </div>

      {/* Keterangan / Legend */}
      <div className="border rounded-lg p-3 bg-muted/20 text-xs space-y-1">
        <p className="font-medium text-muted-foreground">Keterangan:</p>
        <div className="grid grid-cols-2 gap-1 text-muted-foreground">
          <span>✓ = Minggu efektif pembelajaran</span>
          <span>Sumatif = Penilaian akhir per kelompok TP</span>
        </div>
      </div>
    </div>
  );
}

// Convert spreadsheet data back to promes_detail format for saving
export function spreadsheetToDetails(
  data: PromesSpreadsheetData
): Array<{
  bulan: number;
  minggu: number;
  tema: string;
  sub_tema: string;
  tujuan_pembelajaran: string;
  alokasi_waktu: string;
  keterangan: string | null;
}> {
  const details: Array<{
    bulan: number;
    minggu: number;
    tema: string;
    sub_tema: string;
    tujuan_pembelajaran: string;
    alokasi_waktu: string;
    keterangan: string | null;
  }> = [];

  data.groups.forEach(group => {
    group.items.forEach(item => {
      if (!item.text.trim()) return;
      
      // Find all checked weeks for this sub-item
      const checkedWeeks = Object.keys(group.schedule)
        .filter(k => group.schedule[k] && k.startsWith(`${item.subNo}:`))
        .map(k => {
          const [, bm] = k.split(':');
          const [bulan, minggu] = bm.split('-').map(Number);
          return { bulan, minggu };
        });

      if (checkedWeeks.length > 0) {
        checkedWeeks.forEach(({ bulan, minggu }) => {
          details.push({
            bulan,
            minggu,
            tema: String(group.no),
            sub_tema: item.subNo,
            tujuan_pembelajaran: item.text,
            alokasi_waktu: String(group.alokasiWaktu),
            keterangan: null,
          });
        });
      } else {
        // Store TP without schedule (use bulan=0, minggu=0 as placeholder)
        details.push({
          bulan: 0,
          minggu: 0,
          tema: String(group.no),
          sub_tema: item.subNo,
          tujuan_pembelajaran: item.text,
          alokasi_waktu: String(group.alokasiWaktu),
          keterangan: null,
        });
      }
    });
  });

  return details;
}
