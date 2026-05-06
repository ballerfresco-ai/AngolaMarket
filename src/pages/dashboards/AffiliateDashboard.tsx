import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Product, Order, AffiliateLink } from '../../types';
import { 
  BarChart3, 
  Link as LinkIcon, 
  ShoppingCart, 
  Wallet,
  Copy,
  ExternalLink,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AffiliateDashboard({ user }: { user: User }) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, commission: 0 });
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [
        { data: linksData },
        { data: walletData },
        { data: salesData }
      ] = await Promise.all([
        supabase.from('affiliate_links').select('*, product:products(*)').eq('affiliate_id', user.id),
        supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
        supabase.from('orders').select('*').eq('affiliate_id', user.id).eq('status', 'ENTREGUE')
      ]);

      if (linksData) setLinks(linksData as any);
      if (walletData) setWallet(walletData);

      const totalSalesValue = salesData?.reduce((acc, o) => acc + Number(o.total_price), 0) || 0;
      // In this system, maybe affiliates get a cut of the commission? 
      // Let's assume for simplicity they get a specific amount, or 5% of sale.
      // But user didn't specify commission for affiliates, just "Comissão da plataforma: 10%".
      // I'll assume they get half of the platform commission (5%) for now as a placeholder.
      setStats({
        totalSales: salesData?.length || 0,
        commission: totalSalesValue * 0.05
      });

      setLoading(false);
    }
    fetchData();
  }, [user.id]);

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/product/${code}?ref=${code}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black mb-2">Painel de Afiliado</h1>
        <p className="text-zinc-500">Promova produtos e ganhe comissões por cada venda realizada.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl inline-flex mb-4">
            <ShoppingCart className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Vendas Totais</p>
          <p className="text-3xl font-black">{stats.totalSales}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl inline-flex mb-4">
            <BarChart3 className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Comissões Acumuladas</p>
          <p className="text-3xl font-black">{formatCurrency(stats.commission)}</p>
        </div>

        <div className="bg-zinc-900 border border-red-600/30 p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-red-600/10">
          <div className="p-3 bg-red-600 rounded-xl inline-flex mb-4 shadow-lg shadow-red-600/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Saldo da Carteira</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black">{formatCurrency(wallet?.balance || 0)}</p>
            <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all">
              Sacar (200 Kz)
            </button>
          </div>
        </div>
      </div>

      {/* My Links Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LinkIcon className="text-red-600" />
            Meus Links de Afiliado
          </h2>
          <Link to="/dashboard/marketplace" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            Gerar Novo Link
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => (
            <div key={link.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl group flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                  <img src={link.product?.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate group-hover:text-red-500 transition-colors">{link.product?.name}</h3>
                  <p className="text-zinc-500 text-sm">{formatCurrency(link.product?.price || 0)}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(link.id)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Link
                </button>
                <Link 
                  to={`/product/${link.product_id}`}
                  className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {links.length === 0 && (
            <div className="col-span-full py-16 text-center bg-zinc-950/50 border border-dashed border-zinc-800 rounded-3xl">
              <LinkIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">Você ainda não gerou nenhum link de afiliado.</p>
              <Link to="/dashboard/marketplace" className="inline-block mt-4 text-red-500 font-bold hover:underline">
                Ir para o Mercado
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
