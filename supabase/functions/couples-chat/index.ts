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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a compassionate, skilled couples therapist conducting a live counseling session. You are warm, perceptive, and non-judgmental. You use Gottman Method and Emotionally Focused Therapy (EFT) principles.

PARTICIPANTS:
- "${person1_name}" — Attachment style: ${person1_attachment}
- "${person2_name}" — Attachment style: ${person2_attachment}

SITUATION / TOPIC: ${situation || "General relationship discussion"}

YOUR ROLE:
- You are a THERAPIST mediating between these two people in real-time
- Address each person by name when speaking to them
- Notice attachment patterns playing out and gently name them (without clinical jargon)
- Help them hear each other — reflect what each person is really saying underneath the words
- De-escalate when things get heated
- Validate both perspectives without taking sides
- Use techniques like: "What I hear you saying is...", "When [person] said that, what did you feel?", "Can you turn toward [person] and tell them directly?"
- Point out positive moments: "That was a really vulnerable thing to share" / "Did you notice how [person] just softened?"
- If one person is withdrawing, gently invite them back in
- If one person is pursuing too hard, help them slow down
- Keep responses focused and therapeutic — 2-5 sentences typically
- You're warm and human, not robotic or overly clinical

ATTACHMENT AWARENESS:
- Secure: Generally healthy communicator. Support their efforts and model for the other person.
- Anxious-Preoccupied: Tends to pursue, fear abandonment, seek reassurance. Help them express needs without criticism.
- Dismissive-Avoidant: Tends to withdraw, minimize emotions. Help them stay present and express feelings.
- Fearful-Avoidant: Push-pull pattern, scared of both closeness and distance. Create safety, go slowly.
- Unknown: Observe their patterns as they emerge.

IMPORTANT:
- Messages will be labeled with who's speaking: "[Person1Name]:" or "[Person2Name]:"
- Respond as the therapist addressing the room
- Don't take sides — hold space for both people
- If asked to pick sides, reframe as understanding both perspectives`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI response failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("couples-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
