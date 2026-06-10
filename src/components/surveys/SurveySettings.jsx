import { useState } from "react";
import { supabase } from "../../lib/supabase";

const STYLES = `
  :root {
    --bg: #f5f7ff; --surface: #ffffff; --surface-2: #f0f2ff;
    --fg: #111827; --fg-2: #6b7280; --fg-3: #9ca3af;
    --border: rgba(0,0,0,0.07); --orange: #ff6b35;
    --orange-dim: rgba(255,107,53,0.10); --emerald: #10b981;
    --shadow-sm: 0 1px 8px rgba(0,0,0,0.07);
  }

  .ss-wrap {
    height: 100%; overflow-y: auto; padding: 32px;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
  }

  .ss-wrap::-webkit-scrollbar { width: 4px; }
  .ss-wrap::-webkit-scrollbar-track { background: transparent; }
  .ss-wrap::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.15); border-radius: 4px; }

  .ss-inner { max-width: 780px; margin: 0 auto; }

  .ss-section { margin-bottom: 32px; }

  .ss-section-label {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--fg-3);
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }

  .ss-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .ss-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm);
    position: relative;
  }

  .ss-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ff6b35, #ff4fd8);
    border-radius: 16px 16px 0 0;
  }

  .ss-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; gap: 16px;
    border-bottom: 1px solid var(--border);
  }

  .ss-row:last-child { border-bottom: none; }

  .ss-row-label { font-size: 13.5px; font-weight: 600; color: var(--fg); }

  .ss-row-sub { font-size: 11.5px; color: var(--fg-3); margin-top: 2px; }

  .ss-input {
    flex: 1; background: var(--surface-2);
    border: 1.5px solid var(--border); border-radius: 9px; padding: 8px 13px;
    font-family: inherit; font-size: 13px; font-weight: 500;
    color: var(--fg); outline: none; transition: all 0.2s;
  }

  .ss-input:focus {
    border-color: rgba(255,107,53,0.45);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.08);
    background: var(--surface);
  }

  .ss-status-toggle {
    display: flex; background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 10px; padding: 3px; gap: 3px;
  }

  .ss-status-opt {
    padding: 6px 16px; border-radius: 8px;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.18s;
    color: var(--fg-3); font-family: inherit; border: none; background: transparent;
  }

  .ss-status-opt.active-draft {
    background: var(--surface); color: var(--fg);
    box-shadow: 0 1px 6px rgba(0,0,0,0.10);
  }

  .ss-status-opt.active-live {
    background: rgba(16,185,129,0.12); color: var(--emerald);
    font-weight: 800;
  }

  .ss-link-wrap { display: flex; align-items: center; gap: 8px; }

  .ss-link-val {
    flex: 1; font-size: 12.5px; color: var(--fg-3);
    font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .ss-copy-btn {
    padding: 6px 14px; border-radius: 8px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--fg-2); font-family: inherit;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
  }

  .ss-copy-btn:hover { border-color: rgba(255,107,53,0.30); color: var(--orange); background: var(--orange-dim); }
  .ss-copy-btn.copied { color: var(--emerald); border-color: rgba(16,185,129,0.30); background: rgba(16,185,129,0.08); }

  .ss-save-row {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 10px; margin-top: 24px;
  }

  .ss-saved-msg {
    font-size: 12px; font-weight: 700; color: var(--emerald);
    letter-spacing: 0.02em; animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .ss-save-btn {
    padding: 9px 22px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #ff6b35, #ff4fd8);
    color: white; font-family: inherit;
    font-size: 12.5px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 2px 12px rgba(255,107,53,0.30);
  }

  .ss-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,107,53,0.42); }
  .ss-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ss-danger-card {
    background: #fff5f5; border: 1.5px solid rgba(239,68,68,0.18);
    border-radius: 14px; padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  .ss-danger-label { font-size: 13.5px; font-weight: 600; color: var(--fg); }

  .ss-danger-sub { font-size: 11.5px; color: var(--fg-3); margin-top: 2px; }

  .ss-delete-btn {
    background: transparent; border: 1.5px solid rgba(239,68,68,0.30);
    border-radius: 10px; padding: 8px 18px; font-family: inherit;
    font-size: 12px; font-weight: 700; color: #dc2626; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }

  .ss-delete-btn:hover { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.55); }

  .ss-confirm-wrap {
    display: flex; flex-direction: column; gap: 12px;
    background: #fff5f5; border: 1.5px solid rgba(239,68,68,0.18);
    border-radius: 12px; padding: 16px 18px;
  }

  .ss-confirm-text { font-size: 12.5px; color: var(--fg-2); line-height: 1.55; }

  .ss-confirm-actions { display: flex; gap: 8px; }

  .ss-confirm-cancel {
    padding: 7px 18px; border-radius: 9px;
    border: 1.5px solid var(--border); background: transparent;
    color: var(--fg-2); font-family: inherit;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }

  .ss-confirm-cancel:hover { background: var(--surface-2); color: var(--fg); }

  .ss-confirm-delete {
    padding: 7px 18px; border-radius: 9px; border: none;
    background: #dc2626; color: white; font-family: inherit;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  }

  .ss-confirm-delete:hover { background: #b91c1c; }
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