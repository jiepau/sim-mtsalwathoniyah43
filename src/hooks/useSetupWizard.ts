import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SetupStatus {
  hasTahunAjaran: boolean;
  hasKelas: boolean;
  hasSiswa: boolean;
  hasJenisTagihan: boolean;
  isComplete: boolean;
  loading: boolean;
}

export function useSetupWizard() {
  const [status, setStatus] = useState<SetupStatus>({
    hasTahunAjaran: false,
    hasKelas: false,
    hasSiswa: false,
    hasJenisTagihan: false,
    isComplete: false,
    loading: true,
  });

  const checkStatus = async () => {
    try {
      const [taRes, kelasRes, siswaRes, tagihanRes] = await Promise.all([
        supabase.from('tahun_ajaran').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true }),
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('jenis_tagihan').select('id', { count: 'exact', head: true }),
      ]);

      const hasTahunAjaran = (taRes.count || 0) > 0;
      const hasKelas = (kelasRes.count || 0) > 0;
      const hasSiswa = (siswaRes.count || 0) > 0;
      const hasJenisTagihan = (tagihanRes.count || 0) > 0;

      setStatus({
        hasTahunAjaran,
        hasKelas,
        hasSiswa,
        hasJenisTagihan,
        isComplete: hasTahunAjaran && hasKelas && hasSiswa && hasJenisTagihan,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking setup status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { ...status, refetch: checkStatus };
}
