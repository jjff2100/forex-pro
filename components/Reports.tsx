
import React, { useState } from 'react';
import { Transaction, CurrencyType } from '../types';
import { formatCurrency, exportToExcel } from '../utils/helpers';
import { CURRENCIES } from '../constants';

interface ReportsProps {
  transactions: Transaction[];
  suppliers: string[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, suppliers }) => {
  const [activeReportTab, setActiveReportTab] = useState<'general' | 'supplier'>('general');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isLargeText, setIsLargeText] = useState(false);

  // Quick range helper
  const setQuickRange = (range: 'today' | 'thisMonth' | 'lastMonth' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (range === 'today') {
      setDateRange({ start: todayStr, end: todayStr });
    } else if (range === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({ start: firstDay.toISOString().split('T')[0], end: todayStr });
    } else if (range === 'lastMonth') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setDateRange({ 
        start: firstDayLastMonth.toISOString().split('T')[0], 
        end: lastDayLastMonth.toISOString().split('T')[0] 
      });
    } else {
      setDateRange({ start: '', end: '' });
    }
  };

  // Filtering logic
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      try {
        const d = new Date(t.date).toISOString().split('T')[0];
        if (dateRange.start && d < dateRange.start) return false;
        if (dateRange.end && d > dateRange.end) return false;
        
        if (activeReportTab === 'supplier') {
          if (!selectedSupplier) return false;
          return (t.type === 'purchase' && t.partyName === selectedSupplier) || 
                 (t.type === 'sale' && t.supplierName === selectedSupplier);
        }
        
        return true;
      } catch (e) {
        return false;
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const stats = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'purchase') {
      acc.purchases += t.total;
    } else {
      acc.sales += t.total;
      acc.profit += t.profit || 0;
    }
    return acc;
  }, { purchases: 0, sales: 0, profit: 0 });

  const currencyBreakdown = Array.from(new Set(transactions.map(t => t.currency))).map(curr => {
    const txs = filteredTransactions.filter(t => t.currency === curr);
    const p = txs.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.total, 0);
    const s = txs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.total, 0);
    const pr = txs.filter(t => t.type === 'sale').reduce((sum, t) => sum + (t.profit || 0), 0);
    const qtyP = txs.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.quantity, 0);
    const qtyS = txs.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.quantity, 0);
    return { 
      currency: curr, 
      purchases: p, 
      sales: s, 
      profit: pr, 
      qtyP, 
      qtyS, 
      qtyRemaining: qtyP - qtyS 
    };
  }).filter(c => c.purchases > 0 || c.sales > 0);

  // Totals for Summary Footer
  const summaryTotals = currencyBreakdown.reduce((acc, curr) => {
    acc.qtyP += curr.qtyP;
    acc.purchases += curr.purchases;
    acc.qtyS += curr.qtyS;
    acc.sales += curr.sales;
    acc.profit += curr.profit;
    acc.qtyRemaining += curr.qtyRemaining;
    return acc;
  }, { qtyP: 0, purchases: 0, qtyS: 0, sales: 0, profit: 0, qtyRemaining: 0 });

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 ${isLargeText ? 'text-lg' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
          <button 
            onClick={() => setActiveReportTab('general')}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeReportTab === 'general' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            التقرير العام
          </button>
          <button 
            onClick={() => setActiveReportTab('supplier')}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeReportTab === 'supplier' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            تقرير الموردين
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setQuickRange('today')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${dateRange.start && dateRange.start === dateRange.end && dateRange.start === new Date().toISOString().split('T')[0] ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}
          >
            اليوم
          </button>
          <button 
            onClick={() => setQuickRange('thisMonth')}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold border bg-white border-slate-200 text-slate-600 hover:border-indigo-400 transition-all"
          >
            هذا الشهر
          </button>
          <button 
            onClick={() => setQuickRange('lastMonth')}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold border bg-white border-slate-200 text-slate-600 hover:border-indigo-400 transition-all"
          >
            الشهر الماضي
          </button>
          <button 
            onClick={() => setQuickRange('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${!dateRange.start && !dateRange.end ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
          >
            الكل
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto flex-1">
            {activeReportTab === 'supplier' && (
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">اختر المورد</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                >
                  <option value="">-- اختر مورد --</option>
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 mb-1">من تاريخ</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 mb-1">إلى تاريخ</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full lg:w-auto">
            <button 
              onClick={() => exportToExcel(filteredTransactions, activeReportTab === 'supplier' ? `كشف_حساب_${selectedSupplier}` : 'تقرير_عام_فوركس')}
              className="flex-1 lg:flex-none px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-100 text-sm"
            >
              <i className="fas fa-file-excel"></i> تصدير Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 lg:flex-none px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <i className="fas fa-print"></i> طباعة
            </button>
          </div>
        </div>
      </div>

      {activeReportTab === 'supplier' && !selectedSupplier ? (
        <div className="bg-white p-20 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
           <i className="fas fa-user-tag text-6xl mb-4 opacity-20"></i>
           <p className="text-lg font-bold text-center">يرجى اختيار مورد لعرض التقرير التفصيلي</p>
        </div>
      ) : (
        <>
          {/* Stats Cards with Large Font Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
             <div className="absolute -top-10 left-0">
               <button 
                 onClick={() => setIsLargeText(!isLargeText)}
                 className={`text-[11px] font-bold transition-all px-2 py-1 rounded-md ${isLargeText ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-slate-400 hover:text-indigo-600'}`}
               >
                 {isLargeText ? 'تصغير الخط' : 'تكبير الخط بالكامل'}
               </button>
             </div>
            
            {/* Sales Card - Purple */}
            <div className={`bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group transition-all`}>
              <i className="fas fa-money-bill-wave absolute -bottom-4 -left-4 text-8xl opacity-10 transition-transform group-hover:scale-110"></i>
              <div className="relative z-10 text-left">
                 <p className="text-white/80 text-sm font-bold uppercase tracking-wider text-right">إجمالي {activeReportTab === 'supplier' ? 'المبيعات منه' : 'المبيعات'}</p>
                 <h4 className={`font-black mt-2 text-right tracking-tight tabular-nums ${isLargeText ? 'text-4xl' : 'text-3xl'}`}>{formatCurrency(stats.sales)}</h4>
                 <p className="text-[10px] mt-2 text-white/60 text-right">{dateRange.start || dateRange.end ? 'الفترة المحددة' : 'كل الأوقات'}</p>
              </div>
            </div>

            {/* Profit Card - Green */}
            <div className={`bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group transition-all`}>
              <i className="fas fa-chart-line absolute -bottom-4 -left-4 text-8xl opacity-10 transition-transform group-hover:scale-110"></i>
              <div className="relative z-10 text-left">
                 <p className="text-white/80 text-sm font-bold uppercase tracking-wider text-right">صافي الأرباح</p>
                 <h4 className={`font-black mt-2 text-right tracking-tight tabular-nums ${isLargeText ? 'text-4xl' : 'text-3xl'}`}>{formatCurrency(stats.profit)}</h4>
                 <p className="text-[10px] mt-2 text-white/60 text-right">من العمليات المفلترة</p>
              </div>
            </div>

            {/* Purchases Card - Red */}
            <div className={`bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group transition-all`}>
              <i className="fas fa-file-invoice-dollar absolute -bottom-4 -left-4 text-8xl opacity-10 transition-transform group-hover:scale-110"></i>
              <div className="relative z-10 text-left">
                 <p className="text-white/80 text-sm font-bold uppercase tracking-wider text-right">إجمالي {activeReportTab === 'supplier' ? 'الاستلام منه' : 'المشتريات'}</p>
                 <h4 className={`font-black mt-2 text-right tracking-tight tabular-nums ${isLargeText ? 'text-4xl' : 'text-3xl'}`}>{formatCurrency(stats.purchases)}</h4>
                 <p className="text-[10px] mt-2 text-white/60 text-right">تكلفة الاستلام</p>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {activeReportTab === 'supplier' ? `كشف حساب المورد: ${selectedSupplier}` : 'ملخص الأداء حسب العملة'}
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                {filteredTransactions.length} عملية
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">العملة</th>
                    <th className="px-6 py-4">الكمية المستلمة</th>
                    <th className="px-6 py-4">القيمة المستلمة</th>
                    <th className="px-6 py-4">الكمية المباعة</th>
                    <th className="px-6 py-4">قيمة المبيعات</th>
                    <th className="px-6 py-4 text-emerald-600">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currencyBreakdown.map(c => (
                    <tr key={c.currency} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6">
                        <span className={`font-black text-slate-800 ${isLargeText ? 'text-xl' : 'text-lg'}`}>{c.currency}</span>
                      </td>
                      <td className={`px-6 py-6 text-slate-600 font-bold tabular-nums ${isLargeText ? 'text-lg' : 'text-base'}`}>{formatCurrency(c.qtyP)}</td>
                      <td className={`px-6 py-6 text-slate-400 font-medium tabular-nums ${isLargeText ? 'text-base' : 'text-[11px]'}`}>{formatCurrency(c.purchases)}</td>
                      <td className={`px-6 py-6 text-rose-500 font-bold tabular-nums ${isLargeText ? 'text-lg' : 'text-base'}`}>{formatCurrency(c.qtyS)}</td>
                      <td className={`px-6 py-6 text-slate-400 font-medium tabular-nums ${isLargeText ? 'text-base' : 'text-[11px]'}`}>{formatCurrency(c.sales)}</td>
                      <td className="px-6 py-6">
                         <span className={`text-emerald-600 font-black bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100 tabular-nums ${isLargeText ? 'text-xl' : 'text-lg'}`}>
                          {formatCurrency(c.profit)}+
                         </span>
                      </td>
                    </tr>
                  ))}
                  {currencyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium italic">
                        لا توجد بيانات للفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
                {currencyBreakdown.length > 0 && (
                  <tfoot className="bg-slate-100/80 border-t-2 border-slate-200">
                    <tr className="font-black text-slate-900">
                      <td className="px-6 py-6">الإجمالي</td>
                      <td className={`px-6 py-6 tabular-nums ${isLargeText ? 'text-xl' : 'text-lg'}`}>{formatCurrency(summaryTotals.qtyP)}</td>
                      <td className={`px-6 py-6 tabular-nums ${isLargeText ? 'text-base' : 'text-[11px]'} text-slate-500`}>{formatCurrency(summaryTotals.purchases)}</td>
                      <td className={`px-6 py-6 tabular-nums ${isLargeText ? 'text-xl' : 'text-lg'} text-rose-600`}>{formatCurrency(summaryTotals.qtyS)}</td>
                      <td className={`px-6 py-6 tabular-nums ${isLargeText ? 'text-base' : 'text-[11px]'} text-slate-500`}>{formatCurrency(summaryTotals.sales)}</td>
                      <td className="px-6 py-6">
                         <span className={`text-emerald-800 font-black bg-emerald-200/40 px-3 py-1.5 rounded-lg border border-emerald-200 tabular-nums ${isLargeText ? 'text-xl' : 'text-lg'}`}>
                          {formatCurrency(summaryTotals.profit)}+
                         </span>
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/50 border-t border-slate-100">
                      <td colSpan={3} className="px-6 py-4 text-indigo-700 font-black text-base">الكمية المتبقية (صافي):</td>
                      <td colSpan={3} className="px-6 py-4">
                        <span className={`text-indigo-900 font-black bg-white px-5 py-2 rounded-xl border-2 border-indigo-200 shadow-sm tabular-nums ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
                           {formatCurrency(summaryTotals.qtyRemaining)}+
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {activeReportTab === 'supplier' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-base">الحركة التفصيلية</h3>
                <i className="fas fa-history text-slate-300"></i>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse table-auto">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                      <th className="px-6 py-4">التاريخ</th>
                      <th className="px-6 py-4">نوع العملية</th>
                      <th className="px-6 py-4">البيان (الطرف الآخر)</th>
                      <th className="px-6 py-4">العملة</th>
                      <th className="px-6 py-4">الكمية</th>
                      <th className="px-6 py-4">السعر</th>
                      <th className="px-6 py-4 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap text-[10px] text-slate-500">
                          <div className="font-bold text-slate-700">{new Date(tx.date).toLocaleDateString('ar-SA')}</div>
                          <div className="opacity-60">{new Date(tx.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${tx.type === 'purchase' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-indigo-600 bg-indigo-50 border-indigo-100'}`}>
                            {tx.type === 'purchase' ? 'استلام من مورد' : 'بيع من مخزون المورد'}
                          </span>
                        </td>
                        <td className={`px-6 py-5 font-bold text-slate-700 ${isLargeText ? 'text-base' : 'text-xs'}`}>
                          {tx.type === 'purchase' ? '-' : tx.partyName}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`font-black text-slate-500 ${isLargeText ? 'text-lg' : 'text-sm'}`}>{tx.currency}</span>
                        </td>
                        <td className={`px-6 py-5 font-bold text-slate-900 tabular-nums ${isLargeText ? 'text-xl' : 'text-sm'}`}>
                          {formatCurrency(tx.quantity)}
                        </td>
                        <td className={`px-6 py-5 text-slate-500 tabular-nums ${isLargeText ? 'text-lg' : 'text-[11px]'}`}>
                          {formatCurrency(tx.price)}
                        </td>
                        <td className={`px-6 py-5 font-bold text-slate-900 tabular-nums ${isLargeText ? 'text-xl' : 'text-sm'}`}>
                          {formatCurrency(tx.total)}
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">
                          لا توجد عمليات مسجلة في هذه الفترة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
