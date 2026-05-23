// src/Asha.jsx
import { useState, useRef, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #ffffff;
    --fg: #0a0a0a;
    --muted: #888;
    --border: #e4e4e4;
    --user-bg: #0a0a0a;
    --user-fg: #ffffff;
    --input-bg: #f7f7f7;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0a0a0a;
      --fg: #f0f0f0;
      --muted: #666;
      --border: #1e1e1e;
      --user-bg: #f0f0f0;
      --user-fg: #0a0a0a;
      --input-bg: #141414;
    }
  }

  .asha-wrap {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: 'DM Mono', monospace;
  }

  .asha-header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .asha-header h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    font-weight: 400;
    letter-spacing: -0.02em;
  }

  .asha-header span {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .asha-messages {
    flex: 1;
    overflow-y: auto;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    scroll-behavior: smooth;
  }

  .asha-messages::-webkit-scrollbar { width: 4px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 680px;
    animation: fadeUp 0.25s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg.user { align-self: flex-end; align-items: flex-end; }
  .msg.asha  { align-self: flex-start; }

  .msg-label {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .msg.user .msg-bubble {
    background: var(--user-bg);
    color: var(--user-fg);
    padding: 12px 16px;
    border-radius: 2px;
    font-size: 0.875rem;
    line-height: 1.6;
    max-width: 480px;
  }

  .msg.asha .msg-text {
    font-size: 0.9rem;
    line-height: 1.85;
    color: var(--fg);
    white-space: pre-wrap;
    max-width: 620px;
  }

  .typing {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 4px 0;
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
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.9); }
    40%            { opacity: 1;   transform: scale(1); }
  }

  .asha-input-area {
    border-top: 1px solid var(--border);
    padding: 20px 32px;
    display: flex;
    gap: 12px;
    align-items: flex-end;
    background: var(--bg);
  }

  .asha-input-area textarea {
    flex: 1;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 12px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--fg);
    resize: none;
    outline: none;
    line-height: 1.6;
    min-height: 46px;
    max-height: 140px;
    transition: border-color 0.15s;
  }

  .asha-input-area textarea:focus {
    border-color: var(--fg);
  }

  .asha-input-area textarea::placeholder {
    color: var(--muted);
  }

  .send-btn {
    background: var(--fg);
    color: var(--bg);
    border: none;
    border-radius: 2px;
    padding: 12px 20px;
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    height: 46px;
    white-space: nowrap;
  }

  .send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .empty-state {
    margin: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .empty-state h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    font-weight: 400;
    letter-spacing: -0.02em;
  }

  .empty-state p {
    font-size: 0.8rem;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  @media (max-width: 600px) {
    .asha-header  { padding: 16px 20px; }
    .asha-messages { padding: 24px 20px; }
    .asha-input-area { padding: 14px 20px; }
    .msg.user .msg-bubble { max-width: 90vw; }
    .msg.asha .msg-text   { max-width: 90vw; }
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

    const adjustTextarea = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
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
                            content: "You are Asha, an AI business advisor for founders. You help with business research and strategy particularly in the African market, you have data on all business sectors and you know what works and what fails, you get to know more about the business before you conduct strategy and do research. Be concise, sharp, and insightful.",
                        },
                        ...updated,
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            const data = await res.json();
            const reply = data.choices[0].message.content;
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
                    <h1>Asha</h1>
                    <span>by Mexuri</span>
                </header>

                <div className="asha-messages">
                    {messages.length === 0 && !loading && (
                        <div className="empty-state">
                            <h2>Ask Asha anything.</h2>
                            <p>Business research & strategy for founders.</p>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`msg ${m.role === "user" ? "user" : "asha"}`}>
                            <span className="msg-label">{m.role === "user" ? "You" : "Asha"}</span>
                            {m.role === "user"
                                ? <div className="msg-bubble">{m.content}</div>
                                : <div className="msg-text">{m.content}</div>
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