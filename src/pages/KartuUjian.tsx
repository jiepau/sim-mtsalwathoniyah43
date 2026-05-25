import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useUjianSesiList } from '@/hooks/useUjianSesi';
import { SesiFormDialog } from '@/components/ujian/SesiFormDialog';
import { SesiDetailDialog } from '@/components/ujian/SesiDetailDialog';
import { JENIS_UJIAN_SHORT, JENIS_UJIAN_LABEL } from '@/lib/ujian-generator';

export default function KartuUjian() {
  const qc = useQueryClient();
  const { data: sesiList = [], isLoading } = useUjianSesiList();
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus sesi "${nama}"? Semua ruang & peserta akan ikut terhapus.`)) return;
    const { error } = await supabase.from('ujian_sesi').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Sesi dihapus'); qc.invalidateQueries({ queryKey: ['ujian-sesi'] }); }
  };

  return (
    <div>
      <PageHeader
        title="Kartu Ujian"
        description="Kelola sesi PTS / PAS / PAT / UM — nomor peserta, ruang, dan denah tempat duduk."
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Sesi Baru
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : sesiList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Belum ada sesi ujian.</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Buat Sesi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sesiList.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:border-primary transition"
              onClick={() => setDetailId(s.id)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge>{JENIS_UJIAN_SHORT[s.jenis]}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.nama); }}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-semibold leading-tight">{s.nama}</h3>
                <p className="text-xs text-muted-foreground">{JENIS_UJIAN_LABEL[s.jenis]}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {s.tanggal_mulai || '—'}
                  {s.tanggal_selesai && s.tanggal_selesai !== s.tanggal_mulai && ` s.d. ${s.tanggal_selesai}`}
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="secondary">{s.kelas_ids.length} kelas</Badge>
                  <Badge variant="outline" className="capitalize">{s.semester || '-'}</Badge>
                  <Badge variant="outline" className="font-mono">{s.nomor_peserta_prefix}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SesiFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <SesiDetailDialog open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)} sesiId={detailId} />
    </div>
  );
}
