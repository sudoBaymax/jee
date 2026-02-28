import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenario, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationLog = messages
      .map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert attachment-style communication coach. You will receive a practice conversation between a user and a simulated partner in the scenario: "${scenario}".

Analyze the user's communication style and grade them. Use the tool provided to return structured feedback.

Grading criteria:
- Did they name specific feelings? (not vague like "bad" but specific like "anxious", "hurt", "overwhelmed")
- Did they state clear needs or requests?
- Did they set healthy boundaries while showing care?
- Did they self-regulate (e.g. ask for pauses) when needed?
- Did they avoid people-pleasing, stonewalling, or reactive/defensive language?
- Overall secure communication skill

Grade on A-F scale. Be encouraging but honest.`,
          },
          {
            role: "user",
            content: conversationLog,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "grade_conversation",
              description: "Return the grade and feedback for the practice conversation.",
              parameters: {
                type: "object",
                properties: {
                  overallGrade: {
                    type: "string",
                    enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"],
                    description: "Overall letter grade",
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence overall summary of their communication",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 specific things they did well with examples from the conversation",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 specific areas to improve with concrete suggestions",
                  },
                  rewriteExample: {
                    type: "string",
                    description: "Rewrite their weakest message in a more secure way as a learning example",
                  },
                },
                required: ["overallGrade", "summary", "strengths", "improvements", "rewriteExample"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "grade_conversation" } },
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grade = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(grade), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-conversation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
