
import React, { useState, useEffect } from 'react';
import { Transaction, CurrencyType, InventoryItem } from './types';
import { calculateInventory } from './utils/helpers';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionsList from './components/TransactionsList';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { CURRENCIES, INITIAL_SUPPLIERS } from './constants';
import { db, isFirebaseValid } from './firebase';
// Fix: Update imports to use ESM.sh URLs to match firebase.ts resolution and ensure correct SDK behavior
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  getDoc 
} from "https://esm.sh/firebase/firestore";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showForm, setShowForm] = useState<'purchase' | 'sale' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [persistenceMode, setPersistenceMode] = useState<'cloud' | 'local'>('local');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>(INITIAL_SUPPLIERS);
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>(CURRENCIES);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('forex_pro_auth') === 'true';
  });
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // التحميل الأولي من LocalStorage لضمان سرعة الاستجابة
  useEffect(() => {
    const localTxs = localStorage.getItem('fx_transactions');
    const localSuppliers = localStorage.getItem('fx_suppliers');
    const localCurrencies = localStorage.getItem('fx_currencies');

    if (localTxs) setTransactions(JSON.parse(localTxs));
    if (localSuppliers) setSuppliers(JSON.parse(localSuppliers));
    if (localCurrencies) setActiveCurrencies(JSON.parse(localCurrencies));
    
    // إذا لم تكن إعدادات Firebase صالحة، نتوقف عن التحميل فوراً ونعمل محلياً
    if (!isFirebaseValid) {
      setPersistenceMode('local');
      setIsLoading(false);
    }
  }, []);

  // 1. مزامنة العمليات من Firestore (فقط إذا كان صالحاً)
  useEffect(() => {
    if (!isAuthenticated || !isFirebaseValid || !db) return;

    try {
      const q = query(collection(db, "transactions"), orderBy("date", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const txs: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(txs);
        localStorage.setItem('fx_transactions', JSON.stringify(txs));
        setPersistenceMode('cloud');
        setIsLoading(false);
      }, (error) => {
        console.warn("Firestore error, falling back to local mode:", error);
        setPersistenceMode('local');
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      setPersistenceMode('local');
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 2. مزامنة الإعدادات من Firestore
  useEffect(() => {
    if (!isAuthenticated || !isFirebaseValid || !db) return;

    const fetchSettings = async () => {
      try {
        const configDoc = await getDoc(doc(db, "app_config", "settings"));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.suppliers) {
            setSuppliers(data.suppliers);
            localStorage.setItem('fx_suppliers', JSON.stringify(data.suppliers));
          }
          if (data.activeCurrencies) {
            setActiveCurrencies(data.activeCurrencies);
            localStorage.setItem('fx_currencies', JSON.stringify(data.activeCurrencies));
          }
        }
      } catch (e) {
        console.warn("Could not fetch cloud settings");
      }
    };

    fetchSettings();
  }, [isAuthenticated]);

  const inventoryData = calculateInventory(transactions);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username.trim() === 'admin' && loginData.password.trim() === '123456') {
      setIsAuthenticated(true);
      localStorage.setItem('forex_pro_auth', 'true');
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور (admin / 123456)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('forex_pro_auth');
    setLoginData({ username: '', password: '' });
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'total' | 'profit' | 'purchasePrice'>) => {
    const total = data.quantity * data.price;
    let profit = 0;
    let purchasePrice = 0;

    if (data.type === 'sale') {
      const sName = data.supplierName || 'غير محدد';
      purchasePrice = inventoryData.bySupplier[sName]?.[data.currency]?.avgCost || 0;
      profit = (data.price - purchasePrice) * data.quantity;
    }

    const newTx: Transaction = {
      ...data,
      id: Date.now().toString(),
      total,
      purchasePrice: data.type === 'sale' ? purchasePrice : 0,
      profit: data.type === 'sale' ? profit : 0,
    };

    // التحديث المحلي دائماً
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    localStorage.setItem('fx_transactions', JSON.stringify(updatedTxs));

    // محاولة التحديث السحابي
    if (isFirebaseValid && db) {
      try {
        await addDoc(collection(db, "transactions"), { ...newTx, id: undefined });
      } catch (e) {
        console.error("Cloud save failed, data is only saved locally.");
      }
    }
  };

  const saveSettings = async (newSuppliers: string[], newCurrencies: string[]) => {
    setSuppliers(newSuppliers);
    setActiveCurrencies(newCurrencies);
    localStorage.setItem('fx_suppliers', JSON.stringify(newSuppliers));
    localStorage.setItem('fx_currencies', JSON.stringify(newCurrencies));

    if (isFirebaseValid && db) {
      try {
        await setDoc(doc(db, "app_config", "settings"), {
          suppliers: newSuppliers,
          activeCurrencies: newCurrencies,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {
        console.error("Cloud settings save failed");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-indigo-200">FX</div>
            <h1 className="text-2xl font-bold text-slate-800">نظام فوركس برو</h1>
            <p className="text-slate-500 mt-2 font-medium italic">إدارة محاسبية احترافية</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={loginData.username}
                onChange={e => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={loginData.password}
                onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-indigo-500 h-12 w-12 mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">جاري تهيئة النظام...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 mr-64 p-8 overflow-y-auto">
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex gap-2">
            <button onClick={() => setShowForm('purchase')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all active:scale-95 shadow-sm">
              <i className="fas fa-plus-circle"></i> استلام جديد
            </button>
            <button onClick={() => setShowForm('sale')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 shadow-sm">
              <i className="fas fa-hand-holding-usd"></i> عملية بيع
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${persistenceMode === 'cloud' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${persistenceMode === 'cloud' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <span className="text-[10px] font-bold">{persistenceMode === 'cloud' ? 'سحابي متصل' : 'وضع محلي (تخزين المتصفح)'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">M</div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} onViewAll={() => setActiveTab('sales')} />}
          {activeTab === 'purchases' && <TransactionsList type="purchase" transactions={transactions} />}
          {activeTab === 'sales' && <TransactionsList type="sale" transactions={transactions} />}
          {activeTab === 'reports' && <Reports transactions={transactions} suppliers={suppliers} />}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="text-xl font-bold mb-6 text-indigo-900 border-r-4 border-indigo-600 pr-4">تفاصيل المخزون الفوري</h3>
               <Dashboard transactions={transactions} onViewAll={() => setActiveTab('sales')} />
            </div>
          )}
          {activeTab === 'settings' && (
            <Settings 
              suppliers={suppliers} 
              setSuppliers={(s) => saveSettings(s, activeCurrencies)}
              activeCurrencies={activeCurrencies}
              setActiveCurrencies={(c) => saveSettings(suppliers, c)}
            />
          )}
        </div>
      </main>

      {showForm && (
        <TransactionForm
          type={showForm}
          inventory={inventoryData}
          suppliers={suppliers}
          currencies={activeCurrencies}
          onClose={() => setShowForm(null)}
          onSubmit={addTransaction}
        />
      )}
    </div>
  );
};

export default App;
