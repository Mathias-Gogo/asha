import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useLocation } from "react-router-dom";

const STYLES = `
  :root {
    --bg: #f5f7ff; --surface: #ffffff; --surface-2: #f0f2ff;
    --fg: #111827; --fg-2: #6b7280; --fg-3: #9ca3af;
    --border: rgba(0,0,0,0.07); --border-2: rgba(0,0,0,0.12);
    --orange: #ff6b35; --orange-dim: rgba(255,107,53,0.10);
    --violet: #7c3aed; --emerald: #10b981;
    --shadow-sm: 0 1px 8px rgba(0,0,0,0.07);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  }

  .sf-wrap {
    height: 100%; overflow-y: auto; background: var(--bg);
    font-family: 'Inter', system-ui, sans-serif; color: var(--fg);
  }

  .sf-wrap::-webkit-scrollbar { width: 4px; }
  .sf-wrap::-webkit-scrollbar-track { background: transparent; }
  .sf-wrap::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.18); border-radius: 4px; }

  .sf-inner { max-width: 820px; margin: 0 auto; padding: 36px 32px 80px; }

  /* ── Section header ── */
  .sf-section-label {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--fg-3);
    margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }

  .sf-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  /* ── Questions container ── */
  .sf-questions { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }

  /* ── Question card ── */
  .sf-question {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 20px 22px;
    box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
    transition: box-shadow 0.2s, border-color 0.2s;
  }

  .sf-question:hover { border-color: rgba(255,107,53,0.20); box-shadow: var(--shadow-md); }

  .sf-question::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8);
    border-radius: 16px 16px 0 0; opacity: 0; transition: opacity 0.2s;
  }

  .sf-question:hover::before { opacity: 1; }

  .sf-question-header {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;
  }

  .sf-q-num {
    font-size: 11px; font-weight: 800; color: var(--orange);
    letter-spacing: 0.06em; text-transform: uppercase;
    min-width: 28px; margin-top: 2px;
  }

  .sf-q-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }

  .sf-input {
    width: 100%; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 10px; padding: 9px 14px;
    font-family: inherit; font-size: 13.5px; font-weight: 500; color: var(--fg);
    outline: none; transition: all 0.2s;
  }

  .sf-input:focus {
    border-color: rgba(255,107,53,0.45);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.08);
    background: var(--surface);
  }

  .sf-input::placeholder { color: var(--fg-3); }

  .sf-type-select {
    background: var(--surface-2); border: 1.5px solid var(--border);
    border-radius: 10px; padding: 8px 14px;
    font-family: inherit; font-size: 12.5px; color: var(--fg); font-weight: 600;
    outline: none; cursor: pointer; transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(0,0,0,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
  }

  .sf-type-select:focus { border-color: rgba(255,107,53,0.45); box-shadow: 0 0 0 3px rgba(255,107,53,0.08); }

  /* ── Options list ── */
  .sf-options { display: flex; flex-direction: column; gap: 7px; margin-top: 6px; }

  .sf-option-row { display: flex; align-items: center; gap: 8px; }

  .sf-option-bullet {
    width: 8px; height: 8px; border-radius: 50%;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    flex-shrink: 0;
  }

  .sf-option-input {
    flex: 1; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 8px; padding: 7px 12px;
    font-family: inherit; font-size: 13px; color: var(--fg);
    outline: none; transition: all 0.2s;
  }

  .sf-option-input:focus { border-color: rgba(255,107,53,0.40); background: var(--surface); }

  .sf-remove-option {
    width: 26px; height: 26px; border-radius: 7px;
    border: none; background: transparent; color: var(--fg-3);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }

  .sf-remove-option:hover { background: rgba(239,68,68,0.08); color: #dc2626; }

  .sf-add-option {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent; border: 1.5px dashed var(--border);
    border-radius: 8px; padding: 7px 14px;
    font-family: inherit; font-size: 12.5px; font-weight: 600;
    color: var(--fg-3); cursor: pointer; transition: all 0.18s;
    margin-top: 4px;
  }

  .sf-add-option:hover { border-color: rgba(255,107,53,0.30); color: var(--orange); background: var(--orange-dim); }

  /* ── Rating preview ── */
  .sf-rating-preview { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }

  .sf-rating-pip {
    width: 36px; height: 36px; border-radius: 9px;
    background: var(--surface-2); border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: var(--fg-3);
  }

  /* ── Delete question ── */
  .sf-delete-q {
    width: 30px; height: 30px; border-radius: 8px;
    border: none; background: transparent; color: var(--fg-3);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; margin-top: 1px;
  }

  .sf-delete-q:hover { background: rgba(239,68,68,0.08); color: #dc2626; }

  /* ── Add question button ── */
  .sf-add-q-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px;
    background: var(--surface); border: 1.5px dashed var(--border);
    border-radius: 14px; color: var(--fg-3);
    font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }

  .sf-add-q-btn:hover {
    border-color: rgba(255,107,53,0.30); color: var(--orange);
    background: var(--orange-dim); border-style: solid;
  }

  /* ── Save bar ── */
  .sf-save-bar {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 10px; margin-top: 24px; padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .sf-saved-msg { font-size: 12.5px; font-weight: 700; color: var(--emerald); }

  .sf-save-btn {
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    border: none; border-radius: 11px; padding: 10px 26px;
    font-family: inherit; font-size: 13px; font-weight: 700;
    color: white; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 14px rgba(255,107,53,0.30);
  }

  .sf-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.45); }
  .sf-save-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  @media (max-width: 640px) {
    .sf-inner { padding: 20px 14px 60px; }
    .sf-question { padding: 16px; }
  }
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

  const location = useLocation();
  const prefillData = location.state?.prefillData;

  // Load full survey data including questions
  useEffect(() => {
    if (prefillData) {
      // Coming from Asha chat with prefill data
      setTitle(prefillData.title || "");
      setDescription(prefillData.description || "");
      setQuestions(prefillData.questions || []);
      // Don't call loadFull — we have the data
      return;
    }
    loadFull();
  }, [survey.id, prefillData]);

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