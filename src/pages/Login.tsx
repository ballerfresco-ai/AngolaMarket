import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Iniciando login para:', email);

    // Safety timeout: reset loading if it takes too long
    const timeout = setTimeout(() => {
      setLoading(loadingState => {
        if (loadingState) {
          setError('O tempo de resposta expirou. Verifique sua conexão e tente novamente.');
          return false;
        }
        return false;
      });
    }, 20000);

    try {
      if ((supabase as any)._isDummy) {
        throw new Error('As variáveis do Supabase não foram configuradas no painel de configurações.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no signIn:', error);
        throw error;
      }
      
      console.log('Login bem-sucedido para:', data.user?.id);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Excepção no login:', err);
      setError(err.message || 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
              AM
            </div>
          </Link>
          <h1 className="text-3xl font-black mb-2">Bem-vindo de volta</h1>
          <p className="text-zinc-500">Entre na sua conta para gerenciar seu negócio ou compras.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="email" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-zinc-400">Palavra-passe</label>
              <button type="button" className="text-xs text-red-500 hover:underline">Esqueceu?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-red-500 font-bold hover:underline">
            Criar conta gratuita
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
