import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisResult {
  overall_score: number;
  keyword_score: number;
  format_score: number;
  language_score: number;
  missing_keywords: string[];
  keyword_suggestions: string[];
  format_issues: string[];
  format_suggestions: string[];
  language_issues: string[];
  action_verb_suggestions: string[];
  general_recommendations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, fileName } = await req.json();

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: "Resume text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has 5 analyses and delete the oldest if so
    const { data: existingAnalyses } = await supabase
      .from("analyses")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (existingAnalyses && existingAnalyses.length >= 5) {
      // Delete the oldest analysis
      const oldestId = existingAnalyses[existingAnalyses.length - 1].id;
      await supabase.from("analyses").delete().eq("id", oldestId);
    }

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Your job is to analyze resumes and provide detailed, actionable feedback to help job seekers optimize their resumes for ATS systems.

Analyze the resume and provide a JSON response with the following structure:
{
  "overall_score": number (0-100),
  "keyword_score": number (0-100),
  "format_score": number (0-100),
  "language_score": number (0-100),
  "missing_keywords": string[] (important keywords missing from the resume),
  "keyword_suggestions": string[] (industry keywords to add),
  "format_issues": string[] (formatting problems that may affect ATS parsing),
  "format_suggestions": string[] (how to improve structure and formatting),
  "language_issues": string[] (weak language, passive voice, etc.),
  "action_verb_suggestions": string[] (strong action verbs to use),
  "general_recommendations": string[] (top 3-5 actionable tips)
}

Consider these factors in your analysis:
1. Keyword optimization - Are relevant industry keywords present?
2. Formatting - Is the resume using ATS-friendly formatting (no tables, images, headers/footers)?
3. Section structure - Are standard sections present (Contact, Summary, Experience, Education, Skills)?
4. Quantifiable achievements - Are accomplishments measured with numbers?
5. Action verbs - Does each bullet point start with a strong action verb?
6. Length - Is the resume an appropriate length?
7. Consistency - Are dates, formatting, and style consistent throughout?

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations outside the JSON.`;

    let userPrompt = `Please analyze this resume:\n\n${resumeText}`;
    if (jobDescription) {
      userPrompt += `\n\nThe candidate is applying for a position with this job description:\n\n${jobDescription}\n\nPlease provide targeted keyword analysis based on this job description.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to get AI analysis");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let analysisResult: AnalysisResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      analysisResult = JSON.parse(cleanContent.trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis response");
    }

    // Save to database
    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        file_name: fileName || "Resume.pdf",
        overall_score: analysisResult.overall_score,
        keyword_score: analysisResult.keyword_score,
        format_score: analysisResult.format_score,
        language_score: analysisResult.language_score,
        missing_keywords: analysisResult.missing_keywords || [],
        keyword_suggestions: analysisResult.keyword_suggestions || [],
        format_issues: analysisResult.format_issues || [],
        format_suggestions: analysisResult.format_suggestions || [],
        language_issues: analysisResult.language_issues || [],
        action_verb_suggestions: analysisResult.action_verb_suggestions || [],
        general_recommendations: analysisResult.general_recommendations || [],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save analysis results");
    }

    return new Response(
      JSON.stringify({ analysisId: analysis.id, ...analysisResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
