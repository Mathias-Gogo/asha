import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import SurveyForm from "../components/surveys/SurveyForm";
import SurveyResponses from "../components/surveys/SurveyResponse";
import SurveySettings from "../components/surveys/SurveySettings";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

  .surveys-wrap {
    height: 100%;
    display: flex;
    font-family: 'Montserrat', sans-serif;
    overflow: hidden;
    background: var(--bg, #06060a);
  }

  /* ── Left panel: survey cards ── */
  .surveys-list {
    width: 240px; flex-shrink: 0;
    display: flex; flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  }

  [data-theme="light"] .surveys-list {
    border-right-color: rgba(0,0,0,0.07);
  }

  .surveys-list-header {
    padding: 16px 16px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
    display: flex; align-items: center;
    justify-content: space-between;
  }

  [data-theme="light"] .surveys-list-header {
    border-bottom-color: rgba(0,0,0,0.05);
  }

  .surveys-list-title {
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
  }

  [data-theme="light"] .surveys-list-title { color: rgba(0,0,0,0.3); }

  .surveys-new-btn {
    width: 24px; height: 24px; border-radius: 6px;
    border: 1px solid rgba(124,58,237,0.3);
    background: rgba(124,58,237,0.08);
    color: #a78bfa; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-size: 16px; line-height: 1;
  }

  .surveys-new-btn:hover {
    background: rgba(124,58,237,0.15);
    border-color: rgba(124,58,237,0.5);
  }

  .surveys-new-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .surveys-cards {
    flex: 1; overflow-y: auto; padding: 8px;
    display: flex; flex-direction: column; gap: 6px;
  }

  .surveys-cards::-webkit-scrollbar { width: 3px; }
  .surveys-cards::-webkit-scrollbar-track { background: transparent; }
  .surveys-cards::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  /* ── Survey card ── */
  .survey-card {
    padding: 12px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    background: transparent; cursor: pointer;
    transition: all 0.15s; text-align: left;
    display: flex; flex-direction: column; gap: 6px;
    position: relative; overflow: hidden;
    width: 100%;
  }

  [data-theme="light"] .survey-card {
    border-color: rgba(0,0,0,0.07);
  }

  .survey-card:hover {
    background: rgba(124,58,237,0.05);
    border-color: rgba(124,58,237,0.2);
  }

  .survey-card.active {
    background: rgba(124,58,237,0.1);
    border-color: rgba(124,58,237,0.35);
  }

  .survey-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent);
    opacity: 0; transition: opacity 0.15s;
  }

  .survey-card.active::before { opacity: 1; }

  .survey-card-top {
    display: flex; align-items: center;
    justify-content: space-between; gap: 8px;
  }

  .survey-card-title {
    font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.6); line-height: 1.3;
    letter-spacing: -0.01em;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  [data-theme="light"] .survey-card-title { color: rgba(0,0,0,0.6); }
  .survey-card.active .survey-card-title { color: rgba(255,255,255,0.88); }
  [data-theme="light"] .survey-card.active .survey-card-title { color: rgba(0,0,0,0.85); }

  .survey-card-status {
    display: flex; align-items: center; gap: 4px;
    flex-shrink: 0;
  }

  .survey-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
  }

  .survey-status-dot.live {
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74,222,128,0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .survey-card-meta {
    display: flex; align-items: center;
    justify-content: space-between;
  }

  .survey-card-date {
    font-size: 10px; color: rgba(255,255,255,0.2);
    font-weight: 500;
  }

  [data-theme="light"] .survey-card-date { color: rgba(0,0,0,0.25); }

  .survey-card-responses {
    font-size: 10px; font-weight: 700;
    color: rgba(124,58,237,0.6); letter-spacing: 0.04em;
  }

  /* Plan usage */
  .surveys-usage {
    padding: 8px 16px;
    font-size: 10px; font-weight: 600;
    color: rgba(124,58,237,0.5); letter-spacing: 0.06em;
    border-top: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
  }

  [data-theme="light"] .surveys-usage { border-top-color: rgba(0,0,0,0.05); }

  /* ── Workspace (right) ── */
  .surveys-workspace {
    flex: 1; display: flex;
    flex-direction: column; overflow: hidden;
    min-width: 0;
  }

  /* Tab bar */
  .survey-tab-bar {
    display: flex; align-items: center;
    gap: 0; padding: 0 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  [data-theme="light"] .survey-tab-bar {
    border-bottom-color: rgba(0,0,0,0.07);
  }

  .survey-tab-bar::-webkit-scrollbar { display: none; }

  .survey-tab {
    padding: 12px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.3);
    cursor: pointer; border: none;
    background: transparent;
    border-bottom: 2px solid transparent;
    transition: all 0.15s; letter-spacing: 0.02em;
    margin-bottom: -1px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  [data-theme="light"] .survey-tab { color: rgba(0,0,0,0.3); }
  .survey-tab:hover { color: rgba(255,255,255,0.6); }
  [data-theme="light"] .survey-tab:hover { color: rgba(0,0,0,0.6); }

  .survey-tab.active {
    color: #a78bfa;
    border-bottom-color: #7c3aed;
  }

  [data-theme="light"] .survey-tab.active { color: #7c3aed; }

  .survey-tab-badge {
    display: inline-flex; align-items: center;
    padding: 2px 7px; border-radius: 100px;
    background: rgba(124,58,237,0.12);
    font-size: 10px; font-weight: 700;
    color: #a78bfa; margin-left: 6px;
  }

  .survey-tab-live {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 100px;
    background: rgba(74,222,128,0.1);
    border: 1px solid rgba(74,222,128,0.2);
    font-size: 10px; font-weight: 700;
    color: #4ade80; margin-left: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .survey-tab-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #4ade80; animation: pulse 2s infinite;
  }

  .survey-tab-draft {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 100px;
    background: rgba(255,255,255,0.05);
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.25); margin-left: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  [data-theme="light"] .survey-tab-draft {
    background: rgba(0,0,0,0.05); color: rgba(0,0,0,0.3);
  }

  .survey-tab-content { flex: 1; overflow: hidden; }

  /* Empty states */
  .surveys-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; text-align: center; padding: 40px 20px;
  }

  .surveys-empty-icon {
    font-size: 28px; margin-bottom: 4px;
  }

  .surveys-empty-title {
    font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.4); letter-spacing: -0.01em;
  }

  [data-theme="light"] .surveys-empty-title { color: rgba(0,0,0,0.4); }

  .surveys-empty-sub {
    font-size: 11px; color: rgba(255,255,255,0.18);
    max-width: 180px; line-height: 1.65; font-weight: 400;
  }

  [data-theme="light"] .surveys-empty-sub { color: rgba(0,0,0,0.25); }

  /* Plan lock */
  .surveys-locked {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; text-align: center; padding: 40px;
  }

  .surveys-locked-title {
    font-size: 16px; font-weight: 700;
    color: rgba(255,255,255,0.7); letter-spacing: -0.02em;
  }

  [data-theme="light"] .surveys-locked-title { color: rgba(0,0,0,0.7); }

  .surveys-locked-sub {
    font-size: 12px; color: rgba(255,255,255,0.25);
    max-width: 260px; line-height: 1.65;
  }

  [data-theme="light"] .surveys-locked-sub { color: rgba(0,0,0,0.35); }

  .surveys-upgrade-btn {
    padding: 9px 24px; border-radius: 8px;
    border: none; background: #7c3aed; color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: background 0.2s; margin-top: 4px;
  }

  .surveys-upgrade-btn:hover { background: #6d28d9; }

  /* Modal */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .new-survey-modal {
    background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 32px;
    width: 100%; max-width: 520px;
    display: flex; flex-direction: column; gap: 16px;
    animation: slideUp 0.25s ease;
    max-height: 90vh;
    overflow-y: auto;
  }

  [data-theme="light"] .new-survey-modal {
    background: #ffffff; border-color: rgba(0,0,0,0.08);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .new-survey-modal-title {
    font-size: 17px; font-weight: 800;
    color: rgba(255,255,255,0.88); letter-spacing: -0.03em;
  }

  [data-theme="light"] .new-survey-modal-title { color: rgba(0,0,0,0.85); }

  .new-survey-modal-sub {
    font-size: 12px; color: rgba(255,255,255,0.3);
    line-height: 1.6; margin-top: -8px; font-weight: 400;
  }

  [data-theme="light"] .new-survey-modal-sub { color: rgba(0,0,0,0.4); }

  .new-survey-textarea {
    width: 100%; background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 13px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; color: rgba(255,255,255,0.85);
    resize: none; outline: none;
    min-height: 100px; line-height: 1.65;
    transition: border-color 0.2s;
  }

  [data-theme="light"] .new-survey-textarea {
    background: #f8f8fc; border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.82);
  }

  .new-survey-textarea:focus { border-color: rgba(124,58,237,0.4); }
  .new-survey-textarea::placeholder { color: rgba(255,255,255,0.2); }
  [data-theme="light"] .new-survey-textarea::placeholder { color: rgba(0,0,0,0.25); }

  .new-survey-modal-actions {
    display: flex; gap: 8px; justify-content: flex-end;
  }

  .modal-cancel-btn {
    padding: 9px 20px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.4);
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  [data-theme="light"] .modal-cancel-btn {
    border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.4);
  }

  .modal-cancel-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }

  .modal-generate-btn {
    padding: 9px 24px; border-radius: 8px;
    border: none; background: #7c3aed; color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 2px 12px rgba(124,58,237,0.35);
  }

  .modal-generate-btn:hover:not(:disabled) { background: #6d28d9; }
  .modal-generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ─── MOBILE STYLES ─────────────────────────────────────────────── */
  
  /* Mobile survey selector dropdown */
  .mobile-survey-select {
    display: none;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: transparent;
  }

  [data-theme="light"] .mobile-survey-select {
    border-bottom-color: rgba(0,0,0,0.07);
  }

  .mobile-select {
    width: 100%;
    background: var(--input-bg, rgba(255,255,255,0.04));
    border: 1px solid var(--input-border, rgba(255,255,255,0.09));
    border-radius: 10px;
    padding: 10px 14px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px;
    color: var(--fg, rgba(255,255,255,0.88));
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  [data-theme="light"] .mobile-select {
    color: rgba(0,0,0,0.82);
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(0,0,0,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  }

  /* Mobile drawer for survey list */
  .mobile-drawer-backdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 40;
    animation: fadeIn 0.2s ease;
  }

  .mobile-drawer {
    display: none;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 280px;
    background: #0a0a0f;
    border-right: 1px solid rgba(255,255,255,0.06);
    z-index: 50;
    flex-direction: column;
    overflow: hidden;
    animation: slideInLeft 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  }

  [data-theme="light"] .mobile-drawer {
    background: #f0f0f5;
    border-right-color: rgba(0,0,0,0.07);
  }

  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .mobile-drawer-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  [data-theme="light"] .mobile-drawer-header {
    border-bottom-color: rgba(0,0,0,0.06);
  }

  .mobile-drawer-title {
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.6);
  }

  [data-theme="light"] .mobile-drawer-title { color: rgba(0,0,0,0.6); }

  .mobile-drawer-close {
    width: 28px; height: 28px; border-radius: 6px;
    border: none; background: transparent;
    color: rgba(255,255,255,0.3);
    cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    font-size: 18px;
  }

  [data-theme="light"] .mobile-drawer-close { color: rgba(0,0,0,0.3); }

  .mobile-menu-btn {
    display: none;
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.4);
    cursor: pointer;
    align-items: center; justify-content: center;
    margin-right: 8px;
    flex-shrink: 0;
  }

  [data-theme="light"] .mobile-menu-btn {
    border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.4);
  }

  /* ─── RESPONSIVE BREAKPOINTS ─────────────────────────────────── */

  @media (max-width: 768px) {
    .surveys-wrap {
      flex-direction: column;
    }

    .surveys-list {
      display: none;
    }

    .mobile-survey-select {
      display: block;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .mobile-drawer-backdrop.show,
    .mobile-drawer.show {
      display: flex;
    }

    .survey-tab-bar {
      padding: 0 12px;
      overflow-x: auto;
    }

    .survey-tab {
      padding: 10px 12px;
      font-size: 11px;
    }

    .modal-backdrop {
      padding: 12px;
      align-items: flex-end;
    }

    .new-survey-modal {
      border-radius: 16px 16px 0 0;
      max-height: 85vh;
      animation: slideUpMobile 0.3s ease;
    }

    @keyframes slideUpMobile {
      from { opacity: 0; transform: translateY(100%); }
      to { opacity: 1; transform: translateY(0); }
    }
  }

  @media (max-width: 480px) {
    .surveys-empty-title { font-size: 13px; }
    .surveys-empty-sub { font-size: 10px; }
    
    .survey-tab-badge,
    .survey-tab-live,
    .survey-tab-draft {
      display: none;
    }
  }
`;

const TABS = ["Form", "Responses", "Settings"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function Surveys() {
  const { user, profile } = useAuth();
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
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.6,
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: `You are a market research expert. Generate a survey to validate a business idea.

Respond ONLY with valid JSON, no other text:
{
  "title": "Short survey title (max 40 chars)",
  "description": "One sentence shown to respondents",
  "questions": [
    { "id": "q1", "type": "text", "text": "Question here" },
    { "id": "q2", "type": "single_choice", "text": "Question here", "options": ["A","B","C"] },
    { "id": "q3", "type": "rating", "text": "Rate X (1=low, 5=high)" },
    { "id": "q4", "type": "multi_choice", "text": "Which apply?", "options": ["A","B","C"] }
  ]
}

Generate 6-8 questions. Mix types. Focus on validating the idea and uncovering pain points.`,
            },
            { role: "user", content: `Business idea: ${ideaText}` },
          ],
        }),
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

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
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontFamily: "Montserrat, sans-serif", fontSize: 13 }}>
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