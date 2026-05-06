-- SQL Schema for AngolaMarket

-- 1. Tables

CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADM', 'PRODUTOR', 'AFILIADO', 'CLIENTE')),
  neighborhood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  producer_id UUID REFERENCES users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO')),
  image_url TEXT,
  commission_rate DECIMAL DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) NOT NULL,
  client_id UUID REFERENCES users(id) NOT NULL,
  producer_id UUID REFERENCES users(id) NOT NULL,
  affiliate_id UUID REFERENCES users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  delivery_fee DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'ENTREGUE', 'CANCELADO')),
  delivery_neighborhood TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  balance DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('IBAN', 'PAYPAY', 'UNITEL_MONEY', 'AFRIMONEY', 'MULTICAIXA_EXPRESS')),
  payment_details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE delivery_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood TEXT NOT NULL UNIQUE,
  fee DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) Policies

-- Usuários: Permitir que qualquer um insira seu próprio perfil (necessário para o Registro)
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- Produtos: Qualquer um pode ver produtos aprovados. Apenas produtores criam os seus.
CREATE POLICY "Anyone can view approved products" ON products FOR SELECT USING (status = 'APROVADO');
CREATE POLICY "Producers can manage their own products" ON products FOR ALL USING (producer_id = auth.uid());
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));
CREATE POLICY "Admins can update all products" ON products FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- Pedidos: Clientes criam seus pedidos. Produtores veem os seus.
CREATE POLICY "Clients can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their own orders" ON orders FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Producers can view orders for their products" ON orders FOR SELECT USING (auth.uid() = producer_id);
CREATE POLICY "Affiliates can view orders they referred" ON orders FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- Carteiras: Apenas o dono pode ver.
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Taxas de Entrega: Público para leitura.
CREATE POLICY "Anyone can view delivery fees" ON delivery_fees FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery fees" ON delivery_fees FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADM'));

-- 3. Functions & Triggers (Auto-create wallet on user signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed Data (Optional)
INSERT INTO public.delivery_fees (neighborhood, fee) VALUES 
('Maianga', 1500),
('Ingombota', 1000),
('Talatona', 2500),
('Viana', 3000),
('Cacuaco', 3500),
('Belas', 2000),
('Samba', 1800);

