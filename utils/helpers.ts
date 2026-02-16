
import { Transaction, InventoryItem } from '../types';
import * as XLSX from 'https://esm.sh/xlsx';

export const formatCurrency = (amount: number, currency: string = '') => {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + (currency ? ` ${currency}` : '');
};

export interface InventoryData {
  bySupplier: Record<string, Record<string, InventoryItem>>;
  totals: Record<string, InventoryItem>;
}

export const calculateInventory = (transactions: Transaction[]): InventoryData => {
  const bySupplier: Record<string, Record<string, InventoryItem>> = {};
  const totals: Record<string, InventoryItem> = {};

  transactions.forEach((tx) => {
    if (!totals[tx.currency]) {
      totals[tx.currency] = { currency: tx.currency, balance: 0, avgCost: 0 };
    }
    const globalItem = totals[tx.currency];

    const sName = tx.type === 'purchase' ? tx.partyName : (tx.supplierName || 'غير محدد');
    if (!bySupplier[sName]) {
      bySupplier[sName] = {};
    }
    if (!bySupplier[sName][tx.currency]) {
      bySupplier[sName][tx.currency] = { currency: tx.currency, balance: 0, avgCost: 0 };
    }
    const supplierItem = bySupplier[sName][tx.currency];

    if (tx.type === 'purchase') {
      const gTotalCost = (globalItem.balance * globalItem.avgCost) + tx.total;
      globalItem.balance += tx.quantity;
      globalItem.avgCost = globalItem.balance > 0 ? gTotalCost / globalItem.balance : 0;

      const sTotalCost = (supplierItem.balance * supplierItem.avgCost) + tx.total;
      supplierItem.balance += tx.quantity;
      supplierItem.avgCost = supplierItem.balance > 0 ? sTotalCost / supplierItem.balance : 0;
    } else {
      globalItem.balance -= tx.quantity;
      supplierItem.balance -= tx.quantity;
    }
  });

  return { bySupplier, totals };
};

/**
 * وظيفة تصدير احترافية إلى ملف Excel
 */
export const exportToExcel = (transactions: Transaction[], filename: string) => {
  if (transactions.length === 0) return;

  // تحضير البيانات بأسماء أعمدة عربية وتنسيق واضح
  const data = transactions.map(tx => ({
    'التاريخ والوقت': new Date(tx.date).toLocaleString('ar-SA'),
    'نوع العملية': tx.type === 'purchase' ? 'استلام' : 'بيع',
    'العميل / المورد': tx.partyName,
    'المورد المصدر': tx.supplierName || '-',
    'العملة': tx.currency,
    'الكمية': tx.quantity,
    'السعر': tx.price,
    'الإجمالي': tx.total,
    'التكلفة (للمبيعات)': tx.purchasePrice || '-',
    'الربح': tx.profit || 0,
    'ملاحظات': tx.notes || ''
  }));

  // إنشاء ورقة العمل
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // تحديد اتجاه الصفحة من اليمين لليسار (RTL)
  if (!worksheet['!margins']) worksheet['!margins'] = {};
  worksheet['!dir'] = 'rtl';

  // إنشاء كتاب العمل
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "العمليات");

  // تصدير الملف
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// الإبقاء على الوظيفة القديمة للتوافق إذا لزم الأمر
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
