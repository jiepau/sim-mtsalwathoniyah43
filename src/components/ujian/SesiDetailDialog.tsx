import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DoorOpen, Users, Printer } from 'lucide-react';
import { useUjianSesi, type UjianSesi } from '@/hooks/useUjianSesi';
import { RuangTab } from './RuangTab';
import { PesertaTab } from './PesertaTab';
import { CetakTab } from './CetakTab';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SesiFormDialog } from './SesiFormDialog';
import { Badge } from '@/components/ui/badge';
import { JENIS_UJIAN_SHORT } from '@/lib/ujian-generator';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sesiId: string | null;
}

export function SesiDetailDialog({ open, onOpenChange, sesiId }: Props) {
  const { data: sesi } = useUjianSesi(sesiId);
  const [editOpen, setEditOpen] = useState(false);

  if (!sesi) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge>{JENIS_UJIAN_SHORT[sesi.jenis]}</Badge>
              {sesi.nama}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="peserta">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="pengaturan"><Settings className="h-4 w-4 mr-1" />Pengaturan</TabsTrigger>
              <TabsTrigger value="ruang"><DoorOpen className="h-4 w-4 mr-1" />Ruang</TabsTrigger>
              <TabsTrigger value="peserta"><Users className="h-4 w-4 mr-1" />Peserta</TabsTrigger>
              <TabsTrigger value="cetak"><Printer className="h-4 w-4 mr-1" />Cetak</TabsTrigger>
            </TabsList>

            <TabsContent value="pengaturan" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Jenis:</span> <b>{JENIS_UJIAN_SHORT[sesi.jenis]}</b></div>
                <div><span className="text-muted-foreground">Semester:</span> <b className="capitalize">{sesi.semester}</b></div>
                <div><span className="text-muted-foreground">Mulai:</span> <b>{sesi.tanggal_mulai || '-'}</b></div>
                <div><span className="text-muted-foreground">Selesai:</span> <b>{sesi.tanggal_selesai || '-'}</b></div>
                <div><span className="text-muted-foreground">Prefix Nomor:</span> <b className="font-mono">{sesi.nomor_peserta_prefix}</b></div>
                <div><span className="text-muted-foreground">Jumlah Kelas:</span> <b>{sesi.kelas_ids.length}</b></div>
              </div>
              <Button onClick={() => setEditOpen(true)} size="sm">Edit Pengaturan Sesi</Button>
            </TabsContent>

            <TabsContent value="ruang" className="pt-4"><RuangTab sesi={sesi} /></TabsContent>
            <TabsContent value="peserta" className="pt-4"><PesertaTab sesi={sesi} /></TabsContent>
            <TabsContent value="cetak" className="pt-4"><CetakTab sesi={sesi} /></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SesiFormDialog open={editOpen} onOpenChange={setEditOpen} initial={sesi} />
    </>
  );
}
