import React, { useState } from 'react';
import { Inbox, List, Plus, X, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, InventoryItem, StockBatch, StockOut } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  batches: StockBatch[];
  stockOuts: StockOut[];
  transactions: Transaction[];
  onAddStock: (data: { itemId: string; quantity: number; price: number; date: string; sellingPrice?: number }) => string | null;
  onRemoveStock: (data: { itemId: string; quantity: number; date: string; sellingPrice?: number }) => string | null;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  deleteStockEntry: (id: string, type: 'IN' | 'OUT') => void;
  updateStockEntry: (id: string, type: 'IN' | 'OUT', data: { quantity: number; price: number; sellingPrice?: number; date: string }) => void;
}

export default function Inventory({ items, batches, stockOuts, transactions, onAddStock, onRemoveStock, addInventoryItem, updateInventoryItem, deleteInventoryItem, deleteStockEntry, updateStockEntry }: InventoryProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [editingStockData, setEditingStockData] = useState<{ id: string; type: 'IN' | 'OUT'; quantity: string; price: string; sellingPrice: string; date: string } | null>(null);
  const [sellingPriceInput, setSellingPriceInput] = useState('');

  // Sync selectedItemId with items list (handle deletions or empty state)
  React.useEffect(() => {
    const itemExists = items.find(i => i.id === selectedItemId);
    if (!itemExists && items.length > 0) {
      setSelectedItemId(items[0].id);
    } else if (items.length === 0) {
      setSelectedItemId('');
    }
  }, [items, selectedItemId]);

  const [newItemForm, setNewItemForm] = useState({ id: '', name: '', unit: '', quantity: '', price: '', sellingPrice: '', date: new Date().toISOString().split('T')[0] });
  const [isNewItem, setIsNewItem] = useState(false);
  const [editItemForm, setEditItemForm] = useState({ id: '', name: '', unit: '', sellingPrice: '' });
  const [formData, setFormData] = useState({ quantity: '', price: '', date: new Date().toISOString().split('T')[0] });

  const currentItem = items.find(i => i.id === selectedItemId);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetId = newItemForm.id;

    if (isNewItem) {
      if (!newItemForm.name || !newItemForm.unit) return;
      
      // Check for duplicate names
      const existing = items.find(i => i.name.toLowerCase() === newItemForm.name.toLowerCase());
      if (existing) {
        alert(`Barang dengan nama "${existing.name}" sudah ada.`);
        setSelectedItemId(existing.id);
        setIsAddingItem(false);
        setIsNewItem(false);
        return;
      }

      const newItem: InventoryItem = {
        id: 'i' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: newItemForm.name,
        unit: newItemForm.unit,
        sellingPrice: newItemForm.sellingPrice ? parseFloat(newItemForm.sellingPrice) : undefined
      };
      addInventoryItem(newItem);
      targetId = newItem.id;
    } else {
      if (!targetId) return;
      // Update existing item's selling price if provided in this form
      const item = items.find(i => i.id === targetId);
      if (item) {
        const sPrice = newItemForm.sellingPrice ? parseFloat(newItemForm.sellingPrice) : undefined;
        if (sPrice !== item.sellingPrice) {
          updateInventoryItem({
            ...item,
            sellingPrice: sPrice
          });
        }
      }
    }

    // Record stock
    if (newItemForm.quantity && parseFloat(newItemForm.quantity) > 0) {
      onAddStock({
        itemId: targetId,
        quantity: parseFloat(newItemForm.quantity),
        price: parseFloat(newItemForm.price) || 0,
        date: newItemForm.date || new Date().toISOString().split('T')[0]
      });
    }

    setSelectedItemId(targetId);
    setNewItemForm({ id: '', name: '', unit: '', quantity: '', price: '', sellingPrice: '', date: new Date().toISOString().split('T')[0] });
    setIsNewItem(false);
    setIsAddingItem(false);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemForm.name || !editItemForm.unit) return;

    const sPrice = editItemForm.sellingPrice ? parseFloat(editItemForm.sellingPrice) : undefined;

    updateInventoryItem({
      id: editItemForm.id,
      name: editItemForm.name,
      unit: editItemForm.unit,
      sellingPrice: sPrice
    });

    setIsEditingItem(false);
  };

  const startEditing = (item: InventoryItem) => {
    setEditItemForm({
      id: item.id,
      name: item.name,
      unit: item.unit,
      sellingPrice: item.sellingPrice?.toString() || ''
    });
    setIsEditingItem(true);
  };

  const startEditingStock = (entry: any) => {
    const item = items.find(i => i.id === selectedItemId);
    
    let displayPrice = entry.price;
    if (entry.type === 'OUT') {
      const linkedT = transactions.find(t => t.relatedId === entry.id && t.relatedType === 'stockOut');
      if (linkedT) {
        displayPrice = linkedT.amount / entry.qty;
      }
    }

    setEditingStockData({
      id: entry.id,
      type: entry.type as 'IN' | 'OUT',
      quantity: entry.qty.toString(),
      price: displayPrice.toString(),
      sellingPrice: entry.sellingPrice.toString(),
      date: entry.date
    });
    setIsEditingStock(true);
  };

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockData) return;

    updateStockEntry(editingStockData.id, editingStockData.type, {
      quantity: parseFloat(editingStockData.quantity),
      price: parseFloat(editingStockData.price),
      sellingPrice: parseFloat(editingStockData.sellingPrice),
      date: editingStockData.date
    });

    // Also update item's selling price if provided (Global update) for INCOMING stock
    if (currentItem && editingStockData.type === 'IN') {
      const sPrice = editingStockData.sellingPrice ? parseFloat(editingStockData.sellingPrice) : undefined;
      if (sPrice !== currentItem.sellingPrice) {
        updateInventoryItem({
          ...currentItem,
          sellingPrice: sPrice
        });
      }
    }

    setIsEditingStock(false);
    setEditingStockData(null);
  };

  const itemBatches = batches.filter(b => b.itemId === selectedItemId);
  const itemStockOuts = stockOuts.filter(s => s.itemId === selectedItemId);

  const totalStock = itemBatches.reduce((acc, b) => acc + b.remainingQuantity, 0);
  const inventoryValue = itemBatches.reduce((acc, b) => acc + (b.remainingQuantity * b.pricePerUnit), 0);

  const stockCard = [
    ...itemBatches.map(b => {
      const item = items.find(i => i.id === b.itemId);
      return { 
        date: b.date, 
        type: 'IN', 
        qty: b.quantity, 
        price: b.pricePerUnit, 
        sellingPrice: (b as any).sellingPrice || item?.sellingPrice || 0,
        total: b.quantity * b.pricePerUnit, 
        id: b.id 
      };
    }),
    ...itemStockOuts.map(s => {
      const linkedT = transactions.find(t => t.relatedId === s.id && t.relatedType === 'stockOut');
      const item = items.find(i => i.id === s.itemId);
      // Priority: 1. Record specific price, 2. Transaction derived price, 3. Item default price
      const sPrice = (s as any).sellingPrice || (linkedT ? linkedT.amount / s.quantity : (item?.sellingPrice || 0));
      return { 
        date: s.date, 
        type: 'OUT', 
        qty: s.quantity, 
        price: s.cogs / s.quantity, 
        sellingPrice: sPrice,
        total: s.cogs, 
        id: s.id 
      };
    })
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Persediaan</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau stok barang dagang dengan metode FIFO.</p>
        </div>
        <button 
          onClick={() => setIsAddingItem(true)}
          className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/10"
        >
          <Plus size={20} />
          <span>Tambah Barang</span>
        </button>
      </header>

      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Tambah Stok / Barang</h3>
                <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddNewItem} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Barang</label>
                  <select 
                    required
                    value={isNewItem ? 'NEW' : newItemForm.id}
                    onChange={e => {
                      if (e.target.value === 'NEW') {
                        setIsNewItem(true);
                        setNewItemForm({ ...newItemForm, id: '', name: '', unit: '', sellingPrice: '' });
                      } else {
                        setIsNewItem(false);
                        const selected = items.find(i => i.id === e.target.value);
                        setNewItemForm({ 
                          ...newItemForm, 
                          id: e.target.value, 
                          name: selected?.name || '', 
                          unit: selected?.unit || '',
                          sellingPrice: selected?.sellingPrice?.toString() || ''
                        });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10 appearance-none"
                  >
                    <option value="" disabled>Pilih barang...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                    <option value="NEW" className="font-bold text-brand-blue">+ Tambah Barang Baru</option>
                  </select>
                </div>

                {isNewItem && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Barang Baru</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Biji Kopi Arabika" 
                        required 
                        value={newItemForm.name} 
                        onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Satuan</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: kg, Liter, pcs" 
                        required 
                        value={newItemForm.unit} 
                        onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={newItemForm.date} 
                    onChange={e => setNewItemForm({...newItemForm, date: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Harga Jual Satuan (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 120000" 
                    value={newItemForm.sellingPrice} 
                    onChange={e => setNewItemForm({...newItemForm, sellingPrice: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">* Digunakan sebagai harga jual default.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jumlah {newItemForm.unit ? `(${newItemForm.unit})` : ''}</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      required
                      value={newItemForm.quantity} 
                      onChange={e => setNewItemForm({...newItemForm, quantity: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-right">Harga Beli Satuan (HPP)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      required
                      value={newItemForm.price} 
                      onChange={e => setNewItemForm({...newItemForm, price: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10 text-right" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsAddingItem(false); setIsNewItem(false); }} className="flex-1 font-bold text-slate-400">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/10">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Edit Barang</h3>
                <button onClick={() => setIsEditingItem(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditItem} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Barang</label>
                  <input 
                    type="text" 
                    placeholder="Nama Barang" 
                    required 
                    value={editItemForm.name} 
                    onChange={e => setEditItemForm({...editItemForm, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Satuan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: kg, Liter, pcs" 
                    required 
                    value={editItemForm.unit} 
                    onChange={e => setEditItemForm({...editItemForm, unit: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Harga Jual Satuan (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="Harga Jual" 
                    value={editItemForm.sellingPrice} 
                    onChange={e => setEditItemForm({...editItemForm, sellingPrice: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingItem(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/10">Simpan Perubahan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingStock && editingStockData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Edit Catatan Stok {editingStockData.type === 'IN' ? 'Masuk' : 'Keluar'}</h3>
                <button onClick={() => setIsEditingStock(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={editingStockData.date} 
                    onChange={e => setEditingStockData({...editingStockData, date: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Jumlah</label>
                    <input 
                      type="number" 
                      required
                      value={editingStockData.quantity} 
                      onChange={e => setEditingStockData({...editingStockData, quantity: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                      {editingStockData.type === 'IN' ? 'Harga Beli Satuan (HPP)' : 'Harga Jual Satuan'}
                    </label>
                    <input 
                      type="number" 
                      required
                      value={editingStockData.price} 
                      onChange={e => setEditingStockData({...editingStockData, price: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    {editingStockData.type === 'IN' ? 'Update Harga Jual (Batch Ini) (Rp)' : 'Harga Jual Satuan (Transaksi) (Rp)'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 120000" 
                    value={editingStockData.sellingPrice} 
                    onChange={e => setEditingStockData({...editingStockData, sellingPrice: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {editingStockData.type === 'IN' 
                      ? '* Memperbarui harga jual default untuk batch ini dan sistem.' 
                      : '* Memperbarui harga jual untuk transaksi penjualan ini.'}
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingStock(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/10">Simpan Perubahan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide gap-1">
          {items.map(item => (
            <div key={item.id} className="relative flex-shrink-0 group flex items-center pr-2">
              <button 
                onClick={() => setSelectedItemId(item.id)} 
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  selectedItemId === item.id 
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/10' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {item.name}
              </button>
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item);
                  }}
                  className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                    selectedItemId === item.id 
                      ? 'text-white/60 hover:bg-white/20 hover:text-white' 
                      : 'text-slate-300 hover:bg-brand-blue/5 hover:text-brand-blue'
                  }`}
                  title="Edit Barang"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteInventoryItem(item.id);
                  }}
                  className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                    selectedItemId === item.id 
                      ? 'text-brand-yellow hover:bg-white/10' 
                      : 'text-slate-300 hover:bg-brand-yellow/10 hover:text-brand-yellow-dark'
                  }`}
                  title="Hapus Barang"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="px-6 py-2.5 text-sm text-slate-400 italic">Belum ada barang di daftar persediaan.</p>
          )}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm relative">
            <div className="p-3 bg-brand-blue/5 text-brand-blue w-fit rounded-full mx-auto mb-4 italic font-black">STK</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Stok Tersedia</p>
            <h3 className="text-4xl font-bold text-slate-800 tracking-tight">{totalStock} <span className="text-base font-normal text-slate-400">{currentItem?.unit}</span></h3>
            <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 gap-y-4 text-left">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">HPP Satuan</p>
                <p className="font-bold text-sm text-slate-700">Rp {totalStock > 0 ? (inventoryValue / totalStock).toLocaleString('id-ID') : 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Harga Jual Satuan</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <p className="font-bold text-sm text-brand-blue">
                    Rp {(currentItem?.sellingPrice || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Total Nilai Stok</p>
                <p className="font-bold text-xl text-brand-blue">Rp {inventoryValue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800"><List className="w-4 h-4 text-brand-blue" /> Histori Stok: {currentItem?.name}</div>
            <span className="text-xs font-medium text-slate-400 italic">FIFO Tracking</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Tipe</th><th className="px-6 py-4 text-right">Qty</th><th className="px-6 py-4 text-right">HPP (Beli)</th><th className="px-6 py-4 text-right">Harga Jual Satuan</th><th className="px-6 py-4 text-right text-brand-blue">Total HPP</th><th className="px-6 py-4 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockCard.map((entry) => (
                  <tr key={`${entry.id}-${entry.type}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{entry.date}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${entry.type === 'IN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{entry.type === 'IN' ? 'Masuk' : 'Keluar'}</span></td>
                    <td className="px-6 py-4 text-right text-sm font-medium">{entry.qty}</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">Rp {entry.price.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      Rp {entry.sellingPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-sm text-slate-900">Rp {entry.total.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditingStock(entry);
                          }}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100 flex items-center justify-center"
                          title="Edit Catatan"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteStockEntry(entry.id, entry.type as 'IN' | 'OUT');
                          }}
                          className="p-2.5 text-slate-400 hover:text-brand-yellow hover:bg-brand-blue/5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-brand-yellow/20 flex items-center justify-center"
                          title="Hapus Catatan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
