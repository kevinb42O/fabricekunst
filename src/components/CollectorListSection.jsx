import React, { useId, useRef, useState } from 'react';
import { ArrowRight, Check, LockKeyhole, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/locales';
import { trackEvent } from '../hooks/useAnalytics';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CollectorListSection({ source = 'homepage', className = '' }) {
  const { t, language } = useLanguage();
  const emailId = useId();
  const consentId = useId();
  const feedbackRef = useRef(null);
  const startedRef = useRef(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const showFeedback = (nextStatus, message) => {
    setStatus(nextStatus);
    setFeedback(message);
    window.setTimeout(() => feedbackRef.current?.focus(), 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 320) {
      trackEvent('collector_list_validation_error', { placement: source, field: 'email' });
      showFeedback('error', t('collectorList.invalidEmail'));
      return;
    }
    if (!consent) {
      trackEvent('collector_list_validation_error', { placement: source, field: 'consent' });
      showFeedback('error', t('collectorList.consentRequired'));
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch('/api/collector-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          consent: true,
          consentVersion: 'collector-list-v1-2026-08-20',
          locale: language,
          source,
          sourcePath: window.location.pathname,
          website
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'subscription_failed');

      trackEvent('collector_list_submitted', {
        placement: source,
        locale: language,
        confirmationRequired: result.status === 'pending'
      }, { dedupeWindowMs: 30 * 60 * 1000 });
      setEmail('');
      setConsent(false);
      showFeedback('success', result.status === 'pending' ? t('collectorList.successPending') : t('collectorList.successActive'));
    } catch {
      showFeedback('error', t('collectorList.error'));
    }
  };

  return (
    <section aria-labelledby={`${emailId}-title`} className={`relative overflow-hidden bg-[#171512] text-white ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden="true">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-[#C5A059]/30" />
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border border-[#C5A059]/20" />
      </div>

      <div className="page-shell-wide relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)] lg:items-center lg:gap-20 lg:py-24">
        <div>
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">{t('collectorList.eyebrow')}</span>
          <h2 id={`${emailId}-title`} className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[1.04] tracking-[-0.025em] sm:text-5xl lg:text-6xl">
            {t('collectorList.title')}
          </h2>
          <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-white/80 sm:text-xl">{t('collectorList.subtitle')}</p>
          <p className="mt-5 font-sans text-[10px] font-semibold uppercase tracking-[0.13em] text-[#CFC5B5]">{t('collectorList.benefits')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="border border-white/15 bg-white/[0.055] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-7">
          <label htmlFor={emailId} className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/75">
            {t('collectorList.emailLabel')}
          </label>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5A059]" aria-hidden="true" />
              <input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onFocus={markStarted}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={status === 'error' ? 'true' : undefined}
                aria-describedby={feedback ? `${emailId}-feedback` : undefined}
                placeholder={t('collectorList.emailPlaceholder')}
                className="min-h-14 w-full border border-white/25 bg-[#FFFEFC] py-3 pl-11 pr-4 font-serif text-base text-[#1C1A17] placeholder:text-[#81766B] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/35"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex min-h-14 items-center justify-between gap-5 bg-[#C5A059] px-5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#171512] transition-colors duration-200 hover:bg-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171512] disabled:cursor-wait disabled:opacity-65 sm:justify-center"
            >
              <span>{status === 'loading' ? t('collectorList.submitting') : t('collectorList.submit')}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div className="sr-only" aria-hidden="true">
            <label htmlFor={`${emailId}-website`}>Website</label>
            <input id={`${emailId}-website`} name="website" tabIndex="-1" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <div className="mt-4 flex items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onFocus={markStarted}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#C5A059] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            />
            <label htmlFor={consentId} className="font-sans text-[11px] leading-[1.55] text-white/72">
              {t('collectorList.consent')}{' '}
              <a href={localizePath('/privacy', language)} className="text-white underline decoration-[#C5A059] underline-offset-2 hover:text-[#D4AF37]">
                {t('collectorList.privacy')}
              </a>
            </label>
          </div>

          {feedback && (
            <div
              id={`${emailId}-feedback`}
              ref={feedbackRef}
              tabIndex="-1"
              role={status === 'error' ? 'alert' : 'status'}
              className={`mt-5 flex items-start gap-2.5 border px-4 py-3 font-sans text-xs leading-relaxed ${status === 'success' ? 'border-emerald-300/35 bg-emerald-950/30 text-emerald-100' : 'border-red-300/35 bg-red-950/30 text-red-100'}`}
            >
              {status === 'success' ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span><strong className="block">{status === 'success' ? t('collectorList.successTitle') : ''}</strong>{feedback}</span>
            </div>
          )}

          <p className="mt-4 flex items-center gap-2 font-sans text-[9px] uppercase tracking-[0.12em] text-white/50">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            {t('collectorList.privacyPromise')}
          </p>
        </form>
      </div>
    </section>
  );
}
  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('collector_list_started', { placement: source, locale: language });
  };
