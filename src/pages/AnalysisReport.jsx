// src/pages/AnalysisReport.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

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
    --red:        #ef4444;
    --amber:      #f59e0b;
    --shadow-sm:  0 1px 8px rgba(0,0,0,0.07);
    --shadow-md:  0 4px 24px rgba(0,0,0,0.10);
    --shadow-lg:  0 12px 48px rgba(0,0,0,0.14);
  }

  .report-wrap {
    height: 100%; overflow-y: auto; background: var(--bg);
    font-family: 'Inter', system-ui, sans-serif; color: var(--fg);
  }

  .report-wrap::-webkit-scrollbar { width: 4px; }
  .report-wrap::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.20); border-radius: 4px; }

  .report-inner {
    max-width: 860px; margin: 0 auto;
    padding: 32px 28px 64px;
  }

  /* ── Back button ── */
  .report-back {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--surface);
    color: var(--fg-2); font-family: inherit;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; margin-bottom: 28px;
    box-shadow: var(--shadow-sm);
  }
  .report-back:hover { color: var(--orange); border-color: rgba(255,107,53,0.30); }

  /* ── Header ── */
  .report-header {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 20px; padding: 32px 32px 28px;
    margin-bottom: 24px; position: relative; overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .report-header::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8, #7c3aed);
    border-radius: 20px 20px 0 0;
  }

  .report-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 100px; margin-bottom: 14px;
    background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,79,216,0.10));
    border: 1px solid rgba(255,107,53,0.22);
    font-size: 9.5px; font-weight: 800; color: var(--orange);
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  .report-title {
    font-size: 24px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.04em; line-height: 1.2; margin-bottom: 8px;
  }

  .report-meta {
    font-size: 13px; color: var(--fg-3); font-weight: 500;
  }

  .report-stats {
    display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;
  }

  .report-stat {
    display: flex; flex-direction: column; gap: 3px;
  }

  .report-stat-value {
    font-size: 22px; font-weight: 800; color: var(--fg); letter-spacing: -0.03em;
  }

  .report-stat-label {
    font-size: 10.5px; font-weight: 600; color: var(--fg-3);
    text-transform: uppercase; letter-spacing: 0.08em;
  }

  /* ── Verdict banner ── */
  .verdict-banner {
    border-radius: 16px; padding: 22px 26px;
    margin-bottom: 24px; display: flex; align-items: center; gap: 16px;
    border: 1.5px solid;
  }

  .verdict-banner.continue {
    background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.25);
  }
  .verdict-banner.pivot {
    background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.25);
  }
  .verdict-banner.abandon {
    background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.25);
  }

  .verdict-icon { font-size: 28px; flex-shrink: 0; }

  .verdict-text-wrap { flex: 1; }

  .verdict-label {
    font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 4px;
  }

  .verdict-banner.continue .verdict-label { color: var(--emerald); }
  .verdict-banner.pivot .verdict-label { color: var(--amber); }
  .verdict-banner.abandon .verdict-label { color: var(--red); }

  .verdict-heading {
    font-size: 17px; font-weight: 800; color: var(--fg);
    letter-spacing: -0.03em; margin-bottom: 5px;
  }

  .verdict-reasoning { font-size: 13.5px; color: var(--fg-2); line-height: 1.65; }

  .verdict-next {
    margin-top: 12px; padding: 12px 16px;
    background: var(--surface); border-radius: 10px;
    border: 1px solid var(--border);
    font-size: 12.5px; color: var(--fg); font-weight: 600; line-height: 1.5;
  }

  .verdict-next-label {
    font-size: 9px; font-weight: 800; color: var(--orange);
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;
  }

  /* ── Grid ── */
  .report-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 16px;
  }

  .report-grid.one-col { grid-template-columns: 1fr; }

  @media (max-width: 680px) {
    .report-grid { grid-template-columns: 1fr; }
  }

  /* ── Section cards ── */
  .report-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 24px;
    box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px;
  }

  .report-card-header {
    display: flex; align-items: center; gap: 10px;
  }

  .report-card-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    background: var(--surface-2); border: 1px solid var(--border);
  }

  .report-card-title {
    font-size: 11px; font-weight: 800; color: var(--fg-3);
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  .report-card-body {
    font-size: 13.5px; color: var(--fg); line-height: 1.7; font-weight: 400;
  }

  .report-card-body strong { font-weight: 700; color: var(--fg); }

  .report-card-sub {
    font-size: 12px; color: var(--fg-3); line-height: 1.6;
    padding: 10px 12px; background: var(--surface-2);
    border-radius: 8px; border: 1px solid var(--border);
    margin-top: 2px;
  }

  /* ── Tags / chips ── */
  .report-tags { display: flex; flex-wrap: wrap; gap: 6px; }

  .report-tag {
    padding: 4px 12px; border-radius: 100px;
    font-size: 11.5px; font-weight: 600;
    background: var(--orange-dim);
    border: 1px solid rgba(255,107,53,0.18);
    color: var(--orange);
  }

  .report-tag.violet {
    background: rgba(124,58,237,0.08);
    border-color: rgba(124,58,237,0.18);
    color: var(--violet);
  }

  .report-tag.emerald {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.18);
    color: var(--emerald);
  }

  /* ── Risk rows ── */
  .risk-row {
    padding: 13px 15px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--surface-2);
    display: flex; flex-direction: column; gap: 6px;
  }

  .risk-top { display: flex; align-items: center; gap: 8px; }

  .risk-severity {
    padding: 2px 9px; border-radius: 100px;
    font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  .risk-severity.high { background: rgba(239,68,68,0.12); color: var(--red); }
  .risk-severity.medium { background: rgba(245,158,11,0.12); color: var(--amber); }
  .risk-severity.low { background: rgba(16,185,129,0.12); color: var(--emerald); }

  .risk-title { font-size: 13px; font-weight: 700; color: var(--fg); line-height: 1.4; flex: 1; }

  .risk-mitigation {
    font-size: 12px; color: var(--fg-2); line-height: 1.55;
    padding-left: 4px;
  }

  /* ── Loading / error states ── */
  .report-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px; text-align: center;
  }

  .report-state-icon { font-size: 40px; }

  .report-state-title {
    font-size: 17px; font-weight: 800; color: var(--fg); letter-spacing: -0.03em;
  }

  .report-state-sub { font-size: 13.5px; color: var(--fg-3); max-width: 320px; line-height: 1.65; }

  .report-state-btn {
    padding: 11px 28px; border-radius: 11px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 2px 14px rgba(255,107,53,0.30);
    margin-top: 4px;
  }

  .report-state-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 22px rgba(255,107,53,0.42); }
  .report-state-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Divider ── */
  .report-section-label {
    font-size: 10px; font-weight: 800; color: var(--fg-3);
    letter-spacing: 0.1em; text-transform: uppercase;
    margin: 8px 0 4px; padding: 0 2px;
  }

  @media (max-width: 600px) {
    .report-inner { padding: 20px 16px 48px; }
    .report-header { padding: 24px 20px 20px; }
    .report-title { font-size: 19px; }
    .report-stats { gap: 16px; }
    .report-card { padding: 18px 16px; }
    .verdict-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
  }
`;

// ─── Helper to render verdict icon ───────────────────────────────────────────
function verdictIcon(verdict) {
    if (verdict === "continue") return "🚀";
    if (verdict === "pivot") return "↩️";
    if (verdict === "abandon") return "🛑";
    return "📊";
}

function verdictHeading(verdict) {
    if (verdict === "continue") return "Green light — build this.";
    if (verdict === "pivot") return "Don't abandon, but change direction.";
    if (verdict === "abandon") return "The data says stop here.";
    return "Analysis complete.";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalysisReport() {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [survey, setSurvey] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [responseCount, setResponseCount] = useState(0);
    const [status, setStatus] = useState("loading"); // loading | running | done | error | no_data
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (user?.id && surveyId) loadReport();
    }, [user?.id, surveyId]);

    const loadReport = async () => {
        setStatus("loading");

        // Fetch survey with any existing analysis
        const { data: surveyData, error } = await supabase
            .from("surveys")
            .select("id, title, description, analysis, analysis_status, is_active, created_at")
            .eq("id", surveyId)
            .eq("user_id", user.id)
            .single();

        if (error || !surveyData) {
            setStatus("error");
            setErrorMsg("Survey not found.");
            return;
        }

        setSurvey(surveyData);

        // If we already have a done analysis, show it
        if (surveyData.analysis_status === "done" && surveyData.analysis) {
            const { count } = await supabase
                .from("survey_responses")
                .select("*", { count: "exact", head: true })
                .eq("survey_id", surveyId);
            setResponseCount(count || 0);
            setAnalysis(surveyData.analysis);
            setStatus("done");
            return;
        }

        // Otherwise trigger fresh analysis
        await runAnalysis(surveyData);
    };

    const runAnalysis = async (surveyData) => {
        setStatus("running");
        setAnalysis(null);

        try {
            const res = await fetch("/api/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ surveyId }),
            });

            const data = await res.json();

            if (data.error_type === "rate_limit") {
                setStatus("error");
                setErrorMsg(`Rate limit hit. Please try again in ${data.wait_time}.`);
                return;
            }

            if (data.error) {
                setStatus("error");
                setErrorMsg(data.error);
                return;
            }

            setAnalysis(data.analysis);
            setResponseCount(data.responseCount || 0);
            setStatus("done");

        } catch (err) {
            console.error("[REPORT] Analysis error:", err);
            setStatus("error");
            setErrorMsg("Something went wrong. Please try again.");
        }
    };

    const handleReanalyse = async () => {
        if (survey) await runAnalysis(survey);
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <>
                <style>{STYLES}</style>
                <div className="report-wrap">
                    <div className="report-inner">
                        <div className="report-state">
                            <div className="report-state-icon">⏳</div>
                            <div className="report-state-title">Loading report…</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Running state ─────────────────────────────────────────────────────────
    if (status === "running") {
        return (
            <>
                <style>{STYLES}</style>
                <div className="report-wrap">
                    <div className="report-inner">
                        <div className="report-state">
                            <div className="report-state-icon">🧠</div>
                            <div className="report-state-title">Asha is analysing your data…</div>
                            <div className="report-state-sub">
                                Running Beachhead Strategy analysis on your survey responses. This takes 10–20 seconds.
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (status === "error") {
        return (
            <>
                <style>{STYLES}</style>
                <div className="report-wrap">
                    <div className="report-inner">
                        <button className="report-back" onClick={() => navigate("/surveys")}>
                            ← Back to surveys
                        </button>
                        <div className="report-state">
                            <div className="report-state-icon">⚠️</div>
                            <div className="report-state-title">Analysis failed</div>
                            <div className="report-state-sub">{errorMsg}</div>
                            <button className="report-state-btn" onClick={handleReanalyse}>
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Done — render full report ─────────────────────────────────────────────
    if (status === "done" && analysis) {
        const verdict = analysis.final_recommendation?.verdict || "continue";
        const summary = analysis.summary || {};

        return (
            <>
                <style>{STYLES}</style>
                <div className="report-wrap">
                    <div className="report-inner">

                        {/* Back */}
                        <button className="report-back" onClick={() => navigate("/surveys")}>
                            ← Back to surveys
                        </button>

                        {/* Header */}
                        <div className="report-header">
                            <div className="report-badge">📊 Beachhead Strategy Report</div>
                            <div className="report-title">{survey?.title}</div>
                            <div className="report-meta">
                                Generated by Asha · {new Date().toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })}
                            </div>
                            <div className="report-stats">
                                <div className="report-stat">
                                    <div className="report-stat-value">{responseCount}</div>
                                    <div className="report-stat-label">Responses</div>
                                </div>
                                <div className="report-stat">
                                    <div className="report-stat-value">{(analysis.risk_assessment?.risks || []).length}</div>
                                    <div className="report-stat-label">Risks identified</div>
                                </div>
                                <div className="report-stat">
                                    <div className="report-stat-value" style={{ textTransform: "capitalize", color: verdict === "continue" ? "var(--emerald)" : verdict === "pivot" ? "var(--amber)" : "var(--red)" }}>
                                        {verdict}
                                    </div>
                                    <div className="report-stat-label">Verdict</div>
                                </div>
                            </div>
                        </div>

                        {/* Verdict Banner */}
                        <div className={`verdict-banner ${verdict}`}>
                            <div className="verdict-icon">{verdictIcon(verdict)}</div>
                            <div className="verdict-text-wrap">
                                <div className="verdict-label">Final verdict — {verdict}</div>
                                <div className="verdict-heading">{verdictHeading(verdict)}</div>
                                <div className="verdict-reasoning">{analysis.final_recommendation?.reasoning}</div>
                                {analysis.final_recommendation?.next_step && (
                                    <div className="verdict-next">
                                        <div className="verdict-next-label">Next 30 days →</div>
                                        {analysis.final_recommendation.next_step}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 1: Beachhead Customer + Core Problem */}
                        <div className="report-grid">
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">🎯</div>
                                    <div className="report-card-title">Beachhead Customer</div>
                                </div>
                                <div className="report-card-body">{analysis.beachhead_customer?.profile}</div>
                                {analysis.beachhead_customer?.why && (
                                    <div className="report-card-sub">{analysis.beachhead_customer.why}</div>
                                )}
                            </div>
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">🔥</div>
                                    <div className="report-card-title">Core Problem</div>
                                </div>
                                <div className="report-card-body">{analysis.core_problem?.statement}</div>
                                {analysis.core_problem?.evidence && (
                                    <div className="report-card-sub">"{analysis.core_problem.evidence}"</div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Recommended Solution + Competitive Advantage */}
                        <div className="report-grid">
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">💡</div>
                                    <div className="report-card-title">Recommended Solution</div>
                                </div>
                                <div className="report-card-body">{analysis.recommended_solution?.what_to_build}</div>
                                {analysis.recommended_solution?.rationale && (
                                    <div className="report-card-sub">{analysis.recommended_solution.rationale}</div>
                                )}
                            </div>
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">⚡</div>
                                    <div className="report-card-title">Competitive Advantage</div>
                                </div>
                                <div className="report-card-body">{analysis.competitive_advantage?.differentiator}</div>
                                {analysis.competitive_advantage?.moat && (
                                    <div className="report-card-sub">Moat: {analysis.competitive_advantage.moat}</div>
                                )}
                            </div>
                        </div>

                        {/* GTM Plan */}
                        <div className="report-section-label">Go-To-Market</div>
                        <div className="report-grid" style={{ marginBottom: 16 }}>
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">🚀</div>
                                    <div className="report-card-title">First 100 Customers</div>
                                </div>
                                <div className="report-card-body">{analysis.gtm_plan?.first_100_customers}</div>
                            </div>
                            <div className="report-card">
                                <div className="report-card-header">
                                    <div className="report-card-icon">📣</div>
                                    <div className="report-card-title">Channel & Hook</div>
                                </div>
                                <div className="report-card-body">
                                    <strong>Channel:</strong> {analysis.gtm_plan?.channel}
                                </div>
                                {analysis.gtm_plan?.hook && (
                                    <div className="report-card-sub">Hook: "{analysis.gtm_plan.hook}"</div>
                                )}
                            </div>
                        </div>

                        {/* Summary data */}
                        {(summary.top_pain_points?.length > 0 || summary.market_opportunities?.length > 0) && (
                            <>
                                <div className="report-section-label">Data Summary</div>
                                <div className="report-grid" style={{ marginBottom: 16 }}>
                                    {summary.top_pain_points?.length > 0 && (
                                        <div className="report-card">
                                            <div className="report-card-header">
                                                <div className="report-card-icon">😤</div>
                                                <div className="report-card-title">Top Pain Points</div>
                                            </div>
                                            <div className="report-tags">
                                                {summary.top_pain_points.map((p, i) => (
                                                    <span key={i} className="report-tag">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {summary.market_opportunities?.length > 0 && (
                                        <div className="report-card">
                                            <div className="report-card-header">
                                                <div className="report-card-icon">🌱</div>
                                                <div className="report-card-title">Market Opportunities</div>
                                            </div>
                                            <div className="report-tags">
                                                {summary.market_opportunities.map((o, i) => (
                                                    <span key={i} className="report-tag emerald">{o}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Competitor weaknesses + spending */}
                        {(summary.competitor_weaknesses?.length > 0 || summary.avg_spending) && (
                            <div className="report-grid" style={{ marginBottom: 16 }}>
                                {summary.competitor_weaknesses?.length > 0 && (
                                    <div className="report-card">
                                        <div className="report-card-header">
                                            <div className="report-card-icon">🔍</div>
                                            <div className="report-card-title">Competitor Weaknesses</div>
                                        </div>
                                        <div className="report-tags">
                                            {summary.competitor_weaknesses.map((w, i) => (
                                                <span key={i} className="report-tag violet">{w}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {summary.avg_spending && (
                                    <div className="report-card">
                                        <div className="report-card-header">
                                            <div className="report-card-icon">💰</div>
                                            <div className="report-card-title">Spending Pattern</div>
                                        </div>
                                        <div className="report-card-body">{summary.avg_spending}</div>
                                        {summary.primary_segment && (
                                            <div className="report-card-sub">Primary segment: {summary.primary_segment}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Risk Assessment */}
                        {(analysis.risk_assessment?.risks || []).length > 0 && (
                            <>
                                <div className="report-section-label">Risk Assessment</div>
                                <div className="report-card" style={{ marginBottom: 16 }}>
                                    <div className="report-card-header">
                                        <div className="report-card-icon">⚠️</div>
                                        <div className="report-card-title">Identified Risks</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {analysis.risk_assessment.risks.map((r, i) => (
                                            <div key={i} className="risk-row">
                                                <div className="risk-top">
                                                    <span className={`risk-severity ${r.severity || "medium"}`}>
                                                        {r.severity || "medium"}
                                                    </span>
                                                    <span className="risk-title">{r.risk}</span>
                                                </div>
                                                {r.mitigation && (
                                                    <div className="risk-mitigation">Mitigation: {r.mitigation}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Re-analyse button */}
                        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                            <button className="report-state-btn" onClick={handleReanalyse}>
                                🔄 Re-analyse with latest responses
                            </button>
                        </div>

                    </div>
                </div>
            </>
        );
    }

    return null;
}
