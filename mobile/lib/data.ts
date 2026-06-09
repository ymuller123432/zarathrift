import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, Order, DiscountCode, User } from './types';
import { products as defaultProducts, seedDiscounts } from './products';
import { nigerianStates } from './constants';
import { supabase, isUsingSupabase, SupabaseOrder } from './supabase';

const KEYS = {
  PRODUCTS: 'zarathrift_products',
  CART: 'zarathrift_cart',
  USER: 'zarathrift_current_user',
  ORDERS: 'zarathrift_orders',
  DISCOUNTS: 'zarathrift_discounts',
  USERS: 'zarathrift_users',
};

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) return '0' + digits;
  return '0' + digits.slice(-10);
}

export { nigerianStates };

export async function getProducts(): Promise<Product[]> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.PRODUCTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultProducts;
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function saveCart(cart: CartItem[]) {
  await AsyncStorage.setItem(KEYS.CART, JSON.stringify(cart));
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export async function saveCurrentUser(user: User | null) {
  if (user) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(KEYS.USER);
  }
}

export async function getOrders(): Promise<Order[]> {
  if (isUsingSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        return data.map((o: any) => ({
          ...o,
          // Map snake_case from Supabase to camelCase if needed, or keep consistent
          trackingUpdates: o.tracking_updates || o.trackingUpdates || [],
          deliveryUpdates: o.delivery_updates || o.deliveryUpdates || [],
          assignedBike: o.assigned_bike || o.assignedBike,
          driverPhone: o.driver_phone || o.driverPhone,
          estimatedDelivery: o.estimated_delivery || o.estimatedDelivery,
          currentLocation: o.current_location || o.currentLocation,
        }));
      }
    } catch (e) {
      console.warn('Supabase getOrders failed, falling back to local', e);
    }
  }
  try {
    const saved = await AsyncStorage.getItem(KEYS.ORDERS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    // Seed demo user for easy testing in Expo Go
    const demo: User = {
      id: 'demo_user_001',
      firstName: 'Demo',
      lastName: 'Shopper',
      phone: '08012345678',
      email: 'demo@zarathrift.test',
      password: 'Demo123!',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([demo]));
    return [demo];
  } catch {
    return [];
  }
}

export async function saveUsers(users: User[]) {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export async function getDiscounts(): Promise<DiscountCode[]> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.DISCOUNTS);
    return saved ? JSON.parse(saved) : seedDiscounts;
  } catch {
    return seedDiscounts;
  }
}

export function generateOrderReference(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZT-${y}${m}${d}-${rand}`;
}

export function formatPrice(n: number): string {
  return 'NGN ' + n.toLocaleString('en-NG');
}

export async function getActiveDiscounts(): Promise<DiscountCode[]> {
  const all = await getDiscounts();
  return all.filter(d => d.active);
}

export async function placeOrder(order: Order): Promise<Order> {
  const orders = await getOrders();
  orders.unshift(order);
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  await saveCart([]);
  return order;
}

export async function getUserOrders(userPhone: string): Promise<Order[]> {
  const all = await getOrders();
  const norm = normalizePhone(userPhone);
  return all.filter(o => normalizePhone(o.customer.phone) === norm);
}

export async function saveOrders(orders: Order[]) {
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

export async function updateOrder(orderId: string, updates: Partial<Order>) {
  const all = await getOrders();
  const updated = all.map(o => o.id === orderId ? { ...o, ...updates } : o);
  await saveOrders(updated);
}

export async function addDeliveryUpdate(orderId: string, update: { timestamp: string; location: string; lat?: number; lng?: number; note?: string }) {
  // Supabase path (for automatic real-time driver -> customer sync across devices)
  if (isUsingSupabase && supabase) {
    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_updates, current_location')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentUpdates = (orderData as any)?.delivery_updates || [];
      const newUpdates = [...currentUpdates, update];

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          delivery_updates: newUpdates,
          current_location: update.location 
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Realtime will push to subscribers (customer track pages)
      return;
    } catch (e) {
      console.warn('Supabase driver update failed, falling back to local', e);
    }
  }

  // Local fallback (demo - same device only)
  const all = await getOrders();
  const updated = all.map(o => {
    if (o.id === orderId) {
      return {
        ...o,
        deliveryUpdates: [...(o.deliveryUpdates || []), update],
        currentLocation: update.location,
      };
    }
    return o;
  });
  await saveOrders(updated);
}

export function calculateDiscount(total: number, code: string, activeDiscounts: DiscountCode[]): { discountAmount: number; percent: number; valid: boolean } {
  const found = activeDiscounts.find(d => d.code.toUpperCase() === code.toUpperCase());
  if (!found) return { discountAmount: 0, percent: 0, valid: false };
  const discountAmount = Math.round(total * (found.percent / 100));
  return { discountAmount, percent: found.percent, valid: true };
}
