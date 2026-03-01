import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, person1_name, person1_attachment, person2_name, person2_attachment, situation } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const systemPrompt = `You are an expert couples therapist writing a detailed post-session report. You use Gottman Method and Emotionally Focused Therapy (EFT) frameworks.

PARTICIPANTS:
- "${person1_name}" — Attachment style: ${person1_attachment}
- "${person2_name}" — Attachment style: ${person2_attachment}

SITUATION: ${situation || "General relationship discussion"}

Analyze the entire conversation and produce a comprehensive report in this EXACT markdown structure:

# Session Summary

A 2-3 paragraph overview of the session — what was discussed, the emotional tone, and key moments.

## ${person1_name}'s Communication Analysis

### Attachment Pattern: ${person1_attachment}
- How their attachment style showed up in the conversation
- Specific examples from what they said
- Strengths in their communication
- Areas for growth

### What They Did Well
- Bullet points of positive communication moments

### Areas to Improve
- Bullet points with specific, actionable advice

## ${person2_name}'s Communication Analysis

### Attachment Pattern: ${person2_attachment}
- How their attachment style showed up in the conversation
- Specific examples from what they said
- Strengths in their communication
- Areas for growth

### What They Did Well
- Bullet points of positive communication moments

### Areas to Improve
- Bullet points with specific, actionable advice

## Relationship Dynamics

- The push-pull patterns observed
- How their attachment styles interact (e.g., anxious-avoidant trap)
- Moments of connection vs. disconnection
- The underlying emotional needs each person was expressing

## Recommendations

### For ${person1_name}
1. Numbered, specific recommendations

### For ${person2_name}
1. Numbered, specific recommendations

### For Both of You
1. Numbered, shared recommendations

## Key Takeaway

A powerful, memorable closing insight about their relationship.

IMPORTANT:
- Be specific — reference actual things they said
- Be compassionate but honest
- Explain attachment concepts in plain language
- Give actionable, practical advice
- Celebrate what went well`;

    const chatHistory = messages.map((m: { sender: string; sender_name: string; content: string }) => {
      if (m.sender === 'therapist') return { role: 'assistant', content: m.content };
      return { role: 'user', content: `[${m.sender_name}]: ${m.content}` };
    });

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
          ...chatHistory,
          { role: "user", content: "The session has ended. Please generate the full post-session report now." },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate report" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Report generation failed.";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("couples-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
