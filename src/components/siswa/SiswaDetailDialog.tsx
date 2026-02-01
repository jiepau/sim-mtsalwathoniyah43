import { format } from 'date-fns';
import { User, Calendar, MapPin, Phone, School, GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string | null;
  ta_id: string | null;
  wa_ortu: string | null;
  alamat: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  kelas?: { nama_kelas: string };
  tahun_ajaran?: { nama_ta: string; semester?: string };
}

interface SiswaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswa: Siswa | null;
}

export function SiswaDetailDialog({ open, onOpenChange, siswa }: SiswaDetailDialogProps) {
  if (!siswa) return null;

  const formatTahunAjaran = () => {
    if (!siswa.tahun_ajaran) return '-';
    const semester = siswa.tahun_ajaran.semester;
    const semesterLabel = semester === 'genap' ? 'Genap' : semester === 'ganjil' ? 'Ganjil' : '';
    return semesterLabel ? `${siswa.tahun_ajaran.nama_ta} ${semesterLabel}` : siswa.tahun_ajaran.nama_ta;
  };

  const formatTTL = () => {
    if (!siswa.tempat_lahir && !siswa.tanggal_lahir) return '-';
    const tempat = siswa.tempat_lahir || '';
    const tanggal = siswa.tanggal_lahir ? format(new Date(siswa.tanggal_lahir), 'dd MMMM yyyy') : '';
    if (tempat && tanggal) return `${tempat}, ${tanggal}`;
    return tempat || tanggal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detail Siswa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{siswa.nama}</h3>
            <p className="text-muted-foreground font-mono">{siswa.nis}</p>
            {siswa.jenis_kelamin && (
              <Badge variant={siswa.jenis_kelamin === 'Laki-laki' ? 'default' : 'secondary'} className="mt-2">
                {siswa.jenis_kelamin}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Detail Grid */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Tempat, Tanggal Lahir</p>
                <p className="font-medium">{formatTTL()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <School className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Kelas</p>
                <p className="font-medium">{siswa.kelas?.nama_kelas || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                <p className="font-medium">{formatTahunAjaran()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">WA Orang Tua</p>
                {siswa.wa_ortu ? (
                  <a 
                    href={`https://wa.me/${siswa.wa_ortu.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-600 hover:underline"
                  >
                    {siswa.wa_ortu}
                  </a>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{siswa.alamat || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
