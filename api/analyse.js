// api/analyse.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ─── Groq Fetch Helper ───────────────────────────────────────────────────────
async function groq(model, messages, options = {}) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model, messages, ...options }),
    });
    return res.json();
}

// ─── Rate Limit Parser ───────────────────────────────────────────────────────
function parseWaitTime(errorMessage) {
    const match = errorMessage?.match(/try again in ([0-9.]+)s/i);
    if (!match) return "a moment";
    const seconds = Math.ceil(parseFloat(match[1]));
    if (seconds >= 60) {
        const mins = Math.ceil(seconds / 60);
        return `${mins} minute${mins > 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

// ─── Beachhead Strategy System Prompt ────────────────────────────────────────
const BEACHHEAD_SYSTEM = `You are Asha's strategic analysis engine, built by Mexuri for African founders.

Your job: Analyse survey responses and produce a Beachhead Strategy report.

A Beachhead Strategy means: identify the smallest, most winnable market segment first, dominate it, then expand.

You MUST output valid JSON only. No markdown, no explanation, no preamble. Just the JSON object.

JSON SCHEMA:
{
  "summary": {
    "total_responses": number,
    "primary_segment": "string — who responded most / most engaged segment",
    "top_pain_points": ["string", "string", "string"],
    "top_desired_features": ["string", "string"],
    "avg_spending": "string — e.g. '₦2,000–₦5,000/week' or 'Unknown'",
    "competitor_weaknesses": ["string", "string"],
    "market_opportunities": ["string", "string"]
  },
  "beachhead_customer": {
    "profile": "string — 2–3 sentence description of who to target first",
    "why": "string — why this segment is the best entry point"
  },
  "core_problem": {
    "statement": "string — the single biggest validated pain point",
    "evidence": "string — quote or pattern from responses that proves this"
  },
  "recommended_solution": {
    "what_to_build": "string — the minimum product that solves the core problem",
    "rationale": "string — why this and not something else"
  },
  "competitive_advantage": {
    "differentiator": "string — how to stand out from what respondents currently use",
    "moat": "string — what makes this hard to copy once established"
  },
  "gtm_plan": {
    "first_100_customers": "string — specific, practical strategy to acquire first customers",
    "channel": "string — primary channel (WhatsApp, Instagram, in-person, B2B sales, etc)",
    "hook": "string — the offer or message that will convert the beachhead segment"
  },
  "risk_assessment": {
    "risks": [
      { "risk": "string", "severity": "high|medium|low", "mitigation": "string" }
    ]
  },
  "final_recommendation": {
    "verdict": "continue|pivot|abandon",
    "reasoning": "string — 2–3 sentences explaining the verdict",
    "next_step": "string — the single most important thing to do in the next 30 days"
  }
}

ANALYSIS RULES:
- Be specific and data-driven. Reference actual response patterns.
- If responses are sparse (<5), still give your best analysis but note low sample size in reasoning.
- Use African market context. Reference Lagos, Nairobi, Accra etc when relevant.
- Be honest. If the data suggests pivoting or abandoning, say so clearly.
- For avg_spending, extract from responses or say "Not directly measured".
- Competitor weaknesses come from what respondents hate about current alternatives.
- Market opportunities come from unmet needs expressed in responses.
- Risks must be specific — not generic "market risk" but "Payment infrastructure gaps in tier-2 cities may limit initial TAM".
- The verdict must be one of: continue, pivot, or abandon — no hedging.`;

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { surveyId, messages, surveyContext } = req.body;

    // ── Legacy chat-relay mode (keep working for Asha's attached survey chat) ─
    if (!surveyId && messages) {
        try {
            const response = await groq(
                "llama-3.3-70b-versatile",
                [
                    {
                        role: "system",
                        content: `You are Asha, an AI research assistant made by Mexuri. You help African founders understand their survey data.\n\n${surveyContext || ""}`,
                    },
                    ...messages,
                ],
                { temperature: 0.5, max_tokens: 800 }
            );

            if (response.error) {
                console.error("Groq error (chat mode):", response.error);
                return res.status(500).json({ reply: "I couldn't analyse the data right now." });
            }

            const reply = response.choices?.[0]?.message?.content || "I couldn't analyse the data right now.";
            return res.json({ reply });
        } catch (err) {
            console.error("Analyse handler error (chat mode):", err);
            return res.status(500).json({ reply: "Something went wrong. Please try again." });
        }
    }

    // ── Beachhead Strategy mode ───────────────────────────────────────────────
    if (!surveyId) {
        return res.status(400).json({ error: "surveyId is required" });
    }

    try {
        // 1. Fetch the survey
        const { data: survey, error: surveyError } = await supabase
            .from("surveys")
            .select("id, title, description, questions, business_idea")
            .eq("id", surveyId)
            .single();

        if (surveyError || !survey) {
            console.error("[ANALYSE] Survey fetch error:", surveyError);
            return res.status(404).json({ error: "Survey not found" });
        }

        // 2. Fetch all responses
        const { data: responses, error: responsesError } = await supabase
            .from("survey_responses")
            .select("answers, created_at")
            .eq("survey_id", surveyId)
            .order("created_at", { ascending: true });

        if (responsesError) {
            console.error("[ANALYSE] Responses fetch error:", responsesError);
            return res.status(500).json({ error: "Failed to fetch responses" });
        }

        const responseCount = responses?.length || 0;
        console.log(`[ANALYSE] Survey "${survey.title}" — ${responseCount} responses`);

        // 3. Mark analysis as running
        await supabase
            .from("surveys")
            .update({ analysis_status: "running" })
            .eq("id", surveyId);

        // 4. Build the analysis prompt
        let prompt = `SURVEY: "${survey.title}"\n`;
        if (survey.description) prompt += `DESCRIPTION: ${survey.description}\n`;
        if (survey.business_idea) prompt += `ORIGINAL BUSINESS IDEA: ${survey.business_idea}\n`;

        prompt += `\nSURVEY QUESTIONS:\n`;
        (survey.questions || []).forEach((q, i) => {
            prompt += `Q${i + 1} [${q.type}]: ${q.text}`;
            if (q.options) prompt += ` | Options: ${q.options.join(", ")}`;
            prompt += "\n";
        });

        prompt += `\nTOTAL RESPONSES: ${responseCount}\n`;

        if (responseCount === 0) {
            prompt += `\nNo responses collected yet. Base your analysis on the survey design, likely target market, and the business idea. Note this is a pre-response analysis.\n`;
        } else {
            prompt += `\nRESPONSE DATA:\n`;
            (responses || []).forEach((r, ri) => {
                prompt += `\nRespondent ${ri + 1}:\n`;
                const answers = r.answers || {};
                (survey.questions || []).forEach((q) => {
                    const answer = answers[q.id];
                    if (answer !== undefined && answer !== null && answer !== "") {
                        const displayAnswer = Array.isArray(answer) ? answer.join(", ") : String(answer);
                        prompt += `  ${q.text}: ${displayAnswer}\n`;
                    }
                });
            });
        }

        prompt += `\nNow generate the Beachhead Strategy JSON analysis.`;

        // 5. Call Groq for analysis
        const analysisData = await groq(
            "llama-3.3-70b-versatile",
            [
                { role: "system", content: BEACHHEAD_SYSTEM },
                { role: "user", content: prompt }
            ],
            {
                temperature: 0.3,
                max_tokens: 3000,
                response_format: { type: "json_object" }
            }
        );

        if (analysisData.error) {
            const errMsg = analysisData.error.message ?? "";
            console.error("[ANALYSE] Groq error:", errMsg);

            await supabase
                .from("surveys")
                .update({ analysis_status: "failed" })
                .eq("id", surveyId);

            if (analysisData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                const wait_time = parseWaitTime(errMsg);
                return res.status(200).json({ error_type: "rate_limit", wait_time });
            }

            return res.status(500).json({ error: "Analysis failed. Please try again." });
        }

        const content = analysisData.choices?.[0]?.message?.content;
        if (!content) {
            console.error("[ANALYSE] Empty response from Groq");
            await supabase.from("surveys").update({ analysis_status: "failed" }).eq("id", surveyId);
            return res.status(500).json({ error: "Empty response from model." });
        }

        let analysis;
        try {
            analysis = JSON.parse(content);
        } catch (e) {
            console.error("[ANALYSE] JSON parse failed:", e.message, content.slice(0, 200));
            await supabase.from("surveys").update({ analysis_status: "failed" }).eq("id", surveyId);
            return res.status(500).json({ error: "Invalid analysis format. Please try again." });
        }

        // 6. Save analysis back to survey row
        const { error: saveError } = await supabase
            .from("surveys")
            .update({
                analysis: analysis,
                analysis_status: "done",
            })
            .eq("id", surveyId);

        if (saveError) {
            console.error("[ANALYSE] Save error:", saveError);
            // Still return the analysis even if save fails
        }

        console.log(`[ANALYSE] Done — verdict: ${analysis.final_recommendation?.verdict}`);
        return res.status(200).json({ analysis, responseCount });

    } catch (error) {
        console.error("[ANALYSE ERROR]", error);
        await supabase
            .from("surveys")
            .update({ analysis_status: "failed" })
            .eq("id", surveyId)
            .catch(() => {});
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}
