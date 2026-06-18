import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .ps-wrap {
    min-height: 100vh;
    background: #e8e9e1;
    background-image: repeating-linear-gradient(
      0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 64px
    );
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 40px 20px;
  }

  .ps-brand {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 28px;
  }

  .ps-brand-mark {
    width: 24px; height: 24px; border-radius: 7px;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: white;
  }

  .ps-brand-text {
    font-size: 12.5px; font-weight: 700; color: rgba(0,0,0,0.4);
    letter-spacing: -0.01em;
  }

  .ps-stack {
    position: relative; width: 100%; max-width: 420px;
  }

  .ps-stack-layer {
    position: absolute; inset: 0;
    background: #ffffff; border-radius: 22px;
  }

  .ps-stack-layer.l1 { transform: translateY(10px) scale(0.97); opacity: 0.7; }
  .ps-stack-layer.l2 { transform: translateY(20px) scale(0.94); opacity: 0.4; }

  .ps-card {
    position: relative; background: #ffffff;
    border-radius: 22px; padding: 30px 28px 28px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10);
    z-index: 2;
  }

  .ps-progress-row { display: flex; align-items: center; gap: 6px; margin-bottom: 22px; }

  .ps-progress-seg {
    flex: 1; height: 4px; border-radius: 3px;
    background: rgba(0,0,0,0.08); overflow: hidden;
  }

  .ps-progress-seg-fill {
    height: 100%; width: 0%; border-radius: 3px;
    background: #1a1a1a; transition: width 0.3s ease;
  }

  .ps-progress-seg.done .ps-progress-seg-fill { width: 100%; }
  .ps-progress-seg.current .ps-progress-seg-fill { width: 100%; background: linear-gradient(90deg, #ff6b35, #ff4fd8); }

  .ps-q-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(0,0,0,0.32);
    margin-bottom: 10px;
  }

  .ps-q-text {
    font-size: 21px; font-weight: 700; color: #16161a;
    line-height: 1.28; letter-spacing: -0.02em;
    margin-bottom: 22px;
  }

  .ps-select-hint {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(0,0,0,0.30);
    margin-bottom: 12px;
  }

  .ps-options { display: flex; flex-direction: column; gap: 9px; margin-bottom: 6px; }

  .ps-option {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 15px; border-radius: 12px;
    border: 1.5px solid rgba(0,0,0,0.10);
    background: transparent;
    cursor: pointer; transition: all 0.15s;
  }

  .ps-option:hover { border-color: rgba(0,0,0,0.22); background: rgba(0,0,0,0.015); }

  .ps-option.selected {
    border-color: #16161a; background: rgba(0,0,0,0.03);
  }

  .ps-option-indicator {
    width: 18px; height: 18px; border-radius: 50%;
    border: 1.5px solid rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
  }

  .ps-option.multi .ps-option-indicator { border-radius: 5px; }

  .ps-option.selected .ps-option-indicator { border-color: #16161a; background: #16161a; }

  .ps-option-check {
    width: 8px; height: 8px; border-radius: 50%; background: white;
    opacity: 0; transition: opacity 0.15s;
  }

  .ps-option.multi .ps-option-check { border-radius: 1.5px; width: 7px; height: 7px; }
  .ps-option.selected .ps-option-check { opacity: 1; }

  .ps-option-text {
    font-size: 14.5px; font-weight: 500; color: rgba(0,0,0,0.55); flex: 1;
    line-height: 1.4;
  }

  .ps-option.selected .ps-option-text { color: #16161a; font-weight: 600; }

  .ps-text-input {
    width: 100%; background: rgba(0,0,0,0.025);
    border: 1.5px solid rgba(0,0,0,0.10);
    border-radius: 12px; padding: 14px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px; color: #16161a;
    resize: none; outline: none; line-height: 1.6;
    min-height: 110px; transition: border-color 0.2s;
  }

  .ps-text-input:focus { border-color: rgba(0,0,0,0.30); background: white; }
  .ps-text-input::placeholder { color: rgba(0,0,0,0.28); }

  .ps-rating-row { display: flex; gap: 8px; margin-bottom: 6px; }

  .ps-rating-btn {
    flex: 1; height: 50px; border-radius: 12px;
    border: 1.5px solid rgba(0,0,0,0.10);
    background: transparent; color: rgba(0,0,0,0.45);
    font-family: 'Inter', sans-serif;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.15s;
  }

  .ps-rating-btn:hover { border-color: rgba(0,0,0,0.25); }

  .ps-rating-btn.selected {
    background: #16161a; border-color: #16161a; color: white;
  }

  .ps-rating-labels {
    display: flex; justify-content: space-between;
    font-size: 11px; color: rgba(0,0,0,0.30);
    font-weight: 600; margin-top: 8px; padding: 0 2px;
  }

  .ps-card-footer {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 14px; margin-top: 26px;
  }

  .ps-back-btn {
    background: transparent; border: none;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    color: rgba(0,0,0,0.45); cursor: pointer; padding: 10px 6px;
    transition: color 0.15s;
  }
  .ps-back-btn:hover { color: rgba(0,0,0,0.75); }
  .ps-back-btn:disabled { opacity: 0; pointer-events: none; }

  .ps-next-btn {
    padding: 12px 28px; border-radius: 12px; border: none;
    background: #a8e890;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
    color: #16161a; cursor: pointer; transition: all 0.18s;
  }

  .ps-next-btn:hover:not(:disabled) { background: #93e077; transform: translateY(-1px); }
  .ps-next-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .ps-submit-btn {
    padding: 12px 30px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
    color: white; cursor: pointer; transition: all 0.18s;
    box-shadow: 0 4px 18px rgba(255,107,53,0.32);
  }
  .ps-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 26px rgba(255,107,53,0.45); }
  .ps-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .ps-intro-title {
    font-size: 23px; font-weight: 800; color: #16161a;
    letter-spacing: -0.03em; line-height: 1.25; margin-bottom: 12px;
  }

  .ps-intro-desc {
    font-size: 14px; color: rgba(0,0,0,0.45);
    line-height: 1.65; font-weight: 400; margin-bottom: 26px;
  }

  .ps-intro-meta {
    display: flex; align-items: center; gap: 8px; margin-bottom: 26px;
    font-size: 12px; color: rgba(0,0,0,0.35); font-weight: 600;
  }

  .ps-intro-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(0,0,0,0.25); }

  .ps-start-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none;
    background: #16161a; color: white;
    font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 700;
    cursor: pointer; transition: all 0.18s;
  }
  .ps-start-btn:hover { background: #2a2a30; transform: translateY(-1px); }

  .ps-state-card {
    text-align: center; padding: 50px 32px;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }

  .ps-state-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 4px;
    box-shadow: 0 8px 28px rgba(255,107,53,0.30);
  }

  .ps-state-title {
    font-size: 19px; font-weight: 800; color: #16161a; letter-spacing: -0.02em;
  }

  .ps-state-sub {
    font-size: 13.5px; color: rgba(0,0,0,0.40);
    max-width: 280px; line-height: 1.6; font-weight: 400;
  }

  .ps-footer {
    text-align: center; margin-top: 24px;
    font-size: 11px; color: rgba(0,0,0,0.28);
    font-weight: 500; letter-spacing: 0.03em;
  }

  .ps-footer a { color: rgba(0,0,0,0.40); text-decoration: none; font-weight: 700; }
  .ps-footer a:hover { color: #16161a; }

  @media (max-width: 480px) {
    .ps-card { padding: 24px 20px 22px; }
    .ps-q-text { font-size: 18px; }
  }
`;

export default function PublicSurvey() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => { loadSurvey(); }, [id]);

  const loadSurvey = async () => {
    const { data, error } = await supabase
      .from("surveys")
      .select("id, title, description, questions, is_active")
      .eq("id", id)
      .single();

    if (error) {
      setStatus(error.code === "PGRST116" ? "closed" : "error");
      return;
    }

    setSurvey(data);
    setStatus(data.is_active ? "intro" : "closed");
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

  const questions = survey?.questions || [];
  const total = questions.length;
  const currentQ = questions[step];

  const isAnswered = (q) => {
    if (!q) return false;
    const ans = answers[q.id];
    if (q.type === "text") return !!ans?.trim?.();
    if (q.type === "rating") return ans !== undefined;
    if (q.type === "single_choice") return ans !== undefined;
    if (q.type === "multi_choice") return Array.isArray(ans) && ans.length > 0;
    return true;
  };

  const goNext = () => {
    if (step < total - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const submit = async () => {
    if (submitting) return;
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

  const isLast = step === total - 1;

  return (
    <>
      <style>{STYLES}</style>
      <div className="ps-wrap">
        <div className="ps-brand">
          <div className="ps-brand-mark">A</div>
          <div className="ps-brand-text">Asha · by Mexuri</div>
        </div>

        {status === "loading" && (
          <div className="ps-stack">
            <div className="ps-card">
              <div className="ps-state-card">
                <div className="ps-state-sub">Loading survey…</div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="ps-stack">
            <div className="ps-card">
              <div className="ps-state-card">
                <div className="ps-state-icon">🔍</div>
                <div className="ps-state-title">Survey not found</div>
                <div className="ps-state-sub">This survey doesn't exist or the link may be incorrect.</div>
              </div>
            </div>
          </div>
        )}

        {status === "closed" && (
          <div className="ps-stack">
            <div className="ps-card">
              <div className="ps-state-card">
                <div className="ps-state-icon">🔒</div>
                <div className="ps-state-title">Survey closed</div>
                <div className="ps-state-sub">This survey is no longer accepting responses.</div>
              </div>
            </div>
          </div>
        )}

        {status === "submitted" && (
          <div className="ps-stack">
            <div className="ps-card">
              <div className="ps-state-card">
                <div className="ps-state-icon">✅</div>
                <div className="ps-state-title">Thanks for responding!</div>
                <div className="ps-state-sub">Your feedback has been recorded. It will help shape a better product.</div>
              </div>
            </div>
          </div>
        )}

        {status === "intro" && survey && (
          <div className="ps-stack">
            <div className="ps-stack-layer l2" />
            <div className="ps-stack-layer l1" />
            <div className="ps-card">
              <div className="ps-intro-title">{survey.title}</div>
              {survey.description && (
                <div className="ps-intro-desc">{survey.description}</div>
              )}
              <div className="ps-intro-meta">
                <span>{total} question{total !== 1 ? "s" : ""}</span>
                <div className="ps-intro-dot" />
                <span>~{Math.max(1, Math.round(total * 0.4))} min</span>
              </div>
              <button className="ps-start-btn" onClick={() => setStatus("active")}>
                Start survey →
              </button>
            </div>
          </div>
        )}

        {status === "active" && survey && currentQ && (
          <div className="ps-stack">
            {step < total - 1 && <div className="ps-stack-layer l2" />}
            {step < total - 1 && <div className="ps-stack-layer l1" />}
            <div className="ps-card">

              <div className="ps-progress-row">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`ps-progress-seg ${i < step ? "done" : ""} ${i === step ? "current" : ""}`}
                  >
                    <div className="ps-progress-seg-fill" />
                  </div>
                ))}
              </div>

              <div className="ps-q-label">Question {step + 1} of {total}</div>
              <div className="ps-q-text">{currentQ.text}</div>

              {currentQ.type === "text" && (
                <textarea
                  className="ps-text-input"
                  placeholder="Type your answer…"
                  value={answers[currentQ.id] || ""}
                  onChange={e => setAnswer(currentQ.id, e.target.value)}
                  autoFocus
                />
              )}

              {currentQ.type === "rating" && (
                <div>
                  <div className="ps-rating-row">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`ps-rating-btn ${answers[currentQ.id] === n ? "selected" : ""}`}
                        onClick={() => setAnswer(currentQ.id, n)}
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

              {currentQ.type === "single_choice" && (
                <>
                  <div className="ps-select-hint">Select only one</div>
                  <div className="ps-options">
                    {(currentQ.options || []).map((opt, oi) => (
                      <div
                        key={oi}
                        className={`ps-option ${answers[currentQ.id] === opt ? "selected" : ""}`}
                        onClick={() => setAnswer(currentQ.id, opt)}
                      >
                        <div className="ps-option-indicator">
                          <div className="ps-option-check" />
                        </div>
                        <div className="ps-option-text">{opt}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {currentQ.type === "multi_choice" && (
                <>
                  <div className="ps-select-hint">Select all that apply</div>
                  <div className="ps-options">
                    {(currentQ.options || []).map((opt, oi) => {
                      const selected = (answers[currentQ.id] || []).includes(opt);
                      return (
                        <div
                          key={oi}
                          className={`ps-option multi ${selected ? "selected" : ""}`}
                          onClick={() => toggleMultiChoice(currentQ.id, opt)}
                        >
                          <div className="ps-option-indicator">
                            <div className="ps-option-check" />
                          </div>
                          <div className="ps-option-text">{opt}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="ps-card-footer">
                <button className="ps-back-btn" onClick={goBack} disabled={step === 0}>
                  Back
                </button>
                {isLast ? (
                  <button
                    className="ps-submit-btn"
                    onClick={submit}
                    disabled={!isAnswered(currentQ) || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit →"}
                  </button>
                ) : (
                  <button
                    className="ps-next-btn"
                    onClick={goNext}
                    disabled={!isAnswered(currentQ)}
                  >
                    Next
                  </button>
                )}
              </div>
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
