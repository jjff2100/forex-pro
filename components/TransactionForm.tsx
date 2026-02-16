
import React, { useState, useEffect } from 'react';
import { Transaction, CurrencyType, InventoryItem } from '../types';
import { InventoryData } from '../utils/helpers';

interface TransactionFormProps {
  type: 'purchase' | 'sale';
  inventory: InventoryData;
  suppliers: string[];
  currencies: string[];
  onSubmit: (tx: Omit<Transaction, 'id' | 'total' | 'profit'>) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, inventory, suppliers, currencies, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    partyName: '', // Customer (sale) or Supplier (purchase)
    supplierName: '', // Required for sale to select source
    currency: currencies[0] || 'USD',
    quantity: 0,
    price: 0,
    notes: '',
    image: '',
  });

  // If sale, balance is filtered by selected supplier + currency
  const targetSupplier = type === 'sale' ? formData.supplierName : formData.partyName;
  const availableBalance = inventory.bySupplier[targetSupplier]?.[formData.currency]?.balance || 0;
  const avgCost = inventory.bySupplier[targetSupplier]?.[formData.currency]?.avgCost || 0;
  
  const isOverBalance = type === 'sale' && formData.quantity > availableBalance;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverBalance) {
      alert('الكمية المطلوبة تتجاوز الرصيد المتاح لهذا المورد!');
      return;
    }
    onSubmit({
      ...formData,
      type,
      date: new Date().toISOString(),
    });
    onClose();
  };

  const estimatedTotal = (formData.quantity || 0) * (formData.price || 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`p-6 text-white flex justify-between items-center ${type === 'purchase' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
          <div>
            <h3 className="text-xl font-bold">{type === 'purchase' ? 'تسجيل استلام عملة' : 'تسجيل عملية بيع'}</h3>
            <p className="text-white/80 text-sm mt-1">يرجى إدخال البيانات بدقة لضمان صحة المحاسبة</p>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><i className="fas fa-times text-xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className={`grid ${type === 'sale' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {type === 'purchase' ? 'اسم المورد' : 'اسم العميل'}
                </label>
                {type === 'purchase' ? (
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.partyName}
                    onChange={e => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
                  >
                    <option value="">اختر المورد...</option>
                    {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.partyName}
                    onChange={e => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
                    placeholder="أدخل اسم العميل"
                  />
                )}
              </div>
              {type === 'sale' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">المورد المصدر</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.supplierName}
                    onChange={e => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  >
                    <option value="">اختر المورد...</option>
                    {suppliers.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الكمية</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${isOverBalance ? 'border-rose-300 ring-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 focus:ring-indigo-500'}`}
                  value={formData.quantity || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, quantity: isNaN(val) ? 0 : val }));
                  }}
                />
                {type === 'sale' && (
                  <p className="text-[10px] mt-1 text-slate-500">الرصيد المتاح: <span className="font-bold">{availableBalance.toLocaleString()}</span></p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">العملة</label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.currency}
                  onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">السعر {type === 'purchase' ? '(شراء)' : '(بيع)'}</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.0001"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pl-12"
                  value={formData.price || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, price: isNaN(val) ? 0 : val }));
                  }}
                />
                <span className="absolute left-4 top-2 text-slate-400 font-bold">L.C.</span>
              </div>
              {type === 'sale' && (
                <p className="text-[10px] mt-1 text-slate-500">التكلفة (متوسط من المورد): <span className="font-bold text-emerald-600">{avgCost.toFixed(4)}</span></p>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">الإجمالي التقديري:</span>
              <span className="text-lg font-bold text-indigo-700">
                {isNaN(estimatedTotal) ? '0' : estimatedTotal.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">إثبات العملية (صورة)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1 text-center">
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="h-24 mx-auto rounded-lg shadow-sm" />
                  ) : (
                    <>
                      <i className="fas fa-camera text-slate-400 text-3xl mb-2"></i>
                      <div className="flex text-sm text-slate-600">
                        <span className="relative rounded-md font-medium text-indigo-600 hover:text-indigo-500">رفع صورة</span>
                        <p className="pr-1">أو اسحب وأفلت</p>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG حتى 10 ميجا</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isOverBalance || !formData.partyName || (type === 'sale' && !formData.supplierName)}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isOverBalance || !formData.partyName || (type === 'sale' && !formData.supplierName) ? 'bg-slate-300 cursor-not-allowed' : (type === 'purchase' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700')}`}
            >
              إتمام العملية
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
