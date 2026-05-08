import React from 'react';
import { TrendingUp, Package, CreditCard, ArrowRight, Zap, BarChart3, Truck } from 'lucide-react';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
}

export default function Workspace({ transactions, setActiveTab }: DashboardProps) {
  const income = transactions
    .filter(t => t.type === 'Income' || t.category === 'Penjualan')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const hpp = transactions
    .filter(t => t.category === 'Pembelian')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const operatingExpenses = transactions
    .filter(t => t.category === 'Beban')
    .reduce((acc, t) => acc + t.amount, 0);

  const profit = income - hpp - operatingExpenses;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Bisnis</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan performa usaha Anda.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pemasukan', value: income, trend: '', color: 'indigo', icon: <TrendingUp size={16} /> },
          { label: 'Margin', value: income > 0 ? ((profit / income) * 100).toFixed(1) + '%' : '0%', trend: '', color: 'blue', icon: <Zap size={16} /> },
          { label: 'Laba Bersih', value: 'Rp ' + profit.toLocaleString('id-ID'), trend: '', color: 'emerald', icon: <BarChart3 size={16} /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 text-indigo-600 rounded-lg">{stat.icon}</div>
              {stat.trend && <span className="text-green-500 text-xs font-bold">{stat.trend}</span>}
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {typeof stat.value === 'number' ? `Rp ${stat.value.toLocaleString('id-ID')}` : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Tindakan Cepat</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('transactions')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><CreditCard size={20} className="text-indigo-600" /></div>
              <span className="text-xs font-bold text-slate-700">Input Transaksi</span>
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><Truck size={20} className="text-indigo-600" /></div>
              <span className="text-xs font-bold text-slate-700">Daftar Supplier</span>
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><Package size={20} className="text-indigo-600" /></div>
              <span className="text-xs font-bold text-slate-700">Stok Barang</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><TrendingUp size={20} className="text-indigo-600" /></div>
              <span className="text-xs font-bold text-slate-700">Laporan</span>
            </button>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab('assistant')}>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Optimasi Bisnis</h2>
              <p className="text-indigo-100 text-sm leading-relaxed max-w-[280px]">
                Konsultasi strategi harga dan operasional dengan asisten AI terintegrasi.
              </p>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs bg-white/20 w-fit px-4 py-2 rounded-full mt-6">
              Mulai Sesi Konsultasi <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
