-- Preserve a public source link so shared concepts retain their evidence.
alter table public.brick_concepts
 add column if not exists source_url text not null default '',
 add column if not exists source_title text not null default '';
