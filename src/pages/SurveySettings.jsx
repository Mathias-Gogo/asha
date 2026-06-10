import { useState } from "react";
import { supabase } from "../../lib/supabase";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

  .ss-wrap {
    height: 100%;
    overflow-y: auto;
    padding: 32px 28px 80px;
    font-family: 'Montserrat', sans-serif;
    background: transparent;
    position: relative;
  }

  .ss-wrap::-webkit-scrollbar { width: 3px; }
  .ss-wrap::-webkit-scrollbar-track { background: transparent; }
  .ss-wrap::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(124,58,237,0.35), rgba(0,229,255,0.18));
    border-radius: 3px;
  }

  .ss-inner { max-width: 660px; margin: 0 auto; }

  /* ── Section ── */
  .ss-section { margin-bottom: 32px; }

  .ss-section-label {
    font-size: 9px; font-weight: 800;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(255,255,255,0.18);
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
  }

  [data-theme="light"] .ss-section-label { color: rgba(0,0,0,0.26); }

  .ss-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.06), transparent);
  }

  [data-theme="light"] .ss-section-label::after {
    background: linear-gradient(to right, rgba(0,0,0,0.07), transparent);
  }

  /* ── Card ── */
  .ss-card {
    background: rgba(255,255,255,0.032);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; overflow: hidden;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.18),
                inset 0 1px 0 rgba(255,255,255,0.045);
    position: relative;
  }

  /* Shimmer top line */
  .ss-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(124,58,237,0.38) 35%,
      rgba(0,229,255,0.22) 65%,
      transparent 100%);
  }

  [data-theme="light"] .ss-card {
    background: rgba(255,255,255,0.86);
    border-color: rgba(0,0,0,0.07);
    box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  }

  [data-theme="light"] .ss-card::before {
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.22), transparent);
  }

  /* ── Row ── */
  .ss-row {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 16px 20px; gap: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.045);
    transition: background 0.15s;
  }

  [data-theme="light"] .ss-row { border-bottom-color: rgba(0,0,0,0.05); }
  .ss-row:last-child { border-bottom: none; }
  .ss-row:hover { background: rgba(124,58,237,0.03); }

  .ss-row-label {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.62);
  }

  [data-theme="light"] .ss-row-label { color: rgba(0,0,0,0.62); }

  .ss-row-sub {
    font-size: 11px; color: rgba(255,255,255,0.22);
    margin-top: 3px; font-weight: 400; line-height: 1.5;
  }

  [data-theme="light"] .ss-row-sub { color: rgba(0,0,0,0.32); }

  /* ── Input ── */
  .ss-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 9px 14px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.88);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  [data-theme="light"] .ss-input {
    background: rgba(0,0,0,0.025);
    border-color: rgba(0,0,0,0.09);
    color: rgba(0,0,0,0.82);
  }

  .ss-input:focus {
    border-color: rgba(124,58,237,0.48);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.09);
    background: rgba(124,58,237,0.04);
  }

  [data-theme="light"] .ss-input:focus {
    border-color: rgba(124,58,237,0.42);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.06);
  }

  .ss-input::placeholder { color: rgba(255,255,255,0.18); }
  [data-theme="light"] .ss-input::placeholder { color: rgba(0,0,0,0.22); }

  /* ── Status toggle ── */
  .ss-status-toggle {
    display: flex;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 3px; gap: 3px;
    flex-shrink: 0;
  }

  [data-theme="light"] .ss-status-toggle {
    background: rgba(0,0,0,0.04);
    border-color: rgba(0,0,0,0.08);
  }

  .ss-status-opt {
    padding: 7px 18px; border-radius: 7px;
    font-size: 11px; font-weight: 700;
    cursor: pointer; transition: all 0.18s;
    color: rgba(255,255,255,0.25);
    font-family: 'Montserrat', sans-serif;
    border: none; background: transparent;
    letter-spacing: 0.04em;
  }

  [data-theme="light"] .ss-status-opt { color: rgba(0,0,0,0.28); }

  .ss-status-opt.active-draft {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.72);
    border: 1px solid rgba(255,255,255,0.10);
  }

  [data-theme="light"] .ss-status-opt.active-draft {
    background: #ffffff;
    color: rgba(0,0,0,0.72);
    box-shadow: 0 1px 4px rgba(0,0,0,0.10);
    border: 1px solid rgba(0,0,0,0.06);
  }

  .ss-status-opt.active-live {
    background: rgba(74,222,128,0.14);
    color: #4ade80;
    border: 1px solid rgba(74,222,128,0.25);
    box-shadow: 0 0 12px rgba(74,222,128,0.12);
  }

  /* ── Link row ── */
  .ss-link-wrap {
    display: flex; align-items: center; gap: 8px;
    flex: 1; min-width: 0;
  }

  .ss-link-val {
    flex: 1; font-size: 11.5px;
    color: rgba(255,255,255,0.32);
    font-weight: 400; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  [data-theme="light"] .ss-link-val { color: rgba(0,0,0,0.38); }

  .ss-copy-btn {
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.09);
    background: transparent; color: rgba(255,255,255,0.38);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.18s; white-space: nowrap;
    letter-spacing: 0.04em;
  }

  [data-theme="light"] .ss-copy-btn {
    border-color: rgba(0,0,0,0.09);
    color: rgba(0,0,0,0.42);
  }

  .ss-copy-btn:hover {
    border-color: rgba(0,229,255,0.30);
    color: rgba(0,229,255,0.80);
    background: rgba(0,229,255,0.06);
    box-shadow: 0 0 10px rgba(0,229,255,0.08);
  }

  .ss-copy-btn.copied {
    color: #34d399;
    border-color: rgba(52,211,153,0.28);
    background: rgba(52,211,153,0.06);
  }

  /* ── Save row ── */
  .ss-save-row {
    display: flex; align-items: center;
    justify-content: flex-end; gap: 12px;
    margin-top: 22px;
  }

  .ss-saved-msg {
    font-size: 11px; font-weight: 700;
    color: #34d399; letter-spacing: 0.05em;
    animation: ssFadeIn 0.3s ease;
    display: flex; align-items: center; gap: 4px;
  }

  @keyframes ssFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ss-save-btn {
    padding: 9px 22px; border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35),
                0 0 0 1px rgba(124,58,237,0.18);
  }

  .ss-save-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    box-shadow: 0 6px 24px rgba(124,58,237,0.52),
                0 0 0 1px rgba(124,58,237,0.28);
    transform: translateY(-1px);
  }

  .ss-save-btn:disabled { opacity: 0.32; cursor: not-allowed; transform: none; }

  /* ── Danger zone ── */
  .ss-danger-card {
    background: rgba(239,68,68,0.045);
    border: 1px solid rgba(239,68,68,0.12);
    border-radius: 16px; padding: 18px 22px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
    backdrop-filter: blur(12px);
    position: relative; overflow: hidden;
  }

  .ss-danger-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(239,68,68,0.28), transparent);
  }

  .ss-danger-label {
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.55);
  }

  [data-theme="light"] .ss-danger-label { color: rgba(0,0,0,0.58); }

  .ss-danger-sub {
    font-size: 11px; color: rgba(255,255,255,0.22);
    margin-top: 3px; line-height: 1.5;
  }

  [data-theme="light"] .ss-danger-sub { color: rgba(0,0,0,0.32); }

  .ss-delete-btn {
    background: transparent;
    border: 1px solid rgba(239,68,68,0.28);
    border-radius: 10px; padding: 8px 18px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    color: rgba(239,68,68,0.65); cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .ss-delete-btn:hover {
    background: rgba(239,68,68,0.10);
    border-color: rgba(239,68,68,0.50);
    color: #fca5a5;
    box-shadow: 0 0 16px rgba(239,68,68,0.12);
  }

  /* ── Confirm delete ── */
  .ss-confirm-wrap {
    display: flex; flex-direction: column; gap: 12px;
    background: rgba(239,68,68,0.055);
    border: 1px solid rgba(239,68,68,0.16);
    border-radius: 16px; padding: 18px 20px;
    position: relative; overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .ss-confirm-wrap::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(239,68,68,0.32), transparent);
  }

  .ss-confirm-title {
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.72); letter-spacing: -0.01em;
  }

  [data-theme="light"] .ss-confirm-title { color: rgba(0,0,0,0.72); }

  .ss-confirm-text {
    font-size: 12px; color: rgba(255,255,255,0.40); line-height: 1.6;
  }

  [data-theme="light"] .ss-confirm-text { color: rgba(0,0,0,0.48); }

  .ss-confirm-actions { display: flex; gap: 8px; }

  .ss-confirm-cancel {
    padding: 8px 18px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.09);
    background: transparent; color: rgba(255,255,255,0.42);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  [data-theme="light"] .ss-confirm-cancel {
    border-color: rgba(0,0,0,0.10);
    color: rgba(0,0,0,0.42);
  }

  .ss-confirm-cancel:hover {
    border-color: rgba(255,255,255,0.20);
    color: rgba(255,255,255,0.72);
    background: rgba(255,255,255,0.04);
  }

  .ss-confirm-delete {
    padding: 8px 18px; border-radius: 9px;
    border: none;
    background: rgba(239,68,68,0.75);
    color: white; font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.18s; letter-spacing: 0.04em;
    box-shadow: 0 2px 14px rgba(239,68,68,0.28);
  }

  .ss-confirm-delete:hover:not(:disabled) {
    background: #ef4444;
    box-shadow: 0 4px 20px rgba(239,68,68,0.42);
    transform: translateY(-1px);
  }

  .ss-confirm-delete:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

  @media (max-width: 600px) {
    .ss-wrap { padding: 20px 14px 60px; }
    .ss-row { flex-direction: column; align-items: flex-start; gap: 10px; }
    .ss-row-label { font-size: 12px; }
    .ss-input { width: 100%; }
    .ss-status-toggle { align-self: flex-start; }
    .ss-link-wrap { width: 100%; }
  }
`;

export default function SurveySettings({ survey, onUpdate, onDelete }) {
  const [title, setTitle] = useState(survey.title || "");
  const [isActive, setIsActive] = useState(survey.is_active || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const surveyLink = `${window.location.origin}/s/${survey.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(surveyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("surveys")
      .update({ title, is_active: isActive })
      .eq("id", survey.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdate();
    }
    setSaving(false);
  };

  const deleteSurvey = async () => {
    setDeleting(true);
    await supabase.from("survey_responses").delete().eq("survey_id", survey.id);
    const { error } = await supabase.from("surveys").delete().eq("id", survey.id);
    if (!error) onDelete();
    setDeleting(false);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ss-wrap">
        <div className="ss-inner">

          {/* ── General ── */}
          <div className="ss-section">
            <div className="ss-section-label">General</div>
            <div className="ss-card">
              <div className="ss-row">
                <div>
                  <div className="ss-row-label">Title</div>
                  <div className="ss-row-sub">Shown in your dashboard and to respondents</div>
                </div>
                <input
                  className="ss-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Survey title"
                  style={{ maxWidth: 240 }}
                />
              </div>
              <div className="ss-row">
                <div>
                  <div className="ss-row-label">Status</div>
                  <div className="ss-row-sub">Live surveys accept new responses</div>
                </div>
                <div className="ss-status-toggle">
                  <button
                    className={`ss-status-opt ${!isActive ? "active-draft" : ""}`}
                    onClick={() => setIsActive(false)}
                  >
                    Draft
                  </button>
                  <button
                    className={`ss-status-opt ${isActive ? "active-live" : ""}`}
                    onClick={() => setIsActive(true)}
                  >
                    Live
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Share ── */}
          <div className="ss-section">
            <div className="ss-section-label">Share</div>
            <div className="ss-card">
              <div className="ss-row">
                <div>
                  <div className="ss-row-label">Survey link</div>
                  <div className="ss-row-sub">Share this with your target audience</div>
                </div>
                <div className="ss-link-wrap">
                  <div className="ss-link-val">{surveyLink}</div>
                  <button
                    className={`ss-copy-btn ${copied ? "copied" : ""}`}
                    onClick={copyLink}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Save ── */}
          <div className="ss-save-row">
            {saved && <span className="ss-saved-msg">✓ Saved</span>}
            <button className="ss-save-btn" onClick={saveSettings} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* ── Danger zone ── */}
          <div className="ss-section" style={{ marginTop: 36 }}>
            <div className="ss-section-label">Danger zone</div>
            {confirmDelete ? (
              <div className="ss-confirm-wrap">
                <div className="ss-confirm-title">Delete this survey?</div>
                <div className="ss-confirm-text">
                  This will permanently remove the survey and all its responses. This action cannot be undone.
                </div>
                <div className="ss-confirm-actions">
                  <button className="ss-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                  <button
                    className="ss-confirm-delete"
                    onClick={deleteSurvey}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Yes, delete survey"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="ss-danger-card">
                <div>
                  <div className="ss-danger-label">Delete survey</div>
                  <div className="ss-danger-sub">
                    Permanently removes this survey and all responses.
                  </div>
                </div>
                <button className="ss-delete-btn" onClick={() => setConfirmDelete(true)}>
                  Delete
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
