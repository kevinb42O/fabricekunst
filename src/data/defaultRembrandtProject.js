const trilingual = (nl, en, fr) => ({ nl, en, fr });

export const DEFAULT_REMBRANDT_PROJECT = {
  schemaVersion: 2,
  isEnabled: true,
  settings: {
    title: trilingual('The Lost Rembrandt Project', 'The Lost Rembrandt Project', 'The Lost Rembrandt Project'),
    eyebrow: trilingual('Atelier Rembrandt onderzoeksinitiatief', 'An Atelier Rembrandt research initiative', 'Une initiative de recherche d’Atelier Rembrandt'),
    intro: trilingual(
      'Op zoek naar onbekende, vergeten en verkeerd toegeschreven werken van Rembrandt en zijn atelier.',
      'In search of unknown, forgotten and misattributed works by Rembrandt and his workshop.',
      'À la recherche d’œuvres inconnues, oubliées et mal attribuées de Rembrandt et de son atelier.'
    ),
    summary: trilingual(
      'The Lost Rembrandt Project onderzoekt schilderijen die mogelijk rechtstreeks verbonden zijn met Rembrandt van Rijn en zijn atelier. We brengen kunsthistorisch onderzoek, provenance en moderne beeldvorming samen, zonder de uitkomst vooraf vast te leggen.',
      'The Lost Rembrandt Project investigates paintings that may be directly connected with Rembrandt van Rijn and his workshop. We bring together art-historical research, provenance and modern imaging without predetermining the outcome.',
      'The Lost Rembrandt Project étudie des peintures susceptibles d’être directement liées à Rembrandt van Rijn et à son atelier. Nous réunissons recherche en histoire de l’art, provenance et imagerie moderne, sans préjuger du résultat.'
    ),
    disclaimer: trilingual(
      'De toeschrijving aan Rembrandt is onderwerp van lopend technisch, kunsthistorisch en herkomstonderzoek. De hier beschreven bevindingen vormen geen definitieve authenticiteitsverklaring.',
      'The attribution to Rembrandt remains the subject of ongoing technical, art-historical and provenance research. The findings described here do not constitute a final statement of authenticity.',
      'L’attribution à Rembrandt fait toujours l’objet de recherches techniques, historiques et de provenance. Les éléments présentés ici ne constituent pas une déclaration définitive d’authenticité.'
    ),
    currentStatus: trilingual(
      'De eerste beeldvormende onderzoeken zijn uitgevoerd. De volgende fase richt zich op materiaaltechnisch onderzoek en een onafhankelijke beoordeling van de drager en verflagen.',
      'The first imaging examinations have been completed. The next phase focuses on technical material analysis and an independent assessment of the support and paint layers.',
      'Les premiers examens d’imagerie ont été réalisés. La prochaine phase portera sur l’analyse matérielle et l’évaluation indépendante du support et des couches picturales.'
    ),
    nextStep: trilingual(
      'Pigment- en vernisanalyse, houtidentificatie en verdere infraroodbeeldvorming voorbereiden.',
      'Prepare pigment and varnish analysis, wood identification and further infrared imaging.',
      'Préparer l’analyse des pigments et du vernis, l’identification du bois et de nouvelles prises de vue infrarouges.'
    ),
    methodologyTitle: trilingual('Onderzoek met meerdere disciplines', 'A multidisciplinary investigation', 'Une recherche pluridisciplinaire'),
    methodologyText: trilingual(
      'Een toeschrijving ontstaat nooit uit één signatuur, één foto of één laboratoriumresultaat. Materiaal, techniek, herkomst, conditie en kunsthistorische context moeten samen een consistent beeld vormen.',
      'An attribution never rests on a single signature, photograph or laboratory result. Materials, technique, provenance, condition and art-historical context must form a consistent whole.',
      'Une attribution ne repose jamais sur une seule signature, photographie ou analyse de laboratoire. Les matériaux, la technique, la provenance, l’état et le contexte historique doivent former un ensemble cohérent.'
    ),
    researchImage: '/images/lost-rembrandt/research-laboratory.jpeg',
    researchImageAlt: trilingual(
      'Een schilderij tijdens technisch onderzoek in een gespecialiseerd laboratorium',
      'A painting undergoing technical examination in a specialised laboratory',
      'Une peinture soumise à un examen technique dans un laboratoire spécialisé'
    ),
    aboutTitle: trilingual('Over het project', 'About the project', 'À propos du projet'),
    aboutIntro: trilingual(
      'Hoeveel Rembrandts wachten nog om ontdekt te worden? Het antwoord kennen we niet. Wel weten we dat toeschrijvingen blijven veranderen wanneer nieuwe documentatie, technologie en inzichten samenkomen.',
      'How many Rembrandts are still waiting to be discovered? We do not know. What we do know is that attributions continue to change when new documentation, technology and insight come together.',
      'Combien de Rembrandt attendent encore d’être découverts ? Nous l’ignorons. Nous savons toutefois que les attributions continuent d’évoluer lorsque documentation, technologie et nouvelles connaissances se rejoignent.'
    ),
    investigationsTitle: trilingual('Lopende onderzoeken', 'Current investigations', 'Recherches en cours'),
    investigationsIntro: trilingual(
      'Drie dossiers vormen het begin van dit onderzoeksinitiatief. Ze worden als vertrouwelijke inzendingen gepresenteerd; de identiteit van de eigenaar wordt niet gepubliceerd.',
      'Three cases mark the beginning of this research initiative. They are presented as confidential submissions; the owner’s identity is not published.',
      'Trois dossiers constituent le point de départ de cette initiative. Ils sont présentés comme des soumissions confidentielles ; l’identité du propriétaire n’est pas publiée.'
    ),
    processTitle: trilingual('Het onderzoeksproces', 'The research process', 'Le processus de recherche'),
    processIntro: trilingual(
      'Ieder onderzoek begint met vragen, niet met conclusies. Het programma wordt per schilderij bepaald en kan verschillende onafhankelijke disciplines samenbrengen.',
      'Every investigation begins with questions, not conclusions. The programme is determined for each painting and may bring together several independent disciplines.',
      'Toute recherche commence par des questions, jamais par des conclusions. Le programme est défini pour chaque tableau et peut réunir plusieurs disciplines indépendantes.'
    ),
    submissionTitle: trilingual('Dien uw schilderij in', 'Submit your painting', 'Soumettez votre tableau'),
    submissionIntro: trilingual(
      'Bezit u een schilderij waarvan u vermoedt dat het verband kan houden met Rembrandt of zijn atelier? Leg het vertrouwelijk voor aan The Lost Rembrandt Project voor een eerste beoordeling.',
      'Do you own a painting that you suspect may be connected with Rembrandt or his workshop? Submit it confidentially to The Lost Rembrandt Project for an initial assessment.',
      'Possédez-vous un tableau susceptible d’être lié à Rembrandt ou à son atelier ? Soumettez-le confidentiellement à The Lost Rembrandt Project pour une première évaluation.'
    ),
    submissionChecklist: trilingual(
      ['Voor- en achterzijde', 'Lijst, etiketten, stempels en zegels', 'Signatuur, datering en belangrijke details', 'Exacte afmetingen en drager', 'Bekende provenance', 'Bestaande expertises, restauratie- en onderzoeksrapporten'],
      ['Front and reverse', 'Frame, labels, stamps and seals', 'Signature, date and important details', 'Exact dimensions and support', 'Known provenance', 'Existing expert opinions, conservation and research reports'],
      ['Recto et verso', 'Cadre, étiquettes, cachets et sceaux', 'Signature, date et détails importants', 'Dimensions exactes et support', 'Provenance connue', 'Expertises et rapports de restauration ou de recherche existants']
    ),
    submissionNotice: trilingual(
      'Laat het schilderij vóór de beoordeling niet reinigen of restaureren en laat geen verfmonsters nemen zonder gespecialiseerd advies.',
      'Do not have the painting cleaned or restored before assessment, and do not allow paint samples to be taken without specialist advice.',
      'Ne faites pas nettoyer ou restaurer le tableau avant son évaluation et ne faites prélever aucun échantillon de peinture sans l’avis d’un spécialiste.'
    ),
    confidentialityTitle: trilingual('Vertrouwelijkheid en discretie', 'Confidentiality and discretion', 'Confidentialité et discrétion'),
    confidentialityText: trilingual(
      'De identiteit van de eigenaar, de locatie van het schilderij en onderzoeksresultaten worden niet zonder voorafgaande toestemming openbaar gemaakt.',
      'The owner’s identity, the painting’s location and research results are not made public without prior permission.',
      'L’identité du propriétaire, la localisation du tableau et les résultats de recherche ne sont pas rendus publics sans autorisation préalable.'
    ),
    closingTitle: trilingual('Het onderzoek gaat verder', 'The investigation continues', 'La recherche se poursuit'),
    closingText: trilingual(
      'Nieuwe bevindingen worden toegevoegd zodra ze zorgvuldig zijn gecontroleerd en geschikt zijn voor publieke communicatie.',
      'New findings will be added once they have been carefully reviewed and are suitable for public communication.',
      'De nouveaux résultats seront ajoutés après vérification attentive et lorsqu’ils pourront être communiqués publiquement.'
    ),
    heroImage: '/images/lost-rembrandt/project-01-portrait.jpg',
    heroAlt: trilingual('Detail van een onderzocht zeventiende-eeuws portret', 'Detail of a seventeenth-century portrait under investigation', 'Détail d’un portrait du XVIIe siècle faisant l’objet de recherches'),
    socialImage: '/images/lost-rembrandt/project-01-portrait.jpg',
    projectStatus: 'technical-research',
    currentPhaseId: 'technical',
    seoTitle: trilingual(
      'The Lost Rembrandt Project — Onderzoek naar vergeten en verkeerd toegeschreven werken',
      'The Lost Rembrandt Project — Investigating forgotten and misattributed works',
      'The Lost Rembrandt Project — Recherche sur des œuvres oubliées et mal attribuées'
    ),
    seoDescription: trilingual(
      'Ontdek het internationale onderzoeksinitiatief van Atelier Rembrandt, volg lopende dossiers en dien vertrouwelijk een mogelijk werk uit Rembrandts omgeving in.',
      'Discover Atelier Rembrandt’s international research initiative, follow current investigations and confidentially submit a possible work from Rembrandt’s circle.',
      'Découvrez l’initiative internationale d’Atelier Rembrandt, suivez les recherches en cours et soumettez confidentiellement une œuvre potentielle de l’entourage de Rembrandt.'
    )
  },
  aboutSections: [
    {
      id: 'changing-oeuvre', sortOrder: 1, visible: true,
      title: trilingual('Een oeuvre dat voortdurend verandert', 'An oeuvre that continues to change', 'Une œuvre en constante évolution'),
      body: trilingual(
        'Het aantal schilderijen dat aan Rembrandt wordt toegeschreven, is gedurende de afgelopen twee eeuwen sterk veranderd. Het Rembrandt Research Project combineerde stilistische analyse met steeds geavanceerdere wetenschappelijke onderzoeksmethoden. Werken werden verwijderd, later opnieuw onderzocht en soms opnieuw aan Rembrandt toegeschreven. De geschiedenis van het Rembrandtonderzoek is daarom niet alleen een verhaal van afwijzing, maar ook van herontdekking.',
        'The number of paintings attributed to Rembrandt has changed dramatically over the past two centuries. The Rembrandt Research Project combined stylistic analysis with increasingly sophisticated scientific methods. Works were removed, later reconsidered and in some cases reattributed. The history of Rembrandt scholarship is therefore not only a story of rejection, but also one of rediscovery.',
        'Le nombre de peintures attribuées à Rembrandt a considérablement évolué au cours des deux derniers siècles. Le Rembrandt Research Project a associé l’analyse stylistique à des méthodes scientifiques de plus en plus sophistiquées. Des œuvres ont été écartées, puis réexaminées et parfois réattribuées. L’histoire de la recherche sur Rembrandt est donc autant celle de la redécouverte que celle du rejet.'
      )
    },
    {
      id: 'rediscovery', sortOrder: 2, visible: true,
      title: trilingual('Rembrandts worden nog steeds herontdekt', 'Rembrandts are still being rediscovered', 'Des Rembrandt sont encore redécouverts'),
      body: trilingual(
        'Een onbekende Rembrandt hoeft niet letterlijk “verloren” te zijn. Een schilderij kan zich in een particuliere collectie, een familiebezit, een museumdepot of een veilingcatalogus bevinden. Het kan lang geleden verkeerd zijn toegeschreven of eenvoudig als Hollandse School, atelier, omgeving of navolger zijn geclassificeerd.',
        'An unknown Rembrandt does not need to be literally “lost”. A painting may be in a private collection, a family holding, a museum reserve or an auction catalogue. It may have been misattributed long ago or simply classified as Dutch School, workshop, circle or follower.',
        'Un Rembrandt inconnu ne doit pas nécessairement être littéralement « perdu ». Un tableau peut se trouver dans une collection privée, un héritage familial, une réserve de musée ou un catalogue de vente. Il peut avoir été mal attribué autrefois ou simplement classé comme École hollandaise, atelier, entourage ou suiveur.'
      )
    },
    {
      id: 'workshop', sortOrder: 3, visible: true,
      title: trilingual('Rembrandt werkte niet alleen', 'Rembrandt did not work alone', 'Rembrandt ne travaillait pas seul'),
      body: trilingual(
        'De werkelijkheid van een zeventiende-eeuws atelier was complex. Een werk kon door Rembrandt zijn ontworpen en gedeeltelijk door medewerkers zijn uitgevoerd. Een leerling kon een compositie beginnen waarna Rembrandt belangrijke passages corrigeerde, overschilderde of voltooide. Daarom onderzoekt het project niet alleen de binaire vraag “Rembrandt of geen Rembrandt?”, maar ook de aard en mogelijke mate van zijn betrokkenheid.',
        'The reality of a seventeenth-century workshop was complex. A work might be designed by Rembrandt and partially executed by assistants. A pupil might begin a composition before Rembrandt corrected, overpainted or completed important passages. The project therefore looks beyond the binary question “Rembrandt or not Rembrandt?” to the nature and possible degree of his involvement.',
        'La réalité d’un atelier du XVIIe siècle était complexe. Une œuvre pouvait être conçue par Rembrandt et partiellement exécutée par ses collaborateurs. Un élève pouvait commencer une composition avant que Rembrandt n’en corrige, repeigne ou achève des passages importants. Le projet dépasse donc la question binaire « Rembrandt ou non ? » pour étudier la nature et le degré éventuel de son intervention.'
      )
    },
    {
      id: 'surface', sortOrder: 4, visible: true,
      title: trilingual('Onder het zichtbare oppervlak', 'Beneath the visible surface', 'Sous la surface visible'),
      body: trilingual(
        'Een schilderij van bijna vier eeuwen oud heeft vaak een bewogen geschiedenis. Vernissen verkleuren, verf slijt, schade wordt hersteld en latere restauratoren retoucheren of overschilderen delen. Wat we vandaag zien is dus niet noodzakelijk wat de schilder en zijn tijdgenoten zagen. Onder het oppervlak bevindt zich de materiële geschiedenis van het werk.',
        'A painting almost four centuries old often has an eventful history. Varnishes discolour, paint wears, damage is repaired and later conservators retouch or overpaint passages. What we see today is therefore not necessarily what the painter and his contemporaries saw. Beneath the surface lies the material history of the work.',
        'Un tableau vieux de près de quatre siècles a souvent connu une histoire mouvementée. Les vernis se décolorent, la peinture s’use, les dégâts sont réparés et des restaurateurs retouchent ou repeignent certaines zones. Ce que nous voyons aujourd’hui n’est donc pas nécessairement ce que le peintre et ses contemporains voyaient. Sous la surface se trouve l’histoire matérielle de l’œuvre.'
      )
    },
    {
      id: 'evidence', sortOrder: 5, visible: true,
      title: trilingual('Geen enkele test bewijst een Rembrandt', 'No single test proves a Rembrandt', 'Aucun test ne prouve à lui seul un Rembrandt'),
      body: trilingual(
        'Dendrochronologie kan aantonen dat hout in de juiste periode beschikbaar was, pigmentanalyse kan materialen dateren en beeldvorming kan veranderingen tonen. Geen van die resultaten identificeert op zichzelf de schilder. Een hypothese wordt pas sterker wanneer onafhankelijke elementen — materiaal, techniek, provenance, stijl, signatuur en documentatie — in dezelfde richting wijzen.',
        'Dendrochronology can show that wood was available in the right period, pigment analysis can date materials and imaging can reveal changes. None of these results identifies the painter on its own. A hypothesis becomes stronger only when independent elements — materials, technique, provenance, style, signature and documentation — point in the same direction.',
        'La dendrochronologie peut montrer que le bois était disponible à la bonne époque, l’analyse des pigments peut dater les matériaux et l’imagerie peut révéler des modifications. Aucun de ces résultats n’identifie à lui seul le peintre. Une hypothèse ne se renforce que lorsque des éléments indépendants — matériaux, technique, provenance, style, signature et documentation — convergent.'
      )
    }
  ],
  investigations: [
    {
      id: 'project-01', slug: 'project-01', sortOrder: 1, visible: true, featured: true, status: 'technical-research', reference: 'AR-001',
      title: trilingual('Project 01', 'Project 01', 'Projet 01'),
      subtitle: trilingual('Portret van een man', 'Portrait of a man', 'Portrait d’un homme'),
      summary: trilingual('Een donker portret met een tijdens reiniging zichtbaar geworden inscriptie wordt technisch, kunsthistorisch en op provenance onderzocht.', 'A dark portrait with an inscription revealed during cleaning is being examined technically, art-historically and through provenance research.', 'Un portrait sombre, portant une inscription apparue lors du nettoyage, fait l’objet d’analyses techniques, historiques et de provenance.'),
      description: trilingual('Dit is het oorspronkelijke dossier waarmee het onderzoeksprogramma begon. De publieke tijdlijn hieronder maakt duidelijk wat is vastgesteld, welke tegenargumenten bestaan en welke vragen nog openblijven.', 'This is the original case with which the research programme began. The public timeline below distinguishes what has been established, which counterarguments exist and which questions remain open.', 'Il s’agit du dossier initial qui a donné naissance au programme. La chronologie publique ci-dessous distingue les faits établis, les contre-arguments et les questions encore ouvertes.'),
      statusLabel: trilingual('Technisch onderzoek loopt', 'Technical research in progress', 'Recherche technique en cours'),
      coverImage: '/images/lost-rembrandt/project-01-portrait.jpg',
      coverAlt: trilingual('Detail van het portret in Project 01', 'Detail of the portrait in Project 01', 'Détail du portrait du Projet 01'),
      gallery: [{ id: 'project-01-detail', url: '/images/lost-rembrandt/project-01-detail.jpeg', alt: trilingual('Detailopname van het onderzochte verfoppervlak', 'Detailed view of the paint surface under investigation', 'Vue détaillée de la surface picturale étudiée'), caption: trilingual('Detailopname', 'Detail view', 'Vue de détail') }]
    },
    {
      id: 'project-02', slug: 'project-02', sortOrder: 2, visible: true, featured: false, status: 'technical-research', reference: 'AR-002',
      title: trilingual('Project 02', 'Project 02', 'Projet 02'),
      subtitle: trilingual('Portret van een oude man', 'Portrait of an old man', 'Portrait d’un vieil homme'),
      summary: trilingual('Een portret op paneel dat momenteel met microscopie, beeldvorming en onderzoek van de drager wordt gedocumenteerd.', 'A portrait on panel currently being documented through microscopy, imaging and examination of the support.', 'Un portrait sur panneau actuellement documenté par microscopie, imagerie et étude du support.'),
      description: trilingual('Het dossier bevindt zich in een onderzoeksfase. De beelden tonen onderzoekshandelingen en technische waarnemingen; zij vormen op zichzelf geen uitspraak over auteurschap.', 'The case is in a research phase. The images document examinations and technical observations; they do not in themselves constitute a statement of authorship.', 'Le dossier est en phase de recherche. Les images documentent des examens et observations techniques ; elles ne constituent pas en elles-mêmes une déclaration d’auteur.'),
      statusLabel: trilingual('Onderzoek in uitvoering', 'Investigation in progress', 'Recherche en cours'),
      coverImage: '/images/lost-rembrandt/project-02-portrait.jpeg',
      coverAlt: trilingual('Portret van een oude man uit Project 02', 'Portrait of an old man from Project 02', 'Portrait d’un vieil homme du Projet 02'),
      gallery: [
        { id: 'project-02-microscopy', url: '/images/lost-rembrandt/project-02-microscopy.jpeg', alt: trilingual('Microscopisch onderzoek van het portret', 'Microscopic examination of the portrait', 'Examen microscopique du portrait'), caption: trilingual('Microscopisch onderzoek', 'Microscopic examination', 'Examen microscopique') },
        { id: 'project-02-scanner', url: '/images/lost-rembrandt/project-02-scanner.jpeg', alt: trilingual('Technische scan van het portret', 'Technical scan of the portrait', 'Analyse technique du portrait'), caption: trilingual('Technische beeldvorming', 'Technical imaging', 'Imagerie technique') },
        { id: 'project-02-infrared', url: '/images/lost-rembrandt/project-02-infrared.jpeg', alt: trilingual('Onderzoeksopname van onderliggende verflagen', 'Research image of underlying paint layers', 'Image de recherche des couches picturales sous-jacentes'), caption: trilingual('Beeldvorming van onderliggende lagen', 'Imaging of underlying layers', 'Imagerie des couches sous-jacentes') }
      ]
    },
    {
      id: 'project-03', slug: 'project-03', sortOrder: 3, visible: true, featured: false, status: 'initial-assessment', reference: 'AR-003',
      title: trilingual('Project 03', 'Project 03', 'Projet 03'),
      subtitle: trilingual('Visioen van Zacharias in de tempel', 'Vision of Zacharias in the Temple', 'Vision de Zacharie dans le Temple'),
      summary: trilingual('Een religieuze voorstelling die als nieuwe vertrouwelijke inzending wordt voorbereid voor eerste documentatie en beoordeling.', 'A religious scene being prepared as a new confidential submission for initial documentation and assessment.', 'Une scène religieuse préparée comme nouvelle soumission confidentielle pour une première documentation et évaluation.'),
      description: trilingual('Het werk wordt uitsluitend als onderzoeksdossier gepresenteerd. Er is op dit moment geen openbare attributie of authenticiteitsconclusie.', 'The work is presented solely as a research case. There is currently no public attribution or authenticity conclusion.', 'L’œuvre est présentée uniquement comme dossier de recherche. Aucune attribution ou conclusion d’authenticité n’est actuellement rendue publique.'),
      statusLabel: trilingual('Eerste beoordeling', 'Initial assessment', 'Première évaluation'),
      coverImage: '/images/lost-rembrandt/project-03-zacharias.jpg',
      coverAlt: trilingual('Visioen van Zacharias in de tempel uit Project 03', 'Vision of Zacharias in the Temple from Project 03', 'Vision de Zacharie dans le Temple du Projet 03'),
      gallery: []
    }
  ],
  researchSteps: [
    { id: 'initial-assessment', sortOrder: 1, visible: true, title: trilingual('Eerste beoordeling', 'Initial assessment', 'Première évaluation'), body: trilingual('Het onderzoek begint doorgaans op afstand met duidelijke foto’s, afmetingen, informatie over de drager en alles wat bekend is over de geschiedenis. In deze fase wordt geen authenticiteitsoordeel uitgesproken.', 'The investigation normally begins remotely with clear photographs, dimensions, information about the support and everything known about the history. No opinion on authenticity is issued at this stage.', 'La recherche commence généralement à distance avec des photographies claires, les dimensions, des informations sur le support et tout ce qui est connu de l’histoire. Aucun jugement d’authenticité n’est formulé à ce stade.') },
    { id: 'provenance', sortOrder: 2, visible: true, title: trilingual('Provenance', 'Provenance', 'Provenance'), body: trilingual('Veilingcatalogi, inventarissen, archieven, oude foto’s, correspondentie en collectiemerken kunnen helpen de biografie van het schilderij te reconstrueren.', 'Auction catalogues, inventories, archives, old photographs, correspondence and collection marks can help reconstruct the painting’s biography.', 'Catalogues de vente, inventaires, archives, photographies anciennes, correspondance et marques de collection peuvent aider à reconstituer la biographie du tableau.') },
    { id: 'physical-examination', sortOrder: 3, visible: true, title: trilingual('Onderzoek van het schilderij', 'Examination of the painting', 'Examen du tableau'), body: trilingual('Onder vergroting worden verfstructuur, penseelvoering, craquelure, wijzigingen, restauraties, achterkant, lijst en labels systematisch bekeken.', 'Under magnification, paint structure, brushwork, craquelure, alterations, restorations, reverse, frame and labels are examined systematically.', 'Sous grossissement, la structure picturale, la touche, les craquelures, modifications, restaurations, le revers, le cadre et les étiquettes sont étudiés systématiquement.') },
    { id: 'uv', sortOrder: 4, visible: true, title: trilingual('UV-onderzoek', 'UV examination', 'Examen UV'), body: trilingual('Ultraviolet licht kan verschillen tussen vernis, retouches en andere oppervlaktelagen zichtbaar maken en helpt originele en later toegevoegde zones te onderscheiden.', 'Ultraviolet light can reveal differences between varnish, retouching and other surface layers, helping distinguish original from later additions.', 'La lumière ultraviolette peut révéler les différences entre vernis, retouches et autres couches superficielles, aidant à distinguer l’original des ajouts ultérieurs.') },
    { id: 'infrared', sortOrder: 5, visible: true, title: trilingual('Infraroodonderzoek', 'Infrared examination', 'Examen infrarouge'), body: trilingual('Infraroodfotografie en reflectografie kunnen onder geschikte omstandigheden voorbereidende lijnen, compositiewijzigingen en verborgen structuren tonen.', 'Infrared photography and reflectography can, under suitable conditions, reveal preparatory lines, compositional changes and hidden structures.', 'La photographie et la réflectographie infrarouges peuvent, dans des conditions appropriées, révéler des lignes préparatoires, changements de composition et structures cachées.') },
    { id: 'xray', sortOrder: 6, visible: true, title: trilingual('Röntgenonderzoek', 'X-radiography', 'Radiographie'), body: trilingual('Röntgenbeelden kunnen wijzigingen, verlaten vormen en aanpassingen in handen, gezichten, kleding of compositie zichtbaar maken.', 'X-radiographs can reveal changes, abandoned forms and adjustments to hands, faces, clothing or composition.', 'Les radiographies peuvent révéler modifications, formes abandonnées et adaptations des mains, visages, vêtements ou compositions.') },
    { id: 'xrf', sortOrder: 7, visible: true, title: trilingual('XRF- en pigmentonderzoek', 'XRF and pigment analysis', 'XRF et analyse des pigments'), body: trilingual('XRF en macro-XRF identificeren chemische elementen en brengen hun verdeling in kaart. Zo kunnen materiaalgebruik en verschillende schilderfasen worden onderzocht.', 'XRF and macro-XRF identify chemical elements and map their distribution, allowing materials and different painting phases to be investigated.', 'La XRF et la macro-XRF identifient les éléments chimiques et cartographient leur répartition, permettant d’étudier les matériaux et différentes phases picturales.') },
    { id: 'cross-sections', sortOrder: 8, visible: true, title: trilingual('Microstalen en verfdwarsdoorsneden', 'Micro-samples and paint cross-sections', 'Micro-échantillons et coupes stratigraphiques'), body: trilingual('Wanneer verantwoord kunnen microscopische stalen de opeenvolging van drager, grondering, oorspronkelijke verf, glacis, vernis en latere restauraties verduidelijken.', 'When justified, microscopic samples can clarify the sequence of support, ground, original paint, glazes, varnish and later restoration.', 'Lorsque cela est justifié, des micro-échantillons peuvent préciser la succession du support, de la préparation, de la peinture originale, des glacis, du vernis et des restaurations ultérieures.') },
    { id: 'dendrochronology', sortOrder: 9, visible: true, title: trilingual('Dendrochronologie en paneelonderzoek', 'Dendrochronology and panel examination', 'Dendrochronologie et étude des panneaux'), body: trilingual('Bij houten panelen kunnen houtsoort, groeiringen, constructie, verbindingen en latere aanpassingen informatie geven over datering en oorsprong.', 'For wooden panels, species, growth rings, construction, joins and later alterations can provide information about date and origin.', 'Pour les panneaux de bois, essence, cernes de croissance, construction, assemblages et modifications ultérieures peuvent renseigner sur la date et l’origine.') },
    { id: 'support', sortOrder: 10, visible: true, title: trilingual('Doek en andere dragers', 'Canvas and other supports', 'Toiles et autres supports'), body: trilingual('Weefpatroon, draaddichtheid, formaat, grondering en latere doublages of aanpassingen worden onderzocht en waar mogelijk vergeleken met gedocumenteerde praktijken.', 'Weave, thread density, format, ground and later lining or alterations are examined and, where possible, compared with documented practices.', 'Tissage, densité des fils, format, préparation et rentoilages ou modifications ultérieures sont étudiés et, si possible, comparés aux pratiques documentées.') },
    { id: 'signature', sortOrder: 11, visible: true, title: trilingual('De signatuur', 'The signature', 'La signature'), body: trilingual('Een signatuur wordt microscopisch, technisch en historisch onderzocht. Belangrijk is of zij deel uitmaakt van de oorspronkelijke verfstructuur of bovenop latere lagen werd aangebracht.', 'A signature is examined microscopically, technically and historically. A key question is whether it forms part of the original paint structure or was applied over later layers.', 'Une signature est étudiée au microscope, techniquement et historiquement. Il faut notamment déterminer si elle appartient à la structure picturale originale ou a été apposée sur des couches ultérieures.') },
    { id: 'comparison', sortOrder: 12, visible: true, title: trilingual('Stilistisch en vergelijkend onderzoek', 'Stylistic and comparative research', 'Analyse stylistique et comparative'), body: trilingual('Compositie, penseelvoering, licht, anatomie, gelaatsmodellering, kleding en expressie worden vergeleken met gedocumenteerde werken van Rembrandt, zijn leerlingen en medewerkers.', 'Composition, brushwork, light, anatomy, facial modelling, clothing and expression are compared with documented works by Rembrandt, his pupils and assistants.', 'Composition, touche, lumière, anatomie, modelé du visage, vêtements et expression sont comparés aux œuvres documentées de Rembrandt, de ses élèves et collaborateurs.') },
    { id: 'workshop-attribution', sortOrder: 13, visible: true, title: trilingual('Rembrandt of zijn atelier', 'Rembrandt or his workshop', 'Rembrandt ou son atelier'), body: trilingual('De eindvraag kan genuanceerder zijn dan één naam: volledig eigenhandig, Rembrandt en atelier, onder zijn leiding gemaakt, of een atelierwerk waarin de meester mogelijk zelf ingreep.', 'The final question may be more nuanced than a single name: entirely autograph, Rembrandt and workshop, produced under his direction, or a workshop work in which the master may have intervened.', 'La question finale peut être plus nuancée qu’un seul nom : entièrement autographe, Rembrandt et atelier, réalisé sous sa direction, ou œuvre d’atelier dans laquelle le maître aurait pu intervenir.') }
  ],
  phases: [
    { id: 'discovery', sortOrder: 1, visible: true, label: trilingual('De ontdekking', 'The discovery', 'La découverte') },
    { id: 'due-diligence', sortOrder: 2, visible: true, label: trilingual('Herkomst & controles', 'Provenance & checks', 'Provenance & vérifications') },
    { id: 'technical', sortOrder: 3, visible: true, label: trilingual('Technisch onderzoek', 'Technical research', 'Recherche technique') },
    { id: 'art-history', sortOrder: 4, visible: true, label: trilingual('Kunsthistorische vergelijking', 'Art-historical comparison', 'Comparaison historique') },
    { id: 'next', sortOrder: 5, visible: true, label: trilingual('Volgende stappen', 'Next steps', 'Prochaines étapes') }
  ],
  updates: [
    {
      id: 'acquisition-2023', slug: 'de-aankoop', investigationId: 'project-01', phaseId: 'discovery', sequence: 1, status: 'published', evidenceType: 'documented', eventDate: '2023-12-01', publishedAt: '2026-06-01T08:00:00.000Z', featured: false,
      title: trilingual('De aankoop van een onbekend portret', 'The acquisition of an unknown portrait', 'L’acquisition d’un portrait inconnu'),
      summary: trilingual('Een donker, moeilijk leesbaar portret wordt via een Franse veiling aangekocht als een veel later werk.', 'A dark, difficult-to-read portrait is acquired through a French auction as a much later work.', 'Un portrait sombre et difficile à lire est acquis lors d’une vente française comme une œuvre bien plus tardive.'),
      body: trilingual(
        'Het schilderij werd in december 2023 via het Franse veilingplatform Drouot aangekocht. In de catalogus was het omschreven als een 19de-eeuws werk naar Rembrandt, met een onleesbare signatuur.\n\nDe aankoop was aanvankelijk niet ingegeven door een authenticiteitshypothese. Het portret trok vooral de aandacht door de sterke persoonlijke uitstraling van de geportretteerde. Pas na aankomst in België begon een ander verhaal.',
        'The painting was acquired in December 2023 through the French auction platform Drouot. It had been catalogued as a nineteenth-century work after Rembrandt with an illegible signature.\n\nThe purchase was not initially driven by an attribution theory. The portrait attracted attention because of the sitter’s powerful personal presence. Only after its arrival in Belgium did a different story begin.',
        'Le tableau a été acquis en décembre 2023 sur la plateforme française Drouot. Il était catalogué comme une œuvre du XIXe siècle d’après Rembrandt, portant une signature illisible.\n\nL’achat n’était pas motivé à l’origine par une hypothèse d’attribution. Le portrait séduisait surtout par la présence du modèle. Ce n’est qu’après son arrivée en Belgique qu’une autre histoire a commencé.'
      ),
      keyFindings: trilingual(['Aankoop via Drouot in december 2023', 'Catalogusomschrijving: 19de-eeuwse school, naar Rembrandt'], ['Acquired through Drouot in December 2023', 'Catalogue description: nineteenth-century school, after Rembrandt'], ['Acquis via Drouot en décembre 2023', 'Description au catalogue : école du XIXe siècle, d’après Rembrandt']),
      nextStep: trilingual('Een voorzichtige oppervlaktereiniging door een professionele restaurator.', 'A cautious surface cleaning by a professional conservator.', 'Un nettoyage prudent de la surface par un restaurateur professionnel.'),
      coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'signature-discovery', slug: 'de-vrijgelegde-signatuur', investigationId: 'project-01', phaseId: 'discovery', sequence: 2, status: 'published', evidenceType: 'observation', eventDate: '2024-01-15', publishedAt: '2026-06-08T08:00:00.000Z', featured: true,
      title: trilingual('Een signatuur komt onder het vernis tevoorschijn', 'A signature emerges beneath the varnish', 'Une signature apparaît sous le vernis'),
      summary: trilingual('Tijdens een voorzichtige reiniging wordt rechtsboven een inscriptie zichtbaar: “Rembrandt f. 1637”.', 'During careful cleaning, an inscription becomes visible in the upper right: “Rembrandt f. 1637”.', 'Lors d’un nettoyage prudent, une inscription apparaît en haut à droite : « Rembrandt f. 1637 ».'),
      body: trilingual(
        'De verflaag was bedekt met een sterk geoxideerde en vervuilde vernis. Tijdens een beperkte, professioneel begeleide reiniging kwam in de rechterbovenhoek geleidelijk een inscriptie tevoorschijn.\n\nDe leesbare tekst lijkt “Rembrandt f. 1637” te vormen. De ontdekking is belangrijk, maar een signatuur alleen bewijst geen auteurschap. Daarom moet worden onderzocht hoe de inscriptie zich tot de oorspronkelijke verflagen en latere restauraties verhoudt.',
        'The paint surface was covered by heavily oxidised and soiled varnish. During a limited, professionally supervised cleaning, an inscription gradually emerged in the upper right corner.\n\nThe legible text appears to read “Rembrandt f. 1637”. The discovery is significant, but a signature alone does not prove authorship. Its relationship to the original paint layers and later interventions must therefore be examined.',
        'La couche picturale était recouverte d’un vernis fortement oxydé et encrassé. Lors d’un nettoyage limité, réalisé sous supervision professionnelle, une inscription est progressivement apparue dans l’angle supérieur droit.\n\nLe texte lisible semble former « Rembrandt f. 1637 ». Cette découverte est importante, mais une signature seule ne prouve pas l’auteur. Son rapport avec les couches picturales originales et les restaurations ultérieures doit donc être étudié.'
      ),
      keyFindings: trilingual(['Inscriptie was niet zichtbaar vóór de reiniging', 'Lezing: “Rembrandt f. 1637”', 'Materiële relatie met de verflagen moet nog worden onderzocht'], ['Inscription was not visible before cleaning', 'Reading: “Rembrandt f. 1637”', 'Its material relationship to the paint layers still requires examination'], ['Inscription invisible avant le nettoyage', 'Lecture : « Rembrandt f. 1637 »', 'Son rapport matériel avec les couches picturales doit encore être étudié']),
      nextStep: trilingual('De signatuur technisch documenteren en vergelijken met referentiemateriaal.', 'Document the signature technically and compare it with reference material.', 'Documenter techniquement la signature et la comparer à des références.'),
      coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'art-loss-register', slug: 'art-loss-register', investigationId: 'project-01', phaseId: 'due-diligence', sequence: 3, status: 'published', evidenceType: 'documented', eventDate: '2026-03-25', publishedAt: '2026-06-15T08:00:00.000Z', featured: false,
      title: trilingual('Controle van de bekende verliesregisters', 'Checking the known loss registers', 'Vérification des registres de pertes connus'),
      summary: trilingual('Het Art Loss Register meldt dat het werk niet als gestolen of vermist in zijn databank voorkomt.', 'The Art Loss Register reports that the work is not recorded as stolen or missing in its database.', 'L’Art Loss Register indique que l’œuvre n’est pas enregistrée comme volée ou disparue dans sa base.'),
      body: trilingual('Als onderdeel van de due diligence werd het werk voorgelegd aan het Art Loss Register in Londen. Op 25 maart 2026 werd een certificaat afgegeven waarin staat dat het object niet als gestolen of vermist in de geraadpleegde databank voorkomt.\n\nDit is een relevante controle, maar geen volledige reconstructie van de eigendomsgeschiedenis. Verder provenanceonderzoek blijft noodzakelijk.', 'As part of due diligence, the work was submitted to the Art Loss Register in London. On 25 March 2026, a certificate stated that the object was not recorded as stolen or missing in the database consulted.\n\nThis is a relevant check, but it is not a complete reconstruction of ownership history. Further provenance research remains necessary.', 'Dans le cadre de la diligence raisonnable, l’œuvre a été soumise à l’Art Loss Register à Londres. Le 25 mars 2026, un certificat a indiqué que l’objet n’était pas répertorié comme volé ou disparu dans la base consultée.\n\nIl s’agit d’une vérification importante, mais pas d’une reconstitution complète de l’historique de propriété. La recherche de provenance doit se poursuivre.'),
      keyFindings: trilingual(['ALR-controle uitgevoerd', 'Geen overeenkomst in de geraadpleegde verliesregisters', 'Provenanceonderzoek blijft open'], ['ALR check completed', 'No match in the loss registers consulted', 'Provenance research remains open'], ['Vérification ALR effectuée', 'Aucune correspondance dans les registres consultés', 'La recherche de provenance reste ouverte']),
      nextStep: trilingual('De oudere eigendomsgeschiedenis en eventuele restauratiegeschiedenis verder reconstrueren.', 'Continue reconstructing the earlier ownership and conservation history.', 'Poursuivre la reconstitution de la provenance ancienne et de l’historique des restaurations.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'xray-research', slug: 'rontgenonderzoek', investigationId: 'project-01', phaseId: 'technical', sequence: 4, status: 'published', evidenceType: 'observation', eventDate: '2026-04-15', publishedAt: '2026-06-22T08:00:00.000Z', featured: false,
      title: trilingual('Röntgenbeelden tonen de opbouw onder het oppervlak', 'X-rays reveal the structure beneath the surface', 'Les radiographies révèlent la structure sous la surface'),
      summary: trilingual('Röntgenopnamen brengen loodhoudende, pasteuze partijen en de interne opbouw van het schilderij in beeld.', 'X-radiographs visualise lead-containing, impasto passages and the internal construction of the painting.', 'Les radiographies montrent des zones empâtées contenant du plomb et la construction interne du tableau.'),
      body: trilingual('Röntgenonderzoek maakt delen van de schildertechniek zichtbaar die met het blote oog niet kunnen worden beoordeeld. Loodhoudende pigmenten absorberen röntgenstraling sterk en verschijnen daardoor licht op de opname.\n\nDe beelden tonen uitgesproken lichte partijen in onder meer het gezicht en de kleding. Dat is relevant voor het verdere onderzoek naar de werkwijze, maar zulke kenmerken zijn niet uniek genoeg om op zichzelf een toeschrijving te dragen.', 'X-radiography reveals aspects of painting technique that cannot be assessed with the naked eye. Lead-containing pigments strongly absorb X-rays and therefore appear light in the image.\n\nThe radiographs show pronounced light passages in the face and clothing. This is relevant to the investigation of working method, but such features are not unique enough to support an attribution on their own.', 'La radiographie révèle des aspects de la technique picturale invisibles à l’œil nu. Les pigments contenant du plomb absorbent fortement les rayons X et apparaissent donc clairs.\n\nLes images montrent des zones lumineuses marquées dans le visage et le vêtement. Ces éléments sont utiles pour étudier la méthode de travail, mais ne sont pas suffisamment uniques pour fonder à eux seuls une attribution.'),
      keyFindings: trilingual(['Beeldvorming van onderliggende verflagen', 'Loodhoudende partijen zichtbaar', 'Interpretatie vereist vergelijking met referentiewerken'], ['Imaging of underlying paint layers', 'Lead-containing passages visible', 'Interpretation requires comparison with reference works'], ['Visualisation des couches sous-jacentes', 'Zones contenant du plomb visibles', 'L’interprétation nécessite une comparaison avec des œuvres de référence']),
      nextStep: trilingual('De röntgenbeelden laten beoordelen in samenhang met pigment-, grondlaag- en infraroodonderzoek.', 'Assess the X-rays together with pigment, ground-layer and infrared analysis.', 'Évaluer les radiographies avec les analyses des pigments, de la préparation et de l’infrarouge.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'uv-observations', slug: 'uv-observaties', investigationId: 'project-01', phaseId: 'technical', sequence: 5, status: 'published', evidenceType: 'observation', eventDate: '2026-04-30', publishedAt: '2026-06-29T08:00:00.000Z', featured: false,
      title: trilingual('UV-licht helpt latere ingrepen lokaliseren', 'UV light helps locate later interventions', 'La lumière UV aide à localiser les interventions ultérieures'),
      summary: trilingual('UV-fluorescentie maakt verschillen in vernis, retouches en oppervlaktelagen beter zichtbaar.', 'UV fluorescence makes differences in varnish, retouching and surface layers more visible.', 'La fluorescence UV rend plus visibles les différences de vernis, de retouches et de couches superficielles.'),
      body: trilingual('Onder ultraviolet licht reageren vernislagen, retouches en bepaalde materialen verschillend. De opnamen leveren daarom een kaart van zones die bij verdere restauratie en bemonstering bijzondere aandacht vragen.\n\nUV-beeldvorming identificeert niet automatisch een pigment of kunstenaar. De observaties worden gebruikt om gerichte vragen te formuleren voor vervolgonderzoek.', 'Under ultraviolet light, varnishes, retouching and certain materials react differently. The images therefore provide a map of areas that require particular attention during further conservation and sampling.\n\nUV imaging does not automatically identify a pigment or artist. The observations are used to formulate focused questions for subsequent analysis.', 'Sous lumière ultraviolette, les vernis, retouches et certains matériaux réagissent différemment. Les images offrent donc une cartographie des zones qui demanderont une attention particulière lors de la restauration et des prélèvements.\n\nL’imagerie UV n’identifie pas automatiquement un pigment ou un artiste. Les observations servent à formuler des questions ciblées pour les analyses suivantes.'),
      keyFindings: trilingual(['Verschillen in oppervlaktelagen zichtbaar', 'Zones voor vervolgonderzoek gelokaliseerd', 'Geen zelfstandige authenticiteitsconclusie'], ['Differences in surface layers visible', 'Areas for further research located', 'No independent authenticity conclusion'], ['Différences entre couches superficielles visibles', 'Zones à étudier localisées', 'Aucune conclusion autonome sur l’authenticité']),
      nextStep: trilingual('De UV-kaart koppelen aan een onafhankelijk conditierapport en gerichte materiaalmonsters.', 'Link the UV map to an independent condition report and targeted material samples.', 'Relier la cartographie UV à un constat d’état indépendant et à des prélèvements ciblés.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'carbon-dating', slug: 'de-c14-vraag', investigationId: 'project-01', phaseId: 'technical', sequence: 6, status: 'published', evidenceType: 'external-review', eventDate: '2026-05-15', publishedAt: '2026-07-06T08:00:00.000Z', featured: false,
      title: trilingual('Een C14-resultaat roept nieuwe vragen op', 'A radiocarbon result raises new questions', 'Un résultat radiocarbone soulève de nouvelles questions'),
      summary: trilingual('Een houtmonster leverde een veel latere datering op. De bemonsteringsplaats en mogelijke verontreiniging worden nu kritisch onderzocht.', 'A wood sample produced a much later date. The sampling location and possible contamination are now being critically examined.', 'Un échantillon de bois a fourni une datation bien plus tardive. L’emplacement du prélèvement et une éventuelle contamination sont désormais examinés de manière critique.'),
      body: trilingual('Een radiokoolstofanalyse rapporteerde een hoge waarschijnlijkheid voor een datering van het bemonsterde materiaal tussen 1790 en 1950. Dat resultaat kan niet worden genegeerd en vormt een belangrijk tegenargument.\n\nTegelijk zijn er vragen over de plaats waar het monster uit de zijkant van het paneel werd genomen en over mogelijke lijm-, vernis- of restauratiecomponenten. De juiste vervolgstap is daarom geen snelle verwerping of bevestiging, maar onafhankelijke houtidentificatie, documentatie van de monsterlocatie en zo nodig een nieuwe, gecontroleerde analyse.', 'A radiocarbon analysis reported a high probability that the sampled material dated between 1790 and 1950. This result cannot be ignored and is an important counterargument.\n\nAt the same time, questions remain about the location of the sample on the panel edge and possible glue, varnish or restoration components. The appropriate next step is therefore neither quick dismissal nor confirmation, but independent wood identification, documentation of the sampling location and, if necessary, a new controlled analysis.', 'Une analyse radiocarbone a indiqué une forte probabilité que le matériau prélevé date de 1790 à 1950. Ce résultat ne peut être ignoré et constitue un contre-argument important.\n\nDes questions subsistent toutefois quant à l’emplacement du prélèvement sur le bord du panneau et à la présence éventuelle de colle, de vernis ou de matériaux de restauration. La prochaine étape ne consiste donc ni à rejeter ni à confirmer rapidement ce résultat, mais à identifier le bois de manière indépendante, documenter le prélèvement et, si nécessaire, procéder à une nouvelle analyse contrôlée.'),
      keyFindings: trilingual(['Gerapporteerde datering: 1790–1950', 'Resultaat vormt een serieus tegenargument', 'Bemonstering en contaminatie moeten onafhankelijk worden geëvalueerd'], ['Reported date range: 1790–1950', 'The result is a serious counterargument', 'Sampling and contamination require independent evaluation'], ['Datation rapportée : 1790–1950', 'Le résultat constitue un contre-argument sérieux', 'Le prélèvement et la contamination doivent être évalués indépendamment']),
      nextStep: trilingual('Onafhankelijke houtidentificatie en beoordeling van de monstername organiseren.', 'Arrange independent wood identification and assessment of the sampling procedure.', 'Organiser une identification indépendante du bois et une évaluation du prélèvement.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'planned-research', slug: 'de-volgende-onderzoeksfase', investigationId: 'project-01', phaseId: 'next', sequence: 7, status: 'published', evidenceType: 'next-step', eventDate: '2026-06-01', publishedAt: '2026-07-13T08:00:00.000Z', featured: false,
      title: trilingual('De volgende onderzoeksfase', 'The next phase of research', 'La prochaine phase de recherche'),
      summary: trilingual('Een samenhangend pakket van materiaaltechnische analyses moet de belangrijkste open vragen toetsen.', 'A coordinated programme of technical analyses must test the principal open questions.', 'Un programme coordonné d’analyses techniques doit examiner les principales questions ouvertes.'),
      body: trilingual('De volgende fase wordt opgebouwd rond meerdere onderzoeksmethoden die elkaar moeten controleren. Pigment- en vernisanalyse kan materialen dateren of uitsluiten. Houtidentificatie en eventueel dendrochronologisch onderzoek richten zich op de drager. Infraroodreflectografie en stratigrafie kunnen informatie geven over de opbouw, voorbereidende stadia en latere ingrepen.\n\nPas wanneer deze resultaten samen met het conditierapport, de herkomst en de kunsthistorische vergelijking worden beoordeeld, kan een beter onderbouwde attributiecategorie worden besproken.', 'The next phase combines several research methods that must check one another. Pigment and varnish analysis may date or exclude materials. Wood identification and possible dendrochronology focus on the support. Infrared reflectography and stratigraphy may reveal construction, preparatory stages and later interventions.\n\nOnly when these results are assessed together with the condition report, provenance and art-historical comparison can a more firmly supported attribution category be discussed.', 'La prochaine phase combine plusieurs méthodes qui doivent se contrôler mutuellement. L’analyse des pigments et du vernis peut dater ou exclure certains matériaux. L’identification du bois et une éventuelle dendrochronologie concernent le support. La réflectographie infrarouge et la stratigraphie peuvent révéler la construction, les étapes préparatoires et les interventions ultérieures.\n\nCe n’est qu’en confrontant ces résultats au constat d’état, à la provenance et à la comparaison historique qu’une catégorie d’attribution mieux étayée pourra être discutée.'),
      keyFindings: trilingual(['Pigment- en vernisanalyse', 'Houtidentificatie en eventueel dendrochronologie', 'Infraroodreflectografie', 'Stratigrafie van de verflagen', 'Onafhankelijk conditierapport'], ['Pigment and varnish analysis', 'Wood identification and possible dendrochronology', 'Infrared reflectography', 'Paint-layer stratigraphy', 'Independent condition report'], ['Analyse des pigments et du vernis', 'Identification du bois et éventuelle dendrochronologie', 'Réflectographie infrarouge', 'Stratigraphie des couches picturales', 'Constat d’état indépendant']),
      nextStep: trilingual('Gekwalificeerde onderzoeksinstellingen selecteren en de volgorde van niet-destructieve en micro-invasieve analyses vastleggen.', 'Select qualified research institutions and determine the sequence of non-invasive and micro-invasive analyses.', 'Sélectionner des institutions qualifiées et définir l’ordre des analyses non invasives et micro-invasives.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    }
  ],
  updatedAt: '2026-08-28T00:00:00.000Z'
};

export const cloneDefaultRembrandtProject = () => JSON.parse(JSON.stringify(DEFAULT_REMBRANDT_PROJECT));
