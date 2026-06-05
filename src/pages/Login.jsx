import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    max-width: 580px;
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
    display: flex; align-items: center; gap: 10px; margin-bottom: 48px;
  }

  .login-logo-mark {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #8b5cf6, #7dd3fc);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: white;
  }

  .login-logo-text { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: -0.02em; }
  .login-logo-sub  { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 400; }

  .login-heading { font-size: 24px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.03em; margin-bottom: 6px; line-height: 1.2; }
  .login-sub     { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 32px; line-height: 1.6; }

  .login-tabs {
    display: flex;
    background: #141418;
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 28px;
  }

  .login-tab {
    flex: 1; padding: 8px;
    border-radius: 6px; border: none;
    background: transparent;
    color: rgba(255,255,255,0.3);
    font-family: 'Montserrat', sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .login-tab.active { background: #1e1e26; color: rgba(255,255,255,0.85); }

  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .field label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; text-transform: uppercase; }

  .field input {
    background: #141418;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 12px 14px;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.85);
    outline: none;
    transition: border-color 0.2s;
  }

  .field input:focus { border-color: rgba(139,92,246,0.6); }
  .field input::placeholder { color: rgba(255,255,255,0.2); }

  .login-btn {
    width: 100%; padding: 12px;
    background: #8b5cf6; border: none; border-radius: 8px;
    color: white; font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    margin-top: 8px; transition: background 0.2s, opacity 0.2s;
    letter-spacing: 0.02em;
  }

  .login-btn:hover:not(:disabled) { background: #7c3aed; }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
  .divider-text { font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 500; letter-spacing: 0.06em; }

  .google-btn {
    width: 100%; padding: 11px;
    background: transparent; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; color: rgba(255,255,255,0.7);
    font-family: 'Montserrat', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    letter-spacing: 0.02em;
  }

  .google-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .login-error {
    font-size: 12px; color: #f87171;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 7px; padding: 10px 13px;
    margin-bottom: 14px; line-height: 1.5;
  }

  .login-success {
    font-size: 12px; color: #6ee7b7;
    background: rgba(110,231,183,0.08);
    border: 1px solid rgba(110,231,183,0.2);
    border-radius: 7px; padding: 10px 13px;
    margin-bottom: 14px; line-height: 1.5;
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
    position: absolute;
    inset: 0;
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
    .form-panel  { max-width: 100%; padding: 40px 28px; }
  }
`;

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
);

const PANELS = {
    signin: {
        image: "https://res.cloudinary.com/dbrjr5zqp/image/upload/v1780431813/1048756B-1FF4-40CC-8896-662CCA328318_pnhjbc.jpg",
        tag: "Welcome back",
        quote: "The best time to build was yesterday. The second best time is now.",
        author: "Asha · by Mexuri",
    },
    signup: {
        image: "https://res.cloudinary.com/dbrjr5zqp/image/upload/v1780432478/Character_waving_and_saying_hi_202606022132_hzezub.jpg",
        tag: "Join Asha",
        quote: "Every great company started with a founder who refused to guess.",
        author: "Asha · by Mexuri",
    },
};

// Direction: signin → signup = slide left, signup → signin = slide right
const formVariants = (direction) => ({
    initial: { x: direction === "left" ? "100%" : "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } },
    exit: { x: direction === "left" ? "-100%" : "100%", opacity: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } },
});

const imageVariants = (direction) => ({
    initial: { x: direction === "left" ? "-100%" : "100%", opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } },
    exit: { x: direction === "left" ? "100%" : "-100%", opacity: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } },
});

export default function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("signin");
    const [direction, setDirection] = useState("left");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const switchMode = (newMode) => {
        if (newMode === mode) return;
        // signin → signup: slide left. signup → signin: slide right
        setDirection(newMode === "signup" ? "left" : "right");
        setMode(newMode);
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);
        if (!email || !password) return setError("Please fill in all fields.");
        setLoading(true);

        if (mode === "signup") {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setError(error.message);
            else setSuccess("Check your email to confirm your account, then sign in.");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
            else navigate("/", { replace: true });
        }

        setLoading(false);
    };

    const handleGoogle = async () => {
        setError(null);
        setGoogleLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/` },
        });
        if (error) {
            setError(error.message);
            setGoogleLoading(false);
        }
    };

    const onKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };
    const panel = PANELS[mode];

    // signin = image left, form right. signup = form left, image right
    const isSignIn = mode === "signin";

    return (
        <>
            <style>{STYLES}</style>
            <div className="login-wrap">

                {/* Background orbs — static, not animated */}
                <div className="login-orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", top: -150, left: -100 }} />
                <div className="login-orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(125,211,252,0.15) 0%, transparent 70%)", bottom: -100, right: -80 }} />

                <AnimatePresence mode="popLayout" initial={false}>

                    {/* Image panel — left on signin, right on signup */}
                    {isSignIn && (
                        <motion.div
                            key="image-signin"
                            className="image-panel"
                            {...imageVariants(direction)}
                        >
                            <div className="image-bg" style={{ backgroundImage: `url(${panel.image})` }} />
                            <div className="image-overlay" />
                            <div className="image-content">
                                <div className="image-tag">{panel.tag}</div>
                                <div className="image-quote">{panel.quote}</div>
                                <div className="image-author">{panel.author}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Form panel */}
                    <motion.div
                        key={`form-${mode}`}
                        className="form-panel"
                        {...formVariants(direction)}
                    >
                        <div className="login-logo">
                            <div className="login-logo-mark">A</div>
                            <div>
                                <div className="login-logo-text">Asha</div>
                                <div className="login-logo-sub">by Mexuri</div>
                            </div>
                        </div>

                        <div className="login-heading">
                            {mode === "signin" ? "Welcome back" : "Create your account"}
                        </div>
                        <div className="login-sub">
                            {mode === "signin"
                                ? "Sign in to continue building with Asha."
                                : "Join African founders testing ideas smarter."}
                        </div>

                        <div className="login-tabs">
                            <button className={`login-tab ${mode === "signin" ? "active" : ""}`} onClick={() => switchMode("signin")}>Sign in</button>
                            <button className={`login-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Sign up</button>
                        </div>

                        {error && <div className="login-error">{error}</div>}
                        {success && <div className="login-success">{success}</div>}

                        <div className="field">
                            <label>Email</label>
                            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKeyDown} />
                        </div>

                        <div className="field">
                            <label>Password</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKeyDown} />
                        </div>

                        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
                        </button>

                        <div className="divider">
                            <div className="divider-line" />
                            <div className="divider-text">OR</div>
                            <div className="divider-line" />
                        </div>

                        <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
                            <GoogleIcon />
                            {googleLoading ? "Redirecting..." : "Continue with Google"}
                        </button>
                    </motion.div>

                    {/* Image panel — right on signup */}
                    {!isSignIn && (
                        <motion.div
                            key="image-signup"
                            className="image-panel"
                            {...imageVariants(direction)}
                        >
                            <div className="image-bg" style={{ backgroundImage: `url(${panel.image})` }} />
                            <div className="image-overlay" />
                            <div className="image-content">
                                <div className="image-tag">{panel.tag}</div>
                                <div className="image-quote">{panel.quote}</div>
                                <div className="image-author">{panel.author}</div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </>
    );
}