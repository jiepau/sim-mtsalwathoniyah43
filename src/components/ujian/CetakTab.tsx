import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IdCard, ClipboardList, LayoutGrid, ClipboardCheck } from 'lucide-react';
import type { UjianSesi } from '@/hooks/useUjianSesi';
import { CetakKartuPesertaDialog } from './CetakKartuPesertaDialog';
import { CetakDaftarRuangDialog } from './CetakDaftarRuangDialog';
import { CetakDenahRuangDialog } from './CetakDenahRuangDialog';
import { CetakDaftarHadirRuangDialog } from './CetakDaftarHadirRuangDialog';

interface Props { sesi: UjianSesi; }

export function CetakTab({ sesi }: Props) {
  const [kartuOpen, setKartuOpen] = useState(false);
  const [daftarOpen, setDaftarOpen] = useState(false);
  const [denahOpen, setDenahOpen] = useState(false);
  const [hadirOpen, setHadirOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setKartuOpen(true)}
          className="border-2 rounded-lg p-4 text-left hover:border-primary hover:bg-primary/5 transition">
          <IdCard className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-semibold">Kartu Peserta</h4>
          <p className="text-xs text-muted-foreground mt-1">
            4 kartu per halaman A4. Berisi nama, NIS, no peserta, ruang, dan TTD kepala.
          </p>
        </button>
        <button onClick={() => setDaftarOpen(true)}
          className="border-2 rounded-lg p-4 text-left hover:border-primary hover:bg-primary/5 transition">
          <ClipboardList className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-semibold">Daftar Peserta per Ruang</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Tabel peserta per ruang + kolom tanda tangan. Untuk tempel pintu / absensi.
          </p>
        </button>
        <button onClick={() => setDenahOpen(true)}
          className="border-2 rounded-lg p-4 text-left hover:border-primary hover:bg-primary/5 transition">
          <LayoutGrid className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-semibold">Denah Tempat Duduk</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Layout grid baris × kolom dengan nama & nomor peserta di tiap kursi.
          </p>
        </button>
        <button onClick={() => setHadirOpen(true)}
          className="border-2 rounded-lg p-4 text-left hover:border-primary hover:bg-primary/5 transition">
          <ClipboardCheck className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-semibold">Daftar Hadir per Ruang</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Format absen seperti lampiran: kolom tanggal dan sesi, 1 ruang per halaman.
          </p>
        </button>
      </div>

      <CetakKartuPesertaDialog open={kartuOpen} onOpenChange={setKartuOpen} sesi={sesi} />
      <CetakDaftarRuangDialog open={daftarOpen} onOpenChange={setDaftarOpen} sesi={sesi} />
      <CetakDenahRuangDialog open={denahOpen} onOpenChange={setDenahOpen} sesi={sesi} />
      <CetakDaftarHadirRuangDialog open={hadirOpen} onOpenChange={setHadirOpen} sesi={sesi} />
    </>
  );
}

export function useCetakTab() { return null; }
