import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ArrowUpRight, 
  BarChart3, 
  Settings, 
  Zap, 
  Shield, 
  Package, 
  Truck, 
  Users,
  Wallet,
  ClipboardList,
  FileText,
  Calculator,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { logout } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { id: 'transactions', icon: ArrowUpRight, label: 'Transaksi' },
    { id: 'inventory', icon: Package, label: 'Persediaan' },
    { id: 'assets', icon: Shield, label: 'Aktiva Tetap' },
    { id: 'liabilities', icon: Wallet, label: 'Daftar Utang' },
    { id: 'suppliers', icon: Truck, label: 'Daftar Supplier' },
    { id: 'reports', icon: BarChart3, label: 'Laba Rugi' },
    { id: 'balance-sheet', icon: ClipboardList, label: 'Neraca' },
    { id: 'equity', icon: FileText, label: 'Perubahan Modal' },
    { id: 'tax', icon: Calculator, label: 'Pajak' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 h-screen bg-brand-blue border-r border-slate-800 
        flex flex-col p-6 flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
          <Zap className="text-brand-blue w-5 h-5 fill-current" />
        </div>
        <span className="font-sans font-bold text-xl tracking-tight text-white">Finance UMKM</span>
      </div>
 
      <nav className="flex flex-col gap-1 overflow-y-auto pr-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
              activeTab === item.id
                ? 'bg-white/10 text-brand-yellow'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-brand-yellow' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>
 
      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium">
          <Settings className="w-4 h-4 text-slate-500" />
          Pengaturan
        </button>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Keluar
        </button>
      </div>
      </div>
    </>
  );
}
