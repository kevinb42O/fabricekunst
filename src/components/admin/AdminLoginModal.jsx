import React, { useState } from 'react';
import { X, ShieldAlert, Lock, ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
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
      setErrorMsg('Vul a.u.b. zowel e-mailadres als wachtwoord in.');
      return;
    }

    setLoading(true);
    const result = await authenticateAdminUserAsync(email, password);
    setLoading(false);

    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message || 'Ongeldige inloggegevens.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in font-sans text-stone-100 selection:bg-[#B8860B]/30 selection:text-[#D4AF37]">
      
      {/* Ultra-Luxury Obsidian Gold Card Container */}
      <div className="relative w-full max-w-md bg-[#0F0E0C] border border-[#332A1B] rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Subtle Ambient Gold Glow Background Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Gold Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#181613] text-stone-400 hover:text-white hover:bg-[#25221C] transition-all border border-[#332A1B]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-[#211E18] to-[#12110E] border border-[#52442B] flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
            <div className="absolute inset-0 rounded-2xl border border-[#D4AF37]/20 pointer-events-none" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.3em] font-mono font-bold block">
              Curatorial Access • Private Atelier
            </span>
            <h2 className="text-2xl font-serif font-bold tracking-wide text-[#F3EAD8]">
              Cabinet Privé
            </h2>
            <p className="text-[11px] text-[#A09582] font-serif leading-relaxed pt-1">
              Beveiligd beheerportaal voor antiquarische boeken &amp; kunstvoorwerpen.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-[0.15em]">
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
                placeholder="naam@domein.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#161411] border border-[#332A1B] text-sm text-[#F3EAD8] placeholder-[#5A5141] font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all font-sans"
              />
              <Mail className="w-4 h-4 text-[#8E7956] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-[0.15em]">
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
                className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#161411] border border-[#332A1B] text-sm text-[#F3EAD8] placeholder-[#5A5141] font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-[#8E7956] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8E7956] hover:text-[#D4AF37] transition-colors"
                title={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#2C1414] border border-[#6B2424] text-[#F87171] text-xs font-medium flex items-center space-x-2.5 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#1E1B15] via-[#2A241A] to-[#1E1B15] hover:from-[#2A241A] hover:to-[#2A241A] border border-[#695637] hover:border-[#D4AF37] text-[#F3EAD8] font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center space-x-2 group disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono text-[#D4AF37]">Verifiëren in database...</span>
            ) : (
              <>
                <span className="group-hover:text-white transition-colors">Aanmelden In Portaal</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

        </form>

        {/* Footer Security Badge */}
        <div className="mt-8 pt-5 border-t border-[#231F18] text-center">
          <span className="text-[10px] text-[#7A6F5C] font-mono tracking-widest uppercase">
            256-Bit Encrypted Database Session
          </span>
        </div>

      </div>
    </div>
  );
}
