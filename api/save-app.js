import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function generateSlug() {
    return Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { html, prompt } = req.body;
    const slug = generateSlug();

    const { error } = await supabase
        .from("apps")
        .insert({ slug, html, prompt });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ slug });
}