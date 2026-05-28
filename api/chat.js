import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

const MEXURI_TEMPLATE = `You are an HTML web app generator. Your ONLY job is to output a complete single-file HTML web app.
STRICT RULES:
- Your response must start with <!DOCTYPE html> — nothing before it, no backticks, no explanation
- NEVER output Python, markdown, code fences, or any language other than HTML
- Use Inter font from Google Fonts
- Color scheme: background #0f0f0f, text #f0f0f0, accent #7c5cfc, surface #1a1a1a
- Border radius: 12px cards, 8px buttons
- Clean, minimal, modern design
- Import Tailwind from CDN: <script src="https://cdn.tailwindcss.com"></script>
- Make the app fully functional with vanilla JavaScript
- Output ONLY the HTML file. Nothing else.`;

const ASHA_SYSTEM = `You are Asha, an AI business advisor and app builder built by Mexuri to help African founders.
When a user asks you to build an app, respond with exactly one sentence confirming you are building it, like: "Sure, building your expense tracker now!"
For all other questions, give sharp, concise business advice focused on the African market.`;

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: "Messages array required" });

    const lastMessage = messages[messages.length - 1].content;

    const isAppRequest =
        /build|create|make|generate|develop/i.test(lastMessage) &&
        /app|tool|calculator|tracker|dashboard|form|game|website|page|list|widget/i.test(lastMessage);

    console.log("Last message:", lastMessage);
    console.log("Is app request:", isAppRequest);

    try {
        // Step 1 — Asha conversational reply
        const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: ASHA_SYSTEM },
                    ...messages,
                ],
                temperature: 0.7,
                max_tokens: 512,
            }),
        });

        const chatData = await chatRes.json();
        const reply = chatData.choices?.[0]?.message?.content ?? "I'm here to help!";

        // Step 2 — generate app with qwen if needed
        if (isAppRequest) {
            console.log("Triggering app generation...");

            const codeRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "qwen/qwen3-32b",
                    messages: [
                        { role: "system", content: MEXURI_TEMPLATE },
                        { role: "user", content: `Build this as a complete HTML web app: ${lastMessage}` },
                    ],
                    temperature: 0.3,
                    max_tokens: 4096,
                }),
            });

            const codeData = await codeRes.json();
            let html = codeData.choices?.[0]?.message?.content ?? "";

            // Strip markdown fences if present
            html = html.replace(/^```[\w]*\n?/i, "").replace(/```\s*$/i, "").trim();

            console.log("HTML starts with:", html.slice(0, 50));

            if (html.includes("<!DOCTYPE") || html.includes("<html")) {
                const slug = generateSlug();
                await supabase.from("apps").insert({ slug, html, prompt: lastMessage });
                console.log("App saved with slug:", slug);
                return res.status(200).json({ reply, slug });
            } else {
                console.log("HTML generation failed, raw output:", html.slice(0, 200));
            }
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Handler error:", error);
        return res.status(500).json({ error: error.message });
    }
}