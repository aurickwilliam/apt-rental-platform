-- Two-tier apartment images:
--   url       = full-size variant (gallery/lightbox), 2048px @ q0.8
--   url_thumb = small thumbnail for cards, 480px @ q0.75
-- Existing rows keep NULL; renders fall back to url.
alter table public.apartment_images
add column if not exists url_thumb text;