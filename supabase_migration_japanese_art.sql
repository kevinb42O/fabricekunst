BEGIN;

-- Move only explicit swords and legacy Japanese-art categories.
-- No descriptions, translations, prices, images, or object types are changed.
UPDATE public.items
SET collection_group = 'japanese-art',
    category = 'japanese-art'
WHERE item_type = 'sword'
   OR category IN ('japanese-swords', 'Japanse wapenkunst');

COMMIT;

-- Expected now: existing katana and tanto rows are sword / japanese-art / japanese-art.
SELECT id, title, item_type, collection_group, category
FROM public.items
WHERE collection_group = 'japanese-art'
ORDER BY item_type, title;