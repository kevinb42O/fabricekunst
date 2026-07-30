import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowLeft, Mail, Phone, Globe, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

export default function PrivacyPage({ onNavigateHome, onRequestConsultation }) {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isFr = language === 'fr';
  const isEn = language === 'en';

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans pb-24 pt-28 sm:pt-36">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb / Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-2 text-xs font-serif tracking-widest text-[#8E7035] hover:text-[#B8860B] transition-colors uppercase cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isFr ? 'Retour à l\'Accueil' : isEn ? 'Back to Home' : 'Terug naar Homepage'}</span>
          </button>
        </motion.div>

        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: LUXURY_EASE }}
          className="bg-white border border-[#E8E2D5] rounded-xl p-8 sm:p-12 shadow-sm mb-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 text-xs tracking-[0.25em] text-[#8E7035] uppercase font-serif font-semibold mb-4">
            <Shield className="w-4 h-4 text-[#B8860B]" />
            <span>{isFr ? 'Protection des Données & AVG/GDPR' : isEn ? 'Data Protection & GDPR' : 'Gegevensbescherming & AVG'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#111111] font-semibold tracking-tight mb-4 leading-tight">
            {isFr ? 'Politique de Confidentialité' : isEn ? 'Privacy Policy' : 'Privacybeleid'}
          </h1>

          <p className="text-sm sm:text-base text-[#555555] font-serif leading-relaxed max-w-2xl">
            {isFr
              ? 'Atelier Rembrandt s’engage à protéger la vie privée et les données personnelles de ses collectionneurs et visiteurs avec la plus grande discrétion et rigueur.'
              : isEn
              ? 'Atelier Rembrandt is committed to protecting the privacy and personal data of its collectors and visitors with utmost discretion and rigor.'
              : 'Atelier Rembrandt hecht de hoogste waarde aan de bescherming van de privacy en persoonsgegevens van haar verzamelaars en bezoekers. Wij handelen in volledige overeenstemming met de Algemene Verordening Gegevensbescherming (AVG / GDPR).'}
          </p>

          <div className="mt-8 pt-6 border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-4 text-xs font-serif text-[#666666]">
            <div className="flex flex-wrap items-center gap-4">
              <div><strong>{isFr ? 'Domaine:' : isEn ? 'Domain:' : 'Website:'}</strong> www.atelierrembrandt.com</div>
              <span className="text-[#D8CEB8]">|</span>
              <div><strong>{isFr ? 'Société:' : isEn ? 'Company:' : 'Rechtspersoon:'}</strong> Andor Comm V. (Atelier Rembrandt)</div>
              <span className="text-[#D8CEB8]">|</span>
              <div><strong>{isFr ? 'Dernière mise à jour:' : isEn ? 'Last Updated:' : 'Laatst bijgewerkt:'}</strong> 30 juli 2026</div>
            </div>
            <img src="/images/andor.jpeg" alt="Andor Comm V." className="h-7 w-auto object-contain opacity-90 filter contrast-105" />
          </div>
        </motion.div>

        {/* Content Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: LUXURY_EASE }}
          className="bg-white border border-[#E8E2D5] rounded-xl p-8 sm:p-12 shadow-sm space-y-10 text-[#333333] font-serif leading-relaxed text-sm sm:text-base"
        >

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 1</span>
              <span>1. Identiteit van de Verwerkingsverantwoordelijke</span>
            </h2>
            <p>
              De verantwoordelijke voor de verwerking van uw persoonsgegevens via de website <strong>www.atelierrembrandt.com</strong> is de rechtspersoon <strong>Andor Comm V.</strong>, handelend onder de benaming <strong>Atelier Rembrandt</strong>:
            </p>
            <div className="bg-white border border-[#E8E2D5] p-5 rounded-lg text-xs sm:text-sm space-y-3 text-[#444444] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="font-semibold text-[#111111] text-base">Atelier Rembrandt</p>
                <p className="text-xs text-[#666666]">Exploitatie & Rechtspersoon: <strong className="text-[#111111]">Andor Comm V.</strong></p>
                <p className="flex items-center space-x-2"><Globe className="w-3.5 h-3.5 text-[#B8860B]" /> <span>www.atelierrembrandt.com</span></p>
                <p className="flex items-center space-x-2"><Mail className="w-3.5 h-3.5 text-[#B8860B]" /> <span>contact@atelierrembrandt.com</span></p>
                <p className="flex items-center space-x-2"><Phone className="w-3.5 h-3.5 text-[#B8860B]" /> <span>+32 484 38 45 30</span></p>
              </div>
              <div className="shrink-0 flex flex-col items-center bg-white p-3 rounded-lg border border-[#E8E2D5]/80">
                <img src="/images/andor.jpeg" alt="Andor Comm V." className="h-12 w-auto object-contain" />
                <span className="text-[10px] text-[#888888] font-sans mt-1 tracking-wider uppercase">Andor Comm V.</span>
              </div>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 2</span>
              <span>2. Welke Persoonsgegevens Verwerken Wij?</span>
            </h2>
            <p>
              In het kader van onze diensten en de expositie van zeldzame antiquarische boeken en oude meesters kunnen wij de volgende categorieën gegevens verwerken:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#444444]">
              <li><strong>Contact- en Identificatiegegevens:</strong> Naam, e-mailadres, telefoonnummer en eventuele adresgegevens die u verstrekt bij een aanvraag voor een privébezichtiging, optie of informatieverzoek.</li>
              <li><strong>Correspondentie & Aanvragen:</strong> Inhoud van uw correspondentie, vragen over herkomst (provenance), taxaties of specifieke objecten in de catalogus.</li>
              <li><strong>Transactie- & Certificaatgegevens:</strong> Gegevens benodigd voor de opmaak van een formeel Echtheidscertificaat (Certificate of Authenticity), facturatie en verzekerde transportlevering bij aankoop.</li>
              <li><strong>Technische & Geanonimiseerde Gegevens:</strong> IP-adres, browsertype, apparaatgegevens en geanonimiseerde bezoeksstatistieken voor de technische beveiliging en werking van www.atelierrembrandt.com.</li>
            </ul>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 3</span>
              <span>3. Doeleinden en Rechtsgrondslagen van de Verwerking</span>
            </h2>
            <p>
              Wij verwerken uw persoonsgegevens uitsluitend voor de volgende rechtmatige doeleinden (conform art. 6 AVG):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white">
                <h4 className="font-semibold text-[#111111] mb-1 text-sm">Uitvoering van een Overeenkomst</h4>
                <p className="text-xs text-[#666666]">Het afhandelen van uw aanvragen voor bezichtiging, verkoop, opmaak van certificaten en geconditioneerd transport.</p>
              </div>
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white">
                <h4 className="font-semibold text-[#111111] mb-1 text-sm">Wettelijke Verplichting</h4>
                <p className="text-xs text-[#666666]">Voldoen aan fiscale, administratieve en boekhoudkundige wetgeving en bewaarplichten voor kunstransacties.</p>
              </div>
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white">
                <h4 className="font-semibold text-[#111111] mb-1 text-sm">Gerechtvaardigd Belang</h4>
                <p className="text-xs text-[#666666]">Beveiliging van onze digitale infrastructuur, preventie van misbruik en het bieden van persoonlijke service aan verzamelaars.</p>
              </div>
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white">
                <h4 className="font-semibold text-[#111111] mb-1 text-sm">Toestemming</h4>
                <p className="text-xs text-[#666666]">Wanneer u ons expliciet verzoekt om u te informeren over nieuwe aanwinsten of zeldzame topstukken.</p>
              </div>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 4</span>
              <span>4. Bewaartermijnen</span>
            </h2>
            <p>
              Atelier Rembrandt bewaart uw persoonsgegevens niet langer dan strikt noodzakelijk is om de doelen te realiseren waarvoor uw gegevens worden verzameld:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-[#444444]">
              <li><strong>Contact- & Informatieaanvragen:</strong> Maximaal 24 maanden na het laatste contact, tenzij er een vervolgaankoop of bezichtigingsafspraak uit voortvloeit.</li>
              <li><strong>Transactie- & Certificaatdocumenten:</strong> 7 jaar conform de wettelijke fiscale bewaarplicht voor administratie en verkopen.</li>
              <li><strong>Echtheidsarchieven:</strong> Om de herkomst (provenance) en geldigheid van afgegeven echtheidscertificaten op lange termijn te waarborgen, worden historische echtheidscodes vertrouwelijk bewaard.</li>
            </ul>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 5</span>
              <span>5. Delen van Persoonsgegevens met Derden</span>
            </h2>
            <p>
              Atelier Rembrandt verkoopt, verhuurt of deelt uw gegevens <strong>nooit</strong> met derden voor commerciële of marketingdoeleinden. Persoonsgegevens worden uitsluitend verstrekt aan derden indien dit noodzakelijk is voor de uitvoering van onze overeenkomst met u of om te voldoen aan een wettelijke verplichting.
            </p>
            <p className="text-xs text-[#666666]">
              Voorbeelden van strikt gecertificeerde verwerkers zijn onze beveiligde hostingprovider (Supabase / Cloud infrastructure), e-mail- & authenticatiediensten, en gespecialiseerde kunstkoeriers bij geconditioneerd transport. Met alle verwerkers zijn verwerkersovereenkomsten gesloten die voldoen aan de eisen van de AVG.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 6</span>
              <span>6. Uw Rechten als Betrokkene (AVG)</span>
            </h2>
            <p>
              U heeft op grond van de Europese Algemene Verordening Gegevensbescherming diverse rechten met betrekking tot uw persoonsgegevens:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
                <span><strong>Recht op Inzage:</strong> U kunt kosteloos opvragen welke gegevens wij van u verwerken.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
                <span><strong>Recht op Rectificatie:</strong> U kunt onjuiste of onvolledige gegevens laten corrigeren.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
                <span><strong>Recht op Gegevenswissing:</strong> U kunt verzoeken uw gegevens te wissen ("recht om vergeten te worden").</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
                <span><strong>Recht op Beperking & Bezwaar:</strong> U kunt bezwaar maken tegen verwerking of verzoeken deze te beperken.</span>
              </div>
              <div className="flex items-start space-x-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
                <span><strong>Recht op Overdraagbaarheid:</strong> U heeft het recht uw gegevens in een gestructureerd en gangbaar digitaal formaat te ontvangen.</span>
              </div>
            </div>
            <p className="pt-2 text-xs text-[#555555]">
              Wilt u gebruikmaken van een van deze rechten? Stuur dan een schriftelijk verzoek naar <a href="mailto:contact@atelierrembrandt.com" className="text-[#B8860B] underline font-semibold">contact@atelierrembrandt.com</a>. Wij reageren binnen 14 werkdagen op uw verzoek.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 7</span>
              <span>7. Beveiliging van uw Gegevens</span>
            </h2>
            <p>
              Atelier Rembrandt neemt de bescherming van uw gegevens uitermate serieus en neemt passende technische en organisatorische maatregelen om misbruik, verlies, onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde wijziging tegen te gaan. Onze website maakt gebruik van een betrouwbaar SSL/TLS-certificaat (HTTPS) om te borgen dat uw persoonsgegevens niet in verkeerde handen vallen.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 8</span>
              <span>8. Cookies & Analytics</span>
            </h2>
            <p>
              www.atelierrembrandt.com gebruikt uitsluitend functionele en privacy-vriendelijke analytische cookies die geen inbreuk maken op uw privacy. Een cookie is een klein tekstbestand dat bij het eerste bezoek aan deze website wordt opgeslagen op uw computer, tablet of smartphone. De cookies die wij gebruiken zijn noodzakelijk voor de technische werking van de website en uw gebruiksgemak. U kunt zich afmelden voor cookies door uw internetbrowser zo in te stellen dat deze geen cookies meer opslaat.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 9</span>
              <span>9. Klachten & Toezichthoudende Autoriteit</span>
            </h2>
            <p>
              Mocht u een klacht hebben over de verwerking van uw persoonsgegevens, dan vragen wij u hierover direct contact met ons op te nemen via contact@atelierrembrandt.com. U heeft tevens altijd het recht om een klacht in te dienen bij de bevoegde Gegevensbeschermingsautoriteit (GBA in België / Autoriteit Persoonsgegevens in Nederland).
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 10</span>
              <span>10. Wijzigingen in dit Privacybeleid</span>
            </h2>
            <p>
              Atelier Rembrandt behoudt zich het recht voor om dit privacybeleid aan te passen. Wijzigingen zullen op deze pagina worden gepubliceerd met vermelding van de datum van de meest recente herziening. Wij raden u aan dit privacybeleid regelmatig te raadplegen.
            </p>
          </section>

        </motion.div>

        {/* Bottom CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 text-center bg-white border border-[#E8E2D5] rounded-xl p-8 space-y-4"
        >
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Vragen over ons privacybeleid of gegevensbeheer?</h3>
          <p className="text-xs sm:text-sm text-[#666666] font-serif max-w-xl mx-auto">
            Onze experts staan u graag discreet te woord voor toelichting of verzoeken.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={onRequestConsultation}
              className="px-6 py-2.5 bg-[#111111] text-white text-xs font-serif tracking-widest uppercase rounded-lg hover:bg-[#8E7035] transition-colors cursor-pointer"
            >
              Contact opnemen
            </button>
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 border border-[#111111] text-[#111111] text-xs font-serif tracking-widest uppercase rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              Terug naar Galerie
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
