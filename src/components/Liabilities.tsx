import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock, Wallet, Plus, X, Users, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Liability, Customer } from '../types';

interface LiabilitiesProps {
  liabilities: Liability[];
  customers: Customer[];
  addLiability: (l: Liability) => void;
  updateLiability: (l: Liability) => void;
  addCustomer: (c: Customer) => void;
}

export default function Liabilities({ liabilities, customers, addLiability, updateLiability, addCustomer }: LiabilitiesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', contact: '' });
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

  const totalUnpaid = liabilities
    .filter(l => l.status !== 'Paid')
    .reduce((acc, l) => acc + l.amount, 0);

  const toggleStatus = (id: string) => {
    const l = liabilities.find(item => item.id === id);
    if (l) {
      updateLiability({ ...l, status: l.status === 'Paid' ? 'Pending' : 'Paid' });
    }
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) return;

    const newLiability: Liability = {
      id: 'l' + Math.random().toString(36).substr(2, 5),
      customerId: formData.customerId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      dueDate: formData.dueDate,
      status: 'Pending'
    };

    addLiability(newLiability);
    setIsAdding(false);
    setFormData({
      customerId: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name) return;

    const id = 'c' + Math.random().toString(36).substr(2, 5);
    addCustomer({
      id,
      name: newCustomerData.name,
      contact: newCustomerData.contact || '-',
      category: 'Retail'
    });

    setFormData(prev => ({ ...prev, customerId: id }));
    setIsAddingCustomer(false);
    setNewCustomerData({ name: '', contact: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Utang / Piutang</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau kewajiban pembayaran dan catatan penagihan pelanggan.</p>
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
                id="close-modal-debt"
              >
                <X size={24} />
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Wallet size={20} />
                </div>
                Catat Utang Baru
              </h3>

              {!isAddingCustomer ? (
                <form onSubmit={handleAddDebt} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Pilih Pelanggan</label>
                        <button 
                          type="button"
                          onClick={() => setIsAddingCustomer(true)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider"
                        >
                          <UserPlus size={12} />
                          Tambah Pelanggan Baru
                        </button>
                      </div>
                      <select 
                        required
                        value={formData.customerId}
                        onChange={e => setFormData({...formData, customerId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-600 font-medium appearance-none"
                        id="select-customer"
                      >
                        <option value="">-- Pilih Pelanggan --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Keterangan / Alasan Utang</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Penjualan Tempo Batch A" 
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
              ) : (
                <form onSubmit={handleQuickAddCustomer} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <UserPlus size={16} /> Tambah Pelanggan Cepat
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Pelanggan</label>
                        <input 
                          type="text" 
                          required
                          autoFocus
                          value={newCustomerData.name}
                          onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm"
                          placeholder="Masukkan nama"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kontak (Opsional)</label>
                        <input 
                          type="text" 
                          value={newCustomerData.contact}
                          onChange={e => setNewCustomerData({...newCustomerData, contact: e.target.value})}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm"
                          placeholder="08xx..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCustomer(false)} 
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-400 text-sm hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
                    >
                      Tambah & Pilih
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Pelanggan & Keterangan</th>
                <th className="px-6 py-4">Tanggal Tempo</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Wallet size={40} className="text-slate-200" />
                      <p>Belum ada catatan utang.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                liabilities.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{getCustomerName(l.customerId)}</p>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
