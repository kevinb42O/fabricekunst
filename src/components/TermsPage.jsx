import React from 'react';
import LegalDocument, { BUSINESS, BusinessIdentity, LegalLink } from './LegalDocument';

const BulletList = ({ children }) => <ul>{children}</ul>;

export default function TermsPage({ onNavigateHome, onRequestConsultation }) {
  const sections = [
    {
      id: 'identiteit',
      title: 'Onderneming en definities',
      content: <>
        <BusinessIdentity />
        <p>In deze voorwaarden betekent <strong>Atelier Rembrandt</strong>: {BUSINESS.legalName}, handelend onder de handelsnaam Atelier Rembrandt; <strong>Koper</strong>: iedere persoon die een aanbod aanvraagt of een overeenkomst sluit; <strong>Consument</strong>: een natuurlijke persoon die hoofdzakelijk buiten zijn handels-, bedrijfs-, ambachts- of beroepsactiviteit handelt; en <strong>Object</strong>: ieder boek, manuscript, prent, schilderij of ander kunst- of verzamelobject.</p>
      </>,
    },
    {
      id: 'toepasselijkheid',
      title: 'Toepasselijkheid en voorrang',
      content: <>
        <p>Deze voorwaarden gelden voor onze catalogus, offertes, reserveringen, bezichtigingen en overeenkomsten. De versie die vóór of bij het sluiten van de overeenkomst aan de Koper is verstrekt, is van toepassing. Bij tegenstrijdigheid heeft een uitdrukkelijke, schriftelijke bijzondere afspraak voorrang.</p>
        <p>Dwingende consumentenrechten blijven altijd gelden. Afwijkende voorwaarden van een professionele Koper gelden alleen wanneer wij die uitdrukkelijk schriftelijk aanvaarden. De nietigheid van één bepaling tast de overige bepalingen niet aan; de ongeldige bepaling wordt vervangen door de geldige regel die het doel ervan het dichtst benadert.</p>
      </>,
    },
    {
      id: 'catalogus',
      title: 'Catalogus, afbeeldingen en conditie',
      content: <>
        <p>Wij beschrijven ieder Object zorgvuldig op basis van het onderzoek en de informatie die op dat moment beschikbaar zijn. Afmetingen, kleuren en beeldweergave kunnen beperkt afwijken door meetwijze, fotografie of scherminstellingen. Foto’s en een meegedeelde conditiebeschrijving maken deel uit van de contractuele informatie.</p>
        <p>Antiquarische Objecten zijn gebruikte en vaak unieke goederen. Normale, gemelde of bij een bezichtiging redelijkerwijs waarneembare ouderdomssporen — zoals patina, foxing, slijtage, oude restauraties of materiaalveroudering — vormen op zichzelf geen gebrek aan overeenstemming. Dit beperkt nooit de wettelijke rechten voor een niet-gemeld gebrek of een Object dat niet beantwoordt aan de overeenkomst.</p>
        <p>De Koper wordt uitgenodigd om vóór aankoop detailfoto’s, een conditierapport of een bezichtiging te vragen. Dat is een mogelijkheid en geen afstand van wettelijke rechten.</p>
      </>,
    },
    {
      id: 'authenticiteit',
      title: 'Toeschrijving, herkomst en documentatie',
      content: <>
        <p>Een toeschrijving, datering, herkomst of bibliografische conclusie is een zorgvuldig onderbouwde professionele beoordeling volgens de kennis en algemeen aanvaarde inzichten op het moment van verkoop. Wij vermelden bekende onzekerheden en maken duidelijk onderscheid tussen bijvoorbeeld “van”, “toegeschreven aan”, “atelier van”, “school van” en “naar”.</p>
        <p>De factuur, catalogusfiche en eventueel certificaat beschrijven de contractueel relevante kwalificaties. Nieuwe wetenschappelijke inzichten na de verkoop maken een eerdere, zorgvuldig geformuleerde opinie niet automatisch fout. Een uitdrukkelijke authenticiteitsgarantie of andere aanvullende garantie geldt volgens de schriftelijke voorwaarden daarvan, zonder afbreuk aan dwingende wettelijke conformiteitsrechten.</p>
      </>,
    },
    {
      id: 'overeenkomst',
      title: 'Aanbod, reservering en totstandkoming',
      content: <>
        <p>Een catalogusvermelding, prijsindicatie of informatieantwoord is geen bindend aanbod zolang wij beschikbaarheid, prijs, toepasselijke belastingen, levering en eventuele bijzondere voorwaarden niet schriftelijk hebben bevestigd. Een overeenkomst ontstaat wanneer de Koper ons definitieve aanbod binnen de geldigheidsduur aanvaardt en wij die aanvaarding bevestigen, of wanneer wij de uitvoering starten.</p>
        <p>Een reservering is alleen bindend voor de schriftelijk bevestigde duur en voorwaarden. Kennelijke schrijf-, reken- of prijsfouten binden ons niet wanneer de Koper redelijkerwijs moest begrijpen dat sprake was van een vergissing. Wij mogen een bestelling weigeren op objectieve gronden, zoals onbeschikbaarheid, wettelijke verplichtingen, sanctieregels of een aantoonbaar frauderisico.</p>
      </>,
    },
    {
      id: 'prijs',
      title: 'Prijs, belastingen en betaling',
      content: <>
        <p>Prijzen luiden in euro. Voor Consumenten vermelden wij de totale prijs inclusief toepasselijke btw of margeregeling en alle vooraf berekenbare kosten. De op de website vermelde of persoonlijk bevestigde aankoopprijs omvat wereldwijd verzekerde standaardverzending en de bij het Object behorende beschikbare certificaat- en objectdocumentatie. Eventuele invoerrechten, invoer-btw, lokale belastingen, bijzondere overheidsformaliteiten en door de Koper gevraagde afwijkende leveringsdiensten zijn niet inbegrepen, tenzij wij schriftelijk anders bevestigen. Voor professionele Kopers kan een prijs exclusief btw worden vermeld wanneer dat ondubbelzinnig is aangegeven.</p>
        <p>Betaling gebeurt via de op de offerte of factuur vermelde methode en termijn. Het Object blijft eigendom van Atelier Rembrandt tot de volledige prijs en overeengekomen kosten zijn ontvangen. Voor ingebrekestelling, rente en invorderingskosten gelden de dwingende Belgische regels; tegenover Consumenten worden geen kosten aangerekend zonder de wettelijk vereiste kosteloze herinnering en termijnen.</p>
      </>,
    },
    {
      id: 'levering',
      title: 'Levering, verzekering en risico',
      content: <>
        <p>Wij verpakken het Object volgens aard, conditie, waarde en bestemming en verzenden het wereldwijd via een passende verzekerde vervoerder. De verzekerde waarde en eventuele objectieve dekkings- of bestemmingsbeperkingen worden vóór het sluiten van de overeenkomst bevestigd. Wanneer standaard verzekerde verzending naar een bestemming wettelijk of feitelijk onmogelijk is, informeren wij de Koper vóór de overeenkomst en zoeken wij een passende oplossing. Tenzij anders overeengekomen leveren wij zonder onnodige vertraging en bij een Consumentenkoop uiterlijk binnen 30 dagen na de overeenkomst.</p>
        <p>Bij een Consumentenkoop gaat het risico pas over wanneer de Consument of een door hem aangewezen derde het Object fysiek ontvangt, behalve wanneer de Consument zelf een niet door ons aangeboden vervoerder kiest. Voor professionele Kopers gaat het risico over volgens de schriftelijk overeengekomen leveringsvoorwaarde.</p>
        <p>Controleer de verpakking bij ontvangst en meld zichtbare transportschade zo snel mogelijk, bij voorkeur met foto’s. Een laattijdige melding ontneemt een Consument geen dwingende rechten, maar kan het onderzoek of een verzekeringsclaim bemoeilijken.</p>
      </>,
    },
    {
      id: 'conformiteit',
      title: 'Wettelijke conformiteit en gebreken',
      content: <>
        <p>Voor Consumenten geldt de Belgische wettelijke garantie. Voor tweedehandsgoederen kan de wettelijke termijn alleen met uitdrukkelijk akkoord worden verkort tot minimaal één jaar; zonder zo’n afspraak geldt de wettelijke termijn van twee jaar vanaf levering.</p>
        <p>Bij een gebrek aan overeenstemming heeft de Consument recht op de wettelijke remedies. Omdat een Object vaak uniek is, kan vervanging onmogelijk zijn; ook herstel kan kunsthistorisch onverantwoord of onevenredig zijn. In dat geval gelden, volgens de wettelijke voorwaarden, een evenredige prijsvermindering of ontbinding. Meld een probleem via <LegalLink href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</LegalLink> met de factuurreferentie en relevante foto’s.</p>
        <p>Voor professionele Kopers geldt uitsluitend de garantie die in de bijzondere overeenkomst is opgenomen, met behoud van aansprakelijkheid die wettelijk niet kan worden uitgesloten.</p>
      </>,
    },
    {
      id: 'herroeping',
      title: 'Herroepingsrecht bij verkoop op afstand',
      content: <>
        <p>Een Consument die een overeenkomst op afstand of buiten de verkoopruimte sluit, kan die in beginsel zonder reden herroepen binnen 14 kalenderdagen vanaf de dag na ontvangst van het Object. Bij één bestelling met afzonderlijke leveringen begint de termijn na ontvangst van het laatste Object.</p>
        <p>De Consument herroept vóór het einde van de termijn met een ondubbelzinnige verklaring aan <LegalLink href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</LegalLink> of per post aan onze maatschappelijke zetel. Het onderstaande modelformulier mag worden gebruikt, maar is niet verplicht.</p>
        <div className="legal-form" aria-label="Modelformulier voor herroeping">
          <p><strong>Modelformulier voor herroeping</strong></p>
          <p>Aan: Atelier Rembrandt / {BUSINESS.legalName}, {BUSINESS.address}, {BUSINESS.email}</p>
          <p>Ik/Wij deel/delen u hierbij mee dat ik/wij onze overeenkomst betreffende de verkoop van het volgende Object herroep/herroepen:</p>
          <p>Omschrijving en referentie: …<br />Besteld op / ontvangen op: …<br />Naam Consument(en): …<br />Adres Consument(en): …<br />Datum: …<br />Handtekening (alleen bij papier): …</p>
        </div>
        <p>Na de melding heeft de Consument nog 14 dagen om het Object terug te sturen. De rechtstreekse retourkosten zijn voor de Consument. Gezien de aard en waarde moet de retour deugdelijk, traceerbaar en voor de volledige waarde verzekerd worden; neem vooraf contact op voor praktische instructies. Dit mag het herroepingsrecht niet onnodig bemoeilijken.</p>
        <p>Wij betalen de ontvangen prijs en de kosten van de goedkoopste aangeboden standaardlevering uiterlijk 14 dagen na de herroepingsmelding terug via hetzelfde betaalmiddel, tenzij anders overeengekomen. Wij mogen wachten tot wij het Object hebben ontvangen of de Consument bewijs van verzending verstrekt. De Consument is alleen aansprakelijk voor waardevermindering door gebruik dat verder gaat dan nodig om aard, kenmerken en werking vast te stellen.</p>
        <p>Het wettelijke herroepingsrecht geldt niet in de wettelijk bepaalde uitzonderingen, onder meer voor een volgens de specificaties van de Consument vervaardigd of duidelijk gepersonaliseerd goed. Aankopen die volledig in onze verkoopruimte worden gesloten, hebben geen wettelijk herroepingsrecht tenzij wij dat schriftelijk aanbieden.</p>
      </>,
    },
    {
      id: 'uitvoer',
      title: 'Uitvoer, cultuurgoederen en naleving',
      content: <>
        <p>De uitvoer of invoer van bepaalde cultuurgoederen kan een vergunning, douanedocument of andere toestemming vereisen. Wij delen vóór de overeenkomst mee welke bekende formaliteiten op onze levering van toepassing zijn. De Koper verstrekt correcte gegevens en werkt mee aan wettelijk vereiste controles. Geen van beide partijen hoeft een handeling te verrichten die strijdig is met sanctie-, douane-, antiwitwas- of cultuurgoederenwetgeving.</p>
        <p>Een vergunning is een overheidsbeslissing en kan daarom niet worden gegarandeerd. Als uitvoering definitief onmogelijk wordt door een weigering waarvoor geen partij verantwoordelijk is, zoeken partijen een wettelijke en redelijke oplossing, rekening houdend met reeds gemaakte, vooraf meegedeelde kosten.</p>
      </>,
    },
    {
      id: 'aansprakelijkheid',
      title: 'Aansprakelijkheid en overmacht',
      content: <>
        <p>Atelier Rembrandt is aansprakelijk volgens het toepasselijke recht voor schade die het voorzienbare en rechtstreekse gevolg is van een toerekenbare tekortkoming. Niets in deze voorwaarden beperkt aansprakelijkheid voor bedrog, opzettelijke of zware fout, aantasting van leven of lichamelijke integriteit, of andere aansprakelijkheid die wettelijk niet kan worden uitgesloten.</p>
        <p>Tegenover professionele Kopers is, voor zover wettelijk toegestaan, aansprakelijkheid voor indirecte schade uitgesloten en is de totale contractuele aansprakelijkheid beperkt tot het factuurbedrag van het betrokken Object. Deze beperking geldt niet in de gevallen genoemd in de vorige alinea.</p>
        <p>Een partij is niet aansprakelijk voor vertraging door een onvoorzienbare en onvermijdbare gebeurtenis buiten haar redelijke controle. Zij informeert de andere partij zo snel mogelijk en beperkt de gevolgen. Duurt de verhindering onredelijk lang, dan kunnen partijen het niet-uitgevoerde deel beëindigen volgens het toepasselijke recht.</p>
      </>,
    },
    {
      id: 'intellectueel',
      title: 'Intellectuele eigendom',
      content: <>
        <p>De aankoop van een Object draagt geen auteursrecht of ander intellectueel eigendomsrecht op afbeeldingen, teksten, onderzoek of het Object zelf over. Websitefotografie, catalogusteksten, vormgeving en onderzoeksmateriaal mogen niet commercieel worden gereproduceerd of gepubliceerd zonder voorafgaande schriftelijke toestemming, behalve voor zover een wettelijke uitzondering dat toestaat.</p>
      </>,
    },
    {
      id: 'klachten',
      title: 'Klachten en buitengerechtelijke regeling',
      content: <>
        <p>Stuur een klacht met factuur- of objectreferentie naar <LegalLink href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</LegalLink>. Wij bevestigen de ontvangst en proberen zo snel mogelijk een inhoudelijke oplossing te bieden.</p>
        <p>Is een consumentengeschil na rechtstreeks contact niet opgelost, dan kan de Consument kosteloos een beroep doen op de <LegalLink href="https://consumentenombudsdienst.be/">Consumentenombudsdienst</LegalLink>, Koning Albert II-laan 8 bus 1, 1000 Brussel, contact@consumentenombudsdienst.be, +32 (0)2 702 52 00. Deelname aan bemiddeling verhindert niet dat een partij later naar de rechter stapt.</p>
      </>,
    },
    {
      id: 'recht',
      title: 'Toepasselijk recht en bevoegde rechter',
      content: <>
        <p>Op de overeenkomst is Belgisch recht van toepassing. Een Consument behoudt de bescherming van dwingende bepalingen van het land van zijn gewone verblijfplaats wanneer die bescherming volgens het internationaal privaatrecht van toepassing is.</p>
        <p>Geschillen worden voorgelegd aan de rechter die volgens de wettelijke bevoegdheidsregels bevoegd is. Voor professionele Kopers zijn, voor zover wettelijk toegestaan, uitsluitend de rechtbanken van het gerechtelijk arrondissement van onze maatschappelijke zetel bevoegd.</p>
      </>,
    },
  ];

  return (
    <LegalDocument
      documentNumber="02"
      eyebrow="Verkoop & dienstverlening"
      title="Algemene voorwaarden"
      summary="De afspraken die gelden voor catalogusvermeldingen, bezichtigingen en de aankoop en levering van antiquarische boeken, prenten en kunstobjecten."
      sections={sections}
      onNavigateHome={onNavigateHome}
      onRequestConsultation={onRequestConsultation}
      contactTitle="Een voorwaarde bespreken vóór aankoop?"
      contactText="Voor elk object lichten we conditie, documentatie, levering en eventuele bijzondere afspraken graag persoonlijk toe."
    />
  );
}
