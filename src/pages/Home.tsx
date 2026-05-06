import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogIn, User as UserIcon, Search, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, User } from '../types';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export default function Home({ user }: { user: User | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'APROVADO')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white transition-transform group-hover:rotate-12">
              AM
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">Angola<span className="text-red-600">Market</span></span>
          </Link>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Pesquisar produtos..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/cart" className="p-2 hover:bg-zinc-900 rounded-full transition-colors relative">
                  <ShoppingCart className="w-6 h-6" />
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden md:block">Conta</span>
                </Link>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <LogIn className="w-4 h-4" />
                <span className="text-sm">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000" 
          alt="Angola Marketplace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="container mx-auto px-4 relative z-20 h-full flex flex-col justify-center max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black mb-4 leading-tight"
          >
            Os Melhores Produtos de <span className="text-red-600 underline">Angola</span> Num Só Lugar.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-300 text-lg mb-8"
          >
            Compre diretamente de produtores locais com pagamento seguro na entrega (Cash on Delivery).
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/register" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all inline-block">
              Começar a Comprar
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-red-600" />
            Produtos Disponíveis
          </h2>
          <div className="text-sm text-zinc-500">Exibindo {filteredProducts.length} produtos</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-zinc-900 animate-pulse h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-red-600/50"
              >
                <Link to={`/product/${p.id}`} className="block relative aspect-square overflow-hidden">
                  <img 
                    src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'} 
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {p.is_featured && (
                      <div className="bg-yellow-500 text-black px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg">
                        🔥 Destaque
                      </div>
                    )}
                    <div className="bg-zinc-950/80 backdrop-blur px-2 py-1 rounded-md text-[10px] font-black text-red-500 border border-red-500/20 uppercase tracking-widest">
                      COD Disponível
                    </div>
                  </div>
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <Link to={`/product/${p.id}`} className="text-lg font-bold hover:text-red-600 transition-colors line-clamp-1 mb-1">
                    {p.name}
                  </Link>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">
                    {p.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-black text-white">
                      {formatCurrency(p.price)}
                    </span>
                    <Link 
                      to={`/product/${p.id}`}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400">Nenhum produto encontrado</h3>
            <p className="text-zinc-500">Tente ajustar sua pesquisa ou explore outras categorias.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white">AM</div>
              <span className="text-xl font-bold">AngolaMarket</span>
            </div>
            <p className="text-zinc-500 max-w-sm">
              A maior rede de marketplace de Angola. Conectando o campo às cidades através da tecnologia e confiança.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/register" className="hover:text-red-600 transition-colors">Torne-se um Produtor</Link></li>
              <li><Link to="/register" className="hover:text-red-600 transition-colors">Seja um Afiliado</Link></li>
              <li><Link to="/" className="hover:text-red-600 transition-colors">Como Funciona</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link to="/" className="hover:text-red-600 transition-colors">FAQ</Link></li>
              <li><Link to="/" className="hover:text-red-600 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/" className="hover:text-red-600 transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} AngolaMarket. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
