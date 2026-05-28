import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

const APP_TRIGGER = /build|create|make|generate/i;

const MEXURI_TEMPLATE = `You are an HTML web app generator. You ONLY output complete single-file HTML. 
NEVER output Python, React, or any other language.
NEVER output explanations, markdown, or code blocks.
Your entire response must start with <!DOCTYPE html> and nothing else.
When a user asks you to BUILD, CREATE, or MAKE an app, tool, or any software, 
respond with ONLY one short sentence like: "Sure, I'll build that for you right now."
Do not describe the app or give instructions. Just confirm you're building it.
Rules:
- Use Inter font from Google Fonts
- Color scheme: background #0f0f0f, text #f0f0f0, accent #7c5cfc, surface #1a1a1a
- Border radius: 12px cards, 8px buttons
- Clean, minimal, modern design
- Import Tailwind from CDN: <script src="https://cdn.tailwindcss.com"></script>
- Include a floating chat button (bottom right, #7c5cfc) that opens a chat panel
- The chat panel calls POST /api/chat with { messages: [...] } to fix or improve the app
- Return ONLY the HTML, no explanation, no markdown, no backticks`;

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: "Messages array required" });

    const lastMessage = messages[messages.length - 1].content;
    const isAppRequest = /build|create|make|generate|develop/i.test(lastMessage) &&
        /app|tool|calculator|tracker|dashboard|form|game|website|page/i.test(lastMessage);

    try {
        // Step 1 — normal Asha response
        const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are Asha, an AI business advisor built by Mexuri...`,
                    },
                    ...messages,
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        const chatData = await chatRes.json();
        const reply = chatData.choices?.[0]?.message?.content ?? "Something went wrong.";

        // Step 2 — if app request, generate with qwen
        if (isAppRequest) {
            const codeRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "qwen-2.5-coder-32b",
                    messages: [
                        { role: "system", content: MEXURI_TEMPLATE },
                        { role: "user", content: lastMessage },
                    ],
                    temperature: 0.3,
                    max_tokens: 4096,
                }),
            });


            const codeData = await codeRes.json();
            const html = codeData.choices?.[0]?.message?.content;
            console.log("Generated HTML length:", html?.length);
            console.log("Starts with:", html?.slice(0, 30));

            if (html) {
                const slug = generateSlug();
                await supabase.from("apps").insert({ slug, html, prompt: lastMessage });

                return res.status(200).json({ reply, slug });
            }
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}