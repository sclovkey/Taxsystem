import React, { useState } from 'react';
import { FileText, Calculator, TrendingUp, Info, Calendar } from 'lucide-react';
import { Transaction, StockOut } from '../types';

interface TaxReportProps {
  transactions: Transaction[];
  stockOuts: StockOut[];
}

export default function TaxReport({ transactions, stockOuts }: TaxReportProps) {
  const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return months[0] || new Date().toISOString().slice(0, 7);
  });

  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  // Income (Revenue)
  const incomeTotal = filteredTransactions
    .filter(t => (t.type === 'Income' && t.category !== 'Beban' && t.category !== 'Pembelian' && t.category !== 'Aset') || t.category === 'Penjualan')
    .reduce((acc, t) => acc + t.amount, 0);

  // HPP (Cost of Goods Sold)
  const hppTotal = filteredTransactions.reduce((acc, t) => {
    if (t.relatedType === 'stockOut' && t.relatedId) {
      const sOut = stockOuts.find(so => so.id === t.relatedId);
      return acc + (sOut ? sOut.cogs : 0);
    }
    if (t.category === 'Pembelian' && t.relatedType !== 'stockBatch') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  // Operating Expenses
  const otherExpensesTotal = filteredTransactions
    .filter(t => t.category === 'Beban')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = incomeTotal - hppTotal - otherExpensesTotal;
  const taxRate = 0.005; // 0.5%
  const taxAmount = netProfit > 0 ? netProfit * taxRate : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Perhitungan Pajak</h1>
          <p className="text-slate-500 text-sm mt-1">Estimasi PPh Final berdasarkan performa keuangan.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-4 items-center bg-white px-4 py-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar size={18} />
            <span className="text-sm font-semibold">Periode:</span>
          </div>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {months.map(m => (
              <option key={m} value={m}>{new Date(m + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calculator size={20} />
            </div>
            <h2 className="font-bold text-slate-800">Ringkasan Laba Bersih</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Pendapatan</span>
              <span className="font-bold text-slate-900">Rp {incomeTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total HPP</span>
              <span className="font-bold text-slate-900 text-red-500">-(Rp {hppTotal.toLocaleString('id-ID')})</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100">
              <span className="text-slate-500">Beban Operasional</span>
              <span className="font-bold text-slate-900 text-red-500">-(Rp {otherExpensesTotal.toLocaleString('id-ID')})</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-slate-700 italic">Laba Bersih Sebelum Pajak</span>
              <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 border border-indigo-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/20 text-white rounded-xl">
              <FileText size={20} />
            </div>
            <h2 className="font-bold">Estimasi PPh Final</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-indigo-100 text-xs uppercase font-bold tracking-widest mb-1">Tarif Pajak (PPh Final)</p>
              <p className="text-2xl font-bold">0,5%</p>
            </div>
            
            <div className="pt-6 border-t border-indigo-500/50">
              <p className="text-indigo-100 text-xs uppercase font-bold tracking-widest mb-2">Total Pajak Terhutang</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">Rp {Math.round(taxAmount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl flex gap-3 text-sm italic">
              <Info size={24} className="shrink-0 text-indigo-200" />
              <p>Perhitungan ini berdasarkan instruksi: 0,5% dari Laba Bersih. Pastikan untuk memverifikasi dengan peraturan perpajakan terbaru (PP No. 23/2018).</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-indigo-600" size={20} />
          <h2 className="font-bold text-slate-800">Catatan Penting</h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            Pajak dihitung per periode bulanan berdasarkan data transaksi yang masuk.
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            Jika hasil Laba Bersih negatif (rugi), maka estimasi pajak adalah Rp 0.
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            Laporan ini hanya merupakan simulasi internal untuk membantu perencanaan keuangan Anda.
          </li>
        </ul>
      </div>
    </div>
  );
}
