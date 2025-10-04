import { create } from 'zustand';
import { CartItem } from '../config/types';
import { getCart, updateCart, clearCart } from '../services/firestore';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  totalAmount: number;
  totalItems: number;
  addItem: (item: CartItem) => void;
  removeItem: (medicineId: string) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;
  loadCart: (uid: string) => Promise<void>;
  syncCart: (uid: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  totalAmount: 0,
  totalItems: 0,

  addItem: (newItem) => {
    const { items } = get();
    const existingItemIndex = items.findIndex(item => item.medicineId === newItem.medicineId);
    
    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      updatedItems = items.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, qty: item.qty + newItem.qty }
          : item
      );
    } else {
      // Add new item
      updatedItems = [...items, newItem];
    }
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedItems.reduce((sum, item) => sum + item.qty, 0);
    
    set({ 
      items: updatedItems, 
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems 
    });
  },

  removeItem: (medicineId) => {
    const { items } = get();
    const updatedItems = items.filter(item => item.medicineId !== medicineId);
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedItems.reduce((sum, item) => sum + item.qty, 0);
    
    set({ 
      items: updatedItems, 
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems 
    });
  },

  updateQuantity: (medicineId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(medicineId);
      return;
    }
    
    const updatedItems = items.map(item => 
      item.medicineId === medicineId 
        ? { ...item, qty: quantity }
        : item
    );
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedItems.reduce((sum, item) => sum + item.qty, 0);
    
    set({ 
      items: updatedItems, 
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems 
    });
  },

  clearCart: () => {
    set({ items: [], totalAmount: 0, totalItems: 0 });
  },

  loadCart: async (uid) => {
    try {
      set({ isLoading: true });
      const cart = await getCart(uid);
      
      if (cart) {
        const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);
        
        set({ 
          items: cart.items, 
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalItems,
          isLoading: false 
        });
      } else {
        set({ items: [], totalAmount: 0, totalItems: 0, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      set({ isLoading: false });
    }
  },

  syncCart: async (uid) => {
    try {
      const { items } = get();
      await updateCart(uid, { items });
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  },
}));
