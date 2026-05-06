import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { User } from '../types';

export default function Cart({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 container mx-auto max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-black">Meu Carrinho</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
        <ShoppingCart className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">O seu carrinho está vazio no momento.</p>
        <Link to="/" className="inline-block mt-6 text-red-500 font-bold hover:underline">
          Voltar às compras
        </Link>
      </div>
    </div>
  );
}
