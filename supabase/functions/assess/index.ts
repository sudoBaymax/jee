import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, scores, lean } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const systemPrompt = `You are Dr. Sue Johnson meets Dr. Amir Levine — a world-class attachment theory expert. 
You will receive a user's ECR-R (Experiences in Close Relationships - Revised) assessment results.

The assessment uses TWO validated subscales:
- Anxiety subscale (fear of abandonment, need for reassurance) — items 1-10
- Avoidance subscale (discomfort with closeness, self-reliance) — items 11-20

Classification (based on median splits):
- Secure: low anxiety + low avoidance
- Anxious-Preoccupied: high anxiety + low avoidance  
- Dismissive-Avoidant: low anxiety + high avoidance
- Fearful-Avoidant (Disorganized): high anxiety + high avoidance

Analyze the raw item-level answers (1-7 scale) to identify nuanced patterns beyond the aggregate scores.
Consider which specific items scored highest/lowest and what that reveals about the person's relational patterns.`;

    const userPrompt = `Here are the user's ECR-R assessment results:

Raw answers (item number → score 1-7):
${JSON.stringify(answers, null, 2)}

Computed scores:
- Anxiety: ${scores.anxiety}/70 (${Math.round((scores.anxiety / 70) * 100)}%)
- Avoidance: ${scores.avoidance}/70 (${Math.round((scores.avoidance / 70) * 100)}%)
- Primary lean: ${lean}

Please analyze these results using the assess_attachment tool.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
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
        tools: [
          {
            type: "function",
            function: {
              name: "assess_attachment",
              description: "Return a structured attachment assessment analysis.",
              parameters: {
                type: "object",
                properties: {
                  narrative: {
                    type: "string",
                    description:
                      "A warm, 3-4 sentence personalized explanation of what the user's attachment style means in their daily life. Use second person ('you'). Be compassionate, not clinical.",
                  },
                  triggers: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "3-5 specific emotional triggers this person likely experiences based on their answer patterns. Be specific, not generic.",
                  },
                  patterns: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "3-4 relationship patterns this person likely exhibits. Frame as observations, not judgments.",
                  },
                  growthAreas: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "2-3 concrete, actionable growth areas tailored to this person's specific scores.",
                  },
                },
                required: ["narrative", "triggers", "patterns", "growthAreas"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assess_attachment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
