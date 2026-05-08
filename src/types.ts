export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  items?: { itemId: string; quantity: number; price?: number }[];
  relatedId?: string;
  relatedType?: 'stockBatch' | 'stockOut' | 'asset' | 'liability';
}

export interface Asset {
  id: string;
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLifePoints: number; // in years
  salvageValue: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

export interface StockBatch {
  id: string;
  itemId: string;
  date: string;
  quantity: number;
  remainingQuantity: number;
  pricePerUnit: number;
}

export interface StockOut {
  id: string;
  itemId: string;
  date: string;
  quantity: number;
  cogs: number; // Cost of Goods Sold calculated via FIFO
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  category: string;
}

export interface Liability {
  id: string;
  customerId: string;
  date: string;
  dueDate: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface EquityRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Initial' | 'Addition' | 'Withdrawal' | 'ProfitDist';
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
