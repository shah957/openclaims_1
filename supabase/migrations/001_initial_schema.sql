create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'program_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.program_status as enum ('draft', 'active', 'paused', 'closed');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'claim_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.claim_status as enum (
      'pending',
      'processing',
      'auto_approved',
      'auto_rejected',
      'flagged',
      'manually_approved',
      'manually_rejected'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'document_type' and typnamespace = 'public'::regnamespace
  ) then
    create type public.document_type as enum ('receipt', 'invoice', 'id', 'other');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'verification_level' and typnamespace = 'public'::regnamespace
  ) then
    create type public.verification_level as enum ('orb', 'device', 'document', 'unknown');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'audit_action' and typnamespace = 'public'::regnamespace
  ) then
    create type public.audit_action as enum (
      'submitted',
      'verified',
      'processing_started',
      'auto_approved',
      'auto_rejected',
      'flagged',
      'manually_approved',
      'manually_rejected',
      'exported'
    );
  end if;
end $$;

create table if not exists public.organizers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  world_id_action text not null unique,
  description text not null,
  rules jsonb not null default '{}'::jsonb,
  budget_total numeric(12,2) not null check (budget_total >= 0),
  budget_committed numeric(12,2) not null default 0 check (budget_committed >= 0),
  status public.program_status not null default 'active',
  created_by uuid not null references public.organizers(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  nullifier_hash text not null,
  world_id_verified boolean not null default false,
  verification_level public.verification_level not null default 'unknown',
  status public.claim_status not null default 'pending',
  amount_requested numeric(12,2),
  amount_approved numeric(12,2),
  category text,
  description text,
  extraction_result jsonb,
  rule_check_result jsonb,
  confidence_score numeric(4,3),
  reviewer_notes text,
  reviewed_by uuid references public.organizers(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  file_url text not null,
  storage_path text not null,
  file_type public.document_type not null default 'receipt',
  original_filename text not null,
  extraction_data jsonb,
  duplicate_hash text,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  action public.audit_action not null,
  actor text not null,
  details jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  ip_address inet
);

create unique index if not exists claims_program_id_nullifier_hash_key
  on public.claims(program_id, nullifier_hash);

create index if not exists claims_program_id_idx
  on public.claims(program_id);

create index if not exists documents_claim_id_idx
  on public.documents(claim_id);

create index if not exists documents_duplicate_hash_idx
  on public.documents(duplicate_hash);

create index if not exists audit_log_claim_id_idx
  on public.audit_log(claim_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organizers_updated_at on public.organizers;
create trigger set_organizers_updated_at
before update on public.organizers
for each row execute procedure public.set_updated_at();

drop trigger if exists set_programs_updated_at on public.programs;
create trigger set_programs_updated_at
before update on public.programs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_claims_updated_at on public.claims;
create trigger set_claims_updated_at
before update on public.claims
for each row execute procedure public.set_updated_at();

alter table public.organizers enable row level security;
alter table public.programs enable row level security;
alter table public.claims enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "organizers can read own profile" on public.organizers;
create policy "organizers can read own profile"
on public.organizers
for select
using (auth.uid() = id);

drop policy if exists "organizers can upsert own profile" on public.organizers;
create policy "organizers can upsert own profile"
on public.organizers
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "organizers can manage own programs" on public.programs;
create policy "organizers can manage own programs"
on public.programs
for all
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "organizers can read claims for owned programs" on public.claims;
create policy "organizers can read claims for owned programs"
on public.claims
for select
using (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
);

drop policy if exists "public can insert claims" on public.claims;
create policy "public can insert claims"
on public.claims
for insert
with check (true);

drop policy if exists "organizers can update claims for owned programs" on public.claims;
create policy "organizers can update claims for owned programs"
on public.claims
for update
using (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.programs
    where programs.id = claims.program_id
      and programs.created_by = auth.uid()
  )
);

drop policy if exists "organizers can read documents for owned programs" on public.documents;
create policy "organizers can read documents for owned programs"
on public.documents
for select
using (
  exists (
    select 1
    from public.claims
    join public.programs on programs.id = claims.program_id
    where claims.id = documents.claim_id
      and programs.created_by = auth.uid()
  )
);

drop policy if exists "public can insert documents" on public.documents;
create policy "public can insert documents"
on public.documents
for insert
with check (true);

drop policy if exists "organizers can read audit logs for owned programs" on public.audit_log;
create policy "organizers can read audit logs for owned programs"
on public.audit_log
for select
using (
  exists (
    select 1
    from public.claims
    join public.programs on programs.id = claims.program_id
    where claims.id = audit_log.claim_id
      and programs.created_by = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('claim-documents', 'claim-documents', false)
on conflict (id) do nothing;
