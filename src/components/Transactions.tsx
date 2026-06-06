import React, { useState } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Package, Truck, MinusCircle, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Transaction, InventoryItem, StockBatch, StockOut } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  items: InventoryItem[];
  batches: StockBatch[];
  stockOuts: StockOut[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  onAddStock: (data: { itemId: string; quantity: number; price: number; date: string; sellingPrice?: number; existingId?: string }) => string | null;
  onRemoveStock: (data: { itemId: string; quantity: number; date: string; sellingPrice?: number; existingId?: string }) => string | null;
  addInventoryItem: (item: InventoryItem) => string;
}

export default function Transactions({ 
  transactions, 
  items, 
  batches,
  stockOuts,
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  onAddStock, 
  onRemoveStock,
  addInventoryItem
}: TransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedMonth with most recent data if not set or if current selected has no data
  React.useEffect(() => {
    if (transactions.length > 0) {
      const availableMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse();
      // If selected month has no data and there is data elsewhere, switch to latest data month
      if (!transactions.some(t => t.date.startsWith(selectedMonth)) && availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [transactions, selectedMonth]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'Expense' as const,
    category: 'Beban',
    date: new Date().toISOString().split('T')[0]
  });

  const [syncInventory, setSyncInventory] = useState(false);
  
  // Logic to handle automatic sync based on category
  React.useEffect(() => {
    if (formData.category === 'Pembelian' || formData.category === 'Penjualan') {
      setSyncInventory(true);
    }
  }, [formData.category, isAdding]); // Also check when starting an addition

  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemFormData, setNewItemFormData] = useState({ name: '', unit: '' });
  const [sessionNewItems, setSessionNewItems] = useState<InventoryItem[]>([]);
  
  // Combine items prop with newly added items in this session for immediate UI feedback
  const allItems = [...items, ...sessionNewItems];

  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: string; price: string }[]>([
    { itemId: items[0]?.id || '', quantity: '', price: '' }
  ]);

  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  // Refresh prices if items master data changes significantly
  React.useEffect(() => {
    if (selectedItems.some(i => i.itemId) && allItems.length > 0) {
      const updated = refreshPrices(formData.type, selectedItems);
      // Only update if something actually changed to avoid infinite loops
      if (JSON.stringify(updated) !== JSON.stringify(selectedItems)) {
        setSelectedItems(updated);
        calculateTotalFromItems(updated);
      }
    }
  }, [items, sessionNewItems, formData.type]);

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { itemId: items[0]?.id || '', quantity: '', price: '' }]);
  };

  const removeItemRow = (index: number) => {
    const newItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(newItems);
    calculateTotalFromItems(newItems);
  };

  const calculateTotalFromItems = (itemsList: { itemId: string; quantity: string; price: string }[]) => {
    const total = itemsList.reduce((acc, curr) => {
      const q = parseFloat(curr.quantity) || 0;
      const p = parseFloat(curr.price) || 0;
      return acc + (q * p);
    }, 0);
    
    setFormData(prev => ({ ...prev, amount: total.toString() }));
  };

  const getAvailableStock = (itemId: string) => {
    if (!itemId) return 0;
    let available = batches
      .filter(b => b.itemId === itemId)
      .reduce((sum, b) => sum + b.remainingQuantity, 0);
    
    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      if (oldTx && oldTx.items) {
        const oldCtxItem = oldTx.items.find(i => i.itemId === itemId);
        if (oldCtxItem) {
          available += oldCtxItem.quantity;
        }
      }
    }
    return available;
  };

  const calculateSuggestedPrice = (itemId: string, quantity: number, type: 'Income' | 'Expense') => {
    if (!itemId) return '';

    const item = allItems.find(i => i.id === itemId);
    if (!item) return '';

    if (type === 'Income') {
      // Suggest default selling price from inventory for Sales
      return item.sellingPrice !== undefined ? item.sellingPrice.toString() : '';
    } else {
      // Latest Purchase Price for Purchases
      const itemBatches = batches
        .filter(b => b.itemId === itemId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestBatch = itemBatches[0];
      if (latestBatch) {
        return latestBatch.pricePerUnit.toString();
      }
    }

    return '';
  };

  const refreshPrices = (type: 'Income' | 'Expense', itemList: typeof selectedItems) => {
    return itemList.map(item => {
      const suggested = calculateSuggestedPrice(item.itemId, parseFloat(item.quantity) || 0, type);
      // When switching types, we strictly use the suggestion (even if empty) 
      // because Selling Price and Purchase Price are logically different.
      return { ...item, price: suggested };
    });
  };

  const calculateHPP = (itemId: string, quantity: number) => {
    if (!itemId || quantity <= 0) return 0;

    const itemBatches = batches
      .filter(b => b.itemId === itemId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remaining = quantity;
    let totalCost = 0;
    let covered = 0;

    for (const batch of itemBatches) {
      if (remaining <= 0) break;
      if (batch.remainingQuantity <= 0) continue;

      const take = Math.min(batch.remainingQuantity, remaining);
      totalCost += take * batch.pricePerUnit;
      remaining -= take;
      covered += take;
    }

    return covered > 0 ? (totalCost / covered) : 0;
  };

  const generateDescription = (itemsList: typeof selectedItems, type: string) => {
    const activeItems = itemsList.filter(i => i.itemId && i.quantity);
    if (activeItems.length === 0) return '';

    const details = activeItems.map(ai => {
      const item = allItems.find(i => i.id === ai.itemId);
      return `${ai.quantity} ${item?.unit || ''} ${item?.name || 'Barang'}`;
    });

    const prefix = type === 'Income' ? 'Penjualan' : 'Pembelian';
    return `${prefix}: ${details.join(', ')}`;
  };

  const updateItemRow = (index: number, field: 'itemId' | 'quantity' | 'price', value: string) => {
    const newItems = [...selectedItems];
    let updatedPrice = newItems[index].price;
    
    // Auto-calculate suggested price when item changes (always) or quantity changes (if suggestion exists)
    if (field === 'itemId') {
      updatedPrice = calculateSuggestedPrice(value, parseFloat(newItems[index].quantity) || 0, formData.type);
    } else if (field === 'quantity') {
      const suggested = calculateSuggestedPrice(newItems[index].itemId, parseFloat(value) || 0, formData.type);
      if (suggested !== '') {
        updatedPrice = suggested;
      }
    }

    newItems[index] = { 
      ...newItems[index], 
      [field]: value,
      price: field === 'price' ? value : updatedPrice 
    };
    setSelectedItems(newItems);
    
    // Auto-update description if not manually edited or if it was previously auto-generated
    const currentAutoDesc = generateDescription(selectedItems, formData.type);
    if (!formData.description || formData.description === currentAutoDesc) {
      setFormData(prev => ({
        ...prev,
        description: generateDescription(newItems, prev.type)
      }));
    }

    if (field === 'quantity' || field === 'price' || field === 'itemId') {
      calculateTotalFromItems(newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const amountVal = parseFloat(formData.amount);
    if (!formData.description) {
      setErrorMsg("Deskripsi wajib diisi!");
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg("Jumlah uang harus di atas 0!");
      return;
    }

    // Determine active items only if sync is enabled
    const activeItems = syncInventory 
      ? selectedItems.filter(item => item.itemId && !isNaN(parseFloat(item.quantity)) && parseFloat(item.quantity) > 0) 
      : [];

    if (formData.type === 'Income' && syncInventory && activeItems.length > 0) {
      for (const item of activeItems) {
        const available = getAvailableStock(item.itemId);
        const qtyVal = parseFloat(item.quantity);
        if (qtyVal > available) {
          const masterItem = allItems.find(i => i.id === item.itemId);
          setErrorMsg(`Jumlah penjualan untuk ${masterItem?.name || 'barang'} melebihi persediaan (Maksimal: ${available} ${masterItem?.unit || ''}).`);
          return;
        }
      }
    }

    const transactionData: any = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      description: formData.description,
      amount: amountVal,
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    if (activeItems.length > 0) {
      transactionData.items = activeItems.map(item => {
        const itemObj: any = {
          itemId: item.itemId,
          quantity: parseFloat(item.quantity)
        };
        const p = parseFloat(item.price);
        if (!isNaN(p)) itemObj.price = p;
        return itemObj;
      });
    }

    // Double check sync logic before final action
    if (!editingId && (formData.category === 'Pembelian' || formData.category === 'Penjualan') && !syncInventory) {
       if (window.confirm("Kategori ini biasanya terhubung ke Persediaan. Hubungkan sekarang?")) {
         setSyncInventory(true);
         setErrorMsg("Silakan centang 'Hubungkan ke Persediaan' dan lengkapi rincian barang.");
         return;
       }
    }

    if (editingId) {
      const oldTransaction = transactions.find(t => t.id === editingId);
      let relatedId = oldTransaction?.relatedId;
      let relatedType = oldTransaction?.relatedType;

      // Update linked inventory if sync is enabled and it was already linked OR it's being linked now
      if (syncInventory && activeItems.length > 0) {
        const item = activeItems[0];
        const qty = parseFloat(item.quantity);
        const itemPrice = parseFloat(item.price) || (amountVal / activeItems.length / qty);
        const masterItem = allItems.find(i => i.id === item.itemId);

        // CASE: Type changed or Item changed - Delete old link and create new
        const typeMismatch = (relatedType === 'stockBatch' && formData.type === 'Income') || 
                            (relatedType === 'stockOut' && formData.type === 'Expense');
        
        if (relatedId && relatedType && typeMismatch) {
          // Use current app logic to safely delete previous linked inventory
          if (relatedType === 'stockBatch') {
             // In App.tsx deleteTransaction handles cleanup, but we need to do it here for updates
             // For now we assume cleanup is handled or simple delete
             // Since we're in Transactions.tsx we don't have direct access to 'remove' from useFirebaseSync
             // but we have deleteTransaction which calls remove internally.
             // Actually, it's better to tell App.tsx to handle linked cleanup.
          }
        }

        if (relatedId && relatedType && !typeMismatch) {
          // Update existing linked entry
          if (relatedType === 'stockBatch' && formData.type === 'Expense') {
            onAddStock({
              itemId: item.itemId,
              quantity: qty,
              price: itemPrice, 
              date: formData.date,
              sellingPrice: masterItem?.sellingPrice,
              existingId: relatedId
            });
          } else if (relatedType === 'stockOut' && formData.type === 'Income') {
            onRemoveStock({
              itemId: item.itemId,
              quantity: qty,
              date: formData.date,
              sellingPrice: itemPrice,
              existingId: relatedId
            });
          }
        } else {
          // Create new link (either new transaction or switched type)
          if (formData.type === 'Expense') {
            const res = onAddStock({
              itemId: item.itemId,
              quantity: qty,
              price: itemPrice, 
              date: formData.date,
              sellingPrice: masterItem?.sellingPrice
            });
            if (res) {
              relatedId = res;
              relatedType = 'stockBatch';
            }
          } else {
            const res = onRemoveStock({
              itemId: item.itemId,
              quantity: qty,
              date: formData.date,
              sellingPrice: itemPrice
            });
            if (res) {
              relatedId = res;
              relatedType = 'stockOut';
            }
          }
        }
      }

      const finalTransaction = { ...transactionData };
      if (relatedId) finalTransaction.relatedId = relatedId;
      if (relatedType) finalTransaction.relatedType = relatedType;
      
      updateTransaction(finalTransaction);
    } else {
      let relatedId: string | undefined = undefined;
      let relatedType: 'stockBatch' | 'stockOut' | undefined = undefined;

      // Handle inventory sync if enabled and items are selected
      if (syncInventory && activeItems.length > 0) {
        const item = activeItems[0];
        const qty = parseFloat(item.quantity);
        const masterItem = allItems.find(i => i.id === item.itemId);
        // Expense: itemPrice is purchase cost. Income: itemPrice is selling price.
        const itemPrice = parseFloat(item.price) || (amountVal / activeItems.length / qty);
        
        if (formData.type === 'Expense') {
          const res = onAddStock({
            itemId: item.itemId,
            quantity: qty,
            price: itemPrice, 
            date: formData.date,
            sellingPrice: masterItem?.sellingPrice
          });
          if (res) {
            relatedId = res;
            relatedType = 'stockBatch';
          }
        } else {
          const res = onRemoveStock({
            itemId: item.itemId,
            quantity: qty,
            date: formData.date,
            sellingPrice: itemPrice
          });
          if (res) {
            relatedId = res;
            relatedType = 'stockOut';
          } else {
            // Insufficient stock alert already shown in onRemoveStock, abort submission
            return;
          }
        }

        // Handle additional items
        activeItems.slice(1).forEach(item => {
          const qty = parseFloat(item.quantity);
          const masterItem = allItems.find(i => i.id === item.itemId);
          const iPrice = parseFloat(item.price) || (amountVal / activeItems.length / qty);
          if (formData.type === 'Expense') {
            onAddStock({ 
              itemId: item.itemId, 
              quantity: qty, 
              price: iPrice, 
              date: formData.date,
              sellingPrice: masterItem?.sellingPrice
            });
          } else {
            onRemoveStock({ 
              itemId: item.itemId, 
              quantity: qty, 
              date: formData.date,
              sellingPrice: iPrice
            });
          }
        });
      }

    // Finalize transaction addition
      const finalTransaction = { ...transactionData };
      if (relatedId) finalTransaction.relatedId = relatedId;
      if (relatedType) finalTransaction.relatedType = relatedType;
      
      addTransaction(finalTransaction);
    }

    // Ensure the list shows the month of the transaction just added/edited
    const transactionMonth = formData.date.slice(0, 7);
    setSelectedMonth(transactionMonth);

    // Reset state
    setIsAdding(false);
    setEditingId(null);
    // Don't reset syncInventory here, let the useEffect handle it for next entry
    setIsAddingNewItem(false);
    setSelectedItems([{ itemId: items[0]?.id || '', quantity: '', price: '' }]);
    setFormData({
      description: '',
      amount: '',
      type: 'Expense',
      category: 'Beban',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      date: t.date
    });
    if (t.items && t.items.length > 0) {
      setSyncInventory(true);
      setSelectedItems(t.items.map(i => ({ 
        itemId: i.itemId, 
        quantity: i.quantity.toString(),
        price: i.price?.toString() || '' 
      })));
    } else {
      setSyncInventory(false);
      setSelectedItems([{ itemId: items[0]?.id || '', quantity: '', price: '' }]);
    }
    setEditingId(t.id);
    setIsAdding(true);
    
    // Use a more robust scroll that also handles our specific layout where 'main' is the scroll container
    const mainView = document.querySelector('main');
    if (mainView) {
      mainView.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemFormData.name || !newItemFormData.unit) return;
    
    // Check if item with same name already exists to prevent duplicates
    const existingItem = items.find(i => i.name.toLowerCase() === newItemFormData.name.toLowerCase());
    if (existingItem) {
      alert(`Barang dengan nama "${existingItem.name}" sudah ada di persediaan. Menggunakan data yang sudah ada.`);
      const updatedItems = [...selectedItems];
      const lastIdx = updatedItems.length - 1;
      if (lastIdx >= 0) {
        updatedItems[lastIdx] = { ...updatedItems[lastIdx], itemId: existingItem.id };
        setSelectedItems(updatedItems);
        calculateTotalFromItems(updatedItems);
      }
      setNewItemFormData({ name: '', unit: '' });
      setIsAddingNewItem(false);
      return;
    }

    const newItem: InventoryItem = {
      id: 'i' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: newItemFormData.name,
      unit: newItemFormData.unit
    };
    
    const finalId = addInventoryItem(newItem);
    setSessionNewItems(prev => [...prev, { ...newItem, id: finalId }]);
    
    // Automatically select the new item in the last row
    const updatedItems = [...selectedItems];
    const lastIdx = updatedItems.length - 1;
    if (lastIdx >= 0) {
      updatedItems[lastIdx] = { 
        ...updatedItems[lastIdx], 
        itemId: finalId
      };
      setSelectedItems(updatedItems);
      calculateTotalFromItems(updatedItems);

      // Update description specifically since generateDescription now sees the new item
      const currentAutoDesc = generateDescription(selectedItems, formData.type);
      if (!formData.description || formData.description === currentAutoDesc) {
        setFormData(prev => ({
          ...prev,
          description: generateDescription(updatedItems, prev.type)
        }));
      }
    }
    
    setNewItemFormData({ name: '', unit: '' });
    setIsAddingNewItem(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catat Transaksi</h1>
          <p className="text-slate-500 text-sm">Kelola pemasukan dan pengeluaran harian Anda.</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setEditingId(null);
              setIsAdding(false);
              setFormData({
                description: '',
                amount: '',
                type: 'Expense',
                category: 'Beban',
                date: new Date().toISOString().split('T')[0]
              });
            } else {
              setIsAdding(true);
            }
          }}
          className="w-full sm:w-auto bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-brand-blue/10 flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Baru</>}
        </button>
      </header>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={18} />
          <span className="text-sm font-semibold">Periode:</span>
        </div>
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
        >
          {months.length > 0 ? months.map(m => (
            <option key={m} value={m}>{new Date(m + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>
          )) : <option value={selectedMonth}>{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>}
        </select>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Deskripsi</label>
              <input 
                type="text"
                value={formData.description}
                onChange={e => {
                  setFormData({...formData, description: e.target.value});
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="Contoh: Penjualan Produk A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                {formData.category === 'Penjualan' 
                  ? (selectedItems.length === 1 && selectedItems[0].itemId && allItems.find(i => i.id === selectedItems[0].itemId)?.sellingPrice
                      ? `Total Penjualan (@ Rp ${allItems.find(i => i.id === selectedItems[0].itemId)!.sellingPrice!.toLocaleString('id-ID')} / ${allItems.find(i => i.id === selectedItems[0].itemId)!.unit})`
                      : 'Total Harga Jual (Terhitung Otomatis)')
                  : formData.category === 'Pembelian' ? 'Total Harga Beli' : 'Jumlah (Rp)'}
              </label>
              <input 
                type="number"
                value={formData.amount}
                readOnly={syncInventory && selectedItems.some(i => i.quantity && i.price)}
                onChange={e => {
                  setFormData({...formData, amount: e.target.value});
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`w-full border border-slate-100 rounded-lg px-4 py-2 text-sm outline-none ${
                  syncInventory && selectedItems.some(i => i.quantity && i.price)
                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500/10'
                }`}
                placeholder="0"
              />
              {syncInventory && selectedItems.some(i => i.quantity && i.price) && (
                <p className="text-[9px] text-brand-blue mt-1 font-medium">* Terhitung otomatis dari rincian barang.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipe</label>
              <select 
                value={formData.type}
                onChange={e => {
                  const newType = e.target.value as 'Income' | 'Expense';
                  const currentAutoDesc = generateDescription(selectedItems, formData.type);
                  const isAutoDesc = !formData.description || formData.description === currentAutoDesc;
                  
                  const updatedItems = refreshPrices(newType, selectedItems);
                  setSelectedItems(updatedItems);
                  calculateTotalFromItems(updatedItems);
                  
                  let targetCategory = formData.category;
                  if (newType === 'Income' && (formData.category === 'Beban' || formData.category === 'Pembelian' || formData.category === 'Aset')) {
                    targetCategory = 'Penjualan';
                  } else if (newType === 'Expense' && formData.category === 'Penjualan') {
                    targetCategory = 'Beban';
                  }

                  setFormData(prev => ({
                    ...prev, 
                    type: newType,
                    category: targetCategory,
                    description: isAutoDesc ? generateDescription(updatedItems, newType) : prev.description
                  }));
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option value="Income" disabled={formData.category === 'Beban' || formData.category === 'Pembelian' || formData.category === 'Aset'}>Pemasukan</option>
                <option value="Expense" disabled={formData.category === 'Penjualan'}>Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kategori</label>
              <select 
                value={formData.category}
                onChange={e => {
                  const val = e.target.value;
                  const isSyncable = val === 'Penjualan' || val === 'Pembelian';
                  
                  // Auto-set type based on category
                  let targetType = formData.type;
                  if (val === 'Penjualan') targetType = 'Income';
                  if (val === 'Pembelian') targetType = 'Expense';
                  if (val === 'Beban') targetType = 'Expense';
                  if (val === 'Aset') targetType = 'Expense';

                  if (targetType !== formData.type) {
                    const updatedItems = refreshPrices(targetType, selectedItems);
                    setSelectedItems(updatedItems);
                    calculateTotalFromItems(updatedItems);
                  }

                  setFormData(prev => ({
                    ...prev, 
                    category: val,
                    type: targetType
                  }));
                  
                  if (isSyncable) {
                    setSyncInventory(true);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none"
              >
                <option value="Beban" disabled={formData.type === 'Income'}>Beban Operasional</option>
                <option value="Penjualan" disabled={formData.type === 'Expense'}>Penjualan (Dagang)</option>
                <option value="Pembelian" disabled={formData.type === 'Expense'}>Pembelian (Stok)</option>
                <option value="Aset" disabled={formData.type === 'Income'}>Aset Tetap</option>
                <option value="Lainnya">Lain-lain</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tanggal</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              {errorMsg && (
                <div className="text-red-500 text-[10px] font-bold animate-pulse">
                  {errorMsg}
                </div>
              )}
              <button 
                type="submit" 
                id="btn-save-transaction"
                className="w-full bg-brand-blue text-white rounded-lg py-2 text-sm font-bold shadow-lg shadow-brand-blue/10 hover:bg-brand-blue/90 active:transform active:scale-95 transition-all cursor-pointer"
              >
                {editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
              </button>
            </div>

            {/* Inventory Sync Option */}
            <div className="md:col-span-3 pt-4 mt-2 border-t border-slate-50">
              <div className="flex items-center gap-3 mb-4">
                <button 
                  type="button"
                  onClick={() => setSyncInventory(!syncInventory)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    syncInventory 
                    ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <Package size={14} />
                  Hubungkan ke Persediaan
                </button>
                {syncInventory && (
                  <p className="text-[10px] font-medium text-slate-400 italic">
                    {formData.type === 'Income' ? 'Pilih produk yang terjual' : 'Pilih bahan yang masuk'} secara otomatis.
                  </p>
                )}
              </div>

              {syncInventory && (
                <div className="space-y-4 animate-in slide-in-from-top-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Rincian Barang</p>
                      <button 
                        type="button"
                        onClick={() => setIsAddingNewItem(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer border border-indigo-100"
                      >
                        <Plus size={12} /> Daftar Barang Baru
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={addItemRow}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <PlusCircle size={12} /> Tambah Kolom
                    </button>
                  </div>

                  {/* Add New Item Inline Form */}
                  {isAddingNewItem && (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-bold text-indigo-600 uppercase">Daftar Barang Baru ke Persediaan</h4>
                        <button type="button" onClick={() => setIsAddingNewItem(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Barang</label>
                          <input 
                            type="text"
                            value={newItemFormData.name}
                            onChange={e => setNewItemFormData({...newItemFormData, name: e.target.value})}
                            placeholder="Contoh: Kopi Gula Aren"
                            className="w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Satuan</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={newItemFormData.unit}
                              onChange={e => setNewItemFormData({...newItemFormData, unit: e.target.value})}
                              placeholder="cup, kg, Liter"
                              className="flex-1 bg-white border border-slate-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-blue/10"
                            />
                            <button 
                              type="button"
                              onClick={handleAddNewItem}
                              className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                            >
                              Tambah
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedItems.map((selected, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Nama Barang</label>
                        <select 
                          value={selected.itemId}
                          onChange={e => {
                            if (e.target.value === 'NEW') {
                              setIsAddingNewItem(true);
                            } else {
                              updateItemRow(index, 'itemId', e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none appearance-none font-bold"
                        >
                          <option value="">-- Pilih Barang --</option>
                          {allItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                          ))}
                          <option value="NEW" className="font-bold text-indigo-600">+ Tambah Barang Baru</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Qty</label>
                        <input 
                          type="number"
                          value={selected.quantity}
                          onChange={e => updateItemRow(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none font-bold"
                          placeholder="0"
                        />
                        {formData.type === 'Income' && selected.itemId && (
                          <div className={`text-[9px] mt-1 font-bold ${
                            parseFloat(selected.quantity) > getAvailableStock(selected.itemId) 
                            ? 'text-red-500 animate-pulse' 
                            : 'text-slate-400'
                          }`}>
                            {parseFloat(selected.quantity) > getAvailableStock(selected.itemId)
                              ? `Maksimal: ${getAvailableStock(selected.itemId)}`
                              : `Stok: ${getAvailableStock(selected.itemId)}`
                            }
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">
                          {formData.type === 'Income' ? 'Harga Jual Satuan' : 'Harga Beli Satuan'}
                        </label>
                        <input 
                          type="number"
                          value={selected.price}
                          onChange={e => updateItemRow(index, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/10 outline-none font-bold text-brand-blue"
                          placeholder="0"
                        />
                      </div>
                      
                      {formData.type === 'Income' && (
                        <div className="md:col-span-2 bg-slate-100/50 p-2 rounded-lg border border-slate-100 md:self-center">
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">HPP (Otomatis)</label>
                          <div className="text-xs font-bold text-slate-500">
                            Rp {calculateHPP(selected.itemId, parseFloat(selected.quantity) || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}

                      <div className={`md:col-span-1 flex justify-end md:self-center ${formData.type !== 'Income' ? 'md:col-span-3' : ''}`}>
                        {selectedItems.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <MinusCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Deskripsi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Jumlah</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Belum ada transaksi di periode ini</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 text-nowrap">{t.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div>{t.description}</div>
                      {t.items && t.items.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.items.map((item, idx) => {
                            const itemName = allItems.find(i => i.id === item.itemId)?.name || 'Barang';
                            return (
                              <div key={idx} className="flex flex-col bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{itemName}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-xs font-semibold text-indigo-600">{item.quantity}x</span>
                                  {item.price && (
                                    <span className="text-[10px] text-slate-400">@ Rp {item.price.toLocaleString('id-ID')}</span>
                                  )}
                                  {t.type === 'Income' && t.relatedId && (
                                    <span className="text-[10px] text-slate-300 italic">
                                      (HPP: Rp {((stockOuts.find(so => so.id === t.relatedId)?.cogs || 0) / item.quantity).toLocaleString('id-ID')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {t.relatedId && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Tersinkron ke Stok</span>
                        </div>
                      )}
                      {!t.relatedId && (t.category === 'Pembelian' || t.category === 'Penjualan') && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">BELUM TERHUBUNG KE STOK</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{t.category}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'Income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleEdit(t);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-2 transition-colors cursor-pointer hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 flex items-center justify-center"
                          title="Ubah"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            deleteTransaction(t.id);
                          }}
                          className="text-slate-400 hover:text-brand-yellow hover:bg-brand-blue/5 p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-brand-yellow/20 flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
