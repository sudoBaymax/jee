import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ElevenLabs voice catalog with traits for matching
const voiceCatalog = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", traits: "male, middle-aged, american, confident, warm, deep, steady" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", traits: "female, young adult, american, soft, warm, friendly, calm" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", traits: "female, young adult, american, gentle, soothing, slightly breathy" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", traits: "male, young adult, australian, casual, natural, relaxed, conversational" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", traits: "male, middle-aged, british, warm, authoritative, refined, steady" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", traits: "male, young adult, transatlantic, intense, hoarse, deep, dramatic" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", traits: "nonbinary, young adult, american, smooth, confident, articulate, calm" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", traits: "male, young adult, american, articulate, neutral, professional" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", traits: "female, middle-aged, british, confident, clear, composed, warm" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", traits: "female, young adult, american, warm, friendly, enthusiastic, bright" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", traits: "male, young adult, american, friendly, warm, approachable, natural" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", traits: "female, young adult, american, expressive, upbeat, clear, engaging" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", traits: "male, middle-aged, american, friendly, calm, warm, mature" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", traits: "male, middle-aged, american, casual, laid-back, natural, conversational" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", traits: "male, middle-aged, american, deep, strong, narrating, authoritative" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", traits: "male, middle-aged, british, deep, authoritative, calm, news-anchor" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", traits: "female, young adult, british, warm, gentle, soft, youthful" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", traits: "male, older, american, wise, deep, gravelly, storytelling" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { voiceDescription, scenario, attachmentStyle, backstory } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

    const catalogText = voiceCatalog
      .map(v => `- ${v.name} (${v.id}): ${v.traits}`)
      .join("\n");

    const systemPrompt = `You are a voice-matching expert. Given a description of a person and a relationship scenario, pick the SINGLE best matching voice from the catalog below.

VOICE CATALOG:
${catalogText}

Consider ALL of the following when matching:
1. The voice description the user provided (gender, age, accent, tone, energy)
2. The scenario context (who is this person — a partner, parent, boss, friend?)
3. The attachment style (avoidant = quieter/flatter, anxious = more expressive/emotional, fearful = variable, secure = warm/steady)
4. The backstory details (any clues about age, background, personality)

Respond with ONLY a JSON object: {"voiceId": "<id>", "voiceName": "<name>", "reason": "<one sentence why this voice fits>"}`;

    const userPrompt = `Voice description: "${voiceDescription || 'not specified'}"
Scenario: "${scenario || 'general conversation'}"
Attachment style: ${attachmentStyle || 'unknown'}
Backstory: ${backstory || 'none provided'}

Pick the best matching voice.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
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
      // Fallback to a reasonable default
      return new Response(
        JSON.stringify({
          voiceId: "iP95p4xoKVk53GoZ742B",
          voiceName: "Chris",
          reason: "Default fallback — casual male voice",
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
          voiceId: "iP95p4xoKVk53GoZ742B",
          voiceName: "Chris",
          reason: "Could not parse AI response, using default",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate voiceId exists in catalog
    const valid = voiceCatalog.find(v => v.id === result.voiceId);
    if (!valid) {
      result.voiceId = "iP95p4xoKVk53GoZ742B";
      result.voiceName = "Chris";
      result.reason = "AI selected unknown voice, using default";
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-match error:", e);
    return new Response(
      JSON.stringify({
        voiceId: "iP95p4xoKVk53GoZ742B",
        voiceName: "Chris",
        reason: "Error occurred, using default voice",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
