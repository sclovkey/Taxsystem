import React, { useState } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Package, Truck, MinusCircle, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Transaction, InventoryItem } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  items: InventoryItem[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  onAddStock: (data: { itemId: string; quantity: number; price: number; date: string }) => string | null;
  onRemoveStock: (data: { itemId: string; quantity: number; date: string }) => string | null;
  addInventoryItem: (item: InventoryItem) => void;
}

export default function Transactions({ 
  transactions, 
  items, 
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
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemFormData, setNewItemFormData] = useState({ name: '', unit: '' });
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: string; price: string }[]>([
    { itemId: items[0]?.id || '', quantity: '', price: '' }
  ]);

  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { itemId: items[0]?.id || '', quantity: '', price: '' }]);
  };

  const removeItemRow = (index: number) => {
    const newItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(newItems);
    calculateTotalFromItems(newItems);
  };

  const calculateTotalFromItems = (itemsList: { quantity: string; price: string }[]) => {
    const total = itemsList.reduce((acc, curr) => {
      const q = parseFloat(curr.quantity) || 0;
      const p = parseFloat(curr.price) || 0;
      return acc + (q * p);
    }, 0);
    if (total > 0) {
      setFormData(prev => ({ ...prev, amount: total.toString() }));
    }
  };

  const generateDescription = (itemsList: typeof selectedItems, type: string) => {
    const activeItems = itemsList.filter(i => i.itemId && i.quantity);
    if (activeItems.length === 0) return '';

    const details = activeItems.map(ai => {
      const item = items.find(i => i.id === ai.itemId);
      return `${ai.quantity} ${item?.unit || ''} ${item?.name || 'Barang'}`;
    });

    const prefix = type === 'Income' ? 'Penjualan' : 'Pembelian';
    return `${prefix}: ${details.join(', ')}`;
  };

  const updateItemRow = (index: number, field: 'itemId' | 'quantity' | 'price', value: string) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
    
    // Auto-update description if not manually edited or if it was previously auto-generated
    const currentAutoDesc = generateDescription(selectedItems, formData.type);
    if (!formData.description || formData.description === currentAutoDesc) {
      setFormData(prev => ({
        ...prev,
        description: generateDescription(newItems, prev.type)
      }));
    }

    if (field === 'quantity' || field === 'price') {
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

    if (editingId) {
      updateTransaction(transactionData);
    } else {
      let relatedId: string | undefined = undefined;
      let relatedType: 'stockBatch' | 'stockOut' | undefined = undefined;

      // Handle inventory sync if enabled and items are selected
      if (syncInventory && activeItems.length > 0) {
        const item = activeItems[0];
        const qty = parseFloat(item.quantity);
        const itemPrice = parseFloat(item.price) || (amountVal / activeItems.length / qty);
        
        if (formData.type === 'Expense') {
          const res = onAddStock({
            itemId: item.itemId,
            quantity: qty,
            price: itemPrice, 
            date: formData.date
          });
          if (res) {
            relatedId = res;
            relatedType = 'stockBatch';
          }
        } else {
          const res = onRemoveStock({
            itemId: item.itemId,
            quantity: qty,
            date: formData.date
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
          const iPrice = parseFloat(item.price) || (amountVal / activeItems.length / qty);
          if (formData.type === 'Expense') {
            onAddStock({ itemId: item.itemId, quantity: qty, price: iPrice, date: formData.date });
          } else {
            onRemoveStock({ itemId: item.itemId, quantity: qty, date: formData.date });
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
    setSyncInventory(false);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemFormData.name || !newItemFormData.unit) return;
    
    const newItem: InventoryItem = {
      id: 'i' + Math.random().toString(36).substr(2, 5),
      name: newItemFormData.name,
      unit: newItemFormData.unit
    };
    
    addInventoryItem(newItem);
    setNewItemFormData({ name: '', unit: '' });
    setIsAddingNewItem(false);
    
    // Automatically select the new item in the last row if it's currently empty
    const updatedItems = [...selectedItems];
    const lastItem = updatedItems[updatedItems.length - 1];
    if (lastItem && !lastItem.itemId) {
      updatedItems[updatedItems.length - 1] = { ...lastItem, itemId: newItem.id };
      setSelectedItems(updatedItems);
    }
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
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jumlah (Rp)</label>
              <input 
                type="number"
                value={formData.amount}
                onChange={e => {
                  setFormData({...formData, amount: e.target.value});
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipe</label>
              <select 
                value={formData.type}
                onChange={e => {
                  const newType = e.target.value as any;
                  const currentAutoDesc = generateDescription(selectedItems, formData.type);
                  const isAutoDesc = !formData.description || formData.description === currentAutoDesc;
                  
                  setFormData(prev => ({
                    ...prev, 
                    type: newType,
                    description: isAutoDesc ? generateDescription(selectedItems, newType) : prev.description
                  }));
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option value="Income">Pemasukan</option>
                <option value="Expense">Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kategori</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option value="Penjualan">Penjualan</option>
                <option value="Pembelian">Pembelian</option>
                <option value="Beban">Beban</option>
                <option value="Aset">Aset</option>
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
                              placeholder="Contoh: cup, kg, Liter"
                              className="flex-1 bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
                            />
                            <button 
                              type="button"
                              onClick={handleAddNewItem}
                              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                            >
                              Tambah
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedItems.map((selected, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Barang</label>
                        <select 
                          value={selected.itemId}
                          onChange={e => {
                            if (e.target.value === 'NEW') {
                              setIsAddingNewItem(true);
                            } else {
                              updateItemRow(index, 'itemId', e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none appearance-none"
                        >
                          <option value="">-- Pilih Barang --</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                          ))}
                          <option value="NEW" className="font-bold text-indigo-600">+ Tambah Barang Baru</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Kuantitas</label>
                        <input 
                          type="number"
                          value={selected.quantity}
                          onChange={e => updateItemRow(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Harga Satuan (Rp)</label>
                        <input 
                          type="number"
                          value={selected.price}
                          onChange={e => updateItemRow(index, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
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
                            const itemName = items.find(i => i.id === item.itemId)?.name || 'Barang';
                            return (
                              <div key={idx} className="flex flex-col bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{itemName}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs font-semibold text-indigo-600">{item.quantity}x</span>
                                  {item.price && (
                                    <span className="text-[10px] text-slate-400">@ Rp {item.price.toLocaleString('id-ID')}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{t.category}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'Income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                          title="Ubah"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="text-slate-400 hover:text-brand-yellow hover:bg-brand-blue p-1 rounded transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
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
