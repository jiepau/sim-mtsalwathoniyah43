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

interface MadrasahSettings {
  nama_madrasah: string;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
  no_telp: string | null;
  email: string | null;
  alamat: string | null;
  website: string | null;
}

interface Props {
  siswaList: Siswa[];
  onClose: () => void;
}

export function KartuPelajarPrint({ siswaList, onClose }: Props) {
  const [madrasah, setMadrasah] = useState<MadrasahSettings | null>(null);

  useEffect(() => {
    const fetchMadrasah = async () => {
      const { data } = await supabase.from('madrasah_settings').select('*').limit(1).maybeSingle();
      if (data) setMadrasah(data);
    };
    fetchMadrasah();
  }, []);

  useEffect(() => {
    if (!madrasah) return;
    // Auto print after render
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, [madrasah]);

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

  if (!madrasah) return null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .kartu-pelajar-print-area, .kartu-pelajar-print-area * { visibility: visible !important; }
          .kartu-pelajar-print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
          }
          @page { 
            size: A4 portrait; 
            margin: 10mm; 
          }
          .no-print { display: none !important; }
        }
        @media screen {
          .kartu-pelajar-print-area {
            max-width: 800px;
            margin: 0 auto;
          }
        }
        .kartu-card {
          width: 85.6mm;
          height: 53.98mm;
          position: relative;
          overflow: hidden;
          page-break-inside: avoid;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 3mm;
        }
        .kartu-front {
          background-image: url(${kartuFrontBg});
        }
        .kartu-back {
          background-image: url(${kartuBackBg});
        }
        .kartu-front-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
        }
        .kartu-nama {
          position: absolute;
          top: 15.5mm;
          left: 8mm;
          font-size: 7pt;
          font-weight: 700;
          color: #fff;
          max-width: 42mm;
          line-height: 1.2;
          background: hsl(160, 72%, 37%);
          padding: 1mm 3mm;
          border-radius: 1mm;
        }
        .kartu-data {
          position: absolute;
          top: 23mm;
          left: 8mm;
          font-size: 6.5pt;
          color: #333;
          line-height: 1.8;
        }
        .kartu-data-label {
          display: inline-block;
          width: 18mm;
          font-weight: 400;
        }
        .kartu-data-sep {
          display: inline-block;
          width: 3mm;
          text-align: center;
        }
        .kartu-data-value {
          font-weight: 700;
        }
        .kartu-photo-frame {
          position: absolute;
          top: 14mm;
          right: 6mm;
          width: 22mm;
          height: 28mm;
          border: 1.5px solid hsl(160, 72%, 37%);
          border-radius: 1.5mm;
          overflow: hidden;
          background: #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kartu-photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .kartu-photo-placeholder {
          font-size: 5pt;
          color: #999;
          text-align: center;
        }
        .kartu-pair {
          display: flex;
          gap: 5mm;
          margin-bottom: 4mm;
          page-break-inside: avoid;
        }
      `}</style>

      {/* Close button - screen only */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={onClose}
          className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg hover:opacity-90"
        >
          ✕ Tutup Preview
        </button>
      </div>

      <div className="kartu-pelajar-print-area p-4">
        {siswaList.map((siswa, idx) => (
          <div key={siswa.id} className="kartu-pair" style={{ pageBreakAfter: (idx + 1) % 4 === 0 ? 'always' : 'auto' }}>
            {/* Front */}
            <div className="kartu-card kartu-front">
              <div className="kartu-front-overlay">
                <div className="kartu-nama">{siswa.nama}</div>
                <div className="kartu-data">
                  <div>
                    <span className="kartu-data-label">NIS/NISN</span>
                    <span className="kartu-data-sep">:</span>
                    <span className="kartu-data-value">{siswa.nis}</span>
                    {siswa.nisn && <span className="kartu-data-value"> / {siswa.nisn}</span>}
                  </div>
                  <div>
                    <span className="kartu-data-label">Tempat,</span>
                    <span className="kartu-data-sep">:</span>
                    <span className="kartu-data-value">{formatTTL(siswa)}</span>
                  </div>
                  <div style={{ marginTop: '-1mm' }}>
                    <span className="kartu-data-label">Tanggal Lahir</span>
                    <span className="kartu-data-sep"></span>
                    <span className="kartu-data-value"></span>
                  </div>
                  <div>
                    <span className="kartu-data-label">Jenis Kelamin</span>
                    <span className="kartu-data-sep">:</span>
                    <span className="kartu-data-value">{siswa.jenis_kelamin || '-'}</span>
                  </div>
                </div>
                <div className="kartu-photo-frame">
                  {siswa.foto_path ? (
                    <img src={getPhotoUrl(siswa.foto_path) || ''} alt={siswa.nama} />
                  ) : (
                    <div className="kartu-photo-placeholder">
                      <div style={{ fontSize: '14pt' }}>📷</div>
                      <div>Foto</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="kartu-card kartu-back">
              {/* Back side uses full background image - no overlay needed */}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
