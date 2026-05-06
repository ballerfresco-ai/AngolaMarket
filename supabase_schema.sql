-- SQL Schema for AngolaMarket

-- 1. Tables (Cleaned up constraints)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (role IN ('ADM', 'PRODUTOR', 'AFILIADO', 'CLIENTE')),
  neighborhood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  producer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO')),
  image_url TEXT,
  commission_rate DECIMAL DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  delivery_fee DECIMAL NOT NULL DEFAULT 0,
  total_price DECIMAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'ENTREGUE', 'CANCELADO')),
  delivery_neighborhood TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('IBAN', 'PAYPAY', 'UNITEL_MONEY', 'AFRIMONEY', 'MULTICAIXA_EXPRESS')),
  payment_details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood TEXT NOT NULL UNIQUE,
  fee DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies before creating new ones to allow re-running the script
DO $$ 
BEGIN
    -- Users
    DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
    
    -- Products
    DROP POLICY IF EXISTS "Anyone can view approved products" ON products;
    DROP POLICY IF EXISTS "Producers can manage their own products" ON products;
    DROP POLICY IF EXISTS "Admins can view all products" ON products;
    DROP POLICY IF EXISTS "Admins can update all products" ON products;
    
    -- Orders
    DROP POLICY IF EXISTS "Clients can create orders" ON orders;
    DROP POLICY IF EXISTS "Clients can view their own orders" ON orders;
    DROP POLICY IF EXISTS "Producers can view orders for their products" ON orders;
    DROP POLICY IF EXISTS "Affiliates can view orders they referred" ON orders;
    DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
    
    -- Wallets
    DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
    
    -- Affiliate Links
    DROP POLICY IF EXISTS "Affiliates can create links" ON affiliate_links;
    DROP POLICY IF EXISTS "Anyone can view affiliate links" ON affiliate_links;
    
    -- Withdrawals
    DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;
END $$;

-- Usuários: Políticas
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (role = 'ADM');

-- RPC to check if admin exists (Publicly accessible)
CREATE OR REPLACE FUNCTION public.has_admin()
RETURNS boolean AS $$
DECLARE
  exists_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.users WHERE role = 'ADM') INTO exists_admin;
  RETURN COALESCE(exists_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the RPC
GRANT EXECUTE ON FUNCTION public.has_admin() TO anon, authenticated;

-- Produtos: Políticas
CREATE POLICY "Anyone can view approved products" ON products FOR SELECT USING (status = 'APROVADO');
CREATE POLICY "Producers can manage their own products" ON products FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));
CREATE POLICY "Admins can update all products" ON products FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- Pedidos: Políticas
CREATE POLICY "Clients can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their own orders" ON orders FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Producers can view orders for their products" ON orders FOR SELECT USING (auth.uid() = producer_id);
CREATE POLICY "Affiliates can view orders they referred" ON orders FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- Carteiras: Políticas
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Taxas de Entrega: Políticas
CREATE POLICY "Anyone can view delivery fees" ON delivery_fees FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery fees" ON delivery_fees FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- 3. Functions & Triggers (Improved robust version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name text;
  v_role text;
BEGIN
  -- Extract metadata safely
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário');
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'CLIENTE');

  -- Validate role against check constraint
  IF v_role NOT IN ('ADM', 'PRODUTOR', 'AFILIADO', 'CLIENTE') THEN
    v_role := 'CLIENTE';
  END IF;

  -- Insert profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- Insert wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback logic: if it fails, at least log it somehow or just ignore to allow the auth user creation
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed Data
INSERT INTO public.delivery_fees (neighborhood, fee) VALUES 
('Maianga', 1500),
('Ingombota', 1000),
('Talatona', 2500),
('Viana', 3000),
('Cacuaco', 3500),
('Belas', 2000),
('Samba', 1800)
ON CONFLICT (neighborhood) DO UPDATE SET fee = EXCLUDED.fee;
