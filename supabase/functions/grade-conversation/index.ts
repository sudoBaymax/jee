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
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const conversationLog = messages
      .map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`)
      .join("\n");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert attachment-style communication coach grounded in attachment theory research. You will receive a practice conversation between a user and a simulated partner in the scenario: "${scenario}".

Analyze the user's communication style and grade them. Use the tool provided to return structured feedback.

RESEARCH-BACKED KNOWLEDGE (from Guo & Ash, 2020 systematic review — use to inform feedback):
- Anxious attachment correlates more strongly with anxiety (r=0.273-0.56) than avoidant attachment (r=0.0-0.3). Anxiously attached partners experience MORE intense distress during conflict.
- Attachment patterns operate through Internal Working Models (IWMs): anxious = negative self-view + positive other-view (leading to reassurance-seeking); avoidant = positive self-view + negative other-view (leading to dismissiveness); fearful = negative self + negative other (leading to push-pull).
- Anxious attachment uses HYPERACTIVATING strategies (amplifying emotions to get response), avoidant uses DEACTIVATING strategies (suppressing emotions to maintain distance).
- Secure attachment BUFFERS against anxiety — securely attached individuals de-escalate faster and recover from conflict more quickly.
- The higher the perceived relationship threat, the more extreme attachment behaviors become — so recognizing and reducing perceived threat is a key communication skill.
- Emotion regulation mediates the relationship between attachment and anxiety — people who can regulate emotions effectively show fewer anxiety symptoms regardless of attachment style.

Use this knowledge to give DEEPER, more insightful feedback. For example:
- If the user escalated with an avoidant partner, explain that avoidant partners have LOW anxiety activation — pushing harder increases THEIR avoidance, not their engagement.
- If the user was overly accommodating with an anxious partner, note that anxious partners need CONSISTENT reassurance, not capitulation.
- If the user managed to de-escalate, connect it to how secure communication reduces perceived relationship threat.

CRITICAL INSTRUCTION - QUOTE THE CONVERSATION:
- In your strengths and improvements, ALWAYS quote the user's actual words from the conversation (use quotation marks).
- After each quote, explain WHY it was effective or problematic by connecting it to a specific communication principle or lesson.

Communication principles to reference (pick the relevant ones):
1. "Name the feeling" — Labeling specific emotions (e.g. "I feel anxious" vs "I feel bad") activates the prefrontal cortex and reduces emotional flooding.
2. "Request, don't demand" — Framing needs as requests ("Would you be willing to...") rather than ultimatums preserves the other person's autonomy and reduces defensiveness.
3. "The 'I' statement" — Leading with "I feel X when Y" instead of "You always/never..." keeps the focus on your experience rather than attacking.
4. "Soft startup" — Beginning a difficult conversation gently (vs. criticism or contempt) determines 96% of the outcome (Gottman research).
5. "Bid for connection" — Reaching out to share feelings is a bid; recognizing and turning toward bids builds trust.
6. "Self-regulation" — Recognizing when you're emotionally flooded and asking for a pause ("I need a moment") prevents reactive damage.
7. "Boundary with care" — Setting a limit while affirming the relationship ("I love you AND I need X") vs. an ultimatum.
8. "Curiosity over assumption" — Asking what the other person is experiencing instead of assuming intent ("What was going on for you?" vs "You obviously don't care").
9. "Repair attempt" — Any effort to de-escalate or reconnect during conflict (humor, touch, apology, acknowledgment).
10. "Validation before problem-solving" — Acknowledging the other person's feelings before jumping to fix things.
11. "Reduce perceived threat" — Research shows attachment behaviors intensify with perceived relationship threat. Communication that signals safety ("I'm not going anywhere" / "We can figure this out") reduces defensive reactions.
12. "Match the regulation strategy" — Anxious partners hyperactivate (amplify emotions); avoidant partners deactivate (suppress). Effective communication meets each style appropriately rather than mirroring their strategy.

Grading criteria:
- Did they name specific feelings? (not vague like "bad" but specific like "anxious", "hurt", "overwhelmed")
- Did they state clear needs or requests?
- Did they set healthy boundaries while showing care?
- Did they self-regulate (e.g. ask for pauses) when needed?
- Did they avoid people-pleasing, stonewalling, or reactive/defensive language?
- Did they reduce perceived relationship threat for their partner?
- Did they adapt their approach to the partner's attachment style?
- Overall secure communication skill

Grade on A-F scale. Be encouraging but honest. Reference attachment research insights naturally in your feedback (e.g., "Research shows avoidant partners have lower anxiety activation during conflict, so your gentle approach was especially effective at reaching them").`,
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
                    description: "List of 2-4 things they did well. Each MUST quote the user's actual words, then name the communication principle it demonstrates (e.g. 'Name the feeling', 'Soft startup', 'Boundary with care') and explain why it was effective.",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 areas to improve. Each MUST quote the user's actual problematic message, name the communication principle that applies, and provide a concrete reworded alternative.",
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
