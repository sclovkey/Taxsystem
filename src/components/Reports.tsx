import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { Transaction, StockOut } from '../types';

interface ReportsProps {
  transactions: Transaction[];
  stockOuts: StockOut[];
}

export default function Reports({ transactions, stockOuts }: ReportsProps) {
  const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return months[0] || new Date().toISOString().slice(0, 7);
  });

  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  // Income (Revenue)
  const incomeTransactions = filteredTransactions.filter(t => (t.type === 'Income' && t.category !== 'Beban' && t.category !== 'Pembelian' && t.category !== 'Aset') || t.category === 'Penjualan');
  const incomeTotal = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);

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
  const otherExpenses = filteredTransactions.filter(t => t.category === 'Beban');
  const otherExpensesTotal = otherExpenses.reduce((acc, t) => acc + t.amount, 0);

  const grossProfit = incomeTotal - hppTotal;
  const netProfit = incomeTotal - hppTotal - otherExpensesTotal;

  // Group by category for display
  const getCategoryTotal = (trans: Transaction[]) => {
    const cats = Array.from(new Set(trans.map(t => t.category)));
    return cats.map(cat => ({
      name: cat,
      total: trans.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0)
    })).sort((a, b) => b.total - a.total);
  };

  const incomeCategories = getCategoryTotal(incomeTransactions);
  const expenseCategories = getCategoryTotal(otherExpenses);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Laba Rugi</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan performa keuangan usaha Anda.</p>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Revenue Section */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Pendapatan Bersih</h2>
            <div className="space-y-1">
              {incomeCategories.map((cat, i) => (
                <div key={i} className="flex justify-between items-center py-3 px-1 border-b border-slate-50">
                  <span className="text-slate-700 font-medium">{cat.name}</span>
                  <span className="text-slate-900 font-bold">Rp {cat.total.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-indigo-600">
                <span className="text-xs font-bold uppercase">Total Pendapatan</span>
                <span className="text-xl font-bold">Rp {incomeTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </section>

          {/* HPP Section */}
          <section className="bg-slate-50/50 -mx-8 px-8 py-6 border-y border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Harga Pokok Penjualan (HPP)</h2>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 px-1 text-sm text-slate-700 font-medium">
                <span>Total Pembelian (HPP)</span>
                <span className="font-bold">Rp {hppTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2 text-indigo-700">
                <span className="text-sm font-bold uppercase tracking-tight">LABA KOTOR</span>
                <span className="text-xl font-bold">Rp {grossProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </section>

          {/* Expense Section */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Beban Operasional</h2>
            <div className="space-y-1">
              {expenseCategories.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-1">Tidak ada beban operasional lain untuk periode ini.</p>
              ) : (
                expenseCategories.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center py-3 px-1 border-b border-slate-50">
                    <span className="text-slate-700 font-medium">{cat.name}</span>
                    <span className="text-slate-900 font-bold">Rp {cat.total.toLocaleString('id-ID')}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center pt-4 text-red-600">
                <span className="text-xs font-bold uppercase">Total Beban Operasional</span>
                <span className="text-xl font-bold">Rp {otherExpensesTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </section>

          {/* Final Profit Section */}
          <div className="pt-8 border-t-2 border-slate-100 flex justify-between items-center bg-indigo-600 text-white -mx-8 px-8 pb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight">LABA (RUGI) BERSIH</h3>
              <p className="text-xs text-indigo-100 italic">Keuntungan bersih setelah dikurangi HPP dan beban operasional.</p>
            </div>
            <div className="text-3xl font-bold">
              Rp {netProfit.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
