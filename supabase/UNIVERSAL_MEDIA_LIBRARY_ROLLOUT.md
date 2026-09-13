# Universele beeldbank — productie-uitrol

De applicatiecode verwacht de migraties
`migrations/202609130001_universal_media_library.sql` en
`migrations/202609130002_backfill_provenance_media_usages.sql` voordat de
nieuwe dashboardsectie zichtbaar kan worden gebruikt. De eerste migratie is
idempotent en kopieert bestaande `provenance_media`-records alleen als centrale
records; ze verplaatst of verwijdert geen R2-objecten. De tweede registreert de
actuele Provenance-verwijzingen als actief gebruik, zodat die beelden niet
kunnen worden gearchiveerd.

## Volgorde

1. Maak een databaseback-up en bevestig dat alle bestaande
   `202609*.sql`-migraties al zijn toegepast.
2. Pas beide migraties op volgorde toe met de aan dit project gekoppelde
   Supabase CLI of via de SQL Editor. Gebruik geen deel van deze SQL opnieuw
   op een andere Supabase-instantie.
3. Controleer in SQL Editor:

   ```sql
   select status, count(*) from media_assets group by status;
   select count(*) as provenance_records from provenance_media;
   select count(*) as migrated_provenance_records
   from media_assets where legacy_source = 'provenance';
   select count(*) as registered_provenance_usages
   from media_asset_usages
   where consumer_type = 'provenance' and consumer_id = 'main';
   ```

   Het aantal gemigreerde provenance-records moet gelijk zijn aan het aantal
   bestaande provenance-records. Bij afwijking: stop de release; er worden
   geen bestanden verwijderd, dus de migratie kan veilig onderzocht worden.

4. Deploy de applicatie met de bestaande R2-variabelen én een aparte
   `R2_SUBMISSIONS_BUCKET_NAME`. De universele uploader bewaart originelen
   privé in die bucket; de afgeleide WebP-varianten komen alleen in de
   bestaande publieke R2-bucket.
5. Open dashboard → **Beeldbank**. Controleer een gemigreerd beeld, daarna
   upload een niet-kritisch testbeeld, vul metadata in en archiveer uitsluitend
   dat testbeeld.
6. Selecteer één bestaand beeld in Herkomst en één in Lost Rembrandt. Sla
   alleen concepten op; verifieer de previews. Publiceer pas na de bestaande
   inhoudelijke review.

## Terugvalpad

- De publieke website blijft URLs uit de bestaande gepubliceerde snapshots
  renderen. Er is dus geen frontend-datamigratie of cache-invalidering nodig.
- Oude Herkomst- en Lost Rembrandt-URLs blijven geaccepteerd.
- Herstel bij een applicatieprobleem de vorige deployment; laat de nieuwe
  tabellen en R2-bestanden staan. Ze zijn additief en beïnvloeden bestaande
  publieke snapshots niet.
- Archiveer nooit een asset totdat het gebruiksoverzicht nul toepassingen
  toont.
