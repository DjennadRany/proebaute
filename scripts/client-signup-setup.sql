-- Met en place un profil applicatif automatique lors des inscriptions Supabase Auth.
-- A executer une fois dans le SQL Editor Supabase.

create table if not exists public.users (
  id uuid primary key,
  role text not null check (role in ('client', 'professional')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'select own profile'
  ) then
    create policy "select own profile"
    on public.users
    for select
    using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'update own profile'
  ) then
    create policy "update own profile"
    on public.users
    for update
    using (auth.uid() = id);
  end if;
end $$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    role,
    first_name,
    last_name,
    email,
    phone
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', 'Client'),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do update
  set
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email,
    phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();
