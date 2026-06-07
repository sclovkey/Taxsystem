import React from 'react';
import { TrendingUp, Package, CreditCard, ArrowRight, Zap, BarChart3, Truck, Calculator } from 'lucide-react';
import { Transaction, StockOut } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
  stockOuts: StockOut[];
}

export default function Workspace({ transactions, setActiveTab, stockOuts }: DashboardProps) {
  const income = transactions
    .filter(t => t.type === 'Income' || t.category === 'Penjualan')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const hpp = transactions.reduce((acc, t) => {
    if (t.relatedType === 'stockOut' && t.relatedId) {
      const sOut = stockOuts.find(so => so.id === t.relatedId);
      return acc + (sOut ? sOut.cogs : 0);
    }
    if (t.category === 'Pembelian' && t.relatedType !== 'stockBatch') {
      return acc + t.amount;
    }
    return acc;
  }, 0);
    
  const operatingExpenses = transactions
    .filter(t => t.category === 'Beban')
    .reduce((acc, t) => acc + t.amount, 0);

  const profit = income - hpp - operatingExpenses;
  const taxAmount = profit > 0 ? profit * 0.005 : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Bisnis</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan performa usaha Anda.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Penjualan', value: income, trend: '', color: 'brand-blue', icon: <TrendingUp size={16} /> },
          { label: 'Margin', value: income > 0 ? ((profit / income) * 100).toFixed(1) + '%' : '0%', trend: '', color: 'brand-blue', icon: <Zap size={16} /> },
          { label: 'Laba Bersih', value: 'Rp ' + profit.toLocaleString('id-ID'), trend: '', color: 'emerald', icon: <BarChart3 size={16} /> },
          { label: 'Pajak (0.5%)', value: 'Rp ' + Math.round(taxAmount).toLocaleString('id-ID'), trend: 'PPh Final', color: 'brand-yellow-dark', icon: <Calculator size={16} /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 bg-slate-50 ${stat.color === 'brand-yellow-dark' ? 'text-brand-yellow-dark' : 'text-brand-blue'} rounded-lg`}>{stat.icon}</div>
              {stat.trend && <span className={`${stat.color === 'brand-yellow-dark' ? 'text-brand-yellow-dark' : 'text-emerald-500'} text-[10px] uppercase font-black`}>{stat.trend}</span>}
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {typeof stat.value === 'number' ? `Rp ${stat.value.toLocaleString('id-ID')}` : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Tindakan Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setActiveTab('transactions')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><CreditCard size={20} className="text-brand-blue" /></div>
              <span className="text-xs font-bold text-slate-700">Input Transaksi</span>
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><Truck size={20} className="text-brand-blue" /></div>
              <span className="text-xs font-bold text-slate-700">Daftar Supplier</span>
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><Package size={20} className="text-brand-blue" /></div>
              <span className="text-xs font-bold text-slate-700">Stok Barang</span>
            </button>
            <button 
              onClick={() => setActiveTab('tax')}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 group border border-slate-100"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform"><Calculator size={20} className="text-brand-blue" /></div>
              <span className="text-xs font-bold text-slate-700">Pajak Bisnis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
