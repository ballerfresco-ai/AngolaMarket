import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Copy, 
  ExternalLink, 
  Plus,
  Trophy,
  TrendingUp,
  Calendar,
  Handshake,
  Link as LinkIcon,
  MoreVertical,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import AffiliateBrowseProducts from '../../components/affiliate/AffiliateBrowseProducts';
import AffiliateLinks from '../../components/affiliate/AffiliateLinks';

type Tab = 'overview' | 'orders' | 'browse' | 'links' | 'wallet';

export default function AffiliateDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, commission: 0 });
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [
        { data: linksData },
        { data: walletData },
        { data: salesData }
      ] = await Promise.all([
        supabase.from('affiliate_requests').select('*, product:products(*)').eq('affiliate_id', user.id).eq('status', 'APROVADO'),
        supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
        supabase.from('orders').select('*').eq('affiliate_id', user.id).eq('delivery_status', 'ENTREGUE')
      ]);

      if (linksData) setLinks(linksData as any);
      if (walletData) setWallet(walletData);
      
      const totalSalesValue = salesData?.reduce((acc, o) => acc + Number(o.total_price), 0) || 0;
      setStats({
        totalSales: salesData?.length || 0,
        commission: totalSalesValue
      });

      // Fetch ranking data
      const { data: topAffiliates } = await supabase
        .from('orders')
        .select('affiliate_id, total_price, users!affiliate_id(full_name)')
        .not('affiliate_id', 'is', null)
        .eq('delivery_status', 'ENTREGUE');

      if (topAffiliates) {
        const rankingMap = topAffiliates.reduce((acc: any, curr: any) => {
          const id = curr.affiliate_id;
          if (!acc[id]) {
            acc[id] = { 
              name: (curr.users as any)?.full_name || 'Afiliado', 
              sales: 0, 
              value: 0 
            };
          }
          acc[id].sales += 1;
          acc[id].value += Number(curr.total_price);
          return acc;
        }, {});

        const rankingArray = Object.values(rankingMap)
          .sort((a: any, b: any) => b.sales - a.sales)
          .slice(0, 5);
        setRanking(rankingArray);
      }

      setLoading(false);
    }
    fetchData();
  }, [user.id]);

  const tabs = [
    { id: 'overview', label: 'Estatísticas', icon: LayoutDashboard },
    { id: 'orders', label: 'Meus Pedidos', icon: ShoppingCart },
    { id: 'browse', label: 'Mercado de Afiliados', icon: Handshake },
    { id: 'links', label: 'Links de Venda', icon: LinkIcon },
    { id: 'wallet', label: 'Minha Carteira', icon: Wallet }
  ];

  if (loading) return <div className="p-8 text-center text-zinc-500">A carregar painel do afiliado...</div>;

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header com Menu de Opções */}
      <div className="flex flex-col gap-6 pb-6 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">Central do Afiliado</h1>
            <p className="text-zinc-500 font-medium flex items-center gap-2">
              <span className="text-white font-bold">{user.full_name}</span> 
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              {currentTab?.label}
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
                      <p className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-2">Navegação do Painel</p>
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

        <div className="flex flex-col sm:flex-row bg-zinc-900 border border-zinc-800 p-6 rounded-3xl items-center gap-6 shadow-xl shadow-red-600/5">
          <div className="flex items-center gap-4 sm:border-r sm:border-zinc-800 sm:pr-6 w-full sm:w-auto">
            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Saldo de Comissões</p>
              <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(wallet?.balance || 0)}</p>
            </div>
          </div>
          <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
          >
            Solicitar Levantamento
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total de Vendas</p>
                    <Plus className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter">{stats.totalSales}</p>
                  <p className="text-xs text-zinc-600 font-medium">Desde o início</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Valor Gerado</p>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter text-green-500">{formatCurrency(stats.commission)}</p>
                  <p className="text-xs text-zinc-600 font-medium">Lucro bruto consolidado</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Links Ativos</p>
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter">{links.length}</p>
                  <p className="text-xs text-zinc-600 font-medium">Produtos em promoção</p>
                </div>
              </div>

              {/* Ranking & Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Ranking de Afiliados
                  </h2>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    {ranking.map((item, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-4 p-4 border-b border-zinc-800 last:border-0 ${index === 0 ? 'bg-yellow-500/5' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-zinc-300 text-black' : 
                          index === 2 ? 'bg-amber-600 text-white' : 
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{item.name}</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-black">{item.sales} vendas</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-green-500">{formatCurrency(item.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-blue-500" />
                    Performance de Conversão
                  </h2>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-500">Meta Semanal</span>
                        <span className="font-bold">12 / 20 vendas</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: '60%' }}
                           className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                        <div className="text-[10px] text-zinc-500 uppercase font-black mb-1">CTR Médio</div>
                        <div className="text-lg font-bold">4.2%</div>
                      </div>
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                        <div className="text-[10px] text-zinc-500 uppercase font-black mb-1">EPC</div>
                        <div className="text-lg font-bold">450 Kz</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
               key="orders"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Meus Pedidos Gerados</h2>
                <div className="p-12 text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                  <p>Suas vendas aparecerão aqui após processadas pelos produtores.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'browse' && (
            <motion.div 
               key="browse"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <AffiliateBrowseProducts user={user} />
            </motion.div>
          )}

          {activeTab === 'links' && (
            <motion.div 
               key="links"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <AffiliateLinks user={user} />
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div 
               key="wallet"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                 <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Minha Carteira</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-center">
                       <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Saldo Disponível para Saque</p>
                       <p className="text-5xl font-black text-red-600 tracking-tighter mb-6">{formatCurrency(wallet?.balance || 0)}</p>
                       <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-600/20">
                         Solicitar Resgate
                       </button>
                    </div>
                    <div className="space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-zinc-400">
                         <Calendar className="w-4 h-4" />
                         Histórico Recente
                       </h3>
                       <div className="space-y-2">
                          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex justify-between items-center">
                             <div>
                                <p className="text-xs font-bold text-white">Venda Afiliado #4521</p>
                                <p className="text-[10px] text-zinc-500">Ontem às 14:20</p>
                             </div>
                             <p className="font-black text-green-500 font-mono">+1.500 Kz</p>
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
