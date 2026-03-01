import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Curated voice options with descriptions for AI matching
const voiceOptions = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", desc: "Confident middle-aged American male, warm baritone" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: "Soft young American female, gentle and warm" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", desc: "Mature American female, clear and professional" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", desc: "Young Australian male, casual and friendly" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", desc: "British male, warm and authoritative" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", desc: "Young Scottish male, energetic" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", desc: "Non-binary American, calm and soothing" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", desc: "Young American male, natural and articulate" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", desc: "British female, crisp and confident" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", desc: "Warm Australian female, friendly" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", desc: "Young American male, friendly and upbeat" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", desc: "Young American female, expressive and emotional" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", desc: "Middle-aged American male, deep and gravelly" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", desc: "Middle-aged American male, smooth and steady" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", desc: "Deep American male, authoritative narrator" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "British male, deep and commanding" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", desc: "British female, warm and nurturing" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", desc: "Older American male, gruff and direct" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { voiceDescription, scenario, backstory, attachmentStyle, speechQuirks } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const voiceListStr = voiceOptions.map(v => `- ${v.id}: ${v.name} — ${v.desc}`).join("\n");

    const prompt = `You are a voice casting director. Based on the following context, pick the BEST matching voice from the available options.

CONTEXT:
- Scenario: ${scenario || "not specified"}
- Backstory: ${backstory || "not specified"}
- Attachment style of the person: ${attachmentStyle || "not specified"}
- User's description of their voice: ${voiceDescription || "not specified"}
- Speech quirks: ${speechQuirks?.join(", ") || "none specified"}

AVAILABLE VOICES:
${voiceListStr}

INSTRUCTIONS:
- Consider the gender, age, tone, and personality implied by the scenario and description
- Match the voice that would sound most like the person described
- Also recommend voice_settings adjustments (stability 0-1, similarity_boost 0-1, style 0-1, speed 0.7-1.2) to better match the description
- For someone who sounds tired/low energy: lower speed, higher stability
- For someone emotional/expressive: lower stability, higher style
- For someone cold/distant: higher stability, lower style

Respond with ONLY valid JSON (no markdown, no explanation):
{"voiceId": "the_id", "voiceName": "the_name", "stability": 0.5, "similarityBoost": 0.75, "style": 0.3, "speed": 1.0, "reasoning": "one sentence why"}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      // Fallback: return a default voice
      return new Response(JSON.stringify({
        voiceId: "JBFqnCBsd6RMkjVDRZzb",
        voiceName: "George",
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.3,
        speed: 1.0,
        reasoning: "Default fallback voice",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle possible markdown wrapping)
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse voice match response:", content);
      result = {
        voiceId: "JBFqnCBsd6RMkjVDRZzb",
        voiceName: "George",
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.3,
        speed: 1.0,
        reasoning: "Fallback due to parse error",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
