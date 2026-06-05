import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .settings-wrap {
    height: 100%;
    overflow-y: auto;
    background: #06060a;
    font-family: 'Montserrat', sans-serif;
    color: rgba(255,255,255,0.85);
  }

  [data-theme="light"] .settings-wrap {
    background: #f8f8fc;
    color: rgba(0,0,0,0.85);
  }

  .settings-wrap::-webkit-scrollbar { width: 3px; }
  .settings-wrap::-webkit-scrollbar-track { background: transparent; }
  .settings-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  .settings-inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 36px 28px 60px;
  }

  /* ── Page header ── */
  .settings-page-title {
    font-size: 20px; font-weight: 800;
    color: rgba(255,255,255,0.88);
    letter-spacing: -0.04em; margin-bottom: 4px;
  }

  [data-theme="light"] .settings-page-title { color: rgba(0,0,0,0.85); }

  .settings-page-sub {
    font-size: 12px; color: rgba(255,255,255,0.2);
    font-weight: 500; margin-bottom: 36px;
    letter-spacing: 0.01em;
  }

  [data-theme="light"] .settings-page-sub { color: rgba(0,0,0,0.35); }

  /* ── Section ── */
  .settings-section { margin-bottom: 36px; }

  .settings-section-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .settings-section-title {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    display: flex; align-items: center; gap: 8px;
  }

  [data-theme="light"] .settings-section-title { color: rgba(0,0,0,0.3); }

  .settings-section-title::after {
    content: '';
    display: block; height: 1px; width: 40px;
    background: rgba(255,255,255,0.06);
  }

  [data-theme="light"] .settings-section-title::after { background: rgba(0,0,0,0.08); }

  /* ── Card ── */
  .settings-card {
    background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }

  [data-theme="light"] .settings-card {
    background: #ffffff;
    border-color: rgba(0,0,0,0.07);
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }

  .settings-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent);
  }

  /* ── Field row ── */
  .settings-field {
    display: grid;
    grid-template-columns: 160px 1fr;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 16px;
  }

  [data-theme="light"] .settings-field { border-bottom-color: rgba(0,0,0,0.05); }

  .settings-field:last-child { border-bottom: none; }

  .settings-field-label {
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.04em; white-space: nowrap;
  }

  [data-theme="light"] .settings-field-label { color: rgba(0,0,0,0.4); }

  .settings-input {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 8px 12px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.82);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }

  [data-theme="light"] .settings-input {
    background: #f8f8fc;
    border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.8);
  }

  .settings-input:focus {
    border-color: rgba(124,58,237,0.4);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.06);
  }

  .settings-input::placeholder { color: rgba(255,255,255,0.15); }
  [data-theme="light"] .settings-input::placeholder { color: rgba(0,0,0,0.2); }

  /* ── Save row ── */
  .settings-save-row {
    padding: 14px 20px;
    display: flex; justify-content: flex-end;
    border-top: 1px solid rgba(255,255,255,0.04);
    gap: 10px; align-items: center;
  }

  [data-theme="light"] .settings-save-row { border-top-color: rgba(0,0,0,0.05); }

  .settings-save-btn {
    background: #7c3aed; border: none;
    border-radius: 8px; padding: 8px 20px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    color: white; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }

  .settings-save-btn:hover:not(:disabled) {
    background: #6d28d9;
    box-shadow: 0 4px 20px rgba(124,58,237,0.45);
  }

  .settings-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .settings-saved-msg {
    font-size: 11px; font-weight: 600;
    color: #6ee7b7; letter-spacing: 0.04em;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Business data ── */
  .rag-chunks {
    padding: 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
  }

  .rag-chunk {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px; padding: 10px 14px;
    font-size: 12px; line-height: 1.65;
    color: rgba(255,255,255,0.45); font-weight: 400;
  }

  [data-theme="light"] .rag-chunk {
    background: #f4f4f8;
    border-color: rgba(0,0,0,0.06);
    color: rgba(0,0,0,0.5);
  }

  .rag-chunk-source {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(124,58,237,0.6); margin-bottom: 4px;
  }

  .rag-add-wrap {
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex; flex-direction: column; gap: 8px;
  }

  [data-theme="light"] .rag-add-wrap { border-top-color: rgba(0,0,0,0.05); }

  .rag-add-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.15);
  }

  [data-theme="light"] .rag-add-label { color: rgba(0,0,0,0.25); }

  textarea.settings-input {
    resize: none; min-height: 80px; line-height: 1.65;
  }

  .rag-add-btn {
    align-self: flex-end;
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 8px; padding: 7px 18px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    color: #a78bfa; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
  }

  .rag-add-btn:hover:not(:disabled) {
    background: rgba(124,58,237,0.18);
    border-color: rgba(124,58,237,0.45);
  }

  .rag-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .rag-empty {
    padding: 24px 20px;
    font-size: 12px; color: rgba(255,255,255,0.15);
    text-align: center; font-weight: 500;
  }

  [data-theme="light"] .rag-empty { color: rgba(0,0,0,0.2); }

  /* ── Appearance ── */
  .appearance-row {
    padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px;
  }

  .appearance-label {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.55);
  }

  [data-theme="light"] .appearance-label { color: rgba(0,0,0,0.6); }

  .appearance-sub {
    font-size: 11px; color: rgba(255,255,255,0.2);
    margin-top: 2px; font-weight: 400;
  }

  [data-theme="light"] .appearance-sub { color: rgba(0,0,0,0.3); }

  .toggle-wrap {
    display: flex;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; padding: 3px; gap: 3px;
    flex-shrink: 0;
  }

  [data-theme="light"] .toggle-wrap {
    background: rgba(0,0,0,0.04);
    border-color: rgba(0,0,0,0.08);
  }

  .toggle-opt {
    padding: 6px 16px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    color: rgba(255,255,255,0.25);
    font-family: 'Montserrat', sans-serif;
    border: none; background: transparent;
    letter-spacing: 0.03em;
  }

  [data-theme="light"] .toggle-opt { color: rgba(0,0,0,0.3); }

  .toggle-opt.active {
    background: #141419;
    color: rgba(255,255,255,0.8);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  [data-theme="light"] .toggle-opt.active {
    background: #ffffff;
    color: rgba(0,0,0,0.75);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  /* ── Plan grid ── */
  .plan-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .plan-card {
    background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 20px 16px;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: border-color 0.2s;
  }

  [data-theme="light"] .plan-card {
    background: #ffffff;
    border-color: rgba(0,0,0,0.07);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .plan-card.current {
    border-color: rgba(124,58,237,0.4);
    background: rgba(124,58,237,0.05);
  }

  .plan-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent);
    opacity: 0; transition: opacity 0.2s;
  }

  .plan-card.current::before { opacity: 1; }

  .plan-current-badge {
    display: inline-flex; align-items: center;
    padding: 3px 8px; border-radius: 100px;
    background: rgba(124,58,237,0.15);
    border: 1px solid rgba(124,58,237,0.3);
    font-size: 9px; font-weight: 700;
    color: #a78bfa; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 8px;
    width: fit-content;
  }

  .plan-name {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); margin-bottom: 6px;
  }

  [data-theme="light"] .plan-name { color: rgba(0,0,0,0.3); }
  .plan-card.current .plan-name { color: #a78bfa; }

  .plan-price {
    font-size: 20px; font-weight: 800;
    color: rgba(255,255,255,0.82);
    letter-spacing: -0.03em; margin-bottom: 14px;
  }

  [data-theme="light"] .plan-price { color: rgba(0,0,0,0.8); }

  .plan-price sub {
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.2); vertical-align: baseline;
  }

  [data-theme="light"] .plan-price sub { color: rgba(0,0,0,0.25); }

  .plan-divider {
    height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 12px;
  }

  [data-theme="light"] .plan-divider { background: rgba(0,0,0,0.06); }

  .plan-features { display: flex; flex-direction: column; gap: 6px; flex: 1; }

  .plan-feature {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; color: rgba(255,255,255,0.3);
    font-weight: 500; line-height: 1.4;
  }

  [data-theme="light"] .plan-feature { color: rgba(0,0,0,0.4); }
  .plan-card.current .plan-feature { color: rgba(255,255,255,0.55); }
  [data-theme="light"] .plan-card.current .plan-feature { color: rgba(0,0,0,0.6); }

  .plan-feat-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.12); flex-shrink: 0;
  }

  [data-theme="light"] .plan-feat-dot { background: rgba(0,0,0,0.15); }
  .plan-card.current .plan-feat-dot { background: #7c3aed; }

  .plan-action-btn {
    margin-top: 16px; width: 100%; padding: 8px;
    border-radius: 8px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.25);
  }

  [data-theme="light"] .plan-action-btn {
    border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.3);
  }

  .plan-action-btn:hover:not(:disabled) {
    border-color: rgba(124,58,237,0.4);
    color: #a78bfa;
    background: rgba(124,58,237,0.06);
  }

  .plan-action-btn.current-btn {
    background: rgba(124,58,237,0.08);
    border-color: rgba(124,58,237,0.2);
    color: rgba(124,58,237,0.5);
    cursor: default;
  }

  /* ── Danger zone ── */
  .danger-card {
    background: rgba(239,68,68,0.04);
    border: 1px solid rgba(239,68,68,0.1);
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
  }

  .danger-label {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.5);
  }

  [data-theme="light"] .danger-label { color: rgba(0,0,0,0.55); }

  .danger-sub {
    font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 2px;
  }

  [data-theme="light"] .danger-sub { color: rgba(0,0,0,0.3); }

  .danger-btn {
    background: transparent;
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px; padding: 7px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    color: rgba(239,68,68,0.6); cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .danger-btn:hover {
    background: rgba(239,68,68,0.08);
    border-color: rgba(239,68,68,0.45);
    color: #fca5a5;
  }

  @media (max-width: 600px) {
    .settings-inner { padding: 24px 16px 48px; }
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

          {/* ── Plan ── */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-section-title">Plan</div>
            </div>
            <div className="plan-grid">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-card ${currentPlan === plan.id ? "current" : ""}`}
                >
                  {currentPlan === plan.id && (
                    <div className="plan-current-badge">Current plan</div>
                  )}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    {plan.price}<sub>/mo</sub>
                  </div>
                  <div className="plan-divider" />
                  <div className="plan-features">
                    {plan.features.map(f => (
                      <div key={f} className="plan-feature">
                        <div className="plan-feat-dot" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    className={`plan-action-btn ${currentPlan === plan.id ? "current-btn" : ""}`}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? "Current plan" : "Upgrade"}
                  </button>
                </div>
              ))}
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