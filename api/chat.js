import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

// ============================================================
// PROCESS 1 — REASONING
// Model: llama-3.3-70b-versatile
// Job: Understand the user's intent and classify it.
//      Expand vague requests into precise, actionable specs.
//      Output structured JSON only — no prose, no markdown.
// ============================================================
const REASONING_SYSTEM = `You are Asha's reasoning engine, built by Mexuri.

Your ONLY job is to read the user's latest message, understand their intent, and output a JSON decision object.

You do NOT answer questions. You do NOT build apps. You do NOT do research.
You ONLY classify and structure the request for the next process.

CLASSIFICATION:
- "build" → user wants any software created: app, tool, calculator, tracker, dashboard, form, game, website, widget
- "research" → user wants data, analysis, market research, industry landscape, competitor info, statistics, trends
- "chat" → greetings, follow-ups, general strategy advice, clarification questions

OUTPUT FORMAT — valid JSON only, no markdown, no backticks, no explanation:
{
  "action": "build" | "research" | "chat",
  "reply": "one short sentence acknowledging what you are about to do",
  "buildPrompt": "if action is build: a detailed technical spec covering layout, features, interactions, data flow. If not build: null",
  "researchQuery": "if action is research: a precise, targeted search query. If not research: null"
}

RULES:
- Base classification ONLY on the user's last message
- For build: expand the user's idea into a rich spec the execution engine can use directly
- For research: distill the user's question into a precise search query
- reply must be natural and conversational — one sentence max
- Return ONLY the JSON object. Nothing else.`;


// ============================================================
// PROCESS 2A — RESEARCH
// Model: groq/compound (has live web search)
// Job: Execute the research query from the reasoning engine.
//      Return structured, formatted intelligence.
// ============================================================
const RESEARCH_SYSTEM = `You are Asha's research engine, built by Mexuri.

You receive a targeted research query and return sharp, data-driven business intelligence for African founders.

OUTPUT RULES:
- Use ## headers to structure sections
- Use **bold** for key terms, companies, and figures
- Use markdown tables for comparisons, market share, rankings, or side-by-side data
- Use bullet points for lists of insights or recommendations
- When numeric data exists that can be visualized, output a chart block:

\`\`\`chart
{"type": "bar", "title": "Chart Title", "data": [{"name": "Label", "value": 100}]}
\`\`\`

- Use "type": "pie" for market share or distribution data
- Use "type": "bar" for comparisons, rankings, or trends over time
- Always end with a ## Bottom Line section with 2-3 sharp, actionable takeaways for an African founder
- Be factual, concise, and specific — no fluff`;


// ============================================================
// PROCESS 2B — EXECUTION
// Model: qwen/qwen3-32b (specialized code generation)
// Job: Receive the build spec from the reasoning engine
//      and generate a complete, styled, functional HTML app.
// ============================================================
const EXECUTION_SYSTEM = `You are Asha's execution engine, built by Mexuri.

You receive a detailed app specification and output a single complete HTML file.

STRICT OUTPUT RULES:
- Your response MUST start with <!DOCTYPE html> — the very first characters
- NO thinking text, NO explanation, NO markdown, NO backticks, NO code fences
- NEVER output Python, React, Vue, or any other language or framework
- ONE file only — all CSS and JS must be inline

DESIGN SYSTEM:
- Font: Inter from Google Fonts
- Background: #0f0f0f
- Surface (cards, panels): #1a1a1a  
- Text: #f0f0f0
- Accent (buttons, highlights): #7c5cfc
- Border radius: 12px for cards, 8px for buttons
- Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>

APP QUALITY RULES:
- Fully functional with vanilla JavaScript
- All interactions must work: forms submit, buttons respond, data updates
- Use localStorage for any data that should persist
- Mobile responsive layout
- Clean, minimal, modern UI — no gradients, no drop shadows unless subtle

OUTPUT: The complete HTML file. Nothing before <!DOCTYPE html>. Nothing after </html>.`;


// ============================================================
// HANDLER
// ============================================================
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: "Messages array required" });

    const lastMessage = messages[messages.length - 1].content;

    try {

        // ── REASONING ──────────────────────────────────────────
        console.log("[REASONING] Input:", lastMessage.slice(0, 120));

        const reasonRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [
                    { role: "system", content: REASONING_SYSTEM },
                    { role: "user", content: lastMessage },
                ],
                temperature: 0.1,
                max_tokens: 1024,
            }),
        });

        const reasonData = await reasonRes.json();
        let rawReason = reasonData.choices?.[0]?.message?.content ?? "{}";

        rawReason = rawReason.replace(/^```[\w]*\n?/i, "").replace(/```\s*$/i, "").trim();

        console.log("[REASONING] Output:", rawReason.slice(0, 300));

        let parsed;
        try {
            parsed = JSON.parse(rawReason);
        } catch {
            console.log("[REASONING] JSON parse failed, falling back to chat");
            parsed = { reply: rawReason, action: "chat", buildPrompt: null, researchQuery: null };
        }

        const reply = parsed.reply ?? "I'm here to help!";
        const action = parsed.action ?? "chat";
        const buildPrompt = parsed.buildPrompt ?? lastMessage;
        const researchQuery = parsed.researchQuery ?? lastMessage;

        console.log("[REASONING] Action:", action);


        // ── EXECUTION ──────────────────────────────────────────
        if (action === "build") {
            console.log("[EXECUTION] Building:", buildPrompt.slice(0, 150));

            const buildRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        { role: "system", content: EXECUTION_SYSTEM },
                        { role: "user", content: buildPrompt },
                    ],
                    temperature: 0.2,
                    max_tokens: 8192,
                }),
            });

            const buildData = await buildRes.json();
            let html = buildData.choices?.[0]?.message?.content ?? "";

            // Remove thinking blocks (qwen3 thinking mode)
            html = html.replace(/<think>[\s\S]*?<\/think>/gi, "");

            // Remove everything before <!DOCTYPE or <html
            const doctypeIndex = html.search(/<!DOCTYPE/i);
            const htmlTagIndex = html.search(/<html/i);
            const startIndex = doctypeIndex !== -1 ? doctypeIndex : htmlTagIndex;

            if (startIndex > 0) {
                html = html.slice(startIndex);
            }

            html = html.trim();

            console.log("[EXECUTION] HTML starts with:", html.slice(0, 80));

            if (html.includes("<!DOCTYPE") || html.includes("<html")) {
                const slug = generateSlug();
                await supabase.from("apps").insert({ slug, html, prompt: lastMessage });
                console.log("[EXECUTION] App saved with slug:", slug);
                return res.status(200).json({ reply, slug, action });
            } else {
                console.log("[EXECUTION] Failed. Raw output:", html.slice(0, 300));
                return res.status(200).json({
                    reply: "I tried to build that but something went wrong. Try describing it differently.",
                    action
                });
            }
        }


        // ── RESEARCH ───────────────────────────────────────────
        if (action === "research") {
            console.log("[RESEARCH] Query:", researchQuery.slice(0, 150));

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
                        { role: "user", content: researchQuery },
                    ],
                    temperature: 0.4,
                    max_tokens: 2048,
                }),
            });

            const researchData = await researchRes.json();
            const researchReply = researchData.choices?.[0]?.message?.content ?? reply;

            console.log("[RESEARCH] Done, length:", researchReply.length);
            return res.status(200).json({ reply: researchReply, action });
        }


        // ── CHAT ───────────────────────────────────────────────
        console.log("[CHAT] Returning reply");
        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("[ERROR]", error);
        return res.status(500).json({ error: error.message });
    }
}