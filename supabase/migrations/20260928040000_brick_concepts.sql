-- Private cache and atomic limits; browser clients never access these tables.
create table public.brick_concepts (
 id uuid primary key default gen_random_uuid(), cache_key text not null unique,
 brand text not null, title text not null, story text not null, image_path text not null,
 prompt_version text not null, created_at timestamptz not null default now()
);
alter table public.brick_concepts enable row level security;
revoke all on public.brick_concepts from anon, authenticated;
create table public.brick_generation_limits (key text primary key, used integer not null, expires_at timestamptz not null);
alter table public.brick_generation_limits enable row level security;
revoke all on public.brick_generation_limits from anon, authenticated;
create or replace function public.reserve_brick_generation(client_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare client_count integer; global_count integer; bucket text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
begin
 -- Serialize reservation to make the global ceiling safe across edge instances.
 perform pg_advisory_xact_lock(826192);
 delete from public.brick_generation_limits where expires_at < now();
 select used into client_count from public.brick_generation_limits where key = 'client:' || bucket || ':' || client_key;
 select used into global_count from public.brick_generation_limits where key = 'global:' || bucket;
 if coalesce(client_count,0) >= 3 or coalesce(global_count,0) >= 30 then return false; end if;
 insert into public.brick_generation_limits values ('client:'||bucket||':'||client_key,1,now()+interval '2 days') on conflict(key) do update set used=brick_generation_limits.used+1;
 insert into public.brick_generation_limits values ('global:'||bucket,1,now()+interval '2 days') on conflict(key) do update set used=brick_generation_limits.used+1;
 return true;
end; $$;
revoke all on function public.reserve_brick_generation(text) from public, anon, authenticated;
grant execute on function public.reserve_brick_generation(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('brick-concepts','brick-concepts',false,10485760,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
