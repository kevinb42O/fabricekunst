import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  UserCheck,
  Share,
  Bell,
  BellOff,
  Info,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { updateAdminPasswordAsync } from '../../utils/storage';
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush
} from '../../utils/pushManager';

export default function SecuritySettings({ currentUser, onShowToast }) {
  const userEmail = currentUser?.email || 'admin@atelierrembrandt.com';
  const userName = currentUser?.name || 'Admin';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [pushSupported, setPushSupported] = useState(isPushSupported());
  const [iosDevice, setIosDevice] = useState(isIOS());
  const [standaloneMode, setStandaloneMode] = useState(isStandalone());
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Load current subscription status
  useEffect(() => {
    async function checkSubscription() {
      if (pushSupported) {
        const sub = await getPushSubscription();
        setIsSubscribed(!!sub);
      }
    }
    checkSubscription();
  }, [pushSupported]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      await subscribeUserToPush();
      setIsSubscribed(true);
      setPushPermission(Notification.permission);
      if (onShowToast) onShowToast('Succesvol ingeschreven voor push notificaties!');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Inschrijven mislukt: ${err.message}`);
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);
    try {
      const ok = await unsubscribeUserFromPush();
      if (ok) {
        setIsSubscribed(false);
        if (onShowToast) onShowToast('Afgemeld voor push notificaties.');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Uitschrijven mislukt: ${err.message}`);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestingPush(true);
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Atelier Rembrandt 🛎️',
          body: 'Dit is uw test push notificatie! Het werkt perfect op uw apparaat.',
          url: '/admin#inquiries'
        })
      });
      const data = await response.json();
      if (data.success) {
        if (onShowToast) onShowToast('Test notificatie verstuurd naar geregistreerde apparaten!');
      } else {
        if (onShowToast) onShowToast(`Fout: ${data.error || 'Kon test niet versturen'}`);
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Test API niet bereikbaar. Draait de server live?');
    } finally {
      setTestingPush(false);
    }
  };

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
              <p className="text-xs text-[#555555]">Beheer de inloggegevens voor het Atelier Rembrandt CMS beheerderspaneel.</p>
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

      {/* PWA & Push Notifications Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm space-y-6">
        <h3 className="text-base font-serif font-bold text-[#111111] flex items-center space-x-2 border-b border-[#D8CEB8] pb-4">
          <Smartphone className="w-5 h-5 text-[#B8860B]" />
          <span>PWA App & Push Notificaties (iPhone / Mobile)</span>
        </h3>

        {/* 1. App Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] space-y-2">
            <span className="text-xs font-mono font-bold text-[#666666] block uppercase tracking-wider">App Status</span>
            {standaloneMode ? (
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Geïnstalleerd als PWA</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-[#B8860B] font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Geopend in Web Browser</span>
              </div>
            )}
            <p className="text-xs text-[#555555]">
              {standaloneMode 
                ? "U gebruikt de app nu als een geïnstalleerde app op uw beginscherm."
                : "Voor push notificaties op iPhone moet u deze app eerst installeren op uw beginscherm."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D8CEB8] space-y-2">
            <span className="text-xs font-mono font-bold text-[#666666] block uppercase tracking-wider">Notificatie Status</span>
            <div className="flex items-center space-x-2 font-bold text-sm">
              {isSubscribed ? (
                <span className="text-emerald-700">Ingeschreven (Actief)</span>
              ) : pushPermission === 'denied' ? (
                <span className="text-red-600">Geblokkeerd in instellingen</span>
              ) : (
                <span className="text-[#666666]">Niet Ingeschreven</span>
              )}
            </div>
            <p className="text-xs text-[#555555]">
              {isSubscribed 
                ? "U ontvangt push notificaties wanneer er een nieuwe aanvraag binnenkomt."
                : "Zet meldingen aan om direct updates te krijgen over aanvragen."}
            </p>
          </div>
        </div>

        {/* 2. Installation instructions for iOS */}
        {iosDevice && !standaloneMode && (
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
            <div className="flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">
                  Installeer op uw iPhone (iOS 16.4+)
                </h4>
                <p className="text-xs text-[#555555] leading-relaxed mt-1">
                  Apple staat push notificaties voor web-apps alleen toe als de PWA is toegevoegd aan het beginscherm.
                </p>
              </div>
            </div>
            
            <div className="pl-6 space-y-2 text-xs text-[#555555] font-sans">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D8CEB8] flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Tik onderaan het Safari scherm op de <strong>Deelknop</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />).</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D8CEB8] flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Scroll naar beneden en tik op <strong>Zet op beginscherm</strong>.</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D8CEB8] flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Open de app vanaf uw beginscherm en activeer de notificaties hieronder.</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Action Buttons */}
        <div className="pt-4 border-t border-[#D8CEB8] flex flex-wrap gap-4 items-center justify-between">
          <div>
            {!pushSupported ? (
              <span className="text-xs text-red-600 font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Push notificaties zijn niet beschikbaar in deze browser of stand.</span>
              </span>
            ) : pushPermission === 'denied' ? (
              <p className="text-xs text-red-600 font-bold max-w-md">
                Toestemming voor meldingen is geblokkeerd. Herstel dit in uw iPhone Instellingen &gt; Safari / Atelier Rembrandt &gt; Meldingen.
              </p>
            ) : (
              <p className="text-xs text-[#555555]">
                {isSubscribed 
                  ? "Uw browser is gekoppeld aan de Supabase push-service." 
                  : "U kunt dit specifieke apparaat nu inschrijven voor realtime updates."}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {pushSupported && isSubscribed && (
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testingPush}
                className="px-4 py-2.5 rounded-xl border border-[#D8CEB8] bg-[#FAF7F2] hover:bg-stone-200 text-xs font-bold text-[#111111] transition-all disabled:opacity-50"
              >
                {testingPush ? "Versturen..." : "Stuur Test Notificatie"}
              </button>
            )}

            {pushSupported && !isSubscribed && pushPermission !== 'denied' && (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing || (iosDevice && !standaloneMode)}
                className="px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#B8860B] hover:text-[#111111] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center space-x-2 disabled:opacity-40"
                title={iosDevice && !standaloneMode ? "Installeer eerst de app op uw iPhone" : ""}
              >
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                <span>{subscribing ? "Activeren..." : "Activeer Notificaties"}</span>
              </button>
            )}

            {pushSupported && isSubscribed && (
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={subscribing}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <BellOff className="w-4 h-4" />
                <span>Deactiveren</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
