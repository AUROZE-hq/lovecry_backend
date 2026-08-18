'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartCount, mergeCartItem, parseStoredCart } from '@/lib/marketplace/cart';
import { MARKETPLACE_CART_STORAGE_KEY, type MarketplaceCartItem } from '@/lib/marketplace/types';

type CartContextValue = {
  items: MarketplaceCartItem[];
  cartCount: number;
  addItem: (item: Omit<MarketplaceCartItem, 'quantity'> & { quantity?: number }) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function MarketplaceCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MarketplaceCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MARKETPLACE_CART_STORAGE_KEY);
      setItems(raw ? parseStoredCart(JSON.parse(raw)) : []);
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(MARKETPLACE_CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<MarketplaceCartItem, 'quantity'> & { quantity?: number }) => {
    setItems((current) => mergeCartItem(current, item));
  }, []);

  const value = useMemo(
    () => ({
      items,
      cartCount: cartCount(items),
      addItem,
    }),
    [items, addItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useMarketplaceCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useMarketplaceCart must be used within MarketplaceCartProvider');
  }
  return context;
}
