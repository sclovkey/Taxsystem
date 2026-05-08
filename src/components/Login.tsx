import React, { useState } from 'react';
import { loginWithEmail } from '../lib/firebase';
import { LogIn, Landmark, AlertCircle, Loader2, User, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Masukkan username dan password.');
      return;
    }
    
    setError(null);
    setIsLoggingIn(true);
    try {
      await loginWithEmail(username, password);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleError = (err: any) => {
    console.error("Login failed:", err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      setError('Username atau password salah.');
    } else if (err.code === 'auth/operation-not-allowed') {
      setError('Metode login Email/Password belum diaktifkan di Firebase Console.');
    } else {
      setError('Gagal masuk. Cek koneksi atau konfigurasi Firebase.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            <Landmark className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1">Finance UMKM</h1>
          <p className="text-indigo-100 text-sm">Kelola keuangan bisnis Anda dengan cerdas</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-left"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin1"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
            <div className="pb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-center text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">
               Sistem Keuangan Digital v1.0 • Aman Terpercaya
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
