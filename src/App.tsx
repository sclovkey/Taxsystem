/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import Transactions from './components/Transactions';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Assets from './components/Assets';
import BalanceSheet from './components/BalanceSheet';
import EquityReport from './components/EquityReport';
import TaxReport from './components/TaxReport';
import Liabilities from './components/Liabilities';
import Suppliers from './components/Suppliers';
import Cash from './components/Cash';
import Login from './components/Login';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, Loader2 } from 'lucide-react';
import { Transaction, Asset, EquityRecord, InventoryItem, StockBatch, StockOut, Supplier, Customer, Liability } from './types';
import { auth } from './lib/firebase';
import { useFirebaseSync } from './lib/useFirebaseSync';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    transactions,
    inventoryItems,
    stockBatches,
    stockOuts,
    assets,
    suppliers,
    customers,
    liabilities,
    equityRecords,
    monthlyOpeningBalances,
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

  const onAddStock = (data: { itemId: string; quantity: number; price: number; date: string; sellingPrice?: number; existingId?: string }) => {
    if (!data.itemId) {
      console.error("onAddStock called without itemId");
      return null;
    }
    const id = data.existingId || 'b' + Date.now() + Math.random().toString(36).substr(2, 5);
    const newBatch: StockBatch = {
      id,
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      remainingQuantity: data.quantity,
      pricePerUnit: data.price,
      userId: user?.uid || ''
    };

    if (data.sellingPrice !== undefined && data.sellingPrice !== null) {
      newBatch.sellingPrice = data.sellingPrice;
    }

    if (data.existingId) {
      const old = stockBatches.find(b => b.id === data.existingId);
      if (old) {
        newBatch.remainingQuantity = old.remainingQuantity + (data.quantity - old.quantity);
        if (newBatch.remainingQuantity < 0) {
          alert("Gagal merubah kuantitas: Stok di batch ini sudah terjual melebihi kuantitas baru.");
          return null;
        }
      }
    }

    upsert('stockBatches', id, newBatch);
    return id;
  };

  const onRemoveStock = (data: { itemId: string; quantity: number; date: string; sellingPrice?: number; existingId?: string }) => {
    if (!data.itemId) {
      console.error("onRemoveStock called without itemId");
      return null;
    }
    if (data.existingId) {
      const oldOut = stockOuts.find(so => so.id === data.existingId);
      if (oldOut) {
         if (oldOut.quantity !== data.quantity || oldOut.itemId !== data.itemId) {
           alert("Perubahan kuantitas penjualan lewat edit transaksi belum didukung penuh. Silakan hapus dan input ulang untuk hasil yang akurat.");
           return data.existingId;
         }
         const updateData: any = {
           ...oldOut,
           date: data.date
         };
         if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice;
         upsert('stockOuts', data.existingId, updateData);
         return data.existingId;
      }
    }

    let remainingToRemove = data.quantity;
    let totalCOGS = 0;
    
    const totalAvailable = stockBatches
      .filter(b => b.itemId === data.itemId)
      .reduce((sum, b) => sum + b.remainingQuantity, 0);

    if (totalAvailable < data.quantity) {
      alert("Stok tidak mencukupi untuk pengeluaran ini!");
      return null;
    }

    const updatedBatches = [...stockBatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const batch of updatedBatches) {
      if (remainingToRemove <= 0) break;
      if (batch.itemId !== data.itemId || batch.remainingQuantity <= 0) continue;
      
      const quantityFromThisBatch = Math.min(batch.remainingQuantity, remainingToRemove);
      batch.remainingQuantity -= quantityFromThisBatch;
      remainingToRemove -= quantityFromThisBatch;
      totalCOGS += quantityFromThisBatch * batch.pricePerUnit;
      upsert('stockBatches', batch.id, batch);
    }

    const stockOutId = 'so' + Date.now() + Math.random().toString(36).substr(2, 5);
    const stockOutData: StockOut = {
      id: stockOutId,
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      cogs: totalCOGS,
      userId: user?.uid || ''
    };
    if (data.sellingPrice !== undefined) stockOutData.sellingPrice = data.sellingPrice;
    
    upsert('stockOuts', stockOutId, stockOutData);
    return stockOutId;
  };

  const totalIncome = transactions
    .filter(t => t.type === 'Income' || t.category === 'Penjualan')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalHPP = transactions.reduce((acc, t) => {
    if (t.relatedType === 'stockOut' && t.relatedId) {
      const sOut = stockOuts.find(so => so.id === t.relatedId);
      return acc + (sOut ? sOut.cogs : 0);
    }
    if (t.category === 'Pembelian' && t.relatedType !== 'stockBatch') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const totalBeban = transactions
    .filter(t => t.category === 'Beban')
    .reduce((acc, t) => acc + t.amount, 0);

  const currentProfit = totalIncome - totalHPP - totalBeban;

  const addTransaction = (t: Transaction) => upsert('transactions', t.id, t);
  const updateTransaction = (t: Transaction) => upsert('transactions', t.id, t);
  const deleteTransaction = (id: string) => {
    const t = transactions.find(item => item.id === id);
    if (t?.relatedId && t.relatedType) {
      if (t.relatedType === 'stockBatch') {
        // If it's a purchase, check if any of it was consumed
        const batch = stockBatches.find(b => b.id === t.relatedId);
        if (batch && batch.remainingQuantity < batch.quantity) {
          if (typeof window !== 'undefined' && !window.confirm("Sebagian stok ini sudah terjual/keluar. Menghapus transaksi ini akan menyebabkan ketidaksesuaian stok. Lanjutkan?")) {
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
  const deleteSupplier = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm("Hapus data supplier ini?")) return;
    remove('suppliers', id);
  };
  const addCustomer = (c: Customer) => upsert('customers', c.id, c);
  const addEquityRecord = (r: EquityRecord) => upsert('equityRecords', r.id, r);
  const deleteEquityRecord = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm("Hapus catatan perubahan modal ini?")) return;
    remove('equityRecords', id);
  };
  const addInventoryItem = (item: InventoryItem) => {
    // Check for duplicate name before adding (using trim and case-insensitive check)
    const duplicate = inventoryItems.find(i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    if (duplicate) {
      console.warn("Duplicate item name detected:", item.name);
      return duplicate.id; 
    }
    upsert('inventoryItems', item.id, item);
    return item.id;
  };
  const updateInventoryItem = (item: InventoryItem) => upsert('inventoryItems', item.id, item);
  const deleteInventoryItem = (id: string) => {
    const hasData = stockBatches.some(b => b.itemId === id) || stockOuts.some(so => so.itemId === id);
    if (hasData) {
      if (typeof window !== 'undefined' && !window.confirm("Barang ini memiliki riwayat stok atau transaksi. Menghapus barang akan menghapus semua data terkait. Lanjutkan?")) {
        return;
      }
      // Clean up related data
      stockBatches.filter(b => b.itemId === id).forEach(b => remove('stockBatches', b.id));
      stockOuts.filter(so => so.itemId === id).forEach(so => remove('stockOuts', so.id));
    }
    remove('inventoryItems', id);
  };

  // Logic to merge duplicate items if any was created accidentally
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (inventoryItems.length > 1) {
      const nameMap = new Map<string, string>(); // name.toLowerCase -> firstId
      const toMerge: { fromId: string, toId: string }[] = [];

      inventoryItems.forEach(item => {
        const lowerName = item.name.toLowerCase().trim();
        if (nameMap.has(lowerName)) {
          const firstId = nameMap.get(lowerName)!;
          if (!movingIds.has(item.id)) {
            toMerge.push({ fromId: item.id, toId: firstId });
          }
        } else {
          nameMap.set(lowerName, item.id);
        }
      });

      if (toMerge.length > 0) {
        console.log("Merging duplicate items:", toMerge);
        const newMoving = new Set(movingIds);
        
        toMerge.forEach(({ fromId, toId }) => {
          newMoving.add(fromId);
          
          // Move batches
          stockBatches.filter(b => b.itemId === fromId).forEach(b => {
             upsert('stockBatches', b.id, { ...b, itemId: toId });
          });
          // Move stockouts
          stockOuts.filter(so => so.itemId === fromId).forEach(so => {
             upsert('stockOuts', so.id, { ...so, itemId: toId });
          });
          // Move transaction items
          transactions.filter(t => t.items?.some(i => i.itemId === fromId)).forEach(t => {
            const newItems = t.items?.map(i => i.itemId === fromId ? { ...i, itemId: toId } : i);
            upsert('transactions', t.id, { ...t, items: newItems });
          });
          // Delete duplicate record
          remove('inventoryItems', fromId);
        });
        
        setMovingIds(newMoving);
      }
    }
  }, [inventoryItems, stockBatches, stockOuts, transactions]);
  
  const updateStockEntry = (id: string, type: 'IN' | 'OUT', data: { quantity: number; price: number; sellingPrice?: number; date: string }) => {
    if (type === 'IN') {
      const batch = stockBatches.find(b => b.id === id);
      if (!batch) return;
      
      const diff = data.quantity - batch.quantity;
      const newRemaining = batch.remainingQuantity + diff;
      
      if (newRemaining < 0) {
        alert("Gagal merubah kuantitas: Stok sudah terjual melebihi kuantitas baru.");
        return;
      }

      const updatedBatch: StockBatch = {
        ...batch,
        quantity: data.quantity,
        remainingQuantity: newRemaining,
        pricePerUnit: data.price,
        sellingPrice: data.sellingPrice,
        date: data.date
      };
      
      upsert('stockBatches', id, updatedBatch);
      
      // Update linked transaction
      const linkedT = transactions.find(t => t.relatedId === id && t.relatedType === 'stockBatch');
      if (linkedT) {
        upsert('transactions', linkedT.id, {
          ...linkedT,
          amount: data.quantity * data.price,
          date: data.date
        });
      }
    } else {
      const sOut = stockOuts.find(so => so.id === id);
      if (!sOut) return;

      if (data.quantity !== sOut.quantity) {
        alert("Merubah kuantitas penjualan lewat inventory belum didukung. Silakan hapus dan input ulang lewat transaksi.");
        return;
      }

      const updatedOut: StockOut = {
        ...sOut,
        sellingPrice: data.sellingPrice,
        date: data.date
      };
      
      upsert('stockOuts', id, updatedOut);

      // Update linked transaction
      const linkedT = transactions.find(t => t.relatedId === id && t.relatedType === 'stockOut');
      if (linkedT) {
        // If sellingPrice is provided, it updates the transaction amount
        const newAmount = data.sellingPrice ? data.quantity * data.sellingPrice : linkedT.amount;
        upsert('transactions', linkedT.id, {
          ...linkedT,
          amount: newAmount,
          date: data.date
        });
      }
    }
  };

  const deleteStockEntry = (id: string, type: 'IN' | 'OUT') => {
    if (typeof window !== 'undefined' && !window.confirm("Hapus catatan histori stok ini? Transaksi keuangan yang terkait juga akan dihapus.")) return;

    if (type === 'IN') {
      const batch = stockBatches.find(b => b.id === id);
      if (batch && batch.remainingQuantity < batch.quantity) {
        if (typeof window !== 'undefined' && !window.confirm("Sebagian stok ini sudah digunakan/terjual. Menghapus ini akan membuat stok minus atau tidak valid. Lanjutkan?")) return;
      }
      // Find and delete linked transaction
      const linkedRecord = transactions.find(t => t.relatedId === id && t.relatedType === 'stockBatch');
      if (linkedRecord) remove('transactions', linkedRecord.id);
      remove('stockBatches', id);
    } else {
      const sOut = stockOuts.find(so => so.id === id);
      if (sOut) {
        // Restore stock logic (inverse FIFO)
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
        // Find and delete linked transaction
        const linkedRecord = transactions.find(t => t.relatedId === id && t.relatedType === 'stockOut');
        if (linkedRecord) remove('transactions', linkedRecord.id);
        remove('stockOuts', id);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Workspace transactions={transactions} setActiveTab={setActiveTab} stockOuts={stockOuts} />;
      case 'transactions':
        return <Transactions 
          transactions={transactions} 
          items={inventoryItems}
          batches={stockBatches}
          stockOuts={stockOuts}
          addTransaction={addTransaction} 
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
          onAddStock={onAddStock}
          onRemoveStock={onRemoveStock}
          addInventoryItem={addInventoryItem}
        />;
      case 'cash':
        return <Cash 
          transactions={transactions} 
          monthlyOpeningBalances={monthlyOpeningBalances}
          onSaveOpeningBalance={(month, amount) => {
            const id = `ob_${month}`;
            upsert('monthlyOpeningBalances', id, { id, month, amount });
          }}
        />;
      case 'inventory':
        return <Inventory 
          items={inventoryItems} 
          batches={stockBatches} 
          stockOuts={stockOuts} 
          transactions={transactions}
          onAddStock={onAddStock} 
          onRemoveStock={onRemoveStock} 
          addInventoryItem={addInventoryItem}
          updateInventoryItem={updateInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          deleteStockEntry={deleteStockEntry}
          updateStockEntry={updateStockEntry}
        />;
      case 'assets':
        return <Assets assets={assets} addAsset={addAsset} />;
      case 'liabilities':
        return <Liabilities 
          liabilities={liabilities} 
          customers={customers} 
          addLiability={(l) => upsert('liabilities', l.id, l)}
          updateLiability={(l) => upsert('liabilities', l.id, l)}
          addCustomer={addCustomer}
        />;
      case 'suppliers':
        return <Suppliers suppliers={suppliers} addSupplier={addSupplier} deleteSupplier={deleteSupplier} />;
      case 'reports':
        return <Reports transactions={transactions} stockOuts={stockOuts} />;
      case 'balance-sheet':
        return <BalanceSheet 
          transactions={transactions} 
          assets={assets} 
          equityRecords={equityRecords} 
          liabilities={liabilities}
          monthlyOpeningBalances={monthlyOpeningBalances}
          stockBatches={stockBatches}
        />;
      case 'equity':
        return <EquityReport 
          equityRecords={equityRecords} 
          addEquityRecord={addEquityRecord} 
          deleteEquityRecord={deleteEquityRecord}
          currentProfit={currentProfit} 
        />;
      case 'tax':
        return <TaxReport transactions={transactions} stockOuts={stockOuts} />;
      default:
        return <Workspace transactions={transactions} setActiveTab={setActiveTab} stockOuts={stockOuts} />;
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
      {/* Menu Button - Visible when sidebar is closed */}
      <motion.button 
        initial={false}
        animate={{ 
          left: isSidebarOpen ? -100 : 16,
          opacity: isSidebarOpen ? 0 : 1
        }}
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 z-30 p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-brand-blue hover:border-brand-blue transition-colors group"
      >
        <Menu size={24} className="group-hover:scale-110 transition-transform" />
      </motion.button>

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
      
      <motion.main 
        initial={false}
        animate={{ 
          marginLeft: (isDesktop && isSidebarOpen) ? 256 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 h-screen overflow-y-auto bg-slate-50/50 p-4 md:p-8 pt-16 lg:pt-8"
      >
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
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.main>
    </div>
  );
}
