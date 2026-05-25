import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UjianSesi {
  id: string;
  jenis: 'pts' | 'pas' | 'pat' | 'um';
  nama: string;
  ta_id: string | null;
  semester: 'ganjil' | 'genap' | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: 'draft' | 'aktif' | 'selesai';
  nomor_peserta_prefix: string | null;
  kelas_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface UjianRuang {
  id: string;
  sesi_id: string;
  nama_ruang: string;
  lokasi: string | null;
  kapasitas: number;
  baris: number;
  kolom: number;
  urutan: number;
}

export interface UjianPeserta {
  id: string;
  sesi_id: string;
  siswa_id: string;
  kelas_asal_id: string | null;
  nomor_peserta: string;
  ruang_id: string | null;
  nomor_kursi: number | null;
  is_manual_override: boolean;
}

export function useUjianSesiList() {
  return useQuery({
    queryKey: ['ujian-sesi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ujian_sesi')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as UjianSesi[];
    },
  });
}

export function useUjianSesi(sesiId: string | null) {
  return useQuery({
    queryKey: ['ujian-sesi', sesiId],
    queryFn: async () => {
      if (!sesiId) return null;
      const { data, error } = await supabase
        .from('ujian_sesi').select('*').eq('id', sesiId).maybeSingle();
      if (error) throw error;
      return data as UjianSesi | null;
    },
    enabled: !!sesiId,
  });
}

export function useUjianRuang(sesiId: string | null) {
  return useQuery({
    queryKey: ['ujian-ruang', sesiId],
    queryFn: async () => {
      if (!sesiId) return [];
      const { data, error } = await supabase
        .from('ujian_ruang').select('*').eq('sesi_id', sesiId).order('urutan');
      if (error) throw error;
      return (data || []) as UjianRuang[];
    },
    enabled: !!sesiId,
  });
}

export function useUjianPeserta(sesiId: string | null) {
  return useQuery({
    queryKey: ['ujian-peserta', sesiId],
    queryFn: async () => {
      if (!sesiId) return [];
      const { data, error } = await supabase
        .from('ujian_peserta').select('*').eq('sesi_id', sesiId)
        .order('nomor_peserta');
      if (error) throw error;
      return (data || []) as UjianPeserta[];
    },
    enabled: !!sesiId,
  });
}
