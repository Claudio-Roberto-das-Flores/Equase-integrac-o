-- Equase Integração — fundação multiempresa
-- Execute pelo Supabase CLI ou pelo editor SQL em um projeto novo.

create extension if not exists "pgcrypto";

create type public.company_role as enum ('owner', 'admin', 'finance', 'stock', 'sales', 'accountant', 'viewer');
create type public.entity_status as enum ('active', 'inactive');
create type public.partner_kind as enum ('customer', 'supplier', 'both');
create type public.product_kind as enum ('product', 'service');
create type public.order_status as enum ('draft', 'confirmed', 'partially_fulfilled', 'fulfilled', 'cancelled');
create type public.financial_entry_type as enum ('payable', 'receivable');
create type public.financial_entry_status as enum ('open', 'partial', 'paid', 'overdue', 'cancelled');
create type public.fiscal_document_type as enum ('nfe', 'nfce', 'nfse');
create type public.fiscal_document_status as enum ('draft', 'processing', 'authorized', 'rejected', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  document text not null unique,
  state_registration text,
  municipal_registration text,
  tax_regime text,
  email text,
  phone text,
  status public.entity_status not null default 'active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.company_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table public.business_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind public.partner_kind not null,
  name text not null,
  legal_name text,
  document text,
  state_registration text,
  municipal_registration text,
  email text,
  phone text,
  postal_code text,
  address_line text,
  address_number text,
  address_extra text,
  district text,
  city text,
  state text,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, document)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sku text not null,
  barcode text,
  name text not null,
  description text,
  kind public.product_kind not null default 'product',
  unit text not null default 'UN',
  ncm text,
  service_code text,
  cest text,
  origin_code text,
  cost_price numeric(15,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(15,2) not null default 0 check (sale_price >= 0),
  minimum_stock numeric(15,4) not null default 0,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku),
  unique (company_id, barcode)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.inventory_balances (
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(15,4) not null default 0,
  reserved_quantity numeric(15,4) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (warehouse_id, product_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  product_id uuid not null references public.products(id),
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment', 'reservation', 'release')),
  quantity numeric(15,4) not null check (quantity > 0),
  unit_cost numeric(15,4),
  source_type text,
  source_id uuid,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_type text not null check (order_type in ('purchase', 'sale')),
  number bigint generated by default as identity,
  partner_id uuid references public.business_partners(id),
  status public.order_status not null default 'draft',
  issue_date date not null default current_date,
  expected_date date,
  subtotal numeric(15,2) not null default 0,
  discount numeric(15,2) not null default 0,
  freight numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_type, number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  description text not null,
  quantity numeric(15,4) not null check (quantity > 0),
  unit_price numeric(15,4) not null check (unit_price >= 0),
  discount numeric(15,2) not null default 0,
  total numeric(15,2) not null check (total >= 0)
);

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('cash', 'bank', 'digital_wallet', 'credit_card')),
  opening_balance numeric(15,2) not null default 0,
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_type public.financial_entry_type not null,
  description text not null,
  partner_id uuid references public.business_partners(id),
  order_id uuid references public.orders(id),
  amount numeric(15,2) not null check (amount > 0),
  paid_amount numeric(15,2) not null default 0 check (paid_amount >= 0),
  issue_date date not null default current_date,
  due_date date not null,
  status public.financial_entry_status not null default 'open',
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_id uuid references public.financial_entries(id),
  account_id uuid not null references public.financial_accounts(id),
  direction text not null check (direction in ('in', 'out')),
  amount numeric(15,2) not null check (amount > 0),
  payment_method text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_type public.fiscal_document_type not null,
  status public.fiscal_document_status not null default 'draft',
  order_id uuid references public.orders(id),
  access_key text,
  number text,
  series text,
  protocol text,
  issue_date timestamptz,
  total numeric(15,2) not null default 0,
  xml_storage_path text,
  pdf_storage_path text,
  provider_reference text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, access_key)
);

create table public.imported_xml_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  access_key text not null,
  issuer_document text,
  issuer_name text,
  issue_date timestamptz,
  total numeric(15,2),
  xml_storage_path text not null,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'ignored', 'error')),
  purchase_order_id uuid references public.orders(id),
  created_at timestamptz not null default now(),
  unique (company_id, access_key)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index business_partners_company_idx on public.business_partners(company_id);
create index products_company_idx on public.products(company_id);
create index inventory_movements_company_date_idx on public.inventory_movements(company_id, occurred_at desc);
create index orders_company_date_idx on public.orders(company_id, issue_date desc);
create index financial_entries_company_due_idx on public.financial_entries(company_id, due_date);
create index fiscal_documents_company_status_idx on public.fiscal_documents(company_id, status);

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles public.company_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_company(
  company_legal_name text,
  company_trade_name text,
  company_document text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.companies (legal_name, trade_name, document, created_by)
  values (company_legal_name, company_trade_name, company_document, auth.uid())
  returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (new_company_id, auth.uid(), 'owner');

  insert into public.warehouses (company_id, name, is_default)
  values (new_company_id, 'Estoque principal', true);

  insert into public.financial_accounts (company_id, name, account_type)
  values (new_company_id, 'Caixa principal', 'cash');

  return new_company_id;
end;
$$;

grant execute on function public.create_company(text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.business_partners enable row level security;
alter table public.products enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.financial_entries enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.fiscal_documents enable row level security;
alter table public.imported_xml_documents enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile_self_read" on public.profiles for select using (id = auth.uid());
create policy "profile_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "company_member_read" on public.companies for select using (public.is_company_member(id));
create policy "company_admin_update" on public.companies for update
  using (public.has_company_role(id, array['owner', 'admin']::public.company_role[]))
  with check (public.has_company_role(id, array['owner', 'admin']::public.company_role[]));
create policy "company_member_list" on public.company_members for select using (public.is_company_member(company_id));

create policy "partner_member_all" on public.business_partners for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "product_member_all" on public.products for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "warehouse_member_all" on public.warehouses for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "inventory_balance_member_all" on public.inventory_balances for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "inventory_movement_member_all" on public.inventory_movements for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "order_member_all" on public.orders for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "order_item_member_all" on public.order_items for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "financial_account_member_all" on public.financial_accounts for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "financial_entry_member_all" on public.financial_entries for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "financial_transaction_member_all" on public.financial_transactions for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "fiscal_document_member_all" on public.fiscal_documents for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "imported_xml_member_all" on public.imported_xml_documents for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "audit_member_read" on public.audit_logs for select using (public.is_company_member(company_id));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Usuário'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
