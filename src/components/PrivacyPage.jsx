import React from 'react';
import LegalDocument, { BUSINESS, BusinessIdentity, LegalLink } from './LegalDocument';

const BulletList = ({ children }) => <ul>{children}</ul>;

export default function PrivacyPage({ onNavigateHome, onRequestConsultation }) {
  const sections = [
    {
      id: 'verantwoordelijke',
      title: 'Wie is verantwoordelijk?',
      content: <>
        <p><strong>{BUSINESS.legalName}</strong>, handelend onder de naam <strong>{BUSINESS.tradeName}</strong>, is de verwerkingsverantwoordelijke voor de persoonsgegevens die via deze website en bij onze dienstverlening worden verwerkt.</p>
        <BusinessIdentity />
      </>,
    },
    {
      id: 'gegevens',
      title: 'Welke gegevens verwerken wij?',
      content: <>
        <p>Afhankelijk van uw contact met ons kunnen wij de volgende gegevens verwerken:</p>
        <BulletList>
          <li><strong>Identificatie- en contactgegevens:</strong> naam, e-mailadres, telefoonnummer, adres en uw voorkeurskanaal voor contact.</li>
          <li><strong>Aanvraag- en correspondentiegegevens:</strong> uw bericht, het betrokken object, afspraken, biedingen en verdere correspondentie.</li>
          <li><strong>Transactiegegevens:</strong> bestel-, betaal-, factuur-, leverings-, retour- en verzekeringsgegevens. Wij ontvangen geen volledige betaalkaartgegevens wanneer een betalingsdienstverlener de betaling verwerkt.</li>
          <li><strong>Object- en certificatiedossier:</strong> gegevens die nodig zijn voor herkomstonderzoek, facturatie, levering en een eventueel certificaat, waaronder de naam van de eigenaar wanneer dat noodzakelijk is.</li>
          <li><strong>Technische en analytische gegevens:</strong> tijdstip, aangevraagde pagina, apparaat- en browserinformatie, ruwe schatting van uw land (op basis van tijdzone), website-interacties (zoals scroll- en klikgedrag) en technische loggegevens die hosting- en beveiligingssystemen automatisch kunnen verwerken. Wij slaan uw IP-adres <strong>niet</strong> op in onze eigen analysesystemen.</li>
          <li><strong>Voorkeuren:</strong> de gekozen taal en functionele instellingen die lokaal in uw browser worden bewaard.</li>
        </BulletList>
        <p>Wij vragen u geen gevoelige persoonsgegevens mee te delen. Doet u dat toch in een vrij tekstveld, dan verwijderen wij die informatie zodra zij niet noodzakelijk is.</p>
      </>,
    },
    {
      id: 'doeleinden',
      title: 'Waarom en op welke rechtsgrond?',
      content: <>
        <div className="legal-table-wrap">
          <table>
            <thead><tr><th>Doel</th><th>Rechtsgrond</th></tr></thead>
            <tbody>
              <tr><td>Uw aanvraag beantwoorden, een bezichtiging organiseren, een offerte opstellen en precontractuele stappen zetten.</td><td>Uitvoering van uw verzoek vóór een overeenkomst; uitvoering van de overeenkomst.</td></tr>
              <tr><td>Verkoop, betaling, facturatie, levering, retour, verzekering en certificatie afhandelen.</td><td>Uitvoering van de overeenkomst; wettelijke verplichtingen.</td></tr>
              <tr><td>Boekhouding, fiscale administratie en medewerking aan bevoegde overheden.</td><td>Wettelijke verplichting.</td></tr>
              <tr><td>Fraude, misbruik en beveiligingsincidenten voorkomen en juridische aanspraken vaststellen.</td><td>Ons gerechtvaardigd belang in een veilige dienstverlening en rechtsbescherming.</td></tr>
              <tr><td>U op uw verzoek informeren over nieuwe aanwinsten.</td><td>Uw toestemming; die kan u altijd intrekken.</td></tr>
              <tr><td>Inzicht verkrijgen in websitegebruik, verkeersbronnen en prestaties om de website te verbeteren.</td><td>Ons gerechtvaardigd belang om het functioneren en de effectiviteit van onze website te meten door middel van privacyvriendelijke first-party analytics (zonder opslag van IP-adressen).</td></tr>
              <tr><td>Uw taalkeuze onthouden en de gevraagde websitefuncties leveren.</td><td>Gerechtvaardigd belang en de door u gevraagde elektronische dienst.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Wanneer gegevens nodig zijn om een overeenkomst te sluiten of aan een wettelijke verplichting te voldoen, kan het ontbreken ervan betekenen dat wij uw aanvraag of aankoop niet kunnen afhandelen.</p>
      </>,
    },
    {
      id: 'herkomst',
      title: 'Hoe verkrijgen wij uw gegevens?',
      content: <>
        <p>Meestal ontvangen wij gegevens rechtstreeks van u, bijvoorbeeld via het aanvraagformulier, e-mail, telefoon of tijdens een bezichtiging. Voor herkomstonderzoek of een transactie kunnen wij ook gegevens ontvangen van uw vertegenwoordiger, een vervoerder, betalingsdienstverlener, openbare registers of professionele adviseurs. Wanneer de AVG dit vereist, informeren wij u uiterlijk binnen één maand of bij ons eerste contact over die indirect verkregen gegevens.</p>
      </>,
    },
    {
      id: 'ontvangers',
      title: 'Met wie delen wij gegevens?',
      content: <>
        <p>Wij verkopen uw persoonsgegevens niet. Alleen wie de gegevens nodig heeft voor zijn taak krijgt toegang. Mogelijke ontvangers zijn:</p>
        <BulletList>
          <li><strong>IT- en cloudleveranciers,</strong> waaronder Supabase voor database- en authenticatiediensten en Vercel voor hosting en serverfuncties;</li>
          <li><strong>professionele dienstverleners,</strong> zoals accountant, juridisch adviseur, verzekeraar, betalingsdienstverlener en gespecialiseerde vervoerder;</li>
          <li><strong>deskundigen en onderzoeksinstellingen</strong> wanneer dit nodig is voor een door u gevraagde expertise of herkomstcontrole, met zo weinig mogelijk identificerende gegevens;</li>
          <li><strong>bevoegde overheden</strong> wanneer wij wettelijk verplicht zijn gegevens te verstrekken.</li>
        </BulletList>
        <p>Deze partijen handelen als verwerker volgens onze instructies of als zelfstandig verantwoordelijke onder hun eigen wettelijke plichten.</p>
      </>,
    },
    {
      id: 'doorgifte',
      title: 'Doorgifte buiten de EER',
      content: <>
        <p>Sommige technische leveranciers kunnen persoonsgegevens vanuit of buiten de Europese Economische Ruimte verwerken. In dat geval gebruiken wij een rechtsgeldig doorgiftemechanisme, zoals een adequaatheidsbesluit of de standaardcontractbepalingen van de Europese Commissie, aangevuld met passende maatregelen waar nodig. U kunt via ons contactadres informatie of een kopie van de relevante waarborgen vragen.</p>
      </>,
    },
    {
      id: 'bewaren',
      title: 'Hoe lang bewaren wij gegevens?',
      content: <>
        <p>Wij bewaren gegevens niet langer dan noodzakelijk en hanteren in beginsel deze termijnen:</p>
        <BulletList>
          <li><strong>Onbeantwoorde of afgesloten aanvragen:</strong> maximaal 24 maanden na het laatste inhoudelijke contact.</li>
          <li><strong>Contract-, factuur-, betaal- en leveringsgegevens:</strong> 10 jaar vanaf 1 januari van het jaar dat volgt op het relevante document, of langer wanneer een wettelijke procedure dit vereist.</li>
          <li><strong>Certificaat- en herkomstdossiers:</strong> zolang dit redelijkerwijs nodig is om authenticiteit, eigendomsgeschiedenis en afgegeven documentatie te kunnen verifiëren. Wij beperken het dossier tot wat daarvoor noodzakelijk is.</li>
          <li><strong>Technische beveiligingslogs:</strong> in beginsel maximaal 12 maanden, tenzij een incident langer onderzoek vereist.</li>
          <li><strong>Taalvoorkeur:</strong> maximaal 12 maanden na plaatsing; u kunt deze eerder via uw browser wissen.</li>
        </BulletList>
        <p>Na afloop verwijderen of anonimiseren wij de gegevens veilig.</p>
      </>,
    },
    {
      id: 'cookies',
      title: 'Cookies, lokale opslag en analyse',
      content: <>
        <p>Onze publieke website plaatst <strong>geen tracking- of advertentiecookies van derde partijen</strong>. Wel gebruiken wij een eigen, privacyvriendelijk en anoniem analysesysteem om het websitegebruik te meten. Hierbij maken wij gebruik van de volgende browseropslag:</p>
        <div className="legal-table-wrap">
          <table>
            <thead><tr><th>Naam / techniek</th><th>Doel</th><th>Duur</th></tr></thead>
            <tbody>
              <tr><td><code>atelier_language</code> (local storage)</td><td>De door u gekozen taal onthouden.</td><td>Maximaal 12 maanden.</td></tr>
              <tr><td><code>analytics_visitor_id</code> (local storage)</td><td>Genereren van geanonimiseerde bezoekersstatistieken en analyseren van websitegebruik, uitsluitend voor eigen inzichten (first-party analytics).</td><td>Maximaal 12 maanden.</td></tr>
              <tr><td>Service-worker cache</td><td>Statische websitebestanden sneller en stabieler laden; bevat geen formulierinhoud.</td><td>Tot de cache door een nieuwe versie wordt vervangen of door u wordt gewist.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Browseropslag kan via uw browserinstellingen worden gewist. Als later niet-noodzakelijke cookies of vergelijkbare technieken worden toegevoegd, vragen wij vooraf geldige toestemming en passen wij deze verklaring aan.</p>
      </>,
    },
    {
      id: 'rechten',
      title: 'Uw privacyrechten',
      content: <>
        <p>Voor zover de wettelijke voorwaarden zijn vervuld, heeft u recht op inzage, een kopie, verbetering, wissing, beperking, overdraagbaarheid en bezwaar. Bij verwerking op basis van toestemming kunt u die toestemming altijd intrekken zonder dat dit de eerdere verwerking onrechtmatig maakt. U kunt ook bezwaar maken tegen direct marketing; dat bezwaar geldt onvoorwaardelijk.</p>
        <p>Stuur uw verzoek naar <LegalLink href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</LegalLink>. Wij kunnen redelijke informatie vragen om uw identiteit te controleren. Wij antwoorden kosteloos, zonder onnodige vertraging en uiterlijk binnen één maand. Bij een complex verzoek of meerdere verzoeken kan die termijn wettelijk met twee maanden worden verlengd; daarover informeren wij u binnen de eerste maand.</p>
      </>,
    },
    {
      id: 'besluitvorming',
      title: 'Geautomatiseerde besluitvorming en beveiliging',
      content: <>
        <p>Wij nemen geen besluiten met rechtsgevolgen of vergelijkbare aanzienlijke gevolgen die uitsluitend op geautomatiseerde verwerking, waaronder profilering, zijn gebaseerd.</p>
        <p>Wij nemen passende technische en organisatorische maatregelen, waaronder versleutelde verbindingen, toegangsbeperking, beveiligde authenticatie, beperkte beheerdersrechten en gecontroleerde back-ups. Geen enkel systeem is volledig risicoloos. Bij een meldingsplichtig datalek informeren wij de bevoegde autoriteit en, wanneer wettelijk vereist, de betrokken personen.</p>
      </>,
    },
    {
      id: 'klacht',
      title: 'Vragen, klachten en wijzigingen',
      content: <>
        <p>Neem bij een vraag of klacht eerst contact met ons op; wij proberen die zorgvuldig op te lossen. U heeft daarnaast altijd het recht een klacht in te dienen bij de <LegalLink href="https://www.gegevensbeschermingsautoriteit.be/burger/acties/klacht-indienen">Gegevensbeschermingsautoriteit</LegalLink>, Drukpersstraat 35, 1000 Brussel, +32 (0)2 274 48 00, of bij de toezichthouder van uw gewone verblijfplaats of werkplek.</p>
        <p>Wij kunnen deze verklaring aanpassen wanneer onze werkwijze of de wet wijzigt. De meest recente versie staat op deze pagina. Bij een wezenlijke wijziging informeren wij betrokkenen via een passend kanaal.</p>
      </>,
    },
  ];

  return (
    <LegalDocument
      documentNumber="01"
      eyebrow="Privacy & gegevensbescherming"
      title="Privacybeleid"
      summary="Heldere informatie over welke persoonsgegevens Atelier Rembrandt verwerkt, waarom dat gebeurt, hoe lang ze worden bewaard en welke keuzes en rechten u heeft."
      sections={sections}
      onNavigateHome={onNavigateHome}
      onRequestConsultation={onRequestConsultation}
      contactTitle="Een vraag over uw gegevens?"
      contactText="We behandelen privacyvragen persoonlijk, vertrouwelijk en binnen de wettelijke termijn."
    />
  );
}
