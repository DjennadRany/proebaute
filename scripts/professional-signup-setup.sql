-- A executer une fois dans le SQL Editor Supabase
-- pour fiabiliser l'inscription des comptes pro beauté.

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  professional_name text not null,
  specialty text not null default 'Coiffure & beauté',
  bio text,
  address text,
  city text,
  postal_code text,
  siren text,
  location text,
  rating_average numeric default 0,
  reviews_count int default 0,
  verified boolean default false,
  gallery text[] default '{}'
);

alter table public.professionals enable row level security;

alter table public.professionals
  add column if not exists address text;
alter table public.professionals
  add column if not exists city text;
alter table public.professionals
  add column if not exists postal_code text;
alter table public.professionals
  add column if not exists siren text;
alter table public.professionals
  add column if not exists location text;
alter table public.professionals
  add column if not exists rating_average numeric default 0;
alter table public.professionals
  add column if not exists reviews_count int default 0;
alter table public.professionals
  add column if not exists verified boolean default false;
alter table public.professionals
  add column if not exists gallery text[] default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_user_id_key'
  ) then
    alter table public.professionals
      add constraint professionals_user_id_key unique (user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'professionals' and policyname = 'public read professionals'
  ) then
    create policy "public read professionals"
    on public.professionals
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'professionals' and policyname = 'manage own professional profile'
  ) then
    create policy "manage own professional profile"
    on public.professionals
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;
