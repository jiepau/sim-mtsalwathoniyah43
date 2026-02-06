import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ModulAjarData {
  jenjang: string;
  kelas: number;
  semester: string;
  mapel: string;
  topik: string;
  alokasi_waktu: string;
  capaian_pembelajaran?: string;
  tujuan_pembelajaran?: string[];
  model_pembelajaran: string;
  profil_pelajar?: string[];
  nilai_karakter?: string[];
  materi_insersi?: string;
  teknik_asesmen?: string[];
  jenis_asesmen?: string[];
  diferensiasi_konten?: string;
  diferensiasi_proses?: string;
  diferensiasi_produk?: string;
  hasil_rpp: string;
  atp_id?: string;
  ta_id?: string;
  guru_id?: string;
}

export function useModulAjar() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const saveModulAjar = useCallback(async (data: ModulAjarData) => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan');
      return null;
    }

    setIsSaving(true);
    try {
      const { data: result, error } = await supabase
        .from('modul_ajar')
        .insert({
          ...data,
          created_by: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Modul Ajar berhasil disimpan');
      return result;
    } catch (error: any) {
      console.error('Error saving modul ajar:', error);
      toast.error(error.message || 'Gagal menyimpan Modul Ajar');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const fetchModulAjarList = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('modul_ajar')
        .select(`
          id,
          mapel,
          topik,
          kelas,
          semester,
          model_pembelajaran,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching modul ajar list:', error);
      return [];
    }
  }, []);

  const getModulAjarById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('modul_ajar')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching modul ajar:', error);
      return null;
    }
  }, []);

  const updateModulAjar = useCallback(async (id: string, data: Partial<ModulAjarData>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('modul_ajar')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Modul Ajar berhasil diperbarui');
      return true;
    } catch (error: any) {
      console.error('Error updating modul ajar:', error);
      toast.error(error.message || 'Gagal memperbarui Modul Ajar');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteModulAjar = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('modul_ajar')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Modul Ajar berhasil dihapus');
      return true;
    } catch (error: any) {
      console.error('Error deleting modul ajar:', error);
      toast.error(error.message || 'Gagal menghapus Modul Ajar');
      return false;
    }
  }, []);

  return {
    isSaving,
    saveModulAjar,
    fetchModulAjarList,
    getModulAjarById,
    updateModulAjar,
    deleteModulAjar
  };
}
