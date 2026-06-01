// api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ─── System Prompts ──────────────────────────────────────────────────────────

const ASHA_SYSTEM = `You are Asha, an AI assistant made by Mexuri.

ABOUT MEXURI:
Mexuri is an AI research company focused on building technologies that drive socio-economic growth in Africa — starting with infrastructure.

YOUR ROLE:
You help African founders with:
- Business idea validation
- Market research and analysis
- Strategy and positioning
- Competitive intelligence
- African market insights

HOW YOU RESPOND:
- Short questions get short, direct answers (2–4 sentences max)
- Complex strategy or research questions get structured, detailed responses with headers and bullet points
- Always be sharp, insightful, and founder-focused
- Use African market context whenever relevant
- Never write code or build apps — you are a research and strategy assistant only
- Use markdown formatting where it adds clarity: bold key terms, use tables for comparisons, use headers for long responses

TONE:
Direct. Smart. Like a sharp co-founder who has done their research.

WHEN ASKED FOR CHARTS OR GRAPHS:
- NEVER output ASCII charts, tables, or text-based visualizations
- ALWAYS output a chart block in this EXACT format:
\`\`\`chart
{"type": "pie", "title": "Chart Title", "data": [{"name": "Label", "value": 100}]}
\`\`\`
- For bar charts use "type": "bar"
- The data array must have "name" and "value" keys only
- Output the chart block inline in your response, nothing else for the visualization`;

const CLASSIFIER_SYSTEM = `You are a classifier. Output ONLY one single word — no punctuation, no explanation, no whitespace.

The word must be exactly one of: research, chat

Rules:
- research = user wants market data, industry analysis, competitive intelligence, business intelligence, sector reports, or any data-driven research
- chat = everything else — idea validation, strategy questions, general business advice, greetings, follow-ups

Output the single word only.`;

const RESEARCH_SYSTEM = `You are Asha's research engine, built by Mexuri for African founders.

Deliver sharp, data-driven business intelligence. Be specific to the African market.

FORMAT:
- ## headers for major sections
- **bold** key terms and important figures
- Markdown tables for comparisons and data
- Chart blocks for quantitative data:
\`\`\`chart
{"type": "bar", "title": "Chart Title", "data": [{"name": "Label", "value": 100}]}
\`\`\`
- Use "pie" type for market share or composition data
- End every research response with: ## Bottom Line — 2–3 sharp, actionable takeaways for the founder

Be specific. Use real numbers where possible. Avoid vague generalities.

WHEN VISUALIZING DATA:
- NEVER use ASCII, text tables, or markdown tables for data that should be a chart
- ALWAYS use this exact format for charts:
\`\`\`chart
{"type": "bar", "title": "Title", "data": [{"name": "Label", "value": 100}]}
\`\`\`
- For composition/share data use "type": "pie"
- Only "name" and "value" keys in the data array`;

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

// ─── Strip think blocks (for models that output them) ────────────────────────
function stripThink(text) {
    return (text ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array required" });
    }

    try {

        // ── STEP 1: Get Asha's reply ─────────────────────────────────────────
        const chatData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [{ role: "system", content: ASHA_SYSTEM }, ...messages],
            { temperature: 0.65, max_tokens: 1024 }
        );

        // Rate limit check
        if (chatData.error) {
            const errMsg = chatData.error.message ?? "";
            console.error("[ASHA] Groq error:", errMsg);

            if (chatData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                const wait_time = parseWaitTime(errMsg);
                return res.status(200).json({ error_type: "rate_limit", wait_time });
            }

            return res.status(200).json({ reply: "I ran into an issue. Please try again." });
        }

        let reply = stripThink(chatData.choices?.[0]?.message?.content);

        if (!reply) {
            console.error("[ASHA] Empty reply:", JSON.stringify(chatData));
            return res.status(200).json({ reply: "I didn't get a response. Please try again." });
        }

        // ── STEP 2: Classify intent ──────────────────────────────────────────
        const classifyData = await groq(
            "llama-3.1-8b-instant",
            [{ role: "system", content: CLASSIFIER_SYSTEM }, ...messages],
            { temperature: 0, max_tokens: 10 }
        );

        const rawAction = classifyData.choices?.[0]?.message?.content ?? "";
        const action = stripThink(rawAction).toLowerCase().replace(/[^a-z]/g, "") || "chat";

        console.log("[CLASSIFIER] Raw:", JSON.stringify(rawAction), "→ Action:", action);

        // ── STEP 3: Research pipeline ────────────────────────────────────────
        if (action === "research") {
            console.log("[RESEARCH] Starting...");

            const researchData = await groq(
                "compound-beta",
                [
                    { role: "system", content: RESEARCH_SYSTEM },
                    { role: "user", content: messages[messages.length - 1].content },
                ],
                { temperature: 0.4, max_tokens: 2048 }
            );

            // Rate limit check for research step
            if (researchData.error) {
                const errMsg = researchData.error.message ?? "";
                console.error("[RESEARCH] Groq error:", errMsg);

                if (researchData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                    const wait_time = parseWaitTime(errMsg);
                    return res.status(200).json({ error_type: "rate_limit", wait_time });
                }

                // Fall back to Asha's regular reply if research fails
                return res.status(200).json({ reply, action: "chat" });
            }

            const researchReply = stripThink(researchData.choices?.[0]?.message?.content) || reply;
            console.log("[RESEARCH] Done, length:", researchReply.length);
            return res.status(200).json({ reply: researchReply, action });
        }

        // ── Default: return chat reply ───────────────────────────────────────
        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("[ERROR]", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}