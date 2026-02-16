
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'لوحة التحكم' },
    { id: 'purchases', icon: 'fa-file-invoice-dollar', label: 'عمليات الاستلام' },
    { id: 'sales', icon: 'fa-cash-register', label: 'عمليات البيع' },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: 'المخزون' },
    { id: 'reports', icon: 'fa-receipt', label: 'التقارير' },
    { id: 'settings', icon: 'fa-cog', label: 'الإعدادات والتكويد' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed right-0 top-0 flex flex-col shadow-xl z-20">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-xl font-bold">FX</div>
        <h1 className="text-xl font-bold tracking-tight">فوركس برو</h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-colors"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
