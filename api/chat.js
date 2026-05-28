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
// Job: Understand full conversation context, classify intent,
//      guide the user toward building, research, or chat.
// ============================================================
const REASONING_SYSTEM = `You are Asha, an AI business advisor and app builder built by Mexuri for African founders.

You have four modes:

1. CHAT — Answer business questions, give strategy advice, discuss ideas. Be sharp and concise. Use markdown where helpful.

2. RESEARCH — When the user wants market data, industry analysis, or business intelligence, set action to "research" and provide a targeted search query.

3. CLARIFY — When the user explicitly confirms they want something built ("yes build it", "go ahead", "create it", "make it"), ask 2-3 focused questions to gather requirements before building.

4. BUILD — Only trigger when the user has already answered your clarifying questions and you have enough detail to build. Never build on the first mention of an idea.

CONVERSATION RULES:
- If the user shares a vague idea ("I want a shoe app"), engage with it — give advice, ask about their target market, then naturally suggest "Want me to build a quick prototype?"
- If the user says yes to building → set action to "clarify", ask focused questions
- If the user has answered your questions with enough detail → set action to "build"
- NEVER set action to "build" on the first message about an idea
- Always be conversational and helpful — never robotic

OUTPUT — valid JSON only, no markdown wrapping, no backticks, no explanation outside the JSON:
{
  "action": "chat" | "research" | "clarify" | "build",
  "reply": "your full response — natural, well formatted with markdown headings, bullets, tables where relevant",
  "buildPrompt": "detailed technical spec only if action is build, otherwise null",
  "researchQuery": "targeted search query only if action is research, otherwise null"
}

The reply field is what the user sees. Make it excellent.`;


// ============================================================
// PROCESS 2A — RESEARCH
// Model: compound-beta (has live web search)
// Job: Execute the research query, return structured intelligence.
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
// Model: llama-3.3-70b-versatile
// Job: Receive build spec, generate complete single-file HTML app.
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
- Clean, minimal, modern UI — no gradients, no heavy shadows

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
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: REASONING_SYSTEM },
                    ...messages,
                ],
                temperature: 0.4,
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
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: EXECUTION_SYSTEM },
                        { role: "user", content: buildPrompt.slice(0, 800) },
                    ],
                    temperature: 0.2,
                    max_tokens: 4096,
                }),
            });

            const buildData = await buildRes.json();
            console.log("[EXECUTION] API response:", JSON.stringify(buildData).slice(0, 300));
            let html = buildData.choices?.[0]?.message?.content ?? "";

            // Strip thinking blocks
            html = html.replace(/<think>[\s\S]*?<\/think>/gi, "");

            // Find where actual HTML starts
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
                console.log("[EXECUTION] App saved:", slug);
                return res.status(200).json({ reply, slug, action });
            } else {
                console.log("[EXECUTION] Failed. Raw:", html.slice(0, 300));
                return res.status(200).json({
                    reply: "I tried to build that but hit an issue. Could you describe what you need in a bit more detail?",
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


        // ── CHAT / CLARIFY ─────────────────────────────────────
        console.log("[CHAT/CLARIFY] Returning reply");
        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("[ERROR]", error);
        return res.status(500).json({ error: error.message });
    }
}