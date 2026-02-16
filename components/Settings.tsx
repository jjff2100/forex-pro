
import React, { useState } from 'react';
import { CurrencyType } from '../types';
import { CURRENCIES } from '../constants';

interface SettingsProps {
  suppliers: string[];
  setSuppliers: (suppliers: string[]) => void;
  activeCurrencies: string[];
  setActiveCurrencies: (currencies: string[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ suppliers, setSuppliers, activeCurrencies, setActiveCurrencies }) => {
  const [newSupplier, setNewSupplier] = useState('');
  const [newCurrency, setNewCurrency] = useState('');

  const addSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSupplier.trim();
    if (name && !suppliers.includes(name)) {
      setSuppliers([...suppliers, name]);
      setNewSupplier('');
    }
  };

  const removeSupplier = (name: string) => {
    if (confirm(`هل أنت متأكد من حذف المورد "${name}"؟`)) {
      setSuppliers(suppliers.filter(s => s !== name));
    }
  };

  const toggleCurrency = (curr: string) => {
    if (activeCurrencies.includes(curr)) {
      if (activeCurrencies.length <= 1) {
        alert("يجب أن تكون هناك عملة واحدة مفعلة على الأقل.");
        return;
      }
      setActiveCurrencies(activeCurrencies.filter(c => c !== curr));
    } else {
      setActiveCurrencies([...activeCurrencies, curr]);
    }
  };

  const addCustomCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCurrency.trim().toUpperCase();
    if (code && code.length >= 2 && !activeCurrencies.includes(code)) {
      setActiveCurrencies([...activeCurrencies, code]);
      setNewCurrency('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-800">الإعدادات والتكويد</h2>
        <p className="text-slate-500 mt-1">إدارة الموردين والعملات المتاحة في النظام</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Suppliers Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-truck-field text-indigo-500"></i>
              تكويد الموردين
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={addSupplier} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="اسم المورد الجديد..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newSupplier}
                onChange={e => setNewSupplier(e.target.value)}
              />
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                إضافة مورد
              </button>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {suppliers.map(supplier => (
                <div key={supplier} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:border-indigo-200">
                  <span className="font-bold text-slate-700">{supplier}</span>
                  <button 
                    onClick={() => removeSupplier(supplier)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Currencies Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-coins text-amber-500"></i>
              إدارة العملات
            </h3>
          </div>
          <div className="p-6">
             <form onSubmit={addCustomCurrency} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="كود عملة جديد (مثلاً: KWD)..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCurrency}
                onChange={e => setNewCurrency(e.target.value)}
                maxLength={5}
              />
              <button className="px-6 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md active:scale-95">
                إضافة كود
              </button>
            </form>

            <div className="grid grid-cols-2 gap-3">
              {/* Combine default currencies with any custom active ones */}
              {Array.from(new Set([...CURRENCIES, ...activeCurrencies])).map(curr => {
                const isActive = activeCurrencies.includes(curr);
                return (
                  <div 
                    key={curr} 
                    onClick={() => toggleCurrency(curr)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 opacity-60 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>
                        {curr[0]}
                      </div>
                      <span className={`font-black ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>{curr}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'right-6' : 'right-1'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-xs text-slate-400 italic font-medium leading-relaxed">
              * العملات المعطلة لن تظهر في قوائم تسجيل العمليات الجديدة، ولكنها ستظل محفوظة في التقارير التاريخية إذا كانت مرتبطة بعمليات قديمة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
