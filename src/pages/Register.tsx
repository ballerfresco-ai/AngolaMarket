import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Loader2, ShieldCheck, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { UserRole } from '../types';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENTE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [admExists, setAdmExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdm() {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ADM');
      
      setAdmExists((count || 0) > 0);
    }
    checkAdm();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Auth Signup with metadata for the DB trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Não foi possível criar o utilizador.');

      // The profile is now created automatically by the DB switch trigger.
      // We no longer need to insert manually here.

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao registar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'CLIENTE', label: 'Cliente', icon: ShoppingBag, desc: 'Compre produtos com entrega ao domicílio.' },
    { value: 'PRODUTOR', label: 'Produtor', icon: Users, desc: 'Venda seus próprios produtos na plataforma.' },
    { value: 'AFILIADO', label: 'Afiliado', icon: TrendingUp, desc: 'Ganhe comissões recomendando produtos.' },
    ...(!admExists ? [{ value: 'ADM', label: 'Administrador', icon: ShieldCheck, desc: 'Gerencie toda a plataforma (Apenas uma conta).' }] : []),
  ];

  return (
    <div className="min-h-screen py-12 px-4 bg-zinc-950 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
              AM
            </div>
          </Link>
          <h1 className="text-3xl font-black mb-2">Comece agora</h1>
          <p className="text-zinc-500">Escolha como deseja interagir com a AngolaMarket.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-4 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-900/50 text-green-500 p-4 rounded-xl text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Registo efectuado com sucesso! Redirecionando para o login...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value as UserRole)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    role === opt.value 
                      ? 'bg-red-600/10 border-red-600' 
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    role === opt.value ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-1">{opt.label}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    {opt.desc}
                  </p>
                  {role === opt.value && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all shadow-sm"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all shadow-sm"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Palavra-passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all shadow-sm"
                placeholder="No mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-red-600/10"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Criar Conta
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-red-500 font-bold hover:underline">
            Fazer Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
