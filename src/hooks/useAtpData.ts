import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type ATP = Tables<'atp'>;

interface AtpWithRelations extends ATP {
  tahun_ajaran?: { nama_ta: string } | null;
}

export function useAtpData() {
  const [atpList, setAtpList] = useState<AtpWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapelOptions, setMapelOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchAtpData();
  }, []);

  const fetchAtpData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('atp')
        .select(`
          *,
          tahun_ajaran:ta_id (nama_ta)
        `)
        .order('mapel', { ascending: true });

      if (error) throw error;

      setAtpList(data || []);

      // Extract unique mapel options
      const uniqueMapel = [...new Set((data || []).map(atp => atp.mapel))];
      setMapelOptions(uniqueMapel);
    } catch (error) {
      console.error('Error fetching ATP data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAtpByMapelAndFase = (mapel: string, fase?: string) => {
    return atpList.filter(atp => {
      const mapelMatch = atp.mapel.toLowerCase() === mapel.toLowerCase();
      if (fase) {
        return mapelMatch && atp.fase === fase;
      }
      return mapelMatch;
    });
  };

  const getAtpById = (id: string) => {
    return atpList.find(atp => atp.id === id);
  };

  return {
    atpList,
    isLoading,
    mapelOptions,
    getAtpByMapelAndFase,
    getAtpById,
    refetch: fetchAtpData
  };
}
