import React, { useState } from 'react';
import { History, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { EquityRecord } from '../types';

interface EquityReportProps {
  equityRecords: EquityRecord[];
  addEquityRecord: (r: EquityRecord) => void;
  deleteEquityRecord: (id: string) => void;
  currentProfit: number;
}

export default function EquityReport({ equityRecords, addEquityRecord, deleteEquityRecord, currentProfit }: EquityReportProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Addition' as const,
    date: new Date().toISOString().split('T')[0]
  });

  const totalBeginning = equityRecords.filter(r => r.type === 'Initial').reduce((acc, r) => acc + r.amount, 0);
  const totalAdditions = equityRecords.filter(r => r.type === 'Addition').reduce((acc, r) => acc + r.amount, 0);
  const totalWithdrawals = equityRecords.filter(r => r.type === 'Withdrawal').reduce((acc, r) => acc + r.amount, 0);
  
  const endingCapital = totalBeginning + totalAdditions - totalWithdrawals + currentProfit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    const typeLabels: Record<string, string> = {
      Initial: 'Modal Awal',
      Addition: 'Penambahan Modal',
      Withdrawal: 'Prive'
    };

    addEquityRecord({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      description: typeLabels[formData.type] || formData.type,
      amount: parseFloat(formData.amount)
    });
    setIsAdding(false);
    setFormData({
      amount: '',
      type: 'Addition',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-900">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perubahan Modal</h1>
          <p className="text-slate-500 text-sm font-medium">Investasi & Penarikan Pemilik</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-brand-blue/10 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Update Modal
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jenis Modal</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none appearance-none"
              >
                <option value="Initial">Modal Awal Pemilik</option>
                <option value="Addition">Penambahan Modal</option>
                <option value="Withdrawal">Prive (Ambil Modal)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tanggal</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jumlah (Rp)</label>
              <input 
                type="number"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-bold hover:bg-slate-800 transition-colors">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm">
            <span className="text-slate-600 font-medium">Modal Awal Pemilik</span>
            <span className="text-slate-900 font-bold">Rp {totalBeginning.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm text-green-600">
            <span className="font-medium">Laba Tahun Berjalan</span>
            <span className="font-bold">+ Rp {currentProfit.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm text-brand-blue font-bold">
            <span className="font-medium">Penambahan Modal</span>
            <span className="font-bold">+ Rp {totalAdditions.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm text-red-600">
            <span className="font-medium">Pengambilan Prive</span>
            <span className="font-bold">- Rp {totalWithdrawals.toLocaleString('id-ID')}</span>
          </div>
          <div className="pt-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Modal Akhir Pemilik</h3>
            <span className="text-2xl font-bold text-brand-blue">Rp {endingCapital.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
         <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" />
            Riwayat Perubahan
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equityRecords.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm group">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => deleteEquityRecord(r.id)}
                    className="p-2 text-slate-300 hover:text-brand-yellow hover:bg-brand-blue rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {r.type === 'Initial' ? 'Modal Awal' : r.type === 'Addition' ? 'Penambahan Modal' : 'Prive'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{r.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${r.type === 'Withdrawal' ? 'text-red-500' : 'text-brand-blue'}`}>
                  {r.type === 'Withdrawal' ? '-' : '+'} Rp {r.amount.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
