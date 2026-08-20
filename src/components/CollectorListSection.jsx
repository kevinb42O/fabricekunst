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

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('collector_list_started', { placement: source, locale: language });
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
    <section aria-labelledby={`${emailId}-title`} className={`relative overflow-hidden border-y border-[#D8CEB8] bg-[#F7F3EC] text-[#171512] ${className}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-28 -top-32 h-80 w-80 rounded-full border border-[#B8860B]/10 sm:h-96 sm:w-96" />
        <div className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-[#B8860B]/10 sm:h-64 sm:w-64" />
        <div className="absolute inset-y-0 left-[clamp(1rem,3vw,5rem)] hidden w-px bg-[#B8860B]/20 lg:block" />
      </div>

      <div className="page-shell-wide relative grid gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(31rem,1.18fr)] lg:items-center lg:gap-16 lg:py-20 xl:gap-24">
        <div className="lg:pl-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#8E7035]" aria-hidden="true" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-[#8E7035]">{t('collectorList.eyebrow')}</span>
          </div>
          <h2 id={`${emailId}-title`} className="mt-4 max-w-xl text-balance font-serif text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.025em] text-[#251B18] sm:text-5xl lg:text-[3.5rem]">
            {t('collectorList.title')}
          </h2>
          <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-[#5C5149] sm:text-xl">{t('collectorList.subtitle')}</p>
          <p className="mt-5 max-w-xl border-t border-[#D8CEB8] pt-4 font-sans text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-[#74695F] sm:text-[10px]">{t('collectorList.benefits')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="relative border border-[#D8CEB8] bg-[#FFFEFC] p-5 shadow-[0_18px_50px_rgba(70,48,30,0.07)] sm:p-7 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[#541520]" aria-hidden="true" />
          <label htmlFor={emailId} className="block font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#655A51]">
            {t('collectorList.emailLabel')}
          </label>
          <div className="mt-2.5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7035]" aria-hidden="true" />
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
                className="min-h-14 w-full border border-[#CFC4B3] bg-white py-3 pl-11 pr-4 font-serif text-base text-[#251B18] placeholder:text-[#81766B] focus:border-[#8E7035] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="group flex min-h-14 items-center justify-between gap-6 bg-[#541520] px-5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-[#6B1D2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7035] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFEFC] disabled:cursor-wait disabled:opacity-65 md:justify-center"
            >
              <span>{status === 'loading' ? t('collectorList.submitting') : t('collectorList.submit')}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </div>

          <div className="sr-only" aria-hidden="true">
            <label htmlFor={`${emailId}-website`}>Website</label>
            <input id={`${emailId}-website`} name="website" tabIndex="-1" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <div className="mt-5 flex items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onFocus={markStarted}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#541520] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7035]"
            />
            <label htmlFor={consentId} className="font-sans text-[11px] leading-[1.65] text-[#655A51] sm:text-xs">
              {t('collectorList.consent')}{' '}
              <a href={localizePath('/privacy', language)} className="font-semibold text-[#541520] underline decoration-[#B8860B]/60 underline-offset-2 hover:text-[#8E7035]">
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
              className={`mt-5 flex items-start gap-2.5 border px-4 py-3 font-sans text-xs leading-relaxed ${status === 'success' ? 'border-emerald-700/25 bg-emerald-50 text-emerald-900' : 'border-red-700/25 bg-red-50 text-red-900'}`}
            >
              {status === 'success' ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span><strong className="block">{status === 'success' ? t('collectorList.successTitle') : ''}</strong>{feedback}</span>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 border-t border-[#E5DCCF] pt-4 font-sans text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[#7B7168]">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            {t('collectorList.privacyPromise')}
          </p>
        </form>
      </div>
    </section>
  );
}
