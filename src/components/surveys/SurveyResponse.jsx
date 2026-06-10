import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const STYLES = `
  :root {
    --bg: #f5f7ff; --surface: #ffffff; --surface-2: #f0f2ff;
    --fg: #111827; --fg-2: #6b7280; --fg-3: #9ca3af;
    --border: rgba(0,0,0,0.07); --border-2: rgba(0,0,0,0.12);
    --orange: #ff6b35; --orange-dim: rgba(255,107,53,0.10);
    --violet: #7c3aed; --emerald: #10b981; --cyan: #00c9d4;
    --shadow-sm: 0 1px 8px rgba(0,0,0,0.07);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  }

  .sr-wrap {
    height: 100%; overflow-y: auto;
    background: var(--bg); color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .sr-wrap::-webkit-scrollbar { width: 4px; }
  .sr-wrap::-webkit-scrollbar-track { background: transparent; }
  .sr-wrap::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.18); border-radius: 4px; }

  .sr-inner { max-width: 900px; margin: 0 auto; padding: 36px 32px 80px; }

  /* ── Stats bar ── */
  .sr-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 14px; margin-bottom: 36px;
  }

  .sr-stat-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 22px 20px;
    box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .sr-stat-card:hover { box-shadow: var(--shadow-md); }

  .sr-stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8);
    border-radius: 16px 16px 0 0;
  }

  .sr-stat-card:nth-child(2)::before { background: linear-gradient(90deg, #7c3aed, #00c9d4); }
  .sr-stat-card:nth-child(3)::before { background: linear-gradient(90deg, #10b981, #00c9d4); }

  .sr-stat-label {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--fg-3); margin-bottom: 8px;
  }

  .sr-stat-value {
    font-size: 30px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.04em; line-height: 1;
  }

  .sr-stat-sub {
    font-size: 11.5px; color: var(--fg-3); margin-top: 5px; font-weight: 500;
  }

  /* ── Section label ── */
  .sr-section-label {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--fg-3);
    margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }

  .sr-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  /* ── Question result card ── */
  .sr-q-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 22px; margin-bottom: 16px;
    box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
  }

  .sr-q-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: linear-gradient(to bottom, #ff6b35, #ff4fd8);
    border-radius: 16px 0 0 16px;
  }

  .sr-q-num {
    font-size: 10px; font-weight: 800; color: var(--orange);
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px;
  }

  .sr-q-text {
    font-size: 14px; font-weight: 700; color: var(--fg);
    letter-spacing: -0.02em; margin-bottom: 14px; line-height: 1.4;
  }

  /* ── Bar chart ── */
  .sr-bar-chart { display: flex; flex-direction: column; gap: 9px; }

  .sr-bar-row { display: flex; align-items: center; gap: 10px; }

  .sr-bar-label {
    font-size: 12.5px; color: var(--fg-2); font-weight: 500;
    min-width: 100px; max-width: 140px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .sr-bar-track {
    flex: 1; height: 9px; background: var(--surface-2);
    border-radius: 100px; overflow: hidden; border: 1px solid var(--border);
  }

  .sr-bar-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8);
    transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    min-width: 3px;
  }

  .sr-bar-count {
    font-size: 12px; font-weight: 800; color: var(--fg-2);
    min-width: 32px; text-align: right;
  }

  /* ── Rating avg ── */
  .sr-rating-row { display: flex; align-items: center; gap: 14px; }

  .sr-rating-big {
    font-size: 44px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.05em; line-height: 1;
  }

  .sr-rating-sub {
    font-size: 11.5px; color: var(--fg-3); font-weight: 500; margin-top: 3px;
  }

  .sr-rating-breakdown { flex: 1; display: flex; flex-direction: column; gap: 5px; }

  .sr-rating-bar-row { display: flex; align-items: center; gap: 8px; }

  .sr-rating-bar-label {
    font-size: 11px; color: var(--fg-3); font-weight: 600; min-width: 14px;
    text-align: right;
  }

  .sr-rating-bar-track {
    flex: 1; height: 7px; background: var(--surface-2);
    border-radius: 100px; overflow: hidden;
  }

  .sr-rating-bar-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #7c3aed, #00c9d4);
    transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Text responses ── */
  .sr-text-responses { display: flex; flex-direction: column; gap: 9px; }

  .sr-text-item {
    background: var(--surface-2); border: 1.5px solid var(--border);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13.5px; line-height: 1.65; color: var(--fg); font-weight: 400;
    position: relative;
  }

  .sr-text-item::before {
    content: '"';
    position: absolute; top: 8px; left: 10px;
    font-size: 28px; color: var(--orange); opacity: 0.15;
    font-family: Georgia, serif; line-height: 1;
  }

  .sr-text-item-inner { padding-left: 12px; }

  .sr-text-more {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent; border: 1.5px solid var(--border);
    border-radius: 8px; padding: 7px 16px;
    font-family: inherit; font-size: 12px; font-weight: 700;
    color: var(--fg-2); cursor: pointer; transition: all 0.18s; margin-top: 6px;
  }

  .sr-text-more:hover { border-color: rgba(255,107,53,0.25); color: var(--orange); background: var(--orange-dim); }

  /* ── Individual responses table ── */
  .sr-responses-section { margin-top: 40px; }

  .sr-responses-table { width: 100%; overflow-x: auto; }

  .sr-response-row {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 12px; padding: 16px 18px; margin-bottom: 10px;
    box-shadow: var(--shadow-sm);
  }

  .sr-response-meta {
    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }

  .sr-response-num {
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--orange);
    background: var(--orange-dim); padding: 3px 9px; border-radius: 100px;
    border: 1px solid rgba(255,107,53,0.18);
  }

  .sr-response-date { font-size: 11.5px; color: var(--fg-3); font-weight: 500; }

  .sr-response-answers { display: flex; flex-direction: column; gap: 8px; }

  .sr-answer-item { display: flex; flex-direction: column; gap: 3px; }

  .sr-answer-q {
    font-size: 10.5px; font-weight: 700; color: var(--fg-3);
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  .sr-answer-val {
    font-size: 13.5px; color: var(--fg); font-weight: 400; line-height: 1.55;
  }

  /* ── Empty ── */
  .sr-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px;
    text-align: center; padding: 80px 24px;
  }

  .sr-empty-icon { font-size: 36px; margin-bottom: 4px; }
  .sr-empty-title { font-size: 16px; font-weight: 800; color: var(--fg); letter-spacing: -0.03em; }
  .sr-empty-sub { font-size: 13px; color: var(--fg-3); max-width: 260px; line-height: 1.6; }

  @media (max-width: 640px) {
    .sr-inner { padding: 20px 14px 60px; }
    .sr-stats { grid-template-columns: 1fr; }
    .sr-bar-label { min-width: 70px; max-width: 90px; font-size: 11px; }
  }
`;

const CHART_COLORS = [
  "#ff6b35", "#ff4fd8", "#7c3aed", "#00c9d4", "#10b981",
  "#ffd166", "#f472b6", "#fb923c", "#06b6d4", "#8b5cf6"
];

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

// ─── Rating Chart ─────────────────────────────────────────────────────────────
function RatingChart({ question, responses }) {
  const distribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;

    responses.forEach(r => {
      const val = r.answers?.[question.id];
      const num = parseInt(val);
      if (num >= 1 && num <= 5) {
        counts[num]++;
        total++;
        sum += num;
      }
    });

    const data = Object.entries(counts).map(([rating, count]) => ({
      rating: `${rating}★`,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    return { data, average: total > 0 ? (sum / total).toFixed(1) : "—", total };
  }, [question.id, responses]);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div className="chart-title">{question.text}</div>
        <div className="chart-meta">Rating · {distribution.total} responses</div>
      </div>
      <div className="chart-score-row">
        <div className="chart-score">
          <div className="chart-score-val">{distribution.average}</div>
          <div className="chart-score-label">Average</div>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={distribution.data} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="rating"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                fontSize: 12,
                color: '#111827'
              }}
              formatter={(value) => [`${value} responses`, 'Count']}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Single Choice Chart ────────────────────────────────────────────────────────
function SingleChoiceChart({ question, responses }) {
  const data = useMemo(() => {
    const counts = {};
    question.options?.forEach(opt => counts[opt] = 0);

    responses.forEach(r => {
      const val = r.answers?.[question.id];
      if (val && counts[val] !== undefined) counts[val]++;
    });

    const total = responses.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [question.id, question.options, responses]);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div className="chart-title">{question.text}</div>
        <div className="chart-meta">Single choice · {responses.length} responses</div>
      </div>
      <div className="chart-body split">
        <div className="chart-donut">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                  fontSize: 12,
                  color: '#111827'
                }}
                formatter={(value, name) => [`${value} votes`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          {data.map((item, i) => (
            <div key={item.name} className="legend-item">
              <div className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <div className="legend-info">
                <div className="legend-name">{item.name}</div>
                <div className="legend-bar-wrap">
                  <div className="legend-bar" style={{ width: `${item.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
              <div className="legend-pct">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Multi Choice Chart ─────────────────────────────────────────────────────────
function MultiChoiceChart({ question, responses }) {
  const data = useMemo(() => {
    const counts = {};
    question.options?.forEach(opt => counts[opt] = 0);

    responses.forEach(r => {
      const vals = r.answers?.[question.id];
      if (Array.isArray(vals)) {
        vals.forEach(v => {
          if (counts[v] !== undefined) counts[v]++;
        });
      }
    });

    const total = responses.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [question.id, question.options, responses]);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div className="chart-title">{question.text}</div>
        <div className="chart-meta">Multi choice · {responses.length} responses</div>
      </div>
      <div className="chart-body">
        <div className="multi-chart">
          {data.map((item, i) => (
            <div key={item.name} className="multi-row">
              <div className="multi-label">{item.name}</div>
              <div className="multi-bar-wrap">
                <div
                  className="multi-bar"
                  style={{
                    width: `${item.percentage}%`,
                    background: CHART_COLORS[i % CHART_COLORS.length]
                  }}
                />
              </div>
              <div className="multi-pct">{item.count} ({item.percentage}%)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Text Responses List ───────────────────────────────────────────────────────
function TextResponses({ question, responses }) {
  const answers = useMemo(() => {
    return responses
      .map(r => r.answers?.[question.id])
      .filter(a => a && String(a).trim());
  }, [question.id, responses]);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div className="chart-title">{question.text}</div>
        <div className="chart-meta">Text · {answers.length} responses</div>
      </div>
      <div className="text-responses">
        {answers.length === 0 ? (
          <div className="text-empty">No text responses yet</div>
        ) : (
          answers.map((answer, i) => (
            <div key={i} className="text-item">
              <div className="text-num">{i + 1}</div>
              <div className="text-content">{answer}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  const [viewMode, setViewMode] = useState('dashboard');

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

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...ashaMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: trimmed }],
          surveyContext: buildSurveyContext(),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I couldn't analyse the data right now.";
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
              <>
                <div className="view-toggle">
                  <button
                    className={`view-toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setViewMode('dashboard')}
                  >
                    📊 Dashboard
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                    onClick={() => setViewMode('raw')}
                  >
                    📋 Raw data
                  </button>
                </div>

                {viewMode === 'dashboard' ? (
                  <div className="charts-dashboard">
                    {questions.map(q => {
                      if (q.type === 'rating') {
                        return <RatingChart key={q.id} question={q} responses={responses} />;
                      }
                      if (q.type === 'single_choice') {
                        return <SingleChoiceChart key={q.id} question={q} responses={responses} />;
                      }
                      if (q.type === 'multi_choice') {
                        return <MultiChoiceChart key={q.id} question={q} responses={responses} />;
                      }
                      if (q.type === 'text') {
                        return <TextResponses key={q.id} question={q} responses={responses} />;
                      }
                      return null;
                    })}
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
              </>
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