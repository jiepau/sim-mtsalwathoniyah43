import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDay, parseISO } from 'date-fns';

interface HariLibur {
  id: string;
  tanggal: string;
  nama_libur: string;
  keterangan: string | null;
}

export function useHariLibur() {
  const [hariLibur, setHariLibur] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHariLibur = async () => {
    const { data } = await supabase
      .from('hari_libur')
      .select('*')
      .order('tanggal');
    if (data) setHariLibur(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHariLibur();
  }, []);

  const liburSet = useMemo(() => {
    return new Set(hariLibur.map(h => h.tanggal));
  }, [hariLibur]);

  const isHoliday = (dateStr: string): { isLibur: boolean; reason: string } => {
    const date = parseISO(dateStr);
    const day = getDay(date); // 0 = Sunday, 6 = Saturday

    if (day === 0) return { isLibur: true, reason: 'Hari Minggu' };
    if (day === 6) return { isLibur: true, reason: 'Hari Sabtu' };

    if (liburSet.has(dateStr)) {
      const libur = hariLibur.find(h => h.tanggal === dateStr);
      return { isLibur: true, reason: libur?.nama_libur || 'Hari Libur Nasional' };
    }

    return { isLibur: false, reason: '' };
  };

  return { hariLibur, loading, isHoliday, refetch: fetchHariLibur };
}
