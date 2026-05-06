import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Order } from '../../types';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Package,
  MapPin,
  Phone
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion } from 'motion/react';

export default function ClientDashboard({ user }: { user: User }) {
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

  if (loading) return <div>Carregando...</div>;

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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black mb-2">Meus Pedidos</h1>
        <p className="text-zinc-500">Acompanhe o estado das suas compras na AngolaMarket.</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden shrink-0">
                  <img src={order.product?.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-zinc-500">#{order.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="font-bold text-lg">{order.product?.name}</h3>
                  <p className="text-sm text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Total a Pagar</p>
                  <p className="text-xl font-black text-white">{formatCurrency(order.total_price)}</p>
                  <p className="text-[10px] text-zinc-500 italic">incluindo entrega</p>
                </div>
                <div className="hidden sm:block w-[1px] h-10 bg-zinc-800" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3 h-3 text-red-600" />
                    {order.delivery_neighborhood}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Phone className="w-3 h-3 text-red-600" />
                    {order.client_phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Progress Simplified */}
            <div className="px-6 py-4 bg-zinc-950/50 flex items-center justify-between overflow-x-auto gap-4">
              <ProgressStep active={true} label="Pendente" icon={Clock} />
              <div className="flex-1 h-[2px] bg-zinc-800 min-w-[20px]" />
              <ProgressStep active={['PROCESSANDO', 'ENTREGUE'].includes(order.status)} label="Em Processo" icon={Package} />
              <div className="flex-1 h-[2px] bg-zinc-800 min-w-[20px]" />
              <ProgressStep active={order.status === 'ENTREGUE'} label="Entregue" icon={CheckCircle2} />
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="py-20 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
            <ShoppingCart className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400">Nenhum pedido realizado</h3>
            <p className="text-zinc-500 mt-2">Explore nossos produtos e faça sua primeira compra.</p>
            <motion.div whileHover={{ scale: 1.05 }} className="mt-8">
              <a href="/" className="bg-red-600 text-white px-8 py-3 rounded-full font-bold">Ver Marketplace</a>
            </motion.div>
          </div>
        )}
      </div>
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
