import React, { useState } from 'react';
import { Inbox, List, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, StockBatch, StockOut } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  batches: StockBatch[];
  stockOuts: StockOut[];
  onAddStock: (data: { itemId: string; quantity: number; price: number; date: string }) => string | null;
  onRemoveStock: (data: { itemId: string; quantity: number; date: string }) => string | null;
  addInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  deleteStockEntry: (id: string, type: 'IN' | 'OUT') => void;
}

export default function Inventory({ items, batches, stockOuts, onAddStock, onRemoveStock, addInventoryItem, deleteInventoryItem, deleteStockEntry }: InventoryProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Sync selectedItemId with items list (handle deletions or empty state)
  React.useEffect(() => {
    const itemExists = items.find(i => i.id === selectedItemId);
    if (!itemExists && items.length > 0) {
      setSelectedItemId(items[0].id);
    } else if (items.length === 0) {
      setSelectedItemId('');
    }
  }, [items, selectedItemId]);

  const [newItemForm, setNewItemForm] = useState({ name: '', unit: '', quantity: '', price: '' });
  const [formData, setFormData] = useState({ quantity: '', price: '', date: new Date().toISOString().split('T')[0] });

  const currentItem = items.find(i => i.id === selectedItemId);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name || !newItemForm.unit) return;

    const newItem: InventoryItem = {
      id: 'i' + Math.random().toString(36).substr(2, 5),
      name: newItemForm.name,
      unit: newItemForm.unit
    };

    addInventoryItem(newItem);

    // If initial stock is provided, record it
    if (newItemForm.quantity && parseFloat(newItemForm.quantity) > 0) {
      onAddStock({
        itemId: newItem.id,
        quantity: parseFloat(newItemForm.quantity),
        price: parseFloat(newItemForm.price) || 0,
        date: new Date().toISOString().split('T')[0]
      });
    }

    setSelectedItemId(newItem.id);
    setNewItemForm({ name: '', unit: '', quantity: '', price: '' });
    setIsAddingItem(false);
  };
  const itemBatches = batches.filter(b => b.itemId === selectedItemId);
  const itemStockOuts = stockOuts.filter(s => s.itemId === selectedItemId);

  const totalStock = itemBatches.reduce((acc, b) => acc + b.remainingQuantity, 0);
  const inventoryValue = itemBatches.reduce((acc, b) => acc + (b.remainingQuantity * b.pricePerUnit), 0);

  const stockCard = [
    ...itemBatches.map(b => ({ date: b.date, type: 'IN', qty: b.quantity, price: b.pricePerUnit, total: b.quantity * b.pricePerUnit, id: b.id })),
    ...itemStockOuts.map(s => ({ date: s.date, type: 'OUT', qty: s.quantity, price: s.cogs / s.quantity, total: s.cogs, id: s.id }))
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
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
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
                <h3 className="font-bold text-slate-800">Tambah Barang Baru</h3>
                <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddNewItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Barang</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Biji Kopi Arabika" 
                    required 
                    value={newItemForm.name} 
                    onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Banyak Item</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={newItemForm.quantity} 
                      onChange={e => setNewItemForm({...newItemForm, quantity: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10" 
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
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">Harga Satuan (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={newItemForm.price} 
                    onChange={e => setNewItemForm({...newItemForm, price: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10" 
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide gap-1">
          {items.map(item => (
            <div key={item.id} className="relative flex-shrink-0 group flex items-center">
              <button 
                onClick={() => setSelectedItemId(item.id)} 
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  selectedItemId === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {item.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteInventoryItem(item.id);
                }}
                className={`p-1.5 ml-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 ${
                  selectedItemId === item.id ? 'text-white/60 hover:bg-white/20 hover:text-white' : 'text-slate-300'
                }`}
                title="Hapus Barang"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="px-6 py-2.5 text-sm text-slate-400 italic">Belum ada barang di daftar persediaan.</p>
          )}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm relative">
            <div className="p-3 bg-indigo-50 text-indigo-600 w-fit rounded-full mx-auto mb-4 italic font-black">STK</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Stok Tersedia</p>
            <h3 className="text-4xl font-bold text-slate-800 tracking-tight">{totalStock} <span className="text-base font-normal text-slate-400">{currentItem?.unit}</span></h3>
            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between text-left">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Nilai Stok</p><p className="font-bold text-sm text-slate-700">Rp {inventoryValue.toLocaleString('id-ID')}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">HPP Satuan</p><p className="font-bold text-sm text-slate-700">Rp {totalStock > 0 ? (inventoryValue / totalStock).toLocaleString('id-ID') : 0}</p></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800"><List className="w-4 h-4 text-indigo-500" /> Histori Stok: {currentItem?.name}</div>
            <span className="text-xs font-medium text-slate-400 italic">FIFO Tracking</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Tipe</th><th className="px-6 py-4 text-right">Qty</th><th className="px-6 py-4 text-right">Harga</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockCard.map((entry) => (
                  <tr key={`${entry.id}-${entry.type}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{entry.date}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${entry.type === 'IN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{entry.type === 'IN' ? 'Masuk' : 'Keluar'}</span></td>
                    <td className="px-6 py-4 text-right text-sm font-medium">{entry.qty}</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">Rp {entry.price.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-bold text-sm text-slate-900">Rp {entry.total.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteStockEntry(entry.id, entry.type as 'IN' | 'OUT');
                        }}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={16} />
                      </button>
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
