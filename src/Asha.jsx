// src/Asha.jsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import AppBlock from "./components/AppBlock";

const CHART_COLORS = ["#0a0a0a", "#555", "#888", "#aaa", "#ddd"];
const CHART_COLORS_DARK = ["#f0f0f0", "#aaa", "#777", "#444", "#222"];

function ChartRenderer({ content }) {
  try {
    const parsed = JSON.parse(content);
    const { type, data, title } = parsed;
    const colors = window.matchMedia("(prefers-color-scheme: dark)").matches ? CHART_COLORS_DARK : CHART_COLORS;

    return (
      <div className="chart-wrap">
        {title && <p className="chart-title">{title}</p>}
        <ResponsiveContainer width="100%" height={260}>
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Montserrat" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "Montserrat" }} />
              <Tooltip contentStyle={{ fontFamily: "Montserrat", fontSize: 12 }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "Montserrat", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "Montserrat", fontSize: 12 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  } catch {
    return <pre className="code-block">{content}</pre>;
  }
}

function AshaMessage({ content }) {
  if (!content) return null;
  const parts = [];
  const regex = /```chart\n([\s\S]*?)```/g;
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: "markdown", content: content.slice(last, match.index) });
    }
    parts.push({ type: "chart", content: match[1].trim() });
    last = match.index + match[0].length;
  }

  if (last < content.length) {
    parts.push({ type: "markdown", content: content.slice(last) });
  }

  return (
    <div className="msg-text">
      {parts.map((part, i) =>
        part.type === "chart" ? (
          <ChartRenderer key={i} content={part.content} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={{
            h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
            p: ({ children }) => <p className="md-p">{children}</p>,
            ul: ({ children }) => <ul className="md-ul">{children}</ul>,
            ol: ({ children }) => <ol className="md-ol">{children}</ol>,
            li: ({ children }) => <li className="md-li">{children}</li>,
            strong: ({ children }) => <strong className="md-strong">{children}</strong>,
            table: ({ children }) => <div className="md-table-wrap"><table className="md-table">{children}</table></div>,
            th: ({ children }) => <th className="md-th">{children}</th>,
            td: ({ children }) => <td className="md-td">{children}</td>,
            code: ({ children }) => <code className="md-code">{children}</code>,
            blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
          }}>
            {part.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Red+Hat+Display:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #fafafa;
    --fg: #0a0a0a;
    --muted: #999;
    --border: #ebebeb;
    --user-bg: #0a0a0a;
    --user-fg: #ffffff;
    --input-bg: #f2f2f2;
    --surface: #ffffff;
    --accent: #0a0a0a;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0c0c0c;
      --fg: #ededed;
      --muted: #5a5a5a;
      --border: #1a1a1a;
      --user-bg: #ededed;
      --user-fg: #0a0a0a;
      --input-bg: #141414;
      --surface: #111111;
      --accent: #ededed;
    }
  }

  body { background: var(--bg); }

  .asha-wrap {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Montserrat', sans-serif;
  }

  .asha-header {
    padding: 20px 40px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
  }

  .asha-header-left {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .asha-header h1 {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--fg);
  }

  .asha-header span {
    font-size: 0.65rem;
    color: var(--muted);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .clear-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .clear-btn:hover {
    border-color: var(--fg);
    color: var(--fg);
  }

  .asha-messages {
    flex: 1;
    overflow-y: auto;
    padding: 48px 40px;
    display: flex;
    flex-direction: column;
    gap: 36px;
    scroll-behavior: smooth;
  }

  .asha-messages::-webkit-scrollbar { width: 3px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 720px;
    animation: fadeUp 0.2s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg.user { align-self: flex-end; align-items: flex-end; }
  .msg.asha  { align-self: flex-start; }

  .msg-label {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
  }

  .msg.user .msg-bubble {
    background: var(--user-bg);
    color: var(--user-fg);
    padding: 12px 18px;
    border-radius: 16px 16px 4px 16px;
    font-size: 0.875rem;
    line-height: 1.65;
    max-width: 480px;
    font-weight: 400;
  }

  .msg-text {
    font-size: 0.9rem;
    line-height: 1.8;
    color: var(--fg);
    max-width: 640px;
  }

  .md-h1 {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 20px 0 10px;
    letter-spacing: -0.02em;
  }

  .md-h2 {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 18px 0 8px;
    letter-spacing: -0.01em;
  }

  .md-h3 {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    margin: 14px 0 6px;
  }

  .md-p { margin: 6px 0; }

  .md-ul, .md-ol {
    padding-left: 20px;
    margin: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .md-li { font-size: 0.88rem; line-height: 1.7; }

  .md-strong { font-weight: 600; color: var(--fg); }

  .md-blockquote {
    border-left: 3px solid var(--border);
    padding: 4px 0 4px 14px;
    color: var(--muted);
    margin: 10px 0;
    font-style: italic;
  }

  .md-code {
    background: var(--input-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: monospace;
  }

  .md-table-wrap {
    overflow-x: auto;
    margin: 12px 0;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .md-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }

  .md-th {
    background: var(--input-bg);
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
  }

  .md-td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--border);
    line-height: 1.5;
  }

  .md-table tr:last-child .md-td { border-bottom: none; }

  .chart-wrap {
    margin: 16px 0;
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .chart-title {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--fg);
  }

  .typing {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 6px 0;
  }

  .typing span {
    width: 5px; height: 5px;
    background: var(--muted);
    border-radius: 50%;
    animation: blink 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes blink {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
    40%            { opacity: 1;   transform: scale(1); }
  }

  .asha-input-area {
    border-top: 1px solid var(--border);
    padding: 20px 40px;
    display: flex;
    gap: 12px;
    align-items: flex-end;
    background: var(--surface);
  }

  .asha-input-area textarea {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 13px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.875rem;
    color: var(--fg);
    resize: none;
    outline: none;
    line-height: 1.6;
    min-height: 48px;
    max-height: 140px;
    transition: border-color 0.15s;
  }

  .asha-input-area textarea:focus {
    border-color: var(--border);
  }

  .asha-input-area textarea::placeholder {
    color: var(--muted);
  }

  .send-btn {
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 12px;
    padding: 0 22px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    height: 48px;
    white-space: nowrap;
  }

  .send-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .empty-state {
    margin: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .empty-state h2 {
    font-family: 'Red Hat Display', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--fg);
  }

  .empty-state p {
    font-size: 0.8rem;
    color: var(--muted);
    letter-spacing: 0.04em;
    font-weight: 500;
  }

  @media (max-width: 600px) {
    .asha-header    { padding: 16px 20px; }
    .asha-messages  { padding: 28px 20px; }
    .asha-input-area { padding: 14px 20px; }
    .msg.user .msg-bubble { max-width: 85vw; }
    .msg-text { max-width: 90vw; }
    .empty-state h2 { font-size: 1.6rem; }
  }
`;

export default function Asha() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const saved = localStorage.getItem("asha-chat");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("asha-chat", JSON.stringify(messages));
    }
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("asha-chat");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];

    setMessages(updated);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      let reply;

      if (import.meta.env.DEV) {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are Asha, an AI business advisor built by Mexuri to help founders...`,
              },
              ...updated,
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content ?? "Something went wrong. Please try again.";

      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated }),
        });
        const data = await res.json();
        let reply = data.reply || data.error || "Something went wrong.";

        // If reply looks like JSON, extract just the reply field
        try {
          const parsed = JSON.parse(reply);
          if (parsed.reply) reply = parsed.reply;
        } catch {
          // not JSON, use as-is
        }

        const slug = data.slug ?? null;
        setMessages([...updated, { role: "assistant", content: reply, slug }]);

        setMessages([...updated, { role: "assistant", content: reply, slug }]);
        setLoading(false);
        return;
      }

      setMessages([...updated, { role: "assistant", content: reply }]);

    } catch (error) {
      console.error(error);
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="asha-wrap">
        <header className="asha-header">
          <div className="asha-header-left">
            <h1>Asha</h1>
            <span>by Mexuri</span>
          </div>
          <button className="clear-btn" onClick={clearChat}>Clear chat</button>
        </header>

        <div className="asha-messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <h2>Ask Asha anything.</h2>
              <p>Business research & strategy for African founders.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "asha"}`}>
              <span className="msg-label">{m.role === "user" ? "You" : "Asha"}</span>
              {m.role === "user"
                ? <div className="msg-bubble">{m.content}</div>
                : <>
                  <AshaMessage content={m.content} />
                  {m.slug && <AppBlock slug={m.slug} />}
                </>
              }
            </div>
          ))}

          {loading && (
            <div className="msg asha">
              <span className="msg-label">Asha</span>
              <div className="typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="asha-input-area">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask about markets, strategy, competition…"
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}