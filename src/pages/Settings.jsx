import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
    --violet:     #7c3aed;
    --emerald:    #10b981;
    --shadow-sm:  0 1px 8px rgba(0,0,0,0.07);
    --shadow-md:  0 4px 24px rgba(0,0,0,0.10);
    --shadow-lg:  0 12px 48px rgba(0,0,0,0.14);
  }

  .settings-wrap {
    height: 100%; overflow-y: auto;
    background: var(--bg);
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--fg);
  }

  .settings-wrap::-webkit-scrollbar { width: 4px; }
  .settings-wrap::-webkit-scrollbar-track { background: transparent; }
  .settings-wrap::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.20); border-radius: 4px; }

  .settings-inner {
    max-width: 720px; margin: 0 auto;
    padding: 40px 32px 80px;
  }

  /* ── Page header ── */
  .settings-page-title {
    font-size: 26px; font-weight: 800;
    color: var(--fg); letter-spacing: -0.04em; margin-bottom: 6px;
  }

  .settings-page-sub {
    font-size: 13.5px; color: var(--fg-2); font-weight: 400;
    margin-bottom: 48px; line-height: 1.5;
  }

  /* ── Section ── */
  .settings-section { margin-bottom: 40px; }

  .settings-section-header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 14px;
  }

  .settings-section-title {
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--fg-3);
    display: flex; align-items: center; gap: 8px;
  }

  .settings-section-title::after {
    content: ''; display: block; height: 1px; width: 32px;
    background: var(--border-2);
  }

  /* ── Card ── */
  .settings-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    position: relative;
  }

  .settings-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8, #7c3aed);
    border-radius: 16px 16px 0 0;
  }

  /* ── Field row ── */
  .settings-field {
    display: grid; grid-template-columns: 160px 1fr;
    align-items: center; padding: 16px 22px;
    border-bottom: 1px solid var(--border); gap: 16px;
  }

  .settings-field:last-child { border-bottom: none; }

  .settings-field-label {
    font-size: 13px; font-weight: 600; color: var(--fg);
    letter-spacing: -0.01em;
  }

  .settings-input {
    width: 100%; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 10px; padding: 9px 14px;
    font-family: inherit; font-size: 13.5px; font-weight: 500;
    color: var(--fg); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .settings-input:focus {
    border-color: rgba(255,107,53,0.50);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.10);
    background: var(--surface);
  }

  .settings-input::placeholder { color: var(--fg-3); }

  /* ── Save row ── */
  .settings-save-row {
    padding: 14px 22px;
    display: flex; justify-content: flex-end;
    border-top: 1px solid var(--border);
    gap: 10px; align-items: center;
  }

  .settings-save-btn {
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    border: none; border-radius: 10px; padding: 9px 24px;
    font-family: inherit; font-size: 12.5px; font-weight: 700;
    color: white; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(255,107,53,0.30);
  }

  .settings-save-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(255,107,53,0.45);
  }

  .settings-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .settings-saved-msg {
    font-size: 12px; font-weight: 700;
    color: #10b981; letter-spacing: 0.02em;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Business data ── */
  .rag-chunks {
    padding: 18px 22px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .rag-chunk {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; line-height: 1.65;
    color: var(--fg-2); font-weight: 400;
  }

  .rag-chunk-source {
    font-size: 9.5px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--orange); margin-bottom: 5px;
  }

  .rag-add-wrap {
    padding: 16px 22px;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 10px;
  }

  .rag-add-label {
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--fg-3);
  }

  textarea.settings-input {
    resize: none; min-height: 90px; line-height: 1.65;
  }

  .rag-add-btn {
    align-self: flex-end;
    background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,79,216,0.08));
    border: 1.5px solid rgba(255,107,53,0.25);
    border-radius: 10px; padding: 8px 20px;
    font-family: inherit; font-size: 12px; font-weight: 700;
    color: var(--orange); cursor: pointer; transition: all 0.2s;
  }

  .rag-add-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255,107,53,0.18), rgba(255,79,216,0.14));
    border-color: rgba(255,107,53,0.45);
    transform: translateY(-1px);
  }

  .rag-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .rag-empty {
    padding: 28px 22px; font-size: 13px; color: var(--fg-3);
    text-align: center; font-weight: 500; line-height: 1.6;
  }

  /* ── Appearance ── */
  .appearance-row {
    padding: 18px 22px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
  }

  .appearance-label { font-size: 13.5px; font-weight: 600; color: var(--fg); }

  .appearance-sub { font-size: 12px; color: var(--fg-3); margin-top: 2px; }

  .toggle-wrap {
    display: flex; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 10px; padding: 3px; gap: 3px; flex-shrink: 0;
  }

  .toggle-opt {
    padding: 7px 18px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    color: var(--fg-3); font-family: inherit;
    border: none; background: transparent; letter-spacing: 0.01em;
  }

  .toggle-opt.active {
    background: var(--surface);
    color: var(--fg); font-weight: 700;
    box-shadow: 0 1px 6px rgba(0,0,0,0.10);
  }

  /* ── Plan grid ── */
  .plan-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }

  .plan-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 16px; padding: 22px 18px;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: all 0.22s; box-shadow: var(--shadow-sm);
  }

  .plan-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

  .plan-card.current {
    border-color: rgba(255,107,53,0.45);
    background: linear-gradient(145deg, #fff8f6, #ffffff);
    box-shadow: 0 4px 20px rgba(255,107,53,0.15);
  }

  .plan-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--orange), var(--pink));
    opacity: 0; transition: opacity 0.2s; border-radius: 16px 16px 0 0;
  }

  .plan-card.current::before { opacity: 1; }

  .plan-current-badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 100px;
    background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,79,216,0.10));
    border: 1px solid rgba(255,107,53,0.25);
    font-size: 9px; font-weight: 800; color: var(--orange);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 10px; width: fit-content;
  }

  .plan-name {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--fg-3); margin-bottom: 6px;
  }

  .plan-card.current .plan-name { color: var(--orange); }

  .plan-price {
    font-size: 22px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.04em; margin-bottom: 16px;
  }

  .plan-price sub { font-size: 12px; font-weight: 500; color: var(--fg-3); vertical-align: baseline; }

  .plan-divider { height: 1px; background: var(--border); margin-bottom: 14px; }

  .plan-features { display: flex; flex-direction: column; gap: 7px; flex: 1; }

  .plan-feature {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--fg-2); font-weight: 500; line-height: 1.4;
  }

  .plan-card.current .plan-feature { color: var(--fg); }

  .plan-feat-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--border-2); flex-shrink: 0;
  }

  .plan-card.current .plan-feat-dot { background: var(--orange); }

  .plan-action-btn {
    margin-top: 18px; width: 100%; padding: 9px;
    border-radius: 10px; font-family: inherit;
    font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    border: 1.5px solid var(--border);
    background: transparent; color: var(--fg-2);
  }

  .plan-action-btn:hover:not(:disabled) {
    border-color: rgba(255,107,53,0.35); color: var(--orange);
    background: var(--orange-dim);
  }

  .plan-action-btn.current-btn {
    background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,79,216,0.08));
    border-color: rgba(255,107,53,0.22); color: var(--orange); cursor: default;
  }

  /* ── Danger zone ── */
  .danger-card {
    background: #fff5f5;
    border: 1.5px solid rgba(239,68,68,0.18);
    border-radius: 14px; padding: 18px 22px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
  }

  .danger-label { font-size: 13.5px; font-weight: 600; color: var(--fg); }

  .danger-sub { font-size: 12px; color: var(--fg-3); margin-top: 3px; }

  .danger-btn {
    background: transparent; border: 1.5px solid rgba(239,68,68,0.30);
    border-radius: 10px; padding: 8px 18px; font-family: inherit;
    font-size: 12px; font-weight: 700; color: #dc2626; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }

  .danger-btn:hover {
    background: rgba(239,68,68,0.08);
    border-color: rgba(239,68,68,0.55);
  }

  @media (max-width: 640px) {
    .settings-inner { padding: 24px 16px 60px; }
    .settings-field { grid-template-columns: 1fr; gap: 6px; }
    .plan-grid { grid-template-columns: 1fr; }
    .appearance-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  }
`;

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₦0",
    features: ["20 chats / day", "No memory", "No surveys", "Basic context"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦9,500",
    features: ["200 chats / day", "Memory", "5 surveys / mo", "Medium RAG"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦25,000",
    features: ["2,000 chats / day", "Full memory", "Unlimited surveys", "Deep RAG"],
  },
];

export default function Settings() {
  const { user, profile, fetchProfile, updateTheme, theme } = useAuth();
  const navigate = useNavigate();

  const [founderName, setFounderName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ragChunks, setRagChunks] = useState([]);
  const [newContext, setNewContext] = useState("");
  const [addingRag, setAddingRag] = useState(false);
  const location = useLocation();

  // Handle navigation from Asha chat
  useEffect(() => {
    if (location.state?.newSurveyId) {
      setActiveSurveyId(location.state.newSurveyId);
      setActiveTab("Form");
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
    if (location.state?.prefillData) {
      // Need to create a temporary survey object or navigate to existing
      // For now, just open Form tab — SurveyForm handles the prefill
      setActiveTab("Form");
    }
  }, [location.state]);

  // Populate fields from profile
  useEffect(() => {
    if (profile) {
      setFounderName(profile.founder_name || "");
      setBusinessName(profile.business_name || "");
      setSector(profile.business_sector || "");
      setStage(profile.business_stage || "");
    }
  }, [profile]);

  // Load RAG chunks
  useEffect(() => {
    if (user?.id) loadRagChunks();
  }, [user?.id]);

  const loadRagChunks = async () => {
    const { data } = await supabase
      .from("business_data")
      .select("id, content, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setRagChunks(data);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        founder_name: founderName || null,
        business_name: businessName || null,
        business_sector: sector || null,
        business_stage: stage || null,
      })
      .eq("id", user.id);

    if (!error) {
      await fetchProfile(user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const addContext = async () => {
    if (!newContext.trim()) return;
    setAddingRag(true);
    const { error } = await supabase
      .from("business_data")
      .insert({
        user_id: user.id,
        content: newContext.trim(),
        source: "addition",
        parent_id: null,
      });

    if (!error) {
      setNewContext("");
      await loadRagChunks();
    }
    setAddingRag(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const currentPlan = profile?.plan || "free";

  return (
    <>
      <style>{STYLES}</style>
      <div className="settings-wrap">
        <div className="settings-inner">

          <div className="settings-page-title">Settings</div>
          <div className="settings-page-sub">
            Manage your profile, business data, and plan.
          </div>

          {/* ── Profile ── */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-section-title">Profile</div>
            </div>
            <div className="settings-card">
              <div className="settings-field">
                <div className="settings-field-label">Founder name</div>
                <input
                  className="settings-input"
                  value={founderName}
                  onChange={e => setFounderName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Business name</div>
                <input
                  className="settings-input"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Sector</div>
                <input
                  className="settings-input"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  placeholder="e.g. Fintech, Edtech, Logistics"
                />
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Stage</div>
                <input
                  className="settings-input"
                  value={stage}
                  onChange={e => setStage(e.target.value)}
                  placeholder="Idea / MVP / Growth / Scaling"
                />
              </div>
              <div className="settings-save-row">
                {saved && <span className="settings-saved-msg">✓ Saved</span>}
                <button
                  className="settings-save-btn"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Business Data ── */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-section-title">Business data</div>
            </div>
            <div className="settings-card">
              <div className="rag-chunks">
                {ragChunks.length === 0 ? (
                  <div className="rag-empty">No business data yet. Add context below.</div>
                ) : (
                  ragChunks.map(chunk => (
                    <div key={chunk.id} className="rag-chunk">
                      <div className="rag-chunk-source">{chunk.source}</div>
                      {chunk.content}
                    </div>
                  ))
                )}
              </div>
              <div className="rag-add-wrap">
                <div className="rag-add-label">Add more context</div>
                <textarea
                  className="settings-input"
                  placeholder="Add anything Asha should know — a pivot, new product, new market…"
                  value={newContext}
                  onChange={e => setNewContext(e.target.value)}
                />
                <button
                  className="rag-add-btn"
                  onClick={addContext}
                  disabled={addingRag || !newContext.trim()}
                >
                  {addingRag ? "Adding…" : "Add context →"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Appearance ── */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-section-title">Appearance</div>
            </div>
            <div className="settings-card">
              <div className="appearance-row">
                <div>
                  <div className="appearance-label">Theme</div>
                  <div className="appearance-sub">
                    Applied instantly across the whole app
                  </div>
                </div>
                <div className="toggle-wrap">
                  {["dark", "light"].map(t => (
                    <button
                      key={t}
                      className={`toggle-opt ${theme === t ? "active" : ""}`}
                      onClick={() => updateTheme(t)}
                    >
                      {t === "dark" ? "🌙 Dark" : "☀️ Light"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Account ── */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-section-title">Account</div>
            </div>
            <div className="danger-card">
              <div>
                <div className="danger-label">Sign out</div>
                <div className="danger-sub">
                  You'll need to sign back in to access Asha.
                </div>
              </div>
              <button className="danger-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}