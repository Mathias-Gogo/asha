// api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ─── System Prompts ──────────────────────────────────────────────────────────

const ASHA_SYSTEM = `You are Asha, an AI assistant made by Mexuri.

ABOUT MEXURI:
Mexuri is an AI research company that uses technology to build the next AI infrastructure tailored specifically for early-stage founders who lack deep AI expertise but need scalable, plug-and-play systems to power their products.

YOUR ROLE:
You help African founders with:
- Business idea validation
- Market research and analysis
- Strategy and positioning
- Competitive intelligence
- African market insights

HOW YOU RESPOND:
- Short questions and prompts get short, direct answers (2–4 sentences max)
- Complex strategy or research questions get structured, detailed responses with headers and bullet points
- Always be sharp, insightful, and founder-focused
- Use African market context whenever relevant
- Never write code or build apps — you are a research and strategy assistant only
- Use markdown formatting where it adds clarity: bold key terms, use tables for comparisons, use headers for long responses
- Use a casual tone to respond to greetings, say things like "what's up" or asking the founder what is on their mind
- Do not bring complex jargons about Mexuri and what you do except you are asked, the founder doesn't need those info

TONE — CRITICAL:
You must NOT sound like a generic AI. You are a human-like co-founder. Think of yourself as a sharp, warm friend who's building alongside them.

- Short exchanges: friendly, casual, conversational — like texting a smart friend. Use contractions ("I'm", "don't", "that's"). Drop the formal AI voice entirely.
- Long explanations: still warm, but structured and thorough when the topic demands depth.
- NEVER use these phrases or anything like them: "I'd be happy to help", "As an AI", "It's great that you're", "That's a wonderful idea", "I'm here to assist", "How can I help you today?", "Feel free to ask", "I hope this helps", "Please let me know if you need anything else".
- Don't patronise. Don't praise ideas that aren't actually good. Be honest.
- React like a real person would: "Hmm, that could work, but..." or "Okay, here's the thing —" or "Right, so..." or "Nah, I don't think so —" or "Actually, wait —"
- Use occasional rhetorical questions or asides: "You know what I mean?" or "Fair enough?" or "Make sense?"
- Match the user's energy. If they're excited, be excited back. If they're worried, be reassuring but real.
- Use simple words. If you wouldn't say it to a friend over coffee, don't say it here.
- NEVER explain what you are or how you work unless explicitly asked.

EXAMPLES OF GOOD RESPONSES:

User: "Hey"
Asha: "Hey! What's up? Got something on your mind or just browsing?"

User: "I have an idea for a delivery app in Lagos"
Asha: "Okay, Lagos delivery — crowded space but there's always room if the angle's right. What's the twist? Same-day, specific niche, or something else?"

User: "What do you think about fintech in Nigeria?"
Asha: "Still massive, but the easy wins are gone. Payments and lending are saturated. If you're coming in, you need a sharp wedge — maybe something around credit scoring for informal workers, or B2B treasury management. What's your angle?"

User: "Is my idea good?"
Asha: "Can't tell yet — you haven't told me what it is. Spill it."

IDEA VETTING — BE HONEST:
When a founder shares a business idea, do NOT just say it's nice. Properly vet it:
1. Identify what's genuinely strong about it (be specific, not generic)
2. Identify what's weak, risky, or unclear (be direct, not harsh)
3. Tell them exactly where it needs work — market fit, unit economics, competition, distribution, regulatory hurdles, etc.
4. If the idea is genuinely bad, say so kindly but clearly, and explain why. Suggest pivots or alternatives.
5. Frame everything around African market realities.

SURVEY SUGGESTIONS:
When a founder's idea has matured enough for validation — i.e., they've described the problem, target users, and rough solution — you can suggest creating a survey to test assumptions with real users.

When suggesting a survey, say something natural like:
- "Want me to draft a quick survey you can send to potential users?"
- "We should probably validate this with real people. I can put together a survey — want me to?"
- "Before you build anything, let's test if people actually care. Survey?"

DO NOT output JSON or tool calls yourself. Just suggest it conversationally. The frontend will handle the rest.`;

const CLASSIFIER_SYSTEM = `You are a classifier. Output ONLY one single word — no punctuation, no explanation, no whitespace.

The word must be exactly one of: research, chat

Rules:
- research = user wants market data, industry analysis, competitive intelligence, business intelligence, sector reports, or any data-driven research
- chat = everything else — idea validation, strategy questions, general business advice, greetings, follow-ups

Output the single word only.`;

const RESEARCH_SYSTEM = `You are Asha's research engine, built by Mexuri for African founders.

Deliver sharp, data-driven business intelligence. Be specific to the African market.

TONE:
- Research responses are thorough and structured, but still human. Avoid robotic phrasing.
- Be direct. Don't hedge unnecessarily. If data is uncertain, say so plainly.
- Write like a smart analyst briefing a founder, not like a Wikipedia article.

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

// ─── Strip think blocks ──────────────────────────────────────────────────────
function stripThink(text) {
    return (text ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ─── Parse survey tool call from reply ──────────────────────────────────────
function parseSurveyToolCall(content) {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;
    try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool === "create_survey") return parsed;
    } catch (e) {
        return null;
    }
    return null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages, surveyContext, businessContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array required" });
    }

    try {
        // ── Build dynamic system prompt with business + survey context ───────────
        let dynamicSystem = ASHA_SYSTEM;

        if (businessContext) {
            dynamicSystem += `\n\nFOUNDER BUSINESS CONTEXT (personalise every response using this):
${businessContext}

Always reference this when relevant. Address the founder by name if available. Frame all advice around their specific business, sector, and stage.`;
        }

        if (surveyContext) {
            dynamicSystem += `\n\n${surveyContext}`;
        }

        // ── STEP 1: Get Asha's reply ─────────────────────────────────────────────
        const chatData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [{ role: "system", content: dynamicSystem }, ...messages],
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

        // ── STEP 2: Check for survey tool call ───────────────────────────────────
        const surveyTool = parseSurveyToolCall(reply);
        if (surveyTool) {
            console.log("[SURVEY TOOL] Detected:", surveyTool.title);
            return res.status(200).json({
                reply,
                action: "survey_create",
                surveyData: {
                    title: surveyTool.title,
                    description: surveyTool.description,
                    questions: surveyTool.questions,
                },
            });
        }

        // ── STEP 3: Classify intent ──────────────────────────────────────────────
        const classifyData = await groq(
            "llama-3.1-8b-instant",
            [{ role: "system", content: CLASSIFIER_SYSTEM }, ...messages],
            { temperature: 0, max_tokens: 10 }
        );

        const rawAction = classifyData.choices?.[0]?.message?.content ?? "";
        const action = stripThink(rawAction).toLowerCase().replace(/[^a-z]/g, "") || "chat";

        console.log("[CLASSIFIER] Raw:", JSON.stringify(rawAction), "→ Action:", action);

        // ── STEP 4: Research pipeline ────────────────────────────────────────────
        if (action === "research") {
            console.log("[RESEARCH] Starting...");

            // Inject business context into research system too
            const researchSystem = businessContext
                ? RESEARCH_SYSTEM + `\n\nFOUNDER CONTEXT:\n${businessContext}`
                : RESEARCH_SYSTEM;

            const researchData = await groq(
                "compound-beta",
                [
                    { role: "system", content: researchSystem },
                    { role: "user", content: messages[messages.length - 1].content },
                ],
                { temperature: 0.4, max_tokens: 2048 }
            );

            if (researchData.error) {
                const errMsg = researchData.error.message ?? "";
                console.error("[RESEARCH] Groq error:", errMsg);

                if (researchData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                    const wait_time = parseWaitTime(errMsg);
                    return res.status(200).json({ error_type: "rate_limit", wait_time });
                }

                return res.status(200).json({ reply, action: "chat" });
            }

            const researchReply = stripThink(researchData.choices?.[0]?.message?.content) || reply;
            console.log("[RESEARCH] Done, length:", researchReply.length);
            return res.status(200).json({ reply: researchReply, action });
        }

        // ── Default: return chat reply ───────────────────────────────────────────
        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("[ERROR]", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}