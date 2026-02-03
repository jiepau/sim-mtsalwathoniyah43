import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      jenjang, 
      kelas, 
      semester, 
      mapel, 
      topik, 
      alokasi_waktu, 
      tujuan_pembelajaran,
      capaian_pembelajaran,
      tema_kbc,
      materi_insersi
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia dengan pendekatan Kurikulum Berbasis Cinta (KBC).

Format output harus dalam Markdown yang rapi dan terstruktur dengan bagian-bagian berikut:

# Rencana Pelaksanaan Pembelajaran (RPP)

**Informasi Umum:**
- Mata Pelajaran: [mapel]
- Fase/Kelompok Usia: [fase dan kelas]
- Materi Pokok: [topik]
- Tema Kurikulum Berbasis Cinta: [tema KBC yang diberikan]
- Materi Insersi: [poin-poin materi insersi yang mengintegrasikan nilai karakter]
- Alokasi Waktu: [alokasi waktu]

**A. Tujuan Pembelajaran dan Indikator Ketercapaian Tujuan Pembelajaran**
- Tujuan Pembelajaran (integrasikan dengan nilai Kurikulum Berbasis Cinta)
- Indikator Ketercapaian Tujuan Pembelajaran (IKTP) - harus mencakup aspek kognitif, afektif, dan nilai karakter

**B. Kegiatan Pembelajaran**
Model pembelajaran (PjBL/Discovery Learning/dll):
1. Pendahuluan (buka dengan nilai spiritual dan karakter)
2. Kegiatan Inti (integrasikan materi insersi dalam setiap aktivitas)
   - Orientasi/Stimulasi
   - Eksplorasi/Diskusi (kaitkan dengan nilai karakter)
   - Elaborasi/Proyek
3. Penutup (refleksi nilai karakter yang dipelajari)

**C. Asesmen**
- Asesmen Formatif (termasuk penilaian sikap/karakter)
- Asesmen Sumatif

**D. Refleksi**
- Refleksi Guru
- Refleksi Peserta Didik (fokus pada internalisasi nilai karakter)

PENTING: Integrasikan Tema Kurikulum Berbasis Cinta dan Materi Insersi ke dalam SELURUH kegiatan pembelajaran. Nilai karakter harus terasa natural dan terintegrasi, bukan terpisah.

Gunakan bahasa Indonesia yang baik dan benar. Berikan konten yang detail, praktis, dan siap pakai oleh guru.`;

    // Build user prompt with ATP data if available
    let userPrompt = `Buatkan RPP/Modul Ajar dengan detail berikut:
- Jenjang: ${jenjang}
- Kelas: ${kelas}
- Semester: ${semester}
- Mata Pelajaran: ${mapel}
- Topik/Materi Utama: ${topik}
- Alokasi Waktu: ${alokasi_waktu}`;

    if (capaian_pembelajaran) {
      userPrompt += `\n- Capaian Pembelajaran: ${capaian_pembelajaran}`;
    }
    
    if (tujuan_pembelajaran) {
      userPrompt += `\n- Tujuan Pembelajaran Spesifik: ${tujuan_pembelajaran}`;
    }

    // Kurikulum Berbasis Cinta integration
    if (tema_kbc) {
      userPrompt += `\n\n## Kurikulum Berbasis Cinta
- Tema Kurikulum Berbasis Cinta: ${tema_kbc}`;
    }
    
    if (materi_insersi) {
      userPrompt += `\n- Materi Insersi:\n${materi_insersi}`;
    }

    userPrompt += `\n\nBuatkan RPP lengkap dengan pendekatan Kurikulum Berbasis Cinta. Integrasikan nilai-nilai karakter ke dalam setiap kegiatan pembelajaran secara natural dan bermakna.`;

    console.log("Generating RPP for:", { jenjang, kelas, semester, mapel, topik });

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
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit AI habis, silakan tambah kredit." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Gagal menghasilkan RPP" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-rpp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
