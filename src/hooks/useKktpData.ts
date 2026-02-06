import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type KKTP = Tables<'kktp'>;

interface KktpWithAtp extends KKTP {
  atp?: {
    id: string;
    mapel: string;
    kelas: number | null;
    semester: string | null;
    tujuan_pembelajaran: string[] | null;
  } | null;
}

export function useKktpData() {
  const [kktpList, setKktpList] = useState<KktpWithAtp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKktpData();
  }, []);

  const fetchKktpData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kktp')
        .select(`
          *,
          atp:atp_id (
            id,
            mapel,
            kelas,
            semester,
            tujuan_pembelajaran
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKktpList(data || []);
    } catch (error) {
      console.error('Error fetching KKTP data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getKktpByAtpId = (atpId: string) => {
    return kktpList.filter(kktp => kktp.atp_id === atpId);
  };

  const formatKriteriaForPrompt = (kktpItems: KktpWithAtp[]): string => {
    if (kktpItems.length === 0) return '';
    
    return kktpItems.map((kktp, index) => {
      const kriteria = kktp.kriteria_ketercapaian?.join('; ') || '-';
      return `${index + 1}. TP: ${kktp.tujuan_pembelajaran}\n   Kriteria: ${kriteria}\n   Teknik: ${kktp.teknik_penilaian || '-'}\n   Instrumen: ${kktp.bentuk_instrumen || '-'}`;
    }).join('\n\n');
  };

  return {
    kktpList,
    isLoading,
    getKktpByAtpId,
    formatKriteriaForPrompt,
    refetch: fetchKktpData
  };
}
