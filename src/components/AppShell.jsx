import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f7ff; overflow: hidden; }

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
    --violet:     #7c3aed;
    --violet-dim: rgba(124,58,237,0.10);
    --pink:       #ff4fd8;
    --emerald:    #10b981;
    --yellow:     #ffd166;
    --shadow-sm:  0 1px 8px rgba(0,0,0,0.07);
    --shadow-md:  0 4px 24px rgba(0,0,0,0.10);
    --shadow-lg:  0 12px 48px rgba(0,0,0,0.14);
  }

  .shell-wrap {
    display: flex;
    height: 100vh; height: 100dvh;
    background: var(--bg);
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--fg);
    overflow: hidden;
    position: relative;
  }

  .sidebar {
    height: 100%;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    flex-shrink: 0; overflow: hidden;
    transition: width 0.28s cubic-bezier(0.32, 0.72, 0, 1);
    position: relative; z-index: 20;
    box-shadow: var(--shadow-sm);
  }

  .sidebar.collapsed { width: 58px; }
  .sidebar.expanded  { width: 252px; }

  .sb-logo-wrap {
    height: 58px;
    display: flex; align-items: center;
    padding: 0 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; gap: 10px; overflow: hidden;
  }

  .sb-logo-mark {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: white;
    flex-shrink: 0; letter-spacing: -0.5px;
    box-shadow: 0 2px 10px rgba(255,107,53,0.35);
  }

  .sb-logo-text { display: flex; flex-direction: column; overflow: hidden; white-space: nowrap; }

  .sb-logo-name {
    font-size: 15px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.04em; line-height: 1;
  }

  .sb-logo-by {
    font-size: 9px; font-weight: 600; color: var(--fg-3);
    letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px;
  }

  .sb-new-btn {
    margin: 10px 10px 6px;
    padding: 9px 10px;
    border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: all 0.2s; white-space: nowrap; overflow: hidden; flex-shrink: 0;
    box-shadow: 0 2px 12px rgba(255,107,53,0.30);
  }

  .sb-new-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,107,53,0.40); }

  .sb-new-icon {
    width: 16px; height: 16px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; line-height: 1;
  }

  .sb-nav {
    padding: 6px 10px;
    display: flex; flex-direction: column; gap: 3px; flex-shrink: 0;
  }

  .sb-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px; cursor: pointer;
    color: var(--fg-2); font-size: 12.5px; font-weight: 600;
    transition: all 0.18s; white-space: nowrap; overflow: hidden;
    text-decoration: none; letter-spacing: -0.01em;
    border: 1px solid transparent; flex-shrink: 0;
  }

  .sb-nav-item:hover { background: var(--surface-2); color: var(--fg); }

  .sb-nav-item.active {
    background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,79,216,0.08));
    color: var(--orange); border-color: rgba(255,107,53,0.18); font-weight: 700;
  }

  .sb-nav-icon {
    width: 17px; height: 17px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .sb-divider {
    height: 1px; background: var(--border); margin: 6px 10px; flex-shrink: 0;
  }

  .sb-section-label {
    font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--fg-3); padding: 6px 14px 4px;
    white-space: nowrap; overflow: hidden; flex-shrink: 0;
  }

  .sb-convos {
    flex: 1; overflow-y: auto; overflow-x: hidden; padding: 2px 10px;
  }

  .sb-convos::-webkit-scrollbar { width: 3px; }
  .sb-convos::-webkit-scrollbar-track { background: transparent; }
  .sb-convos::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.15); border-radius: 3px; }

  .sb-convo-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 9px; border-radius: 9px; cursor: pointer;
    transition: all 0.15s; border: 1px solid transparent; position: relative;
  }

  .sb-convo-item:hover { background: var(--surface-2); }
  .sb-convo-item:hover .convo-menu-btn { opacity: 1; }
  .sb-convo-item.active { background: var(--orange-dim); border-color: rgba(255,107,53,0.15); }
  .sb-convo-item.pinned { border-left: 2px solid var(--orange); }
  .sb-convo-item.pinned .sb-convo-title { font-weight: 600; color: var(--fg); }

  .sb-convo-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(0,0,0,0.15); flex-shrink: 0;
  }

  .sb-convo-item.active .sb-convo-dot { background: var(--orange); }
  .sb-convo-item.pinned .sb-convo-dot { background: var(--orange); }

  .sb-convo-title {
    font-size: 12.5px; font-weight: 500; color: var(--fg-2);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    line-height: 1.3; flex: 1; min-width: 0;
  }

  .sb-convo-item.active .sb-convo-title { color: var(--fg); font-weight: 600; }

  .sb-empty-convos {
    font-size: 11.5px; color: var(--fg-3);
    padding: 14px 4px; font-weight: 500;
    white-space: nowrap; overflow: hidden;
  }

  .convo-menu-wrap { position: relative; flex-shrink: 0; }

  .convo-menu-btn {
    width: 22px; height: 22px; border-radius: 5px;
    border: none; background: transparent; color: var(--fg-3);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: all 0.15s; padding: 0;
  }

  .convo-menu-btn:hover { color: var(--fg-2); background: var(--surface-3); }

  .convo-menu-dropdown {
    position: fixed; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px; padding: 4px;
    min-width: 144px; z-index: 9999;
    box-shadow: var(--shadow-md); animation: menuIn 0.15s ease;
  }

  @keyframes menuIn {
    from { opacity: 0; transform: translateY(-4px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .convo-menu-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 11px; border-radius: 7px;
    font-size: 12px; font-weight: 600; color: var(--fg-2);
    cursor: pointer; transition: all 0.12s; white-space: nowrap;
    border: none; background: transparent;
    width: 100%; text-align: left; font-family: inherit;
  }

  .convo-menu-item:hover { background: var(--surface-2); color: var(--fg); }
  .convo-menu-item.danger:hover { background: rgba(239,68,68,0.08); color: #dc2626; }
  .convo-pin-icon { color: var(--orange); }

  .rename-input {
    background: var(--surface-2);
    border: 1px solid rgba(255,107,53,0.35);
    border-radius: 6px; padding: 4px 7px;
    font-family: inherit; font-size: 12px;
    color: var(--fg); outline: none; width: 100%; font-weight: 500;
  }

  .rename-input:focus { box-shadow: 0 0 0 2px rgba(255,107,53,0.12); }

  .sb-profile { padding: 10px; border-top: 1px solid var(--border); flex-shrink: 0; }

  .sb-profile-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 10px; border-radius: 10px; cursor: pointer;
    transition: all 0.15s; overflow: hidden;
    border: none; background: transparent; width: 100%; text-align: left;
  }

  .sb-profile-btn:hover { background: var(--surface-2); }

  .sb-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: white;
    flex-shrink: 0; letter-spacing: -0.3px;
    box-shadow: 0 2px 8px rgba(255,107,53,0.30);
  }

  .sb-profile-info { overflow: hidden; white-space: nowrap; }

  .sb-profile-name {
    font-size: 12.5px; font-weight: 600; color: var(--fg-2);
    overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em;
  }

  .shell-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .shell-topbar {
    height: 58px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; flex-shrink: 0;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(16px); gap: 12px;
  }

  .topbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }

  .topbar-title {
    font-size: 13.5px; font-weight: 700; color: var(--fg);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.02em;
  }

  .topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

  .topbar-btn {
    width: 32px; height: 32px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--fg-2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; box-shadow: var(--shadow-sm);
  }

  .topbar-btn:hover { background: var(--surface-2); color: var(--orange); border-color: rgba(255,107,53,0.25); }

  .topbar-plan {
    padding: 5px 12px; border-radius: 100px;
    background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,79,216,0.10));
    border: 1px solid rgba(255,107,53,0.20);
    font-size: 10px; font-weight: 700; color: var(--orange);
    letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
  }

  .shell-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  .drawer-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.30);
    backdrop-filter: blur(4px); z-index: 40;
  }

  .sidebar-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
    background: var(--surface); border-right: 1px solid var(--border);
    z-index: 50; display: flex; flex-direction: column;
    overflow: hidden; box-shadow: var(--shadow-lg);
  }

  .hamburger-btn {
    display: none; width: 32px; height: 32px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--fg-2); cursor: pointer;
    align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; box-shadow: var(--shadow-sm);
  }

  .hamburger-btn:hover { background: var(--surface-2); color: var(--orange); border-color: rgba(255,107,53,0.25); }

  @media (max-width: 768px) {
    .sidebar { display: none; }
    .hamburger-btn { display: flex; }
    .topbar-plan { display: none; }
  }
`;

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSurvey = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconMenu = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l-5.5 9h11z" />
    <circle cx="12" cy="17" r="3" />
    <path d="M9 21h6" />
  </svg>
);

const IconPen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ─── Convo Menu Component ────────────────────────────────────────────────────
function ConvoMenu({ convo, onPin, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(convo.title);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left - 118 + rect.width // align right edge of menu with right edge of button
    });
    setOpen(!open);
  };

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== convo.title) {
      onRename(convo.id, trimmed);
    }
    setRenaming(false);
  };

  const handleRenameKey = (e) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") setRenaming(false);
  };

  return (
    <div className="convo-menu-wrap" ref={menuRef}>
      <button
        ref={btnRef}
        className="convo-menu-btn"
        onClick={handleOpen}
      >
        <IconThreeDots />
      </button>

      {open && (
        <div
          className="convo-menu-dropdown"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            className="convo-menu-item"
            onClick={(e) => { e.stopPropagation(); onPin(convo.id); setOpen(false); }}
          >
            <span className={convo.pinned ? "convo-pin-icon" : ""}>
              <IconPin />
            </span>
            {convo.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            className="convo-menu-item"
            onClick={(e) => { e.stopPropagation(); setRenaming(true); setOpen(false); }}
          >
            <IconPen /> Rename
          </button>
          <button
            className="convo-menu-item danger"
            onClick={(e) => { e.stopPropagation(); onDelete(convo.id); setOpen(false); }}
          >
            <IconTrash /> Delete
          </button>
        </div>
      )}

      {renaming && (
        <input
          className="rename-input"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKey}
          onBlur={handleRename}
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      )}
    </div>
  );
}

// ─── Sidebar content (shared between desktop + mobile drawer) ────────────────
function SidebarContent({ expanded, conversations, activeConvoId, onNewChat, onSelectConvo, onNavigate, onSignOut, currentPath, profile, onClose, onPinConvo, onRenameConvo, onDeleteConvo }) {
  const navigate = useNavigate();

  const NAV = [
    { label: "Chat", icon: <IconChat />, path: "/" },
    { label: "Surveys", icon: <IconSurvey />, path: "/surveys" },
    { label: "Settings", icon: <IconSettings />, path: "/settings" },
  ];

  const initials = profile?.founder_name
    ? profile.founder_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handle = (path) => {
    navigate(path);
    onClose?.();
  };

  // Sort: pinned first, then by date
  const sortedConvos = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <>
      {/* Logo */}
      <div className="sb-logo-wrap">
        <div className="sb-logo-mark">A</div>
        {expanded && (
          <div className="sb-logo-text">
            <div className="sb-logo-name">Asha</div>
            <div className="sb-logo-by">by Mexuri</div>
          </div>
        )}
      </div>

      {/* New chat */}
      <button className="sb-new-btn" onClick={() => { onNewChat(); onClose?.(); }}>
        <span className="sb-new-icon"><IconPlus /></span>
        {expanded && <span>New chat</span>}
      </button>

      {/* Nav */}
      <div className="sb-nav">
        {NAV.map(item => (
          <div
            key={item.path}
            className={`sb-nav-item ${currentPath === item.path ? "active" : ""}`}
            onClick={() => handle(item.path)}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            {expanded && <span>{item.label}</span>}
          </div>
        ))}
      </div>

      <div className="sb-divider" />

      {/* Conversations */}
      {expanded && <div className="sb-section-label">Recent</div>}
      <div className="sb-convos">
        {sortedConvos.length === 0
          ? expanded && <div className="sb-empty-convos">No conversations yet</div>
          : sortedConvos.map(c => (
            <div
              key={c.id}
              className={`sb-convo-item ${activeConvoId === c.id ? "active" : ""} ${c.pinned ? "pinned" : ""}`}
              onClick={() => { onSelectConvo(c.id); onClose?.(); }}
            >
              <div className="sb-convo-dot" />
              {expanded && (
                <>
                  <div className="sb-convo-title">{c.title}</div>
                  <ConvoMenu
                    convo={c}
                    onPin={onPinConvo}
                    onRename={onRenameConvo}
                    onDelete={onDeleteConvo}
                  />
                </>
              )}
            </div>
          ))
        }
      </div>

      {/* Profile */}
      <div className="sb-profile">
        <button className="sb-profile-btn" onClick={() => handle("/settings")}>
          <div className="sb-avatar">{initials}</div>
          {expanded && (
            <div className="sb-profile-info">
              <div className="sb-profile-name">
                {profile?.founder_name || profile?.business_name || "My account"}
              </div>
            </div>
          )}
        </button>
      </div>
    </>
  );
}

// ─── Main AppShell ────────────────────────────────────────────────────────────
export default function AppShell() {
  const { profile, signOut, theme } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const hoverTimeout = useRef(null);

  // Page title map
  const PAGE_TITLES = {
    "/": activeConvoId
      ? conversations.find(c => c.id === activeConvoId)?.title || "Chat"
      : "New conversation",
    "/settings": "Settings",
    "/surveys": "Surveys",
  };

  const pageTitle = PAGE_TITLES[location.pathname] || "Asha";

  // Load conversations
  useEffect(() => {
    if (profile?.id) loadConversations();
  }, [profile?.id]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at, pinned")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    navigate("/");
  };

  const handleSelectConvo = (convoId) => {
    setActiveConvoId(convoId);
    // Always route to chat when a conversation is clicked
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  // ─── Chat Summarization ───────────────────────────────────────────────────
  const summarizeChat = async (convoId) => {
    try {
      // Get recent messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true })
        .limit(6);

      if (!msgs || msgs.length < 2) return;

      const chatText = msgs.map(m => `${m.role}: ${m.content.slice(0, 200)}`).join("\n");

      // Simple rule-based summarization (no API call needed for common cases)
      const firstUserMsg = msgs.find(m => m.role === "user")?.content || "";
      const lower = firstUserMsg.toLowerCase();

      let summary = "";

      // Greeting detection
      if (/^(hey|hi|hello|what's up|yo|sup|hola|good morning|good afternoon|good evening)/i.test(firstUserMsg)) {
        summary = "Greeting";
      }
      // Idea validation
      else if (lower.includes("idea") || lower.includes("validate") || lower.includes("think")) {
        summary = firstUserMsg.slice(0, 35).replace(/^(my |an |the )/i, "").replace(/\?$/, "") + " validation";
      }
      // Market research
      else if (lower.includes("market") || lower.includes("research") || lower.includes("size") || lower.includes("sector")) {
        summary = firstUserMsg.slice(0, 35).replace(/\?$/, "");
      }
      // Strategy
      else if (lower.includes("strategy") || lower.includes("plan") || lower.includes("how do i")) {
        summary = firstUserMsg.slice(0, 35).replace(/\?$/, "");
      }
      // Default: first 30 chars
      else {
        summary = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? "…" : "");
      }

      // Clean up
      summary = summary.trim();
      if (summary.length < 3) summary = "Chat";
      if (summary.length > 40) summary = summary.slice(0, 40) + "…";

      // Update in DB
      await supabase
        .from("conversations")
        .update({ title: summary })
        .eq("id", convoId);

      // Update local state
      setConversations(prev => prev.map(c =>
        c.id === convoId ? { ...c, title: summary } : c
      ));

    } catch (err) {
      console.error("[SUMMARIZE] Error:", err);
    }
  };

  // Summarize when messages change (called from child via context)
  const triggerSummarize = (convoId) => {
    // Debounce: wait 3 seconds after last message before summarizing
    setTimeout(() => summarizeChat(convoId), 3000);
  };

  // ─── Pin / Rename / Delete ──────────────────────────────────────────────────
  const handlePinConvo = async (convoId) => {
    const convo = conversations.find(c => c.id === convoId);
    if (!convo) return;

    const newPinned = !convo.pinned;
    await supabase.from("conversations").update({ pinned: newPinned }).eq("id", convoId);

    setConversations(prev => prev.map(c =>
      c.id === convoId ? { ...c, pinned: newPinned } : c
    ));
  };

  const handleRenameConvo = async (convoId, newTitle) => {
    await supabase.from("conversations").update({ title: newTitle }).eq("id", convoId);

    setConversations(prev => prev.map(c =>
      c.id === convoId ? { ...c, title: newTitle } : c
    ));
  };

  const handleDeleteConvo = async (convoId) => {
    await supabase.from("conversations").delete().eq("id", convoId);

    setConversations(prev => prev.filter(c => c.id !== convoId));
    if (activeConvoId === convoId) {
      setActiveConvoId(null);
      navigate("/");
    }
  };

  // Hover expand/collapse for desktop sidebar
  const onSidebarMouseEnter = () => {
    clearTimeout(hoverTimeout.current);
    setSidebarExpanded(true);
  };

  const onSidebarMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setSidebarExpanded(false), 200);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell-wrap">

        {/* ─── Desktop sidebar ─── */}
        <div
          className={`sidebar ${sidebarExpanded ? "expanded" : "collapsed"}`}
          onMouseEnter={onSidebarMouseEnter}
          onMouseLeave={onSidebarMouseLeave}
        >
          <SidebarContent
            expanded={sidebarExpanded}
            conversations={conversations}
            activeConvoId={activeConvoId}
            onNewChat={handleNewChat}
            onSelectConvo={handleSelectConvo}
            currentPath={location.pathname}
            profile={profile}
            onSignOut={signOut}
            onPinConvo={handlePinConvo}
            onRenameConvo={handleRenameConvo}
            onDeleteConvo={handleDeleteConvo}
          />
        </div>

        {/* ─── Mobile drawer ─── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="sidebar-drawer"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              >
                <SidebarContent
                  expanded={true}
                  conversations={conversations}
                  activeConvoId={activeConvoId}
                  onNewChat={handleNewChat}
                  onSelectConvo={handleSelectConvo}
                  currentPath={location.pathname}
                  profile={profile}
                  onSignOut={signOut}
                  onClose={() => setDrawerOpen(false)}
                  onPinConvo={handlePinConvo}
                  onRenameConvo={handleRenameConvo}
                  onDeleteConvo={handleDeleteConvo}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main area ─── */}
        <div className="shell-main">

          {/* Top bar */}
          <div className="shell-topbar">
            <div className="topbar-left">
              <button className="hamburger-btn" onClick={() => setDrawerOpen(true)}>
                <IconMenu />
              </button>
              <div className="topbar-title">{pageTitle}</div>
            </div>
            <div className="topbar-right">
              <button className="topbar-btn" title="New chat" onClick={handleNewChat}>
                <IconPlus />
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="shell-content">
            <Outlet context={{
              activeConvoId,
              setActiveConvoId,
              loadConversations,
              triggerSummarize
            }} />
          </div>

        </div>
      </div>
    </>
  );
}