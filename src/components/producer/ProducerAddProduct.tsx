import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Upload, X, Package, Tag, Layers, FileText, CheckCircle2, Calculator, Info, Palette, Ruler, Package as WeightIcon, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';

const CATEGORIES: Record<string, string[]> = {
  'Eletrônicos': ['Telemóveis', 'Computadores', 'Acessórios', 'Áudio & Som', 'Gaming'],
  'Moda': ['Roupa Masculina', 'Roupa Feminina', 'Calçado', 'Relógios', 'Malas & Mochilas'],
  'Casa & Decoração': ['Móveis', 'Eletrodomésticos', 'Cozinha', 'Iluminação', 'Jardim', 'Casa & Cozinha'],
  'Beleza & Saúde': ['Perfumes', 'Maquilhagem', 'Cuidado da Pele', 'Suplementos', 'Saúde & Beleza'],
  'Veículos': ['Peças de Carro', 'Motos', 'Acessórios Automotivos'],
  'Outros': ['Livros', 'Desporto', 'Brinquedos', 'Colecionáveis', 'Serviços', 'Alimentos & Bebidas']
};

export default function ProducerAddProduct({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Eletrônicos',
    subcategory: 'Telemóveis',
    condition: 'NOVO',
    color: '',
    size: '',
    weight: '',
    stock: '1',
    affiliate_commission_rate: '10',
    is_featured: false
  });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const PLATFORM_FEE_RATE = 0.10; // Plataforma 10%

  useEffect(() => {
    // Sync subcategory when category changes
    const subs = CATEGORIES[formData.category] || [];
    if (!subs.includes(formData.subcategory)) {
      setFormData(prev => ({ ...prev, subcategory: subs[0] || '' }));
    }
  }, [formData.category]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 10);
      setImageFiles(newFiles);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Calculator Logic
  const priceNum = parseFloat(formData.price) || 0;
  const affiliateRate = parseFloat(formData.affiliate_commission_rate) / 100 || 0;
  const affiliateCommission = priceNum * affiliateRate;
  const platformCommission = priceNum * PLATFORM_FEE_RATE;
  const netEarnings = priceNum - affiliateCommission - platformCommission;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (imageFiles.length === 0) {
      alert('Carregue pelo menos uma imagem.');
      return;
    }
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }

      const { error } = await supabase.from('products').insert({
        name: formData.name,
        description: formData.description,
        price: priceNum,
        category: formData.category,
        subcategory: formData.subcategory,
        condition: formData.condition,
        color: formData.color,
        size: formData.size,
        weight: formData.weight,
        stock: parseInt(formData.stock),
        image_url: uploadedUrls[0],
        image_urls: uploadedUrls,
        producer_id: user.id,
        status: 'PENDENTE',
        affiliate_commission_rate: affiliateRate,
        is_featured: formData.is_featured,
        commission_rate: PLATFORM_FEE_RATE
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      alert('Erro ao cadastrar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black">Produto Enviado!</h2>
        <p className="text-zinc-500 max-w-sm">O seu produto foi enviado para análise e estará disponível na loja assim que for aprovado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Novo Produto</h1>
          <p className="text-zinc-500 text-sm font-medium">Preencha os detalhes técnicos do seu item abaixo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Left Column: Images & Calculator */}
        <div className="lg:col-span-1 space-y-8">
          {/* Images Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                Imagens (1-10)
              </p>
              <span className="text-[10px] font-black text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                {imageFiles.length}/10
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence>
                {imagePreviews.map((preview, index) => (
                  <motion.div 
                    key={preview}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative aspect-square rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800"
                  >
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] font-black py-0.5 text-center uppercase tracking-widest">
                        Principal
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {imageFiles.length < 10 && (
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 hover:border-red-600/50 hover:bg-zinc-800/20 transition-all flex flex-col items-center justify-center text-zinc-600"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Adicionar</span>
                </button>
              )}
            </div>
            
            <input 
              id="image-upload"
              type="file" 
              multiple
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Calculator Section */}
          <div className="bg-zinc-900 border border-red-600/20 rounded-3xl p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="w-20 h-20" />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Calculadora de Ganhos</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500 font-medium">Preço de Venda</span>
                <span className="font-bold text-white">{formatCurrency(priceNum)}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500 font-medium">Comissão Afiliado ({formData.affiliate_commission_rate}%)</span>
                <span className="font-bold text-red-500">-{formatCurrency(affiliateCommission)}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500 font-medium">Taxa Plataforma (10%)</span>
                <span className="font-bold text-red-500">-{formatCurrency(platformCommission)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-800 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Você Recebe</span>
                  <span className="text-xl font-black text-green-500 tracking-tight">{formatCurrency(netEarnings)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 flex gap-3">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                O valor que receberá na sua carteira após a confirmação da entrega do produto conforme o Cash on Delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Informações Básicas</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Produto</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: iPhone 14 Pro Max"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-red-600 transition-all font-bold placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categoria Principal</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-red-600 transition-all font-bold appearance-none"
                    >
                      {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Subcategoria</label>
                  <select 
                    value={formData.subcategory}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 outline-none focus:border-red-600 transition-all font-bold appearance-none disabled:opacity-50"
                  >
                    {CATEGORIES[formData.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-5 w-4 h-4 text-zinc-600" />
                  <textarea 
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Destaque os principais benefícios e detalhes técnicos do seu produto..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-red-600 transition-all font-bold resize-none placeholder:text-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Detalhes Técnicos */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Detalhes Técnicos</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" /> Estado
                  </label>
                  <select 
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-red-600 transition-all font-bold text-xs"
                  >
                    <option value="NOVO">NOVO</option>
                    <option value="USADO">USADO</option>
                    <option value="RECONDICIONADO">RECON.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Palette className="w-2.5 h-2.5" /> Cor
                  </label>
                  <input 
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="Multicolor"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-red-600 transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Ruler className="w-2.5 h-2.5" /> Tamanho
                  </label>
                  <input 
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    placeholder="Ex: XL ou 42"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-red-600 transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <WeightIcon className="w-2.5 h-2.5" /> Peso
                  </label>
                  <input 
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="Ex: 500g"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-red-600 transition-all font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Comercial */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Comercial</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Preço (Kz)</label>
                  <input 
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-red-600 transition-all font-black text-red-500 text-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Stock</label>
                  <input 
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-red-600 transition-all font-black text-white text-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Comissão Afiliado %</label>
                  <div className="relative">
                    <input 
                      required
                      type="number"
                      min="1"
                      max="50"
                      value={formData.affiliate_commission_rate}
                      onChange={(e) => setFormData({...formData, affiliate_commission_rate: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-red-600 transition-all font-black text-blue-500 text-xl"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-700">%</div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                  className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl border-2 transition-all ${formData.is_featured ? 'bg-yellow-500/5 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-500/5' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                >
                  <span className="font-black uppercase tracking-widest text-sm flex items-center gap-3">
                    {formData.is_featured ? (
                      <>🔥 Produto em Destaque (Topo da Loja)</>
                    ) : (
                      <>✨ Promover Produto como Destaque</>
                    )}
                  </span>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_featured ? 'bg-yellow-500' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${formData.is_featured ? 'left-7' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-8 flex flex-col md:flex-row gap-4">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-5 px-8 rounded-3xl border border-zinc-800 hover:border-zinc-700 font-bold transition-all text-zinc-400 hover:text-white"
              >
                Descartar Reclame
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-5 px-8 rounded-3xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black transition-all shadow-2xl shadow-red-600/30 active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-tight"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Publicar Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
