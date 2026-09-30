-- Preserve old clicker links while saving the edition and format of new concepts.
alter table public.brick_concepts
 add column edition text not null default 'everyday' check (edition in ('icon','hero','inside','everyday')),
 add column format text not null default 'clicker' check (format in ('bricks','miniature','clicker')),
 add column interaction text not null default '',
 add constraint collectible_edition_format check (not (edition = 'icon' and format = 'clicker'));
-- Keep custom admin titles. Upgrade only the former default name.
update public.site_settings set value = 'Brandkin' where key = 'site_title' and value = 'form.';
