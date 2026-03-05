import { UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

interface GtkKtaCardProps {
  gtk: {
    nama: string;
    nip: string | null;
    nuptk: string | null;
    jabatan: string | null;
    foto_path?: string | null;
  };
  madrasah: {
    nama_madrasah: string;
    alamat: string | null;
    npsn: string | null;
    nsm: string | null;
    kabupaten_kota: string | null;
    provinsi: string | null;
  } | null;
  tahunAjaran?: string | null;
  semester?: string | null;
}

export function GtkKtaCard({ gtk, madrasah, tahunAjaran, semester }: GtkKtaCardProps) {
  const namaMadrasah = (madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43').toUpperCase();

  const getFotoUrl = () => {
    if (!gtk.foto_path) return null;
    const { data } = supabase.storage.from('gtk-photos').getPublicUrl(gtk.foto_path);
    return data?.publicUrl || null;
  };

  const fotoUrl = getFotoUrl();
  const berlaku = semester && tahunAjaran ? `${semester} - Th. Ajaran ${tahunAjaran}` : null;

  return (
    <div style={{
      display: 'flex',
      width: '171.2mm',
      height: '53.98mm',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
      background: 'white',
      border: '1px dashed #ccc',
    }}>
      {/* === SISI BELAKANG (KIRI) === */}
      <div style={{
        width: '85.6mm',
        height: '53.98mm',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRight: '1px dashed #aaa',
      }}>
        {/* Header belakang - hijau tua */}
        <div style={{
          background: '#4a5568',
          padding: '3mm 4mm',
          display: 'flex',
          alignItems: 'center',
          gap: '2mm',
        }}>
          <img
            src="/logo-alwathoniyah.png"
            alt="Logo"
            style={{ width: '7mm', height: '7mm', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
              KARTU IDENTITAS GTK
            </div>
            <div style={{ fontSize: '5.5pt', color: '#e2e8f0' }}>
              {namaMadrasah}
            </div>
          </div>
        </div>

        {/* Konten belakang */}
        <div style={{ padding: '2.5mm 4mm', fontSize: '5.5pt', color: '#333', lineHeight: 1.7 }}>
          <div style={{ display: 'flex', gap: '3mm' }}>
            {/* QR Placeholder */}
            <div style={{
              width: '18mm',
              height: '18mm',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7fafc',
              flexShrink: 0,
              fontSize: '5pt',
              color: '#999',
            }}>
              QR CODE
            </div>

            {/* Info */}
            <div style={{ flex: 1, fontSize: '5pt', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '1mm' }}>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '1mm' }}>●</span>
                Kartu Identitas Guru dan Tenaga Kependidikan (GTK) ini diterbitkan oleh Madrasah.
              </div>
              <div style={{ marginBottom: '1mm' }}>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '1mm' }}>●</span>
                Masa berlaku kartu adalah 1 (satu) Semester.
              </div>
              <div>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '1mm' }}>●</span>
                Info lebih lanjut hubungi pihak Madrasah.
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5mm',
            padding: '1mm 2mm',
            background: '#f7fafc',
            border: '0.5px solid #e2e8f0',
            borderRadius: '2px',
            fontSize: '4.5pt',
            color: '#666',
            textAlign: 'center',
          }}>
            Pemalsuan maupun penyalahgunaan Kartu Identitas GTK ini merupakan tindak pidana.
          </div>
        </div>

        {/* Footer belakang */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a5d3a',
          padding: '1.5mm 4mm',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, color: '#fff' }}>
            {madrasah?.alamat || ''}
          </div>
        </div>
      </div>

      {/* === SISI DEPAN (KANAN) === */}
      <div style={{
        width: '85.6mm',
        height: '53.98mm',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Header depan - hijau */}
        <div style={{
          background: '#1a5d3a',
          padding: '3mm 4mm',
          display: 'flex',
          alignItems: 'center',
          gap: '2mm',
        }}>
          <img
            src="/logo-alwathoniyah.png"
            alt="Logo"
            style={{ width: '7mm', height: '7mm', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: '7pt', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
              {namaMadrasah}
            </div>
            <div style={{ fontSize: '5.5pt', color: '#a7f3d0' }}>
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </div>
          </div>
        </div>

        {/* Konten depan */}
        <div style={{
          display: 'flex',
          padding: '2mm 4mm',
          gap: '3mm',
          alignItems: 'flex-start',
        }}>
          {/* Foto */}
          <div style={{
            width: '20mm',
            height: '26mm',
            border: '2px solid #c53030',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {fotoUrl ? (
              <img src={fotoUrl} alt={gtk.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserCog style={{ width: '10mm', height: '10mm', color: '#aaa' }} />
            )}
          </div>

          {/* Data */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#1a202c', marginBottom: '1.5mm' }}>
              {gtk.nama}
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '5.5pt', lineHeight: 1.5 }}>
              <tbody>
                {gtk.nip && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>NIP</td>
                    <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '5.5pt' }}>{gtk.nip}</td>
                  </tr>
                )}
                {gtk.nuptk && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>PegID</td>
                    <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '5.5pt' }}>{gtk.nuptk}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>Fungsi</td>
                  <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                  <td style={{ fontWeight: 700 }}>{gtk.jabatan || '-'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>Instansi</td>
                  <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                  <td style={{ fontWeight: 700, fontSize: '5pt' }}>{namaMadrasah}</td>
                </tr>
                {madrasah?.kabupaten_kota && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>Kota/Kab</td>
                    <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                    <td>{madrasah.kabupaten_kota}</td>
                  </tr>
                )}
                {madrasah?.provinsi && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', color: '#4a5568' }}>Provinsi</td>
                    <td style={{ paddingRight: '1mm', color: '#4a5568' }}>:</td>
                    <td>{madrasah.provinsi}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {berlaku && (
              <div style={{ marginTop: '1mm', fontSize: '5pt', color: '#4a5568' }}>
                <span style={{ fontWeight: 600 }}>Berlaku:</span>{' '}
                <span style={{ fontWeight: 700 }}>{berlaku}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer depan */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a5d3a',
          padding: '1.5mm 4mm',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '6pt', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
            KARTU IDENTITAS GTK
          </div>
        </div>
      </div>
    </div>
  );
}
