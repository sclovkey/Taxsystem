import React, { useState } from 'react';
import { Truck, Phone, Tag, Plus, X, Search, Trash2 } from 'lucide-react';
import { Supplier } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SuppliersProps {
  suppliers: Supplier[];
  addSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
}

export default function Suppliers({ suppliers, addSupplier, deleteSupplier }: SuppliersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.category) return;

    addSupplier({
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    });

    setFormData({ name: '', contact: '', category: '' });
    setIsAdding(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Supplier</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data pemasok bahan baku dan operasional Anda.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Tambah Supplier</span>
        </button>
      </header>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Supplier</p>
            <p className="text-xl font-bold text-slate-900">{suppliers.length}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari supplier atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full min-h-[52px] bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
          />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Truck size={20} />
                  <h2 className="font-bold">Tambah Supplier Baru</h2>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Nama Supplier</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Kopi Jaya Abadi"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Kontak / Telepon</label>
                  <input 
                    type="text"
                    required
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Kategori Produk</label>
                  <input 
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Contoh: Biji Kopi, Packaging, Susu"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Simpan Supplier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Truck size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Belum ada supplier</h3>
            <p className="text-slate-400 text-sm">Klik tombol "Tambah Supplier" untuk mulai mendata.</p>
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Truck size={20} />
                </div>
                <button 
                  onClick={() => deleteSupplier(s.id)}
                  className="p-2 text-slate-300 hover:text-brand-yellow hover:bg-brand-blue rounded-lg transition-all opacity-40 group-hover:opacity-100"
                  title="Hapus Supplier"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{s.name}</h3>
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Tag size={14} className="text-slate-400" />
                  <span>Kategori: <span className="font-semibold">{s.category}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>Kontak: <span className="font-semibold">{s.contact}</span></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
