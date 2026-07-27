-- ========================================================
-- Atelier Rembrandt — Supabase Setup Script
-- Paste this script into Supabase SQL Editor and click RUN
-- ========================================================

-- 1. Create Items Table (Catalog for Books & Art)
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL DEFAULT 'book',
    ref TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT,
    publisher TEXT,
    city TEXT,
    year TEXT,
    century TEXT,
    category TEXT,
    price TEXT,
    status TEXT DEFAULT 'Beschikbaar',
    featured BOOLEAN DEFAULT false,
    condition TEXT,
    binding TEXT,
    dimensions TEXT,
    provenance TEXT,
    description TEXT,
    historical_context TEXT,
    condition_report TEXT,
    provenance_details TEXT,
    collation_specs TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Inquiries Table (Customer requests & bids)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    item_title TEXT,
    item_ref TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    type TEXT,
    message TEXT,
    status TEXT DEFAULT 'Nieuw',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Admin Settings Table (PIN & Security settings)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Admin Users Table (Email & Password accounts)
CREATE TABLE IF NOT EXISTS public.admin_users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Developer & Admin accounts
INSERT INTO public.admin_users (email, password, name, role) VALUES
('kevin@webaanzee.be', 'Pinakaaz420', 'Kevin (Developer)', 'developer'),
('admin@atelierrembrandt.com', 'Rembrandt5438', 'Atelier Rembrandt Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Default Admin PIN ("5438")
INSERT INTO public.admin_settings (key, value)
VALUES ('admin_pin', '5438')
ON CONFLICT (key) DO NOTHING;

-- 5. Enable Row Level Security (RLS) & Set Permissive Policies for Web App
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Items Policies
DROP POLICY IF EXISTS "Public read items" ON public.items;
CREATE POLICY "Public read items" ON public.items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write items" ON public.items;
CREATE POLICY "Allow write items" ON public.items FOR ALL USING (true) WITH CHECK (true);

-- Inquiries Policies
DROP POLICY IF EXISTS "Public read inquiries" ON public.inquiries;
CREATE POLICY "Public read inquiries" ON public.inquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write inquiries" ON public.inquiries;
CREATE POLICY "Allow write inquiries" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);

-- Admin Settings Policies
DROP POLICY IF EXISTS "Public read admin_settings" ON public.admin_settings;
CREATE POLICY "Public read admin_settings" ON public.admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write admin_settings" ON public.admin_settings;
CREATE POLICY "Allow write admin_settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);

-- Admin Users Policies
DROP POLICY IF EXISTS "Public read admin_users" ON public.admin_users;
CREATE POLICY "Public read admin_users" ON public.admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write admin_users" ON public.admin_users;
CREATE POLICY "Allow write admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

-- 6. Setup Supabase Storage Bucket for High-Res Catalog Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for catalog-images bucket
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (bucket_id = 'catalog-images');

DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
CREATE POLICY "Public Storage Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalog-images');

DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;
CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE USING (bucket_id = 'catalog-images');

-- 7. Seed Initial Catalog Data
INSERT INTO public.items (
    id, item_type, ref, title, subtitle, author, publisher, city, year, century, category, price, status, featured, condition, binding, dimensions, provenance, description, historical_context, condition_report, provenance_details, collation_specs, images
) VALUES 
(
    'voltaire-1829-52delig',
    'book',
    'FB-1829-VOL',
    'Voltaire — Œuvres Complètes (Nouvelle Bibliothèque des Classiques Français)',
    'Zeldzame, indrukwekkende 52-delige reeks in rode halflederen shagreen band met geverifieerde kasteel-provenance Vacheron-Poinsot.',
    'Voltaire (François-Marie Arouet)',
    'Lecointe et Durey / Imprimerie van J. Didot aîné / Firmin Didot Frères',
    'Parijs (Rue du Pont-de-Lodi & Rue Jacob)',
    '1829–1833',
    '19e Eeuw',
    'Literatuur & Filosofie',
    'Prijs op aanvraag',
    'Beschikbaar',
    true,
    'Excellente antiquarische staat. Banden in rood Chagrin-halfleer met goudgestempelde fleurons op de rug. Binnenwerk op zwaar lompenpapier zeer fris.',
    '52 delen in uniforme rode halflederen shagreen band (chagrin rouge à grain fin), met 5 valse ribben, goudgestempelde rugversiering (fleurons aux petits fers) en dubbele donkergroene marokijnen titelschildjes. Kopsneden strak verguld (tête dorée).',
    'In-8° (21,5 x 13,5 cm)',
    'Bewezen herkomst (Provenance): Origineel kopergegraveerd wapen-ex-libris van de Franse adellijke familie Vacheron-Poinsot te Parijs ingeplakt op de binnenzijde van het schutblad van elk van de 52 delen.',
    'Een monumentale en complete verzameling van de werken van de Franse verlichtingsfilosoof Voltaire, uitgegeven te Parijs tussen 1829 en 1833. Deze 52-delige reeks omvat zijn filosofische geschriften, toneelstukken (Théâtre complet), historische verhandelingen en zijn voltallige briefwisseling met Europese vorsten. Elk deel is gebonden in prachtig rood Chagrin halfleer met goudgestempelde rugversiering. De schutbladen zijn voorzien van authentiek handgemaakt gemarmerd papier en het vermaarde ex-libris van Vacheron-Poinsot.',
    'François-Marie Arouet, wereldwijd vermaard onder zijn pseudoniem Voltaire (1694–1778), vormt het intellectuele en filosofische boegbeeld van de Franse Verlichting (le Siècle des Lumières). Zijn gigantische oeuvre van toneelstukken, satire, geschiedschrijving en filosofische essays vormde de fundamenten voor de Europese mensenrechten, de scheiding van kerk en staat en de vrijheid van meningsuiting.',
    'Deze 52 delen zijn uitgevoerd in een zeldzame en volkomen uniforme binderij-uitvoering van rood Chagrin-halfleer (chagrin rouge à grain fin). Chagrin—bereid uit fijn geitenleer met een karakteristieke natuurlijke korrel—was in de 19e eeuw gereserveerd voor de meest kostbare bibliotheek-edities omwille van zijn uitzonderlijke duurzaamheid en kleurvastheid.',
    'Een van de meest waardevolle aspecten van deze verzameling is de gecertificeerde eigendomsgeschiedenis. Deel I t/m LII zijn op het voorste vaste schutblad voorzien van het originele 19e-eeuwse kopergegraveerd wapen-ex-libris van de Franse adellijke familie Vacheron-Poinsot te Parijs.',
    '52 delen compleet. In-8° (21,5 x 13,5 cm). Totaal ca. 28.000 pagina''s inclusief gegraveerde portretten en facsimile-brieven op zwaar lompenpapier. Uniforme Franse Chagrin-binderij stempeling.',
    '[{"url":"/images/voltaire-theatre-bust-reading-glasses.jpg","caption":"Théâtre de Voltaire opengewerkt met marmeren buste en antieke leesbril."},{"url":"/images/voltaire-presentation-overlay.jpg","caption":"Gestileerde presentatie met geopend deel, portretgravure en het originele Vacheron-Poinsot ex-libris label."},{"url":"/images/voltaire-marbled-endpaper-exlibris.jpg","caption":"Macro close-up van de handgemaakte marmeren schutbladen en het Vacheron-Poinsot ex-libris bewijs."},{"url":"/images/voltaire-lit-bookcase-desk.jpg","caption":"De Voltaire-reeks gepresenteerd in een verlichte boekenkast met studie-accessoires."},{"url":"/images/voltaire-52-books-birds-eye.jpg","caption":"Totaaloverzicht van de complete 52-delige reeks liggend in vier keurige rijen."}]'::jsonb
),
(
    'scarron-1713-oeuvres',
    'book',
    'FB-1713-SCA',
    'Les Œuvres de Monsieur Scarron — Tome I, II & III',
    'Vroege 18e-eeuwse Amsterdamse edities met verfijnde kopergravures door Gilliam van Gouwen en authentieke schutbladen.',
    'Paul Scarron',
    'R. & G. Wetstein (Rudolph & Gerard Wetstein) / Chez les Héritiers d''Antoine Schelte',
    'Amsterdam',
    '1713',
    '18e Eeuw',
    'Literatuur & Satire',
    '€ 2.850',
    'Beschikbaar',
    true,
    'Zeer goed. Authentiek 18e-eeuws kalfsleer met goudgestempelde ribben op de rug. Kopergravures in krachtige, heldere afdruk.',
    'Originele volledige kalfslederen banden (plein veau blond de l''époque) met 5 verhoogde ribben, caissons dorés aux fleurons op de rug en gemarmerde sneden.',
    'In-12° (16,5 x 10 cm)',
    'Herkomst uit de aristocratische bibliotheek van Jonkheer van Slingelandt (Dordrecht, ca. 1740) met eigentijdse inktinscripties in ijzergal-inkt.',
    'Een schitterende en zeldzame 3-delige set van de verzamelde werken van de beroemde Franse satiricus en dichter Paul Scarron (1610–1660), echtgenoot van Madame de Maintenon. Deze vroeg-18e-eeuwse editie, gedrukt te Amsterdam in 1713 door Wetstein & Schelte, bevat de befaamde ''Roman Comique'', zijn komische toneelstukken en talrijke gedichten. De boeken zijn verrijkt met gedetailleerde kopergravures (frontispice portret door Gilliam van Gouwen) en hebben prachtige antieke marmeren schutbladen.',
    'Paul Scarron (1610–1660) geldt als de onbetwiste grondlegger van de 17e-eeuwse Franse burleske satire. Ondanks zijn tragische lichamelijke verlamming gegroeid zijn Parijse salon uit tot het ontmoetingspunt voor de meest briljante geesten van de Fronde-periode.',
    'De drie delen zijn gebonden in een schitterende, originele 18e-eeuwse band van vol-kalfsleer (plein veau blond de l''époque). De ruggen vertonen vijf uitgesproken verhoogde ribben en zijn verdeeld in zes compartimenten die meesterlijk zijn goudgestempeld met florale hoek-vignetten en een centraal bloemmotief.',
    'Herkomst uit de aristocratische bibliotheek van Jonkheer van Slingelandt (Dordrecht, ca. 1740). De Franse titelpagina van Deel I bevat de authentieke 18e-eeuwse inktinscripties in ijzergal-inkt van de jonkheer, evenals zijn kleingegraveerde bibliotheekstempeltje op de Franse titel.',
    '3 delen compleet. In-12° (16,5 x 10 cm). Graveerwerk: Frontispice portret door Gilliam van Gouwen en titel-vignetten. Vol-kalfsleer uit 1713.',
    '[{"url":"/images/scarron-candlelight-hero.jpg","caption":"Sfeervolle compositie van de drie delen bij kaarslicht, ganzenveer en antieke globe."},{"url":"/images/scarron-engraving-titlepage.jpg","caption":"Detailopname van de kopergravure-frontispice en de geïllustreerde titelpagina (Amsterdam, 1713)."},{"url":"/images/scarron-spines-white-bg.jpg","caption":"Overzicht van de authentieke kalfslederen ruggen met goudgestempelde versieringen."}]'::jsonb
),
(
    'diderot-encyclopedie-1765',
    'book',
    'FB-1765-DID',
    'Diderot & d''Alembert — Encyclopédie: Recueil de Planches (Troisième Livraison)',
    'Originele groot-folio band met gedetailleerde kopergravures van wetenschappen en ambachten.',
    'Denis Diderot & Jean le Rond d''Alembert',
    'Briasson, David, Le Breton, Durand',
    'Parijs (Rue Saint-Jacques)',
    '1765',
    '18e Eeuw',
    'Wetenschap & Illustraties',
    '€ 6.200',
    'Gereserveerd',
    false,
    'Prachtige grote folioband in gemarmerd kalfsleer. Bladen haarscherp, marges ruim en onafgesneden.',
    'Originele Franse gemarmerde kalfshuid (veau marbré de l''époque) met 7 verhoogde ribben, goudgestempelde vignetten en rode titellabels op de rug.',
    'Groot Folio (40 x 27 cm)',
    'Kasteelbibliotheek Château de Dampierre (ex-libris de Luynes op binnenzijde plat).',
    'Een monumentaal deel uit de befaamde Franse Encyclopédie, het kroonjuweel van de Verlichting. Dit deel bevat honderden gedetailleerde kopergravures van ambachten, druktechnieken, sterrenkunde, horlogerie en mechanica.',
    'De Encyclopédie, ou Dictionnaire raisonné des sciences, des arts et des métiers, geredigeerd door Denis Diderot en Jean le Rond d''Alembert tussen 1751 en 1772, vormt het onbetwiste monument van de Franse Verlichting.',
    'Uitgevoerd in een monumentale Groot-Folio band (40 x 27 cm) in authentiek Franse gemarmerde kalfshuid (veau marbré de l''époque).',
    'Afkomstig uit de vermaarde kasteelbibliotheek van Château de Dampierre.',
    'Groot Folio (40 x 27 cm). Bevat 240 dubbelpagina kopergravures op zwaar scheppapier.',
    '[{"url":"/images/scarron-engraving-titlepage.jpg","caption":"Gravure overzicht van verlichtingswerktuigen."}]'::jsonb
),
(
    'vanitas-stilleven-leiden-1645',
    'painting',
    'FB-1645-VAN',
    'Stilleven met Boeken, Zandloper en Ganzenveer (Vanitas)',
    'Meesterlijk 17e-eeuws barok stilleven op eikenhouten paneel uit de Hollands-Leidse school.',
    'School van Leiden (Cirkel van Harmen Steenwijck)',
    'Olieverf op eikenhouten paneel',
    'Rijlinksonder gesigneerd ''H.S. f. 1645''',
    'ca. 1645',
    '17e Eeuw',
    'Oude Meesters',
    '€ 8.900',
    'Beschikbaar',
    true,
    'Excellente museumstaat. Vaste eikenhouten drager, fijne authentieke craquelé-structuur en diepe, warme vernislaag.',
    'Originele 17e-eeuwse vergulde Hollandse Baroklijst met goudblad accenten op eikenhouten kern.',
    '48 x 38 cm (paneel) / 62 x 52 cm (met lijst)',
    'Particuliere collectie Jonkheer van der Heyden (Arnhem) • Veiling Christie''s Amsterdam (1988, Lot 42).',
    'Een adembenemend 17e-eeuws Hollands Vanitas-stilleven op eikenhouten paneel. Het meesterwerk verbeeldt op verfijnde wijze een geopend perkamenten folioboek, een koperen zandloper, een uitgedoofde kaars en een ganzenveer bij invallend strijklicht.',
    'De Vanitas-schilderkunst bereikte in het Leiden van de gouden 17e eeuw haar absolute artistieke hoogtepunt.',
    'Het werk is uitgevoerd op een massief enkelvoudig Hollands eikenhouten paneel met afgeschuinde kanten aan de achterzijde.',
    'Afkomstig uit het historische familie-archief van Jonkheer van der Heyden (Arnhem).',
    'Olieverf op eiken paneel (48 x 38 cm). Gesigneerd en gedateerd 1645. Geheel compleet met 17e-eeuwse vergulde lijst.',
    '[{"url":"/images/voltaire-lit-bookcase-desk.jpg","caption":"Vanitas Stilleven gepresenteerd in een sfeervol verlichte klassieke bibliotheek-setting."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
