import React, { useState, useCallback, useEffect } from 'react';
import { CodeCartItem, FormMode } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import Footer from './components/Footer';
import CodeCartList from './components/CodeCartList';
import Modal from './components/Modal';
import CodeCartForm from './components/CodeCartForm';
import PasswordProtect from './components/PasswordProtect'; // Added
import { getExampleDate } from './utils/dateUtils';

const createExampleData = (): CodeCartItem[] => [
  {
    id: crypto.randomUUID(),
    identifier: 'CC-EXPIRED',
    cartType: 'Code Cart',
    location: 'STORAGE ROOM A (OLD)',
    employeeInitials: 'SYS',
    drugExpirationDate: getExampleDate(-30), 
    supplyExpirationDate: getExampleDate(-15), 
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    identifier: 'PB-URGENT',
    cartType: 'P-Bag',
    location: 'ER BAY 5',
    employeeInitials: 'RNX',
    drugExpirationDate: getExampleDate(5), 
    supplyExpirationDate: getExampleDate(30), 
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    identifier: 'CC-SOON',
    cartType: 'Code Cart',
    location: 'ICU ROOM 102',
    employeeInitials: 'MDT',
    drugExpirationDate: getExampleDate(120), 
    supplyExpirationDate: getExampleDate(10), 
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    identifier: 'PB-GOOD',
    cartType: 'P-Bag',
    location: 'PEDIATRIC WARD SUPPLY',
    employeeInitials: 'JDS',
    drugExpirationDate: getExampleDate(180), 
    supplyExpirationDate: getExampleDate(200), 
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
   {
    id: crypto.randomUUID(),
    identifier: 'CC-URGENT-SUPPLY',
    cartType: 'Code Cart',
    location: 'OR PREP AREA',
    employeeInitials: 'SRG',
    drugExpirationDate: getExampleDate(45), 
    supplyExpirationDate: getExampleDate(2), 
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    identifier: 'CC-NO-DRUG-EXP',
    cartType: 'Code Cart',
    location: 'TRAINING ROOM 1',
    employeeInitials: 'EDU',
    drugExpirationDate: null, 
    supplyExpirationDate: getExampleDate(300),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const SESSION_STORAGE_AUTH_KEY = 'codeCartTrackerAuthenticated_v1';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_AUTH_KEY) === 'true';
    }
    return false;
  });
  
  const [codeCartItems, setCodeCartItems] = useLocalStorage<CodeCartItem[]>('codeCarts-v2', createExampleData()); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<FormMode>('add');
  const [editingItem, setEditingItem] = useState<CodeCartItem | null>(null); 

  const handleAuthenticationSuccess = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, 'true');
    }
    setIsAuthenticated(true);
  }, []);
  
  // Function to handle logout (optional, can be triggered by a button if added)
  // const handleLogout = useCallback(() => {
  //   if (typeof window !== 'undefined') {
  //     sessionStorage.removeItem(SESSION_STORAGE_AUTH_KEY);
  //   }
  //   setIsAuthenticated(false);
  // }, []);


  const openModal = useCallback((mode: FormMode, item?: CodeCartItem) => {
    setModalMode(mode);
    setEditingItem(item || null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null); 
  }, []);

  const handleSaveItem = useCallback((itemData: Omit<CodeCartItem, 'id' | 'createdAt'> | CodeCartItem) => {
    const processedItemData = {
        ...itemData,
        location: itemData.location?.toUpperCase() || "N/A", 
    };

    if (modalMode === 'edit' && editingItem) {
      setCodeCartItems(prevItems =>
        prevItems.map(item => (item.id === editingItem.id ? { ...editingItem, ...processedItemData } as CodeCartItem : item))
      );
    } else {
      const newItem: CodeCartItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...(processedItemData as Omit<CodeCartItem, 'id' | 'createdAt'>),
      };
      setCodeCartItems(prevItems => [newItem, ...prevItems].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); 
    }
    closeModal();
  }, [modalMode, editingItem, setCodeCartItems, closeModal]);

  const handleDeleteItem = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setCodeCartItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  }, [setCodeCartItems]);

  if (!isAuthenticated) {
    return <PasswordProtect onAuthSuccess={handleAuthenticationSuccess} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header onAddNew={() => openModal('add')} />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CodeCartList
          items={codeCartItems}
          onEdit={(item) => openModal('edit', item)}
          onDelete={handleDeleteItem}
        />
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit Code Cart / P-Bag' : 'Add New Code Cart / P-Bag'}
      >
        <CodeCartForm 
          mode={modalMode}
          initialData={editingItem}
          onSubmit={handleSaveItem}
          onCancel={closeModal}
        />
      </Modal>
      
      <Footer />
    </div>
  );
};

export default App;