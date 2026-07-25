import React, { useState } from 'react';
import { X, ShieldAlert, Lock, ArrowRight, Mail, Eye, EyeOff, UserCheck } from 'lucide-react';
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

  const handleQuickFill = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-[#111111]">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#D8CEB8] rounded-3xl p-6 sm:p-10 shadow-strong overflow-hidden">
        
        {/* Top Decorative Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#8E7035]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-stone-200 transition-colors border border-[#D8CEB8]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#111111] text-white flex items-center justify-center mx-auto shadow-md border border-[#D4AF37]/30">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <div>
            <span className="text-[10px] text-[#B8860B] uppercase tracking-[0.25em] font-bold block font-mono">
              Beheerdersomgeving
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#111111] mt-1">
              Fabrice CMS Access
            </h2>
          </div>
          <p className="text-xs text-[#666666]">
            Meld u aan met uw beheerder e-mailadres en wachtwoord.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Input */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-1.5">
              E-mailadres *
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
                placeholder="bijv. admin@rareartbooks.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20"
              />
              <Mail className="w-4 h-4 text-[#8E7035] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-1.5">
              Wachtwoord *
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
                className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm text-[#111111] font-medium focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B8860B]/20 font-mono"
              />
              <Lock className="w-4 h-4 text-[#8E7035] absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Bezig met verifiëren...</span>
            ) : (
              <>
                <span>Aanmelden In CMS</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </>
            )}
          </button>

          {/* Account Quick Select Helpers */}
          <div className="pt-4 border-t border-[#D8CEB8] text-center space-y-2">
            <span className="text-[11px] text-[#777777] block font-serif">Snelle Snelkoppeling Accounts:</span>
            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => handleQuickFill('kevin@webaanzee.be', 'Pinakaaz420')}
                className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[11px] font-mono font-bold text-[#111111] hover:bg-stone-200 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-3 h-3 text-[#B8860B]" />
                <span>Kevin (Dev)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@rareartbooks.com', 'Fabrice5438')}
                className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-[11px] font-mono font-bold text-[#111111] hover:bg-stone-200 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-3 h-3 text-[#B8860B]" />
                <span>Fabrice (Admin)</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
