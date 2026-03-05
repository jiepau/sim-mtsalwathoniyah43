import { UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  } | null;
}

export function GtkKtaCard({ gtk, madrasah }: GtkKtaCardProps) {
  const namaMadrasah = madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43';

  const getFotoUrl = () => {
    if (!gtk.foto_path) return null;
    const { data } = supabase.storage.from('gtk-photos').getPublicUrl(gtk.foto_path);
    return data?.publicUrl || null;
  };

  const fotoUrl = getFotoUrl();

  return (
    <div className="kta-card" style={{
      width: '85.6mm',
      height: '53.98mm',
      border: '1.5px solid #1a5d3a',
      borderRadius: '8px',
      padding: '4mm',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      background: 'white',
      color: '#1a1a1a',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
    }}>
      {/* Decorative top bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3mm',
        background: 'linear-gradient(90deg, #1a5d3a, #2d8a5e)',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2mm',
        marginTop: '2mm',
        marginBottom: '1.5mm',
        borderBottom: '0.5px solid #e0e0e0',
        paddingBottom: '1.5mm',
      }}>
        <img 
          src="/logo-alwathoniyah.png" 
          alt="Logo" 
          style={{ width: '8mm', height: '8mm', objectFit: 'contain' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '7pt', fontWeight: 700, lineHeight: 1.2, color: '#1a5d3a' }}>
            {namaMadrasah}
          </div>
          <div style={{ fontSize: '6pt', fontWeight: 600, color: '#2d8a5e', letterSpacing: '0.5px' }}>
            KARTU TANDA ANGGOTA
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: 'flex',
        gap: '3mm',
        alignItems: 'flex-start',
      }}>
        {/* Photo */}
        <div style={{
          width: '18mm',
          height: '24mm',
          border: '1px solid #ccc',
          borderRadius: '3px',
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

        {/* Info */}
        <div style={{ flex: 1, fontSize: '6.5pt', lineHeight: 1.6 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Nama</td>
                <td style={{ paddingRight: '1mm', verticalAlign: 'top' }}>:</td>
                <td style={{ fontWeight: 700 }}>{gtk.nama}</td>
              </tr>
              {gtk.nip && (
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap' }}>NIP</td>
                  <td style={{ paddingRight: '1mm' }}>:</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '6pt' }}>{gtk.nip}</td>
                </tr>
              )}
              {gtk.nuptk && (
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap' }}>NUPTK</td>
                  <td style={{ paddingRight: '1mm' }}>:</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '6pt' }}>{gtk.nuptk}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: 600, paddingRight: '1mm', whiteSpace: 'nowrap' }}>Jabatan</td>
                <td style={{ paddingRight: '1mm' }}>:</td>
                <td>{gtk.jabatan || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '2mm',
        left: '4mm',
        right: '4mm',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        fontSize: '5pt',
        color: '#888',
      }}>
        {madrasah?.npsn && <span>NPSN: {madrasah.npsn}</span>}
        {madrasah?.nsm && <span>NSM: {madrasah.nsm}</span>}
      </div>
    </div>
  );
}
