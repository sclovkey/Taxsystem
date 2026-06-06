import React from 'react';
import { Target, Shield, Briefcase, Package } from 'lucide-react';
import { Transaction, Asset, EquityRecord, Liability, MonthlyOpeningBalance, StockBatch } from '../types';

interface BalanceSheetProps {
  transactions: Transaction[];
  assets: Asset[];
  equityRecords: EquityRecord[];
  liabilities: Liability[];
  monthlyOpeningBalances: MonthlyOpeningBalance[];
  stockBatches: StockBatch[];
}

export default function BalanceSheet({ 
  transactions, 
  assets, 
  equityRecords, 
  liabilities, 
  monthlyOpeningBalances,
  stockBatches
}: BalanceSheetProps) {
  // 1. Assets Calculation - Current Month Cash
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentOpeningBalance = monthlyOpeningBalances.find(b => b.month === currentMonth)?.amount || 0;
  
  const monthIncoming = transactions
    .filter(t => t.date.startsWith(currentMonth) && t.type === 'Income' && t.category !== 'Beban' && t.category !== 'Pembelian' && t.category !== 'Aset')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthOutgoing = transactions
    .filter(t => t.date.startsWith(currentMonth) && (t.type === 'Expense' || t.category === 'Beban' || t.category === 'Pembelian' || t.category === 'Aset'))
    .reduce((acc, t) => acc + t.amount, 0);

  const cash = currentOpeningBalance + monthIncoming - monthOutgoing;

  // 2. Inventory Value (Asset)
  const inventoryValue = stockBatches.reduce((acc, batch) => acc + (batch.remainingQuantity * batch.pricePerUnit), 0);

  const calculateDepreciationAccumulated = (asset: Asset) => {
    const annualDepreciation = (asset.cost - asset.salvageValue) / asset.usefulLifePoints;
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    const yearsOwned = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.min(asset.cost - asset.salvageValue, annualDepreciation * yearsOwned);
  };

  const assetTransactionsTotal = transactions
    .filter(t => t.category === 'Aset')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCostAssets = assets.reduce((acc, a) => acc + a.cost, 0) + assetTransactionsTotal;
  const totalAccumulatedDepreciation = assets.reduce((acc, a) => acc + calculateDepreciationAccumulated(a), 0);
  const netFixedAssets = totalCostAssets - totalAccumulatedDepreciation;
  
  const totalAssets = cash + inventoryValue + netFixedAssets;

  // 3. Liabilities
  const totalLiabilities = liabilities
    .filter(l => l.status !== 'Paid')
    .reduce((acc, l) => acc + l.amount, 0);

  // 4. Equity Calculation
  // Standard accounting: Assets = Liabilities + Equity
  // Equity = Assets - Liabilities
  const totalEquities = totalAssets - totalLiabilities;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Neraca (Posisi Keuangan)</h1>
        <p className="text-slate-500 text-sm mt-1">Posisi aset, liabilitas, dan ekuitas per hari ini.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets Side */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Aset (Aktiva)</h2>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Aset Lancar</p>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-600">Kas & Setara Kas</span>
                <span className="font-bold text-slate-900">Rp {cash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-600">Persediaan Barang</span>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Rp {inventoryValue.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Berdasarkan Nilai Beli</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Aset Tetap</p>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-600">Aset Tetap (Biaya Perolehan)</span>
                <span className="font-bold text-slate-900">Rp {totalCostAssets.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-500 italic">Akumulasi Penyusutan</span>
                <span className="font-bold text-red-500">- Rp {totalAccumulatedDepreciation.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 border-t font-bold text-indigo-600 px-1">
              <span className="uppercase text-xs tracking-wider">Total Aset</span>
              <span className="text-2xl">Rp {totalAssets.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Side */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Kewajiban (Pasiva)</h2>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-600">Utang Usaha (Belum Terbayar)</span>
                <span className="font-bold text-slate-900">Rp {totalLiabilities.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-6 font-bold text-slate-900 border-t px-1">
                <span className="uppercase text-xs tracking-wider">Total Kewajiban</span>
                <span className="text-xl">Rp {totalLiabilities.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Ekuitas (Modal)</h2>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center py-3 border-b border-slate-50 px-1">
                <span className="text-sm font-medium text-slate-600">Modal Disetor & Saldo Laba</span>
                <span className="font-bold text-slate-900">Rp {totalEquities.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-6 font-bold text-indigo-600 border-t px-1">
                <span className="uppercase text-xs tracking-wider">Total Ekuitas</span>
                <span className="text-2xl">Rp {totalEquities.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-center font-bold text-sm shadow-sm transition-all ${Math.abs(totalAssets - (totalLiabilities + totalEquities)) < 1 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {Math.abs(totalAssets - (totalLiabilities + totalEquities)) < 1 ? '✅ Neraca Seimbang (Balanced)' : '❌ Neraca Tidak Seimbang'}
          </div>
        </div>
      </div>
    </div>
  );
}
