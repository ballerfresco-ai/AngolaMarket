import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Order } from '../../types';
import { 
  ShoppingCart, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Truck,
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function ProducerOrders({ user }: { user: User }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function updateStatus(orderId: string, type: 'status' | 'delivery_status', newValue: string) {
    setUpdateLoading(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [type]: newValue })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, [type]: newValue } : o));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdateLoading(null);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  async function fetchOrders() {
    setLoading(true);
    try {
      // Fetch orders where producer_id matches
      // Note: We need to join with products to see what was sold, 
      // but the current schema has producer_id directly in orders for convenience.
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (name, image_url),
          clients:client_id (full_name, email)
        `)
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data);
    } catch (err: any) {
      console.error('Erro ao buscar encomendas:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.clients?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig: any = {
    'PENDENTE': { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
    'PROCESSANDO': { label: 'Em Preparação', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Truck },
    'ENVIADO': { label: 'Enviado', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Truck },
    'ENTREGUE': { label: 'Entregue', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
    'CANCELADO': { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  };

  const deliveryStatusConfig: any = {
    'PENDENTE': { label: 'Pendente', color: 'bg-zinc-800 text-zinc-400', icon: Clock },
    'EM_ENTREGA': { label: 'Em Entrega', color: 'bg-blue-600/10 text-blue-500 border-blue-600/20', icon: Truck },
    'ENTREGUE': { label: 'Entregue', color: 'bg-green-600/10 text-green-500 border-green-600/20', icon: CheckCircle2 },
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">A carregar o seu histórico de vendas...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-red-600" />
          Minhas Vendas
        </h2>
        <p className="text-zinc-500 text-sm font-medium mt-1">Acompanhe e gira os pedidos dos seus produtos.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text"
          placeholder="Procurar por ID, produto ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-red-600 transition-all font-medium"
        />
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusConfig[order.status]?.icon || Clock;
          return (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-all group">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-20 h-20 bg-zinc-800 rounded-2xl border border-zinc-700 overflow-hidden shrink-0 shadow-sm self-start">
                  <img src={order.products?.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded tracking-widest uppercase">#{order.id.slice(0, 8)}</span>
                        <span className="text-zinc-500 text-xs">•</span>
                        <span className="text-zinc-500 text-xs font-bold">{formatDate(order.created_at)}</span>
                      </div>
                      <h4 className="font-black text-lg tracking-tight">{order.products?.name}</h4>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Total Ganho</p>
                        <p className="text-xl font-black text-red-500 tracking-tighter">{formatCurrency(order.total_price)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border flex items-center gap-1.5 ${statusConfig[order.status]?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[order.status]?.label}
                        </div>
                        <select 
                          value={order.delivery_status || 'PENDENTE'}
                          onChange={(e) => updateStatus(order.id, 'delivery_status', e.target.value)}
                          disabled={updateLoading === order.id}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border bg-zinc-950 flex items-center gap-1.5 outline-none focus:border-red-600 ${deliveryStatusConfig[order.delivery_status || 'PENDENTE']?.color}`}
                        >
                          <option value="PENDENTE">PEDIDO PENDENTE</option>
                          <option value="EM_ENTREGA">EM ENTREGA</option>
                          <option value="ENTREGUE">ENTREGUE</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-start gap-2">
                      <div className="p-2 rounded-lg bg-zinc-800 mt-0.5">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-400">Cliente & Local de Entrega</p>
                        <p className="font-bold text-sm text-zinc-300">{order.clients?.full_name}</p>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">{order.delivery_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                       <button className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
                         Detalhes do Pedido
                         <ChevronDown className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="p-20 text-center bg-zinc-900 border border-zinc-800 border-dashed rounded-3xl text-zinc-500 space-y-4">
             <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="w-8 h-8 opacity-20" />
             </div>
             <p className="font-medium italic">Nenhuma venda registada até ao momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
