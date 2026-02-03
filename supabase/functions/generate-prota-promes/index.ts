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
    const { type, mapel, fase, kelas, semester, tahun_ajaran, capaian_pembelajaran, tujuan_pembelajaran } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "prota") {
      systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Program Tahunan (Prota) sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia.

Anda harus menghasilkan output dalam format JSON yang valid dengan struktur berikut:
{
  "kompetensi_inti": "Capaian Pembelajaran utama",
  "alokasi_waktu_total": "Total JP selama 1 tahun",
  "details": [
    { "bulan": 7, "materi": "Materi/TP untuk Juli", "alokasi_waktu": "JP", "keterangan": "" },
    { "bulan": 8, "materi": "Materi/TP untuk Agustus", "alokasi_waktu": "JP", "keterangan": "" },
    ... (sampai bulan 6 untuk Juni)
  ]
}

PENTING:
- Bulan dimulai dari 7 (Juli) sampai 12 (Desember), lalu 1 (Januari) sampai 6 (Juni)
- Distribusikan materi/TP secara merata dan logis sepanjang tahun ajaran
- Perhatikan hari libur nasional dan libur semester
- Berikan alokasi waktu yang realistis
- Output HANYA JSON, tanpa penjelasan tambahan`;

      userPrompt = `Buatkan Program Tahunan (Prota) untuk:
- Mata Pelajaran: ${mapel}
- Fase: ${fase}
- Kelas: ${kelas || 'Tidak ditentukan'}
- Tahun Ajaran: ${tahun_ajaran || 'Tahun berjalan'}
${capaian_pembelajaran ? `- Capaian Pembelajaran: ${capaian_pembelajaran}` : ''}
${tujuan_pembelajaran ? `- Tujuan Pembelajaran yang harus dicakup:\n${tujuan_pembelajaran}` : ''}

Hasilkan HANYA JSON yang valid sesuai format yang diminta.`;
    } else {
      // Promes
      systemPrompt = `Anda adalah asisten guru profesional yang ahli dalam membuat Program Semester (Promes) sesuai Kurikulum Merdeka untuk madrasah/sekolah di Indonesia.

Anda harus menghasilkan output dalam format JSON yang valid dengan struktur berikut:
{
  "keterangan": "Ringkasan program semester",
  "details": [
    { "bulan": 7, "minggu": 1, "tema": "Tema pembelajaran", "tujuan_pembelajaran": "TP yang dicapai minggu ini", "alokasi_waktu": "JP" },
    { "bulan": 7, "minggu": 2, "tema": "Tema pembelajaran", "tujuan_pembelajaran": "TP", "alokasi_waktu": "JP" },
    ... (untuk setiap minggu dalam semester)
  ]
}

PENTING:
- Semester Ganjil: bulan 7-12 (Juli-Desember)
- Semester Genap: bulan 1-6 (Januari-Juni)
- Setiap bulan memiliki 4-5 minggu efektif
- Distribusikan TP secara merata
- Perhatikan hari libur dan ujian
- Output HANYA JSON, tanpa penjelasan tambahan`;

      userPrompt = `Buatkan Program Semester (Promes) untuk:
- Mata Pelajaran: ${mapel}
- Fase: ${fase}
- Kelas: ${kelas || 'Tidak ditentukan'}
- Semester: ${semester === 'ganjil' ? 'Ganjil (Juli-Desember)' : 'Genap (Januari-Juni)'}
- Tahun Ajaran: ${tahun_ajaran || 'Tahun berjalan'}
${capaian_pembelajaran ? `- Capaian Pembelajaran: ${capaian_pembelajaran}` : ''}
${tujuan_pembelajaran ? `- Tujuan Pembelajaran yang harus dicakup:\n${tujuan_pembelajaran}` : ''}

Hasilkan HANYA JSON yang valid sesuai format yang diminta.`;
    }

    console.log(`Generating ${type} for:`, { mapel, fase, kelas, semester });

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
        JSON.stringify({ error: `Gagal menghasilkan ${type}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsedData;
    try {
      // Try to extract JSON from the response (in case it has markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Gagal memproses hasil AI", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-prota-promes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
