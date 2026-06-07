// api/survey-draft.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ─── Survey JSON Schema for Groq structured output ───────────────────────────
const SURVEY_SCHEMA = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Short, specific survey title (max 50 chars). Should reflect the idea being validated."
        },
        description: {
            type: "string",
            description: "One sentence shown to respondents explaining what the survey is about."
        },
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    type: {
                        type: "string",
                        enum: ["text", "single_choice", "multi_choice", "rating"]
                    },
                    text: { type: "string" },
                    options: {
                        type: "array",
                        items: { type: "string" },
                        description: "Required for single_choice and multi_choice. Optional for others."
                    }
                },
                required: ["id", "type", "text"]
            },
            description: "6-8 questions mixing types. Focus on validating the specific idea."
        }
    },
    required: ["title", "description", "questions"]
};

const SURVEY_SYSTEM = `You are Asha's survey designer, built by Mexuri for African founders.

Your job: Generate a survey that validates a specific business idea or problem.

RULES:
- Generate exactly 6-8 questions
- Mix question types: text, single_choice, multi_choice, rating
- Questions must be specific to the founder's idea — no generic "how old are you" unless relevant
- Focus on: problem validation, willingness to pay, current alternatives, frequency of the problem
- Use simple, direct language. No jargon.
- For single_choice and multi_choice, provide 3-5 options each
- For rating questions, use 1-5 scale (1=low, 5=high)
- Question IDs must be "q1", "q2", "q3", etc.

EXAMPLE QUESTIONS FOR A LAGOS DELIVERY APP:
- "How often do you need same-day delivery in Lagos?" (single_choice: Daily, Weekly, Monthly, Never)
- "What's the biggest pain point with current delivery services?" (multi_choice: Too slow, Too expensive, Unreliable, Poor tracking, Other)
- "How much would you pay for guaranteed 2-hour delivery?" (single_choice: ₦500, ₦1000, ₦1500, ₦2000+, I wouldn't pay)
- "Rate how frustrating current delivery delays are (1=not frustrating, 5=extremely frustrating)" (rating)
- "Describe your ideal delivery experience in one sentence" (text)

OUTPUT FORMAT:
You MUST output valid JSON matching the provided schema. No markdown, no explanation, no conversational text.`;

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

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { idea, problem, targetUsers, businessContext, chatHistory } = req.body;

    if (!idea || !idea.trim()) {
        return res.status(400).json({ error: "Idea description is required" });
    }

    try {
        // Build context from chat history and business context
        let context = `IDEA TO VALIDATE: ${idea.trim()}`;
        if (problem?.trim()) context += `\n\nPROBLEM BEING SOLVED: ${problem.trim()}`;
        if (targetUsers?.trim()) context += `\n\nTARGET USERS: ${targetUsers.trim()}`;
        if (businessContext?.trim()) context += `\n\nFOUNDER CONTEXT: ${businessContext.trim()}`;

        if (chatHistory && chatHistory.length > 0) {
            const recent = chatHistory.slice(-6);
            context += `\n\nRECENT CONVERSATION:\n`;
            recent.forEach(m => {
                context += `${m.role === 'user' ? 'Founder' : 'Asha'}: ${m.content}\n`;
            });
        }

        console.log("[SURVEY DRAFT] Generating for idea:", idea.slice(0, 60));

        const surveyData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [
                { role: "system", content: SURVEY_SYSTEM },
                { role: "user", content: context }
            ],
            {
                temperature: 0.4,
                max_tokens: 2048,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "survey",
                        schema: SURVEY_SCHEMA
                    }
                }
            }
        );

        if (surveyData.error) {
            const errMsg = surveyData.error.message ?? "";
            console.error("[SURVEY DRAFT] Groq error:", errMsg);

            if (surveyData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                const wait_time = parseWaitTime(errMsg);
                return res.status(200).json({ error_type: "rate_limit", wait_time });
            }

            return res.status(200).json({ error: "Failed to generate survey. Please try again." });
        }

        const content = surveyData.choices?.[0]?.message?.content;
        if (!content) {
            console.error("[SURVEY DRAFT] Empty response:", JSON.stringify(surveyData));
            return res.status(200).json({ error: "Empty response from model." });
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[SURVEY DRAFT] JSON parse failed:", e.message, "Content:", content.slice(0, 200));
            return res.status(200).json({ error: "Invalid survey format generated. Please try again." });
        }

        // Validate structure
        if (!parsed.title || !parsed.description || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            console.error("[SURVEY DRAFT] Invalid structure:", JSON.stringify(parsed).slice(0, 200));
            return res.status(200).json({ error: "Invalid survey structure. Please try again." });
        }

        console.log("[SURVEY DRAFT] Success —", parsed.title, "—", parsed.questions.length, "questions");
        return res.status(200).json({ survey: parsed });

    } catch (error) {
        console.error("[SURVEY DRAFT ERROR]", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}