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
    // Wait for images to load
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

  // Card dimensions in px (for screen) - KTP ratio 85.6:53.98 ≈ 1.586:1
  // We use 428px x 270px for screen (5x scale from mm)
  const CARD_W = 428;
  const CARD_H = 270;

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .kartu-print-area, .kartu-print-area * { visibility: visible !important; }
          .kartu-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .no-print { display: none !important; }
          .kartu-card-wrapper {
            width: 85.6mm !important;
            height: 53.98mm !important;
          }
          .kartu-card-wrapper img.kartu-bg {
            width: 85.6mm !important;
            height: 53.98mm !important;
          }
          .kartu-nama-overlay { font-size: 7pt !important; top: 28% !important; }
          .kartu-nis-line { font-size: 6pt !important; }
          .kartu-ttl-line { font-size: 6pt !important; }
          .kartu-jk-line { font-size: 6pt !important; }
          .kartu-photo-box {
            width: 20mm !important;
            height: 26mm !important;
            top: 26% !important;
            right: 8% !important;
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

      {/* Close button */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={onClose}
          style={{
            background: '#ef4444',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          ✕ Tutup Preview
        </button>
      </div>

      <div className="kartu-print-area">
        {siswaList.map((siswa) => (
          <div key={siswa.id} style={{ display: 'flex', gap: 12, marginBottom: 8, pageBreakInside: 'avoid' }}>
            {/* === FRONT === */}
            <div
              className="kartu-card-wrapper"
              style={{
                width: CARD_W,
                height: CARD_H,
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={kartuFrontBg}
                alt=""
                className="kartu-bg"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Nama overlay */}
              <div
                className="kartu-nama-overlay"
                style={{
                  position: 'absolute',
                  top: '28%',
                  left: '8%',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  maxWidth: '50%',
                  lineHeight: 1.3,
                  textTransform: 'uppercase',
                }}
              >
                {siswa.nama}
              </div>
              {/* Data fields */}
              <div
                style={{
                  position: 'absolute',
                  top: '42%',
                  left: '8%',
                  fontSize: 9,
                  color: '#222',
                  lineHeight: 2,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                <div className="kartu-nis-line">
                  <span style={{ display: 'inline-block', width: 80 }}>NIS/NISN</span>
                  <span style={{ display: 'inline-block', width: 14, textAlign: 'center' }}>:</span>
                  <strong>{siswa.nis}{siswa.nisn ? ` / ${siswa.nisn}` : ''}</strong>
                </div>
                <div className="kartu-ttl-line">
                  <span style={{ display: 'inline-block', width: 80 }}>Tempat,</span>
                  <span style={{ display: 'inline-block', width: 14, textAlign: 'center' }}>:</span>
                  <strong>{formatTTL(siswa)}</strong>
                </div>
                <div style={{ marginTop: -4 }}>
                  <span style={{ display: 'inline-block', width: 80, fontSize: 8 }}>Tanggal Lahir</span>
                </div>
                <div className="kartu-jk-line">
                  <span style={{ display: 'inline-block', width: 80 }}>Jenis Kelamin</span>
                  <span style={{ display: 'inline-block', width: 14, textAlign: 'center' }}>:</span>
                  <strong>{siswa.jenis_kelamin || '-'}</strong>
                </div>
              </div>
              {/* Photo */}
              <div
                className="kartu-photo-box"
                style={{
                  position: 'absolute',
                  top: '26%',
                  right: '8%',
                  width: 95,
                  height: 120,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '2px solid #2e7d5e',
                  background: '#e8f5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {siswa.foto_path ? (
                  <img
                    src={getPhotoUrl(siswa.foto_path) || ''}
                    alt={siswa.nama}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', fontSize: 10 }}>
                    <div style={{ fontSize: 24 }}>📷</div>
                    Foto
                  </div>
                )}
              </div>
            </div>

            {/* === BACK === */}
            <div
              className="kartu-card-wrapper"
              style={{
                width: CARD_W,
                height: CARD_H,
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={kartuBackBg}
                alt=""
                className="kartu-bg"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
