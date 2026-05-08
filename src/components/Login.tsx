import React from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { LogIn, Landmark } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Landmark className="text-indigo-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Finance UMKM</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Kelola keuangan usaha Anda dengan mudah dan aman. Silakan masuk untuk melanjutkan.
        </p>
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <LogIn size={20} />
          Masuk dengan Google
        </button>
        <p className="mt-8 text-xs text-slate-400">
          Dengan masuk, Anda menyetujui syarat dan ketentuan kami.
        </p>
      </div>
    </div>
  );
}
