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
      <div className="msg-label-row">
        <div className="msg-avatar asha-avatar">A</div>
        <span className="msg-label">Asha</span>
      </div>
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

  /* ── Design tokens ── */
  :root {
    --bg:         #f5f7ff;
    --surface:    #ffffff;
    --surface-2:  #f0f2ff;
    --surface-3:  #e8ebff;
    --fg:         #111827;
    --fg-2:       #6b7280;
    --fg-3:       #9ca3af;
    --border:     rgba(0,0,0,0.07);
    --border-2:   rgba(0,0,0,0.12);
    --orange:     #ff6b35;
    --orange-dim: rgba(255,107,53,0.10);
    --cyan:       #00c9d4;
    --cyan-dim:   rgba(0,201,212,0.10);
    --violet:     #7c3aed;
    --violet-dim: rgba(124,58,237,0.10);
    --pink:       #ff4fd8;
    --emerald:    #10b981;
    --user-grad:  linear-gradient(135deg, #ff6b35 0%, #ff4fd8 100%);
    --shadow-sm:  0 1px 8px rgba(0,0,0,0.07);
    --shadow-md:  0 4px 24px rgba(0,0,0,0.10);
    --shadow-lg:  0 12px 48px rgba(0,0,0,0.14);
    --r-sm:       10px;
    --r-md:       16px;
    --r-lg:       24px;
  }

  /* ── Root wrapper ── */
  .asha-wrap {
    display: flex; flex-direction: column;
    height: 100%; background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
    position: relative; overflow: hidden;
  }

  /* ── Ambient background blobs ── */
  .asha-bg {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 0; overflow: hidden;
  }

  .asha-bg::before {
    content: '';
    position: absolute; width: 600px; height: 500px; border-radius: 50%;
    background: radial-gradient(ellipse,
      rgba(255,107,53,0.07) 0%, rgba(255,79,216,0.04) 50%, transparent 70%);
    top: -200px; right: -100px; filter: blur(60px);
    animation: blobDrift 20s ease-in-out infinite alternate;
  }

  .asha-bg::after {
    content: '';
    position: absolute; width: 700px; height: 450px; border-radius: 50%;
    background: radial-gradient(ellipse,
      rgba(124,58,237,0.06) 0%, rgba(0,201,212,0.04) 55%, transparent 72%);
    bottom: -180px; left: 50%; transform: translateX(-50%);
    filter: blur(70px);
    animation: blobDrift 24s ease-in-out infinite alternate-reverse;
  }

  @keyframes blobDrift {
    from { transform: translateX(-50%) scale(1) translateY(0); }
    to   { transform: translateX(-50%) scale(1.07) translateY(-18px); }
  }

  /* ── Scrollbar ── */
  .asha-messages {
    flex: 1; overflow-y: auto;
    padding: 32px 0 16px;
    display: flex; flex-direction: column;
    scroll-behavior: smooth; position: relative; z-index: 1;
  }

  .asha-messages::-webkit-scrollbar { width: 4px; }
  .asha-messages::-webkit-scrollbar-track { background: transparent; }
  .asha-messages::-webkit-scrollbar-thumb {
    background: rgba(255,107,53,0.20); border-radius: 4px;
  }

  .messages-inner {
    width: 100%; max-width: 760px;
    margin: 0 auto; padding: 0 28px;
    display: flex; flex-direction: column; gap: 8px; min-height: 100%;
  }

  /* ── Empty / greeting ── */
  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; min-height: 62vh;
    text-align: center; padding: 40px 24px 24px;
    position: relative; z-index: 1;
  }

  .empty-logo-mark {
    width: 56px; height: 56px; border-radius: 18px;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 4px 24px rgba(255,107,53,0.35);
    animation: greetFade 0.4s ease forwards;
  }

  .empty-logo-mark svg { width: 26px; height: 26px; color: white; }

  .empty-greeting {
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 800; letter-spacing: -0.04em;
    line-height: 1.15; margin-bottom: 10px; max-width: 520px;
    color: var(--fg);
    animation: greetFade 0.45s ease forwards;
  }

  .empty-sub {
    font-size: 14px; color: var(--fg-3); margin-bottom: 36px;
    animation: greetFade 0.45s ease 0.05s both;
    font-weight: 400;
  }

  @keyframes greetFade {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .empty-suggestions {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 10px; max-width: 540px; width: 100%;
    animation: greetFade 0.45s ease 0.12s both;
  }

  .suggestion-chip {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 12px; padding: 14px 18px;
    font-size: 13px; font-weight: 500;
    color: var(--fg-2); cursor: pointer;
    transition: all 0.22s; font-family: inherit;
    text-align: left; line-height: 1.45;
    box-shadow: var(--shadow-sm);
    position: relative; overflow: hidden;
  }

  .suggestion-chip::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,107,53,0.06), rgba(255,79,216,0.05));
    opacity: 0; transition: opacity 0.22s;
  }

  .suggestion-chip:hover {
    border-color: rgba(255,107,53,0.30); color: var(--fg);
    transform: translateY(-2px); box-shadow: var(--shadow-md);
  }

  .suggestion-chip:hover::before { opacity: 1; }

  /* ── Message rows ── */
  .msg {
    display: flex; flex-direction: column; gap: 6px;
    animation: msgIn 0.30s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(12px) scale(0.99); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .msg.user  { align-items: flex-end; margin-bottom: 4px; }
  .msg.asha  { align-items: flex-start; margin-bottom: 4px; }

  .msg-label-row {
    display: flex; align-items: center; gap: 7px; padding: 0 4px;
  }

  .msg-avatar {
    width: 24px; height: 24px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; flex-shrink: 0;
  }

  .msg-avatar.asha-avatar {
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; box-shadow: 0 2px 8px rgba(255,107,53,0.30);
  }

  .msg-avatar.user-avatar {
    background: var(--surface-2);
    border: 1.5px solid var(--border); color: var(--fg-2);
  }

  .msg-label {
    font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--fg-3); font-weight: 700;
  }

  /* User bubble */
  .msg.user .msg-bubble {
    background: linear-gradient(145deg, #ff6b35 0%, #ff4fd8 100%);
    color: white; padding: 13px 18px;
    border-radius: 18px 18px 4px 18px;
    font-size: 14px; line-height: 1.7;
    max-width: min(520px, 86vw); font-weight: 400;
    box-shadow: 0 3px 20px rgba(255,107,53,0.28),
                inset 0 1px 0 rgba(255,255,255,0.15);
    word-break: break-word;
  }

  /* Asha bubble — white glass card */
  .asha-msg-plain {
    max-width: min(700px, 93vw);
    padding: 16px 20px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 4px 18px 18px 18px;
    box-shadow: var(--shadow-sm);
    position: relative; overflow: hidden;
  }

  .asha-msg-plain::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, rgba(255,107,53,0.30), rgba(255,79,216,0.20), transparent);
  }

  /* Markdown */
  .msg-text { font-size: 14px; line-height: 1.82; color: var(--fg); }

  .md-h1 { font-size: 1.2rem; font-weight: 800; margin: 18px 0 8px; letter-spacing: -0.03em; color: var(--fg); }
  .md-h2 { font-size: 1rem; font-weight: 700; margin: 16px 0 6px; color: var(--orange); letter-spacing: -0.015em; }
  .md-h3 { font-size: 0.92rem; font-weight: 700; margin: 12px 0 5px; color: var(--fg); }
  .md-p  { margin: 7px 0; color: var(--fg); }
  .md-ul, .md-ol { padding-left: 20px; margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
  .md-li { font-size: 14px; line-height: 1.7; color: var(--fg); }
  .md-strong { font-weight: 700; color: var(--fg); }
  .md-blockquote {
    border-left: 3px solid var(--orange);
    padding: 4px 0 4px 14px; color: var(--fg-2); margin: 10px 0;
    font-style: italic; background: var(--orange-dim);
    border-radius: 0 8px 8px 0;
  }
  .md-code {
    background: var(--surface-2); padding: 2px 7px; border-radius: 6px;
    font-size: 12.5px; font-family: 'SF Mono','Fira Code',monospace;
    color: var(--violet); border: 1px solid var(--border);
  }
  .md-table-wrap { overflow-x: auto; margin: 12px 0; border-radius: 12px; border: 1.5px solid var(--border); }
  .md-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .md-th {
    background: var(--surface-2); padding: 10px 14px; text-align: left;
    font-weight: 800; font-size: 10.5px; letter-spacing: 0.07em; text-transform: uppercase;
    border-bottom: 1.5px solid var(--border); color: var(--orange);
  }
  .md-td { padding: 10px 14px; border-bottom: 1px solid var(--border); line-height: 1.5; color: var(--fg); }
  .md-table tr:last-child .md-td { border-bottom: none; }
  .md-table tr:hover .md-td { background: var(--surface-2); }

  /* ── Skeleton / Typing ── */
  .skeleton-msg { animation: msgIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards !important; }

  .typing-dots {
    display: flex; gap: 6px; padding: 6px 2px; align-items: center;
  }

  .typing-dots span {
    width: 7px; height: 7px; border-radius: 50%;
    background: linear-gradient(135deg, var(--orange), var(--pink));
    animation: typingBounce 1.3s ease infinite; opacity: 0.5;
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
    opacity: 0; transition: opacity 0.18s; padding: 0 4px; margin-top: 2px;
  }

  .msg:hover .msg-actions { opacity: 1; }

  .msg-action-btn {
    width: 28px; height: 28px; border-radius: 7px;
    border: none; background: transparent; color: var(--fg-3);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: inherit;
  }

  .msg-action-btn:hover {
    background: var(--surface-2); color: var(--fg); border: 1px solid var(--border);
  }

  .msg-action-btn svg { width: 13px; height: 13px; }
  .msg-action-btn.copied { color: var(--emerald); }

  /* ── Edit textarea ── */
  .msg-edit-wrap {
    display: flex; flex-direction: column; gap: 8px;
    max-width: min(520px, 86vw);
  }

  .msg-edit-textarea {
    width: 100%; background: var(--surface);
    border: 1.5px solid rgba(255,107,53,0.35);
    border-radius: 12px; padding: 12px 16px;
    font-family: inherit; font-size: 14px; color: var(--fg);
    resize: none; outline: none; line-height: 1.65;
    box-shadow: 0 0 0 3px rgba(255,107,53,0.08);
    transition: border-color 0.2s;
  }

  .msg-edit-textarea:focus { border-color: rgba(255,107,53,0.55); }

  .msg-edit-actions { display: flex; gap: 8px; justify-content: flex-end; }

  .msg-edit-cancel {
    padding: 7px 16px; border-radius: 9px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--fg-2); cursor: pointer; font-family: inherit;
    font-size: 12px; font-weight: 600; transition: all 0.15s;
  }

  .msg-edit-cancel:hover { background: var(--surface-2); color: var(--fg); }

  .msg-edit-send {
    padding: 7px 16px; border-radius: 9px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; cursor: pointer; font-family: inherit;
    font-size: 12px; font-weight: 700; transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(255,107,53,0.30);
  }

  .msg-edit-send:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(255,107,53,0.40); }

  /* ── Input zone ── */
  .asha-input-outer {
    flex-shrink: 0; padding: 10px 20px 20px;
    position: relative; z-index: 2;
  }

  /* Glow under input */
  .asha-input-outer::before {
    content: '';
    position: absolute; bottom: 8px; left: 50%;
    transform: translateX(-50%);
    width: min(700px, 92%); height: 60px;
    background: radial-gradient(ellipse, rgba(255,107,53,0.08) 0%, transparent 70%);
    pointer-events: none; border-radius: 50%; filter: blur(14px);
    opacity: 0; transition: opacity 0.4s;
  }

  .asha-input-outer:focus-within::before { opacity: 1; }

  /* Attachment pill */
  .input-attachments {
    display: flex; flex-wrap: wrap; gap: 6px;
    max-width: 720px; margin: 0 auto 8px;
  }

  .attachment-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px 5px 10px;
    background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,79,216,0.08));
    border: 1.5px solid rgba(255,107,53,0.22);
    border-radius: 100px;
    font-size: 11.5px; font-weight: 700; color: var(--orange);
    font-family: inherit;
  }

  .attachment-pill-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--orange); flex-shrink: 0;
  }

  .attachment-pill-remove {
    width: 16px; height: 16px; border-radius: 50%;
    border: none; background: rgba(255,107,53,0.15);
    color: var(--orange); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; line-height: 1; padding: 0; transition: background 0.15s; flex-shrink: 0;
  }

  .attachment-pill-remove:hover { background: rgba(255,107,53,0.30); }

  /* Survey draft button */
  .survey-draft-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,79,216,0.08));
    border: 1.5px solid rgba(255,107,53,0.22);
    border-radius: 10px; color: var(--orange);
    font-size: 12.5px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; font-family: inherit; margin-top: 8px;
  }

  .survey-draft-btn:hover {
    background: linear-gradient(135deg, rgba(255,107,53,0.18), rgba(255,79,216,0.14));
    border-color: rgba(255,107,53,0.40);
    transform: translateY(-1px); box-shadow: 0 4px 14px rgba(255,107,53,0.14);
  }

  .survey-draft-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .survey-draft-btn svg { width: 14px; height: 14px; }

  /* Input pill */
  .asha-input-pill {
    max-width: 720px; margin: 0 auto;
    display: flex; gap: 6px; align-items: flex-end;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 20px; padding: 8px 8px 8px 14px;
    transition: border-color 0.25s, box-shadow 0.25s;
    box-shadow: var(--shadow-sm);
    position: relative;
  }

  .asha-input-pill:focus-within {
    border-color: rgba(255,107,53,0.40);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.08), var(--shadow-md);
  }

  /* Attach button */
  .input-attach-btn {
    width: 34px; height: 34px; border-radius: 9px;
    border: 1.5px solid transparent; background: transparent;
    color: var(--fg-3); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; transition: all 0.18s;
  }

  .input-attach-btn:hover {
    border-color: rgba(255,107,53,0.25); color: var(--orange); background: var(--orange-dim);
  }

  .input-attach-btn.active {
    border-color: rgba(255,107,53,0.35); color: var(--orange); background: var(--orange-dim);
  }

  .input-attach-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .input-attach-btn svg { width: 15px; height: 15px; }

  /* Textarea */
  .asha-input-pill textarea {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: inherit; font-size: 14px; color: var(--fg);
    resize: none; line-height: 1.55;
    min-height: 24px; max-height: 140px; padding: 5px 0;
  }

  .asha-input-pill textarea::placeholder { color: var(--fg-3); }

  /* Send button */
  .send-btn {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    box-shadow: 0 3px 14px rgba(255,107,53,0.40);
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 5px 22px rgba(255,107,53,0.55);
  }

  .send-btn:active:not(:disabled) { transform: scale(0.95); }
  .send-btn:disabled { opacity: 0.20; cursor: not-allowed; transform: none; box-shadow: none; }
  .send-btn svg { width: 14px; height: 14px; }

  /* Input hint */
  .input-hint {
    text-align: center; font-size: 10.5px; color: var(--fg-3);
    margin-top: 8px; max-width: 720px; margin-left: auto; margin-right: auto;
    font-weight: 500; letter-spacing: 0.02em;
  }

  /* ── Survey picker ── */
  .survey-picker {
    position: absolute;
    bottom: calc(100% + 10px); left: 0;
    width: 290px; background: var(--surface);
    border: 1.5px solid var(--border); border-radius: 16px;
    overflow: hidden; box-shadow: var(--shadow-lg);
    animation: pickerIn 0.18s cubic-bezier(0.16,1,0.3,1); z-index: 100;
  }

  @keyframes pickerIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .survey-picker-header {
    padding: 11px 15px 9px;
    font-size: 9.5px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-3);
    border-bottom: 1px solid var(--border);
  }

  .survey-picker-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 15px; cursor: pointer; transition: all 0.14s;
    border-bottom: 1px solid var(--border);
  }

  .survey-picker-item:last-child { border-bottom: none; }
  .survey-picker-item:hover { background: var(--orange-dim); }

  .survey-picker-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border-2); flex-shrink: 0; }
  .survey-picker-dot.live { background: var(--emerald); box-shadow: 0 0 7px rgba(16,185,129,0.45); }

  .survey-picker-info { flex: 1; min-width: 0; }

  .survey-picker-title {
    font-size: 12.5px; font-weight: 700; color: var(--fg);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .survey-picker-meta { font-size: 10px; font-weight: 500; color: var(--fg-3); margin-top: 1px; }

  .survey-picker-empty { padding: 18px 15px; font-size: 12.5px; color: var(--fg-3); text-align: center; font-weight: 500; }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.35); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 22px; padding: 38px 32px;
    max-width: 370px; width: 100%; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    box-shadow: var(--shadow-lg); animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
    position: relative; overflow: hidden;
  }

  .modal-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8, #7c3aed);
    border-radius: 22px 22px 0 0;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-icon { font-size: 2.4rem; line-height: 1; margin-bottom: 2px; }
  .modal-title { font-family: inherit; font-size: 1.05rem; font-weight: 800; color: var(--fg); letter-spacing: -0.03em; }
  .modal-body { font-size: 13.5px; color: var(--fg-2); line-height: 1.65; }
  .modal-body strong { color: var(--orange); font-weight: 700; }
  .modal-btn {
    margin-top: 4px;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; border: none; border-radius: 11px;
    padding: 11px 30px; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 14px rgba(255,107,53,0.35);
  }
  .modal-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.50); }

  /* ── Survey Preview Card ── */
  .survey-preview-card {
    background: var(--surface);
    border: 1.5px solid rgba(255,107,53,0.20);
    border-radius: 16px; padding: 22px;
    max-width: 560px;
    animation: msgIn 0.3s cubic-bezier(0.16,1,0.3,1);
    box-shadow: var(--shadow-sm);
    position: relative; overflow: hidden;
  }

  .survey-preview-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8);
    border-radius: 16px 16px 0 0;
  }

  .survey-preview-header {
    margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
  }

  .survey-preview-badge {
    display: inline-flex; padding: 3px 11px;
    background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,79,216,0.10));
    border: 1px solid rgba(255,107,53,0.22);
    border-radius: 100px; font-size: 9px; font-weight: 800;
    color: var(--orange); letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 10px;
  }

  .survey-preview-title {
    font-size: 15.5px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.03em; margin-bottom: 4px;
  }

  .survey-preview-desc { font-size: 12.5px; color: var(--fg-2); line-height: 1.5; }

  .survey-preview-questions {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;
  }

  .survey-preview-q {
    display: flex; gap: 10px; padding: 11px 13px;
    background: var(--surface-2); border-radius: 10px; border: 1px solid var(--border);
  }

  .survey-preview-q-num {
    font-size: 10px; font-weight: 800; color: var(--orange);
    opacity: 0.7; min-width: 24px; margin-top: 2px;
  }

  .survey-preview-q-body { flex: 1; }

  .survey-preview-q-text {
    font-size: 13px; font-weight: 700; color: var(--fg);
    margin-bottom: 4px; line-height: 1.4;
  }

  .survey-preview-q-type {
    font-size: 9px; font-weight: 700; color: var(--fg-3);
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;
  }

  .survey-preview-q-options { display: flex; flex-wrap: wrap; gap: 5px; }

  .survey-preview-opt {
    font-size: 10.5px; padding: 3px 10px;
    background: var(--orange-dim);
    border: 1px solid rgba(255,107,53,0.18);
    border-radius: 100px; color: var(--orange); font-weight: 600;
  }

  .survey-preview-rating { display: flex; gap: 6px; }

  .survey-preview-rating-dot {
    width: 26px; height: 26px; border-radius: 50%;
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 700; color: var(--fg-3);
  }

  .survey-preview-actions {
    display: flex; gap: 10px;
    padding-top: 14px; border-top: 1px solid var(--border);
  }

  .survey-preview-edit {
    flex: 1; padding: 10px; border-radius: 10px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--fg-2); font-family: inherit;
    font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  }

  .survey-preview-edit:hover { border-color: rgba(255,107,53,0.30); color: var(--orange); background: var(--orange-dim); }

  .survey-preview-create {
    flex: 1; padding: 10px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(255,107,53,0.30);
  }

  .survey-preview-create:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,107,53,0.44); }
  .survey-preview-create:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .messages-inner { padding: 0 14px; }
    .asha-input-outer { padding: 8px 12px 16px; }
    .input-hint { display: none; }
    .empty-greeting { font-size: 1.55rem; }
    .empty-suggestions { grid-template-columns: 1fr; }
    .msg.user .msg-bubble { font-size: 13.5px; padding: 12px 16px; }
    .asha-msg-plain { padding: 13px 15px; }
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
        <div className="msg-label-row">
          <div className="msg-avatar asha-avatar">A</div>
          <span className="msg-label">Asha</span>
        </div>
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
      <div className="msg-label-row">
        <div className={`msg-avatar ${isUser ? "user-avatar" : "asha-avatar"}`}>
          {isUser ? "Y" : "A"}
        </div>
        <span className="msg-label">{isUser ? "You" : "Asha"}</span>
      </div>

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
  const [rateLimit, setRateLimit] = useState(null);
  const [attachedSurvey, setAttachedSurvey] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSurveys, setPickerSurveys] = useState([]);
  const [businessContext, setBusinessContext] = useState("");

  // Survey draft state
  const [surveyDraftLoading, setSurveyDraftLoading] = useState(false);
  const [showSurveyButton, setShowSurveyButton] = useState(false);
  const [surveyDraftData, setSurveyDraftData] = useState(null);

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

      const res = await fetch("/api/messages", {
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
      setLoading(false);

    } catch (err) {
      console.error(err);
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
      setLoading(false);
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
          <div className="messages-inner">
            {messages.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-logo-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="empty-greeting">{greeting}</div>
                <div className="empty-sub">Your AI co-founder for African markets</div>
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