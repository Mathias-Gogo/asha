import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090b; }

  .login-wrap {
    min-height: 100vh;
    background: #09090b;
    display: flex;
    font-family: 'Montserrat', sans-serif;
    overflow: hidden;
    position: relative;
  }

  .login-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Form panel ── */
  .form-panel {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    background: #09090b;
  }

  .login-logo {
    display: flex; align-items: center; gap: 10px; margin-bottom: 52px;
  }

  .login-logo-mark {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #8b5cf6, #7dd3fc);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: white;
  }

  .login-logo-text { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: -0.02em; }
  .login-logo-sub  { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 400; }

  .login-heading {
    font-size: 28px; font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.03em;
    margin-bottom: 10px; line-height: 1.2;
  }

  .login-sub {
    font-size: 14px; color: rgba(255,255,255,0.3);
    margin-bottom: 48px; line-height: 1.65;
    max-width: 320px;
  }

  .google-btn {
    width: 100%; padding: 14px 20px;
    background: #ffffff;
    border: none;
    border-radius: 10px;
    color: rgba(0,0,0,0.8);
    font-family: 'Montserrat', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    letter-spacing: 0.01em;
    box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  }

  .google-btn:hover:not(:disabled) {
    background: #f5f5f5;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    transform: translateY(-1px);
  }

  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .login-error {
    font-size: 12px; color: #f87171;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 7px; padding: 10px 13px;
    margin-bottom: 20px; line-height: 1.5;
  }

  .login-footer {
    margin-top: 24px;
    font-size: 11px; color: rgba(255,255,255,0.15);
    line-height: 1.6; max-width: 300px;
  }

  /* ── Image panel ── */
  .image-panel {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  .image-bg {
    position: absolute; inset: 0;
    background-size: cover;
    background-position: center;
  }

  .image-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to top,
      rgba(9,9,11,0.92) 0%,
      rgba(9,9,11,0.3) 50%,
      rgba(9,9,11,0.05) 100%
    );
    z-index: 1;
  }

  .image-content {
    position: relative; z-index: 2;
    padding: 40px 48px;
  }

  .image-tag {
    display: inline-block; padding: 4px 12px;
    border-radius: 100px;
    background: rgba(139,92,246,0.2);
    border: 1px solid rgba(139,92,246,0.35);
    font-size: 11px; font-weight: 600;
    color: #c4b5fd; letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 12px;
  }

  .image-quote {
    font-size: 22px; font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.02em; line-height: 1.35;
    max-width: 360px; margin-bottom: 16px;
  }

  .image-author { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .image-panel { display: none; }
    .form-panel  { max-width: 100%; padding: 48px 28px; }
    .login-heading { font-size: 24px; }
  }
`;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const PANEL = {
  image: "https://res.cloudinary.com/dbrjr5zqp/image/upload/v1780431813/1048756B-1FF4-40CC-8896-662CCA328318_pnhjbc.jpg",
  tag: "Welcome to Asha",
  quote: "Every great company started with a founder who refused to guess.",
  author: "Asha · by Mexuri",
};

const panelVariants = {
  initial: { opacity: 0, scale: 1.03 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

const formVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="login-wrap">

        {/* Orbs */}
        <div className="login-orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", top: -150, left: -100 }} />
        <div className="login-orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(125,211,252,0.15) 0%, transparent 70%)", bottom: -100, right: -80 }} />

        {/* Image panel */}
        <AnimatePresence>
          <motion.div
            key="image-panel"
            className="image-panel"
            variants={panelVariants}
            initial="initial"
            animate="animate"
          >
            <div className="image-bg" style={{ backgroundImage: `url(${PANEL.image})` }} />
            <div className="image-overlay" />
            <div className="image-content">
              <div className="image-tag">{PANEL.tag}</div>
              <div className="image-quote">{PANEL.quote}</div>
              <div className="image-author">{PANEL.author}</div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Form panel */}
        <motion.div
          className="form-panel"
          variants={formVariants}
          initial="initial"
          animate="animate"
        >
          <div className="login-logo">
            <div className="login-logo-mark">A</div>
            <div>
              <div className="login-logo-text">Asha</div>
              <div className="login-logo-sub">by Mexuri</div>
            </div>
          </div>

          <div className="login-heading">
            Your AI<br />co-founder.
          </div>
          <div className="login-sub">
            Validate ideas, research markets, and build smarter — before you commit a single naira.
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="google-btn" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="login-footer">
            By continuing, you agree to Asha's terms of service and privacy policy.
          </div>
        </motion.div>

      </div>
    </>
  );
}