import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

const ASHA_SYSTEM = `You are Asha, an AI co-founder and app builder built by Mexuri for African founders.

You help founders with business strategy, market research, and building software prototypes.

HOW YOU WORK:
- For business questions, give sharp, concise advice focused on the African market
- For market research requests, provide structured analysis with tables and data
- If someone asks you to build or create an app, respond ONLY with a short confirmation like "Got it — building that for you now." Do NOT write any code yourself.
- Use markdown formatting: headers, bullets, bold text, tables where relevant
- Be conversational, smart, and direct — like a sharp co-founder`;

const CLASSIFIER_SYSTEM = `You are a classifier. You must output ONLY one single word with zero punctuation, zero explanation, and zero whitespace.

The word must be exactly one of these three: build, research, chat

Rules:
- build = user wants to create, build, make, or generate any app, tool, calculator, dashboard, or website
- research = user wants market data, industry analysis, or business intelligence
- chat = everything else

IMPORTANT: Output the single word only. No period. No quotes. No newline. Just the word.`;

const EXECUTION_SYSTEM = `You are an HTML web app generator. Output a single complete HTML file.

STRICT RULES:
- Start with <!DOCTYPE html> — nothing before it
- NO markdown, NO backticks, NO explanation, NO code fences
- Use Inter font from Google Fonts
- Background: #0f0f0f, Text: #f0f0f0, Accent: #7c5cfc, Surface: #1a1a1a
- Border radius: 12px cards, 8px buttons
- Import Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- Fully functional vanilla JavaScript
- localStorage for persistence
- Mobile responsive
- Output ONLY the HTML file`;

const RESEARCH_SYSTEM = `You are Asha's research engine built by Mexuri. Give sharp, data-driven business intelligence for African founders.

FORMAT:
- ## headers for sections
- **bold** key terms
- Markdown tables for comparisons
- Chart blocks for data:
\`\`\`chart
{"type": "bar", "title": "Title", "data": [{"name": "Label", "value": 100}]}
\`\`\`
- End with ## Bottom Line — 2-3 actionable takeaways`;

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: "Messages array required" });

    try {

        // ── STEP 1: Get Asha's reply ────────────────────────────
        const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "qwen/qwen3-32b",
                messages: [
                    { role: "system", content: ASHA_SYSTEM },
                    ...messages,
                ],
                temperature: 0.6,
                max_tokens: 1024,
            }),
        });

        const chatData = await chatRes.json();
        if (chatData.error) {
            console.log("[ASHA] Groq error:", JSON.stringify(chatData.error));
            return res.status(200).json({ reply: "I ran into an issue. Please try again.", action: "chat" });
        }

        let reply = chatData.choices?.[0]?.message?.content;
        if (reply) reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        if (!reply) {
            console.log("[ASHA] Empty reply. Full response:", JSON.stringify(chatData));
            return res.status(200).json({ reply: "I didn't get a response. Please try again.", action: "chat" });
        }


        // ── STEP 2: Classify intent ─────────────────────────────
        const classifyRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "qwen/qwen3-32b",
                messages: [
                    { role: "system", content: CLASSIFIER_SYSTEM },
                    ...messages,
                ],
                temperature: 0.1,
                max_tokens: 10,
                reasoning_effort: "none",
            }),
        });

        const classifyData = await classifyRes.json();
        const rawAction = classifyData.choices?.[0]?.message?.content ?? "";
        const stripped = rawAction.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const action = stripped.toLowerCase().replace(/[^a-z]/g, "") || "chat";

        console.log("[CLASSIFIER] Raw:", JSON.stringify(rawAction), "→ Action:", action);

        // ── STEP 3: Execute if needed ───────────────────────────
        if (action === "build") {
            console.log("[EXECUTION] Starting build...");

            const buildRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "qwen/qwen3-32b",
                    messages: [
                        { role: "system", content: EXECUTION_SYSTEM },
                        { role: "user", content: messages.map(m => m.content).join("\n") },
                    ],
                    temperature: 0.2,
                    max_tokens: 4096,
                }),
            });

            const buildData = await buildRes.json();
            let html = buildData.choices?.[0]?.message?.content ?? "";

            html = html.replace(/<think>[\s\S]*?<\/think>/gi, "");

            const doctypeIndex = html.search(/<!DOCTYPE/i);
            const htmlTagIndex = html.search(/<html/i);
            const startIndex = doctypeIndex !== -1 ? doctypeIndex : htmlTagIndex;
            if (startIndex > 0) html = html.slice(startIndex);
            html = html.trim();

            console.log("[EXECUTION] HTML starts with:", html.slice(0, 60));

            if (html.includes("<!DOCTYPE") || html.includes("<html")) {
                const slug = generateSlug();
                await supabase.from("apps").insert({ slug, html, prompt: messages[messages.length - 1].content });
                console.log("[EXECUTION] Saved:", slug);
                return res.status(200).json({ reply, slug, action });
            } else {
                console.log("[EXECUTION] Failed:", html.slice(0, 200));
            }
        }

        if (action === "research") {
            console.log("[RESEARCH] Starting...");

            const researchRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "compound-beta",
                    messages: [
                        { role: "system", content: RESEARCH_SYSTEM },
                        { role: "user", content: messages[messages.length - 1].content },
                    ],
                    temperature: 0.4,
                    max_tokens: 2048,
                }),
            });

            const researchData = await researchRes.json();
            let researchReply = researchData.choices?.[0]?.message?.content ?? reply;
            researchReply = researchReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            console.log("[RESEARCH] Done:", researchReply.length);
            return res.status(200).json({ reply: researchReply, action });
        }

        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("[ERROR]", error);
        return res.status(500).json({ error: error.message });
    }
}