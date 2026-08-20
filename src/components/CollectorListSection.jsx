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
    <section aria-labelledby={`${emailId}-title`} className={`bg-white text-[#111111] ${className}`}>
      <div className="page-shell-wide py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16 xl:gap-24">
          <div className="lg:col-span-5">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#5B1420]">{t('collectorList.eyebrow')}</span>
            <h2 id={`${emailId}-title`} className="mt-6 max-w-xl text-balance font-serif text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.025em] text-[#111111] sm:text-5xl lg:text-[3.45rem]">
              {t('collectorList.title')}
            </h2>
            <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-[#545454] sm:text-xl">{t('collectorList.subtitle')}</p>
            <p className="mt-6 font-sans text-[9px] font-semibold uppercase leading-relaxed tracking-[0.15em] text-[#666666]">
              {t('collectorList.benefits')}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="lg:col-span-7">
            <label htmlFor={emailId} className="block font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#535353]">
              {t('collectorList.emailLabel')}
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative border-b-2 border-[#111111] transition-colors focus-within:border-[#5B1420]">
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
                  className="min-h-16 w-full bg-white px-0 py-3 font-serif text-xl text-[#111111] placeholder:text-[#898989] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group flex min-h-16 items-center justify-between gap-8 bg-[#5B1420] px-6 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#741B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:opacity-65 sm:justify-center"
              >
                <span>{status === 'loading' ? t('collectorList.submitting') : t('collectorList.submit')}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>

            <div className="sr-only" aria-hidden="true">
              <label htmlFor={`${emailId}-website`}>Website</label>
              <input id={`${emailId}-website`} name="website" tabIndex="-1" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </div>

            <div className="mt-7 flex items-start gap-3">
              <input
                id={consentId}
                type="checkbox"
                checked={consent}
                onFocus={markStarted}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#5B1420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]"
              />
              <label htmlFor={consentId} className="font-sans text-[11px] leading-[1.65] text-[#555555] sm:text-xs">
                {t('collectorList.consent')}{' '}
                <a href={localizePath('/privacy', language)} className="font-semibold text-[#5B1420] underline decoration-[#5B1420]/40 underline-offset-2 hover:text-[#111111]">
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

            <p className="mt-6 flex items-start gap-2 font-sans text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[#737373]">
              <LockKeyhole className="h-3 w-3" aria-hidden="true" />
              {t('collectorList.privacyPromise')}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
