import { format } from 'date-fns';
import { UserCog, Calendar, MapPin, Phone, Mail, Briefcase, GraduationCap, CreditCard, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GtkPtk {
  id: string;
  nip: string | null;
  nama: string;
  jabatan: string | null;
  no_hp: string | null;
  alamat: string | null;
  nuptk: string | null;
  nik: string | null;
  lulusan: string | null;
  email: string | null;
  mapel: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
}

interface GtkDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gtk: GtkPtk | null;
}

export function GtkDetailDialog({ open, onOpenChange, gtk }: GtkDetailDialogProps) {
  if (!gtk) return null;

  const formatTTL = () => {
    if (!gtk.tempat_lahir && !gtk.tanggal_lahir) return '-';
    const tempat = gtk.tempat_lahir || '';
    const tanggal = gtk.tanggal_lahir ? format(new Date(gtk.tanggal_lahir), 'dd MMMM yyyy') : '';
    if (tempat && tanggal) return `${tempat}, ${tanggal}`;
    return tempat || tanggal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Detail GTK/PTK
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{gtk.nama}</h3>
            {gtk.jabatan && (
              <Badge variant="outline" className="mt-2">{gtk.jabatan}</Badge>
            )}
            {gtk.jenis_kelamin && (
              <Badge variant={gtk.jenis_kelamin === 'Laki-laki' ? 'default' : 'secondary'} className="mt-2 ml-2">
                {gtk.jenis_kelamin}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Detail Grid */}
          <div className="grid gap-4">
            {/* Identitas */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Identitas</p>
                {gtk.nuptk && <p className="font-medium">NUPTK: {gtk.nuptk}</p>}
                {gtk.nip && <p className="font-medium">NIP: {gtk.nip}</p>}
                {gtk.nik && <p className="font-medium">NIK: {gtk.nik}</p>}
                {!gtk.nuptk && !gtk.nip && !gtk.nik && <p className="font-medium">-</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Tempat, Tanggal Lahir</p>
                <p className="font-medium">{formatTTL()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Pendidikan Terakhir</p>
                <p className="font-medium">{gtk.lulusan || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Mata Pelajaran Diampu</p>
                <p className="font-medium">{gtk.mapel || '-'}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">No. HP</p>
                {gtk.no_hp ? (
                  <a 
                    href={`tel:${gtk.no_hp}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {gtk.no_hp}
                  </a>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                {gtk.email ? (
                  <a 
                    href={`mailto:${gtk.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {gtk.email}
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
                <p className="font-medium">{gtk.alamat || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
