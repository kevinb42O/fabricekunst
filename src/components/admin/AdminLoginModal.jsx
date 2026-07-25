import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authenticateAdminUserAsync } from '../../utils/storage';

export default function AdminLoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message || 'Ongeldig e-mailadres of wachtwoord.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-[#111111] font-sans selection:bg-[#B8860B]/20 selection:text-[#B8860B]">
      
      {/* Top Back to Website Button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={onClose}
          className="inline-flex items-center space-x-2 text-xs font-mono text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#B8860B]" />
          <span>Terug naar website</span>
        </button>
      </div>

      {/* Main Professional Login Card */}
      <div className="w-full max-w-md bg-white border border-[#D8CEB8] rounded-3xl p-8 sm:p-10 shadow-md space-y-8">
        
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">
            Inloggen
          </h1>
          <p className="text-xs text-[#666666] leading-relaxed">
            Voer uw e-mailadres en wachtwoord in om toegang te krijgen tot het beheersysteem.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
              E-mailadres
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="naam@voorbeeld.be"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 transition-all"
              />
              <Mail className="w-4 h-4 text-[#888888] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-[#888888] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#888888] hover:text-[#111111] transition-colors"
                title={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>Bezig met verifiëren...</span>
            ) : (
              <>
                <span>Inloggen</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </>
            )}
          </button>

        </form>

      </div>

      {/* Footer copyright note */}
      <div className="mt-8 text-center text-[11px] text-[#888888] font-mono">
        Beveiligde beheerderstoegang
      </div>

    </div>
  );
}
