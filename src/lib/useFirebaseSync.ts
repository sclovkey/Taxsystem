import { useState, useEffect } from 'react';
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
import { Transaction, InventoryItem, StockBatch, StockOut, Asset, Supplier, Liability, EquityRecord } from '../types';

export function useFirebaseSync(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [equityRecords, setEquityRecords] = useState<EquityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setInventoryItems([]);
      setStockBatches([]);
      setStockOuts([]);
      setAssets([]);
      setSuppliers([]);
      setLiabilities([]);
      setEquityRecords([]);
      setLoading(false);
      return;
    }

    const userId = user.uid;
    const unsubscritbers: (() => void)[] = [];

    let loadedCounts = 0;
    const TOTAL_COLLECTIONS = 8;
    const checkLoaded = () => {
      loadedCounts++;
      if (loadedCounts >= TOTAL_COLLECTIONS) {
        setLoading(false);
      }
    };

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
    syncCollection('liabilities', setLiabilities);
    syncCollection('equityRecords', setEquityRecords);

    return () => unsubscritbers.forEach(unsub => unsub());
  }, [user]);

  const upsert = async (collName: string, id: string, data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/${collName}`;
    try {
      await setDoc(doc(db, path, id), { ...data, userId: user.uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${path}/${id}`);
    }
  };

  const remove = async (collName: string, id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/${collName}`;
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
    liabilities,
    equityRecords,
    loading,
    upsert,
    remove,
    setStockBatches // For internal batch updates if needed
  };
}
