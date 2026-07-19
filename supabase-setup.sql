-- ====================================================
-- UĞRA - MULTI-TENANT SUPABASE SETUP SCRIPT
-- Copy and paste this into the Supabase SQL Editor
-- ====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES

-- Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Profiles Table (Link to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    image TEXT,
    stock INTEGER DEFAULT 0 NOT NULL CHECK (stock >= 0),
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('kapida_nakit', 'kapida_kart', 'online')),
    status TEXT DEFAULT 'beklemede' NOT NULL CHECK (status IN ('beklemede', 'hazirlaniyor', 'yolda', 'tamamlandi', 'iptal')),
    total_price NUMERIC NOT NULL CHECK (total_price >= 0),
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

-- Partners Policies
DROP POLICY IF EXISTS "Allow public read access to active partners" ON public.partners;
CREATE POLICY "Allow public read access to active partners" 
    ON public.partners FOR SELECT 
    USING (active = true);

DROP POLICY IF EXISTS "Allow partners to view their own business profile" ON public.partners;
CREATE POLICY "Allow partners to view their own business profile" 
    ON public.partners FOR SELECT 
    USING (auth.uid() = id OR id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Allow partners to update their own business profile" ON public.partners;
CREATE POLICY "Allow partners to update their own business profile" 
    ON public.partners FOR UPDATE 
    USING (auth.uid() = id OR id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Allow authenticated sign-up creation" ON public.partners;
CREATE POLICY "Allow authenticated sign-up creation" 
    ON public.partners FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access to active products" ON public.products;
CREATE POLICY "Allow public read access to active products" 
    ON public.products FOR SELECT 
    USING (active = true);

DROP POLICY IF EXISTS "Allow partners to insert their own products" ON public.products;
CREATE POLICY "Allow partners to insert their own products" 
    ON public.products FOR INSERT 
    WITH CHECK (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Allow partners to update their own products" ON public.products;
CREATE POLICY "Allow partners to update their own products" 
    ON public.products FOR UPDATE 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Allow partners to delete their own products" ON public.products;
CREATE POLICY "Allow partners to delete their own products" 
    ON public.products FOR DELETE 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

-- Orders Policies
DROP POLICY IF EXISTS "Allow public/anon to create orders" ON public.orders;
CREATE POLICY "Allow public/anon to create orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow partners to view orders of their business" ON public.orders;
CREATE POLICY "Allow partners to view orders of their business" 
    ON public.orders FOR SELECT 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Allow partners to update orders of their business" ON public.orders;
CREATE POLICY "Allow partners to update orders of their business" 
    ON public.orders FOR UPDATE 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

-- 4. STORAGE BUCKETS AND RLS POLICIES FOR PRODUCTS AND LOGOS

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('logos', 'logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all objects in products and logos buckets
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id IN ('products', 'logos'));

-- Allow authenticated uploads/inserts to products and logos buckets
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
CREATE POLICY "Authenticated Upload Access" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id IN ('products', 'logos') AND auth.role() = 'authenticated');

-- Allow authenticated updates to products and logos buckets
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
CREATE POLICY "Authenticated Update Access" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id IN ('products', 'logos') AND auth.role() = 'authenticated');

-- Allow authenticated deletes from products and logos buckets
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;
CREATE POLICY "Authenticated Delete Access" 
    ON storage.objects FOR DELETE 
    USING (bucket_id IN ('products', 'logos') AND auth.role() = 'authenticated');


-- 5. AUTOMATIC SIGNUP TRIGGER (PARTNERS & PROFILES AUTO-POPULATION)
-- This function automatically creates a partner and profile entry when a user signs up.
-- It ensures seamless multi-tenant signups even if email confirmation is enabled.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_slug TEXT;
BEGIN
    v_business_name := COALESCE(new.raw_user_meta_data->>'business_name', 'Yeni İşletme');
    v_slug := COALESCE(new.raw_user_meta_data->>'slug', 'isletme-' || substr(new.id::text, 1, 8));

    -- Insert into partners
    INSERT INTO public.partners (id, slug, business_name, active)
    VALUES (new.id, v_slug, v_business_name, true)
    ON CONFLICT (id) DO NOTHING;

    -- Insert into profiles
    INSERT INTO public.profiles (id, partner_id, role)
    VALUES (new.id, new.id, 'owner')
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================
-- MIGRATIONS FOR PARTNER APPLICATIONS, WORKING HOURS,
-- GALLERIES, ADMIN ROLES & SUPPORT TICKETS
-- ====================================================

-- 1. ADD NEW COLUMNS TO PARTNERS
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 2. ADD IS_ADMIN TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- 3. CREATE SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'acik' NOT NULL CHECK (status IN ('acik', 'cozuldu', 'iptal')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR EXTRA MODULES

-- Support Tickets Policies
DROP POLICY IF EXISTS "Allow users to read their own support tickets" ON public.support_tickets;
CREATE POLICY "Allow users to read their own support tickets"
    ON public.support_tickets FOR SELECT
    USING (auth.uid() = partner_id OR (SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Allow partners to insert support tickets" ON public.support_tickets;
CREATE POLICY "Allow partners to insert support tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Allow admins to update support tickets" ON public.support_tickets;
CREATE POLICY "Allow admins to update support tickets"
    ON public.support_tickets FOR UPDATE
    USING ((SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);

-- Admin Global Policies (Overrides)
DROP POLICY IF EXISTS "Allow admins to manage all partners" ON public.partners;
CREATE POLICY "Allow admins to manage all partners"
    ON public.partners FOR ALL
    USING ((SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
CREATE POLICY "Allow admins to manage all profiles"
    ON public.profiles FOR ALL
    USING ((SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Allow admins to manage all products" ON public.products;
CREATE POLICY "Allow admins to manage all products"
    ON public.products FOR ALL
    USING ((SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Allow admins to manage all orders" ON public.orders;
CREATE POLICY "Allow admins to manage all orders"
    ON public.orders FOR ALL
    USING ((SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) = true);


-- 5. UPDATE USER CREATION TRIGGER FOR PENDING APPLICATIONS & ADMIN ROLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_slug TEXT;
    v_is_admin BOOLEAN;
    v_status TEXT;
    v_active BOOLEAN;
BEGIN
    v_business_name := COALESCE(new.raw_user_meta_data->>'business_name', 'Yeni İşletme');
    v_slug := COALESCE(new.raw_user_meta_data->>'slug', 'isletme-' || substr(new.id::text, 1, 8));
    v_is_admin := COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false);
    
    -- Check if first user or email matches admin
    IF v_is_admin OR new.email = 'admin@ugra.app' THEN
        v_is_admin := true;
        v_status := 'approved';
        v_active := true;
    ELSE
        v_status := 'pending';
        v_active := false;
    END IF;

    -- Insert into partners
    INSERT INTO public.partners (id, slug, business_name, active, status)
    VALUES (new.id, v_slug, v_business_name, v_active, v_status)
    ON CONFLICT (id) DO NOTHING;

    -- Insert into profiles
    INSERT INTO public.profiles (id, partner_id, role, is_admin)
    VALUES (new.id, new.id, CASE WHEN v_is_admin THEN 'admin' ELSE 'owner' END, v_is_admin)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

