import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './context/LanguageContext';
import { AnalyticsConsentBanner, flushAnalytics, trackEvent, useAnalytics } from './hooks/useAnalytics';
import { LETTER_PDF_TARGET, LETTER_PLACEMENT } from './utils/newsletter';
import './index.css';
import './newsletter.css';

function NewsletterAnalytics() {
  useAnalytics();
  return <AnalyticsConsentBanner />;
}

document.querySelector('.letter').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-letter-pdf], a[data-letter-link]');
  if (!link) return;

  const target = link.hasAttribute('data-letter-pdf')
    ? LETTER_PDF_TARGET
    : link.pathname.split('/').at(-1);
  if (trackEvent('cta_clicked', { placement: LETTER_PLACEMENT, target })) {
    flushAnalytics({ useBeacon: true });
  }
});

createRoot(document.getElementById('letter-consent')).render(
  <LanguageProvider>
    <NewsletterAnalytics />
  </LanguageProvider>
);
