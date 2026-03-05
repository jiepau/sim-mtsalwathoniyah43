import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { batch_size = 5, offset = 0 } = await req.json().catch(() => ({}));

    // Fetch templates that need IKTP populated
    const { data: templates, error } = await supabase
      .from("cp_templates")
      .select("id, mapel, kelas, semester, fase, elemen, tujuan_pembelajaran, iktp")
      .order("mapel")
      .order("kelas")
      .order("semester")
      .range(offset, offset + batch_size - 1);

    if (error) throw error;
    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ message: "No more templates to process", done: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const results = [];

    for (const template of templates) {
      // Skip if already has IKTP data
      const existingIktp = template.iktp as any[];
      if (existingIktp && Array.isArray(existingIktp) && existingIktp.length > 0 && existingIktp.some((arr: any) => Array.isArray(arr) && arr.length > 0)) {
        results.push({ id: template.id, mapel: template.mapel, kelas: template.kelas, semester: template.semester, status: "skipped" });
        continue;
      }

      const tpList = (template.tujuan_pembelajaran || []) as string[];
      if (tpList.length === 0) {
        results.push({ id: template.id, status: "no_tp" });
        continue;
      }

      const prompt = `Kamu adalah ahli kurikulum Merdeka untuk jenjang MTs (Madrasah Tsanawiyah).

Untuk mata pelajaran "${template.mapel}" Kelas ${template.kelas} Semester ${template.semester} Fase ${template.fase}:

Berikut daftar Tujuan Pembelajaran (TP):
${tpList.map((tp, i) => `${i + 1}. ${tp}`).join("\n")}

Buatkan:
1. IKTP (Indikator Ketercapaian Tujuan Pembelajaran) untuk SETIAP TP. Setiap TP harus memiliki 2-3 indikator yang spesifik, terukur, dan sesuai level kognitif.
2. Materi Pembelajaran / Topik / Subtopik yang sesuai untuk SETIAP TP.

Format output HARUS berupa JSON valid (tanpa markdown code block) dengan struktur:
{
  "iktp": [["indikator 1a", "indikator 1b"], ["indikator 2a", "indikator 2b", "indikator 2c"], ...],
  "materi": ["Topik/Materi untuk TP 1", "Topik/Materi untuk TP 2", ...]
}

Pastikan jumlah array iktp dan materi SAMA PERSIS dengan jumlah TP (${tpList.length} item).
Gunakan bahasa Indonesia yang formal dan sesuai standar kurikulum.
HANYA output JSON, tanpa penjelasan tambahan.`;

      // Add delay between requests to avoid rate limiting
      await delay(3000);

      const maxRetries = 3;
      let lastError = "";
      let aiData = null;

      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${lovableApiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
            }),
          });

          if (aiResponse.status === 429) {
            lastError = "rate_limited";
            await delay(5000 * (retry + 1));
            continue;
          }

          if (!aiResponse.ok) {
            lastError = await aiResponse.text();
            await delay(2000);
            continue;
          }

          aiData = await aiResponse.json();
          break;
        } catch (e: any) {
          lastError = e.message;
          await delay(2000);
        }
      }

      if (!aiData) {
        results.push({ id: template.id, mapel: template.mapel, status: "ai_error", error: lastError });
        continue;
      }

      let content = aiData.choices?.[0]?.message?.content || "";

        const aiData = await aiResponse.json();
        let content = aiData.choices?.[0]?.message?.content || "";
        
        // Clean up potential markdown code blocks
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        
        const parsed = JSON.parse(content);

        if (!parsed.iktp || !parsed.materi || parsed.iktp.length !== tpList.length || parsed.materi.length !== tpList.length) {
          results.push({ id: template.id, mapel: template.mapel, status: "invalid_format", parsed_lengths: { iktp: parsed.iktp?.length, materi: parsed.materi?.length, expected: tpList.length } });
          continue;
        }

        // Update the template
        const { error: updateError } = await supabase
          .from("cp_templates")
          .update({
            iktp: parsed.iktp,
            materi_pembelajaran: parsed.materi,
          })
          .eq("id", template.id);

        if (updateError) {
          results.push({ id: template.id, mapel: template.mapel, status: "update_error", error: updateError.message });
        } else {
          results.push({ id: template.id, mapel: template.mapel, kelas: template.kelas, semester: template.semester, status: "success" });
        }
      } catch (aiErr: any) {
        results.push({ id: template.id, mapel: template.mapel, status: "error", error: aiErr.message });
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      next_offset: offset + batch_size,
      results,
      done: templates.length < batch_size,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
