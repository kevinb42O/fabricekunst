import { languages as l, normalizeProvenance } from '../utils/provenance.js';
import assets from './provenanceAssets.json' with { type: 'json' };

const aid = number => assets.find(a => a.number === number)?.id || '';
const ids = (...numbers) => numbers.map(aid).filter(Boolean);
const section = (id, title, intro, eyebrow = l()) => ({ id, enabled: true, title, intro, eyebrow });
const step = (id, title, description) => ({ id, enabled: true, title, description });
const method = (id, title, question, description, findings, limitations, numbers, sourceIds = [], enabled = true) => ({ id, enabled, title, question, description, findings, limitations, assetIds: ids(...numbers), sourceIds });
const source = (id, title, url) => ({ id, enabled: true, title, url });

export const DEFAULT_PROVENANCE = normalizeProvenance({
  schemaVersion: 3,
  hero: {
    eyebrow: l('HERKOMST & AUTHENTICITEIT', 'PROVENANCE & AUTHENTICITY', 'PROVENANCE & AUTHENTICITÉ'),
    title: l('Elk topstuk draagt zijn eigen geschiedenis.', 'Every masterpiece carries its own indelible history.', 'Chaque chef-d’œuvre porte l’empreinte de son histoire.'),
    description: l(
      'Van historische ex-libris en archivalische veilingregisters tot niet-destructieve materiële inspectie: ontdek hoe wij de herkomst en authenticiteit van zeldzame boeken en kunstwerken stap voor stap ontrafelen en documenteren.',
      'From historic bookplates and archival auction records to non-destructive material analysis: discover how we trace, verify, and document the pedigree and authenticity of rare books and works of art.',
      'Des ex-libris historiques et registres de vente aux examens matériels non destructifs : découvrez notre démarche rigoureuse pour retracer, authentifier et documenter les livres rares et les œuvres d’art.'
    ),
    primaryLabel: l('Ons onderzoeksprotocol', 'Our research protocol', 'Notre protocole d’expertise'),
    secondaryLabel: l('Bespreek een werk', 'Inquire about an object', 'Présenter une œuvre'),
    assetId: aid(37),
  },
  seo: {
    title: l(
      'Herkomstonderzoek & Authenticiteit — Fabrice Boeken & Kunst',
      'Provenance Research & Authenticity — Fabrice Books & Art',
      'Recherche de provenance & Authenticité — Fabrice Livres & Art'
    ),
    description: l(
      'Hoe bepalen wij herkomst en authenticiteit? Lees over onze materiële autopsie, archiefonderzoek, microscopie en het officiële herkomstdossier.',
      'How do we establish provenance and authenticity? Discover our five-stage protocol: material autopsy, archival research, optical examination, and certification.',
      'Comment établissons-nous la provenance et l’authenticité ? Découvrez notre protocole en cinq étapes : autopsie matérielle, dépouillement d’archives et dossier d’expertise.'
    ),
    assetId: aid(37),
    imageAlt: l(
      'Fysiek en optisch onderzoek van een historisch kunstwerk op de onderzoekstafel',
      'Physical and optical examination of a historical artwork on the research table',
      'Examen physique et optique d’une œuvre historique sur la table d’étude'
    ),
  },
  homepageTeaser: {
    enabled: true,
    title: l(
      'Herkomst als fundament van vertrouwen.',
      'Provenance as the foundation of trust.',
      'La provenance, fondement de l’authenticité.'
    ),
    description: l(
      'Achter elk zeldzaam boek en kunstwerk schuilt een reis door de eeuwen. Wij combineren grondig bronnenonderzoek met fijnzinnige materiële inspectie om de keten van vroegere bezitters betrouwbaar in kaart te brengen.',
      'Behind every rare volume and work of art lies centuries of custodianship. We unite documentary research with meticulous material inspection to reconstruct an unbroken lineage of ownership.',
      'Derrière chaque livre précieux et chaque œuvre d’art se déploie une histoire séculaire. Nous conjuguons recherche archivistique et examen minutieux des matériaux pour reconstituer la chaîne des propriétaires successifs.'
    ),
    buttonLabel: l('Ontdek onze werkwijze', 'Explore our methodology', 'Découvrir notre démarche'),
    assetId: aid(11),
  },
  sections: [
    section(
      'workflow',
      l('Het 5-stappen protocol voor herkomstbepaling.', 'The five-stage provenance protocol.', 'Le protocole d’authentification en cinq étapes.'),
      l(
        'Elk historisch object vraagt om een gestructureerde aanpak. Van de eerste fysieke inspectie tot het definitieve dossier: zo onderzoeken en waarborgen wij de integriteit van elk werk.',
        'Every historical acquisition demands systematic scrutiny. From initial physical inspection to the definitive dossier: here is how we examine and substantiate the integrity of each work.',
        'Chaque pièce historique requiert une démarche méthodique. De l’examen physique initial au dossier d’expertise final : voici comment nous établissons et garantissons l’authenticité de chaque œuvre.'
      ),
      l('METHODOLOGIE', 'METHODOLOGY', 'MÉTHODOLOGIE')
    ),
    section(
      'methods',
      l('Materieel kijken, historisch begrijpen.', 'Material scrutiny, historical insight.', 'L’œil du spécialiste, la rigueur de l’histoire.'),
      l(
        'Verschillende vragen vereisen verschillende technieken. Wij combineren bibliografische en kunsthistorische kennis met optische precisie-instrumenten om de materiële werkelijkheid van het object te doorgronden.',
        'Distinct inquiries require tailored tools. We combine bibliographic connoisseurship and art-historical scholarship with precise optical instruments to decipher the physical reality of each object.',
        'Chaque interrogation requiert des outils adaptés. Nous associons érudition bibliophilique et histoire de l’art à des instruments optiques de précision pour sonder la réalité matérielle de l’objet.'
      ),
      l('ONDERZOEKSDISCIPLINES', 'EXAMINATION DISCIPLINES', 'DISCIPLINES D’EXPERTISE')
    ),
    section(
      'examples',
      l('Onderzoek in de praktijk.', 'Research in practice.', 'L’expertise en pratique.'),
      l(
        'Concreet inzicht in hoe een herkomstspoor leidt tot archiefontdekkingen en hoe materiële observaties samenkomen in een onderbouwd oordeel.',
        'A tangible look at how a single provenance clue opens archival discoveries, and how physical observations converge into a definitive assessment.',
        'Démonstration concrète de la manière dont un simple indice de provenance mène aux archives, et comment les constatations matérielles forgent un jugement étayé.'
      ),
      l('PRAKTIJKDOSSIERS', 'CASE STUDIES', 'CAS PRATIQUES')
    ),
    section(
      'gallery',
      l('Het atelier & de instrumenten van dichtbij.', 'The atelier & instruments in detail.', 'L’atelier et nos instruments en détail.'),
      l(
        'Bekijk onze onderzoeksopstellingen, microscopische opnamen en detailstudies van dragers, inscripties en verflagen.',
        'Explore our examination setups, microscopic details, and close-up studies of supports, inscriptions, and surface structure.',
        'Découvrez nos installations d’examen, grossissements microscopiques et études rapprochées des supports, inscriptions et matières.'
      ),
      l('BEELDARCHIEF', 'IMAGE ARCHIVE', 'ARCHIVES VISUELLES')
    ),
    section(
      'dossier',
      l('Het Herkomstdossier & Certificaat.', 'The Provenance Dossier & Certificate.', 'Le Dossier de Provenance & Certificat.'),
      l(),
      l('DOSSIERVORMING', 'DOCUMENTATION', 'DOSSIER D’EXPERTISE')
    ),
    section(
      'faq',
      l('Veelgestelde vragen over herkomst & authenticiteit.', 'Frequently asked questions about provenance.', 'Questions fréquentes sur la provenance et l’authenticité.'),
      l(),
      l('VRAGEN & EXPERTISE', 'FREQUENTLY ASKED QUESTIONS', 'QUESTIONS FRÉQUENTES')
    ),
    section(
      'contact',
      l('Heeft u een bijzonder werk of verzameling?', 'Do you possess a rare work or collection?', 'Vous possédez un ouvrage précieux ou une œuvre d’art ?'),
      l(),
      l('PERSOONLIJK ADVIES', 'CONNOISSEUR CONSULTATION', 'CONSULTATION PRIVÉE')
    ),
  ],
  steps: [
    step(
      'material',
      l('1. Materiële Autopsie & Drager', '1. Material Autopsy & Support', '1. Autopsie matérielle et support'),
      l(
        'Grondige inspectie van de fysieke drager: scheppapier, watermerken, binding en sneden bij boeken; paneelconstructie, spieramen en doekstructuur bij schilderijen. Dit bevestigt direct de chronologische plausibiliteit.',
        'Exhaustive analysis of the physical carrier: laid paper, watermarks, typography and bindings for books; wood panel construction, stretchers, and canvas weave for paintings. This immediately confirms chronological plausibility.',
        'Examen approfondi du support physique : papier vergé, filigranes, reliures et coutures pour les livres ; panneaux de bois, châssis et armure de toile pour les tableaux. Cela confirme d’emblée la cohérence chronologique.'
      )
    ),
    step(
      'traces',
      l('2. Eigendomssporen & Epigrafie', '2. Ownership Marks & Epigraphy', '2. Marques de possession et épigraphie'),
      l(
        'Systematisch ontcijferen van ex-libris stempels, adellijke wapensupralibros, contemporaine annotaties, veilingkrijtnotaties en lakzegels op banden en lijsten.',
        'Systematic decipherment of bookplates (ex-libris), heraldic supra-libros, contemporary marginalia, historic auction chalk marks, and wax seals preserved on boards, panels, or frames.',
        'Déchiffrement méthodique des ex-libris, fers de reliure armoriés, annotations marginales d’époque, inscriptions à la craie de vente et cachets de cire sur les plats, revers et cadres.'
      )
    ),
    step(
      'archives',
      l('3. Archivalisch & Literatuuronderzoek', '3. Archival & Documentary Research', '3. Recherches archivistiques et bibliographiques'),
      l(
        'Traceren van eerdere bezitters via historische veilingcatalogi, boedelinventarissen, concordanties en internationale kunstdatabanken (o.a. RKD, Getty Provenance Index, BnF en KB).',
        'Cross-referencing collectors and estates through historical auction catalogues, estate inventories, concordances, and international archives (including RKD, the Getty Provenance Index, BnF, and National Libraries).',
        'Recherche des propriétaires successifs dans les catalogues de ventes anciennes, inventaires après décès, répertoires bibliographiques et grandes bases patrimoniales (RKD, Getty, BnF et bibliothèques nationales).'
      )
    ),
    step(
      'technical',
      l('4. Gerichte Optische Verificatie', '4. Targeted Optical & Technical Examination', '4. Vérification optique et scientifique ciblée'),
      l(
        'Inzet van niet-destructieve optische methoden waar het blote oog tekortschiet: UV-fluorescentie voor latere retouches en reparaties, en hoge-resolutie stereomicroscopie voor inkt-, verf- en craqueléstructuren.',
        'Deploying non-invasive optical techniques whenever visual inspection demands deeper clarity: UV fluorescence to expose later retouching and repairs, alongside high-resolution stereo microscopy to examine ink, pigments, and craquelure.',
        'Mise en œuvre d’outils optiques non destructifs lorsque l’œil nu ne suffit pas : fluorescence UV pour déceler repentirs et restaurations, et stéréomicroscopie à haute résolution pour sonder les encres, pigments et réseaux de craquelures.'
      )
    ),
    step(
      'dossier',
      l('5. Synthese & Het Herkomstdossier', '5. Synthesis & The Provenance Dossier', '5. Synthèse et Dossier de Provenance'),
      l(
        'Samenvoegen van alle fysieke bewijzen, archivalische bronnen en beeldopnamen in een formeel dossier. Transparantie staat voorop: we documenteren bewezen schakels en benoemen historische hiaten exact.',
        'Consolidating physical findings, primary documents, and high-definition photography into a definitive provenance dossier. We uphold absolute integrity: substantiated links are proved, and historical gaps are openly demarcated.',
        'Rassemblement des preuves matérielles, documents primaires et photographies d’expertise au sein d’un dossier officiel. Nous garantissons une transparence totale : chaque jalon avéré est étayé, et les lacunes historiques sont rigoureusement signalées.'
      )
    ),
    step(
      'certificate',
      l('6. Certificering van Authenticiteit', '6. Certificate of Authenticity', '6. Certificat d’authenticité'),
      l(
        'Ieder aangekocht topstuk wordt vergezeld van een officieel certificaat van authenticiteit en herkomst, ondertekend en gewaarborgd op basis van de vastgestelde onderzoeksresultaten.',
        'Every fine acquisition is accompanied by an official, signed Certificate of Authenticity and Provenance, backed by our verified research findings.',
        'Toute pièce remarquable acquise auprès de notre maison est accompagnée d’un certificat d’authenticité officiel et signé, gagé sur les conclusions vérifiées du dossier d’expertise.'
      )
    ),
  ],
  methods: [
    method(
      'rx',
      l('Röntgenonderzoek (RX)', 'X-Ray Radiography (RX)', 'Radiographie aux rayons X (RX)'),
      l('Wat onthullen de verborgen lagen onder het verfoppervlak?', 'What lies concealed beneath the visible surface?', 'Que dissimulent les couches sous-jacentes de la peinture ?'),
      l(
        'Röntgenopnamen dringen door dekkende verflagen heen en registreren de zware elementen (zoals loodwit). Dit brengt overschilderde composities, compositiewijzigingen (pentimenti) en de interne staat van de drager haarscherp aan het licht.',
        'X-ray radiography penetrates opaque paint layers, recording heavy elements such as lead white. This reveals compositional revisions (pentimenti), concealed earlier compositions, and the structural condition of the support.',
        'La radiographie pénètre les couches picturales opaques en captant les éléments denses (tels que le blanc de plomb). Elle met en lumière les repentirs d’atelier, les compositions sous-jacentes et l’état structurel interne du support.'
      ),
      l(
        'Zichtbaarmaking van pentimenti, vroege opzet en verborgen schades of verstevigingen.',
        'Uncovering original artist pentimenti, initial lay-in, and structural repairs or reinforcements.',
        'Mise en évidence des repentirs de l’artiste, de l’esquisse primitive et des consolidations structurelles.'
      ),
      l(
        'Geeft een projectie van alle lagen tegelijk; vereist altijd kruisanalyse met oppervlaktemicroscopie.',
        'Compresses all layers into a single plane; must always be evaluated in conjunction with surface microscopy.',
        'Superpose toutes les strates en une seule image ; exige une confrontation avec la microscopie de surface.'
      ),
      [35, 5],
      []
    ),
    method(
      'microscopy',
      l('Stereomicroscopie & Oppervlakteanalyse', 'Stereo Microscopy & Surface Analysis', 'Stéréomicroscopie & Analyse de surface'),
      l('Wat vertelt de microstructuur van papier, inkt en verf?', 'What does the microstructure of paper, ink, and pigments reveal?', 'Que révèle la microstructure du papier, des encres et de la matière picturale ?'),
      l(
        'Met optische vergroting tot 200x onderzoeken we de vezelstructuur van scheppapier, de inktinslag van historische drukletters, het authentieke craquelépatroon en de relatie tussen signatuur en ondergrond.',
        'Employing magnification up to 200x, we inspect the laid paper fiber network, the bite of movable metal type, authentic craquelure patterns, and whether signatures sit naturally within the historical layers.',
        'Grâce à des grossissements jusqu’à 200x, nous analysons le réseau fibreux du papier vergé, le foulage typographique, le réseau de craquelures d’âge et l’intégration naturelle de la signature.'
      ),
      l(
        'Direct onderscheid tussen historische druktechnieken, moderne reproducties en latere retouches.',
        'Immediate distinction between original typography/engravings, modern facsimiles, and later retouching.',
        'Différenciation immédiate entre impression ancienne, fac-similés modernes et reprises postérieures.'
      ),
      l(
        'Beoordeelt lokale microdetails; dient altijd geplaatst te worden binnen de globale conditie van het object.',
        'Examines localized micro-features; must be synthesized with the overall condition of the object.',
        'Cible des détails ponctuels ; doit être interprétée dans le contexte global de l’œuvre.'
      ),
      [11, 13, 19]
    ),
    method(
      'support',
      l('Achterzijde, Boekband & Dragerinspectie', 'Reverse, Binding & Support Examination', 'Revers, Reliure & Examen du support'),
      l('Welke onvervalsbare sporen bewaart het object zelf?', 'What indelible provenance clues does the reverse preserve?', 'Quelles marques inaltérables le support physique a-t-il conservées ?'),
      l(
        'De achterzijde van een paneel of de spieramen van een doek bevatten vaak de rijkste historische getuigenissen: oude douanestempels, veilingetiketten en brandmerken. Bij boeken onthullen kapitaalbandjes, lederstructuur en schutbladen de exacte werkplaats en herkomst.',
        'The reverse of a panel or stretcher frequently holds the most compelling provenance clues: transit labels, collector wax seals, and historic auction chalk. In books, endbands, tooling, and marbled endpapers identify the regional bindery.',
        'Le revers d’un panneau ou les traverses d’un châssis conservent souvent les preuves historiques les plus décisives : étiquettes d’anciennes ventes, cires de collectionneurs et marques de douane. Pour les reliures, tranchefiles, dorures et gardes marbrées désignent l’atelier d’origine.'
      ),
      l(
        'Traceerbare verzamelaarszegels, galerielabels en historische constructietechnieken.',
        'Verifiable collector wax seals, gallery inventories, and period-specific craftsmanship.',
        'Sceaux de cire identifiables, marques de marchands historiques et techniques de fabrication d’époque.'
      ),
      l(
        'Etiketten en schutbladen kunnen in zeldzame gevallen hergebruikt zijn; materiële homogeniteit wordt altijd getoetst.',
        'Labels or endpapers can occasionally be transferred or rebound; material coherence is always verified.',
        'Une étiquette ou une garde peut avoir été remployée ; l’homogénéité matérielle est systématiquement éprouvée.'
      ),
      [22]
    ),
    method(
      'inscriptions',
      l('Epigrafie, Ex-Libris & Archiefsporen', 'Epigraphy, Bookplates & Documentary Marks', 'Épigraphie, Ex-Libris & Traces d’archives'),
      l('Hoe leiden inscripties en ex-libris naar historische verzamelaars?', 'How do marginalia and armorial bookplates pinpoint former owners?', 'Comment les inscriptions et ex-libris identifient-ils les illustres possesseurs ?'),
      l(
        'Handgeschreven eigendomsvermeldingen, monogrammen en heraldische wapenex-libris worden paleografisch ontcijferd. Wij vergelijken deze met historische registers en veilingcatalogi om de exacte overdrachtsgeschiedenis te reconstrueren.',
        'Handwritten ownership inscriptions, monograms, and heraldic ex-libris are transcribed paleographically. We cross-examine these against period registers and auction annals to chart the exact chain of custody.',
        'Mentions manuscrites de possession, chiffres et ex-libris armoriés font l’objet d’un déchiffrement paléographique précis. Nous les confrontons aux inventaires et catalogues de vente pour retracer la lignée de transmission.'
      ),
      l(
        'Directe identificatie van adellijke verzamelaars, geleerden en historische bibliotheken.',
        'Direct identification of noble collectors, renowned scholars, and historic library dispersals.',
        'Identification directe de bibliophiles illustres, d’érudits et de grandes dispersions de collections.'
      ),
      l(
        'Een naam vormt een ijkpunt in de tijd; de verbinding naar het heden vraagt aanvullend archiefonderzoek.',
        'A signature marks a distinct moment in time; bridging the timeline to the present requires ongoing archival research.',
        'Une mention consigne un instant précis ; relier ce jalon à l’époque contemporaine requiert une recherche archivistique suivie.'
      ),
      [28],
      []
    ),
    method(
      'uv',
      l('UV-Fluorescentieonderzoek', 'Ultraviolet (UV) Fluorescence', 'Examen par fluorescence UV'),
      l('Zijn er latere restauraties of retouches aanwezig?', 'Are there subsequent restorations or retouchings present?', 'Des restaurations ou repeints postérieurs sont-ils présents ?'),
      l(
        'Onder ultraviolet licht vertonen verschillende vernissen, lijmstoffen en pigmenten specifieke fluorescentiepatronen. Recente retouches of verlijmde scheuren absorberen UV-licht en lichten donker op, waardoor eerdere ingrepen direct zichtbaar worden.',
        'Under filtered UV light, varnishes, glues, and pigments emit distinct fluorescence. Modern retouching and repaired tears absorb ultraviolet rays, appearing as distinct dark areas against aged varnish.',
        'Sous rayonnement ultraviolet, vernis anciens, colles et pigments émettent des fluorescences caractéristiques. Les repeints récents et restaurations absorbent le rayonnement UV et apparaissent sous forme de taches sombres bien distinctes.'
      ),
      l(
        'Nauwkeurige kartering van vernislagen, retouches, overschilderingen en historische restauraties.',
        'Accurate mapping of varnish condition, localized retouches, overpaints, and historical interventions.',
        'Cartographie exacte des vernis, retouches localisées, repeints et anciennes interventions de restauration.'
      ),
      l(
        'Oude retouches onder een vergeeld vernis kunnen vergelijkbare fluorescentie vertonen; vraagt ervaren interpretatie.',
        'Early restorations beneath natural resin varnish can exhibit aged fluorescence, requiring expert connoisseurship.',
        'Des repeints très anciens sous un vernis patiné peuvent réagir subtilement ; cela exige l’œil averti d’un expert.'
      ),
      [],
      [],
      false
    ),
    method(
      'xrf',
      l('Röntgenfluorescentie (XRF-analyse)', 'X-Ray Fluorescence (XRF Elemental Analysis)', 'Fluorescence de rayons X (Analyse XRF)'),
      l('Welke chemische elementen en pigmenten zijn gebruikt?', 'Which historical pigments and chemical elements are present?', 'Quels éléments chimiques et pigments historiques composent l’œuvre ?'),
      l(
        'Niet-destructieve elementanalyse identificeert de aanwezigheid van zware metalen in pigmenten (zoals lood, kwik, koper of goud). Dit bevestigt of de gebruikte materialen historisch stroken met de ontstaansperiode.',
        'Non-destructive elemental spectrometry detects characteristic heavy elements (e.g., lead, mercury, copper, or gold) in pigments, proving whether the chemical composition matches historical availability.',
        'Spectrométrie élémentaire non destructive identifiant la présence de métaux caractéristiques (plomb, mercure, cuivre, or) dans les pigments, confirmant la conformité historique des matériaux employés.'
      ),
      l(
        'Onomstotelijke bevestiging van anorganische pigmenten (zoals vermiljoen, azuriet of loodtingeel).',
        'Conclusive chemical identification of period mineral pigments (such as vermilion, azurite, or lead-tin yellow).',
        'Identification formelle des pigments minéraux d’époque (vermillon, azurite ou jaune de plomb-étain).'
      ),
      l(
        'Meet anorganische elementen; organische bindmiddelen en lakken vereisen aanvullende methoden.',
        'Detects inorganic chemical elements; organic binding media and modern resins require complementary testing.',
        'Mesure les éléments inorganiques ; les liants organiques et laques végétales nécessitent d’autres approches.'
      ),
      [],
      [],
      false
    ),
    method(
      'ir',
      l('Infraroodreflectografie (IRR)', 'Infrared Reflectography (IRR)', 'Réflectographie infrarouge (IRR)'),
      l('Is de oorspronkelijke ondertekening zichtbaar?', 'Can the master’s underlying preparatory drawing be revealed?', 'Le dessin préparatoire sous-jacent de l’artiste apparaît-il ?'),
      l(
        'Infraroodstraling dringt door veel pigmentlagen heen en wordt geabsorbeerd door koolstofhoudende ondertekeningen op de grondering. Zo worden vroege schetsen, wijzigingen van de meesterhand en verborgen ontwerpen zichtbaar.',
        'Infrared radiation penetrates upper pigment strata and is absorbed by carbon-based underdrawings on the ground layer, uncovering preparatory sketches and the spontaneous genesis of the masterwork.',
        'Le rayonnement infrarouge traverse les strates pigmentaires et est absorbé par le carbone du dessin préparatoire, dévoilant l’esquisse primitive et les premiers tracés du maître.'
      ),
      l(
        'Zichtbaarmaking van de spontane tekenhand van de kunstenaar en compositiewijzigingen.',
        'Visualizing the artist’s spontaneous draftsmanship and compositional adjustments.',
        'Révélation de la main spontanée du peintre et de l’évolution de la composition.'
      ),
      l(
        'Uitsluitend effectief wanneer de ondertekening koolstofhoudend is en de grondlaag reflecterend.',
        'Effective specifically when carbon-based materials were used atop a light-reflective ground.',
        'Opérant principalement lorsque le tracé préparatoire contient du carbone sur une préparation réflective.'
      ),
      [],
      [],
      false
    ),
  ],
  examples: [
    {
      id: 'portrait',
      enabled: true,
      title: l('Onderzoek van een 17e-eeuws portret', 'Investigation of a 17th-century portrait', 'Étude approfondie d’un portrait du XVIIe siècle'),
      question: l('Hoe bevestigen verfopbouw, drager en microscopie de ontstaansperiode?', 'How do pigment stratification, support, and microscopy confirm period authenticity?', 'Comment la stratification picturale, le panneau et la microscopie attestent-ils l’époque ?'),
      description: l(
        'Tijdens de analyse op de onderzoekstafel werd het portret onderworpen aan systematische stereomicroscopie en strijklichtonderzoek. Hierdoor kon het authentieke craquelé worden onderscheiden van latere vernislagen en werd de integriteit van de drager bevestigd.',
        'During examination in our atelier, the portrait was scrutinized under raking light and stereo microscopy. This distinguished genuine age craquelure from superficial varnish crazing, confirming the structural soundness of the original support.',
        'Placé sur la table d’étude, ce portrait a fait l’objet d’examens minutieux sous lumière rasante et stéréomicroscopie. Cette approche a permis de dissocier le réseau de craquelures authentique des vernis superficiels et d’attester l’intégrité du panneau.'
      ),
      findings: l(
        'Geen anachronistische pigmenten; natuurlijke inbedding van de verflagen in de historische grondlaag.',
        'No anachronistic pigments; organic integration of paint layers within the historical ground.',
        'Absence de tout pigment anachronique ; parfaite intégration des couches dans la préparation d’époque.'
      ),
      uncertainties: l(
        'Oude retouches langs de randen zijn gedocumenteerd in het conditierapport zonder afbreuk aan het geheel.',
        'Historical perimeter edge retouches were charted in the condition report without diminishing the composition.',
        'Les consolidations anciennes en bordure ont été cartographiées dans le rapport sans altérer l’intégrité de l’œuvre.'
      ),
      assetIds: ids(20, 8),
      sourceIds: [],
      timeline: [],
    },
    {
      id: 'exlibris',
      enabled: true,
      title: l('De reis van een zeldzame vroege druk', 'The pedigree of a rare early imprint', 'L’odyssée d’une édition précieuse'),
      question: l('Hoe reconstrueert een heraldiek ex-libris een adellijke herkomstketen?', 'How does an armorial bookplate reconstruct a distinguished aristocratic pedigree?', 'Comment un ex-libris armorié restitue-t-il une illustre filiation seigneuriale ?'),
      description: l(
        'In een vroeg 18e-eeuwse band werd op het gemarmerde schutblad een kopergeëtst heraldiek ex-libris aangetroffen. Door vergelijking met adellijke genealogieën en 19e-eeuwse bibliotheekdispersies kon het werk worden getraceerd naar een voorname Franse verzamelaar.',
        'Pasted upon the marbled endpaper of an early 18th-century morocco volume, an engraved armorial bookplate was identified. By cross-referencing heraldic rolls and 19th-century library dispersals, the book was traced directly to an eminent French connoisseur.',
        'Apposé sur la garde marbrée d’une reliure en maroquin du début du XVIIIe siècle, un ex-libris armorié gravé au burin a été examiné. Le recoupement avec les armoriaux et catalogues de dispersion du XIXe siècle a permis de relier l’ouvrage à une éminente collection française.'
      ),
      findings: l(
        'Ononderbroken bezitshistorie gedurende twee eeuwen bevestigd via contemporaine veilingannotaties.',
        'Unbroken provenance across two centuries corroborated by period auction registers.',
        'Continuité de possession attestée sur deux siècles par des mentions marginales et registres de vente.'
      ),
      uncertainties: l(
        'De tussenliggende periode tussen ontstaansdruk en eerste ex-libris is zorgvuldig als historische context gedefinieerd.',
        'The initial decades between original printing and the first recorded bookplate are transparently contextualized.',
        'La période initiale entre l’impression originale et l’apposition du premier ex-libris est rigoureusement contextualisée.'
      ),
      assetIds: ids(28),
      sourceIds: [],
      timeline: [],
    },
  ],
  sources: [],
  assets: assets.map(({ id, title, caption, alt, category, objectLabel, approved }) => ({ id, title, caption, alt, category, objectLabel, approved, credit: l() })),
  gallery: { assetIds: ids(37, 35, 5, 11, 13, 22, 19, 28, 20, 8, 26, 27) },
  comparisons: [
    {
      id: 'portrait-daylight-uv',
      enabled: true,
      title: l(
        'Optische vergelijking: Daglicht vs. UV-Fluorescentie (365 nm)',
        'Optical Comparison: Visible Daylight vs. UV Fluorescence (365 nm)',
        'Comparaison optique : Lumière du jour vs. Fluorescence UV (365 nm)'
      ),
      leftLabel: l('Daglicht / Zichtbaar spectrum', 'Daylight / Visible Spectrum', 'Lumière du jour / Spectre visible'),
      rightLabel: l('UV-Fluorescentie (365 nm)', 'UV Fluorescence (365 nm)', 'Fluorescence UV (365 nm)'),
      leftId: aid(20),
      rightId: aid(27),
      sameObjectConfirmed: true,
    },
  ],
  dossier: {
    description: l(
      'Bij elk onderzocht werk stellen wij een uitgebreid Herkomstdossier samen. Dit document brengt de fysieke staat, historische context en bewezen eigendomsketen samen in één transparant naslagwerk.',
      'For every researched masterpiece, we curate a comprehensive Provenance Dossier. This scholarly record bridges material condition, historical context, and verified ownership into a transparent compendium.',
      'Pour chaque pièce d’exception étudiée, nous élaborons un Dossier de Provenance exhaustif. Ce document de référence réunit état matériel, contexte historique et chaîne de transmission au sein d’une synthèse transparente.'
    ),
    items: [
      step(
        'object',
        l('Fysieke Autopsie & Conditierapport', 'Physical Autopsy & Condition Report', 'Autopsie matérielle et état de conservation'),
        l(
          'Volledige materiële specificaties, afmetingen, watermerk- en dragerbeschrijving en hoge-resolutie overzichtsfotografie.',
          'Complete material specifications, dimensions, watermark/support diagnostics, and high-resolution overview photography.',
          'Spécifications matérielles complètes, dimensions, relevé des filigranes et photographies d’ensemble à haute définition.'
        )
      ),
      step(
        'lineage',
        l('Chronologische Eigendomsketen', 'Chronological Chain of Custody', 'Filiation chronologique de propriété'),
        l(
          'Gedocumenteerde tijdlijn van vroegere bezitters, verzamelaars en veilingen, inclusief transcripties van stempels en ex-libris.',
          'Documented timeline of former custodians, notable collectors, and sales, including precise transcriptions of markings.',
          'Chronologie documentée des propriétaires successifs et ventes d’art, enrichie de la transcription des marques et ex-libris.'
        )
      ),
      step(
        'records',
        l('Archivalische Bronnen & Bibliografie', 'Archival Sources & Bibliography', 'Sources archivistiques et bibliographie'),
        l(
          'Exacte verwijzingen naar historische veilingcatalogi, boedelinventarissen, monografieën en referentiewerken.',
          'Precise citations from historical auction catalogues, estate inventories, standard catalogues raisonnés, and archives.',
          'Références exactes aux catalogues de ventes historiques, inventaires successoraux, catalogues raisonnés et archives.'
        )
      ),
      step(
        'observations',
        l('Optische & Technische Observaties', 'Optical & Technical Diagnostics', 'Diagnostics optiques et examens scientifiques'),
        l(
          'Detailopnamen onder stereomicroscopie, UV-fluorescentie en strijklicht, met toelichting op verf- of papierconditie.',
          'Diagnostic photography under stereo microscopy, UV fluorescence, and raking light, detailing paper or pigment condition.',
          'Clichés de précision sous stéréomicroscopie, fluorescence UV et lumière rasante, explicitant l’état du papier ou des couches picturales.'
        )
      ),
      step(
        'certificate',
        l('Certificaat van Onvoorwaardelijke Authenticiteit', 'Unconditional Certificate of Authenticity', 'Certificat d’authenticité sans réserve'),
        l(
          'Formeel bindende verklaring van toeschrijving en echtheid, levenslang gewaarborgd door onze expertise.',
          'A formal, legally binding statement of attribution and authenticity, backed unconditionally by our connoisseurship.',
          'Attestation formelle d’attribution et d’authenticité, engageant notre responsabilité et garantie de manière pérenne.'
        )
      ),
    ],
  },
  faq: [
    {
      id: 'books',
      enabled: true,
      question: l(
        'Waarin verschilt herkomstonderzoek bij zeldzame boeken van schilderijen?',
        'How does provenance research for rare books differ from paintings?',
        'En quoi la recherche de provenance pour les livres rares diffère-t-elle de celle des tableaux ?'
      ),
      answer: l(
        'Bij antieke boeken ligt de focus op typografische eigenschappen, contemporaine boekbanden, wapen- en ex-libris stempels, handgeschreven marginaalnotities en specifieke drukvarianten. Schilderijen vereisen daarnaast diepgaande inspectie van spieramen, craquelépatronen, verflagen en etiketten op het achterpaneel.',
        'For antiquarian books, investigation centers on typographic signatures, period bindings, armorial toolings, bookplates, and marginalia. Paintings conversely demand scrutiny of wooden stretchers, canvas preparation, craquelure matrices, and historical transit labels upon the reverse.',
        'Pour les ouvrages anciens, l’expertise repose sur les caractères typographiques, les reliures d’époque, les fers armoriés, les ex-libris et les gloses manuscrites. Les tableaux requièrent en outre l’analyse des châssis, du réseau de craquelures, des vernis et des étiquettes de transit au revers.'
      ),
    },
    {
      id: 'tests',
      enabled: true,
      question: l(
        'Wordt elk werk onderworpen aan laboratoriumtechnieken?',
        'Is every acquisition subjected to laboratory-grade examinations?',
        'Chaque œuvre fait-elle l’objet d’analyses scientifiques en laboratoire ?'
      ),
      answer: l(
        'Nee, wij hanteren een gerichte en proportionele methodiek. Veel antieke boeken en grafiek openbaren hun authenticiteit onomstotelijk via papierwatermerken, typografie en archivalische concordanties. Geavanceerde optische technieken (zoals UV, microscopie of infrarood) worden ingezet wanneer specifieke vragen over restauraties of ondertekeningen daarom vragen.',
        'No; we employ a tailored, disciplined approach. Many rare books and prints reveal their authenticity conclusively through watermarks, movable type characteristics, and archival records. Advanced optical methods (such as UV or microscopy) are deployed when specific questions regarding overpaints or restoration arise.',
        'Non ; nous appliquons une démarche ciblée et mesurée. Nombre d’éditions précieuses et d’estampes démontrent leur authenticité par leurs filigranes, leur typographie et les répertoires bibliographiques. Les examens optiques avancés (UV, microscopie) interviennent dès lors qu’un doute subsiste sur d’éventuelles restaurations.'
      ),
    },
    {
      id: 'gaps',
      enabled: true,
      question: l(
        'Wat als een werk een historische leemte heeft in de eigendomsketen?',
        'How do you address historical gaps within a provenance chain?',
        'Comment abordez-vous les lacunes dans la chaîne de propriété historique ?'
      ),
      answer: l(
        'Integriteit en transparantie staan bij ons voorop. Een ontbrekende periode in een eeuwenoude overdracht is historisch niet ongebruikelijk. In ons dossier maken wij een scherp onderscheid tussen archiefmatig bewezen schakels, gefundeerde toeschrijvingen en ongedocumenteerde periodes. Zo weet u altijd exact waar u aan toe bent.',
        'Absolute integrity and transparency are our guiding principles. Provenance gaps in centuries-old works are historically common. Our dossier meticulously distinguishes between archival facts, substantiated attributions, and unrecorded eras, giving you total transparency.',
        'L’intégrité et la rigueur sont au cœur de nos engagements. Les lacunes ponctuelles dans une transmission séculaire sont fréquentes dans l’histoire de l’art. Notre dossier consigne avec exactitude les jalons prouvés, les attributions étayées et les périodes non documentées, garantissant une parfaite clarté.'
      ),
    },
    {
      id: 'signature',
      enabled: true,
      question: l(
        'Is een signatuur of datum op een werk op zichzelf voldoende bewijs?',
        'Does a signature or date alone establish unquestionable authenticity?',
        'Une signature ou une date constitue-t-elle à elle seule une preuve suffisante ?'
      ),
      answer: l(
        'Beslist niet. Een signatuur moet altijd worden beoordeeld in samenhang met de fysieke drager, het verouderingsproces en de ontstaansgeschiedenis. Wij verifiëren of de signatuur organisch meeloopt in het craquelé en historisch consistent is met contemporaine documenten.',
        'Decidedly not. A signature must always be evaluated in complete context with the support, material aging, and historical documentation. We verify that signatures integrate authentically within period craquelure rather than sitting superficially atop aged varnish.',
        'Absolument pas. Une signature ne prend de sens que confrontée au support, au vieillissement naturel de la matière et au contexte d’époque. Nous nous assurons qu’elle s’intègre harmonieusement dans les craquelures du temps sans flotter sur un vernis postérieur.'
      ),
    },
    {
      id: 'contact',
      enabled: true,
      question: l(
        'Hoe kan ik een bijzonder boek of schilderij laten beoordelen?',
        'How may I present a rare book or painting for appraisal?',
        'Comment soumettre un livre précieux ou un tableau à votre expertise ?'
      ),
      answer: l(
        'U kunt geheel vrijblijvend contact met ons opnemen met detailfoto’s en de informatie die u reeds bezit. Wij beoordelen de haalbaarheid van nader onderzoek en bespreken discreet de mogelijkheden voor een fysieke inspectie in ons atelier of op locatie.',
        'You are warmly invited to contact us with high-resolution imagery and existing documentation. We will review the feasibility of a full appraisal and arrange a private, confidential consultation in our atelier or on location.',
        'Contactez-nous en toute discrétion en nous transmettant des photographies détaillées et les éléments en votre possession. Nous étudierons la pertinence d’une analyse approfondie et conviendrons d’un examen physique dans notre atelier ou sur place.'
      ),
    },
  ],
  cta: {
    title: l(
      'De eerste stap naar zekerheid is een deskundig gesprek.',
      'The first step toward certainty is an expert consultation.',
      'La première étape vers la certitude commence par un échange d’experts.'
    ),
    description: l(
      'Bezit u een bijzonder boek, manuscript of schilderij en wenst u uitsluitsel over herkomst en waarde? Wij bieden discreet en gefundeerd advies voor particuliere verzamelaars en instellingen.',
      'Do you hold a rare volume, manuscript, or painting and require authoritative clarity on its provenance? We provide confidential, rigorous counsel for discerning collectors and institutions.',
      'Vous conservez un volume rare, un manuscrit ou un tableau et souhaitez clarifier son parcours et sa valeur ? Nous accompagnons collectionneurs privés et institutions avec la plus stricte discrétion.'
    ),
    buttonLabel: l('Bespreek uw collectie', 'Consult with our curators', 'Consulter notre équipe'),
    assetId: aid(37),
    action: 'consultation',
  },
});
export const defaultProvenance = () => structuredClone(DEFAULT_PROVENANCE);
// Only reviewed public derivatives are bundled; originals and archive metadata stay server-side.
export const defaultPublicProvenance = () => ({ ...defaultProvenance(), assets: assets.filter(a => a.approved).map(a => ({...a, credit:l()})) });
