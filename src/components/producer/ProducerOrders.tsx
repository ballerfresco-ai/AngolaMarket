import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Order } from '../../types';
import { ShoppingCart, Package, Truck, CheckCircle2, Clock, MapPin, Phone, User as UserIcon, Handshake } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProducerOrders({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODOS' | 'PENDENTE' | 'A CAMINHO' | 'ENTREGUE'>('TODOS');

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false });
    
    const filteredRows = (data as any[])?.filter(o => o.product.producer_id === user.id) || [];
    setOrders(filteredRows);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: status })
      .eq('id', orderId);
    
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, delivery_status: status } : o));
    }
  }

  const filteredOrders = filter === 'TODOS' ? orders : orders.filter(o => o.delivery_status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Pedidos</h2>
          <p className="text-zinc-500 text-sm">Acompanhe e gerencie as entregas dos seus produtos.</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {['TODOS', 'PENDENTE', 'A CAMINHO', 'ENTREGUE'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                filter === s ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 bg-zinc-800 rounded-2xl overflow-hidden shrink-0">
                <img src={(order as any).product?.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{(order as any).product?.name}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Pedido #{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-600 tracking-tighter">{formatCurrency(order.total_price)}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <UserIcon className="w-3 h-3" />
                      Dados do Cliente
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-300">{order.customer_name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                         <Phone className="w-3 h-3" />
                         {order.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      Endereço de Entrega
                    </p>
                    <p className="text-xs text-zinc-400 font-medium">{order.delivery_address}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800/50">
                   <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {[
                        { s: 'PENDENTE', icon: Clock },
                        { s: 'A CAMINHO', icon: Truck },
                        { s: 'ENTREGUE', icon: CheckCircle2 }
                      ].map((status) => (
                        <button
                          key={status.s}
                          onClick={() => updateStatus(order.id, status.s)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            order.delivery_status === status.s 
                              ? (status.s === 'ENTREGUE' ? 'bg-green-600 text-white' : status.s === 'A CAMINHO' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-white')
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          <status.icon className="w-3 h-3" />
                          {status.s}
                        </button>
                      ))}
                   </div>
                   {order.affiliate_id && (
                     <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <Handshake className="w-3 h-3 text-red-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Via Afiliado</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="py-24 text-center bg-zinc-900 border border-dashed border-zinc-800 rounded-3xl">
             <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-zinc-800 opacity-20" />
             <p className="text-zinc-500 font-medium">Nenhum pedido encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
