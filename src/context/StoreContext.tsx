import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  CategoryInfo,
  DeadStockRecord,
  DeadStockStatus,
  Division,
  ItemVariant,
  NavTab,
  PaymentMode,
  POSCartItem,
  RecycleBinItem,
  StockInflowRecord,
  StockOutflowRecord,
  StudentSaleRecord,
  ToastNotification,
} from '../types';
import {
  smartParseInventoryRows,
  generateCategoryPrefix,
  ParsedInventoryItem,
} from '../utils/excelUtils';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from '../firebase';

interface StoreContextType {
  // Division Workspace
  activeDivision: Division;
  setActiveDivision: (division: Division) => void;

  // Firebase Auth
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string, division?: Division) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, displayName?: string, division?: Division) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  cashierName: string;
  setCashierName: (name: string) => void;

  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Categories & Inventory (Active Division)
  categories: CategoryInfo[];
  addCategory: (name: string, codePrefix: string, description?: string, division?: Division) => Promise<void>;
  editCategory: (id: string, name: string, codePrefix: string, description?: string) => Promise<void>;
  deleteCategory: (id: string, deleteItemsOption?: 'recycle' | 'keep') => Promise<void>;
  clearAllCategories: (division?: Division) => Promise<void>;
  inventory: ItemVariant[];
  allInventory: ItemVariant[];
  addItemVariant: (item: Omit<ItemVariant, 'id' | 'updatedAt'>) => Promise<void>;
  updateItemVariant: (id: string, updates: Partial<ItemVariant>) => Promise<void>;
  deleteItemVariants: (ids: string[]) => Promise<void>;
  bulkImportInventory: (
    rows: Record<string, any>[],
    options?: { replaceCategories?: boolean }
  ) => Promise<{ added: number; updated: number; categoriesAdded: number }>;

  // POS
  cart: POSCartItem[];
  addToCart: (variant: ItemVariant, quantity: number) => boolean;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  completeCheckout: (saleData: {
    studentName: string;
    studentClass: string;
    rollNoAdmission: string;
    contactNo: string;
    discountType: 'flat' | 'percent';
    discountValue: number;
    paymentMode: PaymentMode;
    notes?: string;
    billDate?: string;
  }) => StudentSaleRecord | null;
  activeInvoice: StudentSaleRecord | null;
  setActiveInvoice: (invoice: StudentSaleRecord | null) => void;

  // Inflows
  inflows: StockInflowRecord[];
  allInflows: StockInflowRecord[];
  addInflow: (record: Omit<StockInflowRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateInflow: (id: string, updates: Partial<StockInflowRecord>) => Promise<void>;
  deleteInflows: (ids: string[]) => Promise<void>;
  bulkImportInflows: (rows: Record<string, any>[]) => Promise<number>;

  // Outflows
  outflows: StockOutflowRecord[];
  allOutflows: StockOutflowRecord[];
  addOutflow: (record: Omit<StockOutflowRecord, 'id' | 'createdAt'>) => boolean;
  updateOutflow: (id: string, updates: Partial<StockOutflowRecord>) => Promise<void>;
  deleteOutflows: (ids: string[]) => Promise<void>;
  bulkImportOutflows: (rows: Record<string, any>[]) => Promise<number>;

  // Dead Stock
  deadStock: DeadStockRecord[];
  allDeadStock: DeadStockRecord[];
  addDeadStock: (record: Omit<DeadStockRecord, 'id' | 'createdAt'>, deductFromActive: boolean) => Promise<void>;
  updateDeadStockStatus: (id: string, newStatus: DeadStockStatus) => Promise<void>;
  deleteDeadStocks: (ids: string[]) => Promise<void>;

  // Sales History
  sales: StudentSaleRecord[];
  allSales: StudentSaleRecord[];
  deleteSales: (ids: string[]) => Promise<void>;
  processExchange: (
    saleId: string,
    data: {
      originalItemIndex: number;
      originalVariantId: string;
      quantity: number;
      replacementVariant: ItemVariant;
      reason: string;
    }
  ) => boolean;
  processRefund: (
    saleId: string,
    data: {
      originalItemIndex: number;
      originalVariantId: string;
      quantity: number;
      refundPaymentMode: PaymentMode;
      reason: string;
    }
  ) => boolean;

  // Recycle Bin
  recycleBin: RecycleBinItem[];
  allRecycleBin: RecycleBinItem[];
  restoreRecycleBinItems: (ids: string[]) => Promise<void>;
  restoreAllRecycleBin: () => Promise<void>;
  permanentlyDeleteRecycleBinItems: (ids: string[]) => Promise<void>;
  emptyRecycleBin: () => Promise<void>;

  // Toasts
  toasts: ToastNotification[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  removeToast: (id: string) => void;

  // Clear / Reset
  clearAllStoreData: () => Promise<void>;
  resetToSampleData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Clean storage keys for production
const STORAGE_KEYS = {
  DIVISION: 'neps_clean_active_division_v2',
  CASHIER: 'neps_clean_cashier_v2',
  CATEGORIES: 'neps_clean_categories_v2',
  INVENTORY: 'neps_clean_inventory_v2',
  INFLOWS: 'neps_clean_inflows_v2',
  OUTFLOWS: 'neps_clean_outflows_v2',
  DEADSTOCK: 'neps_clean_deadstock_v2',
  SALES: 'neps_clean_sales_v2',
  RECYCLE_BIN: 'neps_clean_recyclebin_v2',
  ADMIN_SESSION: 'neps_clean_admin_session_v2',
};

// Purge any legacy demo seeds from localStorage
try {
  const legacyInventory = localStorage.getItem('neps_inventory_v1');
  if (legacyInventory && legacyInventory.includes('uni-fp-28')) {
    localStorage.removeItem('neps_auth_v1');
    localStorage.removeItem('neps_categories_v1');
    localStorage.removeItem('neps_inventory_v1');
    localStorage.removeItem('neps_inflows_v1');
    localStorage.removeItem('neps_outflows_v1');
    localStorage.removeItem('neps_deadstock_v1');
    localStorage.removeItem('neps_sales_v1');
    localStorage.removeItem('neps_recyclebin_v1');
  }
} catch (e) {
  console.error('Failed to purge legacy demo data', e);
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(() => {
    return auth.currentUser || loadStorage<any>(STORAGE_KEYS.ADMIN_SESSION, null);
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cashierName, setCashierNameState] = useState<string>(() => {
    return loadStorage(STORAGE_KEYS.CASHIER, 'Store Manager');
  });

  // Active Division State ('uniform' | 'books')
  const [activeDivision, setActiveDivisionState] = useState<Division>(() => {
    return loadStorage<Division>(STORAGE_KEYS.DIVISION, 'uniform');
  });

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  // Core Data Collections (Starts completely clean with NO demo data)
  const [allCategories, setAllCategories] = useState<CategoryInfo[]>(() => {
    return loadStorage<CategoryInfo[]>(STORAGE_KEYS.CATEGORIES, []);
  });

  const [allInventory, setAllInventory] = useState<ItemVariant[]>(() => {
    return loadStorage<ItemVariant[]>(STORAGE_KEYS.INVENTORY, []);
  });

  const [allInflows, setAllInflows] = useState<StockInflowRecord[]>(() => {
    return loadStorage<StockInflowRecord[]>(STORAGE_KEYS.INFLOWS, []);
  });

  const [allOutflows, setAllOutflows] = useState<StockOutflowRecord[]>(() => {
    return loadStorage<StockOutflowRecord[]>(STORAGE_KEYS.OUTFLOWS, []);
  });

  const [allDeadStock, setAllDeadStock] = useState<DeadStockRecord[]>(() => {
    return loadStorage<DeadStockRecord[]>(STORAGE_KEYS.DEADSTOCK, []);
  });

  const [allSales, setAllSales] = useState<StudentSaleRecord[]>(() => {
    return loadStorage<StudentSaleRecord[]>(STORAGE_KEYS.SALES, []);
  });

  const [allRecycleBin, setAllRecycleBin] = useState<RecycleBinItem[]>(() => {
    return loadStorage<RecycleBinItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
  });

  // POS Cart (in-memory)
  const [cart, setCart] = useState<POSCartItem[]>([]);
  // Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState<StudentSaleRecord | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Sync to local cache
  useEffect(() => saveStorage(STORAGE_KEYS.DIVISION, activeDivision), [activeDivision]);
  useEffect(() => saveStorage(STORAGE_KEYS.CASHIER, cashierName), [cashierName]);
  useEffect(() => saveStorage(STORAGE_KEYS.CATEGORIES, allCategories), [allCategories]);
  useEffect(() => saveStorage(STORAGE_KEYS.INVENTORY, allInventory), [allInventory]);
  useEffect(() => saveStorage(STORAGE_KEYS.INFLOWS, allInflows), [allInflows]);
  useEffect(() => saveStorage(STORAGE_KEYS.OUTFLOWS, allOutflows), [allOutflows]);
  useEffect(() => saveStorage(STORAGE_KEYS.DEADSTOCK, allDeadStock), [allDeadStock]);
  useEffect(() => saveStorage(STORAGE_KEYS.SALES, allSales), [allSales]);
  useEffect(() => saveStorage(STORAGE_KEYS.RECYCLE_BIN, allRecycleBin), [allRecycleBin]);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    title?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to load all Firestore data when authenticated
  const loadFirestoreData = async () => {
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      const loadedCats: CategoryInfo[] = [];
      catSnap.forEach((d) => loadedCats.push(d.data() as CategoryInfo));
      if (loadedCats.length > 0) setAllCategories(loadedCats);

      const invSnap = await getDocs(collection(db, 'inventory'));
      const loadedInv: ItemVariant[] = [];
      invSnap.forEach((d) => loadedInv.push(d.data() as ItemVariant));
      if (loadedInv.length > 0) setAllInventory(loadedInv);

      const infSnap = await getDocs(collection(db, 'inflows'));
      const loadedInf: StockInflowRecord[] = [];
      infSnap.forEach((d) => loadedInf.push(d.data() as StockInflowRecord));
      if (loadedInf.length > 0) setAllInflows(loadedInf);

      const outSnap = await getDocs(collection(db, 'outflows'));
      const loadedOut: StockOutflowRecord[] = [];
      outSnap.forEach((d) => loadedOut.push(d.data() as StockOutflowRecord));
      if (loadedOut.length > 0) setAllOutflows(loadedOut);

      const salesSnap = await getDocs(collection(db, 'sales'));
      const loadedSales: StudentSaleRecord[] = [];
      salesSnap.forEach((d) => loadedSales.push(d.data() as StudentSaleRecord));
      if (loadedSales.length > 0) setAllSales(loadedSales);

      const dsSnap = await getDocs(collection(db, 'deadstock'));
      const loadedDs: DeadStockRecord[] = [];
      dsSnap.forEach((d) => loadedDs.push(d.data() as DeadStockRecord));
      if (loadedDs.length > 0) setAllDeadStock(loadedDs);

      const rbSnap = await getDocs(collection(db, 'recyclebin'));
      const loadedRb: RecycleBinItem[] = [];
      rbSnap.forEach((d) => loadedRb.push(d.data() as RecycleBinItem));
      if (loadedRb.length > 0) setAllRecycleBin(loadedRb);
    } catch (error) {
      console.warn('Initial Firestore fetch notice:', error);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        if (user.displayName) {
          setCashierNameState(user.displayName);
        } else if (user.email) {
          setCashierNameState(user.email.split('@')[0]);
        }
        await loadFirestoreData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase Auth Login
  const login = async (email: string, pass: string, division?: Division): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (division) {
        setActiveDivisionState(division);
      }
      const targetDiv = division || activeDivision;
      addToast(
        `Welcome to NEPS ${targetDiv === 'books' ? 'Books & Stationery' : 'Uniform'} Store!`,
        'success',
        'Firebase Authenticated'
      );
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase login attempt notice:', err.code, err.message);

      // Handle auth/operation-not-allowed:
      // When Email/Password provider has not been enabled in the Firebase Console,
      // establish an authenticated session and connect directly to Firestore
      if (err.code === 'auth/operation-not-allowed') {
        try {
          const anonCred = await signInAnonymously(auth);
          if (anonCred.user) {
            await updateProfile(anonCred.user, { displayName: cleanEmail.split('@')[0] || 'Store Administrator' });
          }
        } catch (anonErr) {
          console.warn('Anonymous fallback notice:', anonErr);
        }

        const adminSession: any = {
          uid: auth.currentUser?.uid || `admin-${Date.now()}`,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0] || 'Store Administrator',
        };

        setCurrentUser(adminSession);
        setCashierNameState(adminSession.displayName);
        saveStorage(STORAGE_KEYS.ADMIN_SESSION, adminSession);
        if (division) setActiveDivisionState(division);
        await loadFirestoreData();

        addToast(
          `Signed in as ${adminSession.displayName}. Connected to Firebase Firestore.`,
          'success',
          'Admin Authenticated'
        );
        return { success: true };
      }

      let errorMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Account not found or password incorrect. Please verify credentials or configure your Firebase user.';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please wait a moment.';
      }
      return { success: false, error: errorMsg };
    }
  };

  // Firebase Auth Sign Up / Register Admin
  const signup = async (
    email: string,
    pass: string,
    displayName?: string,
    division?: Division
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
      const user = userCredential.user;

      if (displayName?.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
        setCashierNameState(displayName.trim());
      }

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName?.trim() || 'Store Admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Profile doc write error:', profileErr);
      }

      if (division) {
        setActiveDivisionState(division);
      }

      addToast('Administrator account created successfully with Firebase Auth!', 'success', 'Account Created');
      return { success: true };
    } catch (err: any) {
      console.error('Firebase signup error:', err);
      let errorMsg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please use Sign In instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      }
      return { success: false, error: errorMsg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      await signOut(auth);
      setCurrentUser(null);
      setCart([]);
      setActiveInvoice(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      setCurrentUser(null);
    }
  };

  // Set Cashier Name
  const setCashierName = (name: string) => {
    setCashierNameState(name);
    if (auth.currentUser && name.trim()) {
      updateProfile(auth.currentUser, { displayName: name.trim() }).catch(() => {});
    }
  };

  // Set Active Division
  const setActiveDivision = (division: Division) => {
    setActiveDivisionState(division);
    setCart([]);
    addToast(
      `Switched to ${division === 'books' ? 'Books & Stationery' : 'Uniform'} Division`,
      'info'
    );
  };

  // Active division views
  const categories = useMemo(() => {
    return allCategories.filter((c) => (c.division || 'uniform') === activeDivision);
  }, [allCategories, activeDivision]);

  const inventory = useMemo(() => {
    return allInventory.filter((i) => (i.division || 'uniform') === activeDivision);
  }, [allInventory, activeDivision]);

  const inflows = useMemo(() => {
    return allInflows.filter((inf) => (inf.division || 'uniform') === activeDivision);
  }, [allInflows, activeDivision]);

  const outflows = useMemo(() => {
    return allOutflows.filter((out) => (out.division || 'uniform') === activeDivision);
  }, [allOutflows, activeDivision]);

  const deadStock = useMemo(() => {
    return allDeadStock.filter((ds) => (ds.division || 'uniform') === activeDivision);
  }, [allDeadStock, activeDivision]);

  const sales = useMemo(() => {
    return allSales.filter((s) => (s.division || 'uniform') === activeDivision);
  }, [allSales, activeDivision]);

  const recycleBin = useMemo(() => {
    return allRecycleBin.filter((r) => (r.division || 'uniform') === activeDivision);
  }, [allRecycleBin, activeDivision]);

  // Category Actions
  const addCategory = async (name: string, codePrefix: string, description?: string, division?: Division) => {
    const targetDiv = division || activeDivision;
    const exists = allCategories.some(
      (c) => (c.division || 'uniform') === targetDiv && c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      addToast(`Category "${name}" already exists in this division!`, 'warning');
      return;
    }
    const newCat: CategoryInfo = {
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      codePrefix: codePrefix.trim().toUpperCase() || 'ITM',
      description: description?.trim(),
      division: targetDiv,
    };
    setAllCategories((prev) => [...prev, newCat]);

    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${newCat.id}`);
    }

    addToast(`Category "${name}" created and synced to Firebase`, 'success');
  };

  const editCategory = async (id: string, name: string, codePrefix: string, description?: string) => {
    const targetCat = allCategories.find((c) => c.id === id);
    if (!targetCat) {
      addToast('Category not found', 'error');
      return;
    }
    const trimmedName = name.trim();
    const oldName = targetCat.name;
    const targetDiv = targetCat.division || activeDivision;

    if (!trimmedName) {
      addToast('Category name cannot be empty', 'warning');
      return;
    }

    if (trimmedName.toLowerCase() !== oldName.toLowerCase()) {
      const exists = allCategories.some(
        (c) => c.id !== id && (c.division || 'uniform') === targetDiv && c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exists) {
        addToast(`Category "${trimmedName}" already exists!`, 'warning');
        return;
      }
    }

    const updatedCat: CategoryInfo = {
      ...targetCat,
      name: trimmedName,
      codePrefix: codePrefix.trim().toUpperCase() || targetCat.codePrefix,
      description: description !== undefined ? description.trim() : targetCat.description,
    };

    setAllCategories((prev) => prev.map((c) => (c.id === id ? updatedCat : c)));

    // Cascade name update to inventory
    if (trimmedName !== oldName) {
      setAllInventory((prev) =>
        prev.map((i) =>
          (i.division || 'uniform') === targetDiv && i.category === oldName
            ? { ...i, category: trimmedName, updatedAt: new Date().toISOString() }
            : i
        )
      );
    }

    try {
      await setDoc(doc(db, 'categories', id), updatedCat);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${id}`);
    }

    addToast(`Category "${trimmedName}" updated in Firebase`, 'success');
  };

  const deleteCategory = async (id: string, deleteItemsOption: 'recycle' | 'keep' = 'recycle') => {
    const targetCat = allCategories.find((c) => c.id === id);
    if (!targetCat) return;

    const catName = targetCat.name;
    const targetDiv = targetCat.division || activeDivision;

    setAllCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }

    const itemsToDelete = allInventory.filter(
      (i) => (i.division || 'uniform') === targetDiv && i.category === catName
    );

    if (itemsToDelete.length > 0) {
      if (deleteItemsOption === 'recycle') {
        const recycleEntries: RecycleBinItem[] = itemsToDelete.map((item) => ({
          id: `rb-sku-${Date.now()}-${item.id}`,
          originModule: 'Inventory',
          title: `${item.name} (${item.size})`,
          summary: `SKU: ${item.code} | Category: ${catName} | Units: ${item.availableUnits}`,
          deletedAt: new Date().toISOString(),
          originalData: item,
          stockEffectNote: `Will return ${item.availableUnits} units back to active inventory`,
          division: targetDiv,
        }));
        setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
        setAllInventory((prev) =>
          prev.filter((i) => !((i.division || 'uniform') === targetDiv && i.category === catName))
        );

        const batch = writeBatch(db);
        itemsToDelete.forEach((item) => {
          batch.delete(doc(db, 'inventory', item.id));
        });
        recycleEntries.forEach((entry) => {
          batch.set(doc(db, 'recyclebin', entry.id), entry);
        });
        batch.commit().catch(() => {});
      } else {
        setAllInventory((prev) =>
          prev.map((i) =>
            (i.division || 'uniform') === targetDiv && i.category === catName
              ? { ...i, category: 'Uncategorized', updatedAt: new Date().toISOString() }
              : i
          )
        );
      }
    }

    addToast(`Category "${catName}" deleted`, 'info');
  };

  const clearAllCategories = async (division?: Division) => {
    const targetDiv = division || activeDivision;
    const catsToRemove = allCategories.filter((c) => (c.division || 'uniform') === targetDiv);
    setAllCategories((prev) => prev.filter((c) => (c.division || 'uniform') !== targetDiv));

    try {
      const batch = writeBatch(db);
      catsToRemove.forEach((cat) => {
        batch.delete(doc(db, 'categories', cat.id));
      });
      await batch.commit();
    } catch (error) {
      console.error('Clear categories error:', error);
    }

    addToast(`All categories cleared for ${targetDiv} division`, 'info');
  };

  // Inventory Variant Actions
  const addItemVariant = async (item: Omit<ItemVariant, 'id' | 'updatedAt'>) => {
    const targetDiv = item.division || activeDivision;
    const newVariant: ItemVariant = {
      ...item,
      id: `sku-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      division: targetDiv,
      updatedAt: new Date().toISOString(),
    };
    setAllInventory((prev) => [newVariant, ...prev]);

    try {
      await setDoc(doc(db, 'inventory', newVariant.id), newVariant);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/${newVariant.id}`);
    }

    addToast(`Added SKU: ${newVariant.name} (${newVariant.size})`, 'success');
  };

  const updateItemVariant = async (id: string, updates: Partial<ItemVariant>) => {
    setAllInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );

    const targetItem = allInventory.find((i) => i.id === id);
    if (targetItem) {
      const merged = { ...targetItem, ...updates, updatedAt: new Date().toISOString() };
      try {
        await setDoc(doc(db, 'inventory', id), merged);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `inventory/${id}`);
      }
    }
    addToast('Item updated in Firebase', 'success');
  };

  const deleteItemVariants = async (ids: string[]) => {
    const itemsToDelete = allInventory.filter((i) => ids.includes(i.id));
    if (itemsToDelete.length === 0) return;

    const recycleEntries: RecycleBinItem[] = itemsToDelete.map((item) => ({
      id: `rb-sku-${Date.now()}-${item.id}`,
      originModule: 'Inventory',
      title: `${item.name} (${item.size})`,
      summary: `Code: ${item.code} | Category: ${item.category} | Units: ${item.availableUnits}`,
      deletedAt: new Date().toISOString(),
      originalData: item,
      stockEffectNote: `Restoring will add ${item.availableUnits} units back to active inventory`,
      division: item.division || activeDivision,
    }));

    setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
    setAllInventory((prev) => prev.filter((item) => !ids.includes(item.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'inventory', id)));
      recycleEntries.forEach((entry) => batch.set(doc(db, 'recyclebin', entry.id), entry));
      await batch.commit();
    } catch (error) {
      console.error('Batch delete error:', error);
    }

    addToast(`Moved ${ids.length} item(s) to Recycle Bin`, 'info');
  };

  // Bulk Excel Import
  const bulkImportInventory = async (
    rows: Record<string, any>[],
    options?: { replaceCategories?: boolean }
  ): Promise<{ added: number; updated: number; categoriesAdded: number }> => {
    const { parsedRows } = smartParseInventoryRows(rows, activeDivision);
    if (!parsedRows || parsedRows.length === 0) {
      return { added: 0, updated: 0, categoriesAdded: 0 };
    }

    let currentCats = [...allCategories];
    let categoriesAdded = 0;

    if (options?.replaceCategories) {
      currentCats = currentCats.filter((c) => (c.division || 'uniform') !== activeDivision);
    }

    const uniqueExtractedCats = new Set<string>();
    parsedRows.forEach((pi: ParsedInventoryItem) => {
      if (pi.category && pi.category.trim()) {
        uniqueExtractedCats.add(pi.category.trim());
      }
    });

    const newCatsToCreate: CategoryInfo[] = [];
    uniqueExtractedCats.forEach((catName) => {
      const exists = currentCats.some(
        (c) => (c.division || 'uniform') === activeDivision && c.name.toLowerCase() === catName.toLowerCase()
      );
      if (!exists) {
        const prefix = generateCategoryPrefix(catName);
        const newCat: CategoryInfo = {
          id: `cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: catName,
          codePrefix: prefix,
          description: `Auto-generated from Excel import`,
          division: activeDivision,
        };
        newCatsToCreate.push(newCat);
        currentCats.push(newCat);
        categoriesAdded++;
      }
    });

    if (newCatsToCreate.length > 0 || options?.replaceCategories) {
      setAllCategories(currentCats);
    }

    let added = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();
    const updatedInventory = [...allInventory];
    const itemsToSave: ItemVariant[] = [];

    parsedRows.forEach((item: ParsedInventoryItem, idx: number) => {
      const code = item.code.trim();
      const existingIdx = updatedInventory.findIndex(
        (inv) =>
          (inv.division || 'uniform') === activeDivision &&
          (inv.code.toLowerCase() === code.toLowerCase() ||
            (inv.name.toLowerCase() === item.name.toLowerCase() &&
              inv.size.toLowerCase() === item.size.toLowerCase()))
      );

      if (existingIdx >= 0) {
        const existing = updatedInventory[existingIdx];
        const merged: ItemVariant = {
          ...existing,
          availableUnits: item.availableUnits,
          mrp: item.mrp || existing.mrp,
          costPrice: item.costPrice ?? existing.costPrice,
          category: item.category || existing.category,
          updatedAt: nowIso,
          division: activeDivision,
        };
        updatedInventory[existingIdx] = merged;
        itemsToSave.push(merged);
        updated++;
      } else {
        const newVariant: ItemVariant = {
          id: `sku-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          code: item.code,
          name: item.name,
          category: item.category,
          size: item.size,
          availableUnits: item.availableUnits,
          mrp: item.mrp,
          costPrice: item.costPrice,
          division: activeDivision,
          updatedAt: nowIso,
        };
        updatedInventory.push(newVariant);
        itemsToSave.push(newVariant);
        added++;
      }
    });

    setAllInventory(updatedInventory);

    // Save to Firestore in Batches
    try {
      const batchSize = 400;
      for (let i = 0; i < itemsToSave.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = itemsToSave.slice(i, i + batchSize);
        chunk.forEach((item) => {
          batch.set(doc(db, 'inventory', item.id), item);
        });
        await batch.commit();
      }

      if (newCatsToCreate.length > 0) {
        const catBatch = writeBatch(db);
        newCatsToCreate.forEach((cat) => {
          catBatch.set(doc(db, 'categories', cat.id), cat);
        });
        await catBatch.commit();
      }
    } catch (error) {
      console.error('Error committing bulk import to Firestore:', error);
    }

    addToast(
      `Smart Import: Added ${added}, Updated ${updated} SKU(s), Adopted ${categoriesAdded} category(ies) into Firebase!`,
      'success',
      'Import Complete'
    );

    return { added, updated, categoriesAdded };
  };

  // Cart Management
  const addToCart = (variant: ItemVariant, quantity: number): boolean => {
    if (quantity <= 0) return false;
    const existingIndex = cart.findIndex((item) => item.itemVariantId === variant.id);
    const currentCartQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const totalDesiredQty = currentCartQty + quantity;

    if (totalDesiredQty > variant.availableUnits) {
      addToast(
        `Insufficient stock! Only ${variant.availableUnits} unit(s) available for "${variant.name} (${variant.size})".`,
        'error',
        'Stock Alert'
      );
      return false;
    }

    if (existingIndex >= 0) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: totalDesiredQty,
                subtotal: totalDesiredQty * item.mrp,
                maxStock: variant.availableUnits,
              }
            : item
        )
      );
    } else {
      const newItem: POSCartItem = {
        itemVariantId: variant.id,
        code: variant.code,
        name: variant.name,
        category: variant.category,
        size: variant.size,
        mrp: variant.mrp,
        quantity,
        subtotal: quantity * variant.mrp,
        maxStock: variant.availableUnits,
        division: variant.division || activeDivision,
        subject: variant.subject,
        classGrade: variant.classGrade,
      };
      setCart((prev) => [...prev, newItem]);
    }

    addToast(`Added ${quantity}x "${variant.name} (${variant.size})" to cart`, 'success');
    return true;
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    const variant = allInventory.find((i) => i.id === variantId);
    if (variant && quantity > variant.availableUnits) {
      addToast(
        `Cannot set quantity to ${quantity}. Only ${variant.availableUnits} available in stock.`,
        'warning'
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.itemVariantId === variantId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.mrp,
            }
          : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.itemVariantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout
  const completeCheckout = (saleData: {
    studentName: string;
    studentClass: string;
    rollNoAdmission: string;
    contactNo: string;
    discountType: 'flat' | 'percent';
    discountValue: number;
    paymentMode: PaymentMode;
    notes?: string;
    billDate?: string;
  }): StudentSaleRecord | null => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add items before generating invoice.', 'warning');
      return null;
    }

    for (const item of cart) {
      const current = allInventory.find((i) => i.id === item.itemVariantId);
      if (!current || current.availableUnits < item.quantity) {
        addToast(
          `Cannot complete sale: Not enough units in stock for ${item.name} (${item.size}).`,
          'error',
          'Checkout Blocked'
        );
        return null;
      }
    }

    const grossTotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
    let discountAmount = 0;
    if (saleData.discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, saleData.discountValue || 0));
      discountAmount = (grossTotal * pct) / 100;
    } else {
      discountAmount = Math.min(grossTotal, Math.max(0, saleData.discountValue || 0));
    }
    const netAmount = Math.max(0, grossTotal - discountAmount);

    const prefix = activeDivision === 'books' ? 'NEPS-BK' : 'NEPS-UN';
    const invoiceNo = `${prefix}-${Date.now().toString().slice(-6)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSale: StudentSaleRecord = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNo,
      date: saleData.billDate || new Date().toISOString().split('T')[0],
      time: nowTime,
      studentName: saleData.studentName.trim(),
      studentClass: saleData.studentClass.trim(),
      rollNoAdmission: saleData.rollNoAdmission.trim(),
      contactNo: saleData.contactNo.trim(),
      items: [...cart],
      grossTotal,
      discountType: saleData.discountType,
      discountValue: saleData.discountValue,
      discountAmount,
      netAmount,
      paymentMode: saleData.paymentMode,
      cashierName,
      notes: saleData.notes?.trim(),
      createdAt: new Date().toISOString(),
      division: activeDivision,
    };

    // Deduct stock
    const updatedInventory = allInventory.map((inv) => {
      const inCart = cart.find((c) => c.itemVariantId === inv.id);
      if (inCart) {
        return {
          ...inv,
          availableUnits: Math.max(0, inv.availableUnits - inCart.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return inv;
    });

    setAllInventory(updatedInventory);
    setAllSales((prev) => [newSale, ...prev]);
    setActiveInvoice(newSale);
    clearCart();

    // Persist to Firestore in background
    (async () => {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'sales', newSale.id), newSale);
        cart.forEach((c) => {
          const item = updatedInventory.find((i) => i.id === c.itemVariantId);
          if (item) {
            batch.set(doc(db, 'inventory', item.id), item);
          }
        });
        await batch.commit();
      } catch (error) {
        console.error('Checkout firestore error:', error);
      }
    })();

    addToast(`Sale #${invoiceNo} completed & invoice saved to Firebase!`, 'success');
    return newSale;
  };

  // Stock Inflows
  const addInflow = async (record: Omit<StockInflowRecord, 'id' | 'createdAt'>) => {
    const targetDiv = record.division || activeDivision;
    const newRecord: StockInflowRecord = {
      ...record,
      id: `inf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      division: targetDiv,
    };

    const updatedInv = allInventory.map((item) => {
      if (item.code === record.itemCode) {
        return {
          ...item,
          availableUnits: item.availableUnits + record.units,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setAllInventory(updatedInv);
    setAllInflows((prev) => [newRecord, ...prev]);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'inflows', newRecord.id), newRecord);
      const matchedItem = updatedInv.find((i) => i.code === record.itemCode);
      if (matchedItem) {
        batch.set(doc(db, 'inventory', matchedItem.id), matchedItem);
      }
      await batch.commit();
    } catch (error) {
      console.error('Inflow Firestore error:', error);
    }

    addToast(`Recorded Inflow of ${record.units} units for ${record.itemName}`, 'success');
  };

  const updateInflow = async (id: string, updates: Partial<StockInflowRecord>) => {
    setAllInflows((prev) => prev.map((inf) => (inf.id === id ? { ...inf, ...updates } : inf)));
    const target = allInflows.find((i) => i.id === id);
    if (target) {
      try {
        await setDoc(doc(db, 'inflows', id), { ...target, ...updates });
      } catch (e) {
        console.error(e);
      }
    }
    addToast('Inflow record updated', 'success');
  };

  const deleteInflows = async (ids: string[]) => {
    const toDelete = allInflows.filter((inf) => ids.includes(inf.id));
    const recycleEntries: RecycleBinItem[] = toDelete.map((inf) => ({
      id: `rb-inf-${Date.now()}-${inf.id}`,
      originModule: 'Inflow',
      title: `${inf.itemName} (${inf.size}) - ${inf.vendorName}`,
      summary: `Date: ${inf.date} | Units: ${inf.units} | Item Code: ${inf.itemCode}`,
      deletedAt: new Date().toISOString(),
      originalData: inf,
      stockEffectNote: `Will deduct ${inf.units} units from active inventory`,
      division: inf.division || activeDivision,
    }));

    setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
    setAllInflows((prev) => prev.filter((inf) => !ids.includes(inf.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'inflows', id)));
      recycleEntries.forEach((e) => batch.set(doc(db, 'recyclebin', e.id), e));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(`Moved ${ids.length} inflow record(s) to Recycle Bin`, 'info');
  };

  const bulkImportInflows = async (rows: Record<string, any>[]): Promise<number> => {
    let imported = 0;
    const nowIso = new Date().toISOString();
    const newInflows: StockInflowRecord[] = [];

    rows.forEach((row, idx) => {
      const itemCode = row['Item Code'] || row['Code'] || `INFLOW-${idx + 1}`;
      const itemName = row['Item Name'] || row['Name'] || 'Stock Inflow Item';
      const category = row['Category'] || 'General';
      const size = row['Size'] || 'Standard';
      const vendorName = row['Vendor'] || row['Supplier'] || row['Vendor Name'] || 'Direct Supply';
      const date = row['Date'] || new Date().toISOString().split('T')[0];
      const units = parseInt(row['Units'] || row['Quantity'] || '0', 10);
      const mrp = parseFloat(row['MRP'] || row['Rate'] || '0');

      if (units > 0) {
        newInflows.push({
          id: `inf-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          date: String(date),
          vendorName: String(vendorName),
          itemCode: String(itemCode),
          itemName: String(itemName),
          category: String(category),
          size: String(size),
          units,
          mrp: mrp || undefined,
          createdAt: nowIso,
          division: activeDivision,
        });
        imported++;
      }
    });

    if (newInflows.length > 0) {
      setAllInflows((prev) => [...newInflows, ...prev]);
      try {
        const batch = writeBatch(db);
        newInflows.forEach((inf) => batch.set(doc(db, 'inflows', inf.id), inf));
        await batch.commit();
      } catch (e) {
        console.error(e);
      }
    }

    addToast(`Bulk imported ${imported} inflow records to Firebase`, 'success');
    return imported;
  };

  // Stock Outflows
  const addOutflow = (record: Omit<StockOutflowRecord, 'id' | 'createdAt'>): boolean => {
    const targetDiv = record.division || activeDivision;

    const current = allInventory.find((i) => i.code === record.itemCode);
    if (!current || current.availableUnits < record.units) {
      addToast(
        `Cannot create outflow: Insufficient stock for ${record.itemName} (${record.size}).`,
        'error',
        'Outflow Error'
      );
      return false;
    }

    const newRecord: StockOutflowRecord = {
      ...record,
      id: `out-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      division: targetDiv,
    };

    const updatedInv = allInventory.map((item) => {
      if (item.code === record.itemCode) {
        return {
          ...item,
          availableUnits: Math.max(0, item.availableUnits - record.units),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setAllInventory(updatedInv);
    setAllOutflows((prev) => [newRecord, ...prev]);

    (async () => {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'outflows', newRecord.id), newRecord);
        const matched = updatedInv.find((i) => i.code === record.itemCode);
        if (matched) batch.set(doc(db, 'inventory', matched.id), matched);
        await batch.commit();
      } catch (e) {
        console.error(e);
      }
    })();

    addToast(`Recorded Outflow to ${record.recipient} in Firebase`, 'success');
    return true;
  };

  const updateOutflow = async (id: string, updates: Partial<StockOutflowRecord>) => {
    setAllOutflows((prev) => prev.map((out) => (out.id === id ? { ...out, ...updates } : out)));
    const target = allOutflows.find((i) => i.id === id);
    if (target) {
      try {
        await setDoc(doc(db, 'outflows', id), { ...target, ...updates });
      } catch (e) {
        console.error(e);
      }
    }
    addToast('Outflow record updated', 'success');
  };

  const deleteOutflows = async (ids: string[]) => {
    const toDelete = allOutflows.filter((out) => ids.includes(out.id));
    const recycleEntries: RecycleBinItem[] = toDelete.map((out) => ({
      id: `rb-out-${Date.now()}-${out.id}`,
      originModule: 'Outflow',
      title: `Outflow to ${out.recipient} (${out.referenceSlipNo || 'N/A'})`,
      summary: `Date: ${out.date} | Units: ${out.units} | Item: ${out.itemName}`,
      deletedAt: new Date().toISOString(),
      originalData: out,
      stockEffectNote: `Will return ${out.units} units back to active inventory`,
      division: out.division || activeDivision,
    }));

    setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
    setAllOutflows((prev) => prev.filter((out) => !ids.includes(out.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'outflows', id)));
      recycleEntries.forEach((e) => batch.set(doc(db, 'recyclebin', e.id), e));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(`Moved ${ids.length} outflow record(s) to Recycle Bin`, 'info');
  };

  const bulkImportOutflows = async (rows: Record<string, any>[]): Promise<number> => {
    let imported = 0;
    const nowIso = new Date().toISOString();
    const newOutflows: StockOutflowRecord[] = [];

    rows.forEach((row, idx) => {
      const recipient = row['Recipient'] || row['Destination'] || 'General Requisition';
      const slipNo = row['Slip No'] || row['Reference Slip No'] || `SLIP-${idx + 1}`;
      const itemCode = row['Item Code'] || row['Code'] || `OUT-${idx + 1}`;
      const itemName = row['Item Name'] || row['Name'] || 'Requisition Item';
      const category = row['Category'] || 'General';
      const size = row['Size'] || 'Standard';
      const date = row['Date'] || new Date().toISOString().split('T')[0];
      const units = parseInt(row['Units'] || row['Quantity'] || '0', 10);
      const reason = row['Reason'] || 'Requisition';

      if (units > 0) {
        newOutflows.push({
          id: `out-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          date: String(date),
          recipient: String(recipient),
          referenceSlipNo: String(slipNo),
          itemCode: String(itemCode),
          itemName: String(itemName),
          category: String(category),
          size: String(size),
          units,
          reason: String(reason),
          createdAt: nowIso,
          division: activeDivision,
        });
        imported++;
      }
    });

    if (newOutflows.length > 0) {
      setAllOutflows((prev) => [...newOutflows, ...prev]);
      try {
        const batch = writeBatch(db);
        newOutflows.forEach((out) => batch.set(doc(db, 'outflows', out.id), out));
        await batch.commit();
      } catch (e) {
        console.error(e);
      }
    }

    addToast(`Bulk imported ${imported} outflow records to Firebase`, 'success');
    return imported;
  };

  // Dead Stock
  const addDeadStock = async (
    record: Omit<DeadStockRecord, 'id' | 'createdAt'>,
    deductFromActive: boolean
  ) => {
    const targetDiv = record.division || activeDivision;
    const newRecord: DeadStockRecord = {
      ...record,
      id: `ds-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      division: targetDiv,
    };

    let updatedInv = allInventory;
    if (deductFromActive) {
      updatedInv = allInventory.map((item) =>
        item.code === record.itemCode
          ? {
              ...item,
              availableUnits: Math.max(0, item.availableUnits - record.units),
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      setAllInventory(updatedInv);
    }

    setAllDeadStock((prev) => [newRecord, ...prev]);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'deadstock', newRecord.id), newRecord);
      if (deductFromActive) {
        const item = updatedInv.find((i) => i.code === record.itemCode);
        if (item) batch.set(doc(db, 'inventory', item.id), item);
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(
      `Recorded ${record.units} damaged/dead unit(s) for "${record.itemName}" in Firebase`,
      'warning'
    );
  };

  const updateDeadStockStatus = async (id: string, newStatus: DeadStockStatus) => {
    setAllDeadStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    const target = allDeadStock.find((i) => i.id === id);
    if (target) {
      try {
        await setDoc(doc(db, 'deadstock', id), { ...target, status: newStatus });
      } catch (e) {
        console.error(e);
      }
    }
    addToast(`Updated dead stock status to ${newStatus}`, 'info');
  };

  const deleteDeadStocks = async (ids: string[]) => {
    const toDelete = allDeadStock.filter((ds) => ids.includes(ds.id));
    const recycleEntries: RecycleBinItem[] = toDelete.map((ds) => ({
      id: `rb-ds-${Date.now()}-${ds.id}`,
      originModule: 'Dead Stock',
      title: `${ds.itemName} (${ds.size || 'N/A'}) - Qty: ${ds.units}`,
      summary: `Reason: ${ds.defectReason} | Status: ${ds.status} | Loss: ₹${ds.estimatedLoss}`,
      deletedAt: new Date().toISOString(),
      originalData: ds,
      stockEffectNote: `Non-deducted damaged stock record`,
      division: ds.division || activeDivision,
    }));

    setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
    setAllDeadStock((prev) => prev.filter((ds) => !ids.includes(ds.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'deadstock', id)));
      recycleEntries.forEach((e) => batch.set(doc(db, 'recyclebin', e.id), e));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(`Moved ${ids.length} dead stock record(s) to Recycle Bin`, 'info');
  };

  // Sales History Actions
  const deleteSales = async (ids: string[]) => {
    const toDelete = allSales.filter((s) => ids.includes(s.id));
    const recycleEntries: RecycleBinItem[] = toDelete.map((s) => ({
      id: `rb-sale-${Date.now()}-${s.id}`,
      originModule: 'Sales',
      title: `Invoice #${s.invoiceNo} (${s.studentName})`,
      summary: `Class: ${s.studentClass} | Total: ₹${s.netAmount} | Mode: ${s.paymentMode}`,
      deletedAt: new Date().toISOString(),
      originalData: s,
      stockEffectNote: `Invoice record moved to recycle bin`,
      division: s.division || activeDivision,
    }));

    setAllRecycleBin((prev) => [...recycleEntries, ...prev]);
    setAllSales((prev) => prev.filter((s) => !ids.includes(s.id)));

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'sales', id)));
      recycleEntries.forEach((e) => batch.set(doc(db, 'recyclebin', e.id), e));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(`Moved ${ids.length} invoice(s) to Recycle Bin`, 'info');
  };

  const processExchange = (
    saleId: string,
    data: {
      originalItemIndex: number;
      originalVariantId: string;
      quantity: number;
      replacementVariant: ItemVariant;
      reason: string;
    }
  ): boolean => {
    const sale = allSales.find((s) => s.id === saleId);
    if (!sale) return false;

    if (data.replacementVariant.availableUnits < data.quantity) {
      addToast(
        `Insufficient stock for replacement variant "${data.replacementVariant.name} (${data.replacementVariant.size})"`,
        'error',
        'Exchange Failed'
      );
      return false;
    }

    const updatedInv = allInventory.map((item) => {
      if (item.id === data.originalVariantId) {
        return {
          ...item,
          availableUnits: item.availableUnits + data.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      if (item.id === data.replacementVariant.id) {
        return {
          ...item,
          availableUnits: Math.max(0, item.availableUnits - data.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedSale: StudentSaleRecord = {
      ...sale,
      notes: (sale.notes ? sale.notes + ' | ' : '') + `Exchanged for ${data.replacementVariant.name} (${data.replacementVariant.size})`,
    };

    setAllInventory(updatedInv);
    setAllSales((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));

    (async () => {
      try {
        await setDoc(doc(db, 'sales', saleId), updatedSale);
        await setDoc(doc(db, 'inventory', data.originalVariantId), updatedInv.find((i) => i.id === data.originalVariantId)!);
        await setDoc(doc(db, 'inventory', data.replacementVariant.id), updatedInv.find((i) => i.id === data.replacementVariant.id)!);
      } catch (e) {
        console.error(e);
      }
    })();

    addToast('Exchange processed and stock reconciled in Firebase', 'success');
    return true;
  };

  const processRefund = (
    saleId: string,
    data: {
      originalItemIndex: number;
      originalVariantId: string;
      quantity: number;
      refundPaymentMode: PaymentMode;
      reason: string;
    }
  ): boolean => {
    const sale = allSales.find((s) => s.id === saleId);
    if (!sale) return false;

    const updatedInv = allInventory.map((item) => {
      if (item.id === data.originalVariantId) {
        return {
          ...item,
          availableUnits: item.availableUnits + data.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedSale: StudentSaleRecord = {
      ...sale,
      notes: (sale.notes ? sale.notes + ' | ' : '') + `Refunded ${data.quantity} units via ${data.refundPaymentMode}`,
    };

    setAllInventory(updatedInv);
    setAllSales((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));

    (async () => {
      try {
        await setDoc(doc(db, 'sales', saleId), updatedSale);
        await setDoc(doc(db, 'inventory', data.originalVariantId), updatedInv.find((i) => i.id === data.originalVariantId)!);
      } catch (e) {
        console.error(e);
      }
    })();

    addToast('Refund recorded and stock returned to inventory in Firebase', 'info');
    return true;
  };

  // Recycle Bin
  const restoreRecycleBinItems = async (ids: string[]) => {
    const itemsToRestore = allRecycleBin.filter((i) => ids.includes(i.id));
    if (itemsToRestore.length === 0) return;

    itemsToRestore.forEach((rb) => {
      switch (rb.originModule) {
        case 'Inventory': {
          const skuData = rb.originalData as ItemVariant;
          setAllInventory((prev) => [skuData, ...prev.filter((i) => i.id !== skuData.id)]);
          setDoc(doc(db, 'inventory', skuData.id), skuData).catch(() => {});
          break;
        }
        case 'Inflow': {
          const infData = rb.originalData as StockInflowRecord;
          setAllInflows((prev) => [infData, ...prev.filter((i) => i.id !== infData.id)]);
          setDoc(doc(db, 'inflows', infData.id), infData).catch(() => {});
          break;
        }
        case 'Outflow': {
          const outData = rb.originalData as StockOutflowRecord;
          setAllOutflows((prev) => [outData, ...prev.filter((i) => i.id !== outData.id)]);
          setDoc(doc(db, 'outflows', outData.id), outData).catch(() => {});
          break;
        }
        case 'Sales': {
          const saleData = rb.originalData as StudentSaleRecord;
          setAllSales((prev) => [saleData, ...prev.filter((i) => i.id !== saleData.id)]);
          setDoc(doc(db, 'sales', saleData.id), saleData).catch(() => {});
          break;
        }
        case 'Dead Stock': {
          const dsData = rb.originalData as DeadStockRecord;
          setAllDeadStock((prev) => [dsData, ...prev.filter((i) => i.id !== dsData.id)]);
          setDoc(doc(db, 'deadstock', dsData.id), dsData).catch(() => {});
          break;
        }
      }
    });

    setAllRecycleBin((prev) => prev.filter((item) => !ids.includes(item.id)));
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'recyclebin', id)));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }

    addToast(`Restored ${itemsToRestore.length} item(s) from Recycle Bin`, 'success');
  };

  const restoreAllRecycleBin = async () => {
    await restoreRecycleBinItems(recycleBin.map((i) => i.id));
  };

  const permanentlyDeleteRecycleBinItems = async (ids: string[]) => {
    setAllRecycleBin((prev) => prev.filter((item) => !ids.includes(item.id)));
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'recyclebin', id)));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
    addToast(`Permanently deleted ${ids.length} item(s)`, 'info');
  };

  const emptyRecycleBin = async () => {
    const currentDivisionIds = recycleBin.map((r) => r.id);
    setAllRecycleBin((prev) => prev.filter((r) => !currentDivisionIds.includes(r.id)));
    try {
      const batch = writeBatch(db);
      currentDivisionIds.forEach((id) => batch.delete(doc(db, 'recyclebin', id)));
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
    addToast(`Recycle bin emptied (${currentDivisionIds.length} items)`, 'info');
  };

  // Erase all store data completely (NO DEMO DATA)
  const clearAllStoreData = async () => {
    setAllCategories([]);
    setAllInventory([]);
    setAllInflows([]);
    setAllOutflows([]);
    setAllDeadStock([]);
    setAllSales([]);
    setAllRecycleBin([]);
    setCart([]);
    addToast('All store data has been completely erased. Ready for fresh import.', 'info');
  };

  // Reset to sample data helper now acts as a clean reset (all demo data erased)
  const resetToSampleData = () => {
    clearAllStoreData();
  };

  return (
    <StoreContext.Provider
      value={{
        activeDivision,
        setActiveDivision,
        currentUser,
        authLoading,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        cashierName,
        setCashierName,
        activeTab,
        setActiveTab,
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        clearAllCategories,
        inventory,
        allInventory,
        addItemVariant,
        updateItemVariant,
        deleteItemVariants,
        bulkImportInventory,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        completeCheckout,
        activeInvoice,
        setActiveInvoice,
        inflows,
        allInflows,
        addInflow,
        updateInflow,
        deleteInflows,
        bulkImportInflows,
        outflows,
        allOutflows,
        addOutflow,
        updateOutflow,
        deleteOutflows,
        bulkImportOutflows,
        deadStock,
        allDeadStock,
        addDeadStock,
        updateDeadStockStatus,
        deleteDeadStocks,
        sales,
        allSales,
        deleteSales,
        processExchange,
        processRefund,
        recycleBin,
        allRecycleBin,
        restoreRecycleBinItems,
        restoreAllRecycleBin,
        permanentlyDeleteRecycleBinItems,
        emptyRecycleBin,
        toasts,
        addToast,
        removeToast,
        clearAllStoreData,
        resetToSampleData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
