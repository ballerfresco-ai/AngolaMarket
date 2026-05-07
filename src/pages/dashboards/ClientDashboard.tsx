import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Order } from '../../types';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Package, 
  MapPin, 
  Phone, 
  User as UserIcon,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../components/DashboardHeader';

type Tab = 'orders' | 'profile';

export default function ClientDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, product:products(name, image_url)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data as any);
      setLoading(false);
    }
    fetchOrders();
  }, [user.id]);

  const tabs = [
    { id: 'orders', label: 'Meus Pedidos', icon: ShoppingCart },
    { id: 'profile', label: 'Meu Perfil', icon: UserIcon },
  ];

  if (loading) return (
    <div className="py-20 text-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Carregando seus dados...</p>
    </div>
  );

  const currentTab = tabs.find(t => t.id === activeTab);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'PENDENTE': return 'bg-yellow-900/20 text-yellow-500';
      case 'PROCESSANDO': return 'bg-blue-900/20 text-blue-500';
      case 'ENTREGUE': return 'bg-green-900/20 text-green-500';
      case 'CANCELADO': return 'bg-red-900/20 text-red-500';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardHeader 
        title="Minha Conta"
        subtitle="Cliente AngolaMarket"
        activeTabLabel={currentTab?.label || ''}
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id as Tab)}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all shadow-xl shadow-black/50">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden shrink-0">
                      <img src={order.product?.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">#{order.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="font-bold text-lg text-white">{order.product?.name}</h3>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Total Pago</p>
                      <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(order.total_price)}</p>
                      <p className="text-[10px] text-zinc-500 italic">incluindo todos os encargos</p>
                    </div>
                    <div className="hidden sm:block w-[1px] h-10 bg-zinc-800" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                        <MapPin className="w-3 h-3 text-red-600" />
                        {order.delivery_neighborhood}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                        <Phone className="w-3 h-3 text-red-600" />
                        {order.client_phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-zinc-950/50 flex items-center justify-between overflow-x-auto gap-4 scrollbar-hide">
                  <ProgressStep active={true} label="Pendente" icon={Clock} />
                  <div className="flex-1 h-[2px] bg-zinc-800 min-w-[20px]" />
                  <ProgressStep active={['PROCESSANDO', 'ENTREGUE'].includes(order.status)} label="Em Processo" icon={Package} />
                  <div className="flex-1 h-[2px] bg-zinc-800 min-w-[20px]" />
                  <ProgressStep active={order.status === 'ENTREGUE'} label="Entregue" icon={CheckCircle2} />
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="py-24 text-center bg-zinc-900 rounded-[40px] border border-dashed border-zinc-800 shadow-inner">
                <ShoppingCart className="w-20 h-20 text-zinc-800 mx-auto mb-6 opacity-20" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Vazio por aqui...</h3>
                <p className="text-zinc-500 mt-2 font-medium">Parece que ainda não encontraste o produto ideal.<br/>Dá uma vista de olhos no nosso Marketplace.</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-10">
                  <a href="/" className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-600/20">Explorar Marketplace</a>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl"
          >
            <div className="flex items-center gap-6 mb-8">
               <div className="w-24 h-24 bg-red-600/10 rounded-[32px] flex items-center justify-center text-red-600 border border-red-600/20">
                  <UserIcon className="w-10 h-10" />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white">{user.full_name}</h2>
                  <p className="text-zinc-500 font-medium">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Membro desde {new Date(user.created_at).getFullYear()}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total de Compras</p>
                  <p className="text-lg font-black text-white">{orders.length} Pedidos</p>
               </div>
               <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status da Conta</p>
                  <p className="text-lg font-black text-green-500">Verificada</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressStep({ active, label, icon: Icon }: any) {
  return (
    <div className={`flex items-center gap-3 shrink-0 ${active ? 'text-white' : 'text-zinc-600'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        active ? 'bg-red-600 shadow-lg shadow-red-600/40' : 'bg-zinc-900 border border-zinc-800'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-bold whitespace-nowrap">{label}</span>
    </div>
  );
}
