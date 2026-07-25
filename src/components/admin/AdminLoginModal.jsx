import React, { useState } from 'react';
import { X, ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { verifyAdminPasscode } from '../../utils/storage';

export default function AdminLoginModal({ onClose, onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verifyAdminPasscode(pin)) {
      onLoginSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-[#111111]">
      <div className="relative w-full max-w-md bg-white border-2 border-[#D8CEB8] rounded-3xl p-6 sm:p-8 shadow-strong">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#FAF7F2] text-[#111111] hover:bg-stone-200 transition-colors border border-[#D8CEB8]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border-2 border-[#111111] text-[#111111] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] text-[#B8860B] uppercase tracking-[0.2em] font-bold block font-mono">
              Beheerdersomgeving
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#111111] mt-1">
              Fabrice CMS Access
            </h2>
          </div>
          <p className="text-xs text-[#555555]">
            Voer je beheerderscode in om toegang te krijgen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
            />
            {error && (
              <p className="text-xs text-red-600 font-bold text-center mt-2 flex items-center justify-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Ongeldige toegangscode.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Ontgrendel Beheersysteem</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </form>

      </div>
    </div>
  );
}
