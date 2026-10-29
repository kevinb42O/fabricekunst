# Updates in het dashboard

De menukeuze **Updates** opent **Nieuw voor jou**. Het overzicht verwijst naar het nieuwste bericht. De eerste reeks bevat 51 Nederlandstalige berichten, afgeleid van de volledige Git-geschiedenis vanaf de eerste vastgelegde projectversie op 25 juli tot 27 oktober 2026. De lokale geschiedenis is op 29 oktober met `origin/main` vergeleken; beide eindigden op `e6dc535`.

De begindatum is gebaseerd op de eerste commit (`189bf08`). Oudere aangeleverde foto’s bewijzen geen eerdere aanmaakdatum van de website. De eerste versie bevatte al de homepage, collectie, objectpagina’s, herkomstpagina en een eerste beheeromgeving; latere uitbreidingen worden op hun eigen datum beschreven. De tijdlijn bundelt de 243 commits tot begrijpelijke berichten en maakt geen aparte melding voor elke technische tussenstap.

## Onderscheid tussen berichten

- **Nieuwe pagina** (`page`): een nieuwe pagina of zelfstandig onderdeel van het dashboard, zoals Beeldbank of Lost Rembrandt.
- **Grote update** (`feature`): een nieuwe mogelijkheid of een substantiële uitbreiding, zoals collectieconcepten of bewaarde certificaatteksten.
- **Verbetering & oplossing** (`fix`): herstel of verfijning van bestaande functies, zoals prijslabels of foto’s selecteren.

De filters laten deze categorieën afzonderlijk zien. Berichten vertellen wat de gebruiker kan doen en wat er verbeterd is. Samenhangende commits worden gebundeld; infrastructuurwijzigingen, interne details en toekomstige plannen worden niet automatisch overgenomen. Een nieuwe sectie op een bestaande pagina is een grote update, niet automatisch een nieuwe pagina.

## Inhoud aanvullen

Voeg een bericht bovenaan toe aan `api/_lib/dashboardUpdates.js`, met een uniek en blijvend `id`, de oorspronkelijke opleverdatum als `date` (`YYYY-MM-DD`), `category`, `title` en een `body` met korte alinea’s. Een optionele `action` bevat een bestaande dashboardtab als `target` en een begrijpelijk knoplabel. De navigatie accepteert alleen bestaande tabnamen.

Gebruik de Git-geschiedenis als bron en controleer de uiteindelijke code voordat je een functie als beschikbaar omschrijft. Dit is een bewust samengestelde leeslijst; GitHub wordt niet bij elk dashboardbezoek opgevraagd. Publiceer nieuwe berichten samen met de bijbehorende codewijziging.

## Bronnen van de eerste reeks

| Bericht-ID | Broncommits |
| --- | --- |
| 2026-10-27-topstukken | d08b59a, 4628141, 9fdc2bf, 5352495, 0532d8c |
| 2026-10-27-onderzoek-video | d08b59a, 9fdc2bf, ac09745, 3f14ca8 |
| 2026-10-27-vergelijkbare-verkopen | d08b59a |
| 2026-10-12-collectie-concepten | ce2af5b |
| 2026-10-12-verkocht-gereserveerd | 45df165 |
| 2026-10-08-certificaten | c2a7f15, c18cca2 |
| 2026-10-01-projectbeelden | 15c090c |
| 2026-09-23-inschrijvingen | 5e31a06 |
| 2026-09-17-fotos-kiezen | 873598b, 7d0652d, 3893df3, 4c4cea1, 48b24e1 |
| 2026-09-13-beeldbank | 5a67dfb, 0fd5107, 45a2589 |
| 2026-09-13-schilderij-aanmelden | 8e5f4ca, 86a8a3a, 5a3735e, cc172e5, 9d79a4f, d12441d |
| 2026-09-11-herkomst-onderzoek | 5a50ee5, 6bf345e, c4d59b4 |
| 2026-09-10-lichtvergelijking | 4774fd7 |
| 2026-09-10-herkomst-beelden | 7343915, d0a88f1 |
| 2026-09-07-lost-rembrandt | daf1923, 24a32e9, 086f511 |
| 2026-08-29-project-voorvertoning | 758a065, 552526e |
| 2026-08-24-bezoekers | 9e210f3, e30becc |
| 2026-08-20-collectors-list | 66c42a7, d876687, a597de1, 1340f24 |
| 2026-08-19-verwijderen | db8c6b2 |
| 2026-08-18-bezoekers-herkomst | ec2ad14, 0c42fbe, 06f4c29 |
| 2026-08-16-collectie-sorteren | 278ae4e, 164fc9c |
| 2026-08-13-dashboard-mobiel | 3f103bc |
| 2026-08-09-fotos-vergroten | b3a39a5, 4995ee8, 17a2996, add6e09 |
| 2026-07-31-collectiebeheer | 7e36732, 1656454 |

| 2026-07-25-projectstart | 189bf08 |
| 2026-07-25-collectiepagina | 189bf08 |
| 2026-07-25-herkomstpagina | 189bf08 |
| 2026-07-25-aanvragen | 189bf08, af8292e |
| 2026-07-25-aanmelden | c78e759, 7f940b5, 4c293dc |
| 2026-07-25-dashboard | 3321254, 1b11420, 79b78a8 |
| 2026-07-25-homepagebeelden | 5cfb8cd |
| 2026-07-27-atelier-rembrandt | 5ab63c3, d4de39e |
| 2026-07-27-drie-talen | 462cb11, c5fbfaf, a7a2694 |
| 2026-07-27-herkomstbeheer | d4de39e |
| 2026-07-27-topstukken-uit-collectie | d529657 |
| 2026-07-27-veelgestelde-vragen | a7003ee, 9c0898b |
| 2026-07-27-mobiele-navigatie | e808ca8, 23a97b8 |
| 2026-07-28-certificatenstudio | 0dc7c90, ac00e24, 2619187, 506392f |
| 2026-07-29-vertaalstatus | e05521e, e6a38d2, 53a3406, 6ae2f45, 6b990a3 |
| 2026-07-30-dashboard-op-telefoon | 147bcfc, ce64525, 188c97f, 50abb8c, 68b5f77 |
| 2026-07-30-bewaren-herstel | 1ebcb49, 8b11f8c |
| 2026-07-30-vertaalhulp | a9699b0, ca95850, 6247782 |
| 2026-07-30-uitgavegegevens | 40785af, ad9b4b0, 9659faf, 6584cfc, 1cbcc0d, 74a7e61 |
| 2026-08-03-vindbaarheid | a68c430, 304bdc9, 2ce96dd, 429588d |
| 2026-08-09-categorieen | 9469ffd, f982d9c, 61af6d1, b5c88ec |
| 2026-08-18-capaciteit | ee07091, d7e1665, 848c911, ae1e687, 87cc17d, a84d811 |
| 2026-08-25-gebruikscijfers | 12b0f3a, bef9c6b, 046584e, 5558096 |
| 2026-08-28-rembrandt-project | 385eab5 |
| 2026-09-01-contactadres | 2099fcd |
| 2026-09-10-publiceren-herstel | 916536b, ba8e195, c216a38 |
| 2026-09-23-aanleveren-bewaren | 6a3edb0 |

## Toegang en bekeken-status

De inhoud blijft in een servermodule. Het bestaande endpoint `/api/publish-public-content?resource=dashboard-updates` levert de lijst uitsluitend na `requireActiveAdmin`, met `Cache-Control: private, no-store, max-age=0`. Er komt geen extra serverfunctie of databasetabel bij. De Supabase-skill is geraadpleegd voor het hergebruik van de bestaande authenticatiegrens; de authenticatie zelf is niet veranderd.

Het dashboard laadt één keer per opening; opnieuw proberen is mogelijk na een fout. Een mislukte aanvraag blokkeert de andere dashboardfuncties niet. Sluiten/uitloggen ontkoppelt de laadstatus; een verlaat antwoord wordt genegeerd.

De browser bewaart maximaal 200 bekeken bericht-ID’s onder `atelier-rembrandt-dashboard-updates-viewed-v1`. Het overzicht markeert niets als bekeken. Het openen van de leeslijst onthoudt de getoonde berichten; hun Nieuw-label blijft tijdens dat bezoek staan. De inhoud blijft terug te lezen. Op een ander toestel of na het wissen van browsergegevens kunnen berichten opnieuw als nieuw verschijnen. Geblokkeerde browseropslag verhindert het lezen niet.

## Controle

`npm test` controleert onder meer categorisering, volgorde, beschermde uitlevering, bewaarbegrenzing, herladen na een fout en late antwoorden. `npm run build` controleert ook dat de berichttitels niet in publieke browserbundels terechtkomen. De onderdelen zijn lokaal bekeken op desktop en in een viewport van 390 pixels; filters en navigatieacties zijn via de browser gecontroleerd.
