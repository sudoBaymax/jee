import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "POST") {
      const { emotion } = await req.json();
      if (!["happy", "frown", "crying", "blush"].includes(emotion)) {
        return new Response(JSON.stringify({ error: "Invalid emotion" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase
        .from("tamagotchi_emotion")
        .update({ emotion, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, emotion }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - for polling
    const { data, error } = await supabase
      .from("tamagotchi_emotion")
      .select("emotion, updated_at")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
