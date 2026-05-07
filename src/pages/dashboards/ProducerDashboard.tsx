import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Product, Order } from '../../types';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  LayoutDashboard,
  Settings,
  ChevronRight,
  Handshake,
  Wallet,
  MoreVertical,
  Menu,
  X
} from 'lucide-react'; 
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProducerAddProduct from '../../components/producer/ProducerAddProduct';
import ProducerProductList from '../../components/producer/ProducerProducts';
import ProducerOrders from '../../components/producer/ProducerOrders';
import ProducerAffiliates from '../../components/producer/ProducerAffiliates';
import { LayoutDashboard as LayoutIcon, Package as PackageIcon, ShoppingCart as OrdersIcon, Handshake as AffiliatesIcon, Plus as PlusIcon } from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders' | 'affiliates' | 'add-product';

export default function ProducerDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('producer_id', user.id);
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false });

      const producerOrders = (ordersData as any[])?.filter(o => o.product.producer_id === user.id) || [];
      
      if (productsData) setProducts(productsData);
      if (producerOrders) setOrders(producerOrders);

      const totalValue = producerOrders
        .filter(o => o.delivery_status === 'ENTREGUE')
        .reduce((acc, o) => acc + Number(o.total_price), 0);
      
      setStats({
        totalSales: producerOrders.length,
        earnings: totalValue
      });
      setLoading(false);
    }
    fetchData();
  }, [user.id]);

  const tabs = [
    { id: 'overview', label: 'Estatísticas', icon: LayoutIcon },
    { id: 'products', label: 'Meus Produtos', icon: PackageIcon },
    { id: 'orders', label: 'Pedidos de Venda', icon: OrdersIcon },
    { id: 'affiliates', label: 'Gerir Afiliados', icon: AffiliatesIcon },
    { id: 'add-product', label: 'Cadastrar Novo', icon: PlusIcon },
  ];

  if (loading) return <div className="p-8 text-center text-zinc-500">A carregar painel do produtor...</div>;

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header com Menu de Opções */}
      <div className="flex flex-col gap-6 pb-6 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">Central do Produtor</h1>
            <p className="text-zinc-500 font-medium italic flex items-center gap-2">
              {currentTab?.label}
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              Gestão de Negócio
            </p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all text-white shadow-xl"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      <p className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-2">Menu do Produtor</p>
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as Tab);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                            activeTab === tab.id 
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-6 rounded-3xl items-center gap-6 shadow-xl shadow-red-600/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Ganhos Totais</p>
              <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(stats.earnings)}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2 group hover:border-red-600/30 transition-all">
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Pedidos</p>
                  <p className="text-4xl font-black tracking-tighter">{stats.totalSales}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2 group hover:border-red-600/30 transition-all">
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Produtos Ativos</p>
                  <p className="text-4xl font-black tracking-tighter">{products.filter(p => p.status === 'APROVADO').length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2 group hover:border-red-600/30 transition-all">
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Aguardando Aprovação</p>
                  <p className="text-4xl font-black tracking-tighter text-yellow-500">{products.filter(p => p.status === 'PENDENTE').length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2 group hover:border-red-600/30 transition-all">
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Ticket Médio</p>
                  <p className="text-4xl font-black tracking-tighter text-red-600">{formatCurrency(stats.earnings / (stats.totalSales || 1))}</p>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Vendas Recentes</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-red-600 hover:underline">Ver Todos</button>
                  </div>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800">
                               <img src={(order as any).product?.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                               <p className="text-sm font-bold truncate max-w-[150px]">{(order as any).product?.name}</p>
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{formatDate(order.created_at)}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-bold text-white leading-none mb-1">{formatCurrency(order.total_price)}</p>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              order.delivery_status === 'ENTREGUE' ? 'bg-green-500/10 text-green-500' :
                              order.delivery_status === 'PENDENTE' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-zinc-500/10 text-zinc-500'
                            }`}>
                              {order.delivery_status}
                            </span>
                         </div>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-center py-8 text-zinc-500 italic">Nenhuma venda registada até agora.</p>}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                   <h2 className="text-xl font-bold uppercase tracking-tight">Atalhos Rápidos</h2>
                   <div className="space-y-3">
                      <button onClick={() => setActiveTab('add-product')} className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all group">
                         <span className="font-bold text-sm">Novo Produto</span>
                         <PlusIcon className="w-4 h-4 text-red-600 group-hover:scale-125 transition-transform" />
                      </button>
                      <button onClick={() => setActiveTab('affiliates')} className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all group">
                         <span className="font-bold text-sm">Ver Afiliados</span>
                         <AffiliatesIcon className="w-4 h-4 text-blue-500 group-hover:scale-125 transition-transform" />
                      </button>
                      <button className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all group">
                         <span className="font-bold text-sm">Minha Carteira</span>
                         <Wallet className="w-4 h-4 text-green-600 group-hover:scale-125 transition-transform" />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <ProducerProductList user={user} />
          )}

          {activeTab === 'orders' && (
            <ProducerOrders user={user} />
          )}

          {activeTab === 'affiliates' && (
            <ProducerAffiliates user={user} />
          )}

          {activeTab === 'add-product' && (
            <ProducerAddProduct user={user} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
