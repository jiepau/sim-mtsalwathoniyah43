import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoMadrasah from "@/assets/logo-alwathoniyah.png";

export interface BukuIndukSiswa {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  nama_ayah_kandung: string | null;
  nama_ibu_kandung: string | null;
  wa_ortu: string | null;
  status: string | null;
  foto_path?: string | null;
  kelas: { id: string; nama_kelas: string; tingkat: number } | null;
  tahun_ajaran: { id: string; nama_ta: string } | null;
  created_at: string;
}

interface MadrasahInfo {
  nama_madrasah: string;
  alamat: string | null;
  kabupaten_kota: string | null;
  provinsi: string | null;
  npsn: string | null;
  nsm: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
}

interface Props {
  siswaList: BukuIndukSiswa[];
  mode: "rekap" | "detail";
  onClose: () => void;
  filterInfo?: { kelas?: string; ta?: string };
}

const months = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const formatTanggal = (d: string | null): string => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
};

const formatTTL = (s: BukuIndukSiswa): string => {
  const t = s.tempat_lahir || "";
  const tg = s.tanggal_lahir ? formatTanggal(s.tanggal_lahir) : "";
  if (t && tg) return `${t}, ${tg}`;
  return t || tg || "-";
};

const getGender = (g: string | null) => (g === "L" ? "Laki-laki" : g === "P" ? "Perempuan" : "-");

export function BukuIndukPrint({ siswaList, mode, onClose, filterInfo }: Props) {
  const [madrasah, setMadrasah] = useState<MadrasahInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("madrasah_settings")
        .select("nama_madrasah, alamat, kabupaten_kota, provinsi, npsn, nsm, kepala_madrasah, nip_kepala")
        .maybeSingle();
      setMadrasah(data as MadrasahInfo);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Wait for images
    const t = setTimeout(() => {
      const imgs = Array.from(document.querySelectorAll(".buku-induk-print img"));
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded >= imgs.length) setTimeout(() => window.print(), 200);
      };
      if (imgs.length === 0) {
        setTimeout(() => window.print(), 200);
        return;
      }
      imgs.forEach((img) => {
        const i = img as HTMLImageElement;
        if (i.complete) onLoad();
        else { i.addEventListener("load", onLoad); i.addEventListener("error", onLoad); }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [ready]);

  const getPhotoUrl = (foto_path: string | null | undefined): string | null => {
    if (!foto_path) return null;
    const { data } = supabase.storage.from("siswa-photos").getPublicUrl(foto_path);
    return data?.publicUrl || null;
  };

  const today = formatTanggal(new Date().toISOString());

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .buku-induk-print, .buku-induk-print * { visibility: visible !important; }
          .buku-induk-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4 portrait; margin: 12mm 14mm; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; break-after: page; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
        @media screen {
          .buku-induk-print {
            background: #f1f5f9;
            min-height: 100vh;
            padding: 24px;
          }
          .a4-page {
            background: white;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 16px;
            padding: 16mm 14mm;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            box-sizing: border-box;
          }
        }
        .buku-induk-print {
          font-family: 'Times New Roman', Times, serif;
          color: #000;
        }
        .buku-induk-print .kop {
          display: flex; align-items: center; gap: 16px;
          border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 12px;
        }
        .buku-induk-print .kop img { width: 70px; height: 70px; object-fit: contain; }
        .buku-induk-print .kop .text { flex: 1; text-align: center; line-height: 1.3; }
        .buku-induk-print .kop .text h1 { font-size: 14pt; margin: 0; font-weight: bold; }
        .buku-induk-print .kop .text h2 { font-size: 16pt; margin: 0; font-weight: bold; text-transform: uppercase; }
        .buku-induk-print .kop .text p { font-size: 10pt; margin: 0; }
        .buku-induk-print h3.title {
          text-align: center; font-size: 13pt; font-weight: bold;
          text-decoration: underline; margin: 8px 0 12px;
        }
        .buku-induk-print .meta-line {
          font-size: 10pt; margin-bottom: 8px;
        }
        .buku-induk-print table.rekap {
          width: 100%; border-collapse: collapse; font-size: 9pt;
        }
        .buku-induk-print table.rekap th,
        .buku-induk-print table.rekap td {
          border: 1px solid #000; padding: 4px 6px; vertical-align: top;
        }
        .buku-induk-print table.rekap th {
          background: #e5e7eb; font-weight: bold; text-align: center;
        }
        .buku-induk-print table.rekap td.center { text-align: center; }
        .buku-induk-print .ttd {
          margin-top: 24px; display: flex; justify-content: flex-end;
        }
        .buku-induk-print .ttd .box { text-align: center; font-size: 10pt; min-width: 200px; }
        .buku-induk-print .ttd .box .sp { height: 60px; }
        .buku-induk-print .ttd .box .nama { font-weight: bold; text-decoration: underline; }

        /* Detail mode (1 siswa per halaman) */
        .buku-induk-print .detail-grid {
          display: grid; grid-template-columns: 130px 1fr; gap: 12px; margin-top: 8px;
        }
        .buku-induk-print .detail-foto {
          width: 120px; height: 160px; border: 1px solid #000;
          display: flex; align-items: center; justify-content: center;
          background: #f9fafb; font-size: 9pt; color: #6b7280; overflow: hidden;
        }
        .buku-induk-print .detail-foto img { width: 100%; height: 100%; object-fit: cover; }
        .buku-induk-print table.detail {
          width: 100%; border-collapse: collapse; font-size: 10pt;
        }
        .buku-induk-print table.detail td {
          padding: 3px 6px; vertical-align: top;
        }
        .buku-induk-print table.detail td.label { width: 35%; }
        .buku-induk-print table.detail td.sep { width: 12px; text-align: center; }
        .buku-induk-print .section-title {
          font-weight: bold; font-size: 11pt; margin: 10px 0 4px;
          background: #e5e7eb; padding: 4px 8px;
        }
      `}</style>

      <div className="no-print sticky top-0 z-50 bg-background border-b p-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Pratinjau Cetak Buku Induk — Mode: <strong>{mode === "rekap" ? "Rekap Tabel" : "Detail Per Siswa"}</strong>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium"
          >
            🖨️ Cetak Sekarang
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded border text-sm"
          >
            Tutup
          </button>
        </div>
      </div>

      <div className="buku-induk-print">
        {/* ========== MODE REKAP (TABEL) ========== */}
        {mode === "rekap" && (
          <div className="a4-page">
            <div className="kop">
              <img src={logoMadrasah} alt="Logo" />
              <div className="text">
                <h1>YAYASAN PENDIDIKAN ISLAM AL-WATHONIYAH 43</h1>
                <h2>{madrasah?.nama_madrasah || "MTs Al-Wathoniyah 43"}</h2>
                <p>
                  {madrasah?.alamat || "-"}
                  {madrasah?.kabupaten_kota ? `, ${madrasah.kabupaten_kota}` : ""}
                  {madrasah?.provinsi ? `, ${madrasah.provinsi}` : ""}
                </p>
                <p>
                  NPSN: {madrasah?.npsn || "-"} | NSM: {madrasah?.nsm || "-"}
                </p>
              </div>
            </div>

            <h3 className="title">BUKU INDUK SISWA</h3>

            <div className="meta-line">
              <div>Tahun Ajaran : {filterInfo?.ta || "Semua"}</div>
              <div>Kelas : {filterInfo?.kelas || "Semua"}</div>
              <div>Jumlah Siswa : {siswaList.length} orang</div>
            </div>

            <table className="rekap">
              <thead>
                <tr>
                  <th style={{ width: "30px" }}>No</th>
                  <th style={{ width: "75px" }}>NIS</th>
                  <th style={{ width: "85px" }}>NISN</th>
                  <th>Nama Lengkap</th>
                  <th style={{ width: "30px" }}>JK</th>
                  <th>Tempat, Tgl Lahir</th>
                  <th>Nama Ayah</th>
                  <th>Nama Ibu</th>
                  <th style={{ width: "55px" }}>Kelas</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((s, i) => (
                  <tr key={s.id}>
                    <td className="center">{i + 1}</td>
                    <td>{s.nis}</td>
                    <td>{s.nisn || "-"}</td>
                    <td>{s.nama}</td>
                    <td className="center">{s.jenis_kelamin || "-"}</td>
                    <td>{formatTTL(s)}</td>
                    <td>{s.nama_ayah_kandung || "-"}</td>
                    <td>{s.nama_ibu_kandung || "-"}</td>
                    <td className="center">{s.kelas?.nama_kelas || "-"}</td>
                  </tr>
                ))}
                {siswaList.length === 0 && (
                  <tr><td colSpan={9} className="center">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>

            <div className="ttd avoid-break">
              <div className="box">
                <div>Jakarta, {today}</div>
                <div>Kepala Madrasah,</div>
                <div className="sp"></div>
                <div className="nama">{madrasah?.kepala_madrasah || "( ............................ )"}</div>
                <div>NIP. {madrasah?.nip_kepala || "-"}</div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODE DETAIL (1 SISWA / HALAMAN) ========== */}
        {mode === "detail" && siswaList.map((s, idx) => {
          const photo = getPhotoUrl(s.foto_path);
          const isLast = idx === siswaList.length - 1;
          return (
            <div key={s.id} className={`a4-page ${!isLast ? "page-break" : ""}`}>
              <div className="kop">
                <img src={logoMadrasah} alt="Logo" />
                <div className="text">
                  <h1>YAYASAN PENDIDIKAN ISLAM AL-WATHONIYAH 43</h1>
                  <h2>{madrasah?.nama_madrasah || "MTs Al-Wathoniyah 43"}</h2>
                  <p>
                    {madrasah?.alamat || "-"}
                    {madrasah?.kabupaten_kota ? `, ${madrasah.kabupaten_kota}` : ""}
                  </p>
                  <p>NPSN: {madrasah?.npsn || "-"} | NSM: {madrasah?.nsm || "-"}</p>
                </div>
              </div>

              <h3 className="title">BUKU INDUK SISWA</h3>
              <div className="meta-line" style={{ textAlign: "center", marginBottom: 4 }}>
                Nomor Induk: <strong>{s.nis}</strong>
              </div>

              <div className="detail-grid">
                <div className="detail-foto">
                  {photo ? <img src={photo} alt={s.nama} /> : <span>3 × 4</span>}
                </div>
                <div>
                  <div className="section-title">A. Identitas Siswa</div>
                  <table className="detail">
                    <tbody>
                      <tr><td className="label">Nama Lengkap</td><td className="sep">:</td><td><strong>{s.nama}</strong></td></tr>
                      <tr><td className="label">Jenis Kelamin</td><td className="sep">:</td><td>{getGender(s.jenis_kelamin)}</td></tr>
                      <tr><td className="label">NIS</td><td className="sep">:</td><td>{s.nis}</td></tr>
                      <tr><td className="label">NISN</td><td className="sep">:</td><td>{s.nisn || "-"}</td></tr>
                      <tr><td className="label">Tempat, Tanggal Lahir</td><td className="sep">:</td><td>{formatTTL(s)}</td></tr>
                      <tr><td className="label">Status</td><td className="sep">:</td><td style={{ textTransform: "capitalize" }}>{s.status || "aktif"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="section-title">B. Alamat & Kontak</div>
              <table className="detail">
                <tbody>
                  <tr><td className="label">Alamat Tempat Tinggal</td><td className="sep">:</td><td>{s.alamat || "-"}</td></tr>
                  <tr><td className="label">No. WhatsApp Orang Tua</td><td className="sep">:</td><td>{s.wa_ortu || "-"}</td></tr>
                </tbody>
              </table>

              <div className="section-title">C. Data Orang Tua / Wali</div>
              <table className="detail">
                <tbody>
                  <tr><td className="label">Nama Ayah Kandung</td><td className="sep">:</td><td>{s.nama_ayah_kandung || "-"}</td></tr>
                  <tr><td className="label">Nama Ibu Kandung</td><td className="sep">:</td><td>{s.nama_ibu_kandung || "-"}</td></tr>
                </tbody>
              </table>

              <div className="section-title">D. Riwayat Pendidikan di Madrasah Ini</div>
              <table className="detail">
                <tbody>
                  <tr><td className="label">Kelas Saat Ini</td><td className="sep">:</td><td>{s.kelas?.nama_kelas || "-"}</td></tr>
                  <tr><td className="label">Tahun Ajaran</td><td className="sep">:</td><td>{s.tahun_ajaran?.nama_ta || "-"}</td></tr>
                  <tr><td className="label">Tanggal Terdaftar</td><td className="sep">:</td><td>{formatDate(s.created_at)}</td></tr>
                </tbody>
              </table>

              <div className="ttd avoid-break">
                <div className="box">
                  <div>Jakarta, {today}</div>
                  <div>Kepala Madrasah,</div>
                  <div className="sp"></div>
                  <div className="nama">{madrasah?.kepala_madrasah || "( ............................ )"}</div>
                  <div>NIP. {madrasah?.nip_kepala || "-"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
