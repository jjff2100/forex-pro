
import React, { useState } from 'react';
import { Transaction, CurrencyType } from '../types';
import { formatCurrency } from '../utils/helpers';
import { CURRENCIES } from '../constants';

interface TransactionsListProps {
  type: 'purchase' | 'sale';
  transactions: Transaction[];
}

const TransactionsList: React.FC<TransactionsListProps> = ({ type, transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLargeText, setIsLargeText] = useState(false);

  const filtered = transactions.filter(t => 
    t.type === type &&
    (searchTerm === '' || 
     t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (t.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (currencyFilter === 'ALL' || t.currency === currencyFilter)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals for the footer
  const totals = filtered.reduce((acc, curr) => {
    acc.quantity += curr.quantity;
    acc.total += curr.total;
    acc.profit += (curr.profit || 0);
    return acc;
  }, { quantity: 0, total: 0, profit: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <i className="fas fa-search absolute right-4 top-3 text-slate-400"></i>
          <input
            type="text"
            placeholder={type === 'purchase' ? "البحث باسم المورد..." : "البحث باسم العميل أو المورد..."}
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLargeText(!isLargeText)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isLargeText ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-inner' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400'}`}
          >
            <i className={`fas ${isLargeText ? 'fa-magnifying-glass-minus' : 'fa-magnifying-glass-plus'}`}></i>
            {isLargeText ? 'تصغير الأرقام' : 'تكبير حجم الأرقام'}
          </button>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-slate-50"
            value={currencyFilter}
            onChange={e => setCurrencyFilter(e.target.value)}
          >
            <option value="ALL">كل العملات</option>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase border-b border-slate-100">
                <th className="px-6 py-5 font-bold">التاريخ والوقت</th>
                <th className="px-6 py-5 font-bold">{type === 'purchase' ? 'المورد' : 'العميل'}</th>
                {type === 'sale' && <th className="px-6 py-5 font-bold">مورد المصدر</th>}
                <th className="px-6 py-5 font-bold">العملة</th>
                <th className="px-6 py-5 font-bold">الكمية</th>
                <th className="px-6 py-5 font-bold">سعر {type === 'purchase' ? 'الشراء' : 'البيع'}</th>
                {type === 'sale' && <th className="px-6 py-5 font-bold text-slate-400">سعر التكلفة</th>}
                <th className="px-6 py-5 font-bold">الإجمالي</th>
                {type === 'sale' && <th className="px-6 py-5 font-bold text-emerald-600">الربح</th>}
                <th className="px-6 py-5 font-bold text-center">المرفقات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={type === 'sale' ? 10 : 7} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-inbox text-6xl mb-4 opacity-10"></i>
                      <p className="text-sm font-medium">لا توجد عمليات مسجلة تطابق اختياراتك</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-all group border-r-4 border-transparent hover:border-indigo-500">
                    <td className="px-6 py-6 whitespace-nowrap text-[11px] text-slate-500">
                      <div className="font-bold text-slate-700">{new Date(tx.date).toLocaleDateString('ar-SA')}</div>
                      <div className="opacity-60">{new Date(tx.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`font-bold text-slate-800 ${isLargeText ? 'text-lg' : 'text-sm'}`}>{tx.partyName}</span>
                    </td>
                    {type === 'sale' && (
                      <td className="px-6 py-6">
                        <span className={`text-slate-500 font-medium ${isLargeText ? 'text-base' : 'text-xs'}`}>{tx.supplierName || 'غير محدد'}</span>
                      </td>
                    )}
                    <td className="px-6 py-6">
                      <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black text-slate-600 border border-slate-200 tracking-wider">{tx.currency}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`font-black text-slate-900 tabular-nums ${isLargeText ? 'text-xl' : 'text-base'}`}>
                        {formatCurrency(tx.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`text-slate-700 font-bold tabular-nums ${isLargeText ? 'text-lg' : 'text-sm'}`}>
                        {formatCurrency(tx.price)}
                      </span>
                    </td>
                    {type === 'sale' && (
                      <td className="px-6 py-6">
                        <span className={`text-slate-400 font-medium italic tabular-nums ${isLargeText ? 'text-base' : 'text-xs'}`}>
                          {tx.purchasePrice ? formatCurrency(tx.purchasePrice) : '-'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-6">
                      <span className={`font-black text-indigo-700 tabular-nums ${isLargeText ? 'text-xl' : 'text-lg'}`}>
                        {formatCurrency(tx.total)}
                      </span>
                    </td>
                    {type === 'sale' && (
                      <td className="px-6 py-6">
                        <span className={`text-emerald-700 font-black bg-emerald-100/80 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm tabular-nums inline-block ${isLargeText ? 'text-lg' : 'text-sm'}`}>
                          {formatCurrency(tx.profit || 0)}+
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-6 text-center">
                      {tx.image ? (
                        <button 
                          onClick={() => setSelectedImage(tx.image!)}
                          className="w-12 h-12 rounded-xl border-2 border-slate-100 hover:border-indigo-400 hover:scale-105 transition-all shadow-sm overflow-hidden inline-block"
                        >
                          <img src={tx.image} alt="Receipt" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-medium italic">لا يوجد</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100/80 border-t-2 border-slate-200">
                <tr className="font-black text-slate-900">
                  <td className="px-6 py-6 whitespace-nowrap text-lg" colSpan={type === 'sale' ? 4 : 3}>
                    الإجمالي للمفلتر
                  </td>
                  <td className="px-6 py-6">
                    <span className={`tabular-nums ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
                      {formatCurrency(totals.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-6"></td>
                  {type === 'sale' && <td className="px-6 py-6"></td>}
                  <td className="px-6 py-6">
                    <span className={`text-indigo-800 tabular-nums ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
                      {formatCurrency(totals.total)}
                    </span>
                  </td>
                  {type === 'sale' && (
                    <td className="px-6 py-6">
                      <span className={`text-emerald-800 tabular-nums bg-emerald-200/50 px-4 py-2 rounded-xl border border-emerald-300 shadow-sm inline-block ${isLargeText ? 'text-xl' : 'text-lg'}`}>
                        {formatCurrency(totals.profit)}+
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-6"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-screen">
            <img src={selectedImage} alt="Large receipt" className="rounded-2xl shadow-2xl animate-in zoom-in duration-300 border-4 border-white/10" />
            <button className="absolute -top-12 right-0 text-white text-3xl hover:text-rose-400 transition-colors">
              <i className="fas fa-times-circle"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
