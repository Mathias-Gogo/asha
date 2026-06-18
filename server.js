// server.js — Express backend for local dev
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const GROQ_API_KEY = process.env.GROQ_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

async function supabaseFetch(path, opts = {}) {
    const url = SUPABASE_URL + "/rest/v1/" + path;
    const headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
    if (opts.prefer) headers["Prefer"] = opts.prefer;
    const res = await fetch(url, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await res.text();
    console.log("  [supabaseFetch]", opts.method||"GET", path.slice(0,60), "→", res.status, text.slice(0,100));
    let data = null;
    try { data = JSON.parse(text); } catch(e) {}
    if (!res.ok) return { data: null, error: data || { message: res.statusText } };
    return { data, error: null };
}

console.log("=== Server Starting ===")
console.log("GROQ_API_KEY present:", !!GROQ_API_KEY)
console.log("SUPABASE_URL present:", !!SUPABASE_URL)
console.log("SUPABASE_SERVICE_KEY present:", !!SUPABASE_SERVICE_KEY)

// ─── System Prompts ──────────────────────────────────────────────────────────

const ASHA_SYSTEM = `You are Asha, an AI assistant made by Mexuri.

ABOUT MEXURI:
Mexuri is an AI research company that builds AI infrastructure tailored for early-stage founders who lack deep AI expertise but need scalable, plug-and-play systems.

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

const SURVEY_SYSTEM = `You are Asha's survey designer, built by Mexuri for African founders.

Your job: Generate a survey that validates a specific business idea or problem.

RULES:
- Generate exactly 6-8 questions
- Mix question types: text, single_choice, multi_choice, rating
- Questions must be specific to the founder's idea — no generic "how old are you" unless relevant
- Focus on: problem validation, willingness to pay, current alternatives, frequency of the problem
- Use simple, direct language. No jargon.
- For single_choice and multi_choice, provide 3-5 options each
- For rating questions, use 1-5 scale (1=low, 5=high)
- Question IDs must be "q1", "q2", "q3", etc.

OUTPUT FORMAT:
You MUST output valid JSON. No markdown, no explanation, no conversational text.`;

const SURVEY_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string" },
        description: { type: "string" },
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    type: { type: "string", enum: ["text", "single_choice", "multi_choice", "rating"] },
                    text: { type: "string" },
                    options: { type: "array", items: { type: "string" } }
                },
                required: ["id", "type", "text"]
            }
        }
    },
    required: ["title", "description", "questions"]
};

// ─── Groq Helper ────────────────────────────────────────────────────────────

async function groq(model, messages, options = {}) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({ model, messages, ...options }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Groq HTTP error:", res.status, res.statusText);
            console.error("Groq response:", JSON.stringify(data, null, 2));
        }

        return data;
    } catch (err) {
        console.error("Groq fetch failed:", err.message);
        return { error: { message: err.message, code: "fetch_failed" } };
    }
}

function stripThink(text) {
    return (text ?? "").replace(/<<think>[\s\S]*?<\/think>/gi, "").trim();
}

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

// ─── API Routes ─────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
    console.log("→ /api/chat called");
    const { messages, businessContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array required" });
    }

    try {
        let dynamicSystem = ASHA_SYSTEM;

        if (businessContext) {
            dynamicSystem += `\n\nFOUNDER BUSINESS CONTEXT (personalise every response using this):\n${businessContext}\n\nAlways reference this when relevant. Address the founder by name if available. Frame all advice around their specific business, sector, and stage.`;
        }

        // Step 1: Get chat reply
        console.log("  Calling Groq for chat...");
        const chatData = await groq(
            "llama-3.1-8b-instant",
            [{ role: "system", content: dynamicSystem }, ...messages],
            { temperature: 0.5, max_tokens: 1024 }
        );

        console.log("  Groq chat response:", JSON.stringify(chatData, null, 2).slice(0, 500));

        if (chatData.error) {
            const errMsg = chatData.error.message ?? "Unknown error";
            console.error("  Chat Groq error:", errMsg);

            if (chatData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
            }
            return res.json({ reply: "I ran into an issue. Please try again.", debug: errMsg });
        }

        let reply = stripThink(chatData.choices?.[0]?.message?.content);
        if (!reply) {
            console.error("  Empty reply from Groq");
            return res.json({ reply: "I didn't get a response. Please try again." });
        }

        // Step 2: Classify
        console.log("  Calling Groq for classification...");
        const classifyData = await groq(
            "llama-3.1-8b-instant",
            [{ role: "system", content: CLASSIFIER_SYSTEM }, ...messages],
            { temperature: 0, max_tokens: 10 }
        );

        const rawAction = classifyData.choices?.[0]?.message?.content ?? "";
        const action = stripThink(rawAction).toLowerCase().replace(/[^a-z]/g, "") || "chat";
        console.log("  Classified as:", action);

        // Step 3: Research if needed
        if (action === "research") {
            console.log("  Calling Groq for research...");
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
                console.error("  Research Groq error:", errMsg);
                if (researchData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                    return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
                }
                return res.json({ reply, action: "chat" });
            }

            const researchReply = stripThink(researchData.choices?.[0]?.message?.content) || reply;
            console.log("  Research done, length:", researchReply.length);
            return res.json({ reply: researchReply, action });
        }

        console.log("  Sending chat reply, length:", reply.length);
        return res.json({ reply, action });

    } catch (error) {
        console.error("[CHAT ERROR]", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

app.post('/api/survey-draft', async (req, res) => {
    console.log("→ /api/survey-draft called");
    const { idea, problem, targetUsers, businessContext, chatHistory } = req.body;

    if (!idea || !idea.trim()) {
        return res.status(400).json({ error: "Idea description is required" });
    }

    try {
        let context = `IDEA TO VALIDATE: ${idea.trim()}`;
        if (problem?.trim()) context += `\n\nPROBLEM BEING SOLVED: ${problem.trim()}`;
        if (targetUsers?.trim()) context += `\n\nTARGET USERS: ${targetUsers.trim()}`;
        if (businessContext?.trim()) context += `\n\nFOUNDER CONTEXT: ${businessContext.trim()}`;

        if (chatHistory && chatHistory.length > 0) {
            const recent = chatHistory.slice(-6);
            context += `\n\nRECENT CONVERSATION:\n`;
            recent.forEach(m => {
                context += `${m.role === 'user' ? 'Founder' : 'Asha'}: ${m.content}\n`;
            });
        }

        console.log("  Calling Groq for survey...");
        const surveyData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [
                { role: "system", content: SURVEY_SYSTEM },
                { role: "user", content: context }
            ],
            {
                temperature: 0.4,
                max_tokens: 2048,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "survey",
                        schema: SURVEY_SCHEMA
                    }
                }
            }
        );

        console.log("  Groq survey response:", JSON.stringify(surveyData, null, 2).slice(0, 500));

        if (surveyData.error) {
            const errMsg = surveyData.error.message ?? "";
            console.error("  Survey Groq error:", errMsg);
            if (surveyData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
            }
            return res.json({ error: "Failed to generate survey. Please try again.", debug: errMsg });
        }

        const content = surveyData.choices?.[0]?.message?.content;
        if (!content) {
            console.error("  Empty survey content");
            return res.json({ error: "Empty response from model." });
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("  JSON parse failed:", e.message);
            console.error("  Raw content:", content.slice(0, 200));
            return res.json({ error: "Invalid survey format generated. Please try again." });
        }

        if (!parsed.title || !parsed.description || !Array.isArray(parsed.questions)) {
            console.error("  Invalid survey structure");
            return res.json({ error: "Invalid survey structure. Please try again." });
        }

        console.log("  Survey generated:", parsed.title, "-", parsed.questions.length, "questions");
        return res.json({ survey: parsed });

    } catch (error) {
        console.error("[SURVEY DRAFT ERROR]", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
});

// ─── Beachhead Analysis ───────────────────────────────────────────────────────

const ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        beachhead_customer: { type: "object", properties: { segment: { type: "string" }, description: { type: "string" }, why_first: { type: "string" } }, required: ["segment", "description", "why_first"] },
        core_problem: { type: "object", properties: { statement: { type: "string" }, evidence: { type: "string" }, frequency: { type: "string" } }, required: ["statement", "evidence", "frequency"] },
        recommended_solution: { type: "object", properties: { what_to_build: { type: "string" }, rationale: { type: "string" }, mvp_scope: { type: "string" } }, required: ["what_to_build", "rationale", "mvp_scope"] },
        competitive_advantage: { type: "object", properties: { differentiator: { type: "string" }, moat: { type: "string" } }, required: ["differentiator", "moat"] },
        gtm_plan: { type: "object", properties: { first_100_customers: { type: "string" }, channel: { type: "string" }, hook: { type: "string" } }, required: ["first_100_customers", "channel", "hook"] },
        risk_assessment: { type: "object", properties: { risks: { type: "array", items: { type: "object", properties: { risk: { type: "string" }, severity: { type: "string", enum: ["high", "medium", "low"] }, mitigation: { type: "string" } }, required: ["risk", "severity", "mitigation"] } } }, required: ["risks"] },
        final_recommendation: { type: "object", properties: { verdict: { type: "string", enum: ["continue", "pivot", "abandon"] }, reasoning: { type: "string" }, next_step: { type: "string" } }, required: ["verdict", "reasoning", "next_step"] },
        summary: { type: "object", properties: { primary_segment: { type: "string" }, top_pain_points: { type: "array", items: { type: "string" } }, market_opportunities: { type: "array", items: { type: "string" } }, competitor_weaknesses: { type: "array", items: { type: "string" } }, avg_spending: { type: "string" } }, required: ["primary_segment", "top_pain_points", "market_opportunities", "competitor_weaknesses", "avg_spending"] }
    },
    required: ["beachhead_customer", "core_problem", "recommended_solution", "competitive_advantage", "gtm_plan", "risk_assessment", "final_recommendation", "summary"]
};

const BEACHHEAD_SYSTEM = "You are Asha's strategic analysis engine, built by Mexuri for African founders.\n\nAnalyze survey responses using the Beachhead Strategy framework.\n\nANALYSIS FRAMEWORK:\n1. BEACHHEAD CUSTOMER - Who is the single most winnable customer segment right now?\n2. CORE PROBLEM - What is the most painful, frequent problem this segment faces?\n3. RECOMMENDED SOLUTION - What should the founder build FIRST (MVP only)?\n4. COMPETITIVE ADVANTAGE - What gives this founder an edge others cannot easily copy?\n5. GTM PLAN - How do you get the first 100 customers in the African market?\n6. RISK ASSESSMENT - What are the 2-4 biggest risks from the data?\n7. FINAL RECOMMENDATION - Should the founder CONTINUE, PIVOT, or ABANDON?\n\nRULES:\n- Be ruthlessly specific. Reference actual response patterns.\n- Frame everything for the African market.\n- If no responses yet, base analysis on survey questions only and note this.\n- Be honest. If data shows weak demand, say so.\n\nOUTPUT: Valid JSON only. No markdown, no explanation.";

const ANALYSE_CHAT_SYSTEM = "You are Asha, a sharp AI co-founder built by Mexuri for African founders. You have full context of a validation survey and all its responses. Answer questions about the data concisely and specifically. Reference actual patterns. Be direct, not generic.";

function buildAnalyseContext(survey, responses) {
    const questions = survey.questions || [];
    let ctx = "SURVEY: \"" + survey.title + "\"\n";
    if (survey.description) ctx += "Description: " + survey.description + "\n";
    ctx += "\nQUESTIONS:\n";
    questions.forEach((q, i) => {
        ctx += (i + 1) + ". [" + q.type + "] " + q.text;
        if (q.options) ctx += " (options: " + q.options.join(", ") + ")";
        ctx += "\n";
    });
    if (!responses || responses.length === 0) {
        ctx += "\nNo responses collected yet. Analyse based on survey design only.";
    } else {
        ctx += "\nRESPONSES (" + responses.length + " total):\n";
        responses.forEach((r, ri) => {
            ctx += "\nRespondent " + (ri + 1) + ":\n";
            questions.forEach((q, qi) => {
                const ans = r.answers && r.answers[q.id];
                if (ans !== undefined && ans !== "") {
                    ctx += "  Q" + (qi + 1) + " (" + q.text + "): " + (Array.isArray(ans) ? ans.join(", ") : ans) + "\n";
                }
            });
        });
    }
    return ctx;
}

app.post('/api/analyse', async (req, res) => {
    console.log("-> /api/analyse called");
    const { surveyId, messages, surveyContext } = req.body;

    // MODE 1: Chat (Ask Asha in responses tab)
    if (messages && Array.isArray(messages)) {
        try {
            const systemContent = surveyContext
                ? ANALYSE_CHAT_SYSTEM + "\n\nSURVEY CONTEXT:\n" + surveyContext
                : ANALYSE_CHAT_SYSTEM;
            const chatData = await groq(
                "llama-3.1-8b-instant",
                [{ role: "system", content: systemContent }, ...messages],
                { temperature: 0.6, max_tokens: 800 }
            );
            if (chatData.error) {
                const errMsg = chatData.error.message || "";
                if (chatData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                    return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
                }
                return res.json({ reply: "I could not analyse the data right now. Please try again." });
            }
            const reply = stripThink(chatData.choices && chatData.choices[0] && chatData.choices[0].message && chatData.choices[0].message.content) || "I could not analyse the data right now.";
            return res.json({ reply });
        } catch (err) {
            console.error("[ANALYSE CHAT ERROR]", err);
            return res.status(500).json({ reply: "Something went wrong. Please try again." });
        }
    }

    // MODE 2: Beachhead Analysis (AnalysisReport page)
    if (!surveyId) return res.status(400).json({ error: "surveyId is required" });

    console.log("  Running Beachhead analysis for survey:", surveyId);
    try {
        const { data: surveyArr, error: surveyError } = await supabaseFetch(
            "surveys?select=id,title,description,questions&id=eq." + surveyId + "&limit=1"
        );
        const survey = Array.isArray(surveyArr) ? surveyArr[0] : null;
        if (surveyError || !survey) return res.status(404).json({ error: "Survey not found." });

        const { data: responses } = await supabaseFetch(
            "survey_responses?select=id,answers,created_at&survey_id=eq." + surveyId + "&order=created_at.asc"
        );

        const responseList = responses || [];
        const context = buildAnalyseContext(survey, responseList);

        console.log("  Calling Groq for Beachhead analysis...");
        const analysisData = await groq(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            [
                { role: "system", content: BEACHHEAD_SYSTEM },
                { role: "user", content: context }
            ],
            {
                temperature: 0.3,
                max_tokens: 3000,
                response_format: {
                    type: "json_schema",
                    json_schema: { name: "beachhead_analysis", schema: ANALYSIS_SCHEMA }
                }
            }
        );

        if (analysisData.error) {
            const errMsg = analysisData.error.message || "";
            console.error("  Groq error:", errMsg);
            if (analysisData.error.code === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
                return res.json({ error_type: "rate_limit", wait_time: parseWaitTime(errMsg) });
            }
            return res.json({ error: "Analysis failed. Please try again." });
        }

        const content = analysisData.choices && analysisData.choices[0] && analysisData.choices[0].message && analysisData.choices[0].message.content;
        if (!content) return res.json({ error: "Empty response from model. Please try again." });

        let parsed;
        try { parsed = JSON.parse(content); }
        catch (e) { return res.json({ error: "Invalid analysis format. Please try again." }); }

        await supabaseFetch("surveys?id=eq." + surveyId, {
            method: "PATCH",
            prefer: "return=minimal",
            body: { analysis: parsed, analysis_status: "done" }
        });

        console.log("  Beachhead analysis done. Verdict:", parsed.final_recommendation && parsed.final_recommendation.verdict);
        return res.json({ analysis: parsed, responseCount: responseList.length });

    } catch (err) {
        console.error("[ANALYSE ERROR]", err);
        return res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

app.listen(3000, () => {
    console.log('✅ API server running at http://localhost:3000')
    console.log('  POST /api/chat')
    console.log('  POST /api/survey-draft')
    console.log('  POST /api/analyse')
})