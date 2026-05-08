/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import Assistant from './components/Assistant';
import Transactions from './components/Transactions';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Assets from './components/Assets';
import BalanceSheet from './components/BalanceSheet';
import EquityReport from './components/EquityReport';
import Liabilities from './components/Liabilities';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, Loader2 } from 'lucide-react';
import { Transaction, Asset, EquityRecord, InventoryItem, StockBatch, StockOut, Supplier, Liability } from './types';
import { auth } from './lib/firebase';
import { useFirebaseSync } from './lib/useFirebaseSync';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    transactions,
    inventoryItems,
    stockBatches,
    stockOuts,
    assets,
    suppliers,
    liabilities,
    equityRecords,
    loading: dataLoading,
    upsert,
    remove
  } = useFirebaseSync(user);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const onAddStock = (data: { itemId: string; quantity: number; price: number; date: string }) => {
    const id = 'b' + Math.random().toString(36).substr(2, 5);
    const newBatch: StockBatch = {
      id,
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      remainingQuantity: data.quantity,
      pricePerUnit: data.price
    };
    upsert('stockBatches', id, newBatch);
    return id;
  };

  const onRemoveStock = (data: { itemId: string; quantity: number; date: string }) => {
    let remainingToRemove = data.quantity;
    let totalCOGS = 0;
    
    // Check if enough stock exists first
    const totalAvailable = stockBatches
      .filter(b => b.itemId === data.itemId)
      .reduce((sum, b) => sum + b.remainingQuantity, 0);

    if (totalAvailable < data.quantity) {
      alert("Stok tidak mencukupi untuk pengeluaran ini!");
      return null;
    }

    // Sort batches by date for FIFO
    const updatedBatches = [...stockBatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const batch of updatedBatches) {
      if (remainingToRemove <= 0) break;
      if (batch.itemId !== data.itemId || batch.remainingQuantity <= 0) continue;
      
      const quantityFromThisBatch = Math.min(batch.remainingQuantity, remainingToRemove);
      
      batch.remainingQuantity -= quantityFromThisBatch;
      remainingToRemove -= quantityFromThisBatch;
      totalCOGS += quantityFromThisBatch * batch.pricePerUnit;
      
      // Update each batch in Firebase
      upsert('stockBatches', batch.id, batch);
    }

    const stockOutId = 'so' + Math.random().toString(36).substr(2, 5);
    upsert('stockOuts', stockOutId, {
      id: stockOutId,
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      cogs: totalCOGS
    });
    return stockOutId;
  };

  const currentProfit = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0)
                        - transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);

  const addTransaction = (t: Transaction) => upsert('transactions', t.id, t);
  const updateTransaction = (t: Transaction) => upsert('transactions', t.id, t);
  const deleteTransaction = (id: string) => {
    const t = transactions.find(item => item.id === id);
    if (t?.relatedId && t.relatedType) {
      if (t.relatedType === 'stockBatch') {
        // If it's a purchase, check if any of it was consumed
        const batch = stockBatches.find(b => b.id === t.relatedId);
        if (batch && batch.remainingQuantity < batch.quantity) {
          if (!confirm("Sebagian stok ini sudah terjual/keluar. Menghapus transaksi ini akan menyebabkan ketidaksesuaian stok. Lanjutkan?")) {
            return;
          }
        }
        remove('stockBatches', t.relatedId);
      } else if (t.relatedType === 'stockOut') {
        // If it's a sale, we should ideally restore the stock
        const sOut = stockOuts.find(so => so.id === t.relatedId);
        if (sOut) {
          // Restore inventory (simplified undo FIFO)
          // We look for batches of the same item and add back quantity to the latest ones first (inverse FIFO)
          let toRestore = sOut.quantity;
          const targetBatches = [...stockBatches]
            .filter(b => b.itemId === sOut.itemId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          for (const batch of targetBatches) {
            if (toRestore <= 0) break;
            const canAdd = batch.quantity - batch.remainingQuantity;
            const toAdd = Math.min(canAdd, toRestore);
            if (toAdd > 0) {
              batch.remainingQuantity += toAdd;
              toRestore -= toAdd;
              upsert('stockBatches', batch.id, batch);
            }
          }
          remove('stockOuts', t.relatedId);
        }
      }
    }
    remove('transactions', id);
  };
  
  const addAsset = (a: Asset) => upsert('assets', a.id, a);
  const addSupplier = (s: Supplier) => upsert('suppliers', s.id, s);
  const addEquityRecord = (r: EquityRecord) => upsert('equityRecords', r.id, r);
  const addInventoryItem = (item: InventoryItem) => upsert('inventoryItems', item.id, item);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Workspace transactions={transactions} setActiveTab={setActiveTab} />;
      case 'transactions':
        return <Transactions 
          transactions={transactions} 
          items={inventoryItems}
          addTransaction={addTransaction} 
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
          onAddStock={onAddStock}
          onRemoveStock={onRemoveStock}
          addInventoryItem={addInventoryItem}
        />;
      case 'inventory':
        return <Inventory 
          items={inventoryItems} 
          batches={stockBatches} 
          stockOuts={stockOuts} 
          onAddStock={onAddStock} 
          onRemoveStock={onRemoveStock} 
          addInventoryItem={addInventoryItem}
        />;
      case 'assets':
        return <Assets assets={assets} addAsset={addAsset} />;
      case 'liabilities':
        return <Liabilities 
          liabilities={liabilities} 
          suppliers={suppliers} 
          addLiability={(l) => upsert('liabilities', l.id, l)}
          updateLiability={(l) => upsert('liabilities', l.id, l)}
        />;
      case 'suppliers':
        return <Suppliers suppliers={suppliers} addSupplier={addSupplier} />;
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'balance-sheet':
        return <BalanceSheet 
          transactions={transactions} 
          assets={assets} 
          equityRecords={equityRecords} 
          liabilities={liabilities}
        />;
      case 'equity':
        return <EquityReport equityRecords={equityRecords} addEquityRecord={addEquityRecord} currentProfit={currentProfit} />;
      case 'assistant':
        return <Assistant />;
      default:
        return <Workspace transactions={transactions} setActiveTab={setActiveTab} />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-indigo-600"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar with mobile drawer support */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false); // Close on mobile after selection
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50 p-4 md:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto h-full px-2 md:px-0">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="animate-spin text-indigo-300" size={32} />
              <p className="text-slate-400 text-sm font-medium">Memuat data Anda...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
