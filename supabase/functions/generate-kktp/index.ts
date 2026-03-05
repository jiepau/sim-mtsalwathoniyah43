import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RBAC check
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.some((r: string) => ["admin", "operator", "guru"].includes(r))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { atp_id, mapel, fase, kelas, capaian_pembelajaran, tujuan_pembelajaran } = await req.json();

    if (!atp_id || !tujuan_pembelajaran || tujuan_pembelajaran.length === 0) {
      return new Response(JSON.stringify({ error: "Data ATP tidak lengkap" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tpList = tujuan_pembelajaran
      .map((tp: string, i: number) => `${i + 1}. ${tp}`)
      .join("\n");

    const systemPrompt = `Kamu adalah ahli kurikulum Merdeka untuk jenjang MTs/SMP di Indonesia. Tugasmu adalah membuat Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berdasarkan Tujuan Pembelajaran (TP) yang diberikan.

Untuk setiap TP, kamu harus menghasilkan:
1. kriteria_ketercapaian: 2-4 indikator ketercapaian yang terukur, spesifik, dan dapat diamati
2. teknik_penilaian: salah satu dari [Tes Tertulis, Tes Lisan, Penugasan, Praktik/Kinerja, Proyek, Portofolio, Observasi]
3. bentuk_instrumen: salah satu dari [Pilihan Ganda, Isian Singkat, Uraian, Lembar Observasi, Rubrik, Daftar Cek, Skala Penilaian]

Pastikan kriteria menggunakan kata kerja operasional yang terukur (menjelaskan, mengidentifikasi, menganalisis, membuat, dll).`;

    const userPrompt = `Mata Pelajaran: ${mapel}
Fase: ${fase}
Kelas: ${kelas || '-'}
Capaian Pembelajaran: ${capaian_pembelajaran}

Daftar Tujuan Pembelajaran:
${tpList}

Buatkan KKTP untuk setiap TP di atas.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_kktp",
              description: "Generate KKTP for each Tujuan Pembelajaran",
              parameters: {
                type: "object",
                properties: {
                  kktp_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tujuan_pembelajaran: { type: "string", description: "The exact TP text" },
                        kriteria_ketercapaian: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-4 measurable criteria",
                        },
                        teknik_penilaian: { type: "string", description: "Assessment technique" },
                        bentuk_instrumen: { type: "string", description: "Instrument type" },
                      },
                      required: ["tujuan_pembelajaran", "kriteria_ketercapaian", "teknik_penilaian", "bentuk_instrumen"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["kktp_items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_kktp" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis, silakan tambah kredit." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const kktpItems = parsed.kktp_items;

    if (!kktpItems || kktpItems.length === 0) {
      throw new Error("AI returned empty KKTP");
    }

    // Insert into database
    const insertPayload = kktpItems.map((item: any) => ({
      atp_id,
      tujuan_pembelajaran: item.tujuan_pembelajaran,
      kriteria_ketercapaian: item.kriteria_ketercapaian,
      teknik_penilaian: item.teknik_penilaian,
      bentuk_instrumen: item.bentuk_instrumen,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("kktp")
      .insert(insertPayload)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Gagal menyimpan KKTP ke database");
    }

    return new Response(
      JSON.stringify({ success: true, count: inserted?.length || 0, data: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-kktp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
