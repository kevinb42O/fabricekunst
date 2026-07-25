import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Eye, EyeOff, Check, AlertTriangle, UserCheck } from 'lucide-react';
import { updateAdminPasswordAsync } from '../../utils/storage';

export default function SecuritySettings({ currentUser, onShowToast }) {
  const userEmail = currentUser?.email || 'admin@rareartbooks.com';
  const userName = currentUser?.name || 'Admin';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Voer uw huidige wachtwoord in.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Nieuw wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Nieuw wachtwoord en bevestiging komen niet overeen.');
      return;
    }

    setLoading(true);
    const result = await updateAdminPasswordAsync(userEmail, currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Wachtwoord voor ${userEmail} succesvol gewijzigd!`);
      if (onShowToast) onShowToast('Wachtwoord succesvol bijgewerkt!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(result.message || 'Fout bij bijwerken wachtwoord.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-[#111111] animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md border border-[#D4AF37]/30">
              <Lock className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#111111]">Beveiliging & Wachtwoord Beheer</h2>
              <p className="text-xs text-[#555555]">Beheer de inloggegevens voor het Rare Art & Books CMS beheerderspaneel.</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] flex items-center space-x-2 text-xs font-mono">
            <UserCheck className="w-4 h-4 text-[#B8860B]" />
            <span className="text-[#666666]">Ingelogd als:</span>
            <span className="font-bold text-[#111111]">{userName} ({userEmail})</span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#D8CEB8] pb-4">
          <h3 className="text-base font-serif font-bold text-[#111111] flex items-center space-x-2">
            <Key className="w-4 h-4 text-[#B8860B]" />
            <span>Wachtwoord Wijzigen voor {userEmail}</span>
          </h3>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEB8] text-xs font-mono font-bold text-[#111111] hover:bg-stone-200 transition-colors flex items-center space-x-1.5"
          >
            {showPasswords ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Verberg Wachtwoorden</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Toon Wachtwoorden</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#111111] mb-1.5 uppercase tracking-wider">
              Huidige Wachtwoord *
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Voer uw huidige wachtwoord in..."
              className="w-full p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] mb-1.5 uppercase tracking-wider">
                Nieuw Wachtwoord *
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimaal 6 tekens..."
                className="w-full p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] mb-1.5 uppercase tracking-wider">
                Bevestig Nieuw Wachtwoord *
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal nieuw wachtwoord..."
                className="w-full p-3.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-4 flex justify-end border-t border-[#D8CEB8]">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{loading ? "Bezig met opslaan..." : "Wachtwoord Opslaan"}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
