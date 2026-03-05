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

// Ukuran standar KTP/ID-1 (ISO/IEC 7810): 85.60mm x 53.98mm
const CARD_W = '85.6mm';
const CARD_H = '53.98mm';
const TOTAL_W = '171.2mm'; // 2 kartu side-by-side

export function GtkKtaCard({ gtk, madrasah }: GtkKtaCardProps) {
  const namaMadrasah = (madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43').toUpperCase();

  const getFotoUrl = () => {
    if (!gtk.foto_path) return null;
    const { data } = supabase.storage.from('gtk-photos').getPublicUrl(gtk.foto_path);
    return data?.publicUrl || null;
  };

  const fotoUrl = getFotoUrl();

  const getNuptkLabel = () => {
    if (!gtk.nuptk) return null;
    if (/^\d{16}$/.test(gtk.nuptk.trim())) return 'NUPTK';
    return 'PegID';
  };
  const nuptkLabel = getNuptkLabel();

  const qrData = `https://sim.mtsalwathoniyah43.com/gtk/${gtk.nuptk || gtk.nip || ''}`;

  // Shared styles
  const headerHeight = '11mm';
  const footerHeight = '7mm';
  const headerPadding = '2mm 3mm';
  const footerPadding = '1.5mm 3mm';

  return (
    <div style={{
      display: 'flex',
      width: TOTAL_W,
      height: CARD_H,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
      background: 'white',
      border: '0.5px dashed #bbb',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
    } as React.CSSProperties}>
      {/* === SISI BELAKANG (KIRI) === */}
      <div style={{
        width: CARD_W,
        height: CARD_H,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRight: '0.5px dashed #aaa',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header belakang */}
        <div style={{
          background: '#4a5568',
          padding: headerPadding,
          height: headerHeight,
          minHeight: headerHeight,
          display: 'flex',
          alignItems: 'center',
          gap: '2mm',
          flexShrink: 0,
        }}>
          <img
            src="/logo-alwathoniyah.png"
            alt="Logo"
            style={{ width: '7mm', height: '7mm', objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '6pt', fontWeight: 700, color: '#fff', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              KARTU IDENTITAS GTK
            </div>
            <div style={{ fontSize: '5pt', color: '#e2e8f0', lineHeight: 1.2, marginTop: '0.5mm' }}>
              {namaMadrasah}
            </div>
          </div>
        </div>

        {/* Konten belakang */}
        <div style={{
          flex: 1,
          padding: '2mm 3mm',
          fontSize: '5pt',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', gap: '2.5mm' }}>
            {/* QR Code */}
            <div style={{
              width: '16mm',
              height: '16mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              flexShrink: 0,
              border: '0.5px solid #e2e8f0',
              borderRadius: '1px',
            }}>
              <QRCodeSVG value={qrData} size={56} level="M" />
            </div>

            {/* Info */}
            <div style={{ flex: 1, fontSize: '4.5pt', lineHeight: 1.5 }}>
              <div style={{ marginBottom: '0.8mm' }}>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '0.8mm', fontSize: '5pt' }}>●</span>
                Kartu Identitas GTK ini diterbitkan oleh Madrasah.
              </div>
              <div style={{ marginBottom: '0.8mm' }}>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '0.8mm', fontSize: '5pt' }}>●</span>
                Scan QR Code untuk memvalidasi keabsahan data GTK.
              </div>
              <div>
                <span style={{ color: '#1a5d3a', fontWeight: 700, marginRight: '0.8mm', fontSize: '5pt' }}>●</span>
                Info lebih lanjut hubungi pihak Madrasah.
              </div>
            </div>
          </div>

          <div style={{
            padding: '0.8mm 1.5mm',
            background: '#f7fafc',
            border: '0.5px solid #e2e8f0',
            borderRadius: '1px',
            fontSize: '4pt',
            color: '#666',
            textAlign: 'center',
            lineHeight: 1.4,
            marginTop: '1mm',
          }}>
            Pemalsuan maupun penyalahgunaan Kartu Identitas GTK ini merupakan tindak pidana.
          </div>
        </div>

        {/* Footer belakang */}
        <div style={{
          background: '#1a5d3a',
          padding: footerPadding,
          height: footerHeight,
          minHeight: footerHeight,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
            https://sim.mtsalwathoniyah43.com
          </div>
        </div>
      </div>

      {/* === SISI DEPAN (KANAN) === */}
      <div style={{
        width: CARD_W,
        height: CARD_H,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header depan */}
        <div style={{
          background: '#1a5d3a',
          padding: headerPadding,
          height: headerHeight,
          minHeight: headerHeight,
          display: 'flex',
          alignItems: 'center',
          gap: '2mm',
          flexShrink: 0,
        }}>
          <img
            src="/logo-alwathoniyah.png"
            alt="Logo"
            style={{ width: '7mm', height: '7mm', objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: '#fff', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              {namaMadrasah}
            </div>
            <div style={{ fontSize: '5pt', color: '#a7f3d0', lineHeight: 1.2, marginTop: '0.5mm' }}>
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </div>
          </div>
        </div>

        {/* Konten depan */}
        <div style={{
          flex: 1,
          display: 'flex',
          padding: '2mm 3mm',
          gap: '2.5mm',
          alignItems: 'flex-start',
          overflow: 'hidden',
        }}>
          {/* Foto */}
          <div style={{
            width: '18mm',
            height: '24mm',
            border: '1.5px solid #c53030',
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
              <UserCog style={{ width: '8mm', height: '8mm', color: '#aaa' }} />
            )}
          </div>

          {/* Data */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '7pt',
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: '1mm',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}>
              {gtk.nama}
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '5pt', lineHeight: 1.4 }}>
              <tbody>
                {gtk.nip && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '0.8mm', whiteSpace: 'nowrap', color: '#4a5568', verticalAlign: 'top' }}>NIP</td>
                    <td style={{ paddingRight: '0.8mm', color: '#4a5568', verticalAlign: 'top' }}>:</td>
                    <td style={{ fontWeight: 700, fontFamily: "'Courier New', monospace", fontSize: '5pt' }}>{gtk.nip}</td>
                  </tr>
                )}
                {gtk.nuptk && nuptkLabel && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: '0.8mm', whiteSpace: 'nowrap', color: '#4a5568', verticalAlign: 'top' }}>{nuptkLabel}</td>
                    <td style={{ paddingRight: '0.8mm', color: '#4a5568', verticalAlign: 'top' }}>:</td>
                    <td style={{ fontWeight: 700, fontFamily: "'Courier New', monospace", fontSize: '5pt' }}>{gtk.nuptk}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '0.8mm', whiteSpace: 'nowrap', color: '#4a5568', verticalAlign: 'top' }}>Fungsi</td>
                  <td style={{ paddingRight: '0.8mm', color: '#4a5568', verticalAlign: 'top' }}>:</td>
                  <td style={{ fontWeight: 700, fontSize: '5pt', wordBreak: 'break-word' }}>{gtk.jabatan || '-'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '0.8mm', whiteSpace: 'nowrap', color: '#4a5568', verticalAlign: 'top' }}>Instansi</td>
                  <td style={{ paddingRight: '0.8mm', color: '#4a5568', verticalAlign: 'top' }}>:</td>
                  <td style={{ fontWeight: 700, fontSize: '4.5pt', wordBreak: 'break-word' }}>{namaMadrasah}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer depan */}
        <div style={{
          background: '#1a5d3a',
          padding: footerPadding,
          height: footerHeight,
          minHeight: footerHeight,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
            KARTU IDENTITAS GTK
          </div>
        </div>
      </div>
    </div>
  );
}