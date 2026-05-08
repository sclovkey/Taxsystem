/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Transaction, Asset, EquityRecord, InventoryItem, StockBatch, StockOut, Supplier, Liability } from './types';

export default function App() {
  const generateSeededTransactions = () => {
    const seeded: Transaction[] = [];
    const inventoryItemsList = [
      { id: 'i1', name: 'Biji Kopi Arabika', unit: 'kg', price: 200000 },
      { id: 'i2', name: 'Susu Fresh Milk', unit: 'Liter', price: 20000 },
      { id: 'i3', name: 'Gula Aren', unit: 'kg', price: 35000 },
      { id: 'i4', name: 'Cup Kopi 12oz', unit: 'pcs', price: 500 },
      { id: 'i5', name: 'Kopi Susu Gula Aren', unit: 'botol', price: 25000 },
      { id: 'i6', name: 'Kopi Hitam', unit: 'cup', price: 15000 },
    ];

    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      for (let i = 1; i <= 20; i++) {
        const type = i % 3 === 0 ? 'Expense' : 'Income';
        const day = (i % 28 + 1).toString().padStart(2, '0');
        
        let items: { itemId: string; quantity: number; price: number }[] = [];
        let description = '';
        let amount = 0;
        let category = type === 'Income' ? 'Sales' : 'Supplies';

        if (type === 'Income') {
          // Select 1-2 random finished products (i5, i6)
          const products = inventoryItemsList.slice(4);
          const numProducts = Math.floor(Math.random() * 2) + 1;
          const selected = products.sort(() => 0.5 - Math.random()).slice(0, numProducts);
          
          items = selected.map(p => {
            const qty = Math.floor(Math.random() * 10) + 1;
            return { itemId: p.id, quantity: qty, price: p.price };
          });
          
          amount = items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
          description = `Penjualan: ${items.map(it => {
            const p = inventoryItemsList.find(pi => pi.id === it.itemId);
            return `${it.quantity} ${p?.unit} ${p?.name}`;
          }).join(', ')}`;
        } else {
          // Select 1 random raw material (i1, i2, i3, i4)
          const materials = inventoryItemsList.slice(0, 4);
          const p = materials[Math.floor(Math.random() * materials.length)];
          const qty = Math.floor(Math.random() * 5) + 1;
          
          items = [{ itemId: p.id, quantity: qty, price: p.price }];
          amount = qty * p.price;
          description = `Pembelian: ${qty} ${p.unit} ${p.name}`;
          category = 'Supplies';
        }

        seeded.push({
          id: `seed-${month}-${i}`,
          date: `2026-${monthStr}-${day}`,
          description,
          amount,
          type,
          category,
          items
        });
      }
    }
    return seeded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);

  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);

  const onAddStock = (data: { itemId: string; quantity: number; price: number; date: string }) => {
    const newBatch: StockBatch = {
      id: 'b' + Math.random().toString(36).substr(2, 5),
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      remainingQuantity: data.quantity,
      pricePerUnit: data.price
    };
    setStockBatches(prev => [...prev, newBatch]);
  };

  const onRemoveStock = (data: { itemId: string; quantity: number; date: string }) => {
    let remainingToRemove = data.quantity;
    let totalCOGS = 0;
    const updatedBatches = [...stockBatches];
    
    // FIFO: Find batches for this item, sorted by date
    const itemBatchesIndices = updatedBatches
      .map((b, i) => ({ ...b, originalIndex: i }))
      .filter(b => b.itemId === data.itemId && b.remainingQuantity > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const batchInfo of itemBatchesIndices) {
      if (remainingToRemove <= 0) break;
      
      const batch = updatedBatches[batchInfo.originalIndex];
      const quantityFromThisBatch = Math.min(batch.remainingQuantity, remainingToRemove);
      
      batch.remainingQuantity -= quantityFromThisBatch;
      remainingToRemove -= quantityFromThisBatch;
      totalCOGS += quantityFromThisBatch * batch.pricePerUnit;
    }

    if (remainingToRemove > 0) {
      alert("Stok tidak mencukupi untuk pengeluaran ini!");
      return;
    }

    setStockBatches(updatedBatches);
    setStockOuts(prev => [...prev, {
      id: 'so' + Math.random().toString(36).substr(2, 5),
      itemId: data.itemId,
      date: data.date,
      quantity: data.quantity,
      cogs: totalCOGS
    }]);
  };

  const [assets, setAssets] = useState<Asset[]>([]);

  const [equityRecords, setEquityRecords] = useState<EquityRecord[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [liabilities, setLiabilities] = useState<Liability[]>([]);

  const currentProfit = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0)
                        - transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);

  const addTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev]);
  const updateTransaction = (t: Transaction) => setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const addAsset = (a: Asset) => setAssets(prev => [a, ...prev]);
  const addSupplier = (s: Supplier) => setSuppliers(prev => [s, ...prev]);
  const addEquityRecord = (r: EquityRecord) => setEquityRecords(prev => [r, ...prev]);
  const addInventoryItem = (item: InventoryItem) => setInventoryItems(prev => [...prev, item]);

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
        return <Liabilities liabilities={liabilities} suppliers={suppliers} setLiabilities={setLiabilities} />;
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
        </div>
      </main>
    </div>
  );
}

