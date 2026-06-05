import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₦0",
        period: "/mo",
        features: ["20 chats / day", "No memory", "No surveys", "Basic context"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "₦5,600",
        period: "/mo",
        featured: true,
        features: ["200 chats / day", "Memory", "5 surveys / mo", "Medium RAG"],
    },
    {
        id: "growth",
        name: "Growth",
        price: "₦25,000",
        period: "/mo",
        features: ["2000 chats / day", "Full memory", "Unlimited surveys", "Deep RAG"],
    },
];

const QUESTIONS = {
    free: [
        { id: "founder_name", label: "01 — Identity", question: "What's your name?", type: "text", placeholder: "e.g. Mathias Gogo" },
        { id: "business_name", label: "02 — Your venture", question: "What's your business called?", type: "text", placeholder: "e.g. Mexuri" },
        { id: "business_desc", label: "03 — The vision", question: "What does your business do?", type: "textarea", placeholder: "Describe your business in a few sentences..." },
        { id: "sector_stage", label: "04 — Context", question: "What sector are you in, and what stage is your business?", type: "dual", placeholder1: "Sector — e.g. Fintech, Edtech, Logistics", placeholder2: "Stage — Idea / MVP / Growth / Scaling" },
    ],
    pro: [
        { id: "founder_name", label: "01 — Identity", question: "What's your name?", type: "text", placeholder: "e.g. Mathias Gogo" },
        { id: "business_name", label: "02 — Your venture", question: "What's your business called?", type: "text", placeholder: "e.g. Mexuri" },
        { id: "business_desc", label: "03 — The vision", question: "What does your business do?", type: "textarea", placeholder: "Describe your business in a few sentences..." },
        { id: "sector_stage", label: "04 — Context", question: "What sector are you in, and what stage is your business?", type: "dual", placeholder1: "Sector — e.g. Fintech, Edtech, Logistics", placeholder2: "Stage — Idea / MVP / Growth / Scaling" },
        { id: "target_customer", label: "05 — Your people", question: "Who is your target customer?", type: "textarea", placeholder: "Describe who you're building for..." },
        { id: "problem", label: "06 — The problem", question: "What problem are you solving, and for who?", type: "textarea", placeholder: "Be as specific as possible..." },
    ],
    growth: [
        { id: "founder_name", label: "01 — Identity", question: "What's your name?", type: "text", placeholder: "e.g. Mathias Gogo" },
        { id: "business_name", label: "02 — Your venture", question: "What's your business called?", type: "text", placeholder: "e.g. Mexuri" },
        { id: "business_desc", label: "03 — The vision", question: "What does your business do?", type: "textarea", placeholder: "Describe your business in a few sentences..." },
        { id: "sector_stage", label: "04 — Context", question: "What sector are you in, and what stage is your business?", type: "dual", placeholder1: "Sector — e.g. Fintech, Edtech, Logistics", placeholder2: "Stage — Idea / MVP / Growth / Scaling" },
        { id: "target_customer", label: "05 — Your people", question: "Who is your target customer?", type: "textarea", placeholder: "Describe who you're building for..." },
        { id: "problem", label: "06 — The problem", question: "What problem are you solving, and for who?", type: "textarea", placeholder: "Be as specific as possible..." },
        { id: "revenue_model", label: "07 — The model", question: "What's your revenue model or monetization plan?", type: "textarea", placeholder: "e.g. SaaS subscription, marketplace commission..." },
        { id: "competition", label: "08 — The landscape", question: "Who are your main competitors, and what makes you different?", type: "textarea", placeholder: "Name them and explain your edge..." },
    ],
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06060a; }

  .ob-wrap {
    min-height: 100vh;
    background: #06060a;
    font-family: 'Montserrat', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  /* ── Atmospheric background ── */
  .ob-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
  }

  .ob-bg::before {
    content: '';
    position: absolute;
    width: 800px; height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%);
    top: -300px; left: -200px;
    filter: blur(80px);
  }

  .ob-bg::after {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%);
    bottom: -200px; right: -100px;
    filter: blur(80px);
  }

  /* Subtle grid texture */
  .ob-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* ── Progress bar ── */
  .ob-progress-wrap {
    position: fixed; top: 0; left: 0; right: 0;
    height: 2px; background: rgba(255,255,255,0.04); z-index: 100;
  }

  .ob-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #38bdf8);
    transition: width 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    position: relative;
  }

  .ob-progress-bar::after {
    content: '';
    position: absolute;
    right: 0; top: 50%;
    transform: translateY(-50%);
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
  }

  /* ── Header ── */
  .ob-header {
    position: fixed; top: 0; left: 0; right: 0;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; z-index: 99;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    backdrop-filter: blur(12px);
    background: rgba(6,6,10,0.7);
  }

  .ob-logo {
    display: flex; align-items: center; gap: 10px;
  }

  .ob-logo-mark {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: white;
    letter-spacing: -0.5px;
  }

  .ob-logo-name {
    font-size: 15px; font-weight: 700;
    color: rgba(255,255,255,0.8);
    letter-spacing: -0.03em;
  }

  .ob-logo-by {
    font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.08em; text-transform: uppercase;
  }

  .ob-header-right {
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.15);
    letter-spacing: 0.08em; text-transform: uppercase;
  }

  /* ── Main content ── */
  .ob-content {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 100px 24px 60px;
    width: 100%; min-height: 100vh;
    position: relative; z-index: 2;
  }

  /* ── Step indicator ── */
  .ob-step-indicator {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 32px;
  }

  .ob-step-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.1);
    transition: all 0.3s ease;
  }

  .ob-step-dot.active {
    background: #7c3aed;
    width: 20px; border-radius: 3px;
    box-shadow: 0 0 8px rgba(124,58,237,0.6);
  }

  .ob-step-dot.done {
    background: rgba(124,58,237,0.4);
  }

  /* ── Card ── */
  .ob-card {
    width: 100%;
    background: rgba(15,15,20,0.9);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 40px 40px 36px;
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
  }

  .ob-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(56,189,248,0.4), transparent);
  }

  /* ── Question ── */
  .ob-q-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(124,58,237,0.8);
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }

  .ob-q-label::after {
    content: '';
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(124,58,237,0.3), transparent);
  }

  .ob-q-text {
    font-size: 24px; font-weight: 700;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.03em;
    line-height: 1.25; margin-bottom: 28px;
  }

  /* ── Inputs ── */
  .ob-input {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 14px 18px;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px; font-weight: 400;
    color: rgba(255,255,255,0.85);
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .ob-input:focus {
    border-color: rgba(124,58,237,0.5);
    background: rgba(124,58,237,0.04);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
  }

  .ob-input::placeholder { color: rgba(255,255,255,0.15); font-weight: 400; }

  textarea.ob-input {
    resize: none; min-height: 130px;
    line-height: 1.7;
  }

  .ob-dual { display: flex; flex-direction: column; gap: 10px; }

  /* ── Navigation ── */
  .ob-nav {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 28px; padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .ob-back {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 9px; padding: 10px 20px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.25); cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    display: flex; align-items: center; gap: 7px;
  }

  .ob-back:hover {
    border-color: rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.55);
    background: rgba(255,255,255,0.03);
  }

  .ob-continue {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    border: none; border-radius: 9px;
    padding: 11px 28px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700;
    color: white; cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.06em; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    position: relative; overflow: hidden;
  }

  .ob-continue::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0; transition: opacity 0.2s;
  }

  .ob-continue:hover:not(:disabled)::before { opacity: 1; }
  .ob-continue:hover:not(:disabled) { box-shadow: 0 6px 28px rgba(124,58,237,0.5); transform: translateY(-1px); }
  .ob-continue:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Plan cards ── */
  .ob-plans {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px; margin-bottom: 4px;
  }

  .ob-plan-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 20px 16px;
    cursor: pointer; transition: all 0.25s;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }

  .ob-plan-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(124,58,237,0.06), transparent);
    opacity: 0; transition: opacity 0.25s;
  }

  .ob-plan-card:hover::before { opacity: 1; }
  .ob-plan-card:hover { border-color: rgba(124,58,237,0.25); }

  .ob-plan-card.selected {
    border-color: rgba(124,58,237,0.6);
    background: rgba(124,58,237,0.07);
    box-shadow: 0 0 0 1px rgba(124,58,237,0.2), 0 8px 32px rgba(124,58,237,0.15);
  }

  .ob-plan-card.selected::before { opacity: 1; }

  .ob-plan-badge {
    display: inline-flex; align-items: center;
    padding: 3px 8px;
    background: rgba(124,58,237,0.2);
    border: 1px solid rgba(124,58,237,0.35);
    border-radius: 100px;
    font-size: 9px; font-weight: 700;
    color: #a78bfa;
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 10px; width: fit-content;
  }

  .ob-plan-name {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px;
  }

  .ob-plan-card.selected .ob-plan-name { color: #a78bfa; }

  .ob-plan-price {
    font-size: 20px; font-weight: 800;
    color: rgba(255,255,255,0.85);
    letter-spacing: -0.03em;
    margin-bottom: 14px;
    line-height: 1;
  }

  .ob-plan-price sub {
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.2);
    vertical-align: baseline;
  }

  .ob-plan-divider {
    height: 1px; background: rgba(255,255,255,0.06);
    margin-bottom: 12px;
  }

  .ob-plan-feat {
    display: flex; flex-direction: column; gap: 6px;
  }

  .ob-plan-feat-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; color: rgba(255,255,255,0.3);
    line-height: 1.4; font-weight: 500;
  }

  .ob-plan-card.selected .ob-plan-feat-item { color: rgba(255,255,255,0.55); }

  .ob-plan-feat-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.15); flex-shrink: 0;
  }

  .ob-plan-card.selected .ob-plan-feat-dot { background: #7c3aed; }

  /* ── Selected checkmark ── */
  .ob-plan-check {
    position: absolute; top: 12px; right: 12px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #7c3aed;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(0.6);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .ob-plan-card.selected .ob-plan-check {
    opacity: 1; transform: scale(1);
  }

  /* ── Done screen ── */
  .ob-done {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    padding: 8px 0 4px;
  }

  .ob-done-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #7c3aed, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; color: white;
    margin-bottom: 24px;
    box-shadow: 0 8px 40px rgba(124,58,237,0.4);
    letter-spacing: -1px;
  }

  .ob-done-eyebrow {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(124,58,237,0.7); margin-bottom: 10px;
  }

  .ob-done-title {
    font-size: 28px; font-weight: 800;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.04em;
    line-height: 1.15; margin-bottom: 12px;
  }

  .ob-done-title em {
    font-style: normal;
    background: linear-gradient(135deg, #a78bfa, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ob-done-sub {
    font-size: 14px; color: rgba(255,255,255,0.3);
    line-height: 1.7; max-width: 300px; font-weight: 400;
    margin-bottom: 32px;
  }

  .ob-done-btn {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    border: none; border-radius: 10px;
    padding: 14px 44px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 700;
    color: white; cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.08em; text-transform: uppercase;
    box-shadow: 0 4px 24px rgba(124,58,237,0.4);
  }

  .ob-done-btn:hover:not(:disabled) {
    box-shadow: 0 8px 32px rgba(124,58,237,0.55);
    transform: translateY(-2px);
  }

  .ob-done-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  .ob-error {
    font-size: 12px; color: #fca5a5;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: 8px; padding: 11px 16px;
    margin-bottom: 16px; text-align: center;
    width: 100%; font-weight: 500;
  }

  /* ── Plan note ── */
  .ob-plan-note {
    font-size: 11px; color: rgba(255,255,255,0.15);
    text-align: center; margin-top: 14px; font-weight: 500;
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .ob-card { padding: 28px 22px 24px; border-radius: 16px; }
    .ob-q-text { font-size: 20px; }
    .ob-plans { grid-template-columns: 1fr; gap: 8px; }
    .ob-content { padding: 90px 16px 40px; }
  }
`;

const slideVariants = {
    enter: (dir) => ({
        x: dir > 0 ? "55%" : "-55%",
        opacity: 0,
        filter: "blur(4px)",
    }),
    center: {
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.38, ease: [0.32, 0.72, 0, 1] },
    },
    exit: (dir) => ({
        x: dir > 0 ? "-55%" : "55%",
        opacity: 0,
        filter: "blur(4px)",
        transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
    }),
};

const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, fetchProfile } = useAuth();

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState("pro");
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const questions = QUESTIONS[selectedPlan] || QUESTIONS.free;
    const totalDots = questions.length + 2; // plan step + questions + done
    const isDone = step === "done";

    const progressPct = step === 0
        ? 4
        : step === "done"
            ? 100
            : Math.round((step / questions.length) * 92) + 4;

    const currentQ = step > 0 && step <= questions.length ? questions[step - 1] : null;

    const canContinue = () => {
        if (step === 0) return true;
        if (!currentQ) return true;
        if (currentQ.type === "dual") {
            return !!(answers[currentQ.id + "_sector"]?.trim() && answers[currentQ.id + "_stage"]?.trim());
        }
        return !!(answers[currentQ.id]?.trim());
    };

    const goNext = () => {
        if (!canContinue()) return;
        setDirection(1);
        if (step === questions.length) setStep("done");
        else setStep(s => s + 1);
    };

    const goBack = () => {
        setDirection(-1);
        if (step === "done") { setStep(questions.length); return; }
        if (step === 0) return;
        setStep(s => s - 1);
    };

    const handleAnswer = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    founder_name: answers.founder_name || null,
                    business_name: answers.business_name || null,
                    business_sector: answers.sector_stage_sector || null,
                    business_stage: answers.sector_stage_stage || null,
                    plan: selectedPlan,
                    onboarded: true,
                })
                .eq("id", user.id);

            if (profileError) throw profileError;

            const chunks = [];
            if (answers.founder_name) chunks.push(`Founder name: ${answers.founder_name}`);
            if (answers.business_name) chunks.push(`Business name: ${answers.business_name}`);
            if (answers.business_desc) chunks.push(`Business description: ${answers.business_desc}`);
            if (answers.sector_stage_sector || answers.sector_stage_stage)
                chunks.push(`Sector: ${answers.sector_stage_sector || ""}. Stage: ${answers.sector_stage_stage || ""}`);
            if (answers.target_customer) chunks.push(`Target customer: ${answers.target_customer}`);
            if (answers.problem) chunks.push(`Problem being solved: ${answers.problem}`);
            if (answers.revenue_model) chunks.push(`Revenue model: ${answers.revenue_model}`);
            if (answers.competition) chunks.push(`Competitors and differentiation: ${answers.competition}`);

            if (chunks.length > 0) {
                const { error: dataError } = await supabase
                    .from("business_data")
                    .insert(chunks.map(content => ({ user_id: user.id, content, source: "onboarding", parent_id: null })));
                if (dataError) throw dataError;
            }

            await fetchProfile(user.id);
            navigate("/", { replace: true });
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Build dot states
    const dotStates = Array.from({ length: totalDots }, (_, i) => {
        const stepNum = i; // 0 = plan, 1..n = questions, n+1 = done
        const currentNum = isDone ? totalDots - 1 : step;
        if (stepNum === currentNum) return "active";
        if (stepNum < currentNum) return "done";
        return "idle";
    });

    const stepKey = isDone ? "done" : step;
    const firstName = answers.founder_name?.split(" ")[0] || "founder";

    return (
        <>
            <style>{STYLES}</style>
            <div className="ob-wrap">
                <div className="ob-bg" />
                <div className="ob-grid" />

                {/* Progress */}
                <div className="ob-progress-wrap">
                    <div className="ob-progress-bar" style={{ width: `${progressPct}%` }} />
                </div>

                {/* Header */}
                <div className="ob-header">
                    <div className="ob-logo">
                        <div className="ob-logo-mark">A</div>
                        <div>
                            <div className="ob-logo-name">Asha</div>
                            <div className="ob-logo-by">by Mexuri</div>
                        </div>
                    </div>
                    {!isDone && (
                        <div className="ob-header-right">
                            {step === 0 ? "Choose plan" : `${step} of ${questions.length}`}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="ob-content">

                    {/* Step dots */}
                    <div className="ob-step-indicator">
                        {dotStates.map((state, i) => (
                            <div key={i} className={`ob-step-dot ${state}`} />
                        ))}
                    </div>

                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={stepKey}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            style={{ width: "100%", maxWidth: 780 }}
                        >

                            {/* ── Plan selection ── */}
                            {step === 0 && (
                                <div className="ob-card">
                                    <div className="ob-q-label">Getting started</div>
                                    <div className="ob-q-text">Choose how you want to use Asha.</div>
                                    <div className="ob-plans">
                                        {PLANS.map(plan => (
                                            <div
                                                key={plan.id}
                                                className={`ob-plan-card ${selectedPlan === plan.id ? "selected" : ""}`}
                                                onClick={() => setSelectedPlan(plan.id)}
                                            >
                                                <div className="ob-plan-check"><CheckIcon /></div>
                                                {plan.featured && <div className="ob-plan-badge">Most popular</div>}
                                                <div className="ob-plan-name">{plan.name}</div>
                                                <div className="ob-plan-price">
                                                    {plan.price}<sub>{plan.period}</sub>
                                                </div>
                                                <div className="ob-plan-divider" />
                                                <div className="ob-plan-feat">
                                                    {plan.features.map(f => (
                                                        <div key={f} className="ob-plan-feat-item">
                                                            <div className="ob-plan-feat-dot" />
                                                            {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ob-plan-note">You can upgrade or change your plan anytime.</div>
                                    <div className="ob-nav">
                                        <div />
                                        <button className="ob-continue" onClick={goNext}>
                                            Continue <span style={{ fontSize: 14 }}>→</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Question steps ── */}
                            {step > 0 && step <= questions.length && currentQ && (
                                <div className="ob-card">
                                    <div className="ob-q-label">{currentQ.label}</div>
                                    <div className="ob-q-text">{currentQ.question}</div>

                                    {currentQ.type === "text" && (
                                        <input
                                            className="ob-input"
                                            type="text"
                                            placeholder={currentQ.placeholder}
                                            value={answers[currentQ.id] || ""}
                                            onChange={e => handleAnswer(currentQ.id, e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") goNext(); }}
                                            autoFocus
                                        />
                                    )}

                                    {currentQ.type === "textarea" && (
                                        <textarea
                                            className="ob-input"
                                            placeholder={currentQ.placeholder}
                                            value={answers[currentQ.id] || ""}
                                            onChange={e => handleAnswer(currentQ.id, e.target.value)}
                                            autoFocus
                                        />
                                    )}

                                    {currentQ.type === "dual" && (
                                        <div className="ob-dual">
                                            <input
                                                className="ob-input"
                                                type="text"
                                                placeholder={currentQ.placeholder1}
                                                value={answers[currentQ.id + "_sector"] || ""}
                                                onChange={e => handleAnswer(currentQ.id + "_sector", e.target.value)}
                                                autoFocus
                                            />
                                            <input
                                                className="ob-input"
                                                type="text"
                                                placeholder={currentQ.placeholder2}
                                                value={answers[currentQ.id + "_stage"] || ""}
                                                onChange={e => handleAnswer(currentQ.id + "_stage", e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="ob-nav">
                                        <button className="ob-back" onClick={goBack}>
                                            <span style={{ fontSize: 13 }}>←</span> Back
                                        </button>
                                        <button className="ob-continue" onClick={goNext} disabled={!canContinue()}>
                                            {step === questions.length ? "Finish" : "Continue"}
                                            <span style={{ fontSize: 14 }}>→</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Done ── */}
                            {isDone && (
                                <div className="ob-card">
                                    <div className="ob-done">
                                        <div className="ob-done-icon">A</div>
                                        <div className="ob-done-eyebrow">Setup complete</div>
                                        <div className="ob-done-title">
                                            You're all set,<br />
                                            <em>{firstName}.</em>
                                        </div>
                                        <div className="ob-done-sub">
                                            Asha knows your business now. Let's validate ideas, research markets, and build something great.
                                        </div>
                                        {error && <div className="ob-error">{error}</div>}
                                        <button className="ob-done-btn" onClick={handleSave} disabled={saving}>
                                            {saving ? "Setting up…" : "Enter Asha →"}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}