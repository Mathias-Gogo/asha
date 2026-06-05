import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";

function AshaMessage({ content }) {
  if (!content) return null;
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

// ─── Skeleton loader for survey picker ─────────────────────────────────────────
function SurveyPickerSkeleton() {
  return (
    <div className="survey-picker">
      <div className="survey-picker-header">Attach a survey</div>
      {[1, 2, 3].map(i => (
        <div key={i} className="survey-picker-item" style={{ pointerEvents: 'none' }}>
          <div className="survey-picker-dot" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="survey-picker-info" style={{ flex: 1 }}>
            <div style={{
              height: 12,
              width: `${60 + Math.random() * 30}%`,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
              marginBottom: 4
            }} />
            <div style={{
              height: 10,
              width: '40%',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 4
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const GREETINGS = [
  "Any new ideas to explore?",
  "What are we building today?",
  "Ready to validate something?",
  "What's on your mind, founder?",
  "Let's research your market.",
  "Got a hypothesis to test?",
  "What problem are we solving?",
  "Tell me about your idea.",
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #06060a;
    --surface: #0f0f14;
    --surface-2: #141419;
    --fg: rgba(255,255,255,0.88);
    --fg-2: rgba(255,255,255,0.45);
    --muted: rgba(255,255,255,0.18);
    --border: rgba(255,255,255,0.06);
    --accent: #7c3aed;
    --accent-light: #a78bfa;
    --accent-glow: rgba(124,58,237,0.15);
    --ice: #38bdf8;
    --user-bg: rgba(255,255,255,0.06);
    --user-fg: rgba(255,255,255,0.88);
    --input-bg: rgba(255,255,255,0.04);
    --input-border: rgba(255,255,255,0.09);
    --shadow: 0 2px 16px rgba(0,0,0,0.4);
  }

  [data-theme="light"] {
    --bg: #f0f4ff;
    --surface: #ffffff;
    --surface-2: #f0f0f5;
    --fg: rgba(0,0,0,0.82);
    --fg-2: rgba(0,0,0,0.45);
    --muted: rgba(0,0,0,0.35);
    --border: rgba(0,0,0,0.07);
    --user-bg: rgba(0,0,0,0.05);
    --user-fg: rgba(0,0,0,0.82);
    --input-bg: rgba(255,255,255,0.85);
    --input-border: rgba(0,0,0,0.1);
    --shadow: 0 2px 16px rgba(0,0,0,0.06);
  }

  .asha-wrap {
    display: flex; flex-direction: column;
    height: 100%; background: var(--bg);
    color: var(--fg); font-family: 'Montserrat', sans-serif;
    position: relative; transition: background 0.3s;
  }

  .asha-bg {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 0; overflow: hidden;
  }

  .asha-bg::after {
    content: '';
    position: absolute;
    width: 900px; height: 600px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(29,43,100,0.9) 0%, rgba(15,20,60,0.5) 40%, transparent 70%);
    bottom: -200px; left: 50%;
    transform: translateX(-50%);
    filter: blur(40px);
  }

  [data-theme="light"] .asha-bg::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 120% 80% at 50% 0%, #d4e4ff 0%, #e8f0ff 30%, #f0f4ff 60%, #f0f4ff 100%);
  }

  [data-theme="light"] .asha-bg::after { display: none; }

  .asha-messages {
    flex: 1; overflow-y: auto;
    padding: 28px 0; display: flex;
    flex-direction: column; scroll-behavior: smooth;
    position: relative; z-index: 1;
  }

  .asha-messages::-webkit-scrollbar { width: 3px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .messages-inner {
    width: 100%; max-width: 720px;
    margin: 0 auto; padding: 0 24px;
    display: flex; flex-direction: column; gap: 20px;
  }

  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; min-height: 60vh;
    text-align: center; gap: 0;
    padding: 40px 24px 20px;
    position: relative; z-index: 1;
  }

  .empty-greeting {
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 600; letter-spacing: -0.03em;
    color: var(--fg); line-height: 1.2;
    margin-bottom: 32px; max-width: 480px;
    animation: greetFade 0.5s ease forwards;
  }

  [data-theme="light"] .empty-greeting { color: rgba(0,0,0,0.75); }

  @keyframes greetFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .empty-suggestions {
    display: flex; flex-wrap: wrap;
    gap: 8px; justify-content: center;
    max-width: 520px;
    animation: greetFade 0.5s ease 0.1s both;
  }

  .suggestion-chip {
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 100px; padding: 8px 16px;
    font-size: 12px; font-weight: 500;
    color: var(--fg-2); cursor: pointer;
    transition: all 0.2s;
    font-family: 'Montserrat', sans-serif;
    letter-spacing: 0.01em; backdrop-filter: blur(8px);
  }

  .suggestion-chip:hover {
    border-color: rgba(124,58,237,0.4);
    color: var(--accent-light);
    background: rgba(124,58,237,0.06);
  }

  [data-theme="light"] .suggestion-chip:hover { color: #7c3aed; }

  .msg {
    display: flex; flex-direction: column;
    gap: 5px; animation: fadeUp 0.22s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg.user  { align-items: flex-end; }
  .msg.asha  { align-items: flex-start; }

  .msg-label {
    font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    font-weight: 700; padding: 0 4px;
  }

  .msg.user .msg-bubble {
    background: var(--user-bg);
    border: 1px solid var(--border);
    color: var(--user-fg); padding: 11px 16px;
    border-radius: 14px 14px 3px 14px;
    font-size: 13px; line-height: 1.65;
    max-width: min(500px, 85vw); font-weight: 400;
  }

  .asha-msg-plain {
    max-width: min(680px, 92vw); padding: 0 4px;
  }

  .msg-text { font-size: 13px; line-height: 1.8; color: var(--fg); }

  .md-h1 { font-size: 1.15rem; font-weight: 700; margin: 16px 0 6px; letter-spacing: -0.02em; color: var(--fg); }
  .md-h2 { font-size: 1rem; font-weight: 600; margin: 14px 0 5px; color: var(--fg); }
  .md-h3 { font-size: 0.9rem; font-weight: 600; margin: 10px 0 4px; color: var(--fg); }
  .md-p  { margin: 5px 0; color: var(--fg); }
  .md-ul, .md-ol { padding-left: 18px; margin: 7px 0; display: flex; flex-direction: column; gap: 3px; }
  .md-li { font-size: 13px; line-height: 1.7; color: var(--fg); }
  .md-strong { font-weight: 700; color: var(--fg); }
  .md-blockquote { border-left: 2px solid var(--accent); padding: 3px 0 3px 12px; color: var(--fg-2); margin: 8px 0; font-style: italic; }
  .md-code { background: rgba(124,58,237,0.08); padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'SF Mono','Fira Code',monospace; color: var(--accent-light); border: 1px solid rgba(124,58,237,0.12); }
  .md-table-wrap { overflow-x: auto; margin: 10px 0; border-radius: 8px; border: 1px solid var(--border); }
  .md-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .md-th { background: var(--surface-2); padding: 9px 13px; text-align: left; font-weight: 700; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid var(--border); color: var(--fg-2); }
  .md-td { padding: 8px 13px; border-bottom: 1px solid var(--border); line-height: 1.5; color: var(--fg); }
  .md-table tr:last-child .md-td { border-bottom: none; }

  /* Streaming indicator */
  .streaming-indicator {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 4px;
  }

  .streaming-dots {
    display: flex; gap: 4px; align-items: center;
  }

  .streaming-dots span {
    width: 5px; height: 5px; background: var(--accent-light);
    border-radius: 50%; animation: blink 1.4s infinite; opacity: 0.3;
  }

  .streaming-dots span:nth-child(2) { animation-delay: 0.2s; }
  .streaming-dots span:nth-child(3) { animation-delay: 0.4s; }

  .streaming-text {
    font-size: 12px; color: var(--fg-2);
    font-weight: 500; letter-spacing: 0.01em;
    animation: textFade 0.3s ease;
  }

  @keyframes textFade {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes blink {
    0%,80%,100% { opacity: 0.2; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
  }

  /* Message actions */
  .msg-actions {
    display: flex; align-items: center; gap: 4px;
    opacity: 0; transition: opacity 0.15s;
    padding: 0 4px; margin-top: 4px;
  }

  .msg:hover .msg-actions { opacity: 1; }

  .msg-action-btn {
    width: 28px; height: 28px; border-radius: 6px;
    border: none; background: transparent;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: 'Montserrat', sans-serif;
  }

  .msg-action-btn:hover { background: var(--surface-2); color: var(--fg); }
  [data-theme="light"] .msg-action-btn:hover { background: rgba(0,0,0,0.06); }
  .msg-action-btn svg { width: 13px; height: 13px; }
  .msg-action-btn.copied { color: #6ee7b7; }

  .msg-edit-wrap {
    display: flex; flex-direction: column; gap: 8px;
    max-width: min(500px, 85vw);
  }

  .msg-edit-textarea {
    width: 100%; background: var(--input-bg);
    border: 1px solid rgba(124,58,237,0.35);
    border-radius: 10px; padding: 10px 14px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; color: var(--fg);
    resize: none; outline: none; line-height: 1.6;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.06);
  }

  .msg-edit-actions { display: flex; gap: 6px; justify-content: flex-end; }

  .msg-edit-cancel {
    padding: 6px 14px; border-radius: 7px;
    border: 1px solid var(--border); background: transparent;
    color: var(--fg-2); cursor: pointer;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; transition: all 0.15s;
  }

  .msg-edit-cancel:hover { border-color: var(--fg-2); color: var(--fg); }

  .msg-edit-send {
    padding: 6px 14px; border-radius: 7px;
    border: none; background: var(--accent); color: white;
    cursor: pointer; font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; transition: background 0.15s;
  }

  .msg-edit-send:hover { background: #6d28d9; }

  .asha-input-outer {
    flex-shrink: 0; padding: 12px 20px 20px;
    position: relative; z-index: 1;
  }

  .input-attachments {
    display: flex; flex-wrap: wrap; gap: 6px;
    max-width: 680px; margin: 0 auto 8px;
  }

  .attachment-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 10px 4px 8px;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 100px;
    font-size: 11px; font-weight: 600; color: #a78bfa;
    font-family: 'Montserrat', sans-serif;
  }

  [data-theme="light"] .attachment-pill { color: #7c3aed; }

  .attachment-pill-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #7c3aed; flex-shrink: 0;
  }

  .attachment-pill-remove {
    width: 14px; height: 14px; border-radius: 50%;
    border: none; background: rgba(124,58,237,0.2);
    color: #a78bfa; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; line-height: 1; padding: 0;
    transition: background 0.15s; flex-shrink: 0;
  }

  .attachment-pill-remove:hover { background: rgba(124,58,237,0.4); }

  .asha-input-pill {
    max-width: 680px; margin: 0 auto;
    display: flex; gap: 8px; align-items: flex-end;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 24px;
    padding: 10px 10px 10px 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(12px);
    position: relative;
  }

  [data-theme="light"] .asha-input-pill {
    box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  }

  .asha-input-pill:focus-within {
    border-color: rgba(124,58,237,0.35);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.06);
  }

  [data-theme="light"] .asha-input-pill:focus-within {
    box-shadow: 0 4px 24px rgba(0,0,0,0.1), 0 0 0 3px rgba(124,58,237,0.08);
  }

  .input-attach-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.3);
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }

  [data-theme="light"] .input-attach-btn {
    border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.3);
  }

  .input-attach-btn:hover {
    border-color: rgba(124,58,237,0.4); color: #a78bfa;
    background: rgba(124,58,237,0.06);
  }

  .input-attach-btn.active {
    border-color: rgba(124,58,237,0.5); color: #a78bfa;
    background: rgba(124,58,237,0.1);
  }

  .input-attach-btn:disabled {
    opacity: 0.3; cursor: not-allowed;
  }

  .input-attach-btn svg { width: 14px; height: 14px; }

  .asha-input-pill textarea {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px; color: var(--fg);
    resize: none; line-height: 1.5;
    min-height: 22px; max-height: 130px; padding: 4px 0;
  }

  .asha-input-pill textarea::placeholder { color: var(--muted); font-weight: 400; }

  .send-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: none; background: var(--accent); color: white;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s, transform 0.15s, opacity 0.2s;
    box-shadow: 0 2px 10px rgba(124,58,237,0.4);
  }

  .send-btn:hover:not(:disabled) { background: #6d28d9; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.2; cursor: not-allowed; transform: none; }
  .send-btn svg { width: 14px; height: 14px; }

  .survey-picker {
    position: absolute;
    bottom: calc(100% + 8px); left: 0;
    width: 280px; background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: pickerIn 0.18s ease; z-index: 100;
  }

  [data-theme="light"] .survey-picker {
    background: #ffffff; border-color: rgba(0,0,0,0.08);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }

  @keyframes pickerIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .survey-picker-header {
    padding: 10px 14px 8px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  [data-theme="light"] .survey-picker-header {
    color: rgba(0,0,0,0.3); border-bottom-color: rgba(0,0,0,0.06);
  }

  .survey-picker-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; cursor: pointer; transition: background 0.12s;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  [data-theme="light"] .survey-picker-item { border-bottom-color: rgba(0,0,0,0.04); }
  .survey-picker-item:last-child { border-bottom: none; }
  .survey-picker-item:hover { background: rgba(124,58,237,0.08); }

  .survey-picker-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.1); flex-shrink: 0;
  }

  .survey-picker-dot.live { background: #4ade80; }

  .survey-picker-info { flex: 1; min-width: 0; }

  .survey-picker-title {
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.7);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  [data-theme="light"] .survey-picker-title { color: rgba(0,0,0,0.7); }

  .survey-picker-meta {
    font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.2); margin-top: 1px;
  }

  [data-theme="light"] .survey-picker-meta { color: rgba(0,0,0,0.3); }

  .survey-picker-empty {
    padding: 16px 14px; font-size: 12px;
    color: rgba(255,255,255,0.2); text-align: center; font-weight: 500;
  }

  [data-theme="light"] .survey-picker-empty { color: rgba(0,0,0,0.3); }

  .input-hint {
    text-align: center; font-size: 10px;
    color: var(--muted); margin-top: 8px;
    max-width: 680px; margin-left: auto; margin-right: auto;
    font-weight: 500; letter-spacing: 0.03em; opacity: 0.6;
  }

  .modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 32px 28px;
    max-width: 340px; width: 100%; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .modal-icon { font-size: 2rem; line-height: 1; margin-bottom: 2px; }
  .modal-title { font-family: 'Montserrat',sans-serif; font-size: 1rem; font-weight: 700; color: var(--fg); letter-spacing: -0.02em; }
  .modal-body { font-size: 13px; color: var(--fg-2); line-height: 1.6; }
  .modal-body strong { color: var(--accent-light); font-weight: 600; }
  .modal-btn { margin-top: 6px; background: var(--accent); color: white; border: none; border-radius: 8px; padding: 9px 24px; font-family: 'Montserrat',sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
  .modal-btn:hover { background: #6d28d9; }

  @media (max-width: 600px) {
    .messages-inner { padding: 0 14px; }
    .asha-input-outer { padding: 10px 12px 16px; }
    .input-hint { display: none; }
    .empty-greeting { font-size: 1.5rem; }
  }
`;

const SUGGESTIONS = [
  "What sectors in Africa are underserved?",
  "Validate my business idea",
  "Market size for my sector",
  "How do I find early customers?",
];

function useGreeting(founderName) {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const base = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    if (founderName) {
      const first = founderName.split(" ")[0];
      const personalised = Math.random() > 0.5
        ? `${first}, ${base.charAt(0).toLowerCase() + base.slice(1)}`
        : base;
      setGreeting(personalised);
    } else {
      setGreeting(base);
    }
  }, []);
  return greeting;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconResend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAttach = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.42 16.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`msg-action-btn ${copied ? "copied" : ""}`} onClick={copy} title="Copy">
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────
function MessageRow({ message, index, onResend, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const isUser = message.role === "user";

  const handleEditSend = () => {
    if (!editText.trim()) return;
    setEditing(false);
    onEdit(index, editText);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSend(); }
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div className={`msg ${isUser ? "user" : "asha"}`}>
      <span className="msg-label">{isUser ? "You" : "Asha"}</span>

      {isUser ? (
        editing ? (
          <div className="msg-edit-wrap">
            <textarea
              className="msg-edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3} autoFocus
            />
            <div className="msg-edit-actions">
              <button className="msg-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
              <button className="msg-edit-send" onClick={handleEditSend}>Send →</button>
            </div>
          </div>
        ) : (
          <>
            <div className="msg-bubble">{message.content}</div>
            <div className="msg-actions">
              <CopyButton text={message.content} />
              <button className="msg-action-btn" onClick={() => { setEditText(message.content); setEditing(true); }} title="Edit">
                <IconEdit />
              </button>
              <button className="msg-action-btn" onClick={() => onResend(message.content)} title="Resend">
                <IconResend />
              </button>
            </div>
          </>
        )
      ) : (
        <>
          <div className="asha-msg-plain">
            <AshaMessage content={message.content} />
          </div>
          <div className="msg-actions">
            <CopyButton text={message.content} />
            <button className="msg-action-btn" onClick={() => onResend(message.content)} title="Regenerate">
              <IconResend />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Asha() {
  const { user, profile } = useAuth();
  const { activeConvoId, setActiveConvoId, loadConversations } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const [attachedSurvey, setAttachedSurvey] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSurveys, setPickerSurveys] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const pickerRef = useRef(null);

  const greeting = useGreeting(profile?.founder_name);

  // Preload surveys on mount for instant picker
  useEffect(() => {
    if (user?.id) preloadSurveys();
  }, [user?.id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConvoId) loadMessages(activeConvoId);
    else setMessages([]);
  }, [activeConvoId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streaming]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const preloadSurveys = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("id, title, is_active, questions")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPickerSurveys(data || []);
  };

  const loadMessages = async (convoId) => {
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  };

  const createConversation = async (firstMessage) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "…" : "");
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  };

  const saveMessage = async (convoId, role, content) => {
    await supabase.from("messages").insert({ conversation_id: convoId, role, content });
  };

  const buildSurveyContext = (survey) => {
    if (!survey) return "";
    let ctx = `\n\nATTACHED SURVEY CONTEXT:\nTitle: "${survey.title}"\n`;
    if (survey.questions?.length) {
      ctx += `\nQuestions:\n`;
      survey.questions.forEach((q, i) => {
        ctx += `${i + 1}. [${q.type}] ${q.text}`;
        if (q.options) ctx += ` (${q.options.join(", ")})`;
        ctx += "\n";
      });
    }
    if (survey.responses?.length) {
      ctx += `\nResponses (${survey.responses.length} total):\n`;
      survey.responses.forEach((r, ri) => {
        ctx += `Respondent ${ri + 1}: `;
        ctx += Object.values(r.answers || {})
          .map(v => Array.isArray(v) ? v.join(", ") : v)
          .join(" | ");
        ctx += "\n";
      });
    } else {
      ctx += "\nNo responses collected yet.\n";
    }
    ctx += "\nUse this survey data to answer the founder's question precisely.";
    return ctx;
  };

  const buildBusinessContext = async () => {
    if (!user?.id) return "";
    const { data } = await supabase
      .from("business_data")
      .select("content, source")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!data?.length) return "";

    let ctx = "\n\nFOUNDER BUSINESS CONTEXT:\n";
    data.forEach((chunk) => {
      ctx += `[${chunk.source}] ${chunk.content}\n`;
    });
    ctx += "\nUse this context to personalize your answers. Reference the founder's business, sector, and stage when relevant.";
    return ctx;
  };

  const openPicker = async () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    // Surveys already preloaded, just open
    setPickerOpen(true);
  };

  const attachSurvey = async (survey) => {
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("answers, created_at")
      .eq("survey_id", survey.id)
      .order("created_at", { ascending: false });
    setAttachedSurvey({ ...survey, responses: responses || [] });
    setPickerOpen(false);
  };

  // ─── STREAMING RESPONSE HANDLER ─────────────────────────────────────────────
  const streamResponse = async (res, updated, convoId) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    // Add empty assistant message
    setMessages([...updated, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: fullContent };
              return next;
            });
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim().startsWith("data: ")) {
      const jsonStr = buffer.trim().slice(6).trim();
      if (jsonStr !== "[DONE]") {
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch (e) { }
      }
    }

    setStreaming(false);
    await saveMessage(convoId, "assistant", fullContent);
    return fullContent;
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading || streaming) return;

    const userMsg = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];

    const surveySnapshot = attachedSurvey;
    const surveyCtx = buildSurveyContext(surveySnapshot);
    const businessCtx = await buildBusinessContext();

    setMessages(updated);
    setInput("");
    setAttachedSurvey(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      let convoId = activeConvoId;
      if (!convoId) {
        convoId = await createConversation(trimmed);
        setActiveConvoId(convoId);
        await loadConversations();
      }

      await saveMessage(convoId, "user", trimmed);

      const systemPrompt = `You are Asha, an AI assistant made by Mexuri. You help African founders with business research, market analysis, idea validation, and strategy. Be sharp, direct, and insightful.${surveyCtx}${businessCtx}`;

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
              { role: "system", content: systemPrompt },
              ...updated,
            ],
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error?.message ?? "";
          const match = msg.match(/try again in ([0-9.]+)s/i);
          const seconds = match ? Math.ceil(parseFloat(match[1])) : 60;
          const waitTime = seconds >= 60
            ? `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) > 1 ? "s" : ""}`
            : `${seconds} seconds`;
          setRateLimit({ waitTime });
          setLoading(false);
          return;
        }

        setLoading(false);
        setStreaming(true);
        await streamResponse(res, updated, convoId);

      } else {
        // Production: fallback to blocking for now
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated.map(({ role, content }) => ({ role, content })),
            surveyContext: surveyCtx || null,
          }),
        });
        const data = await res.json();
        if (data.error_type === "rate_limit") {
          setRateLimit({ waitTime: data.wait_time });
          setLoading(false);
          return;
        }
        const reply = data.reply || "Something went wrong.";
        await saveMessage(convoId, "assistant", reply);
        setMessages([...updated, { role: "assistant", content: reply }]);
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
      setLoading(false);
      setStreaming(false);
    }
  };

  const send = () => sendMessage(input);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="asha-wrap">
        <div className="asha-bg" />

        {rateLimit && (
          <RateLimitModal waitTime={rateLimit.waitTime} onClose={() => setRateLimit(null)} />
        )}

        {/* Messages */}
        <div className="asha-messages">
          {messages.length === 0 && !loading && !streaming ? (
            <div className="empty-state">
              <div className="empty-greeting">{greeting}</div>
              <div className="empty-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {messages.map((m, i) => (
                <MessageRow
                  key={i}
                  message={m}
                  index={i}
                  onResend={(text) => sendMessage(text)}
                  onEdit={(index, newText) => {
                    const trimmed = newText.trim();
                    if (!trimmed) return;
                    setMessages(prev => prev.slice(0, index));
                    sendMessage(trimmed);
                  }}
                />
              ))}
              {(loading || streaming) && (
                <div className="msg asha">
                  <span className="msg-label">Asha</span>
                  <div className="asha-msg-plain">
                    {streaming ? (
                      <div className="streaming-indicator">
                        <div className="streaming-dots">
                          <span /><span /><span />
                        </div>
                        <div className="streaming-text">Generating…</div>
                      </div>
                    ) : (
                      <div className="streaming-indicator">
                        <div className="streaming-dots">
                          <span /><span /><span />
                        </div>
                        <div className="streaming-text">Thinking…</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="asha-input-outer">

          {attachedSurvey && (
            <div className="input-attachments">
              <div className="attachment-pill">
                <div className="attachment-pill-dot" />
                {attachedSurvey.title}
                <button
                  className="attachment-pill-remove"
                  onClick={() => setAttachedSurvey(null)}
                >×</button>
              </div>
            </div>
          )}

          <div className="asha-input-pill" ref={pickerRef}>

            {pickerOpen && (
              pickerSurveys.length === 0 && pickerLoading ? (
                <SurveyPickerSkeleton />
              ) : (
                <div className="survey-picker">
                  <div className="survey-picker-header">Attach a survey</div>
                  {pickerSurveys.length === 0 ? (
                    <div className="survey-picker-empty">No surveys yet</div>
                  ) : (
                    pickerSurveys.map(s => (
                      <div
                        key={s.id}
                        className="survey-picker-item"
                        onClick={() => attachSurvey(s)}
                      >
                        <div className={`survey-picker-dot ${s.is_active ? "live" : ""}`} />
                        <div className="survey-picker-info">
                          <div className="survey-picker-title">{s.title}</div>
                          <div className="survey-picker-meta">
                            {s.is_active ? "Live" : "Draft"} · {s.questions?.length || 0} questions
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            )}

            <button
              className={`input-attach-btn ${pickerOpen ? "active" : ""}`}
              onClick={openPicker}
              title="Attach a survey"
              type="button"
              disabled={pickerLoading}
            >
              <IconAttach />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask Asha anything…"
              value={input}
              onChange={e => { setInput(e.target.value); adjustTextarea(); }}
              onKeyDown={onKeyDown}
              disabled={loading || streaming}
            />

            <button
              className="send-btn"
              onClick={send}
              disabled={loading || streaming || !input.trim()}
            >
              <IconSend />
            </button>
          </div>

          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </>
  );
}