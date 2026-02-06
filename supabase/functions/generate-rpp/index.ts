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
  
  // Deep Learning Model
  model_pembelajaran: z.string().max(100).optional(),
  
  // Profil Pelajar Pancasila
  profil_pelajar: z.string().max(1000).optional(),
  
  // KBC
  tema_kbc: z.string().max(500).optional(),
  materi_insersi: z.string().max(2000).optional(),
  
  // KKTP Integration
  kriteria_ketercapaian: z.string().max(3000).optional(),
  
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

    // Build enhanced system prompt
    const systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia.

PENDEKATAN UTAMA:
1. **Kurikulum Berbasis Cinta (KBC)** - Integrasi nilai-nilai karakter Islami secara natural
2. **Deep Learning** - Penerapan model pembelajaran ${modelData.nama} dengan sintaks:
   ${modelData.sintaks.map((s, i) => `${i + 1}. ${s}`).join('\n   ')}
3. **Higher Order Thinking Skills (HOTS)** - Asesmen berbasis C4-C6 (Menganalisis, Mengevaluasi, Mencipta)
4. **Profil Pelajar Pancasila** - Integrasi dimensi P5 dalam pembelajaran

FORMAT OUTPUT (Markdown terstruktur):

# MODUL AJAR / RPP

## INFORMASI UMUM
| Aspek | Keterangan |
|-------|------------|
| Mata Pelajaran | [mapel] |
| Fase/Kelas | [fase dan kelas] |
| Materi Pokok | [topik] |
| Alokasi Waktu | [alokasi waktu] |
| Model Pembelajaran | ${modelData.nama} |
| Profil Pelajar Pancasila | [dimensi P5 yang dikembangkan] |
| Tema Kurikulum Berbasis Cinta | [nilai karakter KBC] |

## A. CAPAIAN PEMBELAJARAN (CP)
[Capaian pembelajaran sesuai kurikulum]

## B. TUJUAN PEMBELAJARAN (TP)
[Tujuan pembelajaran dengan indikator SMART, integrasikan nilai karakter]

## C. KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
| No | Tujuan Pembelajaran | Kriteria Ketercapaian | Level HOTS |
|----|---------------------|----------------------|------------|
[Tabel kriteria dengan indikator terukur, level C4-C6]

## D. MATERI PEMBELAJARAN
### Materi Inti
[Materi pokok pembelajaran]

### Materi Insersi (Kurikulum Berbasis Cinta)
[Integrasi nilai karakter ke dalam materi - kasih sayang, empati, syukur, dll]

## E. KEGIATAN PEMBELAJARAN

### Pendahuluan (... menit)
- Salam dan doa pembuka (integrasi spiritual)
- Apersepsi dan motivasi
- Menyampaikan tujuan pembelajaran
- Ice breaking/aktivasi prior knowledge

### Kegiatan Inti (... menit)
**Model: ${modelData.nama}**

${modelData.sintaks.map((s, i) => `#### Tahap ${i + 1}: ${s}
- Kegiatan guru
- Kegiatan peserta didik
- Integrasi nilai karakter
- Diferensiasi (jika ada)
`).join('\n')}

### Penutup (... menit)
- Refleksi pembelajaran dan nilai karakter
- Umpan balik
- Tindak lanjut
- Doa penutup

## F. ASESMEN

### Asesmen Formatif
| Teknik | Instrumen | Level HOTS | Kriteria Penilaian |
|--------|-----------|------------|-------------------|
[Tabel asesmen formatif dengan rubrik]

### Asesmen Sumatif
| Teknik | Instrumen | Level HOTS | Kriteria Penilaian |
|--------|-----------|------------|-------------------|
[Tabel asesmen sumatif dengan rubrik]

### Asesmen Sikap/Karakter
| Nilai Karakter | Indikator | Teknik Penilaian |
|----------------|-----------|------------------|
[Penilaian internalisasi nilai KBC]

## G. DIFERENSIASI PEMBELAJARAN

### Diferensiasi Konten
[Penyesuaian materi berdasarkan kesiapan belajar]

### Diferensiasi Proses
[Penyesuaian aktivitas berdasarkan gaya belajar: visual, auditori, kinestetik]

### Diferensiasi Produk
[Variasi hasil belajar yang bisa dipilih siswa]

## H. REFLEKSI
### Refleksi Guru
[Pertanyaan refleksi untuk guru]

### Refleksi Peserta Didik
[Pertanyaan refleksi fokus internalisasi nilai karakter dan pemahaman konsep]

## I. LAMPIRAN
- Lembar Kerja Peserta Didik (LKPD)
- Rubrik Penilaian
- Bahan Bacaan/Media

---
*Modul Ajar ini disusun dengan pendekatan Deep Learning dan Kurikulum Berbasis Cinta*

INSTRUKSI PENTING:
1. Integrasikan nilai KBC ke SELURUH kegiatan pembelajaran secara natural
2. Setiap aktivitas harus mencakup level HOTS (C4-C6)
3. Berikan contoh konkret untuk setiap langkah pembelajaran
4. Sertakan rubrik penilaian yang detail
5. Pastikan diferensiasi muncul di kegiatan inti`;

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

    // Asesmen HOTS
    if (input.teknik_asesmen || input.jenis_asesmen) {
      userPrompt += `\n\n## ASESMEN`;
      if (input.teknik_asesmen) {
        userPrompt += `\n- Teknik Asesmen: ${input.teknik_asesmen}`;
      }
      if (input.jenis_asesmen) {
        userPrompt += `\n- Jenis Asesmen: ${input.jenis_asesmen}`;
      }
    }

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

    userPrompt += `\n\nBuatkan Modul Ajar/RPP yang LENGKAP, DETAIL, dan SIAP PAKAI dengan:
1. Sintaks ${modelData.nama} yang jelas di setiap tahap kegiatan inti
2. Integrasi nilai Kurikulum Berbasis Cinta secara natural
3. Asesmen berbasis HOTS dengan rubrik penilaian
4. Diferensiasi pembelajaran yang praktis
5. LKPD dan instrumen penilaian`;

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
