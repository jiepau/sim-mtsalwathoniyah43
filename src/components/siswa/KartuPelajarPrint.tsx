import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const CARD_W = '85.6mm';
const CARD_H = '54mm';

export function KartuPelajarPrint({ siswaList, onClose }: Props) {
  const [canPrint, setCanPrint] = useState(false);

  useEffect(() => {
    const checkImages = () => {
      const container = document.querySelector('.kartu-print-area');
      if (!container) return;
      const images = Array.from(container.querySelectorAll('img'));
      if (images.length === 0) { setCanPrint(true); return; }
      let loaded = 0;
      const onLoad = () => { loaded++; if (loaded >= images.length) setCanPrint(true); };
      images.forEach((img) => {
        if (img.complete && img.naturalHeight > 0) onLoad();
        else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
      });
    };
    const timer = setTimeout(checkImages, 500);
    const fallback = setTimeout(() => setCanPrint(true), 6000);
    return () => { clearTimeout(timer); clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (!canPrint) return;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [canPrint]);

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
        .kartu-card {
          width: ${CARD_W};
          height: ${CARD_H};
          position: relative;
          overflow: hidden;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .kartu-pair {
          display: flex;
          gap: 4mm;
          margin-bottom: 4mm;
          page-break-inside: avoid;
        }

        /* === FRONT CARD === */
        .front-header-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2.5mm;
          background: linear-gradient(90deg, #16a34a, #15803d);
        }
        .front-title {
          position: absolute;
          top: 3.5mm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8pt;
          font-weight: 800;
          color: #15803d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .front-subtitle {
          position: absolute;
          top: 8mm;
          left: 8mm;
          font-size: 9pt;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .front-photo-frame {
          position: absolute;
          top: 14mm;
          right: 6mm;
          width: 25mm;
          height: 32mm;
          border: 0.8mm solid #16a34a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0fdf4;
        }
        .front-photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .front-photo-placeholder {
          color: #a3a3a3;
          font-size: 7pt;
          text-align: center;
        }
        .front-nama {
          position: absolute;
          top: 14mm;
          left: 8mm;
          font-size: 8pt;
          font-weight: 700;
          color: #111;
          text-transform: uppercase;
          max-width: 45mm;
          line-height: 1.2;
        }
        .front-data-area {
          position: absolute;
          top: 21mm;
          left: 8mm;
          width: 45mm;
        }
        .front-data-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1.2mm;
          font-size: 7.5pt;
          color: #222;
          line-height: 1.25;
        }
        .front-data-label {
          width: 18mm;
          flex-shrink: 0;
          font-weight: 400;
        }
        .front-data-sep {
          width: 3mm;
          flex-shrink: 0;
          text-align: center;
          font-weight: 400;
        }
        .front-data-value {
          flex: 1;
          font-weight: 700;
          word-break: break-word;
        }
        .front-ttd {
          position: absolute;
          bottom: 2mm;
          right: 4mm;
          text-align: center;
          font-size: 5pt;
          color: #333;
          line-height: 1.3;
        }
        .front-ttd-name {
          font-weight: 700;
          text-decoration: underline;
        }
        .front-bottom-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2.5mm;
          background: linear-gradient(90deg, #16a34a, #15803d);
        }

        /* === BACK CARD === */
        .back-header-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2.5mm;
          background: linear-gradient(90deg, #16a34a, #15803d);
        }
        .back-title {
          position: absolute;
          top: 3.5mm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 7pt;
          font-weight: 800;
          color: #15803d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .back-ketentuan-title {
          position: absolute;
          top: 9mm;
          left: 6mm;
          font-size: 6.5pt;
          font-weight: 700;
          color: #111;
        }
        .back-ketentuan-list {
          position: absolute;
          top: 13mm;
          left: 6mm;
          right: 6mm;
          font-size: 5.5pt;
          color: #333;
          line-height: 1.45;
        }
        .back-ketentuan-item {
          margin-bottom: 1.5mm;
          padding-left: 3mm;
          text-indent: -3mm;
        }
        .back-footer {
          position: absolute;
          bottom: 3mm;
          left: 6mm;
          right: 6mm;
          font-size: 5pt;
          color: #444;
          line-height: 1.4;
          border-top: 0.3mm solid #d1d5db;
          padding-top: 1.5mm;
        }
        .back-footer-row {
          display: flex;
          gap: 1mm;
          margin-bottom: 0.5mm;
        }
        .back-footer-label {
          font-weight: 700;
          flex-shrink: 0;
        }
        .back-bottom-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2.5mm;
          background: linear-gradient(90deg, #16a34a, #15803d);
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
          <div key={siswa.id} className="kartu-pair">
            {/* === SISI DEPAN === */}
            <div className="kartu-card">
              <div className="front-header-line" />
              <div className="front-title">MTs Al Wathoniyah 43</div>
              <div className="front-subtitle">Kartu Pelajar</div>

              {/* Foto */}
              <div className="front-photo-frame">
                {siswa.foto_path ? (
                  <img src={getPhotoUrl(siswa.foto_path) || ''} alt={siswa.nama} />
                ) : (
                  <div className="front-photo-placeholder">
                    <div style={{ fontSize: '14pt' }}>📷</div>
                    <div>Foto</div>
                  </div>
                )}
              </div>

              {/* Nama */}
              <div className="front-nama">{siswa.nama}</div>

              {/* Data siswa */}
              <div className="front-data-area">
                <div className="front-data-row">
                  <span className="front-data-label">NIS/NISN</span>
                  <span className="front-data-sep">:</span>
                  <span className="front-data-value">{siswa.nis}{siswa.nisn ? ` / ${siswa.nisn}` : ''}</span>
                </div>
                <div className="front-data-row">
                  <span className="front-data-label">TTL</span>
                  <span className="front-data-sep">:</span>
                  <span className="front-data-value">{formatTTL(siswa)}</span>
                </div>
                <div className="front-data-row">
                  <span className="front-data-label">Jenis Kelamin</span>
                  <span className="front-data-sep">:</span>
                  <span className="front-data-value">{siswa.jenis_kelamin || '-'}</span>
                </div>
              </div>

              {/* TTD Kepala Madrasah */}
              <div className="front-ttd">
                <div>Kepala Madrasah</div>
                <div style={{ height: '6mm' }} />
                <div className="front-ttd-name">Dra. Hj. Munawaroh, M.Pd.I</div>
                <div>NIP: 196912102007012040</div>
              </div>

              <div className="front-bottom-line" />
            </div>

            {/* === SISI BELAKANG === */}
            <div className="kartu-card">
              <div className="back-header-line" />
              <div className="back-title">MTs Al Wathoniyah 43</div>
              <div className="back-ketentuan-title">KETENTUAN :</div>

              <div className="back-ketentuan-list">
                <div className="back-ketentuan-item">
                  1. Kartu ini berlaku selama pemilik berstatus sebagai siswa/i di MTs Al Wathoniyah 43
                </div>
                <div className="back-ketentuan-item">
                  2. Kartu ini tidak boleh berpindah kepemilikan
                </div>
                <div className="back-ketentuan-item">
                  3. Jika kartu hilang harap menghubungi pihak madrasah
                </div>
              </div>

              <div className="back-footer">
                <div className="back-footer-row">
                  <span className="back-footer-label">WhatsApp</span>
                  <span>: 0857-9683-6507</span>
                </div>
                <div className="back-footer-row">
                  <span className="back-footer-label">Email</span>
                  <span>: wath43.mts@gmail.com</span>
                </div>
                <div className="back-footer-row">
                  <span className="back-footer-label">Instagram</span>
                  <span>: @mtsalwathoniyah43</span>
                </div>
                <div className="back-footer-row">
                  <span className="back-footer-label">Alamat</span>
                  <span>: Jl. Rorotan No.1 Jakarta Utara</span>
                </div>
              </div>

              <div className="back-bottom-line" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
