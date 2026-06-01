// src/Asha.jsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Asha Message Renderer ───────────────────────────────────────────────────
function AshaMessage({ content }) {
  if (!content) return null;
  // Strip any chart blocks entirely
  const cleaned = content.replace(/```chart[\s\S]*?```/g, "").trim();

  return (
    <div className="msg-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
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
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
// ─── Rate Limit Modal ────────────────────────────────────────────────────────
function RateLimitModal({ waitTime, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">⏳</div>
        <h3 className="modal-title">Asha needs a moment</h3>
        <p className="modal-body">
          Thinking capacity is temporarily maxed out.<br />
          Asha will be back in <strong>{waitTime}</strong>.
        </p>
        <button className="modal-btn" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --surface-2: #f0f2f5;
    --fg: #0d0f14;
    --fg-2: #4a5068;
    --muted: #9198ad;
    --border: #e4e7ef;
    --user-bg: #0f1117;
    --user-fg: #ffffff;
    --accent: #3B82F6;
    --accent-glow: rgba(59,130,246,0.18);
    --accent-hover: #2563EB;
    --input-bg: #eef0f5;
    --shadow: 0 2px 16px rgba(0,0,0,0.07);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
    --radius: 16px;
  }

  [data-theme="dark"] {
    --bg: #080810;
    --surface: #0f1018;
    --surface-2: #161722;
    --fg: #eef0f8;
    --fg-2: #9198b8;
    --muted: #4a5068;
    --border: #1e2030;
    --user-bg: #eef0f8;
    --user-fg: #0d0f14;
    --accent: #3B82F6;
    --accent-glow: rgba(59,130,246,0.2);
    --accent-hover: #60A5FA;
    --input-bg: #13141f;
    --shadow: 0 2px 16px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.6);
  }

  body { background: var(--bg); }

  /* ── Layout ── */
  .asha-wrap {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Outfit', sans-serif;
    transition: background 0.3s, color 0.3s;
  }

  /* ── Header ── */
  .asha-header {
    padding: 0 28px;
    height: 64px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    box-shadow: var(--shadow);
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .asha-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .asha-logo-mark {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: white;
    letter-spacing: -0.5px;
    flex-shrink: 0;
    box-shadow: 0 2px 12px rgba(59,130,246,0.35);
  }

  .asha-header-text h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--fg);
    line-height: 1;
  }

  .asha-header-text span {
    font-size: 0.65rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .asha-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    transition: all 0.2s;
  }

  .theme-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .clear-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg-2);
    font-family: 'Outfit', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .clear-btn:hover {
    border-color: #EF4444;
    color: #EF4444;
    background: rgba(239,68,68,0.06);
  }

  /* ── Messages ── */
  .asha-messages {
    flex: 1;
    overflow-y: auto;
    padding: 32px 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
    scroll-behavior: smooth;
  }

  .asha-messages::-webkit-scrollbar { width: 4px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .messages-inner {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Empty State ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 60vh;
    text-align: center;
    gap: 16px;
    padding: 40px 20px;
  }

  .empty-logo {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: white;
    box-shadow: 0 4px 24px rgba(59,130,246,0.3);
    margin-bottom: 8px;
  }

  .empty-state h2 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--fg);
    line-height: 1.2;
  }

  .empty-state p {
    font-size: 0.9rem;
    color: var(--muted);
    font-weight: 400;
    max-width: 340px;
    line-height: 1.6;
  }

  .empty-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
    max-width: 480px;
  }

  .suggestion-chip {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 8px 16px;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--fg-2);
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }

  .suggestion-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-glow);
  }

  /* ── Messages ── */
  .msg {
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: fadeUp 0.25s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg.user { align-items: flex-end; }
  .msg.asha  { align-items: flex-start; }

  .msg-label {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
    padding: 0 4px;
  }

  .msg.user .msg-bubble {
    background: var(--user-bg);
    color: var(--user-fg);
    padding: 12px 18px;
    border-radius: 18px 18px 4px 18px;
    font-size: 0.9rem;
    line-height: 1.65;
    max-width: min(480px, 85vw);
    font-weight: 400;
    box-shadow: var(--shadow);
  }

  .asha-msg-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px 18px 18px 18px;
    padding: 16px 20px;
    max-width: min(640px, 92vw);
    box-shadow: var(--shadow);
  }

  .msg-text {
    font-size: 0.9rem;
    line-height: 1.8;
    color: var(--fg);
  }

  /* ── Markdown ── */
  .md-h1 { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; margin: 18px 0 8px; letter-spacing: -0.02em; color: var(--fg); }
  .md-h2 { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 600; margin: 16px 0 6px; color: var(--fg); }
  .md-h3 { font-size: 0.95rem; font-weight: 600; margin: 12px 0 4px; color: var(--fg); }
  .md-p  { margin: 6px 0; color: var(--fg); }
  .md-ul, .md-ol { padding-left: 20px; margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
  .md-li { font-size: 0.88rem; line-height: 1.7; color: var(--fg); }
  .md-strong { font-weight: 600; color: var(--fg); }
  .md-blockquote { border-left: 3px solid var(--accent); padding: 4px 0 4px 14px; color: var(--fg-2); margin: 10px 0; font-style: italic; }
  .md-code { background: var(--input-bg); padding: 2px 7px; border-radius: 5px; font-size: 0.8rem; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--accent); }
  .md-table-wrap { overflow-x: auto; margin: 12px 0; border-radius: 10px; border: 1px solid var(--border); }
  .md-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  .md-th { background: var(--surface-2); padding: 10px 14px; text-align: left; font-weight: 600; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid var(--border); color: var(--fg-2); }
  .md-td { padding: 9px 14px; border-bottom: 1px solid var(--border); line-height: 1.5; color: var(--fg); }
  .md-table tr:last-child .md-td { border-bottom: none; }

  /* ── Charts ── */
  .chart-wrap { margin: 16px 0; padding: 20px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; }
  .chart-title { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 600; margin-bottom: 16px; color: var(--fg); }

  /* ── Typing indicator ── */
  .typing { display: flex; gap: 5px; align-items: center; padding: 4px 2px; }
  .typing span { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: blink 1.4s infinite; opacity: 0.3; }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

  /* ── Input Area ── */
  .asha-input-outer {
    flex-shrink: 0;
    padding: 16px 20px 20px;
    background: var(--surface);
    border-top: 1px solid var(--border);
  }

  .asha-input-inner {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--input-bg);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .asha-input-inner:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .asha-input-inner textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Outfit', sans-serif;
    font-size: 0.9rem;
    color: var(--fg);
    resize: none;
    line-height: 1.6;
    min-height: 24px;
    max-height: 140px;
    padding: 2px 0;
  }

  .asha-input-inner textarea::placeholder { color: var(--muted); }

  .send-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: none;
    background: var(--accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  }

  .send-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
  }

  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .send-btn svg { width: 16px; height: 16px; }

  .input-hint {
    text-align: center;
    font-size: 0.68rem;
    color: var(--muted);
    margin-top: 8px;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  /* ── Rate Limit Modal ── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 36px 32px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .modal-icon {
    font-size: 2.2rem;
    line-height: 1;
    margin-bottom: 4px;
  }

  .modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--fg);
    letter-spacing: -0.02em;
  }

  .modal-body {
    font-size: 0.88rem;
    color: var(--fg-2);
    line-height: 1.65;
  }

  .modal-body strong {
    color: var(--accent);
    font-weight: 600;
  }

  .modal-btn {
    margin-top: 8px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 28px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  }

  .modal-btn:hover { background: var(--accent-hover); }

  /* ── Mobile ── */
  @media (max-width: 600px) {
  .asha-header    { padding: 0 16px; }
  .asha-input-outer { padding: 12px 12px 16px; }
  .messages-inner { padding: 0 12px; }
  .asha-msg-wrap  { padding: 12px 14px; }
  .input-hint     { display: none; }

    .clear-btn {
      width: 34px;
      height: 34px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .clear-btn span { display: none; }

    .clear-btn::after {
      content: '🗑️';
      font-size: 15px;
    }
  }
`;

// ─── Suggestion chips ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What sectors in Africa are underserved?",
  "Validate my fintech idea",
  "Market size for edtech in Nigeria",
  "How do I find early customers?",
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Asha() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [rateLimit, setRateLimit] = useState(null); // { waitTime: "32 seconds" }
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Load saved theme + messages
  useEffect(() => {
    const savedTheme = localStorage.getItem("asha-theme") || "dark";
    setTheme(savedTheme);
    const saved = localStorage.getItem("asha-chat");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { }
    }
  }, []);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("asha-chat", JSON.stringify(messages));
  }, [messages]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("asha-theme", theme);
  }, [theme]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

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

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
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
                content: `You are Asha, an AI assistant made by Mexuri. Mexuri is an AI research company focusing on creating technologies for socio-economic growth in Africa. You help African founders with business research, market analysis, idea validation, and strategy. Be sharp, direct, and insightful. Know when to be brief and when to be detailed.`,
              },
              ...updated,
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });
        const data = await res.json();
        if (data.error) {
          const msg = data.error.message ?? "";
          const match = msg.match(/try again in ([0-9.]+)s/i);
          const seconds = match ? Math.ceil(parseFloat(match[1])) : 60;
          const waitTime = seconds >= 60 ? `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) > 1 ? "s" : ""}` : `${seconds} seconds`;
          setRateLimit({ waitTime });
          setMessages(updated);
          return;
        }
        reply = data.choices?.[0]?.message?.content ?? "Something went wrong.";
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated.map(({ role, content }) => ({ role, content })),
          }),
        });
        const data = await res.json();

        // Rate limit error from server
        if (data.error_type === "rate_limit") {
          setRateLimit({ waitTime: data.wait_time });
          setMessages(updated);
          return;
        }

        reply = data.reply || "Something went wrong.";
      }

      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendMessage(input);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="asha-wrap" data-theme={theme}>

        {/* Rate Limit Modal */}
        {rateLimit && (
          <RateLimitModal
            waitTime={rateLimit.waitTime}
            onClose={() => setRateLimit(null)}
          />
        )}

        {/* Header */}
        <header className="asha-header">
          <div className="asha-header-left">
            <div className="asha-logo-mark">A</div>
            <div className="asha-header-text">
              <h1>Asha</h1>
              <span>by Mexuri</span>
            </div>
          </div>
          <div className="asha-header-right">
            <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="clear-btn" onClick={clearChat}>
              <span>Clear chat</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="asha-messages">
          {messages.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-logo">A</div>
              <h2>Hey, I'm Asha.</h2>
              <p>Ask me anything about your business, market, or strategy.</p>
              <div className="empty-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role === "user" ? "user" : "asha"}`}>
                  <span className="msg-label">{m.role === "user" ? "You" : "Asha"}</span>
                  {m.role === "user" ? (
                    <div className="msg-bubble">{m.content}</div>
                  ) : (
                    <div className="asha-msg-wrap">
                      <AshaMessage content={m.content} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="msg asha">
                  <span className="msg-label">Asha</span>
                  <div className="asha-msg-wrap">
                    <div className="typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="asha-input-outer">
          <div className="asha-input-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask about markets, strategy, your business idea…"
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </>
  );
}