import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock, Wallet, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Liability, Supplier } from '../types';

interface LiabilitiesProps {
  liabilities: Liability[];
  suppliers: Supplier[];
  setLiabilities: React.Dispatch<React.SetStateAction<Liability[]>>;
}

export default function Liabilities({ liabilities, suppliers, setLiabilities }: LiabilitiesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';

  const totalUnpaid = liabilities
    .filter(l => l.status !== 'Paid')
    .reduce((acc, l) => acc + l.amount, 0);

  const toggleStatus = (id: string) => {
    setLiabilities(prev => prev.map(l => 
      l.id === id ? { ...l, status: l.status === 'Paid' ? 'Pending' : 'Paid' } : l
    ));
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.amount) return;

    const newLiability: Liability = {
      id: 'l' + Math.random().toString(36).substr(2, 5),
      supplierId: formData.supplierId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      dueDate: formData.dueDate,
      status: 'Pending'
    };

    setLiabilities(prev => [newLiability, ...prev]);
    setIsAdding(false);
    setFormData({
      supplierId: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Utang Usaha</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau kewajiban pembayaran kepada supplier dan pihak ketiga.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex-1 sm:flex-none">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Total Belum Dibayar</p>
            <p className="text-xl font-bold text-red-600 tracking-tight">Rp {totalUnpaid.toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white p-3 sm:px-5 sm:py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Tambah Utang</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Wallet size={20} />
                </div>
                Catat Utang Baru
              </h3>

              <form onSubmit={handleAddDebt} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Supplier</label>
                    <select 
                      required
                      value={formData.supplierId}
                      onChange={e => setFormData({...formData, supplierId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-600 font-medium appearance-none"
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Keterangan / Alasan Utang</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Pembelian Biji Kopi Batch May" 
                      required
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Utang (Rp)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      required
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-orange-500">Jatuh Tempo</label>
                    <input 
                      type="date" 
                      required
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-orange-50/30 border border-orange-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)} 
                    className="flex-1 px-6 py-4 border border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                  >
                    Simpan Utang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Supplier & Keterangan</th>
                <th className="px-6 py-4">Tanggal Tempo</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {liabilities.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{getSupplierName(l.supplierId)}</p>
                    <p className="text-xs text-slate-400">{l.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={14} className={l.status === 'Paid' ? 'text-slate-300' : 'text-orange-400'} />
                      <span className={new Date(l.dueDate) < new Date() && l.status !== 'Paid' ? 'text-red-500 font-bold' : ''}>
                        {l.dueDate}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-slate-900">Rp {l.amount.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                      l.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {l.status === 'Paid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {l.status === 'Paid' ? 'LUNAS' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(l.id)}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                        l.status === 'Paid' 
                          ? 'text-slate-400 hover:text-slate-600 bg-slate-50' 
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100'
                      }`}
                    >
                      {l.status === 'Paid' ? 'Batalkan Lunas' : 'Tandai Lunas'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
