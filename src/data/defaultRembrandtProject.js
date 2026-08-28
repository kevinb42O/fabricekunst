const trilingual = (nl, en, fr) => ({ nl, en, fr });

export const REMBRANDT_PROJECT_STATUSES = [
  { value: 'discovery', label: 'Ontdekking' },
  { value: 'technical-research', label: 'Technisch onderzoek' },
  { value: 'expert-review', label: 'Expertbeoordeling' },
  { value: 'paused', label: 'Tijdelijk gepauzeerd' },
  { value: 'completed', label: 'Onderzoek afgerond' }
];

export const REMBRANDT_EVIDENCE_TYPES = [
  { value: 'documented', label: 'Gedocumenteerd' },
  { value: 'observation', label: 'Voorlopige observatie' },
  { value: 'hypothesis', label: 'Onderzoekshypothese' },
  { value: 'external-review', label: 'Externe beoordeling' },
  { value: 'next-step', label: 'Volgende onderzoeksstap' }
];

export const DEFAULT_REMBRANDT_PROJECT = {
  schemaVersion: 1,
  isEnabled: true,
  settings: {
    title: trilingual('The Rembrandt Project', 'The Rembrandt Project', 'The Rembrandt Project'),
    eyebrow: trilingual('Een onderzoek in uitvoering', 'An investigation in progress', 'Une recherche en cours'),
    intro: trilingual(
      'Het stap-voor-stap onderzoek naar een intrigerend 17de-eeuws portret dat mogelijk rechtstreeks verbonden is met Rembrandt van Rijn.',
      'The step-by-step investigation of an intriguing seventeenth-century portrait that may be directly connected to Rembrandt van Rijn.',
      'L’étude, étape par étape, d’un fascinant portrait du XVIIe siècle qui pourrait être directement lié à Rembrandt van Rijn.'
    ),
    summary: trilingual(
      'In december 2023 werd een schilderij aangekocht dat als een veel later werk was omschreven. Na een eerste reiniging kwam een signatuur met de naam Rembrandt en het jaartal 1637 tevoorschijn. Sindsdien wordt het paneel methodisch onderzocht. Op deze pagina documenteren we wat vaststaat, welke vragen openblijven en welke volgende stappen worden gezet.',
      'In December 2023, a painting was acquired that had been described as a much later work. During an initial cleaning, a signature bearing the name Rembrandt and the date 1637 emerged. The panel has since been examined methodically. This page records what is established, which questions remain open and what steps will follow.',
      'En décembre 2023, un tableau décrit comme une œuvre bien plus tardive a été acquis. Lors d’un premier nettoyage, une signature portant le nom de Rembrandt et la date de 1637 est apparue. Depuis, le panneau fait l’objet d’un examen méthodique. Cette page présente les faits établis, les questions encore ouvertes et les prochaines étapes.'
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
    closingTitle: trilingual('Het onderzoek gaat verder', 'The investigation continues', 'La recherche se poursuit'),
    closingText: trilingual(
      'Nieuwe bevindingen worden toegevoegd zodra ze zorgvuldig zijn gecontroleerd en geschikt zijn voor publieke communicatie.',
      'New findings will be added once they have been carefully reviewed and are suitable for public communication.',
      'De nouveaux résultats seront ajoutés après vérification attentive et lorsqu’ils pourront être communiqués publiquement.'
    ),
    heroImage: '',
    heroAlt: trilingual('Het onderzochte portret van een man met tulband', 'The portrait of a man in a turban under investigation', 'Le portrait d’un homme au turban faisant l’objet de recherches'),
    socialImage: '',
    projectStatus: 'technical-research',
    currentPhaseId: 'technical',
    seoTitle: trilingual(
      'The Rembrandt Project — Onderzoek naar een mogelijk verloren werk',
      'The Rembrandt Project — Investigating a possibly lost work',
      'The Rembrandt Project — Recherche sur une œuvre potentiellement perdue'
    ),
    seoDescription: trilingual(
      'Volg stap voor stap het technische, kunsthistorische en herkomstonderzoek naar een intrigerend schilderij met de signatuur Rembrandt f. 1637.',
      'Follow the technical, art-historical and provenance investigation of an intriguing painting bearing the signature Rembrandt f. 1637.',
      'Suivez les recherches techniques, historiques et de provenance autour d’un tableau portant la signature Rembrandt f. 1637.'
    )
  },
  phases: [
    { id: 'discovery', sortOrder: 1, visible: true, label: trilingual('De ontdekking', 'The discovery', 'La découverte') },
    { id: 'due-diligence', sortOrder: 2, visible: true, label: trilingual('Herkomst & controles', 'Provenance & checks', 'Provenance & vérifications') },
    { id: 'technical', sortOrder: 3, visible: true, label: trilingual('Technisch onderzoek', 'Technical research', 'Recherche technique') },
    { id: 'art-history', sortOrder: 4, visible: true, label: trilingual('Kunsthistorische vergelijking', 'Art-historical comparison', 'Comparaison historique') },
    { id: 'next', sortOrder: 5, visible: true, label: trilingual('Volgende stappen', 'Next steps', 'Prochaines étapes') }
  ],
  updates: [
    {
      id: 'acquisition-2023', slug: 'de-aankoop', phaseId: 'discovery', sequence: 1, status: 'published', evidenceType: 'documented', eventDate: '2023-12-01', publishedAt: '2026-06-01T08:00:00.000Z', featured: false,
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
      id: 'signature-discovery', slug: 'de-vrijgelegde-signatuur', phaseId: 'discovery', sequence: 2, status: 'published', evidenceType: 'observation', eventDate: '2024-01-15', publishedAt: '2026-06-08T08:00:00.000Z', featured: true,
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
      id: 'art-loss-register', slug: 'art-loss-register', phaseId: 'due-diligence', sequence: 3, status: 'published', evidenceType: 'documented', eventDate: '2026-03-25', publishedAt: '2026-06-15T08:00:00.000Z', featured: false,
      title: trilingual('Controle van de bekende verliesregisters', 'Checking the known loss registers', 'Vérification des registres de pertes connus'),
      summary: trilingual('Het Art Loss Register meldt dat het werk niet als gestolen of vermist in zijn databank voorkomt.', 'The Art Loss Register reports that the work is not recorded as stolen or missing in its database.', 'L’Art Loss Register indique que l’œuvre n’est pas enregistrée comme volée ou disparue dans sa base.'),
      body: trilingual('Als onderdeel van de due diligence werd het werk voorgelegd aan het Art Loss Register in Londen. Op 25 maart 2026 werd een certificaat afgegeven waarin staat dat het object niet als gestolen of vermist in de geraadpleegde databank voorkomt.\n\nDit is een relevante controle, maar geen volledige reconstructie van de eigendomsgeschiedenis. Verder provenanceonderzoek blijft noodzakelijk.', 'As part of due diligence, the work was submitted to the Art Loss Register in London. On 25 March 2026, a certificate stated that the object was not recorded as stolen or missing in the database consulted.\n\nThis is a relevant check, but it is not a complete reconstruction of ownership history. Further provenance research remains necessary.', 'Dans le cadre de la diligence raisonnable, l’œuvre a été soumise à l’Art Loss Register à Londres. Le 25 mars 2026, un certificat a indiqué que l’objet n’était pas répertorié comme volé ou disparu dans la base consultée.\n\nIl s’agit d’une vérification importante, mais pas d’une reconstitution complète de l’historique de propriété. La recherche de provenance doit se poursuivre.'),
      keyFindings: trilingual(['ALR-controle uitgevoerd', 'Geen overeenkomst in de geraadpleegde verliesregisters', 'Provenanceonderzoek blijft open'], ['ALR check completed', 'No match in the loss registers consulted', 'Provenance research remains open'], ['Vérification ALR effectuée', 'Aucune correspondance dans les registres consultés', 'La recherche de provenance reste ouverte']),
      nextStep: trilingual('De oudere eigendomsgeschiedenis en eventuele restauratiegeschiedenis verder reconstrueren.', 'Continue reconstructing the earlier ownership and conservation history.', 'Poursuivre la reconstitution de la provenance ancienne et de l’historique des restaurations.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'xray-research', slug: 'rontgenonderzoek', phaseId: 'technical', sequence: 4, status: 'published', evidenceType: 'observation', eventDate: '2026-04-15', publishedAt: '2026-06-22T08:00:00.000Z', featured: false,
      title: trilingual('Röntgenbeelden tonen de opbouw onder het oppervlak', 'X-rays reveal the structure beneath the surface', 'Les radiographies révèlent la structure sous la surface'),
      summary: trilingual('Röntgenopnamen brengen loodhoudende, pasteuze partijen en de interne opbouw van het schilderij in beeld.', 'X-radiographs visualise lead-containing, impasto passages and the internal construction of the painting.', 'Les radiographies montrent des zones empâtées contenant du plomb et la construction interne du tableau.'),
      body: trilingual('Röntgenonderzoek maakt delen van de schildertechniek zichtbaar die met het blote oog niet kunnen worden beoordeeld. Loodhoudende pigmenten absorberen röntgenstraling sterk en verschijnen daardoor licht op de opname.\n\nDe beelden tonen uitgesproken lichte partijen in onder meer het gezicht en de kleding. Dat is relevant voor het verdere onderzoek naar de werkwijze, maar zulke kenmerken zijn niet uniek genoeg om op zichzelf een toeschrijving te dragen.', 'X-radiography reveals aspects of painting technique that cannot be assessed with the naked eye. Lead-containing pigments strongly absorb X-rays and therefore appear light in the image.\n\nThe radiographs show pronounced light passages in the face and clothing. This is relevant to the investigation of working method, but such features are not unique enough to support an attribution on their own.', 'La radiographie révèle des aspects de la technique picturale invisibles à l’œil nu. Les pigments contenant du plomb absorbent fortement les rayons X et apparaissent donc clairs.\n\nLes images montrent des zones lumineuses marquées dans le visage et le vêtement. Ces éléments sont utiles pour étudier la méthode de travail, mais ne sont pas suffisamment uniques pour fonder à eux seuls une attribution.'),
      keyFindings: trilingual(['Beeldvorming van onderliggende verflagen', 'Loodhoudende partijen zichtbaar', 'Interpretatie vereist vergelijking met referentiewerken'], ['Imaging of underlying paint layers', 'Lead-containing passages visible', 'Interpretation requires comparison with reference works'], ['Visualisation des couches sous-jacentes', 'Zones contenant du plomb visibles', 'L’interprétation nécessite une comparaison avec des œuvres de référence']),
      nextStep: trilingual('De röntgenbeelden laten beoordelen in samenhang met pigment-, grondlaag- en infraroodonderzoek.', 'Assess the X-rays together with pigment, ground-layer and infrared analysis.', 'Évaluer les radiographies avec les analyses des pigments, de la préparation et de l’infrarouge.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'uv-observations', slug: 'uv-observaties', phaseId: 'technical', sequence: 5, status: 'published', evidenceType: 'observation', eventDate: '2026-04-30', publishedAt: '2026-06-29T08:00:00.000Z', featured: false,
      title: trilingual('UV-licht helpt latere ingrepen lokaliseren', 'UV light helps locate later interventions', 'La lumière UV aide à localiser les interventions ultérieures'),
      summary: trilingual('UV-fluorescentie maakt verschillen in vernis, retouches en oppervlaktelagen beter zichtbaar.', 'UV fluorescence makes differences in varnish, retouching and surface layers more visible.', 'La fluorescence UV rend plus visibles les différences de vernis, de retouches et de couches superficielles.'),
      body: trilingual('Onder ultraviolet licht reageren vernislagen, retouches en bepaalde materialen verschillend. De opnamen leveren daarom een kaart van zones die bij verdere restauratie en bemonstering bijzondere aandacht vragen.\n\nUV-beeldvorming identificeert niet automatisch een pigment of kunstenaar. De observaties worden gebruikt om gerichte vragen te formuleren voor vervolgonderzoek.', 'Under ultraviolet light, varnishes, retouching and certain materials react differently. The images therefore provide a map of areas that require particular attention during further conservation and sampling.\n\nUV imaging does not automatically identify a pigment or artist. The observations are used to formulate focused questions for subsequent analysis.', 'Sous lumière ultraviolette, les vernis, retouches et certains matériaux réagissent différemment. Les images offrent donc une cartographie des zones qui demanderont une attention particulière lors de la restauration et des prélèvements.\n\nL’imagerie UV n’identifie pas automatiquement un pigment ou un artiste. Les observations servent à formuler des questions ciblées pour les analyses suivantes.'),
      keyFindings: trilingual(['Verschillen in oppervlaktelagen zichtbaar', 'Zones voor vervolgonderzoek gelokaliseerd', 'Geen zelfstandige authenticiteitsconclusie'], ['Differences in surface layers visible', 'Areas for further research located', 'No independent authenticity conclusion'], ['Différences entre couches superficielles visibles', 'Zones à étudier localisées', 'Aucune conclusion autonome sur l’authenticité']),
      nextStep: trilingual('De UV-kaart koppelen aan een onafhankelijk conditierapport en gerichte materiaalmonsters.', 'Link the UV map to an independent condition report and targeted material samples.', 'Relier la cartographie UV à un constat d’état indépendant et à des prélèvements ciblés.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'carbon-dating', slug: 'de-c14-vraag', phaseId: 'technical', sequence: 6, status: 'published', evidenceType: 'external-review', eventDate: '2026-05-15', publishedAt: '2026-07-06T08:00:00.000Z', featured: false,
      title: trilingual('Een C14-resultaat roept nieuwe vragen op', 'A radiocarbon result raises new questions', 'Un résultat radiocarbone soulève de nouvelles questions'),
      summary: trilingual('Een houtmonster leverde een veel latere datering op. De bemonsteringsplaats en mogelijke verontreiniging worden nu kritisch onderzocht.', 'A wood sample produced a much later date. The sampling location and possible contamination are now being critically examined.', 'Un échantillon de bois a fourni une datation bien plus tardive. L’emplacement du prélèvement et une éventuelle contamination sont désormais examinés de manière critique.'),
      body: trilingual('Een radiokoolstofanalyse rapporteerde een hoge waarschijnlijkheid voor een datering van het bemonsterde materiaal tussen 1790 en 1950. Dat resultaat kan niet worden genegeerd en vormt een belangrijk tegenargument.\n\nTegelijk zijn er vragen over de plaats waar het monster uit de zijkant van het paneel werd genomen en over mogelijke lijm-, vernis- of restauratiecomponenten. De juiste vervolgstap is daarom geen snelle verwerping of bevestiging, maar onafhankelijke houtidentificatie, documentatie van de monsterlocatie en zo nodig een nieuwe, gecontroleerde analyse.', 'A radiocarbon analysis reported a high probability that the sampled material dated between 1790 and 1950. This result cannot be ignored and is an important counterargument.\n\nAt the same time, questions remain about the location of the sample on the panel edge and possible glue, varnish or restoration components. The appropriate next step is therefore neither quick dismissal nor confirmation, but independent wood identification, documentation of the sampling location and, if necessary, a new controlled analysis.', 'Une analyse radiocarbone a indiqué une forte probabilité que le matériau prélevé date de 1790 à 1950. Ce résultat ne peut être ignoré et constitue un contre-argument important.\n\nDes questions subsistent toutefois quant à l’emplacement du prélèvement sur le bord du panneau et à la présence éventuelle de colle, de vernis ou de matériaux de restauration. La prochaine étape ne consiste donc ni à rejeter ni à confirmer rapidement ce résultat, mais à identifier le bois de manière indépendante, documenter le prélèvement et, si nécessaire, procéder à une nouvelle analyse contrôlée.'),
      keyFindings: trilingual(['Gerapporteerde datering: 1790–1950', 'Resultaat vormt een serieus tegenargument', 'Bemonstering en contaminatie moeten onafhankelijk worden geëvalueerd'], ['Reported date range: 1790–1950', 'The result is a serious counterargument', 'Sampling and contamination require independent evaluation'], ['Datation rapportée : 1790–1950', 'Le résultat constitue un contre-argument sérieux', 'Le prélèvement et la contamination doivent être évalués indépendamment']),
      nextStep: trilingual('Onafhankelijke houtidentificatie en beoordeling van de monstername organiseren.', 'Arrange independent wood identification and assessment of the sampling procedure.', 'Organiser une identification indépendante du bois et une évaluation du prélèvement.'), coverImage: '', coverAlt: trilingual('', '', ''), gallery: []
    },
    {
      id: 'planned-research', slug: 'de-volgende-onderzoeksfase', phaseId: 'next', sequence: 7, status: 'published', evidenceType: 'next-step', eventDate: '2026-06-01', publishedAt: '2026-07-13T08:00:00.000Z', featured: false,
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
