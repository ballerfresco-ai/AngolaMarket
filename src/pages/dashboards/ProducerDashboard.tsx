import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Product, Order } from '../../types';
import { 
  Package, 
  ShoppingCart, 
  Wallet, 
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Box
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ProducerDashboard({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState({ count: 0, total: 0 });
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [
        { data: productsData },
        { data: walletData },
        { data: ordersData }
      ] = await Promise.all([
        supabase.from('products').select('*').eq('producer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
        supabase.from('orders').select('*').eq('producer_id', user.id).eq('status', 'ENTREGUE')
      ]);

      if (productsData) setProducts(productsData);
      if (walletData) setWallet(walletData);
      
      const totalSales = ordersData?.reduce((acc, o) => acc + Number(o.total_price), 0) || 0;
      setSalesData({ count: ordersData?.length || 0, total: totalSales });
      
      setLoading(false);
    }
    fetchData();
  }, [user.id]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">Olá, {user.full_name.split(' ')[0]}!</h1>
          <p className="text-zinc-500">Bem-vindo ao seu painel de produtor.</p>
        </div>
        <Link 
          to="/dashboard/add-product"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <Package className="w-24 h-24" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Produtos Ativos</p>
          <p className="text-3xl font-black">{products.filter(p => p.status === 'APROVADO').length}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            <span className="bg-zinc-800 px-2 py-0.5 rounded-full">{products.length} Total</span>
            <span className="bg-yellow-900/20 text-yellow-500 px-2 py-0.5 rounded-full">
              {products.filter(p => p.status === 'PENDENTE').length} Pendentes
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Vendas Concluídas</p>
          <p className="text-3xl font-black">{salesData.count}</p>
          <p className="mt-4 text-xs text-zinc-400">
            Valor bruto: <span className="text-zinc-200 font-bold">{formatCurrency(salesData.total)}</span>
          </p>
        </div>

        <div className="bg-red-600 p-6 rounded-3xl text-white relative overflow-hidden group shadow-xl shadow-red-600/40">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-red-100 text-sm font-medium mb-1 text-opacity-80">Saldo Disponível</p>
          <p className="text-3xl font-black">{formatCurrency(wallet?.balance || 0)}</p>
          <button className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-all">
            Solicitar Saque
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <h3 className="font-bold flex items-center gap-2">
              <Box className="w-5 h-5 text-red-600" />
              Meus Produtos Recentes
            </h3>
            <Link to="/dashboard/my-products" className="text-xs text-red-500 font-bold hover:underline">Ver tudo</Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                  <img src={p.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{formatCurrency(p.price)} • Stock: {p.stock}</p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                  p.status === 'APROVADO' ? 'bg-green-900/20 text-green-500' : 'bg-yellow-900/20 text-yellow-500'
                }`}>
                  {p.status}
                </div>
                <button className="p-2 hover:bg-zinc-700 rounded-full transition-colors">
                  <MoreVertical className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-12 text-center text-zinc-500">
                <p>Nenhum produto cadastrado ainda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-red-600" />
              Vendas Recentes
            </h3>
            <Link to="/dashboard/producer-orders" className="text-xs text-red-500 font-bold hover:underline">Ver todas</Link>
          </div>
          <div className="flex-1 divide-y divide-zinc-800 max-h-[400px] overflow-y-auto">
             {/* Empty state or list would go here */}
             <div className="p-12 text-center text-zinc-500">
                <p>O seu histórico de vendas aparecerá aqui.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
