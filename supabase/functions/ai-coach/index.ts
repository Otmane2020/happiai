import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Message and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: conversationHistory } = await supabase
      .from("ai_interactions")
      .select("message_type, message_content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: habits } = await supabase
      .from("habits")
      .select("title, frequency, target_count, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(10);

    const { data: goals } = await supabase
      .from("goals")
      .select("title, target_value, current_value, unit, is_completed")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .limit(10);

    const { data: recentActivities } = await supabase
      .from("activities")
      .select("title, status, duration_minutes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const today = new Date().toISOString().split("T")[0];
    const { data: todayScore } = await supabase
      .from("happiness_scores")
      .select("overall_score, activity_score, mood_score, goal_score, habit_score")
      .eq("user_id", userId)
      .eq("score_date", today)
      .maybeSingle();

    const userName = profile?.full_name || "there";
    const userContext = `
User Name: ${userName}

Active Habits (${habits?.length || 0}):
${habits?.map(h => `- ${h.title} (${h.target_count}x ${h.frequency})`).join("\n") || "None"}

Current Goals (${goals?.length || 0}):
${goals?.map(g => `- ${g.title}: ${g.current_value}/${g.target_value} ${g.unit}`).join("\n") || "None"}

Recent Activities:
${recentActivities?.map(a => `- ${a.title} (${a.status})`).join("\n") || "None"}

Today's Happiness Score: ${todayScore?.overall_score || 0}%
${todayScore ? `(Activity: ${todayScore.activity_score}%, Mood: ${todayScore.mood_score}%, Goals: ${todayScore.goal_score}%, Habits: ${todayScore.habit_score}%)` : ""}
`;

    if (!OPENAI_API_KEY) {
      const fallbackResponses = [
        `Hi ${userName}! That's a great goal! Break it down into smaller, actionable steps. What's one thing you can do today to move forward?`,
        `I love your motivation, ${userName}! Remember, consistency is key. Even 10 minutes a day can make a huge difference.`,
        "Focus on progress, not perfection. Every small step counts toward your happiness journey!",
        "Have you considered scheduling this in your daily planner? Planning ahead increases your chances of success!",
        "Remember to celebrate your wins, no matter how small. Positive reinforcement is powerful!",
        `Based on your habits, you're making great progress! Keep up the momentum.`,
      ];

      const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      return new Response(
        JSON.stringify({ message: response }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const conversationMessages = conversationHistory?.slice(-10).map(msg => ({
      role: msg.message_type === "user" ? "user" : "assistant",
      content: msg.message_content,
    })) || [];

    const systemPrompt = `You are a supportive, motivational AI happiness coach for the Happi AI app named Happi. You know the user personally and remember all your conversations.

Your role:
- Help users plan their day and build better habits
- Provide personalized advice based on their goals and progress
- Celebrate wins and encourage during challenges
- Be concise (under 100 words), positive, and actionable
- Use emojis occasionally for warmth
- Reference their specific habits, goals, and recent activities when relevant
- Provide insights based on their happiness scores

Current User Context:
${userContext}

Remember: You've talked with this user before. Reference past conversations naturally when appropriate.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(openaiData.error?.message || "OpenAI API error");
    }

    const assistantMessage = openaiData.choices[0]?.message?.content ||
      `Hi ${userName}! I'm here to help! Tell me more about what you'd like to work on.`;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-coach function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "I'm having trouble right now. Try asking: 'How can I improve my morning routine?' or 'Help me set a fitness goal.'",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
