import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserCog, CheckCircle2, XCircle, Building2, GraduationCap, Briefcase } from 'lucide-react';

interface GtkInfo {
  nama: string;
  nip: string | null;
  nuptk: string | null;
  jabatan: string | null;
  email: string | null;
  pendidikan: string | null;
  mapel: string | null;
  foto_url: string | null;
}

interface MadrasahInfo {
  nama_madrasah: string;
  alamat: string | null;
  npsn: string | null;
}

export default function ValidasiGtk() {
  const { id } = useParams<{ id: string }>();
  const [gtk, setGtk] = useState<GtkInfo | null>(null);
  const [madrasah, setMadrasah] = useState<MadrasahInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const res = await fetch(`${supabaseUrl}/functions/v1/validate-gtk?id=${encodeURIComponent(id)}`, {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
        });
        const result = await res.json();

        if (result.found) {
          setGtk(result.gtk);
          setMadrasah(result.madrasah);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #1a5d3a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a5568' }}>Memvalidasi data GTK...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <XCircle style={{ width: 64, height: 64, color: '#dc2626', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Data Tidak Ditemukan</h1>
          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
            Data GTK dengan ID <strong>{id}</strong> tidak ditemukan dalam sistem.
            Kartu identitas ini mungkin tidak valid atau data telah dihapus.
          </p>
          <div style={{ marginTop: 24, padding: 12, background: '#fee2e2', borderRadius: 8, fontSize: 14, color: '#991b1b' }}>
            Hubungi pihak Madrasah untuk informasi lebih lanjut.
          </div>
        </div>
      </div>
    );
  }

  const nuptkLabel = gtk?.nuptk && /^\d{16}$/.test(gtk.nuptk.trim()) ? 'NUPTK' : 'PegID';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)', fontFamily: 'system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a5d3a', color: '#fff', padding: '8px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600 }}>
            <CheckCircle2 style={{ width: 18, height: 18 }} />
            Data GTK Terverifikasi
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Green header */}
          <div style={{ background: '#1a5d3a', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/logo-alwathoniyah.png"
              alt="Logo"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'}
              </div>
              <div style={{ fontSize: 12, color: '#a7f3d0' }}>
                Kementerian Agama Republik Indonesia
              </div>
            </div>
          </div>

          {/* Profile */}
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 100, height: 120, margin: '0 auto 16px',
              border: '3px solid #1a5d3a', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f5f5f5', overflow: 'hidden',
            }}>
              {gtk?.foto_url ? (
                <img src={gtk.foto_url} alt={gtk?.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCog style={{ width: 40, height: 40, color: '#aaa' }} />
              )}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{gtk?.nama}</h2>
            <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#1a5d3a', padding: '4px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>
              {gtk?.jabatan || 'GTK'}
            </span>
          </div>

          {/* Details */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              {gtk?.nip && (
                <InfoRow icon={<Briefcase style={{ width: 16, height: 16 }} />} label="NIP" value={gtk.nip} mono />
              )}
              {gtk?.nuptk && (
                <InfoRow icon={<Briefcase style={{ width: 16, height: 16 }} />} label={nuptkLabel} value={gtk.nuptk} mono />
              )}
              {gtk?.mapel && (
                <InfoRow icon={<GraduationCap style={{ width: 16, height: 16 }} />} label="Mata Pelajaran" value={gtk.mapel} />
              )}
              {gtk?.pendidikan && (
                <InfoRow icon={<GraduationCap style={{ width: 16, height: 16 }} />} label="Pendidikan" value={gtk.pendidikan} />
              )}
              <InfoRow icon={<Building2 style={{ width: 16, height: 16 }} />} label="Instansi" value={madrasah?.nama_madrasah || 'MTs Al-Wathoniyah 43'} />
              {madrasah?.npsn && (
                <InfoRow icon={<Building2 style={{ width: 16, height: 16 }} />} label="NPSN" value={madrasah.npsn} mono />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          <p>Halaman ini digunakan untuk memvalidasi keabsahan data Guru dan Tenaga Kependidikan (GTK).</p>
          <a href="https://sim.mtsalwathoniyah43.com" style={{ color: '#1a5d3a', fontWeight: 600, textDecoration: 'none' }}>
            sim.mtsalwathoniyah43.com
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ color: '#1a5d3a', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
      </div>
    </div>
  );
}
