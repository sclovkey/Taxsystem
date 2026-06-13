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
  ClipboardList,
  FileText,
  Calculator,
  LogOut,
  Banknote,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { logout } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  companyName?: string;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, companyName }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { id: 'transactions', icon: ArrowUpRight, label: 'Transaksi' },
    { id: 'cash', icon: Banknote, label: 'Kas' },
    { id: 'inventory', icon: Package, label: 'Persediaan' },
    { id: 'assets', icon: Shield, label: 'Aktiva Tetap' },
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

      <motion.div 
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -256,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 h-screen bg-brand-blue border-r border-slate-800 
          flex flex-col p-6 flex-shrink-0
        `}
      >
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center shrink-0">
            <Zap className="text-brand-blue w-5 h-5 fill-current" />
          </div>
          <span className="font-sans font-bold text-base tracking-tight text-white truncate max-w-[140px]" title={companyName || "Bijikopi Finance"}>
            {companyName || "Bijikopi Finance"}
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 group transition-colors"
          title="Tutup Menu"
        >
          <X size={20} className="group-hover:scale-110 transition-transform" />
        </button>
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
        <button 
          onClick={() => {
            setActiveTab('settings');
            setIsOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
            activeTab === 'settings'
              ? 'bg-white/10 text-brand-yellow font-bold'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-brand-yellow' : 'text-slate-400'}`} />
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
      </motion.div>
    </>
  );
}
