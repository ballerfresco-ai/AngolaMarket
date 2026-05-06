import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AppNotification } from '../types';
import { Bell, CheckCircle2, Package, Wallet, ShoppingCart, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Notifications({ user }: { user: User }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SALE': return <ShoppingCart className="text-green-500" />;
      case 'PRODUCT_APPROVED': return <Package className="text-blue-500" />;
      case 'WITHDRAWAL': return <Wallet className="text-purple-500" />;
      case 'ORDER_STATUS': return <Clock className="text-amber-500" />;
      default: return <Bell className="text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2">Notificações</h1>
          <p className="text-zinc-500 font-medium">Fique atualizado com as últimas novidades da sua conta.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-900 animate-pulse rounded-3xl border border-zinc-800" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative p-6 rounded-3xl border transition-all flex gap-5 items-start ${
                  n.is_read 
                    ? 'bg-zinc-900/50 border-zinc-800 opacity-60' 
                    : 'bg-zinc-900 border-red-600/30 shadow-lg shadow-red-600/5'
                }`}
              >
                <div className={`p-3 rounded-2xl shrink-0 ${
                  n.is_read ? 'bg-zinc-950 text-zinc-500' : 'bg-zinc-950 text-white border border-zinc-800'
                }`}>
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold transition-colors ${n.is_read ? 'text-zinc-400' : 'text-white'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />}
                  </div>
                  <p className={`text-sm leading-relaxed mb-2 ${n.is_read ? 'text-zinc-500' : 'text-zinc-400 font-medium'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                    <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}</span>
                    {!n.is_read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-red-500 hover:underline"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
            <Bell className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold">Você não tem notificações no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
