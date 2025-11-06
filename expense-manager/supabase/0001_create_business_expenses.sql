create extension if not exists "pgcrypto";

create table if not exists public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_done_by text not null,
  amount_in_inr numeric(12, 2) not null check (amount_in_inr >= 0),
  expense_category text not null,
  expense_type text not null,
  expense_type_detail text,
  quantity numeric(12, 2),
  expense_date timestamptz not null,
  document_bucket text,
  document_path text,
  profile_role text not null check (
    profile_role in ('Super Admin', 'Admin', 'User')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role text not null check (role in ('Super Admin', 'Admin', 'User')),
  created_at timestamptz not null default now()
);

insert into public.profiles (display_name, role)
values
  ('Executive', 'Super Admin'),
  ('Operations Manager', 'Admin'),
  ('Field Associate', 'User')
on conflict do nothing;

do
$$
begin
  perform storage.create_bucket('expense-documents', false);
exception
  when duplicate_object then
    null;
end;
$$;
