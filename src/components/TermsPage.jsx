import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, FileCheck, Truck, RotateCcw, Award, ArrowLeft, Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LUXURY_EASE } from '../utils/motion';

export default function TermsPage({ onNavigateHome, onRequestConsultation }) {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isFr = language === 'fr';
  const isEn = language === 'en';

  return (
    <div className="mobile-legal-page min-h-screen bg-white text-[#111111] font-sans pb-24 pt-24 sm:pt-36">
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
            className="inline-flex min-h-11 items-center space-x-2 text-xs font-serif tracking-widest text-[#8E7035] hover:text-[#B8860B] transition-colors uppercase cursor-pointer"
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
            <Scale className="w-4 h-4 text-[#B8860B]" />
            <span>{isFr ? 'Cadre Juridique & Conditions d\'Vente' : isEn ? 'Legal Terms & Gallery Conditions' : 'Juridisch Kader & Galerievoorwaarden'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#111111] font-semibold tracking-tight mb-4 leading-tight">
            {isFr ? 'Conditions Générales' : isEn ? 'Terms & Conditions' : 'Algemene Voorwaarden'}
          </h1>

          <p className="text-sm sm:text-base text-[#555555] font-serif leading-relaxed max-w-2xl">
            {isFr
              ? 'Les présentes conditions générales régissent l’ensemble des offres, expertises, consultations et transactions conclues avec Atelier Rembrandt.'
              : isEn
              ? 'These terms and conditions govern all offers, expertises, consultations, and transactions concluded with Atelier Rembrandt.'
              : 'Deze Algemene Voorwaarden zijn van toepassing op alle aanbiedingen, opties, bezichtigingen, offertes en overeenkomsten betrekking hebbend op antiquarische boeken, manuscripten en kunstwerken van Atelier Rembrandt.'}
          </p>

          <div className="mt-8 pt-6 border-t border-[#E8E2D5] flex flex-wrap items-center justify-between gap-4 text-xs font-serif text-[#666666]">
            <div className="flex flex-wrap items-center gap-4">
              <div><strong>{isFr ? 'Domaine:' : isEn ? 'Domain:' : 'Website:'}</strong> www.atelierrembrandt.com</div>
              <span className="text-[#D8CEB8]">|</span>
              <div><strong>{isFr ? 'Société:' : isEn ? 'Company:' : 'Rechtspersoon:'}</strong> Andor Comm V. (Atelier Rembrandt)</div>
              <span className="text-[#D8CEB8]">|</span>
              <div><strong>{isFr ? 'Dernière revision:' : isEn ? 'Last Revision:' : 'Laatst bijgewerkt:'}</strong> 30 juli 2026</div>
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
              <span>1. Definities</span>
            </h2>
            <p>In deze algemene voorwaarden wordt verstaan onder:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#444444]">
              <li><strong>Andor Comm V. / Atelier Rembrandt:</strong> De rechtspersoon <strong>Andor Comm V.</strong>, handelend onder de handelsnaam en galerie <strong>Atelier Rembrandt</strong> geëxploiteerd via de website <strong>www.atelierrembrandt.com</strong>, gespecialiseerd in zeldzame antiquarische boeken, 16e–18e-eeuwse drukken, gravures, oude meesters en historische kunstobjecten.</li>
              <li><strong>Koper / Verzamelaar:</strong> Iedere natuurlijke persoon of rechtspersoon die een informatieaanvraag doet, een optie of privébezichtiging aanvraagt, of een overeenkomst aangaat met Andor Comm V. / Atelier Rembrandt.</li>
              <li><strong>Antiquarisch Object / Kunstwerk:</strong> Elk zeldzaam boek, manuscript, prent, schilderij of kunsthistorisch voorwerp dat op www.atelierrembrandt.com of in het atelier te koop of ter bezichtiging wordt aangeboden.</li>
            </ul>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 2</span>
              <span>2. Toepasselijkheid</span>
            </h2>
            <p>
              Deze Algemene Voorwaarden zijn van toepassing op alle aanbiedingen, offertes, catalogusfiches, bezichtigingsafspraken, reserveringen en overeenkomsten tussen Atelier Rembrandt en de Koper via <strong>www.atelierrembrandt.com</strong> of in persoon. Afwijkingen van deze voorwaarden zijn slechts geldig indien deze uitdrukkelijk en schriftelijk door Atelier Rembrandt zijn aanvaard.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 3</span>
              <span>3. Catalogus, Beschrijving & Conditie van Antiquarische Werken</span>
            </h2>
            <p>
              Elk object in onze collectie wordt door experts onderzocht en met de grootst mogelijke kunsthistorische en bibliografische zorgvuldigheid gecatalogiseerd op www.atelierrembrandt.com.
            </p>
            <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg space-y-2 text-xs sm:text-sm text-[#444444]">
              <p><strong>Aard van Antiquarische Stukken:</strong> Gezien de historische ouderdom (veelal 16e, 17e of 18e eeuw) dragen antiquarische boeken, manuscripten en kunstwerken natuurlijke ouderdomssporen (zoals geringe foxing, marquinering, contemporaine lederen banden of patina). Deze sporen behoren tot de authentieke staat van het object.</p>
              <p><strong>Conditiebeschrijving:</strong> Belangrijke bijzonderheden of restauraties worden expliciet vermeld in de catalogusfiche. Hoge-resolutie detailfoto's vormen een integraal onderdeel van de beschrijving.</p>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 4</span>
              <span>4. Authenticiteitsverklaring & Documentatie</span>
            </h2>
            <div className="flex items-start space-x-3 bg-white border border-[#B8860B]/30 p-5 rounded-lg">
              <Award className="w-6 h-6 text-[#B8860B] shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs sm:text-sm">
                <h4 className="font-semibold text-[#111111]">Grondslag van de catalogisering</h4>
                <p className="text-[#444444]">
                  De factuur, catalogusfiche en eventuele aanvullende documentatie beschrijven de kenmerken, bronnen en onderzoeksbevindingen waarop de catalogisering berust. Toeschrijvingen en dateringen weerspiegelen de beschikbare informatie op het moment van verkoop. Een specifieke contractuele garantie geldt uitsluitend wanneer zij uitdrukkelijk en schriftelijk in de verkoopovereenkomst is opgenomen.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 5</span>
              <span>5. Aanvragen, Prijzen & Reserveringen</span>
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[#444444]">
              <li><strong>Prijzen:</strong> Alle vermelde of op aanvraag meegedeelde prijzen zijn luidende in Euro (€) en zijn inclusief eventuele toepasselijke marginale btw-regelingen voor gebruikte antiquarische goederen en kunst.</li>
              <li><strong>Vrijblijvendheid:</strong> Alle catalogusvermeldingen en prijsonopgaven zijn vrijblijvend, zolang het werk niet schriftelijk door Atelier Rembrandt is gereserveerd.</li>
              <li><strong>Opties & Reservering:</strong> Een optie op een zeldzaam object wordt uitsluitend bindend na schriftelijke of digitale bevestiging vanuit Atelier Rembrandt.</li>
            </ul>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 6</span>
              <span>6. Betaling & Eigendomsvoorbehoud</span>
            </h2>
            <p>
              Betaling dient te geschieden via bankoverschrijving of overeengekomen veilige betalingsmethode voorafgaand aan verzending of bij persoonlijke overdracht.
            </p>
            <p className="text-xs text-[#666666]">
              <strong>Eigendomsvoorbehoud:</strong> Alle geleverde antiquarische objecten blijven het volledige eigendom van Atelier Rembrandt totdat de Koper aan al zijn betalingsverplichtingen heeft voldaan.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 7</span>
              <span>7. Geconditioneerde Verpakking & Verzekerd Transport</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white flex items-start space-x-3">
                <Truck className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#111111] text-sm">Objectgerichte verpakking</h4>
                  <p className="text-xs text-[#666666] mt-1">De verpakking wordt afgestemd op materiaal, formaat, conditie en bestemming van het object.</p>
                </div>
              </div>
              <div className="border border-[#E8E2D5] p-4 rounded-lg bg-white flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#111111] text-sm">Verzekerd transport</h4>
                  <p className="text-xs text-[#666666] mt-1">De voorgestelde vervoerder, verzekerde waarde, dekking en eventuele uitsluitingen worden vóór verzending bevestigd.</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 8</span>
              <span>8. Herroepingsrecht & Retourvoorwaarden</span>
            </h2>
            <p>
              Consument-kopers hebben overeenkomstig de wettelijke bepalingen bij afstandskopen het recht om de aankoop binnen 14 kalenderdagen na ontvangst zonder opgave van redenen te herroepen.
            </p>
            <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg text-xs sm:text-sm space-y-2 text-[#444444]">
              <p><strong>Voorwaarden voor Retourontvangst:</strong> Retournering is uitsluitend toegestaan indien het antiquarische object zich in exact dezelfde, ongewijzigde en onbeschadigde staat bevindt als bij aflevering door Atelier Rembrandt, inclusief alle meegeleverde certificaten en originele verpakking.</p>
              <p><strong>Retourtransport:</strong> Het retourtransport dient via een gelijkwaardig geconditioneerde en volledig verzekerde koerier te worden uitgevoerd.</p>
            </div>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 9</span>
              <span>9. Intellectueel Eigendom & Auteursrechten</span>
            </h2>
            <p>
              Alle intellectuele eigendomsrechten, waaronder auteursrechten, merkrechten, hoge-resolutie fotografie, bibliografische analyses, omschrijvingen en beeldmateriaal gepubliceerd op <strong>www.atelierrembrandt.com</strong> berusten uitsluitend bij Atelier Rembrandt. Niets van deze website mag worden verveelvoudigd, gekopieerd of openbaar gemaakt zonder voorafgaande schriftelijke toestemming van Atelier Rembrandt.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 10</span>
              <span>10. Aansprakelijkheid & Overmacht</span>
            </h2>
            <p>
              De aansprakelijkheid van Atelier Rembrandt voor schade voortvloeiend uit of verband houdend met een overeenkomst of de werking van www.atelierrembrandt.com is te allen tijde beperkt tot maximaal het factuurbedrag van het specifieke object waarop de schade betrekking heeft. Atelier Rembrandt is niet aansprakelijk voor indirecte schade of overmachtssituaties.
            </p>
          </section>

          <hr className="border-[#E8E2D5]" />

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#111111] flex items-center space-x-3">
              <span className="text-xs font-sans text-[#8E7035] bg-white border border-[#E8E2D5] px-2.5 py-1 rounded-md">Art. 11</span>
              <span>11. Toepasselijk Recht & Bevoegde Rechter</span>
            </h2>
            <p>
              Op alle rechtsbetrekkingen tussen Atelier Rembrandt en de Koper is uitsluitend het recht van toepassing van het land waar Atelier Rembrandt haar hoofdvestiging heeft. Geschillen zullen bij uitsluiting worden voorgelegd aan de bevoegde rechter van de vestigingsplaats van Atelier Rembrandt, tenzij dwingend recht anders voorschrijft.
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
          <h3 className="text-lg font-serif font-semibold text-[#111111]">Vragen over onze galerievoorwaarden of aankoopgaranties?</h3>
          <p className="text-xs sm:text-sm text-[#666666] font-serif max-w-xl mx-auto">
            Neem gerust contact met ons op voor advies over reserveringen, bezichtigingen of de opmaak van een echtheidsdossier.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={onRequestConsultation}
              className="px-6 py-2.5 bg-[#111111] text-white text-xs font-serif tracking-widest uppercase rounded-lg hover:bg-[#8E7035] transition-colors cursor-pointer"
            >
              Plan Privé-Bezichtiging
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
