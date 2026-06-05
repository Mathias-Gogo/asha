import { useState } from "react";
import { supabase } from "../../lib/supabase";

const STYLES = `
  .ss-wrap {
    height: 100%;
    overflow-y: auto;
    padding: 28px;
    font-family: 'Montserrat', sans-serif;
  }

  .ss-inner { max-width: 780px; margin: 0 auto; }

  .ss-section { margin-bottom: 28px; }

  .ss-section-label {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }

  [data-theme="light"] .ss-section-label { color: rgba(0,0,0,0.3); }

  .ss-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.05);
  }

  [data-theme="light"] .ss-section-label::after { background: rgba(0,0,0,0.07); }

  .ss-card {
    background: #0f0f14;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; overflow: hidden;
  }

  [data-theme="light"] .ss-card {
    background: #ffffff;
    border-color: rgba(0,0,0,0.07);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .ss-row {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 14px 18px; gap: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  [data-theme="light"] .ss-row { border-bottom-color: rgba(0,0,0,0.05); }
  .ss-row:last-child { border-bottom: none; }

  .ss-row-label {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.6);
  }

  [data-theme="light"] .ss-row-label { color: rgba(0,0,0,0.6); }

  .ss-row-sub {
    font-size: 11px; color: rgba(255,255,255,0.2);
    margin-top: 2px; font-weight: 400;
  }

  [data-theme="light"] .ss-row-sub { color: rgba(0,0,0,0.3); }

  .ss-input {
    flex: 1; background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 7px 12px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.82); outline: none;
    transition: border-color 0.2s;
  }

  [data-theme="light"] .ss-input {
    background: #f8f8fc;
    border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.78);
  }

  .ss-input:focus { border-color: rgba(124,58,237,0.4); }

  /* Status toggle */
  .ss-status-toggle {
    display: flex;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; padding: 3px; gap: 3px;
  }

  [data-theme="light"] .ss-status-toggle {
    background: rgba(0,0,0,0.04);
    border-color: rgba(0,0,0,0.07);
  }

  .ss-status-opt {
    padding: 5px 14px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    color: rgba(255,255,255,0.25);
    font-family: 'Montserrat', sans-serif;
    border: none; background: transparent;
    letter-spacing: 0.03em;
  }

  [data-theme="light"] .ss-status-opt { color: rgba(0,0,0,0.3); }

  .ss-status-opt.active-draft {
    background: #1a1a22;
    color: rgba(255,255,255,0.7);
  }

  [data-theme="light"] .ss-status-opt.active-draft {
    background: #ffffff;
    color: rgba(0,0,0,0.7);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .ss-status-opt.active-live {
    background: rgba(74,222,128,0.12);
    color: #4ade80;
  }

  /* Link row */
  .ss-link-wrap {
    display: flex; align-items: center; gap: 8px;
  }

  .ss-link-val {
    flex: 1; font-size: 12px;
    color: rgba(255,255,255,0.35);
    font-weight: 400; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }

  [data-theme="light"] .ss-link-val { color: rgba(0,0,0,0.4); }

  .ss-copy-btn {
    padding: 5px 12px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.4);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
    letter-spacing: 0.03em;
  }

  [data-theme="light"] .ss-copy-btn {
    border-color: rgba(0,0,0,0.08);
    color: rgba(0,0,0,0.4);
  }

  .ss-copy-btn:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
  .ss-copy-btn.copied { color: #6ee7b7; border-color: rgba(110,231,183,0.25); }

  /* Save row */
  .ss-save-row {
    display: flex; align-items: center;
    justify-content: flex-end; gap: 10px;
    margin-top: 20px;
  }

  .ss-saved-msg {
    font-size: 11px; font-weight: 600;
    color: #6ee7b7; letter-spacing: 0.04em;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .ss-save-btn {
    padding: 8px 20px; border-radius: 8px;
    border: none; background: #7c3aed; color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.06em;
    box-shadow: 0 2px 10px rgba(124,58,237,0.3);
  }

  .ss-save-btn:hover:not(:disabled) { background: #6d28d9; }
  .ss-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Danger */
  .ss-danger-card {
    background: rgba(239,68,68,0.04);
    border: 1px solid rgba(239,68,68,0.1);
    border-radius: 12px; padding: 16px 18px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px;
  }

  .ss-danger-label {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.5);
  }

  [data-theme="light"] .ss-danger-label { color: rgba(0,0,0,0.55); }

  .ss-danger-sub {
    font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 2px;
  }

  [data-theme="light"] .ss-danger-sub { color: rgba(0,0,0,0.3); }

  .ss-delete-btn {
    background: transparent;
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px; padding: 7px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700;
    color: rgba(239,68,68,0.6); cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .ss-delete-btn:hover {
    background: rgba(239,68,68,0.08);
    border-color: rgba(239,68,68,0.45);
    color: #fca5a5;
  }

  /* Confirm delete */
  .ss-confirm-wrap {
    display: flex; flex-direction: column; gap: 10px;
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: 10px; padding: 14px 16px;
  }

  .ss-confirm-text {
    font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5;
  }

  [data-theme="light"] .ss-confirm-text { color: rgba(0,0,0,0.5); }

  .ss-confirm-actions { display: flex; gap: 8px; }

  .ss-confirm-cancel {
    padding: 6px 16px; border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; color: rgba(255,255,255,0.4);
    font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }

  [data-theme="light"] .ss-confirm-cancel {
    border-color: rgba(0,0,0,0.1);
    color: rgba(0,0,0,0.4);
  }

  .ss-confirm-delete {
    padding: 6px 16px; border-radius: 7px;
    border: none; background: rgba(239,68,68,0.7);
    color: white; font-family: 'Montserrat', sans-serif;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: background 0.15s;
  }

  .ss-confirm-delete:hover { background: #ef4444; }
  .ss-confirm-delete:disabled { opacity: 0.4; cursor: not-allowed; }
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
    setTimeout(() => setCopied(false), 2000);
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
    // Delete responses first
    await supabase.from("survey_responses").delete().eq("survey_id", survey.id);
    // Then delete survey
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
                  style={{ maxWidth: 220 }}
                />
              </div>
              <div className="ss-row">
                <div>
                  <div className="ss-row-label">Status</div>
                  <div className="ss-row-sub">Live surveys accept responses</div>
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
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="ss-save-row">
            {saved && <span className="ss-saved-msg">✓ Saved</span>}
            <button className="ss-save-btn" onClick={saveSettings} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* ── Danger ── */}
          <div className="ss-section" style={{ marginTop: 32 }}>
            <div className="ss-section-label">Danger zone</div>
            {confirmDelete ? (
              <div className="ss-confirm-wrap">
                <div className="ss-confirm-text">
                  This will permanently delete the survey and all its responses. This cannot be undone.
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