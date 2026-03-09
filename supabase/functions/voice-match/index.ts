import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Expanded ElevenLabs voice catalog with realistic accents, genders, and personalities
const voiceCatalog = [
  // MALE VOICES
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", traits: "male, 40s, american, confident, warm, deep baritone, steady, professional" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", traits: "male, late 20s, australian accent, casual, laid-back, natural, conversational, surfer-ish" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", traits: "male, 50s, british RP accent, warm, authoritative, refined, posh, steady" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", traits: "male, 30s, scottish-tinged, intense, slightly hoarse, deep, dramatic, brooding" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", traits: "male, late 20s, irish accent, articulate, warm, smooth, charming" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", traits: "male, mid 20s, american midwest, friendly, warm, approachable, boy-next-door" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", traits: "male, 40s, american, friendly, calm, warm, mature, fatherly" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", traits: "male, 30s, american, casual, laid-back, natural, conversational, everyman" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", traits: "male, 50s, american, deep bass, strong, narrating, authoritative, commanding" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", traits: "male, 40s, british accent, deep, authoritative, calm, news-anchor, composed" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", traits: "male, 60s, american southern, wise, deep, gravelly, storytelling, gruff" },

  // FEMALE VOICES
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", traits: "female, late 20s, american, soft, warm, friendly, calm, girl-next-door" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", traits: "female, mid 20s, american, gentle, soothing, slightly breathy, intimate, asmr-like" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", traits: "female, 40s, british accent, confident, clear, composed, warm, professional" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", traits: "female, mid 20s, american, warm, friendly, enthusiastic, bright, expressive" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", traits: "female, late 20s, american, expressive, upbeat, clear, engaging, valley-girl-adjacent" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", traits: "female, early 20s, british accent, warm, gentle, soft, youthful, sweet" },

  // NON-BINARY / AMBIGUOUS
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", traits: "nonbinary, mid 20s, american, smooth, confident, articulate, calm, androgynous" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { voiceDescription, scenario, attachmentStyle, backstory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const catalogText = voiceCatalog
      .map(v => `- ${v.name} (${v.id}): ${v.traits}`)
      .join("\n");

    const systemPrompt = `You are a voice-casting director. Given a description of a person and a relationship scenario, pick the SINGLE best matching voice from the catalog below.

VOICE CATALOG:
${catalogText}

MATCHING PRIORITIES (in order):
1. GENDER — match the requested gender first. Never pick a male voice for a female description or vice versa.
2. ACCENT — if an accent is specified (British, Australian, Irish, Southern, etc.), strongly prefer voices with that accent.
3. AGE — match the age range as closely as possible.
4. TONE & PERSONALITY — match the emotional quality (cold, warm, angry, gentle, condescending, etc.) to the voice traits.
5. SCENARIO CONTEXT — consider who this person is (a partner, parent, boss, friend) and their attachment style:
   - Avoidant = prefer calm, measured, slightly flat voices
   - Anxious = prefer expressive, warm, emotional voices
   - Fearful-avoidant = prefer variable, intense, dramatic voices
   - Secure = prefer warm, steady, grounded voices

Respond with ONLY a JSON object: {"voiceId": "<id>", "voiceName": "<name>", "reason": "<one sentence explaining why this voice fits the description>"}

Your reason should mention the specific traits that matched (e.g. "British accent matches the posh ex-boyfriend description" not just "best match").`;

    const userPrompt = `Voice description: "${voiceDescription || 'not specified'}"
Scenario: "${scenario || 'general conversation'}"
Attachment style: ${attachmentStyle || 'unknown'}
Backstory: ${backstory || 'none provided'}

Pick the best matching voice.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      // Smart fallback based on description
      const desc = (voiceDescription || '').toLowerCase();
      let fallback = voiceCatalog.find(v => v.name === "Sarah"); // default female
      if (desc.includes('male') || desc.includes('man') || desc.includes('guy') || desc.includes('boyfriend') || desc.includes('husband') || desc.includes('dad') || desc.includes('father') || desc.includes('boss') || desc.includes('he ')) {
        if (desc.includes('british') || desc.includes('posh')) fallback = voiceCatalog.find(v => v.name === "George");
        else if (desc.includes('australian') || desc.includes('aussie')) fallback = voiceCatalog.find(v => v.name === "Charlie");
        else if (desc.includes('irish')) fallback = voiceCatalog.find(v => v.name === "Liam");
        else if (desc.includes('old') || desc.includes('gruff') || desc.includes('dad') || desc.includes('father')) fallback = voiceCatalog.find(v => v.name === "Bill");
        else if (desc.includes('deep') || desc.includes('authoritative')) fallback = voiceCatalog.find(v => v.name === "Brian");
        else fallback = voiceCatalog.find(v => v.name === "Will");
      } else if (desc.includes('female') || desc.includes('woman') || desc.includes('girl') || desc.includes('girlfriend') || desc.includes('wife') || desc.includes('mom') || desc.includes('mother') || desc.includes('she ')) {
        if (desc.includes('british')) fallback = voiceCatalog.find(v => v.name === "Lily");
        else if (desc.includes('confident') || desc.includes('condescending')) fallback = voiceCatalog.find(v => v.name === "Alice");
        else if (desc.includes('expressive') || desc.includes('valley')) fallback = voiceCatalog.find(v => v.name === "Jessica");
        else fallback = voiceCatalog.find(v => v.name === "Sarah");
      }
      const f = fallback || voiceCatalog[0];
      return new Response(
        JSON.stringify({
          voiceId: f.id,
          voiceName: f.name,
          reason: `Matched based on description keywords — ${f.traits.split(', ').slice(0, 3).join(', ')}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceName: "Sarah",
          reason: "Could not parse AI response, using warm female default",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate voiceId exists in catalog
    const valid = voiceCatalog.find(v => v.id === result.voiceId);
    if (!valid) {
      result.voiceId = "EXAVITQu4vr4xnSDxMaL";
      result.voiceName = "Sarah";
      result.reason = "AI selected unknown voice, using default";
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-match error:", e);
    return new Response(
      JSON.stringify({
        voiceId: "EXAVITQu4vr4xnSDxMaL",
        voiceName: "Sarah",
        reason: "Error occurred, using default voice",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
