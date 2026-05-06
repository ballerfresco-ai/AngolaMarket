import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Upload, X, Package, Tag, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function ProducerAddProduct({ user }: { user: User }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Eletrônicos',
    stock: '1'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    'Eletrônicos', 'Moda', 'Casa & Cozinha', 'Saúde & Beleza', 
    'Brinquedos', 'Livros', 'Serviços', 'Alimentos & Bebidas'
  ];

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('products').insert({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        image_url: imageUrl,
        producer_id: user.id,
        status: 'PENDENTE'
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Novo Produto</h1>
          <p className="text-zinc-500 text-sm font-medium">Preencha os dados abaixo para submeter o seu produto.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Imagem do Produto</p>
            <div 
              className={`relative aspect-square rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950 overflow-hidden group cursor-pointer transition-all hover:border-red-600/50 ${imagePreview ? 'border-none' : ''}`}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-4 text-center">
                  <Upload className="w-10 h-10 mb-2" />
                  <p className="text-xs font-bold">Clique para carregar imagem</p>
                </div>
              )}
            </div>
            <input 
              id="image-upload"
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="text-[10px] text-zinc-500 text-center">Recomendado: JPG ou PNG quadrado (1:1), máx 2MB.</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3 h-3 text-red-600" />
                    Nome do Produto
                  </label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: iPhone 14 Pro Max"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-red-600 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3 text-red-600" />
                    Categoria
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-red-600 transition-all font-medium appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3 h-3 text-red-600" />
                  Descrição Completa
                </label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o seu produto com detalhes..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-red-600 transition-all font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço (Kz)</label>
                  <input 
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-red-600 transition-all font-black text-red-500 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Stock Disponível</label>
                  <input 
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-red-600 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 px-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Publicar Produto'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
