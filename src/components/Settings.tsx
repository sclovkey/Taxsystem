import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  Coffee, 
  Save, 
  Sparkles,
  Award 
} from 'lucide-react';
import { CompanyIdentity } from '../types';
import { motion } from 'motion/react';

interface SettingsProps {
  companyProfile: CompanyIdentity[];
  upsert: (collName: string, id: string, data: any) => Promise<void>;
}

export default function Settings({ companyProfile, upsert }: SettingsProps) {
  const currentProfile = companyProfile?.[0];

  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    businessType: '',
    address: '',
    phone: '',
    email: '',
    npwp: '',
    slogan: '',
    establishedDate: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state with incoming profile data on load or change
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        companyName: currentProfile.companyName || '',
        ownerName: currentProfile.ownerName || '',
        businessType: currentProfile.businessType || '',
        address: currentProfile.address || '',
        phone: currentProfile.phone || '',
        email: currentProfile.email || '',
        npwp: currentProfile.npwp || '',
        slogan: currentProfile.slogan || '',
        establishedDate: currentProfile.establishedDate || ''
      });
    }
  }, [currentProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.ownerName) {
      alert('Nama Usaha dan Nama Pemilik harus diisi!');
      return;
    }

    setIsSaving(true);
    setSuccessMsg('');

    try {
      const id = currentProfile?.id || 'profile';
      await upsert('companyProfile', id, { ...formData, id });
      setSuccessMsg('Identitas perusahaan berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Gagal menyimpan identitas:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings-container" className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coffee className="text-brand-yellow shrink-0" size={26} />
            Identitas Perusahaan / UMKM
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pengaturan profil bisnis dan info kontak resmi untuk laporan laba rugi, neraca, dan faktur.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-800">Form Profil Usaha</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nama Perusahaan / Toko *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Contoh: Bijikopi Roastery & Cafe"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nama Pemilik / Owner *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Bidang / Jenis Usaha
                </label>
                <div className="relative">
                  <Coffee className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    placeholder="Contoh: Coffee Shop & F&B"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Slogan / Tagline Bisnis
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="slogan"
                    value={formData.slogan}
                    onChange={handleChange}
                    placeholder="Contoh: Kebaikan Alami di Setiap Cangkir"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 italic"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nomor NPWP Badan / Pribadi
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="npwp"
                    value={formData.npwp}
                    onChange={handleChange}
                    placeholder="00.000.000.0-000.000"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-mono text-center tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Tanggal Berdiri / Pembukaan
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="date"
                    name="establishedDate"
                    value={formData.establishedDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Alamat Fisik Usaha
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Jl. Kopi Harum No. 12, Jakarta"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 resize-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nomor HP / WhatsApp Toko
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  E-Mail Kontak Bisnis
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="kontak@bijikopi.id"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold"
              >
                {successMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
            >
              <Save size={18} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Identitas'}</span>
            </button>
          </form>
        </div>

        {/* Business Card Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="text-amber-500" size={18} />
              Identitas Kartu Bisnis UMKM
            </h2>

            {/* Coffee themed Premium Business Badge Card */}
            <div className="w-full h-56 bg-gradient-to-br from-indigo-900 via-indigo-950 to-indigo-800 p-6 rounded-2xl text-white relative shadow-xl overflow-hidden flex flex-col justify-between group">
              {/* Background circular coffee steam accents */}
              <div className="absolute right-0 top-0 opacity-10 leading-none mr-[-60px] mt-[-60px]">
                <Coffee size={240} className="stroke-[1]" />
              </div>
              <div className="absolute left-[-20px] bottom-[-20px] bg-indigo-500/10 w-32 h-32 rounded-full blur-3xl"></div>

              {/* Top part */}
              <div className="flex justify-between items-start z-10">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl tracking-tight leading-tight">
                    {formData.companyName || 'Nama Usaha Anda'}
                  </h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
                    {formData.businessType || 'Jenis Bidang Usaha'}
                  </p>
                </div>
                {/* Decorative Badge logo with initials */}
                <div className="w-10 h-10 bg-indigo-100/10 border border-indigo-100/20 backdrop-blur rounded-full flex items-center justify-center font-bold text-indigo-200">
                  {formData.companyName ? formData.companyName.substring(0, 2).toUpperCase() : 'CO'}
                </div>
              </div>

              {/* Slogan */}
              <p className="text-xs text-indigo-200/80 italic z-10 pr-8 my-1 leading-snug line-clamp-1">
                {formData.slogan ? `"${formData.slogan}"` : '"Seduh Setiap Kebahagiaan Bisnis Anda"'}
              </p>

              {/* Bottom details */}
              <div className="space-y-2 border-t border-indigo-100/10 pt-3 z-10 text-[11px] text-indigo-100/90 font-medium">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-indigo-400 shrink-0" />
                  <span className="truncate">Pemilik: <strong>{formData.ownerName || 'Nama Pemilik'}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-indigo-200/70">
                  {formData.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={10} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{formData.phone}</span>
                    </div>
                  )}
                  {formData.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={10} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{formData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Letterhead Preview / Lokasi */}
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 space-y-2.5 text-xs text-slate-600">
              <div className="flex gap-2 items-start">
                <MapPin size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Lokasi Outlet / Pabrik</p>
                  <p className="mt-0.5 leading-normal">{formData.address || 'Alamat fisik belum diatur.'}</p>
                </div>
              </div>

              {formData.npwp && (
                <div className="flex gap-2 items-start border-t border-indigo-100/30 pt-2">
                  <FileText size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block">NPWP Resmi</span>
                    <span className="font-mono text-[11px] text-slate-700 font-bold">{formData.npwp}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick FAQ info panel */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 text-xs text-slate-500 leading-relaxed space-y-3">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Coffee size={14} className="text-amber-600" />
              Mengapa Profil Ini Penting?
            </h4>
            <p>
              1. <strong>Laporan Keuangan Personal:</strong> Nama Usaha dan Tagline Anda akan ditampilkan di header Laporan Laba Rugi dan Neraca Keuangan.
            </p>
            <p>
              2. <strong>Keandalan Data:</strong> Menyimpan identitas memperkecil kesalahan taksiran perpajakan dengan mengandalkan data NPWP badan usaha yang valid.
            </p>
            <p>
              3. <strong>Cloud Syncing:</strong> Data profil ini tersinkronisasi di Cloud Storage Firebase, aman meskipun Anda berganti device atau browser.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
