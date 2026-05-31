import { Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DaftarGajiTab } from '@/components/gaji/DaftarGajiTab';
import { MasterGajiTab } from '@/components/gaji/MasterGajiTab';
import { PengaturanGajiTab } from '@/components/gaji/PengaturanGajiTab';
import { RekapGajiTab } from '@/components/gaji/RekapGajiTab';

export default function GajiGuru() {
  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        title="Gaji Guru & Tendik"
        description="Kelola penggajian bulanan, kehadiran auto dari Absensi GTK, cetak slip"
        icon={<Wallet className="h-6 w-6" />}
      />
      <Tabs defaultValue="daftar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daftar">Daftar Gaji</TabsTrigger>
          <TabsTrigger value="master">Master Komponen</TabsTrigger>
          <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
          <TabsTrigger value="rekap">Rekap Tahunan</TabsTrigger>
        </TabsList>
        <TabsContent value="daftar"><DaftarGajiTab /></TabsContent>
        <TabsContent value="master"><MasterGajiTab /></TabsContent>
        <TabsContent value="pengaturan"><PengaturanGajiTab /></TabsContent>
        <TabsContent value="rekap"><RekapGajiTab /></TabsContent>
      </Tabs>
    </div>
  );
}
