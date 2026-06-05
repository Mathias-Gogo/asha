import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const STYLES = `
  .sf-wrap {
    height: 100%;
    overflow-y: auto;
    padding: 28px 28px 60px;
    font-family: 'Montserrat', sans-serif;
  }

  .sf-wrap::-webkit-scrollbar { width: 3px; }
  .sf-wrap::-webkit-scrollbar-track { background: transparent; }
  .sf-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  .sf-inner { max-width: 640px; margin: 0 auto; }

  /* ── Header ── */
  .sf-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 28px;
  }

  .sf-title-wrap { flex: 1; min-width: 0; }

  .sf-title-input {
    width: 100%; background: transparent; border: none;
    outline: none; font-family: 'Montserrat', sans-serif;
    font-size: 20px; font-weight: 800;
    color: rgba(255,255,255,0.88); letter-spacing: -0.03em;
    border-bottom: 1px solid transparent;
    padding: 2px 0; transition: border-color 0.2s;
  }

  [data-theme="light"] .sf-title-input { color: rgba(0,0,0,0.85); }

  .sf-title-input:focus {
    border-bottom-color: rgba(124,58,237,0.4);
  }

  .sf-title-input::placeholder { color: rgba(255,255,255,0.2); }
  [data-theme="light"] .sf-title-input::placeholder { color: rgba(0,0,0,0.2); }

  .sf-desc-input {
    width: 100%; background: transparent; border: none;
    outline: none; font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.35); margin-top: 6px;
    border-bottom: 1px solid transparent;
    padding: 2px 0; transition: border-color 0.2s;
    resize: none;
  }

  [data-theme="light"] .sf-desc-input { color: rgba(0,0,0,0.4); }

  .sf-desc-input:focus { border-bottom-color: rgba(124,58,237,0.3); }
  .sf-desc-input::placeholder { color: rgba(255,255,255,0.15); }
  [data-theme="light"] .sf-desc-input::placeholder { color: rgba(0,0,0,0.2); }

  /* ── Publish button ── */
  .sf-publish-btn {
    padding: 9px 22px; border-radius: 9px;
    border: none; background: #7c3aed;
    color: white; font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    white-space: nowrap; flex-shrink: 0;
    box-shadow: 0 2px 12px rgba(124,58,237,0.35);
  }

  .sf-publish-btn:hover:not(:disabled) {
    background: #6d28d9;
    box-shadow: 0 4px 20px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }

  .sf-publish-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .sf-unpublish-btn {
    padding: 9px 22px; border-radius: 9px;
    border: 1px solid rgba(239,68,68,0.25);
    background: transparent;
    color: rgba(239,68,68,0.7);
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    white-space: nowrap; flex-shrink: 0;
  }

  .sf-unpublish-btn:hover {
    background: rgba(239,68,68,0.08);
    border-color: rgba(239,68,68,0.5);
    color: #fca5a5;
  }

  /* ── Link bar ── */
  .sf-link-bar {
    display: flex; align-items: center; gap: 10px;
    background: rgba(74,222,128,0.06);
    border: 1px solid rgba(74,222,128,0.15);
    border-radius: 10px; padding: 10px 16px;
    margin-bottom: 24px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .sf-link-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .sf-link-text {
    flex: 1; font-size: 12px;
    color: rgba(255,255,255,0.5);
    font-weight: 500; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }

  [data-theme="light"] .sf-link-text { color: rgba(0,0,0,0.5); }

  .sf-link-url {
    font-weight: 700; color: #4ade80;
    margin-left: 4px;
  }

  .sf-copy-link-btn {
    padding: 5px 12px; border-radius: 6px;
    border: 1px solid rgba(74,222,128,0.25);
    background: transparent; color: #4ade80;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
    letter-spacing: 0.03em;
  }

  .sf-copy-link-btn:hover { background: rgba(74,222,128,0.08); }
  .sf-copy-link-btn.copied { color: #6ee7b7; border-color: rgba(110,231,183,0.3); }

  /* ── Questions ── */
  .sf-questions {
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 20px;
  }

  .sf-question-card {
    background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 16px 18px;
    position: relative;
    transition: border-color 0.15s;
  }

  [data-theme="light"] .sf-question-card {
    background: #ffffff;
    border-color: rgba(0,0,0,0.07);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .sf-question-card:hover { border-color: rgba(124,58,237,0.2); }

  .sf-question-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.15), transparent);
  }

  .sf-q-top {
    display: flex; align-items: flex-start;
    gap: 10px; margin-bottom: 10px;
  }

  .sf-q-number {
    font-size: 10px; font-weight: 800;
    color: rgba(124,58,237,0.6);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-top: 3px; flex-shrink: 0;
    min-width: 24px;
  }

  .sf-q-type-badge {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 100px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.25);
    flex-shrink: 0; margin-top: 1px;
  }

  [data-theme="light"] .sf-q-type-badge {
    background: rgba(0,0,0,0.04);
    border-color: rgba(0,0,0,0.07);
    color: rgba(0,0,0,0.3);
  }

  .sf-q-text-input {
    flex: 1; background: transparent; border: none;
    outline: none; font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.82); line-height: 1.5;
    border-bottom: 1px solid transparent;
    padding: 1px 0; transition: border-color 0.2s;
    resize: none; width: 100%;
  }

  [data-theme="light"] .sf-q-text-input { color: rgba(0,0,0,0.78); }

  .sf-q-text-input:focus { border-bottom-color: rgba(124,58,237,0.3); }

  .sf-q-delete {
    width: 26px; height: 26px; border-radius: 6px;
    border: none; background: transparent;
    color: rgba(255,255,255,0.15); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
    opacity: 0;
  }

  .sf-question-card:hover .sf-q-delete { opacity: 1; }

  .sf-q-delete:hover {
    background: rgba(239,68,68,0.1);
    color: #fca5a5;
  }

  .sf-q-delete svg { width: 13px; height: 13px; }

  /* Options */
  .sf-q-options {
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 4px; padding-left: 34px;
  }

  .sf-q-option {
    display: flex; align-items: center; gap: 8px;
  }

  .sf-q-option-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(124,58,237,0.4); flex-shrink: 0;
  }

  .sf-q-option-input {
    flex: 1; background: transparent; border: none;
    outline: none; font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 400;
    color: rgba(255,255,255,0.45);
    border-bottom: 1px solid transparent;
    padding: 2px 0; transition: border-color 0.2s;
  }

  [data-theme="light"] .sf-q-option-input { color: rgba(0,0,0,0.45); }
  .sf-q-option-input:focus { border-bottom-color: rgba(124,58,237,0.25); }

  .sf-q-option-delete {
    width: 18px; height: 18px; border-radius: 4px;
    border: none; background: transparent;
    color: rgba(255,255,255,0.1); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; padding: 0;
  }

  .sf-q-option-delete:hover { color: #fca5a5; }
  .sf-q-option-delete svg { width: 10px; height: 10px; }

  .sf-q-add-option {
    background: transparent; border: none;
    color: rgba(124,58,237,0.5);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    padding: 4px 0; transition: color 0.15s;
    text-align: left; letter-spacing: 0.02em;
  }

  .sf-q-add-option:hover { color: #a78bfa; }

  /* Rating preview */
  .sf-rating-preview {
    display: flex; gap: 6px; padding-left: 34px;
    margin-top: 6px;
  }

  .sf-rating-dot {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid rgba(124,58,237,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.3);
  }

  [data-theme="light"] .sf-rating-dot { color: rgba(0,0,0,0.3); }

  /* ── Add question row ── */
  .sf-add-row {
    display: flex; gap: 8px; flex-wrap: wrap;
  }

  .sf-add-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px dashed rgba(124,58,237,0.25);
    background: transparent; color: rgba(124,58,237,0.5);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; letter-spacing: 0.03em;
  }

  .sf-add-btn:hover {
    border-color: rgba(124,58,237,0.5);
    color: #a78bfa;
    background: rgba(124,58,237,0.05);
  }

  /* ── Save bar ── */
  .sf-save-bar {
    display: flex; align-items: center;
    justify-content: flex-end; gap: 10px;
    margin-top: 24px; padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  [data-theme="light"] .sf-save-bar { border-top-color: rgba(0,0,0,0.06); }

  .sf-saved-msg {
    font-size: 11px; font-weight: 600;
    color: #6ee7b7; letter-spacing: 0.04em;
    animation: fadeIn 0.3s ease;
  }

  .sf-save-btn {
    padding: 8px 20px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.5);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; letter-spacing: 0.04em;
  }

  [data-theme="light"] .sf-save-btn {
    border-color: rgba(0,0,0,0.1);
    color: rgba(0,0,0,0.5);
  }

  .sf-save-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
  .sf-save-btn:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TYPE_LABELS = {
  text: "Text",
  rating: "Rating 1–5",
  single_choice: "Single choice",
  multi_choice: "Multi choice",
};

export default function SurveyForm({ survey, onUpdate }) {
  const [title, setTitle] = useState(survey.title || "");
  const [description, setDescription] = useState(survey.description || "");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load full survey data including questions
  useEffect(() => {
    loadFull();
  }, [survey.id]);

  const loadFull = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", survey.id)
      .single();
    if (data) {
      setTitle(data.title || "");
      setDescription(data.description || "");
      setQuestions(data.questions || []);
    }
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const opts = [...(q.options || [])];
      opts[oIndex] = value;
      return { ...q, options: opts };
    }));
  };

  const addOption = (qIndex) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      return { ...q, options: [...(q.options || []), "New option"] };
    }));
  };

  const deleteOption = (qIndex, oIndex) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const opts = (q.options || []).filter((_, oi) => oi !== oIndex);
      return { ...q, options: opts };
    }));
  };

  const deleteQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addQuestion = (type) => {
    const newQ = {
      id: `q${Date.now()}`,
      type,
      text: "New question",
      ...(["single_choice", "multi_choice"].includes(type) && {
        options: ["Option A", "Option B", "Option C"],
      }),
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const saveChanges = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("surveys")
      .update({ title, description, questions })
      .eq("id", survey.id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdate();
    }
    setSaving(false);
  };

  const togglePublish = async () => {
    setPublishing(true);
    const { error } = await supabase
      .from("surveys")
      .update({ is_active: !survey.is_active })
      .eq("id", survey.id);
    if (!error) onUpdate();
    setPublishing(false);
  };

  const surveyLink = `${window.location.origin}/s/${survey.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(surveyLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sf-wrap">
        <div className="sf-inner">

          {/* Header */}
          <div className="sf-header">
            <div className="sf-title-wrap">
              <input
                className="sf-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Survey title"
              />
              <textarea
                className="sf-desc-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description shown to respondents…"
                rows={2}
              />
            </div>
            {survey.is_active ? (
              <button className="sf-unpublish-btn" onClick={togglePublish} disabled={publishing}>
                {publishing ? "Updating…" : "Unpublish"}
              </button>
            ) : (
              <button className="sf-publish-btn" onClick={togglePublish} disabled={publishing}>
                {publishing ? "Publishing…" : "Publish →"}
              </button>
            )}
          </div>

          {/* Live link bar */}
          {survey.is_active && (
            <div className="sf-link-bar">
              <div className="sf-link-dot" />
              <div className="sf-link-text">
                Your survey is live:
                <span className="sf-link-url">{surveyLink}</span>
              </div>
              <button
                className={`sf-copy-link-btn ${linkCopied ? "copied" : ""}`}
                onClick={copyLink}
              >
                {linkCopied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
          )}

          {/* Questions */}
          <div className="sf-questions">
            {questions.map((q, i) => (
              <div key={q.id || i} className="sf-question-card">
                <div className="sf-q-top">
                  <span className="sf-q-number">Q{i + 1}</span>
                  <textarea
                    className="sf-q-text-input"
                    value={q.text}
                    onChange={e => updateQuestion(i, "text", e.target.value)}
                    rows={2}
                  />
                  <span className="sf-q-type-badge">{TYPE_LABELS[q.type] || q.type}</span>
                  <button className="sf-q-delete" onClick={() => deleteQuestion(i)} title="Delete">
                    <IconTrash />
                  </button>
                </div>

                {/* Options for choice questions */}
                {(q.type === "single_choice" || q.type === "multi_choice") && (
                  <div className="sf-q-options">
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="sf-q-option">
                        <div className="sf-q-option-dot" />
                        <input
                          className="sf-q-option-input"
                          value={opt}
                          onChange={e => updateOption(i, oi, e.target.value)}
                        />
                        <button className="sf-q-option-delete" onClick={() => deleteOption(i, oi)}>
                          <IconX />
                        </button>
                      </div>
                    ))}
                    <button className="sf-q-add-option" onClick={() => addOption(i)}>
                      + Add option
                    </button>
                  </div>
                )}

                {/* Rating preview */}
                {q.type === "rating" && (
                  <div className="sf-rating-preview">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="sf-rating-dot">{n}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add question */}
          <div className="sf-add-row">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <button key={type} className="sf-add-btn" onClick={() => addQuestion(type)}>
                + {label}
              </button>
            ))}
          </div>

          {/* Save */}
          <div className="sf-save-bar">
            {saved && <span className="sf-saved-msg">✓ Saved</span>}
            <button className="sf-save-btn" onClick={saveChanges} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}