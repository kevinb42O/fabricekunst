import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Eye, EyeOff, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCurrentPasscode, updateAdminPasscode, verifyAdminPasscode } from '../../utils/storage';

export default function SecuritySettings({ onShowToast }) {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPasscode = getCurrentPasscode();

  const handleUpdatePin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!verifyAdminPasscode(currentPinInput)) {
      setErrorMsg('Huidige beheerderscode is onjuist.');
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      setErrorMsg('Nieuwe code moet tussen de 4 en 8 tekens lang zijn.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('Nieuwe code en bevestiging komen niet overeen.');
      return;
    }

    updateAdminPasscode(newPin);
    setSuccessMsg('Beheerderscode succesvol gewijzigd!');
    if (onShowToast) onShowToast('Beheerderscode succesvol bijgewerkt!');

    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleResetDefaultPin = () => {
    if (window.confirm('Weet je zeker dat je de beheerderscode wilt herstellen naar de standaard "5438"?')) {
      updateAdminPasscode('5438');
      setSuccessMsg('Beheerderscode hersteld naar 5438.');
      if (onShowToast) onShowToast('PIN hersteld naar 5438');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-[#111111] animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-sm">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#111111]">Beveiliging & PIN Code Beheer</h2>
            <p className="text-xs text-[#555555]">Beheer de toegangscode voor het Fabrice CMS beheerderspaneel.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-serif text-[#111111] font-bold">Huidige Beheerderscode:</span>
            <span className="font-mono font-bold text-[#B8860B] tracking-widest">
              {showPins ? currentPasscode : '••••'}
            </span>
          </div>
          <button
            onClick={() => setShowPins(!showPins)}
            className="p-1.5 rounded-lg bg-white border border-[#D8CEB8] hover:bg-stone-100 text-[#111111] transition-colors"
            title={showPins ? "Verberg code" : "Toon code"}
          >
            {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Change PIN Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-6">
        <h3 className="text-base font-serif font-bold text-[#111111] flex items-center space-x-2 border-b border-[#D8CEB8] pb-3">
          <Key className="w-4 h-4 text-[#B8860B]" />
          <span>Nieuwe PIN Code Instellen</span>
        </h3>

        <form onSubmit={handleUpdatePin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] mb-1">
              Huidige Beheerderscode *
            </label>
            <input
              type={showPins ? "text" : "password"}
              required
              maxLength={8}
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="Typ huidige code..."
              className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] mb-1">
                Nieuwe Code (4-8 cijfers) *
              </label>
              <input
                type={showPins ? "text" : "password"}
                required
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Bijv. 5438"
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] mb-1">
                Bevestig Nieuwe Code *
              </label>
              <input
                type={showPins ? "text" : "password"}
                required
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Herhaal nieuwe code..."
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#D8CEB8]">
            <button
              type="button"
              onClick={handleResetDefaultPin}
              className="text-xs text-[#666666] hover:text-[#111111] underline font-mono flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Herstel naar standaard PIN (5438)</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>PIN Code Opslaan</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
