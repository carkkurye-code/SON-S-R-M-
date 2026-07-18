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
CREATE POLICY "Allow public read access to active partners" 
    ON public.partners FOR SELECT 
    USING (active = true);

CREATE POLICY "Allow partners to update their own business profile" 
    ON public.partners FOR UPDATE 
    USING (auth.uid() = id OR id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Allow authenticated sign-up creation" 
    ON public.partners FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Profiles Policies
CREATE POLICY "Allow users to read their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Products Policies
CREATE POLICY "Allow public read access to active products" 
    ON public.products FOR SELECT 
    USING (active = true);

CREATE POLICY "Allow partners to insert their own products" 
    ON public.products FOR INSERT 
    WITH CHECK (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

CREATE POLICY "Allow partners to update their own products" 
    ON public.products FOR UPDATE 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

CREATE POLICY "Allow partners to delete their own products" 
    ON public.products FOR DELETE 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

-- Orders Policies
CREATE POLICY "Allow public/anon to create orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow partners to view orders of their business" 
    ON public.orders FOR SELECT 
    USING (partner_id IN (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    ) OR partner_id = auth.uid());

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

