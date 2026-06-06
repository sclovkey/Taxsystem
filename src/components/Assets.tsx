import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from '../types';

interface AssetsProps {
  assets: Asset[];
  addAsset: (a: Asset) => void;
  updateAsset?: (a: Asset) => void;
  deleteAsset?: (id: string) => void;
}

export default function Assets({ assets, addAsset, updateAsset, deleteAsset }: AssetsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    usefulLifePoints: '4',
    salvageValue: '0',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cost) return;

    addAsset({
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      purchaseDate: formData.purchaseDate,
      cost: parseFloat(formData.cost),
      usefulLifePoints: parseFloat(formData.usefulLifePoints),
      salvageValue: parseFloat(formData.salvageValue)
    });
    setIsAdding(false);
    setFormData({
      name: '',
      cost: '',
      usefulLifePoints: '4',
      salvageValue: '0',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !editingAsset.name || !editingAsset.cost) return;

    if (updateAsset) {
      updateAsset(editingAsset);
    }
    setEditingAsset(null);
  };

  const calculateDepreciation = (asset: Asset) => {
    // Basic Straight Line Depreciation
    const annualDepreciation = (asset.cost - asset.salvageValue) / asset.usefulLifePoints;
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    const yearsOwned = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    const totalDepreciation = Math.min(asset.cost - asset.salvageValue, annualDepreciation * yearsOwned);
    return {
      annual: Math.max(0, annualDepreciation),
      accumulated: Math.max(0, totalDepreciation),
      bookValue: Math.max(asset.salvageValue, asset.cost - totalDepreciation)
    };
  };

  const totalCost = assets.reduce((acc, a) => acc + a.cost, 0);
  const totalAccumulated = assets.reduce((acc, a) => acc + calculateDepreciation(a).accumulated, 0);
  const totalBookValue = totalCost - totalAccumulated;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Aktiva Tetap</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola aset usaha dan pantau penyusutannya secara otomatis.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Aset Baru
        </button>
      </header>

      {/* Rekapitulasi Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Biaya Perolehan</p>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Rp {totalCost.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Akumulasi Penyusutan</p>
          <h3 className="text-xl font-bold text-red-600 tracking-tight">Rp {totalAccumulated.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl border border-indigo-500 shadow-md shadow-indigo-100 text-white">
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Nilai Buku</p>
          <h3 className="text-xl font-bold tracking-tight">Rp {totalBookValue.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Aset</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Contoh: Mesin Kopi, Motor Delivery"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Harga Perolehan (Rp)</label>
              <input 
                type="number"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Umur Ekonomis (Tahun)</label>
              <input 
                type="number"
                value={formData.usefulLifePoints}
                onChange={e => setFormData({...formData, usefulLifePoints: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nilai Residu (Rp)</label>
              <input 
                type="number"
                value={formData.salvageValue}
                onChange={e => setFormData({...formData, salvageValue: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-bold">Simpan Aset</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {assets.map((asset) => {
           const dep = calculateDepreciation(asset);
           return (
            <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">{asset.name}</h3>
                  <div className="flex gap-4 text-xs text-slate-400 font-medium">
                    <span>Beli: {asset.purchaseDate}</span>
                    <span>Umur: {asset.usefulLifePoints} Thn</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 lg:max-w-2xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Harga Perolehan</p>
                    <p className="text-sm font-bold text-slate-700">Rp {asset.cost.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Penyusutan / Thn</p>
                    <p className="text-sm font-bold text-red-500">Rp {dep.annual.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Akumulasi</p>
                    <p className="text-sm font-bold text-slate-700">Rp {dep.accumulated.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Nilai Buku</p>
                    <p className="text-sm font-bold text-indigo-600">Rp {dep.bookValue.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="flex gap-2 self-start lg:self-center">
                  <button 
                    onClick={() => setEditingAsset(asset)}
                    type="button"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all"
                    title="Edit Aktiva Tetap"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteAsset && deleteAsset(asset.id)}
                    type="button"
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all"
                    title="Hapus Aktiva Tetap"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="h-1 bg-slate-50 w-full">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${(dep.accumulated / (asset.cost - asset.salvageValue)) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {assets.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic text-sm">Belum ada aset yang terdaftar.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingAsset && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Edit Aktiva Tetap</h3>
                <button 
                  onClick={() => setEditingAsset(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Aset</label>
                  <input 
                    type="text"
                    required
                    value={editingAsset.name}
                    onChange={e => setEditingAsset({...editingAsset, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none animate-none"
                    placeholder="Contoh: Mesin Kopi, Motor Delivery"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Harga Perolehan (Rp)</label>
                  <input 
                    type="number"
                    disabled
                    value={editingAsset.cost}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-lg px-4 py-2 text-sm cursor-not-allowed outline-none animate-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">*Harga Perolehan disinkronkan otomatis dari transaksi</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Umur Ekonomis (Tahun)</label>
                  <input 
                    type="number"
                    required
                    value={editingAsset.usefulLifePoints}
                    onChange={e => setEditingAsset({...editingAsset, usefulLifePoints: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none animate-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nilai Residu (Rp)</label>
                  <input 
                    type="number"
                    required
                    value={editingAsset.salvageValue}
                    onChange={e => setEditingAsset({...editingAsset, salvageValue: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none animate-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingAsset(null)}
                    className="flex-1 bg-slate-100 text-slate-600 rounded-lg py-2 text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
