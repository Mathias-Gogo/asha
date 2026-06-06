import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06060a; overflow: hidden; }

  .shell-wrap {
    display: flex;
    height: 100vh;
    height: 100dvh;
    background: #06060a;
    font-family: 'Montserrat', sans-serif;
    color: rgba(255,255,255,0.85);
    overflow: hidden;
    position: relative;
  }

  [data-theme="light"] {
  --bg: #f8f8fc;
  --surface: #ffffff;
  --surface-2: #f0f0f5;
  --fg: rgba(0,0,0,0.85);
  --fg-2: rgba(0,0,0,0.45);
  --muted: rgba(0,0,0,0.25);
  --border: rgba(0,0,0,0.07);
  --input-bg: rgba(0,0,0,0.03);
}

[data-theme="light"] .shell-wrap {
  background: #f8f8fc;
  color: rgba(0,0,0,0.85);
}

[data-theme="light"] .sidebar {
  background: #f0f0f5;
  border-right-color: rgba(0,0,0,0.07);
}

[data-theme="light"] .sidebar-drawer {
  background: #f0f0f5;
  border-right-color: rgba(0,0,0,0.07);
}

[data-theme="light"] .sb-logo-wrap {
  border-bottom-color: rgba(0,0,0,0.06);
}

[data-theme="light"] .sb-logo-name { color: rgba(0,0,0,0.7); }
[data-theme="light"] .sb-logo-by   { color: rgba(0,0,0,0.25); }

[data-theme="light"] .sb-nav-item {
  color: rgba(0,0,0,0.35);
}

[data-theme="light"] .sb-nav-item:hover {
  background: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.65);
}

[data-theme="light"] .sb-section-label { color: rgba(0,0,0,0.2); }

[data-theme="light"] .sb-convo-title   { color: rgba(0,0,0,0.4); }
[data-theme="light"] .sb-convo-item:hover { background: rgba(0,0,0,0.04); }
[data-theme="light"] .sb-empty-convos  { color: rgba(0,0,0,0.2); }

[data-theme="light"] .sb-divider { background: rgba(0,0,0,0.06); }

[data-theme="light"] .sb-profile-btn:hover { background: rgba(0,0,0,0.04); }
[data-theme="light"] .sb-profile-name { color: rgba(0,0,0,0.5); }

[data-theme="light"] .shell-topbar {
  background: rgba(248,248,252,0.9);
  border-bottom-color: rgba(0,0,0,0.07);
}

[data-theme="light"] .topbar-title  { color: rgba(0,0,0,0.5); }
[data-theme="light"] .topbar-btn {
  border-color: rgba(0,0,0,0.08);
  color: rgba(0,0,0,0.35);
}

[data-theme="light"] .topbar-btn:hover {
  background: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.65);
}

[data-theme="light"] .hamburger-btn {
  border-color: rgba(0,0,0,0.08);
  color: rgba(0,0,0,0.4);
}

  /* ─── Sidebar ─── */
  .sidebar {
    height: 100%;
    background: #0a0a0f;
    border-right: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: width 0.25s cubic-bezier(0.32, 0.72, 0, 1);
    position: relative;
    z-index: 20;
  }

  .sidebar.collapsed { width: 56px; }
  .sidebar.expanded  { width: 244px; }

  /* Logo area */
  .sb-logo-wrap {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 13px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
    gap: 10px;
    overflow: hidden;
  }

  .sb-logo-mark {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: white;
    flex-shrink: 0;
    letter-spacing: -0.5px;
  }

  .sb-logo-text {
    display: flex; flex-direction: column;
    overflow: hidden; white-space: nowrap;
  }

  .sb-logo-name {
    font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.8);
    letter-spacing: -0.03em; line-height: 1;
  }

  .sb-logo-by {
    font-size: 9px; font-weight: 600;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-top: 2px;
  }

  /* New chat button */
  .sb-new-btn {
    margin: 10px 8px 6px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(124,58,237,0.3);
    background: rgba(124,58,237,0.08);
    color: #a78bfa;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    white-space: nowrap;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sb-new-btn:hover {
    background: rgba(124,58,237,0.15);
    border-color: rgba(124,58,237,0.5);
  }

  .sb-new-icon {
    width: 16px; height: 16px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; line-height: 1;
  }

  /* Nav items */
  .sb-nav {
    padding: 6px 8px;
    display: flex; flex-direction: column; gap: 2px;
    flex-shrink: 0;
  }

  .sb-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 9px;
    border-radius: 8px;
    cursor: pointer;
    color: rgba(255,255,255,0.3);
    font-size: 12px; font-weight: 600;
    transition: all 0.15s;
    white-space: nowrap; overflow: hidden;
    text-decoration: none;
    letter-spacing: 0.01em;
    border: 1px solid transparent;
    flex-shrink: 0;
  }

  .sb-nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6);
  }

  .sb-nav-item.active {
    background: rgba(124,58,237,0.1);
    color: #a78bfa;
    border-color: rgba(124,58,237,0.15);
  }

  .sb-nav-icon {
    width: 16px; height: 16px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* Divider */
  .sb-divider {
    height: 1px;
    background: rgba(255,255,255,0.04);
    margin: 6px 8px;
    flex-shrink: 0;
  }

  /* Conversations section */
  .sb-section-label {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.15);
    padding: 6px 12px 4px;
    white-space: nowrap;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sb-convos {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2px 8px;
  }

  .sb-convos::-webkit-scrollbar { width: 3px; }
  .sb-convos::-webkit-scrollbar-track { background: transparent; }
  .sb-convos::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  .sb-convo-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 9px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap; overflow: hidden;
    border: 1px solid transparent;
  }

  .sb-convo-item:hover { background: rgba(255,255,255,0.04); }

  .sb-convo-item.active {
    background: rgba(124,58,237,0.08);
    border-color: rgba(124,58,237,0.12);
  }

  .sb-convo-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.1); flex-shrink: 0;
  }

  .sb-convo-item.active .sb-convo-dot { background: #7c3aed; }

  .sb-convo-title {
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.35);
    overflow: hidden; text-overflow: ellipsis;
    line-height: 1.3;
  }

  .sb-convo-item.active .sb-convo-title { color: rgba(255,255,255,0.65); }

  .sb-empty-convos {
    font-size: 11px; color: rgba(255,255,255,0.12);
    padding: 12px 12px; font-weight: 500;
    white-space: nowrap; overflow: hidden;
  }

  /* Profile bottom */
  .sb-profile {
    padding: 8px;
    border-top: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
  }

  .sb-profile-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 9px;
    border-radius: 8px; cursor: pointer;
    transition: all 0.15s; overflow: hidden;
    border: none; background: transparent; width: 100%;
    text-align: left;
  }

  .sb-profile-btn:hover { background: rgba(255,255,255,0.04); }

  .sb-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: white;
    flex-shrink: 0; letter-spacing: -0.3px;
  }

  .sb-profile-info { overflow: hidden; white-space: nowrap; }

  .sb-profile-name {
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.55);
    overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  /* ─── Main area ─── */
  .shell-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* Top bar */
  .shell-topbar {
    height: 56px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
    background: rgba(6,6,10,0.8);
    backdrop-filter: blur(12px);
    gap: 12px;
  }

  .topbar-left {
    display: flex; align-items: center; gap: 10px;
    min-width: 0; flex: 1;
  }

  .topbar-title {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.5);
    white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  .topbar-right {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0;
  }

  .topbar-btn {
    width: 30px; height: 30px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    font-size: 14px;
  }

  .topbar-btn:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6);
    border-color: rgba(255,255,255,0.12);
  }

  .topbar-plan {
    padding: 4px 10px;
    border-radius: 100px;
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.2);
    font-size: 10px; font-weight: 700;
    color: #a78bfa;
    letter-spacing: 0.08em; text-transform: uppercase;
    white-space: nowrap;
  }

  /* Page content */
  .shell-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ─── Mobile drawer backdrop ─── */
  .drawer-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 40;
  }

  /* ─── Mobile drawer ─── */
  .sidebar-drawer {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 280px;
    background: #0a0a0f;
    border-right: 1px solid rgba(255,255,255,0.06);
    z-index: 50;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* ─── Hamburger ─── */
  .hamburger-btn {
    display: none;
    width: 30px; height: 30px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .hamburger-btn:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
  }

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

// ─── Sidebar content (shared between desktop + mobile drawer) ────────────────
function SidebarContent({ expanded, conversations, activeConvoId, onNewChat, onSelectConvo, onNavigate, onSignOut, currentPath, profile, onClose }) {
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
        {conversations.length === 0
          ? expanded && <div className="sb-empty-convos">No conversations yet</div>
          : conversations.map(c => (
            <div
              key={c.id}
              className={`sb-convo-item ${activeConvoId === c.id ? "active" : ""}`}
              onClick={() => { onSelectConvo(c.id); onClose?.(); }}
            >
              <div className="sb-convo-dot" />
              {expanded && <div className="sb-convo-title">{c.title}</div>}
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
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    navigate("/");
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
            onSelectConvo={setActiveConvoId}
            currentPath={location.pathname}
            profile={profile}
            onSignOut={signOut}
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
                  onSelectConvo={setActiveConvoId}
                  currentPath={location.pathname}
                  profile={profile}
                  onSignOut={signOut}
                  onClose={() => setDrawerOpen(false)}
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
            <Outlet context={{ activeConvoId, setActiveConvoId, loadConversations }} />
          </div>

        </div>
      </div>
    </>
  );
}