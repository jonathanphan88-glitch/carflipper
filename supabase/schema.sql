-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User settings (one row per user)
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  location text not null default '',
  latitude numeric,
  longitude numeric,
  radius_miles integer not null default 50,
  price_min integer not null default 0,
  price_max integer not null default 15000,
  min_profit integer not null default 1000,
  min_score integer not null default 50,
  email_alerts_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Listings (shared across users, deduplicated by apify_id)
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  apify_id text not null unique,
  url text not null,
  title text,
  price integer,
  year integer,
  make text,
  model text,
  mileage integer,
  condition_text text,
  location text,
  images text[] default '{}',
  listed_at timestamptz,
  fetched_at timestamptz not null default now(),
  market_value integer,
  estimated_profit integer,
  score integer,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

-- Per-user listing state
create table if not exists user_listing_states (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete cascade not null,
  status text not null default 'new' check (status in ('new', 'saved', 'dismissed')),
  updated_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

-- Search run history
create table if not exists search_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  triggered_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  listings_found integer default 0,
  listings_new integer default 0,
  error_message text
);

-- Market value cache (avoid redundant Edmunds lookups)
create table if not exists market_value_cache (
  id uuid primary key default uuid_generate_v4(),
  cache_key text not null unique, -- year_make_model_mileage_bucket
  market_value integer not null,
  fetched_at timestamptz not null default now()
);

-- RLS policies
alter table user_settings enable row level security;
alter table user_listing_states enable row level security;
alter table search_runs enable row level security;
alter table listings enable row level security;
alter table market_value_cache enable row level security;

-- user_settings: users can only read/write their own
create policy "users can manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- listings: all authenticated users can read
create policy "authenticated users can read listings"
  on listings for select
  using (auth.role() = 'authenticated');

-- user_listing_states: users can only manage their own
create policy "users can manage own listing states"
  on user_listing_states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- search_runs: users can read their own
create policy "users can manage own search runs"
  on search_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- market_value_cache: authenticated users can read, service role writes
create policy "authenticated users can read cache"
  on market_value_cache for select
  using (auth.role() = 'authenticated');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

create trigger user_listing_states_updated_at
  before update on user_listing_states
  for each row execute function update_updated_at();
