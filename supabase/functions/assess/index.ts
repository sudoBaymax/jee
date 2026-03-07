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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const maxPerSubscale = Object.keys(answers).length <= 10 ? 35 : 70;

    const systemPrompt = `You are Dr. Sue Johnson meets Dr. Amir Levine — a world-class attachment theory expert. 
You will receive a user's ECR-R Short Form assessment results.

The assessment uses TWO validated subscales:
- Anxiety subscale (fear of abandonment, need for reassurance)
- Avoidance subscale (discomfort with closeness, self-reliance)

Classification (based on median splits):
- Secure: low anxiety + low avoidance
- Anxious-Preoccupied: high anxiety + low avoidance  
- Dismissive-Avoidant: low anxiety + high avoidance
- Fearful-Avoidant (Disorganized): high anxiety + high avoidance

Analyze the raw item-level answers (1-7 scale) to identify nuanced patterns beyond the aggregate scores.`;

    const userPrompt = `ECR-R assessment results:

Raw answers (item → score 1-7): ${JSON.stringify(answers)}

Scores:
- Anxiety: ${scores.anxiety}/${maxPerSubscale} (${Math.round((scores.anxiety / maxPerSubscale) * 100)}%)
- Avoidance: ${scores.avoidance}/${maxPerSubscale} (${Math.round((scores.avoidance / maxPerSubscale) * 100)}%)
- Primary lean: ${lean}

Analyze using the assess_attachment tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    description: "A warm, 3-4 sentence personalized explanation of the user's attachment style in daily life. Use 'you'. Be compassionate, not clinical.",
                  },
                  triggers: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 specific emotional triggers based on answer patterns.",
                  },
                  patterns: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 relationship patterns this person likely exhibits.",
                  },
                  growthAreas: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 concrete, actionable growth areas tailored to scores.",
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
