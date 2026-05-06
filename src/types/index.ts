export type UserRole = 'ADM' | 'PRODUTOR' | 'AFILIADO' | 'CLIENTE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  neighborhood?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  producer_id: string;
  status: 'PENDENTE' | 'APROVADO';
  image_url?: string;
  created_at: string;
  commission_rate: number; // usually 0.1 for 10%
}

export interface Order {
  id: string;
  product_id: string;
  client_id: string;
  producer_id: string;
  affiliate_id?: string;
  quantity: number;
  delivery_fee: number;
  total_price: number;
  status: 'PENDENTE' | 'PROCESSANDO' | 'ENTREGUE' | 'CANCELADO';
  delivery_neighborhood: string;
  created_at: string;
  delivery_address: string;
  client_phone: string;
  product?: Product;
  client?: User;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  payment_method: 'IBAN' | 'PAYPAY' | 'UNITEL_MONEY' | 'AFRIMONEY' | 'MULTICAIXA_EXPRESS';
  payment_details: string;
  created_at: string;
  user?: User;
}

export interface DeliveryFee {
  id: string;
  neighborhood: string;
  fee: number;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  product_id: string;
  code: string;
  product?: Product;
}
