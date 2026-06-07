export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { messages, surveyContext } = req.body;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_tokens: 800,
                messages: [
                    {
                        role: "system",
                        content: `You are Asha, an AI research assistant made by Mexuri. You help African founders understand their survey data.\n\n${surveyContext}`,
                    },
                    ...messages,
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq error:", data);
            return res.status(500).json({ reply: "I couldn't analyse the data right now." });
        }

        const reply = data.choices?.[0]?.message?.content || "I couldn't analyse the data right now.";
        res.json({ reply });

    } catch (err) {
        console.error("Analyse handler error:", err);
        res.status(500).json({ reply: "Something went wrong. Please try again." });
    }
}