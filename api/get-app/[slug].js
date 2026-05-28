import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    const { slug } = req.query;

    const { data, error } = await supabase
        .from("apps")
        .select("html")
        .eq("slug", slug)
        .single();

    if (error || !data) return res.status(404).send("App not found");

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(data.html);
}