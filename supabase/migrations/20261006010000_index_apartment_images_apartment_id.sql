-- Every search section (get_search_sections / get_search_section_page) runs a
-- correlated subquery on apartment_images per apartment. The performance advisor
-- flags apartment_images_apartment_id_fkey as having no covering index.
create index if not exists apartment_images_apartment_id_idx
  on public.apartment_images (apartment_id);
