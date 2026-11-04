---
target: Lost Rembrandt overzicht en individuele projecten na alle fixes
total_score: 25
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 2
target_identity: "file:/Users/kevin/PROJECTS/FabriceBoekenKunst/src/components/RembrandtProjectPage.jsx"
target_fingerprint: "sha256:0efe480535334c7936bc7703a41de3e6846bb54e26d68209c2c019a6fada618f"
target_path: /Users/kevin/PROJECTS/FabriceBoekenKunst/src/components/RembrandtProjectPage.jsx
timestamp: 2026-10-31T03-25-28Z
slug: src-components-rembrandtprojectpage-jsx
---
Method: dual-agent (A: /root/design_review · B: /root/browser_evidence)

# Lost Rembrandt — beoordeling na de fixes

Beoordeeld op 31 oktober 2026: actuele lokale broncode en een kopie van de publieke projectinhoud met de bijgewerkte inleiding. Geen beoordeling van een nieuwe live deployment. Desktop en mobiel, overzicht en alle drie de dossiers. Geen productie-inhoud gewijzigd.

## Oordeel

72/100. Een overtuigende visuele identiteit met nog onvoldoende redactionele precisie en een onvolledige beeldpresentatie. De ervaring verdient vooral een beter verband tussen beeld, bevinding, beperking en volgende stap.

| Oppervlak | Score | Beoordeling |
|---|---:|---|
| Overzicht | 78/100 | Werk eerder zichtbaar, duidelijke bezoekersintroductie en twee begrijpelijke hoofdacties. Programmastatus kan ten onrechte als dezelfde fase voor alle dossiers worden gelezen. |
| Project 01 | 73/100 | Twee publieke onderzoeksstappen geven echte inhoud. Een lange beeldreeks vertraagt de uitleg. |
| Project 02 | 70/100 | Drie onderzoeksbeelden geven geloofwaardige inhoud; de uitgebreide tijdlijnvorm past onvoldoende bij nul publieke updates. |
| Project 03 | 67/100 | Eerlijke eerste-beoordelingsstatus, maar de volledige dossieropbouw is te groot voor de beschikbare publieke inhoud. De enige afbeelding mist een volledige weergave. |

Deze scores zijn een ontwerp- en redactioneel oordeel, geen wetenschappelijke beoordeling van de schilderijen.

## Heuristieken

| # | Heuristiek | Score | Kern |
|---|---|---:|---|
| 1 | Zichtbaarheid van status | 3/4 | Fases, datums en bewijslabels aanwezig; publieke omvang van 02/03 wordt laat duidelijk. |
| 2 | Aansluiting op de leefwereld | 3/4 | Geschikte kunstcontext, maar provenance/drager/pasteuze vragen voorkennis. |
| 3 | Controle en vrijheid | 3/4 | Teruglinks, ankers, native dialog Escape en focusterugkeer werken. |
| 4 | Consistentie | 3/4 | Samenhangend systeem; verschillende toegang tot bevinding en dossier begrijpelijk maar niet volledig uniform. |
| 5 | Foutpreventie | 3/4 | Verplichte velden, bestandseisen en toestemming aanwezig. Eenheden en onzekerheid bij afmetingen/drager onduidelijk. |
| 6 | Herkenning boven onthouden | 3/4 | Index en sectienamen helpen; grote afstand tussen beelden en interpretatie belast het geheugen. |
| 7 | Efficiëntie voor ervaren gebruikers | n/a | Geen relevante eis voor deze redactionele Experience-oppervlakken. |
| 8 | Esthetiek en eenvoud | 2/4 | Sterke sfeer; beeldreeksen en herhaalde status/kwalificatie verlagen informatiedichtheid. |
| 9 | Foutherstel | 2/4 | Algemene onderaanmelding, geen foutassociatie of focus op eerste ongeldige veld. |
| 10 | Hulp | 3/4 | Goede context voor uploads en vertrouwelijkheid; antwoordbeleid blijft onduidelijk. |
| | Totaal | 25/36 | 69,4%, bruikbaar met duidelijke verbeterpunten. |

De heuristische deelscore meet bruikbaarheid; 72/100 neemt ook inhoud en beeldpresentatie mee. Geen betrouwbare voormeting beschikbaar.

## Wat werkt en eigen karakter

De schilderijen, laboratoriumfoto’s, warme papierkleuren, bijna zwarte achtergronden, terughoudende goudaccenten en seriftypografie passen specifiek bij kunstonderzoek. Geen noodzaak voor een nieuwe visuele identiteit. Bewijslabels, datums, voorbehouden en volgende stappen maken onzekerheid zichtbaar. Het inzendformulier zet de noodzakelijke gegevens vooraan en klapt aanvullende gegevens in.

## Prioriteiten

1. **P1 — Volledige afbeeldingen bereikbaar maken.** Desktophero’s gebruiken vaste hoogte en object-fit:cover, waardoor ongeveer 55–59% van de bronhoogte overblijft. Project 03 heeft geen galerie of vergroting als alternatief. Toon de volledige beschikbare afbeelding of bied een heroactie voor volledige weergave. Een expliciete detailcrop kan daarnaast bestaan. Refs: src/components/RembrandtProjectPage.jsx:359; src/styles/rembrandt-project.css:1305. Aanpak: $impeccable adapt.

2. **P1 — Interpretatie vóór de lange RX-fotoreeks.** Project 01 toont cover plus vijf galeriebeelden vóór body en bevindingen. Op mobiel beginnen de kernbevindingen ongeveer 4338px onder het updatebegin. De vijf desktopbeelden zijn samen circa 4875px hoog, nog zonder bijschriften en tussenruimte. Zet observatie, beperking en volgende stap direct na de samenvatting, met één hoofdbeeld en compacte aanvullende beelden met uitleg per beeld. Refs: src/components/RembrandtProjectPage.jsx:174–186; src/styles/rembrandt-project.css:1349. Aanpak: $impeccable distill.

3. **P2 — Presentatie afstemmen op publicatiestatus en omvang.** Project 02 en 03 hebben geen publieke updates, maar wel de volledige kop “Het onderzoek, stap voor stap”. Presenteer compact status, beschikbare beelden, goedgekeurde intro en “nog geen publieke onderzoeksupdates”. Activeer de volledige tijdlijn bij echte publieke updates. Maak in de opening de huidige fase en publicatieomvang duidelijk. Geen resultaten, dateringen, afmetingen of instellingen verzinnen. Refs: src/components/RembrandtProjectPage.jsx:343–370. Aanpak: $impeccable clarify.

4. **P2 — Doorlopende publieksredactie.** “Vertrouwelijke inzending” blijft onder dossierhero’s staan. Beschrijvingen zoals “Alle geheimen werden nog niet prijsgegeven…” en “Gebruik van loodwit zoals zo vaal bij Rembrandt atelier” zijn geen neutrale visuele alternatieve teksten. Zichtbare bijschriften vallen soms terug op “Beeldmateriaal uit het onderzoeksdossier”. Herschrijf titels, intro’s, bijschriften en alt-teksten vanuit wat de bezoeker ziet en moet begrijpen. Houd observatie en interpretatie apart en wijzig geen feitelijke claims zonder inhoudelijke controle. Refs: src/components/RembrandtProjectPage.jsx:194–196, :243–255, :359; scratch/rembrandt-story/public-project.json. Aanpak: $impeccable clarify.

5. **P2 — Formulier en toegankelijkheidsdetails afwerken.** Na leeg indienen blijft focus op submit, zonder aria-invalid of aria-describedby per foutveld. De provenance-hulp is op mobiel circa 9,216px, invoervelden 14,4px. Geef veldgerichte foutmeldingen, focus eerste ongeldige veld en een gekoppelde samenvatting. Vermeld eenheden en help bij onbekende drager. Geef dialogen een toegankelijke naam en herstel h2 → h4 → h5 naar een logisch kopniveau. Refs: src/components/PaintingSubmissionForm.jsx:231–235, :264, :296–300, :372; src/components/RembrandtProjectPage.jsx:173, :253, :370; src/styles/rembrandt-project.css:1176. Aanpak: $impeccable harden en daarna $impeccable polish.

Geen P0 aangetroffen. Geen defect vastgesteld in Escape, focusterugkeer, afbeeldingsladen of pagina-overloop.

## Bezoekers en cognitieve belasting

Nieuwe bezoeker: de hoofdrichting is duidelijk; Project 03 maakt de beperkte publieke omvang pas laat duidelijk. Onderzoekende lezer: bewijslabels helpen, maar het verband tussen RX-beelden en interpretatie ligt te ver uiteen. Eigenaar: duidelijke vertrouwelijkheid en compacte essentiële velden; onvoldoende gerichte hulp bij fouten en onzekerheid over drager/afmetingen. Slechtziende/toetsenbordgebruiker: native disclosures en dialogbediening werken, maar kleine hulpteksten en generieke foutverwijzing verzwakken de ervaring.

Overzicht: matige cognitieve belasting door naslagkeuzes in methodes/achtergrond, niet doordat alle acties even belangrijk zijn. Project 01: matige belasting door werkgeheugen en onvoldoende progressieve onthulling van galeriedetail. 02/03: lage inhoudelijke complexiteit, maar veel scrollruimte voor weinig publieke inhoud.

## Emotionele ervaring

De blik van het portret wekt nieuwsgierigheid; de onderzoekbeelden maken het proces concreet. De vertrouwelijkheidsuitleg werkt bij het persoonlijke inzendmoment. Het zwakke moment volgt wanneer de lezer vooral algemene kwalificatie of een lange fotoreeks krijgt, terwijl de betekenis pas later komt. Een compact besluit per dossier over wat wel en nog niet gepubliceerd is zou sterker afsluiten.

## Kleinere observaties en technisch bewijs

Op mobiel is de sectienavigatie horizontaal schuifbaar, met de inzendlink aanvankelijk buiten beeld en verborgen scrollbar. Geen pagina-overloop. Geen header/anker-overlap gereproduceerd bij de geteste desktop- en mobiele maten. Galeriebeelden behouden hun bronverhouding; de hero-crop is de afzonderlijke fout. Native disclosures reageren op Enter. Afbeeldingsdialoog opent met Enter, krijgt sluitfocus, sluit met Escape en herstelt de oorspronkelijke focus.

CLI: JSX-scan schoon; scan met CSS geeft één overused-font-waarschuwing voor Plus Jakarta Sans op src/styles/rembrandt-project.css:1284. Dit is een smaakheuristiek, geen vastgesteld toegankelijkheidsdefect. De displaytypografie gebruikt Cormorant Garamond. Geen algemeen contrastprobleem vastgesteld.

Geen echte inzending/upload of volledige screenreadersessie getest. Browser-evaluate is alleen-lezen: geen muterende detectoroverlay uitgevoerd of geclaimd.

## Vervolgkeuzes

- Project 02/03 als compacte projectpreview, volledig dossier met expliciete nul-updatestatus, of pas zichtbaar na de eerste publieke update?
- Eerst beelden en leesvolgorde, eerst redactie en dossierinhoud, of alle vijf prioriteiten in één ronde?
