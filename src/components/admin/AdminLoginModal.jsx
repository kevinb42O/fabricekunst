import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ArrowRight, Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { authenticateAdminUserAsync } from '../../utils/storage';

const REMEMBER_KEY = 'admin_remember_me';

export default function AdminLoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [mounted, setMounted]         = useState(false);
  const emailRef = useRef(null);

  /* ── Load remembered credentials on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (_) { /* ignore parse errors */ }

    // Entrance animation
    requestAnimationFrame(() => setMounted(true));

    // Focus email field after mount
    setTimeout(() => emailRef.current?.focus(), 80);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Vul a.u.b. zowel uw e-mailadres als wachtwoord in.');
      return;
    }

    setLoading(true);
    const result = await authenticateAdminUserAsync(email, password);
    setLoading(false);

    if (result.success) {
      /* ── Persist or clear remembered credentials ── */
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: email.trim().toLowerCase(), password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message || 'Ongeldig e-mailadres of wachtwoord.');
    }
  };

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

        .al-root {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100svh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid background — Vercel style */
        .al-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* Soft radial glow in top-left */
        .al-root::after {
          content: '';
          position: fixed;
          top: -30%;
          left: -20%;
          width: 70vw;
          height: 70vw;
          background: radial-gradient(circle, rgba(0,112,243,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .al-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .al-inner.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Back button ── */
        .al-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 36px;
          transition: color 0.18s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: -0.01em;
        }
        .al-back:hover { color: #111; }
        .al-back svg { width: 14px; height: 14px; }

        /* ── Card ── */
        .al-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 40px 40px 36px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.03),
            0 4px 6px rgba(0,0,0,0.04),
            0 12px 28px rgba(0,0,0,0.06);
        }

        /* ── Logo / Brand mark ── */
        .al-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .al-logo img {
          height: 36px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        /* ── Header ── */
        .al-heading {
          font-size: 22px;
          font-weight: 600;
          color: #111;
          letter-spacing: -0.04em;
          margin: 0 0 6px;
          line-height: 1.2;
        }
        .al-subtext {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
          margin: 0 0 28px;
          letter-spacing: -0.01em;
        }

        /* ── Divider ── */
        .al-divider {
          height: 1px;
          background: #f0f0f0;
          margin-bottom: 24px;
        }

        /* ── Field ── */
        .al-field {
          margin-bottom: 16px;
        }
        .al-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #444;
          letter-spacing: 0.01em;
          margin-bottom: 6px;
        }
        .al-input-wrap {
          position: relative;
        }
        .al-input {
          width: 100%;
          box-sizing: border-box;
          height: 40px;
          padding: 0 40px 0 36px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fafafa;
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          color: #111;
          outline: none;
          transition:
            border-color 0.18s cubic-bezier(0.16,1,0.3,1),
            background 0.18s cubic-bezier(0.16,1,0.3,1),
            box-shadow 0.18s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: -0.01em;
        }
        .al-input::placeholder {
          color: #bbb;
          font-weight: 400;
        }
        .al-input:focus {
          border-color: #111;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .al-input.error {
          border-color: #e5484d;
          background: #fff8f8;
        }
        .al-input.error:focus {
          box-shadow: 0 0 0 3px rgba(229,72,77,0.1);
        }
        .al-icon-left {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          width: 15px;
          height: 15px;
          color: #bbb;
          pointer-events: none;
          transition: color 0.18s;
        }
        .al-input:focus ~ .al-icon-left,
        .al-input-wrap:focus-within .al-icon-left {
          color: #888;
        }
        .al-icon-right {
          position: absolute;
          right: 0;
          top: 0;
          height: 40px;
          width: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #bbb;
          border-radius: 0 8px 8px 0;
          transition: color 0.18s;
        }
        .al-icon-right:hover { color: #555; }
        .al-icon-right svg { width: 15px; height: 15px; }

        /* ── Error box ── */
        .al-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fff8f8;
          border: 1px solid #f5c6c7;
          border-radius: 8px;
          padding: 11px 13px;
          margin-bottom: 16px;
          animation: al-shake 0.35s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes al-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-3px); }
          40%, 60% { transform: translateX(3px); }
        }
        .al-error svg { width: 14px; height: 14px; color: #e5484d; flex-shrink: 0; margin-top: 1px; }
        .al-error span { font-size: 12.5px; color: #c62828; line-height: 1.45; letter-spacing: -0.01em; }

        /* ── Remember me row ── */
        .al-remember {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
          cursor: pointer;
          user-select: none;
        }
        .al-checkbox-wrap {
          position: relative;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .al-checkbox-wrap input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }
        .al-checkbox-visual {
          width: 16px;
          height: 16px;
          border: 1.5px solid #d0d0d0;
          border-radius: 4px;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            border-color 0.15s cubic-bezier(0.16,1,0.3,1),
            background 0.15s cubic-bezier(0.16,1,0.3,1),
            box-shadow 0.15s;
        }
        .al-checkbox-visual.checked {
          background: #111;
          border-color: #111;
        }
        .al-checkbox-visual svg {
          width: 10px;
          height: 10px;
          color: #fff;
          opacity: 0;
          transform: scale(0.6);
          transition: opacity 0.15s, transform 0.15s cubic-bezier(0.16,1,0.3,1);
        }
        .al-checkbox-visual.checked svg {
          opacity: 1;
          transform: scale(1);
        }
        .al-checkbox-wrap:focus-within .al-checkbox-visual {
          box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
        }
        .al-remember-label {
          font-size: 13px;
          color: #444;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        /* ── Submit button ── */
        .al-submit {
          width: 100%;
          height: 40px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: -0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition:
            background 0.18s cubic-bezier(0.16,1,0.3,1),
            box-shadow 0.18s cubic-bezier(0.16,1,0.3,1),
            transform 0.12s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .al-submit:hover:not(:disabled) {
          background: #222;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          transform: translateY(-1px);
        }
        .al-submit:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }
        .al-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .al-submit svg { width: 14px; height: 14px; }

        /* Spinner */
        .al-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: al-spin 0.7s linear infinite;
        }
        @keyframes al-spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .al-footer {
          margin-top: 20px;
          text-align: center;
          font-size: 11.5px;
          color: #bbb;
          font-family: 'Geist Mono', 'SF Mono', monospace;
          letter-spacing: 0.01em;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .al-card { padding: 28px 22px 24px; border-radius: 10px; }
        }
      `}</style>

      <div className="al-root">
        <div className={`al-inner ${mounted ? 'mounted' : ''}`}>

          {/* Back button */}
          <button className="al-back" onClick={onClose} type="button">
            <ArrowLeft />
            <span>Terug naar website</span>
          </button>

          {/* Card */}
          <div className="al-card">

            {/* Logo */}
            <div className="al-logo">
              <img
                src="/images/Atelier Rembrandt.png"
                alt="Atelier Rembrandt"
              />
            </div>

            {/* Header */}
            <h1 className="al-heading">Inloggen</h1>
            <p className="al-subtext">Voer uw gegevens in om toegang te krijgen tot het beheersysteem.</p>

            <div className="al-divider" />

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="al-field">
                <label className="al-label" htmlFor="admin-email">E-mailadres</label>
                <div className="al-input-wrap">
                  <input
                    id="admin-email"
                    ref={emailRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                    placeholder="naam@voorbeeld.be"
                    autoComplete="email"
                    className={`al-input${errorMsg ? ' error' : ''}`}
                  />
                  <Mail className="al-icon-left" />
                </div>
              </div>

              {/* Password */}
              <div className="al-field">
                <label className="al-label" htmlFor="admin-password">Wachtwoord</label>
                <div className="al-input-wrap">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    className={`al-input${errorMsg ? ' error' : ''}`}
                    style={{ fontFamily: showPassword ? 'inherit' : 'monospace' }}
                  />
                  <Lock className="al-icon-left" />
                  <button
                    type="button"
                    className="al-icon-right"
                    onClick={() => setShowPassword(v => !v)}
                    title={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="al-error">
                  <ShieldAlert />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Remember me */}
              <label
                className="al-remember"
                htmlFor="admin-remember"
              >
                <div className="al-checkbox-wrap">
                  <input
                    id="admin-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className={`al-checkbox-visual ${rememberMe ? 'checked' : ''}`}>
                    <Check />
                  </div>
                </div>
                <span className="al-remember-label">Onthoud mij</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="al-submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="al-spinner" />
                ) : (
                  <>
                    <span>Inloggen</span>
                    <ArrowRight />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="al-footer">Beveiligde beheerderstoegang</p>

        </div>
      </div>
    </>
  );
}
