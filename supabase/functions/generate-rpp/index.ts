import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model Pembelajaran Deep Learning
const MODEL_PEMBELAJARAN = {
  discovery_learning: {
    nama: "Discovery Learning",
    sintaks: [
      "Stimulation (Pemberian Rangsangan)",
      "Problem Statement (Identifikasi Masalah)",
      "Data Collection (Pengumpulan Data)",
      "Data Processing (Pengolahan Data)",
      "Verification (Pembuktian)",
      "Generalization (Menarik Kesimpulan)"
    ]
  },
  problem_based_learning: {
    nama: "Problem Based Learning (PBL)",
    sintaks: [
      "Orientasi pada Masalah",
      "Organisasi Belajar",
      "Penyelidikan Individual/Kelompok",
      "Pengembangan dan Penyajian Hasil",
      "Analisis dan Evaluasi Proses"
    ]
  },
  project_based_learning: {
    nama: "Project Based Learning (PjBL)",
    sintaks: [
      "Penentuan Pertanyaan Mendasar",
      "Menyusun Perencanaan Proyek",
      "Menyusun Jadwal",
      "Monitoring Kemajuan Proyek",
      "Menguji Hasil",
      "Evaluasi Pengalaman"
    ]
  },
  inquiry_learning: {
    nama: "Inquiry Learning",
    sintaks: [
      "Orientasi",
      "Merumuskan Masalah",
      "Merumuskan Hipotesis",
      "Mengumpulkan Data",
      "Menguji Hipotesis",
      "Merumuskan Kesimpulan"
    ]
  },
  differentiated_instruction: {
    nama: "Differentiated Instruction",
    sintaks: [
      "Pre-Assessment (Penilaian Awal)",
      "Diferensiasi Konten",
      "Diferensiasi Proses",
      "Diferensiasi Produk",
      "Ongoing Assessment (Penilaian Berkelanjutan)"
    ]
  }
};

// Profil Pelajar Pancasila
const PROFIL_PELAJAR_PANCASILA = {
  beriman: "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
  mandiri: "Mandiri",
  bergotong_royong: "Bergotong Royong",
  berkebinekaan_global: "Berkebinekaan Global",
  bernalar_kritis: "Bernalar Kritis",
  kreatif: "Kreatif"
};

// Teknik Asesmen HOTS
const TEKNIK_ASESMEN_HOTS = {
  tes_tertulis: "Tes Tertulis (Essay Analisis, Pemecahan Masalah)",
  tes_lisan: "Tes Lisan (Presentasi, Diskusi Terbimbing)",
  observasi: "Observasi (Checklist Sikap, Rubrik Kinerja)",
  penugasan: "Penugasan (Proyek, Portofolio, Produk)",
  praktik: "Penilaian Praktik (Demonstrasi, Simulasi)",
  peer_assessment: "Peer Assessment (Penilaian Antar Teman)",
  self_assessment: "Self Assessment (Refleksi Diri)"
};

// Input validation schema - enhanced
const rppInputSchema = z.object({
  jenjang: z.string().min(1).max(20),
  kelas: z.string().min(1).max(20),
  semester: z.string().min(1).max(20),
  mapel: z.string().min(1).max(100),
  topik: z.string().min(1).max(500),
  alokasi_waktu: z.string().max(100),
  tujuan_pembelajaran: z.string().max(3000).optional(),
  capaian_pembelajaran: z.string().max(3000).optional(),
  
  // Format output
  format_output: z.enum(["per_topik", "per_bab"]).optional().default("per_topik"),
  jumlah_pertemuan: z.string().max(2).optional(),
  
  // Deep Learning Model
  model_pembelajaran: z.string().max(100).optional(),
  
  // Profil Pelajar Pancasila
  profil_pelajar: z.string().max(1000).optional(),
  
  // KBC
  tema_kbc: z.string().max(500).optional(),
  materi_insersi: z.string().max(2000).optional(),
  
  // KKTP Integration
  kriteria_ketercapaian: z.string().max(10000).optional(),
  
  // Asesmen HOTS
  teknik_asesmen: z.string().max(500).optional(),
  jenis_asesmen: z.string().max(500).optional(),
  
  // Diferensiasi
  diferensiasi_konten: z.string().max(1000).optional(),
  diferensiasi_proses: z.string().max(1000).optional(),
  diferensiasi_produk: z.string().max(1000).optional(),
});

function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Token tidak ditemukan" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Token tidak valid" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Authorization check - admin, operator, or guru can access
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error checking user roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Gagal memverifikasi hak akses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roles?.map(r => r.role) || [];
    const hasAccess = userRoles.includes("admin") || userRoles.includes("operator") || userRoles.includes("guru");

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Hanya Admin, Operator, dan Guru yang dapat mengakses fitur ini" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const rawInput = await req.json();
    const parseResult = rppInputSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: `Validasi gagal: ${formatZodErrors(parseResult.error)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const input = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get model pembelajaran details
    const modelKey = input.model_pembelajaran || "discovery_learning";
    const modelData = MODEL_PEMBELAJARAN[modelKey as keyof typeof MODEL_PEMBELAJARAN] || MODEL_PEMBELAJARAN.discovery_learning;

    const isPerBab = input.format_output === "per_bab";
    const jumlahPertemuan = isPerBab ? parseInt(input.jumlah_pertemuan || "4") : 1;

    // Build enhanced system prompt
    let systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia.

PENDEKATAN UTAMA:
1. **Kurikulum Berbasis Cinta (KBC)** - Integrasi nilai-nilai karakter Islami secara natural
2. **Deep Learning** - Penerapan model pembelajaran ${modelData.nama} dengan sintaks:
   ${modelData.sintaks.map((s, i) => `${i + 1}. ${s}`).join('\n   ')}
3. **Higher Order Thinking Skills (HOTS)** - Asesmen berbasis C4-C6 (Menganalisis, Mengevaluasi, Mencipta)
4. **Profil Pelajar Pancasila** - Integrasi dimensi Profil Pelajar Pancasila dalam pembelajaran

`;

    if (isPerBab) {
      // FORMAT PER-BAB: multi pertemuan seperti file referensi
      systemPrompt += `FORMAT OUTPUT (Markdown terstruktur) — FORMAT PER-BAB dengan ${jumlahPertemuan} PERTEMUAN:

# MODUL AJAR BAB [Judul BAB]

# A. Informasi Umum

| Aspek | Keterangan |
|-------|------------|
| Nama Sekolah | [sekolah] |
| Fase/Kelas | [fase/kelas] |
| Mata Pelajaran | [mapel] |
| Alokasi Waktu | ${jumlahPertemuan} Pertemuan × [JP per pertemuan] × 40 menit |
| Model Pembelajaran | ${modelData.nama} |
| Profil Pelajar Pancasila | [dimensi] |
| Tema Kurikulum Berbasis Cinta | [nilai karakter] |

## 1. Kompetensi Awal
[Pengetahuan prasyarat yang harus dimiliki peserta didik]

## 2. Kata Kunci
- [kata kunci 1]
- [kata kunci 2]
- dst.

## 3. Profil Pelajar Pancasila
- [dimensi yang dikembangkan]

## 4. Sarana dan Prasarana
| Sarana | Keterangan |
|--------|------------|
| Sarana | [sarana yang dibutuhkan] |
| Prasarana | [prasarana yang dibutuhkan] |
| Sumber Belajar | [buku/referensi] |

## 5. Target Peserta Didik
[Deskripsi target peserta didik]

## 6. Model dan Mode Pembelajaran
- Model: ${modelData.nama}
- Mode: Tatap Muka

## 7. Asesmen
- Asesmen non-kognitif (formatif)
- Asesmen kognitif (sumatif)

# B. Komponen Inti

${Array.from({length: jumlahPertemuan}, (_, i) => `
## Pertemuan ${i + 1} (... JP × 40 menit)

### 1. Tujuan Pembelajaran
[Tujuan pembelajaran spesifik untuk pertemuan ini]

### 2. Pemahaman Bermakna
[Apa yang akan dipahami peserta didik]

### 3. Pertanyaan Pemantik
- [Pertanyaan pemantik 1]
- [Pertanyaan pemantik 2]

### 4. Kegiatan Pembelajaran

#### Pendahuluan (... menit)
- Salam dan doa pembuka
- Apersepsi dan motivasi
- Menyampaikan tujuan pembelajaran

#### Kegiatan Inti (... menit)
**Model: ${modelData.nama}**
${modelData.sintaks.map((s, j) => `- **${s}**: [kegiatan detail]`).join('\n')}

#### Penutup (... menit)
- Refleksi pembelajaran
- Tindak lanjut
- Doa penutup

### 5. Asesmen
[Asesmen spesifik pertemuan ini - formatif/sumatif sesuai kebutuhan]

### 6. Pengayaan dan Remedial
- **Pengayaan**: [untuk peserta didik yang sudah mencapai TP]
- **Remedial**: [untuk peserta didik yang belum mencapai TP]
`).join('\n---\n')}

# C. Refleksi
### Refleksi Guru
[Pertanyaan refleksi untuk guru]

### Refleksi Peserta Didik
[Pertanyaan refleksi untuk peserta didik]

# D. Lampiran
- Lembar Kerja Peserta Didik (LKPD)
- Rubrik Penilaian
- Bahan Bacaan/Media

INSTRUKSI PENTING:
1. Setiap pertemuan HARUS memiliki tujuan pembelajaran yang BERBEDA dan PROGRESIF
2. Kegiatan inti setiap pertemuan harus DETAIL dengan langkah-langkah ${modelData.nama}
3. Asesmen pertemuan terakhir berupa asesmen sumatif (tes/tugas akhir bab)
4. Integrasikan KBC secara natural di setiap pertemuan
5. **BAGIAN ASESMEN WAJIB DIISI LENGKAP** dengan tabel dan instrumen konkret`;
    } else {
      // FORMAT PER-TOPIK: format lama (1 pertemuan)
      systemPrompt += `FORMAT OUTPUT (Markdown terstruktur):

# MODUL AJAR / RPP

## INFORMASI UMUM
| Aspek | Keterangan |
|-------|------------|
| Mata Pelajaran | [mapel] |
| Fase/Kelas | [fase dan kelas] |
| Materi Pokok | [topik] |
| Alokasi Waktu | [alokasi waktu] |
| Model Pembelajaran | ${modelData.nama} |
| Profil Pelajar Pancasila | [dimensi yang dikembangkan] |
| Tema Kurikulum Berbasis Cinta | [nilai karakter KBC] |

## A. CAPAIAN PEMBELAJARAN (CP)
[Capaian pembelajaran sesuai kurikulum]

## B. TUJUAN PEMBELAJARAN (TP)
[Tujuan pembelajaran dengan indikator SMART]

## C. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
| No | Tujuan Pembelajaran | Kriteria Ketercapaian | Level HOTS |
|----|---------------------|----------------------|------------|

## D. MATERI PEMBELAJARAN
### Materi Inti
### Materi Insersi (Kurikulum Berbasis Cinta)

## E. KEGIATAN PEMBELAJARAN

### Pendahuluan (... menit)
### Kegiatan Inti (... menit)
**Model: ${modelData.nama}**
${modelData.sintaks.map((s, i) => `#### Tahap ${i + 1}: ${s}
- Kegiatan guru
- Kegiatan peserta didik
- Integrasi nilai karakter
`).join('\n')}
### Penutup (... menit)

## F. ASESMEN

### Asesmen Formatif (Proses)
| No | Teknik | Instrumen | Deskripsi | Level HOTS | Kriteria Penilaian |
|----|--------|-----------|-----------|------------|-------------------|

### Asesmen Sumatif (Akhir)
| No | Teknik | Instrumen | Deskripsi | Level HOTS | Kriteria Penilaian |
|----|--------|-----------|-----------|------------|-------------------|

### Asesmen Sikap/Karakter (KBC)
| No | Nilai Karakter | Indikator Perilaku | Teknik Penilaian | Instrumen |
|----|----------------|-------------------|------------------|-----------|

## G. DIFERENSIASI PEMBELAJARAN
## H. REFLEKSI
## I. LAMPIRAN

INSTRUKSI PENTING:
1. Integrasikan nilai KBC ke SELURUH kegiatan pembelajaran secara natural
2. Setiap aktivitas harus mencakup level HOTS (C4-C6)
3. Berikan contoh konkret untuk setiap langkah pembelajaran
4. **BAGIAN F. ASESMEN WAJIB DIISI LENGKAP** - Setiap sub-bagian asesmen HARUS berisi tabel dengan isi konkret dan spesifik.`;
    }

    // Build user prompt
    let userPrompt = `Buatkan Modul Ajar/RPP LENGKAP dengan detail berikut:

## IDENTITAS PEMBELAJARAN
- Jenjang: ${input.jenjang}
- Kelas: ${input.kelas}
- Semester: ${input.semester}
- Mata Pelajaran: ${input.mapel}
- Topik/Materi Utama: ${input.topik}
- Alokasi Waktu: ${input.alokasi_waktu}
- Model Pembelajaran: ${modelData.nama}`;

    if (isPerBab) {
      userPrompt += `\n- Format: PER-BAB dengan ${jumlahPertemuan} pertemuan
- PENTING: Buat ${jumlahPertemuan} pertemuan LENGKAP dengan tujuan pembelajaran yang BERBEDA dan PROGRESIF untuk setiap pertemuan.
- Setiap pertemuan harus memiliki kegiatan inti yang DETAIL sesuai sintaks ${modelData.nama}.`;
    }

    if (input.capaian_pembelajaran) {
      userPrompt += `\n\n## CAPAIAN PEMBELAJARAN\n${input.capaian_pembelajaran}`;
    }
    
    if (input.tujuan_pembelajaran) {
      userPrompt += `\n\n## TUJUAN PEMBELAJARAN\n${input.tujuan_pembelajaran}`;
    }

    if (input.kriteria_ketercapaian) {
      userPrompt += `\n\n## KRITERIA KETERCAPAIAN (dari KKTP)\n${input.kriteria_ketercapaian}`;
    }

    // Profil Pelajar Pancasila
    if (input.profil_pelajar) {
      userPrompt += `\n\n## PROFIL PELAJAR PANCASILA\nDimensi yang dikembangkan: ${input.profil_pelajar}`;
    }

    // Kurikulum Berbasis Cinta
    if (input.tema_kbc || input.materi_insersi) {
      userPrompt += `\n\n## KURIKULUM BERBASIS CINTA`;
      if (input.tema_kbc) {
        userPrompt += `\n- Tema Nilai Karakter: ${input.tema_kbc}`;
      }
      if (input.materi_insersi) {
        userPrompt += `\n- Materi Insersi:\n${input.materi_insersi}`;
      }
    }

    // Asesmen HOTS - force detailed content
    const teknikList = input.teknik_asesmen || "Tes Tertulis; Observasi; Penugasan";
    const jenisList = input.jenis_asesmen || "Formatif; Sumatif";
    
    userPrompt += `\n\n## F. ASESMEN — BAGIAN INI ADALAH YANG PALING PENTING DAN WAJIB TERISI PENUH
    
**PERINTAH MUTLAK**: Bagian asesmen TIDAK BOLEH KOSONG. Anda HARUS mengisi SETIAP tabel di bawah dengan MINIMAL 3 baris data yang KONKRET dan SPESIFIK sesuai topik "${input.topik}".

Teknik asesmen yang dipilih: ${teknikList}
Jenis asesmen yang dipilih: ${jenisList}

Anda WAJIB menghasilkan KETIGA sub-bagian berikut dengan ISI LENGKAP:

### F.1 Asesmen Formatif (Proses)
Buatkan tabel dengan kolom: No | Teknik | Instrumen | Deskripsi | Level HOTS | Kriteria Penilaian
Isi MINIMAL 3 baris. Contoh format baris:
| 1 | Observasi | Lembar observasi diskusi | Mengamati keaktifan siswa dalam diskusi kelompok | C4 (Menganalisis) | Sangat Baik: aktif bertanya dan menjawab... |

### F.2 Asesmen Sumatif (Akhir)
Buatkan tabel dengan kolom: No | Teknik | Instrumen | Deskripsi | Level HOTS | Kriteria Penilaian
Isi MINIMAL 3 baris dengan soal/tugas yang KONKRET sesuai topik.

### F.3 Asesmen Sikap/Karakter (KBC)
Buatkan tabel dengan kolom: No | Nilai Karakter | Indikator Perilaku | Teknik Penilaian | Instrumen
Isi MINIMAL 3 baris dengan nilai karakter yang relevan.

JIKA BAGIAN ASESMEN KOSONG ATAU HANYA BERISI HEADER TANPA TABEL, MAKA OUTPUT DIANGGAP GAGAL.`;

    // Diferensiasi
    if (input.diferensiasi_konten || input.diferensiasi_proses || input.diferensiasi_produk) {
      userPrompt += `\n\n## DIFERENSIASI PEMBELAJARAN`;
      if (input.diferensiasi_konten) {
        userPrompt += `\n- Diferensiasi Konten: ${input.diferensiasi_konten}`;
      }
      if (input.diferensiasi_proses) {
        userPrompt += `\n- Diferensiasi Proses: ${input.diferensiasi_proses}`;
      }
      if (input.diferensiasi_produk) {
        userPrompt += `\n- Diferensiasi Produk: ${input.diferensiasi_produk}`;
      }
    }

    if (isPerBab) {
      userPrompt += `\n\nBuatkan Modul Ajar PER-BAB yang LENGKAP dengan ${jumlahPertemuan} pertemuan:
1. Setiap pertemuan memiliki TP, pemahaman bermakna, pertanyaan pemantik, dan kegiatan pembelajaran LENGKAP
2. Kegiatan inti menggunakan sintaks ${modelData.nama} secara detail
3. Integrasi KBC di setiap pertemuan
4. Pertemuan terakhir berisi asesmen sumatif`;
    } else {
      userPrompt += `\n\nBuatkan Modul Ajar/RPP yang LENGKAP, DETAIL, dan SIAP PAKAI dengan:
1. Sintaks ${modelData.nama} yang jelas di setiap tahap kegiatan inti
2. Integrasi nilai Kurikulum Berbasis Cinta secara natural
3. Asesmen berbasis HOTS dengan rubrik penilaian
4. Diferensiasi pembelajaran yang praktis
5. LKPD dan instrumen penilaian`;
    }

    console.log(`RPP generation by user ${userId} for ${input.mapel} - ${input.topik} using ${modelData.nama}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit AI habis, silakan tambah kredit." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Gagal menghasilkan RPP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-rpp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
