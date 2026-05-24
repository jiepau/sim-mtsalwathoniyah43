import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNsm() {
  return useQuery({
    queryKey: ['madrasah-nsm'],
    queryFn: async () => {
      const { data } = await supabase
        .from('madrasah_settings')
        .select('nsm')
        .limit(1)
        .maybeSingle();
      return (data?.nsm || '').trim();
    },
    staleTime: 1000 * 60 * 60, // 1 jam
    refetchOnWindowFocus: false,
  });
}
