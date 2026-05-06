import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, User, DeliveryFee } from '../types';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Phone,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Star,
  MessageSquare,
  Ticket
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetails({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [producer, setProducer] = useState<User | null>(null);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState(false);
  
  // Checkout Form State
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: prodData } = await supabase
        .from('products')
        .select('*, producer:producer_id(*)')
        .eq('id', id)
        .single();
      
      const { data: feesData } = await supabase
        .from('delivery_fees')
        .select('*')
        .order('neighborhood', { ascending: true });

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, client:client_id(full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (prodData) {
        setProduct(prodData);
        setProducer((prodData as any).producer);
      }
      if (feesData) setDeliveryFees(feesData);
      if (reviewsData) setReviews(reviewsData);

      if (user) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('product_id', id)
          .eq('client_id', user.id)
          .eq('delivery_status', 'ENTREGUE');
        
        if (orders && orders.length > 0) {
          const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('product_id', id)
            .eq('client_id', user.id);
          
          if (!existingReview || existingReview.length === 0) {
            setCanReview(true);
          }
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [id, user]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setCouponError('Cupom inválido ou expirado.');
      setAppliedCoupon(null);
      return;
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setCouponError('Cupom expirado.');
      setAppliedCoupon(null);
      return;
    }

    if (product && product.price < data.min_purchase) {
      setCouponError(`Compra mínima para este cupom: ${formatCurrency(data.min_purchase)}`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(data);
    setCouponError('');
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    setReviewLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        client_id: user.id,
        product_id: product.id,
        producer_id: product.producer_id,
        rating: reviewRating,
        comment: reviewComment
      });

      if (error) throw error;
      
      // Refresh reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, client:client_id(full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      if (reviewsData) setReviews(reviewsData);
      setCanReview(false);
      setReviewComment('');
    } catch (err: any) {
      alert('Erro ao enviar avaliação: ' + err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const selectedFee = deliveryFees.find(f => f.neighborhood === neighborhood)?.fee || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount_value : 0;
  const totalPrice = Math.max(0, (product?.price || 0) + selectedFee - discountAmount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;

    setOrderLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          client_id: user.id,
          producer_id: product.producer_id,
          quantity: 1,
          delivery_fee: selectedFee,
          discount_amount: discountAmount,
          coupon_id: appliedCoupon?.id,
          total_price: totalPrice,
          delivery_neighborhood: neighborhood,
          delivery_address: address,
          client_phone: phone,
          status: 'PENDENTE',
          delivery_status: 'PENDENTE'
        });

      if (error) throw error;
      setOrderSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      alert('Erro ao processar pedido: ' + err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 flex-col gap-4">
      <Package className="w-16 h-16 text-zinc-800" />
      <h1 className="text-xl font-bold">Produto não encontrado</h1>
      <Link to="/" className="text-red-500 hover:underline">Voltar ao marketplace</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <div className="font-bold hidden sm:block">Detalhes do Produto</div>
          <Link to="/cart" className="p-2 hover:bg-zinc-900 rounded-full">
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div 
              layoutId={`product-img-${product.id}`}
              className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <img 
                src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200'} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-red-600/10 text-red-500 text-xs font-black px-2 py-1 rounded-md tracking-widest uppercase">Novidade</span>
                <span className="text-zinc-500 text-sm">• Stock: {product.stock} disponíveis</span>
              </div>
              <h1 className="text-4xl font-black mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-black text-white">{formatCurrency(product.price)}</span>
                <span className="text-zinc-500 line-through text-lg">{formatCurrency(product.price * 1.2)}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-lg mb-8">
                {product.description || 'Nenhuma descrição detalhada fornecida pelo produtor.'}
              </p>
            </div>

            {/* Features/Trust */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Truck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Entrega Domicílio</h4>
                  <p className="text-[10px] text-zinc-500">Pagamento no ato da entrega</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Compra Segura</h4>
                  <p className="text-[10px] text-zinc-500">Plataforma verificada</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-auto pt-8 border-t border-zinc-800 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setCheckoutModal(true)}
                className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Comprar Agora
              </button>
              <a 
                href={`https://wa.me/${producer?.phone || '244000000000'}?text=Olá! Estive a ver o seu produto "${product.name}" no AngolaMarket e gostaria de saber mais.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-20 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-black mb-4">Avaliações</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-black text-white">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'}
                </div>
                <div>
                  <div className="flex text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <div className="text-zinc-500 text-sm">{reviews.length} avaliações</div>
                </div>
              </div>

              {canReview && (
                <form onSubmit={handleReview} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold">Deixe a sua avaliação</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`p-1 transition-colors ${reviewRating >= star ? 'text-yellow-500' : 'text-zinc-700 hover:text-zinc-600'}`}
                      >
                        <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    placeholder="O que achou deste produto?"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none resize-none"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publicar'}
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1 space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-900">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400 capitalize">
                          {(review as any).client?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold">{(review as any).client?.full_name || 'Usuário'}</div>
                          <div className="flex text-yellow-500 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-12 border-2 border-dashed border-zinc-900 rounded-3xl">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <p>Sem avaliações ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !orderLoading && setCheckoutModal(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-8 relative z-10 overflow-hidden"
            >
              {orderSuccess ? (
                <div className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black mb-2">Pedido Recebido!</h2>
                    <p className="text-zinc-500">O produtor foi notificado e entrará em contacto em breve.</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl inline-block">
                    <p className="text-xs text-zinc-500 uppercase font-black mb-1">Pagamento no ato da entrega</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalPrice)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Pagamento na Entrega</h2>
                    <p className="text-zinc-500">Confirme seus dados para completar o pedido.</p>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Bairro / Zona</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                            <select 
                              required
                              value={neighborhood}
                              onChange={(e) => setNeighborhood(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:border-red-600 appearance-none"
                            >
                              <option value="">Selecione o Bairro</option>
                              {deliveryFees.map(f => (
                                <option key={f.id} value={f.neighborhood}>
                                  {f.neighborhood} (+{formatCurrency(f.fee)})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Telemóvel</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                            <input 
                              required
                              type="tel"
                              placeholder="9xx xxx xxx"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-600"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Endereço Detalhado</label>
                        <textarea 
                          required
                          rows={2}
                          placeholder="Rua, número da casa, ponto de referência..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 resize-none"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Cupom de Desconto</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                          <input 
                            type="text"
                            placeholder="CÓDIGO"
                            className={`w-full bg-zinc-950 border ${couponError ? 'border-red-500' : 'border-zinc-800'} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-600 uppercase`}
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-sm transition-all whitespace-nowrap"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] text-red-500 ml-1">{couponError}</p>}
                      {appliedCoupon && (
                        <p className="text-[10px] text-green-500 ml-1">
                          Cupom {appliedCoupon.code} aplicado: -{formatCurrency(appliedCoupon.discount_value)}
                        </p>
                      )}
                    </div>

                    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Produto</span>
                        <span className="font-bold">{formatCurrency(product.price)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Desconto</span>
                          <span className="font-bold text-red-500">-{formatCurrency(appliedCoupon.discount_value)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Taxa de Entrega</span>
                        <span className="font-bold text-green-500">+{formatCurrency(selectedFee)}</span>
                      </div>
                      <div className="h-[1px] bg-zinc-800" />
                      <div className="flex justify-between text-lg font-black">
                        <span>Total</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>

                    {!user && (
                      <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-500 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Você precisa estar logado para realizar um pedido.
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={orderLoading || !neighborhood || !address || !phone}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3"
                    >
                      {orderLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Confirmar Pedido (Pagar na Entrega)
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
