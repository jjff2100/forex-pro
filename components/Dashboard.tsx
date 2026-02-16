
import React from 'react';
import { Transaction, InventoryItem, CurrencyType } from '../types';
import { formatCurrency, calculateInventory } from '../utils/helpers';
import { CURRENCY_SYMBOLS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onViewAll }) => {
  const { totals } = calculateInventory(transactions);
  
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date.startsWith(today));
  
  const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const todayProfit = todayTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  
  const recentTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white/50 p-6 rounded-2xl border border-white backdrop-blur-sm shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">نظرة عامة</h2>
          <p className="text-slate-500 font-medium mt-1">مرحباً بك في نظام إدارة العملات الاحترافي</p>
        </div>
        <div className="text-left bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الأرباح" 
          value={formatCurrency(totalProfit)} 
          subtitle="منذ بدء النشاط"
          icon="fa-money-bill-trend-up" 
          color="bg-emerald-500"
        />
        <StatCard 
          title="أرباح اليوم" 
          value={formatCurrency(todayProfit)} 
          subtitle="الأداء اليومي"
          icon="fa-calendar-check" 
          color="bg-indigo-500"
        />
        <StatCard 
          title="عدد العمليات" 
          value={transactions.length.toString()} 
          subtitle="إجمالي التداولات"
          icon="fa-sync" 
          color="bg-amber-500"
        />
        <StatCard 
          title="العملات المتاحة" 
          value={Object.values(totals).filter(i => i.balance > 0).length.toString()} 
          subtitle="تنوع المحفظة"
          icon="fa-coins" 
          color="bg-sky-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800">أرصدة العملات المتاحة (إجمالي)</h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">تحديث فوري</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] text-right uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4 font-bold">العملة</th>
                  <th className="px-6 py-4 font-bold">الرصيد المتاح</th>
                  <th className="px-6 py-4 font-bold">متوسط سعر الشراء</th>
                  <th className="px-6 py-4 font-bold">القيمة التقديرية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.values(totals).map((item) => (
                  <tr key={item.currency} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-slate-600 text-sm shadow-inner border border-slate-200">
                          {CURRENCY_SYMBOLS[item.currency as CurrencyType]}
                        </div>
                        <span className="font-extrabold text-slate-800 text-lg">{item.currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-lg text-sm font-extrabold shadow-sm border ${item.balance > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                        {formatCurrency(item.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600">
                      {formatCurrency(item.avgCost)}
                    </td>
                    <td className="px-6 py-5 text-sm font-extrabold text-indigo-600 bg-indigo-50/20">
                      {formatCurrency(item.balance * item.avgCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800">أحدث العمليات</h3>
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-20 py-10">
                <i className="fas fa-folder-open text-6xl mb-4"></i>
                <p className="font-bold">لا توجد عمليات مؤخراً</p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all shadow-sm group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110 ${tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <i className={`fas ${tx.type === 'purchase' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-extrabold text-slate-800 truncate text-sm">{tx.partyName}</p>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{new Date(tx.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      <span className={`font-bold ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'purchase' ? 'استلام' : 'بيع'}
                      </span> {formatCurrency(tx.quantity)} {tx.currency}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 border-t border-slate-50 bg-slate-50/30 rounded-b-2xl">
             <button 
               onClick={onViewAll}
               className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-extrabold hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 border border-indigo-100"
             >
               <i className="fas fa-list-ul"></i>
               عرض كافة العمليات
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-100/20 z-10`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="z-10">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className="text-[10px] font-bold text-slate-500/80 mt-1">{subtitle}</p>
    </div>
    <div className="absolute -bottom-4 -left-4 opacity-[0.03] select-none pointer-events-none">
      <i className={`fas ${icon} text-9xl`}></i>
    </div>
  </div>
);

export default Dashboard;
