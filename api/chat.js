// api/chat.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
                        content: `You are Asha, an AI business advisor built by Mexuri to help founders. You help with business research and strategy particularly in the African market. 
                                You have data on all business sectors and know what works and what fails. You get to know more about the business before you conduct strategy and research. Be concise, sharp, and insightful.
  
                                About Mexuri:
                                - Mexuri is a tech company dedicated to integrating technology into all African sectors to provide more opportunity for Africans and better the standard of living.
                                
                                When responding:
                                - If responding about who you are and who built you, respond simply, in a way a 16 year old would understand, but keep it fluent
                                - Use **bold** for key terms and important points
                                - Use bullet lists or numbered lists where appropriate
                                - Use tables for comparisons
                                - Use headings to structure long responses
                                - When the user asks for data that can be visualized, output a chart block like this:
                                \`\`\`chart
                                {"type": "bar", "title": "Chart Title", "data": [{"name": "Label", "value": 100}]}
                                \`\`\`
                                - For pie charts use: {"type": "pie", ...} with the same data structure`,
                    },
                    ...messages,
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Groq API error:", response.status, errText);
            return res.status(502).json({ error: "Groq API error", details: errText });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            console.error("Unexpected Groq response:", data);
            return res.status(502).json({ error: "Invalid response from Groq" });
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}