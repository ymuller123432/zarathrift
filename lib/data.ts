import { Product, BusinessConfig, DiscountCode, CustomerNote, ContentBlock, Order } from './types';
import { products as defaultProducts } from './products';
import { businessConfig as defaultConfig } from './config';
import { supabase, isUsingSupabase, SupabaseProduct, SupabaseOrder, SupabaseSetting, SupabaseDiscount, SupabaseCustomer, SupabaseContent } from './supabase';

const PRODUCTS_KEY = 'zarathrift_products';
const SETTINGS_KEY = 'zarathrift_settings';
const DISCOUNTS_KEY = 'zarathrift_discounts';
const CUSTOMERS_KEY = 'zarathrift_customers';
const CONTENT_KEY = 'zarathrift_content';
const ORDERS_KEY = 'zarathrift_orders';

// Helper to generate unique ID
export function generateId(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== PRODUCTS ====================
export async function getProducts(): Promise<Product[]> {
  if (isUsingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((p: SupabaseProduct) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalBrand: p.original_brand,
          size: p.size,
          condition: p.condition as any,
          gender: p.gender as any,
          category: p.category as any,
          description: p.description,
          images: p.images || [],
          measurements: p.measurements,
          material: p.material,
          inStock: p.in_stock,
          quantity: p.quantity ?? 1,
          featured: p.featured ?? false,
          // photo_captions and condition_closeups can be added to Product type if needed
        }));
      }
    } catch (e) {
      console.warn('Supabase products fetch failed, falling back to local', e);
    }
  }
  if (typeof window === 'undefined') return defaultProducts;
  const saved = localStorage.getItem(PRODUCTS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return defaultProducts;
}

export async function saveProducts(products: Product[]) {
  if (isUsingSupabase && supabase) {
    try {
      // Upsert all
      const sbProducts: SupabaseProduct[] = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_brand: p.originalBrand,
        size: p.size,
        condition: p.condition,
        gender: p.gender,
        category: p.category,
        description: p.description,
        images: p.images,
        measurements: p.measurements,
        material: p.material,
        in_stock: p.inStock,
        quantity: p.quantity ?? 1,
        featured: p.featured ?? false,
      }));
      const { error } = await supabase.from('products').upsert(sbProducts);
      if (error) throw error;
      return;
    } catch (e) {
      console.warn('Supabase save failed, using local', e);
    }
  }
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// ==================== SETTINGS (BusinessConfig + more) ====================
export async function getSettings(): Promise<BusinessConfig & { discounts?: DiscountCode[]; content?: Record<string, string> }> {
  if (isUsingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const config: any = { ...defaultConfig };
      (data || []).forEach((s: SupabaseSetting) => {
        if (s.key === 'business') config.business = s.value;
        if (s.key === 'discounts') config.discounts = s.value;
        if (s.key === 'content') config.content = s.value;
      });
      return { ...defaultConfig, ...config.business, discounts: config.discounts, content: config.content };
    } catch (e) {
      console.warn('Supabase settings failed', e);
    }
  }
  if (typeof window === 'undefined') return defaultConfig as any;
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try { return { ...defaultConfig, ...JSON.parse(saved) }; } catch {}
  }
  return defaultConfig as any;
}

export async function saveSettings(settings: any) {
  if (isUsingSupabase && supabase) {
    try {
      const toSave = [
        { 
          key: 'business', 
          value: { 
            accountName: settings.accountName, 
            accountNumber: settings.accountNumber, 
            bankName: settings.bankName, 
            whatsappNumber: settings.whatsappNumber,
            lagosDeliveryFee: settings.lagosDeliveryFee ?? 2500,
            lagosFreeThreshold: settings.lagosFreeThreshold ?? 35000,
            lagosIslandSurcharge: settings.lagosIslandSurcharge ?? 1500,
            lagosMainlandFee: settings.lagosMainlandFee ?? 2000,
          } 
        },
        { key: 'discounts', value: settings.discounts || [] },
        { key: 'content', value: settings.content || {} }
      ];
      await supabase.from('settings').upsert(toSave, { onConflict: 'key' });
      return;
    } catch (e) {
      console.warn('Supabase settings save failed', e);
    }
  }
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ==================== DISCOUNTS ====================
export async function getDiscounts(): Promise<DiscountCode[]> {
  const settings = await getSettings();
  return settings.discounts || [];
}

export async function saveDiscounts(discounts: DiscountCode[]) {
  const settings = await getSettings();
  await saveSettings({ ...settings, discounts });
}

// ==================== CUSTOMERS (CRM) ====================
export async function getCustomers(): Promise<CustomerNote[]> {
  if (isUsingSupabase && supabase) {
    try {
      const { data } = await supabase.from('customers').select('*');
      return (data || []).map((c: SupabaseCustomer) => ({
        phone: c.phone,
        name: c.name,
        notes: c.notes || '',
        ordersCount: c.orders_count || 0
      }));
    } catch {}
  }
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(CUSTOMERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function saveCustomerNote(phone: string, name: string, notes: string, ordersCount: number = 0) {
  const customers = await getCustomers();
  const idx = customers.findIndex(c => c.phone === phone);
  const note: CustomerNote = { phone, name, notes, ordersCount };
  if (idx >= 0) customers[idx] = note;
  else customers.push(note);

  if (isUsingSupabase && supabase) {
    try {
      await supabase.from('customers').upsert({ phone, name, notes, orders_count: ordersCount });
      return;
    } catch (e) { console.warn(e); }
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export async function getRegisteredUsers(): Promise<any[]> {
  if (isUsingSupabase && supabase) {
    try {
      const { data } = await supabase.from('users').select('*');
      const supabaseUsers = (data || []).map((u: any) => ({
        phone: u.phone,
        name: `${u.first_name} ${u.last_name}`.trim(),
        email: u.email || '',
        registeredAt: u.created_at,
      }));
      // Cache to localStorage so local and Supabase stay in sync
      if (typeof window !== 'undefined') {
        const localUsers = supabaseUsers.map(u => ({
          id: 'user_' + Date.now().toString(36), // placeholder, real id from DB if needed
          firstName: u.name.split(' ')[0],
          lastName: u.name.split(' ').slice(1).join(' '),
          phone: u.phone,
          email: u.email,
          createdAt: u.registeredAt,
          password: '', // not needed for display
        }));
        localStorage.setItem('zarathrift_users', JSON.stringify(localUsers));
      }
      return supabaseUsers;
    } catch (e) { console.warn('Supabase getRegisteredUsers failed, falling back to local', e); }
  }
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('zarathrift_users');
    if (!saved) return [];
    const users = JSON.parse(saved);
    return users.map((u: any) => ({
      phone: u.phone,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email || '',
      registeredAt: u.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function saveRegisteredUser(user: any) {
  // Always write to localStorage for demo/offline support
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('zarathrift_users');
      let users = saved ? JSON.parse(saved) : [];
      const localUser = {
        id: user.id,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        phone: user.phone,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt || user.created_at,
      };
      const idx = users.findIndex((u: any) => u.phone === localUser.phone);
      if (idx >= 0) users[idx] = localUser;
      else users.push(localUser);
      localStorage.setItem('zarathrift_users', JSON.stringify(users));
    } catch (e) { console.warn('Local saveRegisteredUser failed', e); }
  }

  if (isUsingSupabase && supabase) {
    try {
      await supabase.from('users').upsert({
        id: user.id,
        first_name: user.firstName || user.first_name,
        last_name: user.lastName || user.last_name,
        phone: user.phone,
        email: user.email,
        password: user.password, // demo only
        created_at: user.createdAt || user.created_at,
      });
      return;
    } catch (e) { console.warn('Supabase saveRegisteredUser failed', e); }
  }
}

// ==================== CONTENT (Homepage) ====================
export async function getContent(): Promise<Record<string, string>> {
  const settings = await getSettings();
  return settings.content || {
    hero_title: 'TIMELESS.<br />THRIFTED.<br />YOUR STYLE.',
    hero_subtitle: 'Premium pre-loved fashion. Carefully selected pieces from the best brands.',
    tagline: 'CURATED IN NIGERIA'
  };
}

export async function saveContent(content: Record<string, string>) {
  const settings = await getSettings();
  await saveSettings({ ...settings, content });
}

// ==================== ORDERS (with notes) ====================
export async function getOrders(): Promise<Order[]> {
  if (isUsingSupabase && supabase) {
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return (data || []).map((o: any) => ({
        id: o.id,
        reference: o.reference,
        items: o.items || [],
        total: o.total,
        customer: o.customer,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        status: o.status,
        createdAt: o.created_at,
        adminNotes: o.admin_notes,
        paymentProof: o.payment_proof,
        trackingNumber: o.tracking_number,
        trackingUpdates: o.tracking_updates || [],
        deliveryFee: o.delivery_fee,
        deliveryNotes: o.delivery_notes,
        discountCode: o.discount_code,
        discountAmount: o.discount_amount,
        driverPhone: o.driver_phone,
        assignedBike: o.assigned_bike,
        deliveryUpdates: o.delivery_updates || [],
        currentLocation: o.current_location,
        estimatedDelivery: o.estimated_delivery,
        cancelRequest: o.cancel_request,
      })) as any;
    } catch (e) { console.warn('Supabase getOrders failed', e); }
  }
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(ORDERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function saveOrders(orders: Order[]) {
  if (isUsingSupabase && supabase) {
    try {
      const sbOrders = orders.map(o => ({
        id: o.id,
        reference: o.reference,
        items: o.items,
        total: o.total,
        customer: o.customer,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        status: o.status,
        created_at: o.createdAt,
        admin_notes: (o as any).adminNotes,
        payment_proof: o.paymentProof,
        tracking_number: o.trackingNumber,
        tracking_updates: o.trackingUpdates || [],
        delivery_fee: o.deliveryFee,
        delivery_notes: o.deliveryNotes,
        discount_code: o.discountCode,
        discount_amount: o.discountAmount,
        driver_phone: o.driverPhone,
        assigned_bike: o.assignedBike,
        delivery_updates: o.deliveryUpdates || [],
        current_location: o.currentLocation,
        estimated_delivery: o.estimatedDelivery,
        cancel_request: o.cancelRequest,
      }));
      await supabase.from('orders').upsert(sbOrders);
      return;
    } catch (e) { console.warn(e); }
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// Sync helper - call after admin changes if using Supabase
export async function syncAllToSupabase() {
  if (!isUsingSupabase) return;
  // Products, orders, settings are saved individually above
  console.log('Data synced to Supabase where possible');
}
