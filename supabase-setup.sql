-- Run this in Supabase SQL editor after creating project "zarathrift"

-- Products table
create table if not exists products (
  id text primary key,
  name text not null,
  price integer not null,
  original_brand text,
  size text,
  condition text,
  gender text,
  category text,
  description text,
  images jsonb default '[]',
  measurements text,
  material text,
  in_stock boolean default true,
  quantity integer default 1,
  featured boolean default false,
  photo_captions jsonb default '[]',
  condition_closeups jsonb default '[]',
  created_at timestamp default now()
);

-- Orders table (core for tracking, driver updates, etc.)
create table if not exists orders (
  id text primary key,
  reference text,
  items jsonb,
  total integer,
  customer jsonb,
  payment_method text,
  payment_status text,
  status text,
  created_at timestamp default now(),
  admin_notes text,
  payment_proof text,
  tracking_number text,
  tracking_updates jsonb default '[]',
  delivery_fee integer,
  delivery_notes text,
  discount_code text,
  discount_amount integer,
  driver_phone text,
  assigned_bike jsonb,
  delivery_updates jsonb default '[]',
  current_location text,
  estimated_delivery timestamptz,
  cancel_request jsonb
);

-- Settings (key-value for business config, discounts as array, content, etc.)
create table if not exists settings (
  key text primary key,
  value jsonb
);

-- Customers
create table if not exists customers (
  phone text primary key,
  name text,
  notes text,
  orders_count integer default 0
);

-- Discounts (can also be stored under settings key 'discounts')
create table if not exists discounts (
  code text primary key,
  percent integer,
  active boolean default true
);

-- Content (for homepage etc, can also be under settings)
create table if not exists content (
  key text primary key,
  value text
);

-- Enable Row Level Security (RLS) - start permissive for demo, tighten later
alter table products enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table discounts enable row level security;
alter table content enable row level security;

-- Basic demo policies (anon read/write for quick start - secure this in production!)
create policy "Allow anon read products" on products for select using (true);
create policy "Allow anon insert/update products" on products for all using (true);

create policy "Allow anon read orders" on orders for select using (true);
create policy "Allow anon insert/update orders" on orders for all using (true);

create policy "Allow anon read settings" on settings for select using (true);
create policy "Allow anon insert/update settings" on settings for all using (true);

-- Similar for others
create policy "Allow anon read customers" on customers for select using (true);
create policy "Allow anon insert/update customers" on customers for all using (true);

create policy "Allow anon read discounts" on discounts for select using (true);
create policy "Allow anon insert/update discounts" on discounts for all using (true);

create policy "Allow anon read content" on content for select using (true);
create policy "Allow anon insert/update content" on content for all using (true);

-- IMPORTANT: Enable Realtime for live driver updates (so driver GPS pushes instantly to customers)
-- 
-- If you are on the Replication page and only see "Add destination":
--   You are probably in the wrong section (Webhooks or Destinations).
--   Correct path: Left sidebar → Database → Replication
--
-- In Replication:
--   Look for the publication named "supabase_realtime"
--   Click it / Edit / "Add tables" / toggle the "orders" table ON.
--   (You may need to search or scroll to find the table list.)
--
-- Fallback - just run this SQL in the SQL Editor:
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orders;

-- You can also enable other tables for realtime if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;
-- ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- For driver auth (phone OTP):
-- Authentication > Providers > Enable "Phone" provider (and configure SMS if using Twilio etc for prod)

-- For production security:
-- - Use authenticated users with proper RLS (e.g. drivers can only update orders where driver_phone matches their phone)
-- - Customers can only read their own orders (based on phone in customer json or separate)
-- - Add auth.users integration if using Supabase Auth for customers/drivers

-- After running, go to your project dashboard, copy the Project URL and anon key, set in env vars (see instructions)