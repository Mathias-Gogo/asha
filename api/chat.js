import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

const REASONING_SYSTEM = `You are Asha's reasoning engine built by Mexuri. You analyze user requests and decide what to do.

Always respond in this exact JSON format, no extra text:
{
  "reply": "natural conversational response to show the user",
  "action": "chat" or "build" or "research",
  "buildPrompt": "highly detailed app specification if action is build, otherwise null",
  "researchQuery": "specific search query if action is research, otherwise null"
}

Action rules:
- "build" — user wants to create any software, app, tool, dashboard, form, game, calculator
- "research" — user wants market data, industry analysis, competitor research, business landscape
- "chat" — general business advice, strategy, questions

For "build", expand buildPrompt into a detailed spec: layout, features, data it handles, interactions.
For "research", make researchQuery specific and targeted.
Only return valid JSON.`;

const EXECUTION_SYSTEM = `You are an HTML web app generator for Mexuri. Your ONLY job is to output a complete single-file HTML web app.

STRICT RULES:
- Start with <!DOCTYPE html> — nothing before it, no backticks, no explanation, no thinking
- NEVER output Python, React, markdown, code fences, or any other language
- Use Inter font from Google Fonts
- Color scheme: background #0f0f0f, text #f0f0f0, accent #7c5cfc, surface #1a1a1a
- Border radius: 12px cards, 8px buttons
- Clean, minimal, modern design
- Import Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Fully functional with vanilla JavaScript
- Output ONLY the HTML. Nothing else. No thinking. No explanation.`;

const RESEARCH_SYSTEM = `You are Asha's research engine built by Mexuri. You provide sharp, data-driven business intelligence for African founders.
Be concise, factual, and focused on actionable insights for the African market.
Use markdown formatting with headers, bullet points, and bold key terms.`;

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: "Messages array required" });

    const lastMessage = messages[messages.length - 1].content;

    try {
        // REASONING — llama decides what to do
        console.log("Reasoning about:", lastMessage);

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
        const rawReason = reasonData.choices?.[0]?.message?.content ?? "{}";

        console.log("Reasoning output:", rawReason.slice(0, 200));

        let parsed;
        try {
            parsed = JSON.parse(rawReason);
        } catch {
            parsed = { reply: rawReason, action: "chat", buildPrompt: null, researchQuery: null };
        }

        const reply = parsed.reply ?? "I'm here to help!";
        const action = parsed.action ?? "chat";
        const buildPrompt = parsed.buildPrompt ?? lastMessage;
        const researchQuery = parsed.researchQuery ?? lastMessage;

        console.log("Action decided:", action);

        // EXECUTION — qwen builds the app
        if (action === "build") {
            console.log("Executing build for:", buildPrompt.slice(0, 100));

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
                        { role: "user", content: buildPrompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 8192,
                }),
            });

            const buildData = await buildRes.json();
            let html = buildData.choices?.[0]?.message?.content ?? "";

            html = html.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            html = html.replace(/^```[\w]*\n?/i, "").replace(/```\s*$/i, "").trim();

            console.log("HTML starts with:", html.slice(0, 50));

            if (html.includes("<!DOCTYPE") || html.includes("<html")) {
                const slug = generateSlug();
                await supabase.from("apps").insert({ slug, html, prompt: lastMessage });
                console.log("App saved:", slug);
                return res.status(200).json({ reply, slug, action });
            } else {
                console.log("Build failed, raw:", html.slice(0, 300));
                return res.status(200).json({ reply: reply + " (App generation failed, please try again.)", action });
            }
        }

        // RESEARCH — llama with compound-beta for web search
        if (action === "research") {
            console.log("Researching:", researchQuery);

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
                    temperature: 0.5,
                    max_tokens: 2048,
                }),
            });

            const researchData = await researchRes.json();
            const researchReply = researchData.choices?.[0]?.message?.content ?? reply;

            return res.status(200).json({ reply: researchReply, action });
        }

        // CHAT — just return the reply
        return res.status(200).json({ reply, action });

    } catch (error) {
        console.error("Handler error:", error);
        return res.status(500).json({ error: error.message });
    }
}