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
      capaian_pembelajaran 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia.

Format output harus dalam Markdown yang rapi dan terstruktur dengan bagian-bagian berikut:
1. INFORMASI UMUM (Satuan Pendidikan, Kelas, Semester, Mapel, Topik, Alokasi Waktu)
2. KOMPETENSI AWAL
3. PROFIL PELAJAR PANCASILA
4. SARANA DAN PRASARANA
5. TARGET PESERTA DIDIK
6. MODEL PEMBELAJARAN
7. TUJUAN PEMBELAJARAN
8. PEMAHAMAN BERMAKNA
9. PERTANYAAN PEMANTIK
10. KEGIATAN PEMBELAJARAN
    - Pendahuluan
    - Kegiatan Inti
    - Penutup
11. ASESMEN
    - Asesmen Diagnostik
    - Asesmen Formatif
    - Asesmen Sumatif
12. PENGAYAAN DAN REMEDIAL
13. REFLEKSI GURU DAN PESERTA DIDIK
14. LAMPIRAN (jika diperlukan)

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

    userPrompt += `\n\nBuatkan RPP lengkap dengan semua komponen sesuai Kurikulum Merdeka.`;

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
