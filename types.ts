
export enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  AED = 'AED',
  SAR = 'SAR',
  EGP = 'EGP',
  TRY = 'TRY'
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale';
  partyName: string; // Supplier name (for purchase) or Customer name (for sale)
  supplierName?: string; // The source supplier (used in sales to track whose stock is being sold)
  currency: string;
  quantity: number;
  price: number;
  purchasePrice?: number; // The cost price at time of sale (for sales)
  total: number;
  profit?: number; // Only for sales
  date: string;
  image?: string;
  notes?: string;
}

export interface InventoryItem {
  currency: string;
  balance: number;
  avgCost: number;
}

export interface AppState {
  transactions: Transaction[];
  suppliers: string[];
  activeCurrencies: string[];
  isAuthenticated: boolean;
  currentUser: string | null;
}
