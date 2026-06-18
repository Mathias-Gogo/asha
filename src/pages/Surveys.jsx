import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import SurveyForm from "../components/surveys/SurveyForm";
import SurveyResponses from "../components/surveys/SurveyResponse";
import SurveySettings from "../components/surveys/SurveySettings";

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

  .surveys-wrap {
    height: 100%; display: flex;
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden; background: var(--bg);
  }

  /* ── Left panel ── */
  .surveys-list {
    width: 252px; flex-shrink: 0;
    display: flex; flex-direction: column;
    border-right: 1px solid var(--border);
    overflow: hidden; background: var(--surface);
    box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  }

  .surveys-list-header {
    padding: 18px 16px 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; display: flex;
    align-items: center; justify-content: space-between;
  }

  .surveys-list-title {
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-3);
  }

  .surveys-new-btn {
    width: 26px; height: 26px; border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; font-size: 17px; line-height: 1;
    box-shadow: 0 2px 8px rgba(255,107,53,0.30);
  }

  .surveys-new-btn:hover { transform: scale(1.08); box-shadow: 0 3px 12px rgba(255,107,53,0.40); }
  .surveys-new-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .surveys-cards {
    flex: 1; overflow-y: auto; padding: 10px;
    display: flex; flex-direction: column; gap: 7px;
  }

  .surveys-cards::-webkit-scrollbar { width: 3px; }
  .surveys-cards::-webkit-scrollbar-track { background: transparent; }
  .surveys-cards::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.15); border-radius: 3px; }

  /* ── Survey card ── */
  .survey-card {
    padding: 13px 15px; border-radius: 12px;
    border: 1.5px solid var(--border);
    background: var(--surface-2); cursor: pointer;
    transition: all 0.2s; text-align: left;
    display: flex; flex-direction: column; gap: 7px;
    position: relative; overflow: hidden; width: 100%;
    box-shadow: var(--shadow-sm);
  }

  .survey-card:hover {
    background: var(--surface); border-color: rgba(255,107,53,0.25);
    transform: translateY(-1px); box-shadow: var(--shadow-md);
  }

  .survey-card.active {
    background: var(--surface);
    border-color: rgba(255,107,53,0.45);
    box-shadow: 0 2px 16px rgba(255,107,53,0.14);
  }

  .survey-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 3px; height: 100%;
    background: linear-gradient(to bottom, #ff6b35, #ff4fd8);
    opacity: 0; transition: opacity 0.2s;
    border-radius: 0 0 0 12px;
  }

  .survey-card.active::before { opacity: 1; }

  .survey-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 8px;
  }

  .survey-card-title {
    font-size: 12.5px; font-weight: 700; color: var(--fg);
    line-height: 1.35; letter-spacing: -0.01em;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }

  .survey-card-status { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

  .survey-status-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--border-2);
  }

  .survey-status-dot.live {
    background: var(--emerald);
    box-shadow: 0 0 7px rgba(16,185,129,0.50);
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .survey-card-meta {
    display: flex; align-items: center; justify-content: space-between;
  }

  .survey-card-date {
    font-size: 10.5px; color: var(--fg-3); font-weight: 500;
  }

  .survey-card-responses {
    font-size: 10.5px; font-weight: 700;
    color: var(--orange); letter-spacing: 0.02em;
  }

  /* Usage footer */
  .surveys-usage {
    padding: 9px 16px;
    font-size: 10.5px; font-weight: 700;
    color: var(--orange); letter-spacing: 0.04em;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  /* ── Workspace ── */
  .surveys-workspace {
    flex: 1; display: flex; flex-direction: column;
    overflow: hidden; min-width: 0; background: var(--bg);
  }

  /* Tab bar */
  .survey-tab-bar {
    display: flex; align-items: center;
    gap: 0; padding: 0 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0; overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--surface);
  }

  .survey-tab-bar::-webkit-scrollbar { display: none; }

  .survey-tab {
    padding: 14px 18px;
    font-family: inherit;
    font-size: 12.5px; font-weight: 600;
    color: var(--fg-3); cursor: pointer; border: none;
    background: transparent;
    border-bottom: 2.5px solid transparent;
    transition: all 0.18s; letter-spacing: -0.01em;
    margin-bottom: -1px; white-space: nowrap; flex-shrink: 0;
  }

  .survey-tab:hover { color: var(--fg); }

  .survey-tab.active {
    color: var(--orange);
    border-bottom-color: var(--orange);
    font-weight: 700;
  }

  .survey-tab-badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 100px;
    background: rgba(255,107,53,0.12);
    font-size: 10px; font-weight: 700;
    color: var(--orange); margin-left: 7px;
  }

  .survey-tab-live {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 100px;
    background: rgba(16,185,129,0.10);
    border: 1px solid rgba(16,185,129,0.25);
    font-size: 10px; font-weight: 700;
    color: var(--emerald); margin-left: 10px;
    white-space: nowrap; flex-shrink: 0;
  }

  .survey-tab-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--emerald); animation: pulse 2s infinite;
  }

  .survey-tab-draft {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 100px;
    background: var(--surface-2);
    font-size: 10px; font-weight: 700;
    color: var(--fg-3); margin-left: 10px;
    white-space: nowrap; flex-shrink: 0;
    border: 1px solid var(--border);
  }

  .survey-tab-content { flex: 1; overflow: hidden; }

  /* Empty states */
  .surveys-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; text-align: center; padding: 48px 24px;
  }

  .surveys-empty-icon { font-size: 32px; margin-bottom: 4px; }

  .surveys-empty-title {
    font-size: 15px; font-weight: 700; color: var(--fg); letter-spacing: -0.02em;
  }

  .surveys-empty-sub {
    font-size: 12.5px; color: var(--fg-3); max-width: 200px;
    line-height: 1.65; font-weight: 400;
  }

  /* Plan lock */
  .surveys-locked {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; text-align: center; padding: 48px;
  }

  .surveys-locked-title {
    font-size: 17px; font-weight: 800; color: var(--fg); letter-spacing: -0.03em;
  }

  .surveys-locked-sub { font-size: 13px; color: var(--fg-2); max-width: 280px; line-height: 1.65; }

  .surveys-upgrade-btn {
    padding: 10px 28px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; margin-top: 4px;
    box-shadow: 0 2px 14px rgba(255,107,53,0.30);
  }

  .surveys-upgrade-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.42); }

  /* Modal */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.35); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .new-survey-modal {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 20px; padding: 36px;
    width: 100%; max-width: 540px;
    display: flex; flex-direction: column; gap: 18px;
    animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
    max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-lg);
    position: relative; overflow: hidden;
  }

  .new-survey-modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8, #7c3aed);
    border-radius: 20px 20px 0 0;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .new-survey-modal-title {
    font-size: 19px; font-weight: 800; color: var(--fg); letter-spacing: -0.04em;
  }

  .new-survey-modal-sub {
    font-size: 13px; color: var(--fg-2); line-height: 1.6; margin-top: -10px;
  }

  .new-survey-textarea {
    width: 100%; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 12px; padding: 14px 18px;
    font-family: inherit; font-size: 13.5px; color: var(--fg);
    resize: none; outline: none; min-height: 110px; line-height: 1.65;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .new-survey-textarea:focus {
    border-color: rgba(255,107,53,0.45);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.08);
    background: var(--surface);
  }

  .new-survey-textarea::placeholder { color: var(--fg-3); }

  .new-survey-modal-actions {
    display: flex; gap: 10px; justify-content: flex-end;
  }

  .modal-cancel-btn {
    padding: 10px 22px; border-radius: 10px;
    border: 1.5px solid var(--border);
    background: transparent; color: var(--fg-2);
    font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }

  .modal-cancel-btn:hover { background: var(--surface-2); color: var(--fg); }

  .modal-generate-btn {
    padding: 10px 26px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 14px rgba(255,107,53,0.30);
  }

  .modal-generate-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.42); }
  .modal-generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Mobile ── */
  .mobile-survey-select {
    display: none; padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .mobile-select {
    width: 100%; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 10px; padding: 10px 14px;
    font-family: inherit; font-size: 13px; color: var(--fg);
    outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(0,0,0,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
  }

  .mobile-drawer-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
    z-index: 40; animation: fadeIn 0.2s ease;
  }

  .mobile-drawer {
    display: none; position: fixed;
    top: 0; left: 0; bottom: 0; width: 280px;
    background: var(--surface); border-right: 1px solid var(--border);
    z-index: 50; flex-direction: column; overflow: hidden;
    animation: slideInLeft 0.25s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: var(--shadow-lg);
  }

  @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }

  .mobile-drawer-header {
    padding: 18px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .mobile-drawer-title { font-size: 13.5px; font-weight: 700; color: var(--fg); }

  .mobile-drawer-close {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--surface-2);
    color: var(--fg-2); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }

  .mobile-menu-btn {
    display: none; width: 34px; height: 34px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--fg-2); cursor: pointer;
    align-items: center; justify-content: center;
    margin-right: 8px; flex-shrink: 0; box-shadow: var(--shadow-sm);
  }

  /* ── Analysis tab ── */
  .analyse-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 22px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(255,107,53,0.28);
  }
  .analyse-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.42); }
  .analyse-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  .analyse-tab-wrap {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; padding: 40px 24px; text-align: center;
  }
  .analyse-tab-icon { font-size: 36px; }
  .analyse-tab-title { font-size: 16px; font-weight: 800; color: var(--fg); letter-spacing: -0.03em; }
  .analyse-tab-sub { font-size: 13px; color: var(--fg-3); max-width: 280px; line-height: 1.65; }

  @media (max-width: 768px) {
    .surveys-wrap { flex-direction: column; }
    .surveys-list { display: none; }
    .mobile-survey-select { display: block; }
    .mobile-menu-btn { display: flex; }
    .mobile-drawer-backdrop.show, .mobile-drawer.show { display: flex; }
    .survey-tab-bar { padding: 0 12px; overflow-x: auto; }
    .survey-tab { padding: 10px 12px; font-size: 12px; }
    .modal-backdrop { padding: 12px; align-items: flex-end; }
    .new-survey-modal { border-radius: 16px 16px 0 0; max-height: 85vh; animation: slideUpMobile 0.3s ease; }
    @keyframes slideUpMobile { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  }

  @media (max-width: 480px) {
    .surveys-empty-title { font-size: 14px; }
    .survey-tab-badge, .survey-tab-live, .survey-tab-draft { display: none; }
  }
`;

const TABS = ["Form", "Responses", "Analysis", "Settings"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function Surveys() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [activeSurveyId, setActiveSurveyId] = useState(null);
  const [activeTab, setActiveTab] = useState("Form");
  const [showModal, setShowModal] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const plan = profile?.plan || "free";
  const canCreate = true;

  useEffect(() => {
    if (user?.id) {
      loadSurveys();
      loadResponseCounts();
      subscribeToResponses();
    }
    return () => {
      supabase.removeAllChannels();
    };
  }, [user?.id]);

  const loadSurveys = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("id, title, is_active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setSurveys(data);
      if (data.length > 0 && !activeSurveyId) setActiveSurveyId(data[0].id);
    }
    setLoading(false);
  };

  const loadResponseCounts = async () => {
    const { data: counts } = await supabase
      .from("survey_responses")
      .select("survey_id");

    if (counts) {
      const grouped = counts.reduce((acc, row) => {
        acc[row.survey_id] = (acc[row.survey_id] || 0) + 1;
        return acc;
      }, {});
      setResponseCounts(grouped);
    }
  };

  const subscribeToResponses = () => {
    supabase
      .channel('survey_responses_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'survey_responses' },
        (payload) => {
          if (payload.new?.survey_id) {
            setResponseCounts(prev => ({
              ...prev,
              [payload.new.survey_id]: (prev[payload.new.survey_id] || 0) + 1
            }));
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'survey_responses' },
        (payload) => {
          if (payload.old?.survey_id) {
            setResponseCounts(prev => ({
              ...prev,
              [payload.old.survey_id]: Math.max(0, (prev[payload.old.survey_id] || 0) - 1)
            }));
          }
        }
      )
      .subscribe();
  };

  const generateSurvey = async () => {
    if (!ideaText.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/survey-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText.trim() }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const parsed = data.survey;

      const { data: saved, error } = await supabase
        .from("surveys")
        .insert({
          user_id: user.id,
          title: parsed.title,
          description: parsed.description,
          questions: parsed.questions,
          is_active: false,

        })
        .select("id, title, is_active, created_at")
        .single();

      if (error) throw error;

      setSurveys(prev => [saved, ...prev]);
      setActiveSurveyId(saved.id);
      setActiveTab("Form");
      setShowModal(false);
      setIdeaText("");
    } catch (err) {
      console.error("Survey generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const activeSurvey = surveys.find(s => s.id === activeSurveyId);

  const handleSurveySelect = (id) => {
    setActiveSurveyId(id);
    setActiveTab("Form");
    setMobileDrawerOpen(false);
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
      Loading surveys…
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="surveys-wrap">

        {(
          <>
            {/* ── Desktop left panel ── */}
            <div className="surveys-list">
              <div className="surveys-list-header">
                <div className="surveys-list-title">Surveys</div>
                <button
                  className="surveys-new-btn"
                  onClick={() => setShowModal(true)}
                  disabled={!canCreate}
                  title={!canCreate ? "Upgrade for more surveys" : "New survey"}
                >
                  +
                </button>
              </div>

              <div className="surveys-cards">
                {surveys.length === 0 ? (
                  <div className="surveys-empty">
                    <div className="surveys-empty-icon">📋</div>
                    <div className="surveys-empty-title">No surveys yet</div>
                    <div className="surveys-empty-sub">Click + to create your first survey</div>
                  </div>
                ) : (
                  surveys.map(s => (
                    <button
                      key={s.id}
                      className={`survey-card ${activeSurveyId === s.id ? "active" : ""}`}
                      onClick={() => handleSurveySelect(s.id)}
                    >
                      <div className="survey-card-top">
                        <div className="survey-card-title">{s.title}</div>
                        <div className="survey-card-status">
                          <div className={`survey-status-dot ${s.is_active ? "live" : ""}`} />
                        </div>
                      </div>
                      <div className="survey-card-meta">
                        <div className="survey-card-date">{formatDate(s.created_at)}</div>
                        {responseCounts[s.id] > 0 && (
                          <div className="survey-card-responses">
                            {responseCounts[s.id]} resp.
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Mobile survey selector ── */}
            <div className="mobile-survey-select">
              <select
                className="mobile-select"
                value={activeSurveyId || ""}
                onChange={(e) => handleSurveySelect(e.target.value)}
              >
                <option value="" disabled>Select a survey</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} {s.is_active ? "(Live)" : "(Draft)"}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Mobile drawer ── */}
            {mobileDrawerOpen && (
              <>
                <div
                  className="mobile-drawer-backdrop show"
                  onClick={() => setMobileDrawerOpen(false)}
                />
                <div className="mobile-drawer show">
                  <div className="mobile-drawer-header">
                    <div className="mobile-drawer-title">Surveys</div>
                    <button
                      className="mobile-drawer-close"
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="surveys-cards" style={{ padding: 8, flex: 1 }}>
                    {surveys.map(s => (
                      <button
                        key={s.id}
                        className={`survey-card ${activeSurveyId === s.id ? "active" : ""}`}
                        onClick={() => handleSurveySelect(s.id)}
                      >
                        <div className="survey-card-top">
                          <div className="survey-card-title">{s.title}</div>
                          <div className="survey-card-status">
                            <div className={`survey-status-dot ${s.is_active ? "live" : ""}`} />
                          </div>
                        </div>
                        <div className="survey-card-meta">
                          <div className="survey-card-date">{formatDate(s.created_at)}</div>
                          {responseCounts[s.id] > 0 && (
                            <div className="survey-card-responses">
                              {responseCounts[s.id]} resp.
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Workspace ── */}
            <div className="surveys-workspace">
              {!activeSurvey ? (
                <div className="surveys-empty" style={{ flex: 1 }}>
                  <div className="surveys-empty-icon">👈</div>
                  <div className="surveys-empty-title">Select a survey</div>
                  <div className="surveys-empty-sub">Pick one from the list or create a new one</div>
                </div>
              ) : (
                <>
                  <div className="survey-tab-bar">
                    <button
                      className="mobile-menu-btn"
                      onClick={() => setMobileDrawerOpen(true)}
                      title="Survey list"
                    >
                      ☰
                    </button>
                    {TABS.map(tab => (
                      <button
                        key={tab}
                        className={`survey-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                        {tab === "Responses" && (
                          <span className="survey-tab-badge">
                            {responseCounts[activeSurveyId] || 0}
                          </span>
                        )}
                      </button>
                    ))}
                    {activeSurvey.is_active ? (
                      <span className="survey-tab-live">
                        <span className="survey-tab-live-dot" />
                        Live
                      </span>
                    ) : (
                      <span className="survey-tab-draft">Draft</span>
                    )}
                  </div>

                  <div className="survey-tab-content">
                    {activeTab === "Form" && (
                      <SurveyForm survey={activeSurvey} onUpdate={loadSurveys} />
                    )}
                    {activeTab === "Responses" && (
                      <SurveyResponses
                        survey={activeSurvey}
                        onResponseCountUpdate={(count) =>
                          setResponseCounts(prev => ({ ...prev, [activeSurveyId]: count }))
                        }
                      />
                    )}
                    {activeTab === "Analysis" && (
                      <div className="analyse-tab-wrap">
                        <div className="analyse-tab-icon">📊</div>
                        <div className="analyse-tab-title">Beachhead Strategy Report</div>
                        <div className="analyse-tab-sub">
                          {responseCounts[activeSurveyId] > 0
                            ? `${responseCounts[activeSurveyId]} response${responseCounts[activeSurveyId] !== 1 ? "s" : ""} collected. Asha will analyse them using the Beachhead Strategy framework.`
                            : "No responses yet. Publish the survey and share the link to collect responses. You can still run a pre-response analysis."}
                        </div>
                        <button
                          className="analyse-btn"
                          onClick={() => navigate(`/surveys/${activeSurveyId}/analysis`)}
                        >
                          {responseCounts[activeSurveyId] > 0
                            ? "🧠 Run Beachhead Analysis"
                            : "👁 Preview Analysis"}
                        </button>
                      </div>
                    )}
                    {activeTab === "Settings" && (
                      <SurveySettings
                        survey={activeSurvey}
                        onUpdate={loadSurveys}
                        onDelete={() => {
                          setSurveys(prev => prev.filter(s => s.id !== activeSurveyId));
                          setActiveSurveyId(null);
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => !generating && setShowModal(false)}>
            <div className="new-survey-modal" onClick={e => e.stopPropagation()}>
              <div className="new-survey-modal-title">Create a survey</div>
              <div className="new-survey-modal-sub">
                Describe your idea. Asha will generate the questions.
              </div>
              <textarea
                className="new-survey-textarea"
                placeholder="e.g. I'm building a mobile app that helps Lagos market traders track daily sales…"
                value={ideaText}
                onChange={e => setIdeaText(e.target.value)}
                autoFocus
              />
              <div className="new-survey-modal-actions">
                <button className="modal-cancel-btn" onClick={() => setShowModal(false)} disabled={generating}>
                  Cancel
                </button>
                <button
                  className="modal-generate-btn"
                  onClick={generateSurvey}
                  disabled={generating || !ideaText.trim()}
                >
                  {generating ? "Generating…" : "Generate survey →"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
