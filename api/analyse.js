// api/analyse.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ─── Groq Helper ─────────────────────────────────────────────────────────────
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

function stripThink(text) {
    return (text ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ─── Beachhead Analysis Schema ────────────────────────────────────────────────
const ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        beachhead_customer: {
            type: "object",
            properties: {
                segment: { type: "string" },
                description: { type: "string" },
                why_first: { type: "string" }
            },
            required: ["segment", "description", "why_first"]
        },
        core_problem: {
            type: "object",
            properties: {
                statement: { type: "string" },
                evidence: { type: "string" },
                frequency: { type: "string" }
            },
            required: ["statement", "evidence", "frequency"]
        },
        recommended_solution: {
            type: "object",
            properties: {
                what_to_build: { type: "string" },
                rationale: { type: "string" },
                mvp_scope: { type: "string" }
            },
            required: ["what_to_build", "rationale", "mvp_scope"]
        },
        competitive_advantage: {
            type: "object",
            properties: {
                differentiator: { type: "string" },
                moat: { type: "string" }
            },
            required: ["differentiator", "moat"]
        },
        gtm_plan: {
            type: "object",
            properties: {
                first_100_customers: { type: "string" },
                channel: { type: "string" },
                hook: { type: "string" }
            },
            required: ["first_100_customers", "channel", "hook"]
        },
        risk_assessment: {
            type: "object",
            properties: {
                risks: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            risk: { type: "string" },
                            severity: { type: "string", enum: ["high", "medium", "low"] },
                            mitigation: { type: "string" }
                        },
                        required: ["risk", "severity", "mitigation"]
                    }
                }
            },
            required: ["risks"]
        },
        final_recommendation: {
            type: "object",
            properties: {
                verdict: { type: "string", enum: ["continue", "pivot", "abandon"] },
                reasoning: { type: "string" },
                next_step: { type: "string" }
            },
            required: ["verdict", "reasoning", "next_step"]
        },
        summary: {
            type: "object",
            properties: {
                primary_segment: { type: "string" },
                top_pain_points: { type: "array", items: { type: "string" } },
                market_opportunities: { type: "array", items: { type: "string" } },
                competitor_weaknesses: { type: "array", items: { type: "string" } },
                avg_spending: { type: "string" }
            },
            required: ["primary_segment", "top_pain_points", "market_opportunities", "competitor_weaknesses", "avg_spending"]
        }
    },
    required: [
        "beachhead_customer", "core_problem", "recommended_solution",
        "competitive_advantage", "gtm_plan", "risk_assessment",
        "final_recommendation", "summary"
    ]
};

const BEACHHEAD_SYSTEM = `You are Asha's strategic analysis engine, built by Mexuri for African founders.

You analyze survey responses using the Beachhead Strategy framework to help founders decide whether to continue, pivot, or abandon their idea.

ANALYSIS FRAMEWORK:
1. BEACHHEAD CUSTOMER — Who is the single most winnable customer segment right now?
2. CORE PROBLEM — What is the most painful, frequent problem this segment faces?
3. RECOMMENDED SOLUTION — What should the founder build FIRST (not everything — just the MVP)?
4. COMPETITIVE ADVANTAGE — What gives this founder an edge others can't easily copy?
5. GTM PLAN — How do you get the first 100 customers, specifically in the African market?
6. RISK ASSESSMENT — What are the 2-4 biggest risks discovered from the data?
7. FINAL RECOMMENDATION — Should the founder CONTINUE, PIVOT, or ABANDON?

RULES:
- Be ruthlessly specific. No vague platitudes.
- Reference actual patterns from the survey responses, not generic advice.
- Frame everything for the African market context.
- If there are no responses yet, base analysis on the survey questions and business idea only — clearly note this.
- Be honest. If the data shows weak demand, say so.

OUTPUT: Valid JSON only matching the provided schema. No markdown, no explanation text.`;

const CHAT_SYSTEM = `You are Asha, a sharp AI co-founder built by Mexuri for African founders.

You have been given full context of a validation survey including all responses. Answer the founder's questions about their data.

RULES:
- Be specific and data-driven. Reference actual response patterns.
- Keep answers concise but insightful.
- Think like a smart analyst, not a generic chatbot.
- If there are no responses, say so and help them think through next steps.
- Use casual, direct language. Skip the corporate speak.`;

// ─── Build context string from survey + responses ────────────────────────────
function buildContext(survey, responses) {
    const questions = survey.questions || [];
    let ctx = `SURVEY: "${survey.title}"\n`;
    if (survey.description) ctx += `Description: ${survey.description}\n`;

    ctx += `\nQUESTIONS:\n`;
    questions.forEach((q, i) => {
        ctx += `${i + 1}. [${q.type}] ${q.text}`;
        if (q.options) ctx += ` (options: ${q.options.join(", ")})`;
        ctx += "\n";
    });

    if (responses.length === 0) {
        ctx += "\nNo responses collected yet. Analyse based on the survey design and questions only.";
    } else {
        ctx += `\nRESPONSES (${responses.length} total):\n`;
        responses.forEach((r, ri) => {
            ctx += `\nRespondent ${ri + 1}:\n`;
            questions.forEach((q, qi) => {
                const ans = r.answers?.[q.id];
                if (ans !== undefined && ans !== "") {
                    ctx += `  Q${qi + 1} (${q.text}): ${Array.isArray(ans) ? ans.join(", ") : ans}\n`;
                }
            });
        });
    }

    return ctx;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { surveyId, messages, surveyContext } = req.body;

    // ── MODE 1: Chat (Ask Asha in responses panel) ───────────────────────────
    if (messages && Array.isArray(messages)) {
        console.log("[ANALYSE] Chat mode");
        try {
            const systemContent = surveyContext
                ? `${CHAT_SYSTEM}\n\nSURVEY CONTEXT:\n${surveyContext}`
                : CHAT_SYSTEM;

            const chatData = await groq(
                "llama-3.1-8b-instant",
                [{ role: "system", content: systemContent }, ...messages],
                { temperature: 0.6, max_tokens: 800 }
            );

            if (chatData.error) {
                const errMsg = chatData.error.message ?? "";
                if (chatData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                    return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
                }
                return res.json({ reply: "I couldn't analyse the data right now. Please try again." });
            }

            const reply = stripThink(chatData.choices?.[0]?.message?.content) || "I couldn't analyse the data right now.";
            return res.json({ reply });

        } catch (err) {
            console.error("[ANALYSE] Chat error:", err);
            return res.status(500).json({ reply: "Something went wrong. Please try again." });
        }
    }

    // ── MODE 2: Beachhead Analysis (AnalysisReport page) ────────────────────
    if (!surveyId) {
        return res.status(400).json({ error: "surveyId is required" });
    }

    console.log("[ANALYSE] Beachhead analysis for survey:", surveyId);

    try {
        // Fetch survey
        const { data: survey, error: surveyError } = await supabase
            .from("surveys")
            .select("id, title, description, questions")
            .eq("id", surveyId)
            .single();

        if (surveyError || !survey) {
            return res.status(404).json({ error: "Survey not found." });
        }

        // Fetch responses
        const { data: responses, error: respError } = await supabase
            .from("survey_responses")
            .select("id, answers, created_at")
            .eq("survey_id", surveyId)
            .order("created_at", { ascending: true });

        if (respError) {
            console.error("[ANALYSE] Responses fetch error:", respError);
            return res.status(500).json({ error: "Failed to fetch responses." });
        }

        const responseList = responses || [];
        const context = buildContext(survey, responseList);

        console.log("[ANALYSE] Running Beachhead analysis,", responseList.length, "responses");

        // Run analysis
        const analysisData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [
                { role: "system", content: BEACHHEAD_SYSTEM },
                { role: "user", content: context }
            ],
            {
                temperature: 0.3,
                max_tokens: 3000,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "beachhead_analysis",
                        schema: ANALYSIS_SCHEMA
                    }
                }
            }
        );

        if (analysisData.error) {
            const errMsg = analysisData.error.message ?? "";
            console.error("[ANALYSE] Groq error:", errMsg);
            if (analysisData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
            }
            return res.json({ error: "Analysis failed. Please try again." });
        }

        const content = analysisData.choices?.[0]?.message?.content;
        if (!content) {
            console.error("[ANALYSE] Empty response");
            return res.json({ error: "Empty response from model. Please try again." });
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[ANALYSE] JSON parse failed:", e.message);
            return res.json({ error: "Invalid analysis format. Please try again." });
        }

        // Save analysis to surveys table
        await supabase
            .from("surveys")
            .update({
                analysis: parsed,
                analysis_status: "done"
            })
            .eq("id", surveyId);

        console.log("[ANALYSE] Done. Verdict:", parsed.final_recommendation?.verdict);

        return res.json({
            analysis: parsed,
            responseCount: responseList.length
        });

    } catch (err) {
        console.error("[ANALYSE ERROR]", err);
        return res.status(500).json({ error: err.message || "Something went wrong" });
    }
}
