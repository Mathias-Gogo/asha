import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const STYLES = `
  .sr-wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
  }

  /* ── Split layout ── */
  .sr-split {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* ── Left: table ── */
  .sr-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid rgba(255,255,255,0.05);
  }

  [data-theme="light"] .sr-left { border-right-color: rgba(0,0,0,0.07); }

  .sr-left-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  [data-theme="light"] .sr-left-header { border-bottom-color: rgba(0,0,0,0.06); }

  .sr-left-title {
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.6);
    letter-spacing: -0.01em;
  }

  [data-theme="light"] .sr-left-title { color: rgba(0,0,0,0.6); }

  .sr-response-count {
    font-size: 11px; font-weight: 600;
    color: rgba(124,58,237,0.7);
    letter-spacing: 0.04em;
  }

  /* ── Table ── */
  .sr-table-wrap {
    flex: 1; overflow: auto;
  }

  .sr-table-wrap::-webkit-scrollbar { width: 3px; height: 3px; }
  .sr-table-wrap::-webkit-scrollbar-track { background: transparent; }
  .sr-table-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  .sr-table {
    width: 100%; border-collapse: collapse;
    font-size: 12px; min-width: 500px;
  }

  .sr-thead th {
    position: sticky; top: 0; z-index: 2;
    background: #0a0a0f;
    padding: 10px 16px;
    text-align: left;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    white-space: nowrap;
  }

  [data-theme="light"] .sr-thead th {
    background: #f4f4f8;
    color: rgba(0,0,0,0.3);
    border-bottom-color: rgba(0,0,0,0.06);
  }

  .sr-tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.1s;
    cursor: pointer;
  }

  [data-theme="light"] .sr-tbody tr { border-bottom-color: rgba(0,0,0,0.04); }

  .sr-tbody tr:hover { background: rgba(124,58,237,0.04); }

  .sr-tbody tr.selected { background: rgba(124,58,237,0.08); }

  .sr-tbody td {
    padding: 10px 16px;
    color: rgba(255,255,255,0.55);
    font-weight: 400; line-height: 1.5;
    max-width: 200px;
    overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-theme="light"] .sr-tbody td { color: rgba(0,0,0,0.55); }

  .sr-tbody td.sr-td-num {
    color: rgba(255,255,255,0.2);
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em;
  }

  [data-theme="light"] .sr-tbody td.sr-td-num { color: rgba(0,0,0,0.25); }

  /* Expanded row */
  .sr-expanded-row td {
    padding: 0 16px 16px;
    background: rgba(124,58,237,0.04);
  }

  .sr-expanded-content {
    display: flex; flex-direction: column; gap: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }

  [data-theme="light"] .sr-expanded-content { border-top-color: rgba(0,0,0,0.05); }

  .sr-answer-item {
    display: flex; flex-direction: column; gap: 3px;
  }

  .sr-answer-q {
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  [data-theme="light"] .sr-answer-q { color: rgba(0,0,0,0.3); }

  .sr-answer-a {
    font-size: 12px; font-weight: 400;
    color: rgba(255,255,255,0.65); line-height: 1.5;
  }

  [data-theme="light"] .sr-answer-a { color: rgba(0,0,0,0.65); }

  /* Empty */
  .sr-empty {
    flex: 1; display: flex;
    flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; text-align: center; padding: 40px;
  }

  .sr-empty-title {
    font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.3); letter-spacing: -0.01em;
  }

  [data-theme="light"] .sr-empty-title { color: rgba(0,0,0,0.3); }

  .sr-empty-sub {
    font-size: 12px; color: rgba(255,255,255,0.15);
    max-width: 240px; line-height: 1.65; font-weight: 400;
  }

  [data-theme="light"] .sr-empty-sub { color: rgba(0,0,0,0.25); }

  /* ── Right: Asha panel ── */
  .sr-right {
    width: 340px; flex-shrink: 0;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .sr-right-header {
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
    display: flex; align-items: center;
    justify-content: space-between;
  }

  [data-theme="light"] .sr-right-header { border-bottom-color: rgba(0,0,0,0.06); }

  .sr-right-title {
    font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.5);
    display: flex; align-items: center; gap: 7px;
    letter-spacing: 0.01em;
  }

  [data-theme="light"] .sr-right-title { color: rgba(0,0,0,0.5); }

  .sr-asha-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
  }

  /* Asha messages */
  .sr-asha-messages {
    flex: 1; overflow-y: auto;
    padding: 14px 16px;
    display: flex; flex-direction: column; gap: 12px;
  }

  .sr-asha-messages::-webkit-scrollbar { width: 3px; }
  .sr-asha-messages::-webkit-scrollbar-track { background: transparent; }
  .sr-asha-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

  .sr-msg-user {
    align-self: flex-end;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px 12px 3px 12px;
    padding: 9px 13px;
    font-size: 12px; line-height: 1.6;
    color: rgba(255,255,255,0.75);
    max-width: 85%;
  }

  [data-theme="light"] .sr-msg-user {
    background: rgba(0,0,0,0.05);
    border-color: rgba(0,0,0,0.07);
    color: rgba(0,0,0,0.7);
  }

  .sr-msg-asha {
    align-self: flex-start;
    font-size: 12px; line-height: 1.7;
    color: rgba(255,255,255,0.65);
    max-width: 100%;
  }

  [data-theme="light"] .sr-msg-asha { color: rgba(0,0,0,0.6); }

  .sr-msg-label {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); margin-bottom: 4px;
  }

  [data-theme="light"] .sr-msg-label { color: rgba(0,0,0,0.25); }

  /* Typing */
  .sr-typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
  .sr-typing span {
    width: 5px; height: 5px; border-radius: 50%;
    background: #a78bfa; opacity: 0.3;
    animation: blink 1.4s infinite;
  }
  .sr-typing span:nth-child(2) { animation-delay: 0.2s; }
  .sr-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

  /* Input */
  .sr-input-wrap {
    padding: 10px 14px;
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex; gap: 8px; align-items: flex-end;
    flex-shrink: 0;
  }

  [data-theme="light"] .sr-input-wrap { border-top-color: rgba(0,0,0,0.06); }

  .sr-input {
    flex: 1; background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 8px 12px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; color: rgba(255,255,255,0.82);
    resize: none; outline: none; line-height: 1.5;
    min-height: 36px; max-height: 100px;
    transition: border-color 0.2s;
  }

  [data-theme="light"] .sr-input {
    background: #f4f4f8;
    border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.78);
  }

  .sr-input:focus { border-color: rgba(124,58,237,0.35); }
  .sr-input::placeholder { color: rgba(255,255,255,0.2); }
  [data-theme="light"] .sr-input::placeholder { color: rgba(0,0,0,0.25); }

  .sr-send-btn {
    width: 32px; height: 32px; border-radius: 50%;
    border: none; background: #7c3aed; color: white;
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(124,58,237,0.35);
  }

  .sr-send-btn:hover:not(:disabled) { background: #6d28d9; transform: scale(1.05); }
  .sr-send-btn:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }
  .sr-send-btn svg { width: 12px; height: 12px; }

  /* Seed questions */
  .sr-seed-questions {
    display: flex; flex-direction: column; gap: 6px;
    padding: 0 16px 12px;
  }

  .sr-seed-btn {
    background: rgba(124,58,237,0.06);
    border: 1px solid rgba(124,58,237,0.15);
    border-radius: 8px; padding: 7px 12px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 500;
    color: rgba(124,58,237,0.7); cursor: pointer;
    text-align: left; transition: all 0.15s;
    letter-spacing: 0.01em; line-height: 1.4;
  }

  .sr-seed-btn:hover {
    background: rgba(124,58,237,0.1);
    border-color: rgba(124,58,237,0.3);
    color: #a78bfa;
  }

  @media (max-width: 768px) {
    .sr-right { display: none; }
  }
`;

const SEED_QUESTIONS = [
  "What patterns do you see in the responses?",
  "What is the most common pain point?",
  "Who seems to be my target audience based on responses?",
  "What should I change about my idea based on this feedback?",
];

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function SurveyResponses({ survey, onResponseCountUpdate }) {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [ashaMessages, setAshaMessages] = useState([]);
  const [ashaInput, setAshaInput] = useState("");
  const [ashaLoading, setAshaLoading] = useState(false);
  const [seedShown, setSeedShown] = useState(true);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { loadData(); }, [survey.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ashaMessages, ashaLoading]);

  const loadData = async () => {
    setLoading(true);

    // Load full survey for questions
    const { data: surveyData } = await supabase
      .from("surveys")
      .select("questions")
      .eq("id", survey.id)
      .single();

    if (surveyData) setQuestions(surveyData.questions || []);

    // Load responses
    const { data: respData } = await supabase
      .from("survey_responses")
      .select("id, answers, created_at")
      .eq("survey_id", survey.id)
      .order("created_at", { ascending: false });

    if (respData) {
      setResponses(respData);
      onResponseCountUpdate?.(respData.length);
    }

    setLoading(false);
  };

  // Build context string for Asha
  const buildSurveyContext = () => {
    if (!questions.length) return "";

    let ctx = `SURVEY: "${survey.title}"\n`;
    if (survey.description) ctx += `Description: ${survey.description}\n`;
    ctx += `\nQUESTIONS:\n`;
    questions.forEach((q, i) => {
      ctx += `${i + 1}. [${q.type}] ${q.text}`;
      if (q.options) ctx += ` (options: ${q.options.join(", ")})`;
      ctx += "\n";
    });

    if (responses.length === 0) {
      ctx += "\nNo responses yet.";
    } else {
      ctx += `\nRESPONSES (${responses.length} total):\n`;
      responses.forEach((r, ri) => {
        ctx += `\nRespondent ${ri + 1}:\n`;
        questions.forEach((q, qi) => {
          const ans = r.answers?.[q.id];
          if (ans !== undefined && ans !== "") {
            ctx += `  Q${qi + 1}: ${Array.isArray(ans) ? ans.join(", ") : ans}\n`;
          }
        });
      });
    }

    return ctx;
  };

  const askAsha = async (text) => {
    const trimmed = (text || ashaInput).trim();
    if (!trimmed || ashaLoading) return;

    setSeedShown(false);
    setAshaInput("");
    setAshaMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setAshaLoading(true);

    try {
      const surveyContext = buildSurveyContext();
      const history = ashaMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 800,
          messages: [
            {
              role: "system",
              content: `You are Asha, an AI research assistant made by Mexuri. You help African founders understand their survey data.

${surveyContext}

Analyse this data to answer the founder's questions. Be concise, specific, and insight-driven. Use markdown where helpful. If there are no responses yet, say so and suggest how to get them.`,
            },
            ...history,
            { role: "user", content: trimmed },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "I couldn't analyse the data right now.";
      setAshaMessages(prev => [...prev, { role: "assistant", content: reply }]);

    } catch (err) {
      console.error(err);
      setAshaMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setAshaLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAsha(); }
  };

  // Format a cell value for the table
  const formatCell = (val) => {
    if (val === undefined || val === null || val === "") return "—";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sr-wrap">
        <div className="sr-split">

          {/* ── Left: responses table ── */}
          <div className="sr-left">
            <div className="sr-left-header">
              <div className="sr-left-title">Responses</div>
              <div className="sr-response-count">
                {responses.length} {responses.length === 1 ? "response" : "responses"}
              </div>
            </div>

            {loading ? (
              <div className="sr-empty">
                <div className="sr-empty-title">Loading responses…</div>
                <div className="sr-empty-sub">Hang tight</div>
              </div>
            ) : responses.length === 0 ? (
              <div className="sr-empty">
                <div className="sr-empty-title">No responses yet</div>
                <div className="sr-empty-sub">
                  {survey.is_active
                    ? "Share your survey link to start collecting responses."
                    : "Publish your survey first, then share the link."}
                </div>
              </div>
            ) : (
              <div className="sr-table-wrap">
                <table className="sr-table">
                  <thead className="sr-thead">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      {questions.map((q, i) => (
                        <th key={q.id || i}>Q{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="sr-tbody">
                    {responses.map((r, ri) => (
                      <>
                        <tr
                          key={r.id}
                          className={expandedRow === r.id ? "selected" : ""}
                          onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                        >
                          <td className="sr-td-num">{responses.length - ri}</td>
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          {questions.map((q) => (
                            <td key={q.id} title={formatCell(r.answers?.[q.id])}>
                              {formatCell(r.answers?.[q.id])}
                            </td>
                          ))}
                        </tr>

                        {/* Expanded full answers */}
                        {expandedRow === r.id && (
                          <tr key={`${r.id}-expanded`} className="sr-expanded-row">
                            <td colSpan={questions.length + 2}>
                              <div className="sr-expanded-content">
                                {questions.map((q) => (
                                  <div key={q.id} className="sr-answer-item">
                                    <div className="sr-answer-q">{q.text}</div>
                                    <div className="sr-answer-a">
                                      {formatCell(r.answers?.[q.id])}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right: Asha panel ── */}
          <div className="sr-right">
            <div className="sr-right-header">
              <div className="sr-right-title">
                <div className="sr-asha-dot" />
                Ask Asha
              </div>
            </div>

            <div className="sr-asha-messages">
              {ashaMessages.length === 0 && !ashaLoading && (
                <div style={{ padding: "4px 0 8px" }}>
                  <div className="sr-msg-label">Asha</div>
                  <div className="sr-msg-asha">
                    I have full context of this survey
                    {responses.length > 0
                      ? ` and all ${responses.length} responses`
                      : " but no responses yet"}
                    . Ask me anything.
                  </div>
                </div>
              )}

              {ashaMessages.map((m, i) => (
                m.role === "user" ? (
                  <div key={i} className="sr-msg-user">{m.content}</div>
                ) : (
                  <div key={i}>
                    <div className="sr-msg-label">Asha</div>
                    <div className="sr-msg-asha"
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>")
                      }}
                    />
                  </div>
                )
              ))}

              {ashaLoading && (
                <div>
                  <div className="sr-msg-label">Asha</div>
                  <div className="sr-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Seed questions */}
            {seedShown && ashaMessages.length === 0 && (
              <div className="sr-seed-questions">
                {SEED_QUESTIONS.map(q => (
                  <button key={q} className="sr-seed-btn" onClick={() => askAsha(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="sr-input-wrap">
              <textarea
                className="sr-input"
                placeholder="Ask about your responses…"
                value={ashaInput}
                onChange={e => setAshaInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={ashaLoading}
                rows={1}
              />
              <button
                className="sr-send-btn"
                onClick={() => askAsha()}
                disabled={ashaLoading || !ashaInput.trim()}
              >
                <IconSend />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}