import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, Search, Plus, Pencil, Save, X } from 'lucide-react';
import { Transaction, MonthlyOpeningBalance } from '../types';

interface CashProps {
  transactions: Transaction[];
  monthlyOpeningBalances: MonthlyOpeningBalance[];
  onSaveOpeningBalance: (month: string, amount: number) => void;
}

export default function Cash({ transactions, monthlyOpeningBalances, onSaveOpeningBalance }: CashProps) {
  const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  if (!months.includes(currentMonthStr)) {
    months.unshift(currentMonthStr);
  }

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return months[0] || currentMonthStr;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState('');

  // Get opening balance for selected month
  const currentOpeningBalance = monthlyOpeningBalances.find(b => b.month === selectedMonth)?.amount || 0;

  // Filter transactions for the selected month and search term
  const filteredTransactions = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthIncoming = transactions
    .filter(t => t.date.startsWith(selectedMonth) && t.type === 'Income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthOutgoing = transactions
    .filter(t => t.date.startsWith(selectedMonth) && t.type === 'Expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthEndingBalance = currentOpeningBalance + monthIncoming - monthOutgoing;

  // Calculate Total Net Balance (Total Transactions + First Opening Balance?)
  // For simplicity, let's say the total balance is the ending balance of the LATEST month that has an opening balance or transactions.
  // Actually, let's just use the current month's ending balance as the "Current Cash Position"
  const totalBalance = monthEndingBalance;

  const handleStartEditOpening = () => {
    setOpeningInput(currentOpeningBalance.toString());
    setIsEditingOpening(true);
  };

  const handleSaveOpening = () => {
    onSaveOpeningBalance(selectedMonth, parseFloat(openingInput) || 0);
    setIsEditingOpening(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buku Kas</h1>
          <p className="text-slate-500 text-sm">Monitor arus kas masuk dan keluar secara real-time.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-end">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Posisi Kas (Akhir {new Date(selectedMonth + '-01').toLocaleString('id-ID', { month: 'short' })})</p>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-brand-blue' : 'text-red-600'}`}>
            Rp {totalBalance.toLocaleString('id-ID')}
          </p>
        </div>
      </header>

      {/* Opening Balance Card & Period Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode Laporan</p>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 bg-transparent border-none p-0 text-lg font-bold text-slate-800 outline-none focus:ring-0 cursor-pointer"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{new Date(m + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-end justify-center">
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 w-full md:w-auto min-w-[300px]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Awal Bulan</p>
                {!isEditingOpening ? (
                  <button 
                    onClick={handleStartEditOpening}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-brand-blue transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={handleSaveOpening} className="p-1.5 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-all">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setIsEditingOpening(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {isEditingOpening ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">Rp</span>
                  <input 
                    type="number"
                    value={openingInput}
                    onChange={(e) => setOpeningInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-lg font-bold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/10"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-slate-700">
                  Rp {currentOpeningBalance.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Kas Masuk</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">Rp {monthIncoming.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ArrowDownLeft size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Kas Keluar</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">Rp {monthOutgoing.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-brand-blue p-6 rounded-2xl shadow-sm shadow-brand-blue/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-white/80">
            <Wallet size={20} />
            <p className="text-xs font-bold uppercase text-white/90">Saldo Akhir Bulan</p>
          </div>
          <p className="text-2xl font-bold text-white">Rp {monthEndingBalance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Cari deskripsi transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-transparent border-none text-sm focus:ring-0 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-right">Debit (Masuk)</th>
                <th className="px-6 py-4 text-right">Kredit (Keluar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">Bulan ini belum memiliki catatan mutasi kas.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{t.date}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.type === 'Income' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-green-600">Rp {t.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.type === 'Expense' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-red-600">Rp {t.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ) : '-'}
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

