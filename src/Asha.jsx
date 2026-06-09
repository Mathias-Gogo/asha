import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import { saveActiveConvoId, loadActiveConvoId } from "./lib/chatHistory";

// ─── Skeleton Loader for messages ──────────────────────────────────────────
function MessageSkeleton() {
  return (
    <div className="msg asha skeleton-msg">
      <span className="msg-label">Asha</span>
      <div className="asha-msg-plain">
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Design Tokens ── */
  :root {
    --bg:           #050816;
    --surface:      #0b1020;
    --surface-2:    #0f1628;
    --surface-3:    #141d35;
    --fg:           rgba(255,255,255,0.92);
    --fg-2:         rgba(255,255,255,0.50);
    --fg-3:         rgba(255,255,255,0.28);
    --border:       rgba(255,255,255,0.07);
    --border-2:     rgba(255,255,255,0.12);
    --cyan:         #00e5ff;
    --cyan-dim:     rgba(0,229,255,0.12);
    --cyan-glow:    rgba(0,229,255,0.20);
    --violet:       #7c3aed;
    --violet-dim:   rgba(124,58,237,0.14);
    --mint:         #00ffa3;
    --mint-dim:     rgba(0,255,163,0.10);
    --user-bg:      rgba(0,229,255,0.08);
    --user-border:  rgba(0,229,255,0.18);
    --input-bg:     rgba(11,16,32,0.90);
    --input-border: rgba(255,255,255,0.09);
    --card-bg:      rgba(255,255,255,0.035);
    --shadow-sm:    0 2px 12px rgba(0,0,0,0.35);
    --shadow-md:    0 8px 32px rgba(0,0,0,0.50);
    --shadow-lg:    0 20px 60px rgba(0,0,0,0.60);
    --radius-sm:    10px;
    --radius-md:    16px;
    --radius-lg:    24px;
  }

  [data-theme="light"] {
    --bg:           #f0f4ff;
    --surface:      #ffffff;
    --surface-2:    #f0f0f8;
    --surface-3:    #e8eaf6;
    --fg:           rgba(0,0,0,0.84);
    --fg-2:         rgba(0,0,0,0.48);
    --fg-3:         rgba(0,0,0,0.28);
    --border:       rgba(0,0,0,0.07);
    --border-2:     rgba(0,0,0,0.12);
    --user-bg:      rgba(0,153,255,0.07);
    --user-border:  rgba(0,153,255,0.18);
    --input-bg:     rgba(255,255,255,0.92);
    --input-border: rgba(0,0,0,0.10);
    --card-bg:      rgba(0,0,0,0.025);
    --shadow-sm:    0 2px 12px rgba(0,0,0,0.06);
    --shadow-md:    0 8px 32px rgba(0,0,0,0.10);
    --shadow-lg:    0 20px 60px rgba(0,0,0,0.12);
  }

  /* ── Root wrapper ── */
  .asha-wrap {
    display: flex; flex-direction: column;
    height: 100%; background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', 'Montserrat', system-ui, sans-serif;
    position: relative; overflow: hidden;
    transition: background 0.3s;
  }

  /* ── Background: ambient gradient orbs ── */
  .asha-bg {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 0; overflow: hidden;
  }

  /* Top-right cyan orb */
  .asha-bg::before {
    content: '';
    position: absolute;
    width: 700px; height: 500px; border-radius: 50%;
    background: radial-gradient(ellipse,
      rgba(0,229,255,0.07) 0%,
      rgba(0,229,255,0.03) 45%,
      transparent 70%);
    top: -200px; right: -150px;
    filter: blur(60px);
    animation: orbDrift 18s ease-in-out infinite alternate;
  }

  /* Bottom-center violet orb */
  .asha-bg::after {
    content: '';
    position: absolute;
    width: 900px; height: 500px; border-radius: 50%;
    background: radial-gradient(ellipse,
      rgba(124,58,237,0.10) 0%,
      rgba(124,58,237,0.04) 50%,
      transparent 72%);
    bottom: -220px; left: 50%;
    transform: translateX(-50%);
    filter: blur(70px);
    animation: orbDrift 22s ease-in-out infinite alternate-reverse;
  }

  @keyframes orbDrift {
    from { transform: translateX(-50%) scale(1); }
    to   { transform: translateX(-50%) scale(1.08) translateY(-20px); }
  }

  [data-theme="light"] .asha-bg::before {
    background: radial-gradient(ellipse 120% 80% at 50% 0%,
      rgba(200,230,255,0.6) 0%, rgba(220,235,255,0.4) 40%, transparent 70%);
    animation: none;
  }
  [data-theme="light"] .asha-bg::after { opacity: 0.4; }

  /* ── Scrollbar ── */
  .asha-messages {
    flex: 1; overflow-y: auto;
    padding: 32px 0 16px;
    display: flex; flex-direction: column;
    scroll-behavior: smooth;
    position: relative; z-index: 1;
  }

  .asha-messages::-webkit-scrollbar { width: 4px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, var(--cyan-dim), var(--violet-dim));
    border-radius: 4px;
  }

  .messages-inner {
    width: 100%; max-width: 760px;
    margin: 0 auto; padding: 0 28px;
    display: flex; flex-direction: column; gap: 8px;
    min-height: 100%;
  }

  /* ── Empty / greeting state ── */
  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; min-height: 62vh;
    text-align: center;
    padding: 40px 24px 24px;
    position: relative; z-index: 1;
  }

  .empty-logo-mark {
    width: 52px; height: 52px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15));
    border: 1px solid rgba(0,229,255,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 0 30px rgba(0,229,255,0.10), 0 0 60px rgba(124,58,237,0.08);
    animation: greetFade 0.4s ease forwards;
  }

  .empty-logo-mark svg { width: 24px; height: 24px; }

  .empty-greeting {
    font-size: clamp(1.55rem, 4vw, 2.1rem);
    font-weight: 700; letter-spacing: -0.035em;
    line-height: 1.18; margin-bottom: 10px; max-width: 500px;
    background: linear-gradient(135deg, var(--fg) 30%, var(--cyan) 120%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: greetFade 0.45s ease forwards;
  }

  [data-theme="light"] .empty-greeting {
    background: linear-gradient(135deg, rgba(0,0,0,0.80) 30%, #0099cc 120%);
    -webkit-background-clip: text; background-clip: text;
  }

  .empty-sub {
    font-size: 13px; color: var(--fg-3); margin-bottom: 36px;
    animation: greetFade 0.45s ease 0.05s both;
    font-weight: 400; letter-spacing: 0.01em;
  }

  @keyframes greetFade {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .empty-suggestions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    max-width: 520px; width: 100%;
    animation: greetFade 0.45s ease 0.12s both;
  }

  .suggestion-chip {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    font-size: 12.5px; font-weight: 500;
    color: var(--fg-2); cursor: pointer;
    transition: all 0.22s ease;
    font-family: inherit;
    text-align: left; line-height: 1.45;
    backdrop-filter: blur(12px);
    position: relative; overflow: hidden;
  }

  .suggestion-chip::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--cyan-dim), var(--violet-dim));
    opacity: 0; transition: opacity 0.22s;
  }

  .suggestion-chip:hover {
    border-color: rgba(0,229,255,0.22);
    color: var(--fg);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,229,255,0.08);
  }

  .suggestion-chip:hover::before { opacity: 1; }

  [data-theme="light"] .suggestion-chip:hover {
    border-color: rgba(0,150,200,0.25); color: rgba(0,0,0,0.75);
  }

  /* ── Message rows ── */
  .msg {
    display: flex; flex-direction: column;
    gap: 6px;
    animation: msgIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(10px) scale(0.99); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .msg.user  { align-items: flex-end; margin-bottom: 4px; }
  .msg.asha  { align-items: flex-start; margin-bottom: 4px; }

  /* Label row */
  .msg-label-row {
    display: flex; align-items: center; gap: 7px;
    padding: 0 4px;
  }

  .msg-avatar {
    width: 22px; height: 22px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
    letter-spacing: -0.01em;
  }

  .msg-avatar.asha-avatar {
    background: linear-gradient(135deg, rgba(0,229,255,0.18), rgba(124,58,237,0.18));
    border: 1px solid rgba(0,229,255,0.22);
    color: var(--cyan);
  }

  .msg-avatar.user-avatar {
    background: linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,229,255,0.06));
    border: 1px solid rgba(0,229,255,0.14);
    color: rgba(0,229,255,0.7);
  }

  .msg-label {
    font-size: 10.5px; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--fg-3);
    font-weight: 700;
  }

  /* User bubble — cyan-to-blue glass */
  .msg.user .msg-bubble {
    background: linear-gradient(145deg,
      rgba(0,229,255,0.10) 0%,
      rgba(0,120,255,0.08) 100%);
    border: 1px solid var(--user-border);
    color: var(--fg);
    padding: 13px 18px;
    border-radius: 18px 18px 4px 18px;
    font-size: 14px; line-height: 1.7;
    max-width: min(520px, 86vw); font-weight: 400;
    box-shadow: 0 2px 20px rgba(0,229,255,0.06),
                inset 0 1px 0 rgba(255,255,255,0.06);
    backdrop-filter: blur(10px);
    word-break: break-word;
  }

  [data-theme="light"] .msg.user .msg-bubble {
    background: linear-gradient(145deg, rgba(0,150,220,0.08), rgba(0,80,200,0.05));
    border-color: rgba(0,150,220,0.20);
    color: rgba(0,0,0,0.82);
  }

  /* Asha bubble — glass dark card */
  .asha-msg-plain {
    max-width: min(700px, 93vw);
    padding: 14px 18px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 4px 18px 18px 18px;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm),
                inset 0 1px 0 rgba(255,255,255,0.04);
    position: relative;
  }

  .asha-msg-plain::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(0,229,255,0.12) 30%,
      rgba(124,58,237,0.10) 70%,
      transparent);
    border-radius: inherit;
  }

  [data-theme="light"] .asha-msg-plain {
    background: rgba(255,255,255,0.75);
    border-color: rgba(0,0,0,0.07);
    box-shadow: var(--shadow-sm);
  }

  /* Markdown content */
  .msg-text { font-size: 13.5px; line-height: 1.82; color: var(--fg); }

  .md-h1 { font-size: 1.2rem; font-weight: 700; margin: 18px 0 8px; letter-spacing: -0.025em; color: var(--fg); }
  .md-h2 {
    font-size: 1rem; font-weight: 700; margin: 16px 0 6px;
    color: var(--cyan); letter-spacing: -0.01em;
  }
  [data-theme="light"] .md-h2 { color: #0077aa; }
  .md-h3 { font-size: 0.9rem; font-weight: 600; margin: 12px 0 5px; color: var(--fg); }
  .md-p  { margin: 6px 0; color: var(--fg); }
  .md-ul, .md-ol { padding-left: 20px; margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
  .md-li { font-size: 13.5px; line-height: 1.7; color: var(--fg); }
  .md-strong { font-weight: 700; color: var(--fg); }
  .md-blockquote {
    border-left: 2px solid var(--cyan);
    padding: 4px 0 4px 14px; color: var(--fg-2); margin: 10px 0;
    font-style: italic; background: var(--cyan-dim);
    border-radius: 0 6px 6px 0;
  }
  [data-theme="light"] .md-blockquote { border-color: #0099cc; background: rgba(0,153,204,0.06); }
  .md-code {
    background: rgba(0,229,255,0.06);
    padding: 2px 7px; border-radius: 5px;
    font-size: 12px; font-family: 'SF Mono','Fira Code',monospace;
    color: var(--cyan); border: 1px solid rgba(0,229,255,0.14);
  }
  [data-theme="light"] .md-code { background: rgba(0,150,200,0.08); color: #007799; border-color: rgba(0,150,200,0.18); }
  .md-table-wrap { overflow-x: auto; margin: 12px 0; border-radius: var(--radius-sm); border: 1px solid var(--border); }
  .md-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .md-th {
    background: var(--surface-2); padding: 10px 14px; text-align: left;
    font-weight: 700; font-size: 10px; letter-spacing: 0.08em;
    text-transform: uppercase; border-bottom: 1px solid var(--border);
    color: var(--cyan);
  }
  [data-theme="light"] .md-th { color: #0077aa; }
  .md-td { padding: 9px 14px; border-bottom: 1px solid var(--border); line-height: 1.5; color: var(--fg); }
  .md-table tr:last-child .md-td { border-bottom: none; }
  .md-table tr:hover .md-td { background: rgba(0,229,255,0.025); }

  /* ── Typing indicator ── */
  .skeleton-msg { animation: msgIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards !important; }

  .typing-dots {
    display: flex; gap: 6px; padding: 6px 2px; align-items: center;
  }

  .typing-dots span {
    width: 7px; height: 7px; border-radius: 50%;
    background: linear-gradient(135deg, var(--cyan), var(--violet));
    animation: typingBounce 1.3s ease infinite;
    opacity: 0.5;
  }

  .typing-dots span:nth-child(2) { animation-delay: 0.18s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.36s; }

  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
    30% { transform: translateY(-6px) scale(1.1); opacity: 1; }
  }

  /* ── Message action buttons ── */
  .msg-actions {
    display: flex; align-items: center; gap: 2px;
    opacity: 0; transition: opacity 0.18s;
    padding: 0 4px; margin-top: 2px;
  }

  .msg:hover .msg-actions { opacity: 1; }

  .msg-action-btn {
    width: 28px; height: 28px; border-radius: 7px;
    border: none; background: transparent;
    color: var(--fg-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: inherit;
  }

  .msg-action-btn:hover {
    background: var(--surface-2);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  [data-theme="light"] .msg-action-btn:hover { background: rgba(0,0,0,0.05); }
  .msg-action-btn svg { width: 13px; height: 13px; }
  .msg-action-btn.copied { color: var(--mint); }

  /* ── Edit textarea ── */
  .msg-edit-wrap {
    display: flex; flex-direction: column; gap: 8px;
    max-width: min(520px, 86vw);
  }

  .msg-edit-textarea {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid rgba(0,229,255,0.22);
    border-radius: var(--radius-sm); padding: 11px 15px;
    font-family: inherit; font-size: 13.5px; color: var(--fg);
    resize: none; outline: none; line-height: 1.65;
    box-shadow: 0 0 0 3px rgba(0,229,255,0.05);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .msg-edit-textarea:focus {
    border-color: rgba(0,229,255,0.40);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.08);
  }

  .msg-edit-actions { display: flex; gap: 8px; justify-content: flex-end; }

  .msg-edit-cancel {
    padding: 7px 16px; border-radius: 8px;
    border: 1px solid var(--border); background: transparent;
    color: var(--fg-2); cursor: pointer; font-family: inherit;
    font-size: 12px; font-weight: 600; transition: all 0.15s;
  }

  .msg-edit-cancel:hover { border-color: var(--border-2); color: var(--fg); }

  .msg-edit-send {
    padding: 7px 16px; border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--cyan), #0099cc);
    color: #020b18; cursor: pointer; font-family: inherit;
    font-size: 12px; font-weight: 700; transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(0,229,255,0.28);
  }

  .msg-edit-send:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,229,255,0.38);
  }

  /* ── Input zone ── */
  .asha-input-outer {
    flex-shrink: 0;
    padding: 10px 20px 20px;
    position: relative; z-index: 2;
  }

  /* Glow halo behind input on focus */
  .asha-input-outer::before {
    content: '';
    position: absolute;
    bottom: 12px; left: 50%;
    transform: translateX(-50%);
    width: min(700px, 92%); height: 80px;
    background: radial-gradient(ellipse,
      rgba(0,229,255,0.07) 0%, transparent 70%);
    pointer-events: none;
    border-radius: 50%;
    filter: blur(18px);
    opacity: 0; transition: opacity 0.4s;
  }

  .asha-input-outer:focus-within::before { opacity: 1; }

  /* Survey attachment pill */
  .input-attachments {
    display: flex; flex-wrap: wrap; gap: 6px;
    max-width: 720px; margin: 0 auto 8px;
  }

  .attachment-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 11px 5px 9px;
    background: rgba(0,229,255,0.08);
    border: 1px solid rgba(0,229,255,0.20);
    border-radius: 100px;
    font-size: 11px; font-weight: 600;
    color: var(--cyan); font-family: inherit;
  }

  [data-theme="light"] .attachment-pill { color: #007799; border-color: rgba(0,150,200,0.25); }

  .attachment-pill-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--cyan); flex-shrink: 0;
  }

  .attachment-pill-remove {
    width: 15px; height: 15px; border-radius: 50%;
    border: none; background: rgba(0,229,255,0.15);
    color: var(--cyan); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; line-height: 1; padding: 0;
    transition: background 0.15s; flex-shrink: 0;
  }

  .attachment-pill-remove:hover { background: rgba(0,229,255,0.30); }

  /* Survey draft button */
  .survey-draft-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px;
    background: rgba(0,229,255,0.07);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: var(--radius-sm);
    color: var(--cyan); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: inherit;
    margin-top: 8px;
  }

  .survey-draft-btn:hover {
    background: rgba(0,229,255,0.13);
    border-color: rgba(0,229,255,0.32);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,229,255,0.10);
  }

  .survey-draft-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .survey-draft-btn svg { width: 14px; height: 14px; }

  /* Main input pill */
  .asha-input-pill {
    max-width: 720px; margin: 0 auto;
    display: flex; gap: 6px; align-items: flex-end;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 20px;
    padding: 8px 8px 8px 14px;
    transition: border-color 0.25s, box-shadow 0.25s;
    backdrop-filter: blur(20px);
    position: relative;
    box-shadow: var(--shadow-sm);
  }

  [data-theme="light"] .asha-input-pill {
    background: rgba(255,255,255,0.92);
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  }

  .asha-input-pill:focus-within {
    border-color: rgba(0,229,255,0.30);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.07),
                var(--shadow-md);
  }

  [data-theme="light"] .asha-input-pill:focus-within {
    border-color: rgba(0,150,200,0.30);
    box-shadow: 0 0 0 3px rgba(0,150,200,0.08), 0 4px 24px rgba(0,0,0,0.10);
  }

  /* Attach button */
  .input-attach-btn {
    width: 34px; height: 34px; border-radius: 9px;
    border: 1px solid transparent;
    background: transparent; color: var(--fg-3);
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }

  .input-attach-btn:hover {
    border-color: rgba(0,229,255,0.20);
    color: var(--cyan);
    background: var(--cyan-dim);
  }

  .input-attach-btn.active {
    border-color: rgba(0,229,255,0.30);
    color: var(--cyan);
    background: var(--cyan-dim);
  }

  .input-attach-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .input-attach-btn svg { width: 15px; height: 15px; }

  [data-theme="light"] .input-attach-btn:hover {
    border-color: rgba(0,150,200,0.25); color: #007799;
    background: rgba(0,150,200,0.07);
  }

  /* Textarea */
  .asha-input-pill textarea {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: inherit;
    font-size: 14px; color: var(--fg);
    resize: none; line-height: 1.55;
    min-height: 24px; max-height: 140px; padding: 5px 0;
  }

  .asha-input-pill textarea::placeholder {
    color: var(--fg-3); font-weight: 400;
  }

  /* Voice buttons */
  .voice-btn {
    width: 34px; height: 34px; border-radius: 9px;
    border: 1px solid transparent;
    background: transparent; color: var(--fg-3);
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }

  .voice-btn:hover:not(:disabled) {
    border-color: rgba(0,229,255,0.20);
    color: var(--cyan);
    background: var(--cyan-dim);
  }

  .voice-btn.listening {
    border-color: rgba(255,80,80,0.50);
    color: #ff6b6b;
    background: rgba(255,80,80,0.08);
    animation: voicePulse 1.4s ease infinite;
  }

  .voice-btn.speaking {
    border-color: rgba(0,255,163,0.40);
    color: var(--mint);
    background: var(--mint-dim);
  }

  .voice-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .voice-btn svg { width: 15px; height: 15px; }

  @keyframes voicePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,80,80,0.30); }
    50%       { box-shadow: 0 0 0 6px rgba(255,80,80,0); }
  }

  [data-theme="light"] .voice-btn:hover:not(:disabled) {
    border-color: rgba(0,150,200,0.25); color: #007799;
    background: rgba(0,150,200,0.07);
  }

  /* Send button */
  .send-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, var(--cyan) 0%, #0077cc 100%);
    color: #020b18;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    box-shadow: 0 2px 14px rgba(0,229,255,0.40),
                0 0 0 0 rgba(0,229,255,0);
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.07);
    box-shadow: 0 4px 22px rgba(0,229,255,0.55),
                0 0 0 4px rgba(0,229,255,0.08);
  }

  .send-btn:active:not(:disabled) { transform: scale(0.96); }
  .send-btn:disabled { opacity: 0.18; cursor: not-allowed; transform: none; box-shadow: none; }
  .send-btn svg { width: 14px; height: 14px; }

  /* Input hint */
  .input-hint {
    text-align: center; font-size: 10.5px;
    color: var(--fg-3); margin-top: 8px;
    max-width: 720px; margin-left: auto; margin-right: auto;
    font-weight: 500; letter-spacing: 0.03em;
  }

  /* ── Survey picker dropdown ── */
  .survey-picker {
    position: absolute;
    bottom: calc(100% + 10px); left: 0;
    width: 290px;
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-md); overflow: hidden;
    box-shadow: var(--shadow-lg);
    animation: pickerIn 0.18s cubic-bezier(0.16,1,0.3,1);
    z-index: 100;
    backdrop-filter: blur(20px);
  }

  [data-theme="light"] .survey-picker {
    background: #ffffff; border-color: rgba(0,0,0,0.10);
  }

  @keyframes pickerIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .survey-picker-header {
    padding: 11px 15px 9px;
    font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--fg-3);
    border-bottom: 1px solid var(--border);
  }

  [data-theme="light"] .survey-picker-header { color: rgba(0,0,0,0.3); border-bottom-color: rgba(0,0,0,0.06); }

  .survey-picker-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 15px; cursor: pointer; transition: background 0.14s;
    border-bottom: 1px solid var(--border);
  }

  [data-theme="light"] .survey-picker-item { border-bottom-color: rgba(0,0,0,0.04); }
  .survey-picker-item:last-child { border-bottom: none; }
  .survey-picker-item:hover { background: var(--cyan-dim); }

  .survey-picker-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--fg-3); flex-shrink: 0;
  }
  .survey-picker-dot.live {
    background: var(--mint);
    box-shadow: 0 0 8px rgba(0,255,163,0.40);
  }

  .survey-picker-info { flex: 1; min-width: 0; }

  .survey-picker-title {
    font-size: 12px; font-weight: 600;
    color: var(--fg);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  [data-theme="light"] .survey-picker-title { color: rgba(0,0,0,0.75); }

  .survey-picker-meta {
    font-size: 10px; font-weight: 500;
    color: var(--fg-3); margin-top: 1px;
  }

  [data-theme="light"] .survey-picker-meta { color: rgba(0,0,0,0.35); }

  .survey-picker-empty {
    padding: 18px 15px; font-size: 12px;
    color: var(--fg-3); text-align: center; font-weight: 500;
  }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-card {
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: 20px; padding: 36px 32px;
    max-width: 360px; width: 100%; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
    backdrop-filter: blur(20px);
    position: relative; overflow: hidden;
  }

  .modal-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-glow), transparent);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-icon { font-size: 2.2rem; line-height: 1; margin-bottom: 2px; }
  .modal-title { font-family: inherit; font-size: 1rem; font-weight: 700; color: var(--fg); letter-spacing: -0.025em; }
  .modal-body { font-size: 13px; color: var(--fg-2); line-height: 1.65; }
  .modal-body strong { color: var(--cyan); font-weight: 700; }

  .modal-btn {
    margin-top: 4px;
    background: linear-gradient(135deg, var(--cyan), #0077cc);
    color: #020b18; border: none; border-radius: 10px;
    padding: 10px 28px; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 14px rgba(0,229,255,0.35);
  }

  .modal-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 22px rgba(0,229,255,0.50);
  }

  /* ── Survey Preview Card ── */
  .survey-preview-card {
    background: rgba(0,229,255,0.04);
    border: 1px solid rgba(0,229,255,0.14);
    border-radius: var(--radius-md);
    padding: 20px;
    max-width: 540px;
    animation: msgIn 0.3s cubic-bezier(0.16,1,0.3,1);
    backdrop-filter: blur(12px);
  }

  .survey-preview-header {
    margin-bottom: 16px; padding-bottom: 14px;
    border-bottom: 1px solid rgba(0,229,255,0.09);
  }

  .survey-preview-badge {
    display: inline-flex; padding: 3px 10px;
    background: rgba(0,229,255,0.10);
    border: 1px solid rgba(0,229,255,0.20);
    border-radius: 100px; font-size: 9px; font-weight: 700;
    color: var(--cyan); letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 10px;
  }

  .survey-preview-title {
    font-size: 15px; font-weight: 700; color: var(--fg);
    letter-spacing: -0.02em; margin-bottom: 4px;
  }

  [data-theme="light"] .survey-preview-title { color: rgba(0,0,0,0.85); }

  .survey-preview-desc {
    font-size: 12px; color: var(--fg-2); line-height: 1.5;
  }

  [data-theme="light"] .survey-preview-desc { color: rgba(0,0,0,0.48); }

  .survey-preview-questions {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;
  }

  .survey-preview-q {
    display: flex; gap: 10px; padding: 10px 13px;
    background: rgba(255,255,255,0.03);
    border-radius: 9px; border: 1px solid var(--border);
  }

  [data-theme="light"] .survey-preview-q { background: #f6f8fc; border-color: rgba(0,0,0,0.05); }

  .survey-preview-q-num {
    font-size: 10px; font-weight: 800;
    color: rgba(0,229,255,0.40); min-width: 24px; margin-top: 2px;
  }

  .survey-preview-q-body { flex: 1; }

  .survey-preview-q-text {
    font-size: 12.5px; font-weight: 600; color: var(--fg);
    margin-bottom: 4px; line-height: 1.4;
  }

  [data-theme="light"] .survey-preview-q-text { color: rgba(0,0,0,0.72); }

  .survey-preview-q-type {
    font-size: 9px; font-weight: 700; color: var(--fg-3);
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;
  }

  .survey-preview-q-options { display: flex; flex-wrap: wrap; gap: 5px; }

  .survey-preview-opt {
    font-size: 10px; padding: 3px 9px;
    background: var(--cyan-dim);
    border: 1px solid rgba(0,229,255,0.15);
    border-radius: 100px; color: var(--cyan); font-weight: 500;
  }

  .survey-preview-rating { display: flex; gap: 6px; }

  .survey-preview-rating-dot {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(0,229,255,0.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; color: var(--fg-3);
  }

  [data-theme="light"] .survey-preview-rating-dot { color: rgba(0,0,0,0.30); }

  .survey-preview-actions {
    display: flex; gap: 10px;
    padding-top: 14px; border-top: 1px solid rgba(0,229,255,0.08);
  }

  .survey-preview-edit {
    flex: 1; padding: 10px; border-radius: 9px;
    border: 1px solid var(--border-2); background: transparent;
    color: var(--fg-2); font-family: inherit;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }

  [data-theme="light"] .survey-preview-edit { border-color: rgba(0,0,0,0.10); color: rgba(0,0,0,0.50); }

  .survey-preview-edit:hover {
    border-color: rgba(0,229,255,0.25); color: var(--cyan);
    background: var(--cyan-dim);
  }

  .survey-preview-create {
    flex: 1; padding: 10px; border-radius: 9px; border: none;
    background: linear-gradient(135deg, var(--cyan), #0077cc);
    color: #020b18; font-family: inherit;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 14px rgba(0,229,255,0.30);
  }

  .survey-preview-create:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,229,255,0.45);
  }

  .survey-preview-create:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .messages-inner { padding: 0 14px; }
    .asha-input-outer { padding: 8px 12px 16px; }
    .input-hint { display: none; }
    .empty-greeting { font-size: 1.5rem; }
    .empty-suggestions { grid-template-columns: 1fr; }
    .msg.user .msg-bubble { font-size: 13px; padding: 11px 15px; }
    .asha-msg-plain { padding: 12px 14px; }
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

const IconMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconMicOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconVolume = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const IconVolumeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const IconSurvey = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
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

// ─── Survey Preview Card ────────────────────────────────────────────────────
function SurveyPreviewCard({ surveyData, onCreate, onEdit }) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await onCreate(surveyData);
    setCreating(false);
  };

  return (
    <div className="survey-preview-card">
      <div className="survey-preview-header">
        <div className="survey-preview-badge">📋 Survey Draft</div>
        <div className="survey-preview-title">{surveyData.title}</div>
        <div className="survey-preview-desc">{surveyData.description}</div>
      </div>

      <div className="survey-preview-questions">
        {surveyData.questions.map((q, i) => (
          <div key={q.id || i} className="survey-preview-q">
            <div className="survey-preview-q-num">Q{i + 1}</div>
            <div className="survey-preview-q-body">
              <div className="survey-preview-q-text">{q.text}</div>
              <div className="survey-preview-q-type">{q.type.replace('_', ' ')}</div>
              {q.options && (
                <div className="survey-preview-q-options">
                  {q.options.map((opt, oi) => (
                    <span key={oi} className="survey-preview-opt">{opt}</span>
                  ))}
                </div>
              )}
              {q.type === 'rating' && (
                <div className="survey-preview-rating">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className="survey-preview-rating-dot">{n}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="survey-preview-actions">
        <button className="survey-preview-edit" onClick={onEdit}>
          ✏️ Edit first
        </button>
        <button
          className="survey-preview-create"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Creating…" : "✓ Create survey"}
        </button>
      </div>
    </div>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────
function MessageRow({ message, index, onResend, onEdit, onCreateSurvey, onEditSurvey }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const isUser = message.role === "user";

  // Survey preview card
  if (message.content === '__SURVEY_PREVIEW__' && message.surveyData) {
    return (
      <div className="msg asha">
        <span className="msg-label">Asha</span>
        <div className="asha-msg-plain">
          <SurveyPreviewCard
            surveyData={message.surveyData}
            onCreate={onCreateSurvey}
            onEdit={() => onEditSurvey(message.surveyData)}
          />
        </div>
      </div>
    );
  }

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

// ─── Voice Input Hook (Speech-to-Text) ───────────────────────────────────────
function useSpeechInput(onTranscript) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening };
}

// ─── Voice Output Hook (Text-to-Speech) ──────────────────────────────────────
function useSpeechOutput() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown for a cleaner spoken output
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const supported = typeof window !== "undefined" && !!window.speechSynthesis;
  return { speaking, supported, speak, stopSpeaking };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Asha() {
  const { user, profile } = useAuth();
  const { activeConvoId, setActiveConvoId, loadConversations } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const [attachedSurvey, setAttachedSurvey] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSurveys, setPickerSurveys] = useState([]);
  const [businessContext, setBusinessContext] = useState("");

  // Survey draft state
  const [surveyDraftLoading, setSurveyDraftLoading] = useState(false);
  const [showSurveyButton, setShowSurveyButton] = useState(false);
  const [surveyDraftData, setSurveyDraftData] = useState(null);

  // Voice mode: true only when the current message originated from mic input
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // ── Feature 1: Restore last conversation on mount ────────────────────────
  useEffect(() => {
    const saved = loadActiveConvoId();
    if (saved && !activeConvoId) {
      setActiveConvoId(saved);
    }
  }, []);

  // Persist activeConvoId whenever it changes
  useEffect(() => {
    if (activeConvoId) {
      saveActiveConvoId(activeConvoId);
    }
  }, [activeConvoId]);

  // ── Feature 2: Voice input ───────────────────────────────────────────────
  const sendMessageRef = useRef(null);

  const handleVoiceTranscript = useCallback((transcript) => {
    setIsVoiceMode(true);
    // Auto-send the transcript immediately (ChatGPT Voice Mode behaviour)
    sendMessageRef.current?.(transcript);
  }, []);

  const { listening, supported: micSupported, startListening, stopListening } =
    useSpeechInput(handleVoiceTranscript);

  // ── Feature 3: Voice output ──────────────────────────────────────────────
  const { speaking, supported: ttsSupported, speak, stopSpeaking } =
    useSpeechOutput();

  useEffect(() => {
    if (user?.id) loadBusinessContext();
  }, [user?.id]);

  const loadBusinessContext = async () => {
    const { data } = await supabase
      .from("business_data")
      .select("content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const ctx = data.map(d => d.content).join("\n");
      setBusinessContext(ctx);
    }
  };

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const pickerRef = useRef(null);

  const greeting = useGreeting(profile?.founder_name);
  const navigate = useNavigate();

  // ─── Survey Draft: Button-triggered ───────────────────────────────────────
  const handleDraftSurvey = async () => {
    if (surveyDraftLoading) return;
    setSurveyDraftLoading(true);
    setSurveyDraftData(null);

    try {
      // Extract idea from recent chat
      const recentMessages = messages.slice(-10);
      const userMessages = recentMessages.filter(m => m.role === 'user').map(m => m.content);
      const idea = userMessages.join("\n").slice(0, 1000);

      const res = await fetch("/api/survey-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          businessContext: businessContext || null,
          chatHistory: recentMessages,
        }),
      });

      const data = await res.json();

      if (data.error_type === "rate_limit") {
        setRateLimit({ waitTime: data.wait_time });
        setSurveyDraftLoading(false);
        return;
      }

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ ${data.error}`
        }]);
        setSurveyDraftLoading(false);
        return;
      }

      if (data.survey) {
        // Show preview card in chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '__SURVEY_PREVIEW__',
          surveyData: data.survey
        }]);

        // Save reference to conversation
        if (activeConvoId) {
          await saveMessage(activeConvoId, 'assistant', `[Survey draft: ${data.survey.title}]`);
        }

        setShowSurveyButton(false);
      }
    } catch (err) {
      console.error("Survey draft error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Something went wrong drafting the survey. Please try again.'
      }]);
    } finally {
      setSurveyDraftLoading(false);
    }
  };

  const handleCreateSurvey = async (surveyData) => {
    try {
      const { data: saved, error } = await supabase
        .from("surveys")
        .insert({
          user_id: user.id,
          title: surveyData.title,
          description: surveyData.description,
          questions: surveyData.questions,
          is_active: false,
        })
        .select("id, title, is_active, created_at")
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Created **"${saved.title}"**. You can find it in your Surveys tab.`
      }]);

      if (activeConvoId) {
        await saveMessage(activeConvoId, 'assistant', `Created survey: ${saved.title}`);
      }

      navigate('/surveys', {
        state: {
          newSurveyId: saved.id,
          highlightSurvey: true
        }
      });

      return saved;
    } catch (err) {
      console.error("Survey creation error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Something went wrong creating the survey. Please try again.'
      }]);
      return null;
    }
  };

  const handleEditSurvey = (surveyData) => {
    navigate('/surveys', {
      state: {
        prefillData: surveyData,
        openForm: true
      }
    });
  };

  // Preload surveys on mount for instant picker
  useEffect(() => {
    if (user?.id) preloadSurveys();
  }, [user?.id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConvoId) loadMessages(activeConvoId);
    else {
      setMessages([]);
      setShowSurveyButton(false);
      setSurveyDraftData(null);
    }
  }, [activeConvoId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  // Show survey button when conversation has enough context
  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user');
    const hasIdea = userMsgs.some(m =>
      m.content.length > 30 &&
      (m.content.toLowerCase().includes('idea') ||
        m.content.toLowerCase().includes('app') ||
        m.content.toLowerCase().includes('business') ||
        m.content.toLowerCase().includes('startup') ||
        m.content.toLowerCase().includes('problem'))
    );
    setShowSurveyButton(hasIdea && userMsgs.length >= 2);
  }, [messages]);

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

  const openPicker = async () => {
    if (pickerOpen) { setPickerOpen(false); return; }
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

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Stop any ongoing speech when user sends a new message
    stopSpeaking();

    const userMsg = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];

    const surveySnapshot = attachedSurvey;
    const surveyCtx = buildSurveyContext(surveySnapshot);

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

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(({ role, content }) => ({ role, content })),
          businessContext: businessContext || null,
        }),
      });

      // Read body ONCE as text, then parse manually
      const rawText = await res.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse JSON. Response was:", rawText);
        throw new Error("Invalid JSON from server");
      }

      if (data.error_type === "rate_limit") {
        setRateLimit({ waitTime: data.wait_time });
        setLoading(false);
        return;
      }

      const reply = data.reply || "Something went wrong.";
      await saveMessage(convoId, "assistant", reply);
      setMessages([...updated, { role: "assistant", content: reply }]);
      // Feature 3: speak the reply only when message originated from mic input
      if (isVoiceMode && ttsSupported && reply !== "Something went wrong.") {
        speak(reply);
      }
      setLoading(false);

    } catch (err) {
      console.error(err);
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
      setLoading(false);
    }
  };

  // Keep ref current so handleVoiceTranscript can call sendMessage without stale closure
  sendMessageRef.current = sendMessage;

  const send = () => {
    setIsVoiceMode(false);
    sendMessage(input);
  };

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
          <div className="messages-inner">
            {messages.length === 0 && !loading ? (
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
              <>
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
                    onCreateSurvey={handleCreateSurvey}
                    onEditSurvey={handleEditSurvey}
                  />
                ))}
                {loading && <MessageSkeleton />}
                <div ref={bottomRef} />
              </>
            )}
          </div>
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

          {/* Survey Draft Button */}
          {showSurveyButton && !loading && (
            <div style={{ maxWidth: 680, margin: '0 auto 10px', display: 'flex', gap: 8 }}>
              <button
                className="survey-draft-btn"
                onClick={handleDraftSurvey}
                disabled={surveyDraftLoading}
              >
                <IconSurvey />
                {surveyDraftLoading ? "Drafting survey…" : "Draft a validation survey"}
              </button>
            </div>
          )}

          <div className="asha-input-pill" ref={pickerRef}>

            {pickerOpen && (
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
            )}

            <button
              className={`input-attach-btn ${pickerOpen ? "active" : ""}`}
              onClick={openPicker}
              title="Attach a survey"
              type="button"
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
              disabled={loading}
            />

            {/* Feature 3: Stop speaking button (shows only while TTS is active) */}
            {ttsSupported && speaking && (
              <button
                className="voice-btn speaking"
                onClick={stopSpeaking}
                title="Stop speaking"
                type="button"
              >
                <IconVolumeOff />
              </button>
            )}

            {/* Feature 2: Mic button — right side, immediately before send */}
            {micSupported && (
              <button
                className={`voice-btn${listening ? " listening" : ""}`}
                onClick={listening ? stopListening : startListening}
                disabled={loading}
                title={listening ? "Stop listening" : "Voice input"}
                type="button"
              >
                {listening ? <IconMicOff /> : <IconMic />}
              </button>
            )}

            <button
              className="send-btn"
              onClick={send}
              disabled={loading || !input.trim()}
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
