import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import kartuFrontBg from '@/assets/kartu-pelajar-front-bg.png';
import kartuBackBg from '@/assets/kartu-pelajar-back-bg.png';

interface Siswa {
  id: string;
  nis: string;
  nisn?: string | null;
  nama: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  foto_path?: string | null;
  kelas?: { nama_kelas: string };
}

interface Props {
  siswaList: Siswa[];
  onClose: () => void;
}

export function KartuPelajarPrint({ siswaList, onClose }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [ready]);

  const getPhotoUrl = (foto_path: string | null | undefined): string | null => {
    if (!foto_path) return null;
    const { data } = supabase.storage.from('siswa-photos').getPublicUrl(foto_path);
    return data?.publicUrl || null;
  };

  const formatTTL = (siswa: Siswa): string => {
    if (!siswa.tempat_lahir && !siswa.tanggal_lahir) return '-';
    const tempat = siswa.tempat_lahir || '';
    let tanggal = '';
    if (siswa.tanggal_lahir) {
      const d = new Date(siswa.tanggal_lahir);
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      tanggal = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (tempat && tanggal) return `${tempat}, ${tanggal}`;
    return tempat || tanggal;
  };

  // Screen size: 428x270px (KTP ratio)
  const W = 428;
  const H = 270;

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .kartu-print-area, .kartu-print-area * { visibility: visible !important; }
          .kartu-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
          }
          @page { size: A4 portrait; margin: 8mm; }
          .no-print { display: none !important; }
          .kartu-card-wrapper {
            width: 85.6mm !important;
            height: 53.98mm !important;
          }
          .kartu-card-wrapper img.kartu-bg {
            width: 85.6mm !important;
            height: 53.98mm !important;
          }
        }
        @media screen {
          .kartu-print-area {
            background: #1a1a2e;
            min-height: 100vh;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={onClose}
          style={{
            background: '#ef4444', color: '#fff', padding: '8px 20px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          ✕ Tutup Preview
        </button>
      </div>

      <div className="kartu-print-area">
        {siswaList.map((siswa) => (
          <div key={siswa.id} style={{ display: 'flex', gap: 12, marginBottom: 8, pageBreakInside: 'avoid' }}>
            {/* === SISI DEPAN === */}
            <div
              className="kartu-card-wrapper"
              style={{ width: W, height: H, position: 'relative', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}
            >
              <img src={kartuFrontBg} alt="" className="kartu-bg" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />

              {/* NAMA - di atas badge hijau yang sudah ada di background */}
              <div style={{
                position: 'absolute',
                top: '33.5%',
                left: '9%',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                maxWidth: '48%',
                lineHeight: 1.2,
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif',
              }}>
                {siswa.nama}
              </div>

              {/* NIS / NISN value - setelah label "NIS/NISN :" di background */}
              <div style={{
                position: 'absolute',
                top: '49%',
                left: '30%',
                fontSize: 10,
                fontWeight: 700,
                color: '#222',
                fontFamily: 'Arial, sans-serif',
              }}>
                {siswa.nis}{siswa.nisn ? `    / ${siswa.nisn}` : ''}
              </div>

              {/* TTL value - setelah label "Tempat, Tanggal Lahir :" */}
              <div style={{
                position: 'absolute',
                top: '60.5%',
                left: '30%',
                fontSize: 10,
                fontWeight: 700,
                color: '#222',
                fontFamily: 'Arial, sans-serif',
                maxWidth: '30%',
              }}>
                {formatTTL(siswa)}
              </div>

              {/* JK value - setelah label "Jenis Kelamin :" */}
              <div style={{
                position: 'absolute',
                top: '74%',
                left: '30%',
                fontSize: 10,
                fontWeight: 700,
                color: '#222',
                fontFamily: 'Arial, sans-serif',
              }}>
                {siswa.jenis_kelamin || '-'}
              </div>

              {/* FOTO - di area frame foto hijau yang sudah ada di background */}
              <div style={{
                position: 'absolute',
                top: '27%',
                right: '7%',
                width: 90,
                height: 115,
                borderRadius: 5,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {siswa.foto_path ? (
                  <img
                    src={getPhotoUrl(siswa.foto_path) || ''}
                    alt={siswa.nama}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                    <div style={{ fontSize: 28 }}>📷</div>
                  </div>
                )}
              </div>
            </div>

            {/* === SISI BELAKANG === */}
            <div
              className="kartu-card-wrapper"
              style={{ width: W, height: H, position: 'relative', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}
            >
              <img src={kartuBackBg} alt="" className="kartu-bg" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
