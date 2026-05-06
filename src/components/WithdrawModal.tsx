import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userId: string;
  onSuccess: () => void;
}

export default function WithdrawModal({ isOpen, onClose, balance, userId, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'IBAN' | 'PAYPAY' | 'UNITEL_MONEY' | 'AFRIMONEY' | 'MULTICAIXA_EXPRESS'>('IBAN');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val < 1000) {
      setError('O valor mínimo de saque é 1.000 Kz');
      return;
    }

    if (val > balance) {
      setError('Saldo insuficiente.');
      return;
    }

    if (!details) {
      setError('Por favor, forneça os detalhes do pagamento (IBAN, Número, etc).');
      return;
    }

    setLoading(true);

    try {
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: val,
          payment_method: method,
          payment_details: details,
          status: 'PENDENTE'
        });

      if (withdrawError) throw withdrawError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar o saque.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Solicitar Saque</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-600/10 border border-red-600/20 p-4 rounded-2xl mb-6">
              <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Saldo Disponível</p>
              <p className="text-2xl font-black text-red-500">{formatCurrency(balance)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Quantia a Sacar (Kz)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min: 1.000 Kz"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Método de Recebimento</label>
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-600 transition-colors appearance-none"
                >
                  <option value="IBAN">IBAN (Transferência)</option>
                  <option value="PAYPAY">PayPay AO</option>
                  <option value="UNITEL_MONEY">Unitel Money</option>
                  <option value="AFRIMONEY">Afrimoney</option>
                  <option value="MULTICAIXA_EXPRESS">Multicaixa Express</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Detalhes da Conta</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Introduza o seu IBAN ou número de telefone associado à conta..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-600 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Confirmar Levantamento
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
