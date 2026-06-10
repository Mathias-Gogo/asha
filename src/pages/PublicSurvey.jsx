import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #06060a;
    font-family: 'Montserrat', sans-serif;
    min-height: 100vh;
  }

  .ps-wrap {
    min-height: 100vh;
    background: #06060a;
    display: flex; flex-direction: column;
    align-items: center;
    position: relative; overflow: hidden;
  }

  /* Background orbs */
  .ps-bg-orb-1 {
    position: fixed; width: 600px; height: 600px;
    border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
    top: -200px; left: -100px; filter: blur(80px);
  }

  .ps-bg-orb-2 {
    position: fixed; width: 400px; height: 400px;
    border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%);
    bottom: -100px; right: -80px; filter: blur(80px);
  }

  /* Header */
  .ps-header {
    width: 100%; padding: 20px 24px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative; z-index: 2;
  }

  .ps-logo-mark {
    width: 28px; height: 28px; border-radius: 7px;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: white;
    letter-spacing: -0.5px;
  }

  .ps-logo-text {
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.5); letter-spacing: -0.02em;
  }

  /* Main content */
  .ps-content {
    width: 100%; max-width: 600px;
    padding: 40px 24px 80px;
    position: relative; z-index: 2;
    flex: 1;
  }

  /* Survey header */
  .ps-survey-header { margin-bottom: 36px; }

  .ps-survey-title {
    font-size: 24px; font-weight: 800;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.03em; line-height: 1.2;
    margin-bottom: 10px;
  }

  .ps-survey-desc {
    font-size: 14px; color: rgba(255,255,255,0.35);
    line-height: 1.65; font-weight: 400;
  }

  /* Progress bar */
  .ps-progress-wrap {
    height: 3px; background: rgba(255,255,255,0.06);
    border-radius: 2px; margin-bottom: 36px; overflow: hidden;
  }

  .ps-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #38bdf8);
    border-radius: 2px; transition: width 0.4s ease;
  }

  /* Questions */
  .ps-questions { display: flex; flex-direction: column; gap: 24px; }

  .ps-question-block { display: flex; flex-direction: column; gap: 10px; }

  .ps-q-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(124,58,237,0.7);
  }

  .ps-q-text {
    font-size: 15px; font-weight: 600;
    color: rgba(255,255,255,0.85); line-height: 1.4;
    letter-spacing: -0.01em;
  }

  /* Text input */
  .ps-text-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 12px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; color: rgba(255,255,255,0.85);
    resize: none; outline: none; line-height: 1.6;
    min-height: 90px; transition: border-color 0.2s;
  }

  .ps-text-input:focus { border-color: rgba(124,58,237,0.4); }
  .ps-text-input::placeholder { color: rgba(255,255,255,0.2); }

  /* Rating */
  .ps-rating-row {
    display: flex; gap: 8px; flex-wrap: wrap;
  }

  .ps-rating-btn {
    width: 44px; height: 44px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.5);
    font-family: 'Montserrat', sans-serif;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  .ps-rating-btn:hover {
    border-color: rgba(124,58,237,0.4);
    color: #a78bfa;
    background: rgba(124,58,237,0.08);
  }

  .ps-rating-btn.selected {
    background: rgba(124,58,237,0.15);
    border-color: rgba(124,58,237,0.5);
    color: #a78bfa;
    box-shadow: 0 0 0 2px rgba(124,58,237,0.15);
  }

  .ps-rating-labels {
    display: flex; justify-content: space-between;
    font-size: 10px; color: rgba(255,255,255,0.2);
    font-weight: 500; margin-top: 4px;
    padding: 0 2px;
  }

  /* Choice options */
  .ps-options { display: flex; flex-direction: column; gap: 8px; }

  .ps-option {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 16px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    cursor: pointer; transition: all 0.15s;
  }

  .ps-option:hover {
    border-color: rgba(124,58,237,0.3);
    background: rgba(124,58,237,0.05);
  }

  .ps-option.selected {
    border-color: rgba(124,58,237,0.5);
    background: rgba(124,58,237,0.1);
  }

  .ps-option-indicator {
    width: 16px; height: 16px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
  }

  .ps-option.selected .ps-option-indicator {
    border-color: #7c3aed;
    background: #7c3aed;
  }

  .ps-option-check {
    width: 8px; height: 8px; border-radius: 50%;
    background: white; opacity: 0; transition: opacity 0.15s;
  }

  .ps-option.selected .ps-option-check { opacity: 1; }

  /* Multi choice uses square indicator */
  .ps-option.multi .ps-option-indicator { border-radius: 4px; }

  .ps-option-text {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.6); flex: 1;
  }

  .ps-option.selected .ps-option-text { color: rgba(255,255,255,0.85); }

  /* Submit */
  .ps-submit-wrap { margin-top: 36px; }

  .ps-submit-btn {
    width: 100%; padding: 14px;
    background: #7c3aed; border: none; border-radius: 10px;
    color: white; font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
  }

  .ps-submit-btn:hover:not(:disabled) {
    background: #6d28d9;
    box-shadow: 0 6px 28px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }

  .ps-submit-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  /* States */
  .ps-center {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; gap: 14px; padding: 60px 24px;
    position: relative; z-index: 2;
  }

  .ps-state-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 4px;
    box-shadow: 0 8px 32px rgba(124,58,237,0.35);
  }

  .ps-state-title {
    font-size: 20px; font-weight: 800;
    color: rgba(255,255,255,0.88); letter-spacing: -0.03em;
  }

  .ps-state-sub {
    font-size: 13px; color: rgba(255,255,255,0.3);
    max-width: 280px; line-height: 1.65; font-weight: 400;
  }

  /* Footer */
  .ps-footer {
    text-align: center; padding: 20px;
    font-size: 11px; color: rgba(255,255,255,0.12);
    font-weight: 500; position: relative; z-index: 2;
    letter-spacing: 0.04em;
  }

  .ps-footer a {
    color: rgba(124,58,237,0.5); text-decoration: none;
  }

  .ps-footer a:hover { color: #a78bfa; }
`;

export default function PublicSurvey() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState("loading"); // loading | active | closed | submitted | error
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadSurvey(); }, [id]);

  const loadSurvey = async () => {
    const { data, error } = await supabase
      .from("surveys")
      .select("id, title, description, questions, is_active")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = row not found (could be draft blocked by RLS, or genuinely missing)
      setStatus(error.code === "PGRST116" ? "closed" : "error");
      return;
    }

    setSurvey(data);
    setStatus(data.is_active ? "active" : "closed");
  };

  const setAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const toggleMultiChoice = (qId, option) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      const exists = current.includes(option);
      return {
        ...prev,
        [qId]: exists
          ? current.filter(o => o !== option)
          : [...current, option],
      };
    });
  };

  const allAnswered = () => {
    if (!survey?.questions) return false;
    return survey.questions.every(q => {
      const ans = answers[q.id];
      if (q.type === "text") return ans?.trim?.();
      if (q.type === "rating") return ans !== undefined;
      if (q.type === "single_choice") return ans !== undefined;
      if (q.type === "multi_choice") return Array.isArray(ans) && ans.length > 0;
      return true;
    });
  };

  const answeredCount = survey?.questions?.filter(q => {
    const ans = answers[q.id];
    if (q.type === "text") return ans?.trim?.();
    if (q.type === "multi_choice") return Array.isArray(ans) && ans.length > 0;
    return ans !== undefined;
  }).length || 0;

  const totalCount = survey?.questions?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const submit = async () => {
    if (!allAnswered() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("survey_responses")
      .insert({ survey_id: survey.id, answers });

    if (error) {
      console.error(error);
      setSubmitting(false);
      return;
    }
    setStatus("submitted");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ps-wrap">
        <div className="ps-bg-orb-1" />
        <div className="ps-bg-orb-2" />

        {/* Header */}
        <div className="ps-header">
          <div className="ps-logo-mark">A</div>
          <div className="ps-logo-text">Asha · by Mexuri</div>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="ps-center">
            <div className="ps-state-sub">Loading survey…</div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="ps-center">
            <div className="ps-state-icon">🔍</div>
            <div className="ps-state-title">Survey not found</div>
            <div className="ps-state-sub">This survey doesn't exist or the link may be incorrect.</div>
          </div>
        )}

        {/* Closed */}
        {status === "closed" && (
          <div className="ps-center">
            <div className="ps-state-icon">🔒</div>
            <div className="ps-state-title">Survey closed</div>
            <div className="ps-state-sub">This survey is no longer accepting responses.</div>
          </div>
        )}

        {/* Submitted */}
        {status === "submitted" && (
          <div className="ps-center">
            <div className="ps-state-icon">✅</div>
            <div className="ps-state-title">Thanks for responding!</div>
            <div className="ps-state-sub">Your feedback has been recorded. It will help shape a better product.</div>
          </div>
        )}

        {/* Active survey */}
        {status === "active" && survey && (
          <div className="ps-content">
            <div className="ps-survey-header">
              <div className="ps-survey-title">{survey.title}</div>
              {survey.description && (
                <div className="ps-survey-desc">{survey.description}</div>
              )}
            </div>

            {/* Progress */}
            <div className="ps-progress-wrap">
              <div className="ps-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="ps-questions">
              {(survey.questions || []).map((q, i) => (
                <div key={q.id || i} className="ps-question-block">
                  <div className="ps-q-label">Question {i + 1}</div>
                  <div className="ps-q-text">{q.text}</div>

                  {q.type === "text" && (
                    <textarea
                      className="ps-text-input"
                      placeholder="Your answer…"
                      value={answers[q.id] || ""}
                      onChange={e => setAnswer(q.id, e.target.value)}
                    />
                  )}

                  {q.type === "rating" && (
                    <div>
                      <div className="ps-rating-row">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            className={`ps-rating-btn ${answers[q.id] === n ? "selected" : ""}`}
                            onClick={() => setAnswer(q.id, n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="ps-rating-labels">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}

                  {q.type === "single_choice" && (
                    <div className="ps-options">
                      {(q.options || []).map((opt, oi) => (
                        <div
                          key={oi}
                          className={`ps-option ${answers[q.id] === opt ? "selected" : ""}`}
                          onClick={() => setAnswer(q.id, opt)}
                        >
                          <div className="ps-option-indicator">
                            <div className="ps-option-check" />
                          </div>
                          <div className="ps-option-text">{opt}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "multi_choice" && (
                    <div className="ps-options">
                      {(q.options || []).map((opt, oi) => {
                        const selected = (answers[q.id] || []).includes(opt);
                        return (
                          <div
                            key={oi}
                            className={`ps-option multi ${selected ? "selected" : ""}`}
                            onClick={() => toggleMultiChoice(q.id, opt)}
                          >
                            <div className="ps-option-indicator">
                              <div className="ps-option-check" />
                            </div>
                            <div className="ps-option-text">{opt}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="ps-submit-wrap">
              <button
                className="ps-submit-btn"
                onClick={submit}
                disabled={!allAnswered() || submitting}
              >
                {submitting ? "Submitting…" : "Submit responses →"}
              </button>
            </div>
          </div>
        )}

        <div className="ps-footer">
          Powered by <a href="https://mexuri.com" target="_blank" rel="noreferrer">Asha · Mexuri</a>
        </div>
      </div>
    </>
  );
}