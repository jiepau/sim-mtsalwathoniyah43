import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { defaultPrefix, type UjianSesi } from '@/hooks/useUjianSesi';
import type { UjianSesi as Sesi } from '@/hooks/useUjianSesi';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Sesi | null;
}

export function SesiFormDialog({ open, onOpenChange, initial }: Props) {
  const qc = useQueryClient();
  const [jenis, setJenis] = useState<'pts' | 'pas' | 'pat' | 'um'>('pas');
  const [nama, setNama] = useState('');
  const [taId, setTaId] = useState<string>('');
  const [semester, setSemester] = useState<'ganjil' | 'genap'>('ganjil');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [prefix, setPrefix] = useState('');
  const [kelasIds, setKelasIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: taList } = useQuery({
    queryKey: ['ta-aktif-list'],
    queryFn: async () => {
      const { data } = await supabase.from('tahun_ajaran')
        .select('id, nama_ta, semester, is_active').order('nama_ta', { ascending: false });
      return data || [];
    },
  });

  const { data: kelasList } = useQuery({
    queryKey: ['kelas-list-ujian'],
    queryFn: async () => {
      const { data } = await supabase.from('kelas')
        .select('id, nama_kelas, tingkat').order('tingkat').order('nama_kelas');
      return data || [];
    },
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setJenis(initial.jenis);
      setNama(initial.nama);
      setTaId(initial.ta_id || '');
      setSemester(initial.semester || 'ganjil');
      setTglMulai(initial.tanggal_mulai || '');
      setTglSelesai(initial.tanggal_selesai || '');
      setPrefix(initial.nomor_peserta_prefix || '');
      setKelasIds(initial.kelas_ids || []);
    } else {
      const active = taList?.find((t: any) => t.is_active);
      setJenis('pas');
      setNama('');
      setTaId(active?.id || '');
      setSemester((active?.semester as any) || 'ganjil');
      setTglMulai('');
      setTglSelesai('');
      setPrefix(defaultPrefix('pas', new Date().getFullYear()));
      setKelasIds([]);
    }
  }, [open, initial, taList]);

  useEffect(() => {
    if (!initial) {
      setPrefix(defaultPrefix(jenis, new Date().getFullYear()));
    }
  }, [jenis, initial]);

  const toggleKelas = (id: string) => {
    setKelasIds((prev) => prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!nama.trim()) { toast.error('Nama sesi wajib diisi'); return; }
    if (kelasIds.length === 0) { toast.error('Pilih minimal 1 kelas peserta'); return; }
    setSaving(true);
    const payload = {
      jenis, nama: nama.trim(),
      ta_id: taId || null,
      semester,
      tanggal_mulai: tglMulai || null,
      tanggal_selesai: tglSelesai || null,
      nomor_peserta_prefix: prefix.trim() || defaultPrefix(jenis, new Date().getFullYear()),
      kelas_ids: kelasIds,
    };
    const { error } = initial
      ? await supabase.from('ujian_sesi').update(payload).eq('id', initial.id)
      : await supabase.from('ujian_sesi').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? 'Sesi diperbarui' : 'Sesi dibuat');
    qc.invalidateQueries({ queryKey: ['ujian-sesi'] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Sesi Ujian' : 'Sesi Ujian Baru'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jenis Ujian</Label>
              <Select value={jenis} onValueChange={(v) => setJenis(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pts">PTS — Tengah Semester</SelectItem>
                  <SelectItem value="pas">PAS — Akhir Semester</SelectItem>
                  <SelectItem value="pat">PAT — Akhir Tahun</SelectItem>
                  <SelectItem value="um">UM — Ujian Madrasah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => setSemester(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganjil">Ganjil</SelectItem>
                  <SelectItem value="genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nama Sesi</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)}
              placeholder="mis. PAS Ganjil 2025/2026" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tahun Ajaran</Label>
              <Select value={taId || 'none'} onValueChange={(v) => setTaId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Pilih TA" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak dipilih —</SelectItem>
                  {taList?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nama_ta} {t.is_active && '(Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prefix Nomor Peserta</Label>
              <Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="mis. PAS25" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Kelas Peserta ({kelasIds.length} terpilih)</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kelasList?.map((k: any) => (
                <label key={k.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={kelasIds.includes(k.id)} onCheckedChange={() => toggleKelas(k.id)} />
                  <span>{k.nama_kelas}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
