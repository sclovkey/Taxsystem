import React, { useState } from 'react';
import { loginWithEmail } from '../lib/firebase';
import { LogIn, Landmark, AlertCircle, Loader2, User, Lock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const startDemoMode = () => {
    const demoUser = {
      uid: 'demo_user_finance',
      email: 'demo@finance.umkm',
      displayName: 'Demo User',
      emailVerified: true
    };
    localStorage.setItem('demo_user_finance', JSON.stringify(demoUser));
    window.location.reload();
  };

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
    } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed') || err.message?.includes('network error')) {
      setError('network-request-failed');
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
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  {error === 'network-request-failed' ? (
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-red-800 mb-1">Gagal Terhubung ke Firebase (Network Error)</h4>
                      <p className="text-[11px] text-red-600 font-medium leading-relaxed mb-3">
                        Koneksi ke Firebase diblokir oleh browser atau ekstensi Anda. Hal ini biasanya disebabkan oleh **Adblocker (seperti uBlock Origin, AdBlock)** atau kebijakan privasi ketat browser **(Brave Shields / Safari Tracking Protection)** dalam mode iframe.
                      </p>
                      <div className="space-y-1 text-[10px] text-slate-700 bg-white/80 p-3 rounded-lg border border-red-100/50 mb-3 leading-normal">
                        <p className="font-semibold text-slate-800 mb-0.5">Solusi yang dapat Anda lakukan:</p>
                        <p>1. Klik tombol <strong className="text-indigo-600">"Open in New Tab"</strong> di pojok kanan atas aplikasi untuk membukanya secara penuh mandiri (Sangat Direkomendasikan).</p>
                        <p>2. Matikan sementara Adblocker atau Brave Shields pada halaman ini.</p>
                        <p>3. Gunakan tombol masuk mode Demo (Offline) di bawah ini untuk mencoba aplikasi secara instan.</p>
                      </div>
                      <button
                        type="button"
                        onClick={startDemoMode}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Zap size={14} className="fill-current text-white" />
                        Masuk dengan Mode Demo (Offline)
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                  )}
                </div>
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
            
            <div className="flex items-center my-4 justify-between">
              <span className="w-full border-b border-slate-100"></span>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 shrink-0">atau</span>
              <span className="w-full border-b border-slate-100"></span>
            </div>

            <button
              type="button"
              onClick={startDemoMode}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-xl hover:bg-amber-100/70 transition-all active:scale-[0.98]"
            >
              <Zap size={18} className="fill-amber-800" />
              Gunakan Mode Demo (Offline)
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
