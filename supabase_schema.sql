-- SQL Schema for AngolaMarket

-- 1. Tables (Cleaned up constraints)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
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
  affiliate_commission_rate DECIMAL DEFAULT 0.05,
  is_featured BOOLEAN DEFAULT FALSE,
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
  delivery_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (delivery_status IN ('PENDENTE', 'EM_ENTREGA', 'ENTREGUE')),
  coupon_id UUID,
  discount_amount DECIMAL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  producer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_value DECIMAL NOT NULL,
  min_purchase DECIMAL DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
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
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Ensure only one ADM can exist
CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_role ON users (role) WHERE (role = 'ADM');

-- Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'ADM'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    -- Reviews
    DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
    DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;

    -- Coupons
    DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
    DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

    -- Notifications
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
END $$;

-- Usuários: Políticas
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles are public" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (public.is_admin());

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
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all products" ON products FOR UPDATE USING (public.is_admin());

-- Pedidos: Políticas
CREATE POLICY "Clients can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their own orders" ON orders FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Producers can view orders for their products" ON orders FOR SELECT USING (auth.uid() = producer_id);
CREATE POLICY "Affiliates can view orders they referred" ON orders FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (public.is_admin());

-- Carteiras: Políticas
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Saques: Políticas
CREATE POLICY "Users can create withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all withdrawals" ON withdrawals FOR ALL USING (public.is_admin());

-- Reviews: Políticas
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Coupons: Políticas
CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (public.is_admin());

-- Notifications: Políticas
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Taxas de Entrega: Políticas
CREATE POLICY "Anyone can view delivery fees" ON delivery_fees FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery fees" ON delivery_fees FOR ALL USING (public.is_admin());

-- 3. Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS trigger AS $$
DECLARE
  v_product_price DECIMAL;
  v_platform_commission DECIMAL;
  v_affiliate_commission_rate DECIMAL;
  v_affiliate_cut DECIMAL;
  v_producer_cut DECIMAL;
  v_product_id UUID;
BEGIN
  -- Only act when order delivery_status is set to 'ENTREGUE'
  -- Existing 'status' is for order processing, but they asked for 'delivery_status'
  IF NEW.delivery_status = 'ENTREGUE' AND OLD.delivery_status != 'ENTREGUE' THEN
    v_product_price := NEW.total_price - NEW.delivery_fee + NEW.discount_amount;
    v_platform_commission := v_product_price * 0.10; -- 10% Platform fee
    v_affiliate_cut := 0;

    -- Get product specific affiliate commission rate
    SELECT affiliate_commission_rate INTO v_affiliate_commission_rate 
    FROM public.products WHERE id = NEW.product_id;

    -- If there's an affiliate, they get their defined cut
    IF NEW.affiliate_id IS NOT NULL THEN
      v_affiliate_cut := v_product_price * COALESCE(v_affiliate_commission_rate, 0.05);
      
      UPDATE public.wallets 
      SET balance = balance + v_affiliate_cut, updated_at = NOW()
      WHERE user_id = NEW.affiliate_id;

      -- Notify Affiliate
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.affiliate_id, 'SALE', 'Nova venda realizada!', 'Ganhou ' || v_affiliate_cut || ' Kz em comissão.');
    END IF;

    -- Producer gets the rest (Total - Platform Commission - Affiliate Commission)
    v_producer_cut := v_product_price - v_platform_commission - v_affiliate_cut;
    
    UPDATE public.wallets 
    SET balance = balance + v_producer_cut, updated_at = NOW()
    WHERE user_id = NEW.producer_id;

    -- Notify Producer
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.producer_id, 'SALE', 'Venda entregue!', 'Recebeu ' || v_producer_cut || ' Kz na sua carteira.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_order_completion();

-- Handle Withdrawal requests (deduct balance on request)
CREATE OR REPLACE FUNCTION public.handle_withdrawal_request()
RETURNS trigger AS $$
BEGIN
  -- Deduct balance when a new pending withdrawal is created
  UPDATE public.wallets
  SET balance = balance - NEW.amount, updated_at = NOW()
  WHERE user_id = NEW.user_id AND balance >= NEW.amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar o saque.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_withdrawal_request
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_withdrawal_request();

-- Handle Withdrawal rejection (refund balance)
CREATE OR REPLACE FUNCTION public.handle_withdrawal_rejection()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'REJEITADO' AND OLD.status = 'PENDENTE' THEN
    UPDATE public.wallets
    SET balance = balance + OLD.amount, updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_withdrawal_finalized
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_withdrawal_rejection();

-- 4. Rest of existing functions...
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
