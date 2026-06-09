'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem } from '../lib/types';

const CART_KEY = 'zarathrift_cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  // Persist to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
  };

  const addToCart = (product: Product) => {
    const existing = cart.findIndex(item => item.id === product.id);
    
    if (existing !== -1) {
      const updated = [...cart];
      updated[existing].quantity += 1;
      saveCart(updated);
    } else {
      saveCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    saveCart(updated);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    const updated = cart.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
  };
}
