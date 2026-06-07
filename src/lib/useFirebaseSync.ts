import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Transaction, InventoryItem, StockBatch, StockOut, Asset, Supplier, Customer, Liability, EquityRecord, MonthlyOpeningBalance } from '../types';

export function useFirebaseSync(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [equityRecords, setEquityRecords] = useState<EquityRecord[]>([]);
  const [monthlyOpeningBalances, setMonthlyOpeningBalances] = useState<MonthlyOpeningBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const stateSetters: Record<string, Dispatch<SetStateAction<any[]>>> = {
    transactions: setTransactions as any,
    inventoryItems: setInventoryItems as any,
    stockBatches: setStockBatches as any,
    stockOuts: setStockOuts as any,
    assets: setAssets as any,
    suppliers: setSuppliers as any,
    customers: setCustomers as any,
    liabilities: setLiabilities as any,
    equityRecords: setEquityRecords as any,
    monthlyOpeningBalances: setMonthlyOpeningBalances as any,
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setInventoryItems([]);
      setStockBatches([]);
      setStockOuts([]);
      setAssets([]);
      setSuppliers([]);
      setCustomers([]);
      setLiabilities([]);
      setEquityRecords([]);
      setMonthlyOpeningBalances([]);
      setLoading(false);
      return;
    }

    const userId = user.uid;
    const unsubscritbers: (() => void)[] = [];

    let loadedCounts = 0;
    const TOTAL_COLLECTIONS = 10;
    const checkLoaded = () => {
      loadedCounts++;
      if (loadedCounts >= TOTAL_COLLECTIONS) {
        setLoading(false);
      }
    };

    if (user.uid.startsWith('demo_')) {
      const loadDemoCollection = (name: string, setter: (data: any[]) => void, orderField: string = 'date') => {
        const localKey = `demo_finance_${name}`;
        const savedData = localStorage.getItem(localKey);
        let items = savedData ? JSON.parse(savedData) : [];
        
        items.sort((a: any, b: any) => {
          const valA = a[orderField];
          const valB = b[orderField];
          
          if (orderField === 'date' || orderField.toLowerCase().includes('date') || orderField === 'updatedAt') {
            return new Date(valB).getTime() - new Date(valA).getTime();
          }
          
          if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB);
          }
          
          return 0;
        });

        setter(items);
        checkLoaded();
      };

      loadDemoCollection('transactions', setTransactions);
      loadDemoCollection('inventoryItems', setInventoryItems, 'name');
      loadDemoCollection('stockBatches', setStockBatches);
      loadDemoCollection('stockOuts', setStockOuts);
      loadDemoCollection('assets', setAssets, 'purchaseDate');
      loadDemoCollection('suppliers', setSuppliers, 'name');
      loadDemoCollection('customers', setCustomers, 'name');
      loadDemoCollection('liabilities', setLiabilities);
      loadDemoCollection('equityRecords', setEquityRecords);
      loadDemoCollection('monthlyOpeningBalances', setMonthlyOpeningBalances, 'month');

      return;
    }

    const syncCollection = (name: string, setter: (data: any[]) => void, orderField: string = 'date') => {
      const path = `users/${userId}/${name}`;
      const unsub = onSnapshot(collection(db, path), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as any);
        
        // Sort in memory to avoid index requirements
        data.sort((a, b) => {
          const valA = a[orderField];
          const valB = b[orderField];
          
          if (orderField === 'date' || orderField.toLowerCase().includes('date') || orderField === 'updatedAt') {
            return new Date(valB).getTime() - new Date(valA).getTime();
          }
          
          if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB);
          }
          
          return 0;
        });

        setter(data);
        if (loading) checkLoaded();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (loading) checkLoaded();
      });
      unsubscritbers.push(unsub);
    };

    syncCollection('transactions', setTransactions);
    syncCollection('inventoryItems', setInventoryItems, 'name');
    syncCollection('stockBatches', setStockBatches);
    syncCollection('stockOuts', setStockOuts);
    syncCollection('assets', setAssets, 'purchaseDate');
    syncCollection('suppliers', setSuppliers, 'name');
    syncCollection('customers', setCustomers, 'name');
    syncCollection('liabilities', setLiabilities);
    syncCollection('equityRecords', setEquityRecords);
    syncCollection('monthlyOpeningBalances', setMonthlyOpeningBalances, 'month');

    return () => unsubscritbers.forEach(unsub => unsub());
  }, [user]);

  const upsert = async (collName: string, id: string, data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/${collName}`;

    if (user.uid.startsWith('demo_')) {
      const localKey = `demo_finance_${collName}`;
      const savedData = localStorage.getItem(localKey);
      let items = savedData ? JSON.parse(savedData) : [];
      
      const index = items.findIndex((item: any) => item.id === id);
      const updatedData = { ...data, userId: user.uid };
      if (index >= 0) {
        items[index] = updatedData;
      } else {
        items.push(updatedData);
      }
      localStorage.setItem(localKey, JSON.stringify(items));
      
      const orderFields: Record<string, string> = {
        transactions: 'date',
        inventoryItems: 'name',
        stockBatches: 'date',
        stockOuts: 'date',
        assets: 'purchaseDate',
        suppliers: 'name',
        customers: 'name',
        liabilities: 'date',
        equityRecords: 'date',
        monthlyOpeningBalances: 'month',
      };
      
      const orderField = orderFields[collName] || 'date';
      items.sort((a: any, b: any) => {
        const valA = a[orderField];
        const valB = b[orderField];
        
        if (orderField === 'date' || orderField.toLowerCase().includes('date') || orderField === 'updatedAt') {
          return new Date(valB).getTime() - new Date(valA).getTime();
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB);
        }
        
        return 0;
      });

      const setter = stateSetters[collName];
      if (setter) {
        setter([...items]);
      }
      return;
    }

    try {
      await setDoc(doc(db, path, id), { ...data, userId: user.uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`);
    }
  };

  const remove = async (collName: string, id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/${collName}`;

    if (user.uid.startsWith('demo_')) {
      const localKey = `demo_finance_${collName}`;
      const savedData = localStorage.getItem(localKey);
      let items = savedData ? JSON.parse(savedData) : [];
      
      items = items.filter((item: any) => item.id !== id);
      localStorage.setItem(localKey, JSON.stringify(items));
      
      const setter = stateSetters[collName];
      if (setter) {
        setter(items);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  };

  return {
    transactions,
    inventoryItems,
    stockBatches,
    stockOuts,
    assets,
    suppliers,
    customers,
    liabilities,
    equityRecords,
    monthlyOpeningBalances,
    loading,
    upsert,
    remove,
    setStockBatches // For internal batch updates if needed
  };
}
