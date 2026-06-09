export interface Product {
  id: string;
  name: string;
  price: number; // in NGN
  originalBrand?: string;
  size: string;
  condition: 'Excellent' | 'Good' | 'Fair';
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  category: 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Footwear' | 'Accessories';
  description: string;
  images: string[]; // array of image URLs (use high quality photos in production)
  measurements?: string;
  material?: string;
  inStock: boolean;
  quantity?: number; // admin managed stock for thrift items
  featured?: boolean; // show on homepage
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number; // items subtotal (before discount + delivery)
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    state?: string;
    city: string;
    notes?: string;
  };
  paymentMethod: 'moniepoint';
  paymentStatus: 'pending' | 'verified' | 'failed';
  status: 'pending' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';
  reference: string;
  createdAt: string;
  paymentProof?: string;
  // Discount
  discountCode?: string;
  discountAmount?: number;
  // Delivery
  deliveryFee?: number;
  deliveryNotes?: string; // admin notes on how calculated (e.g. "Mainland - standard")
  // Tracking updates for WhatsApp notifications
  trackingUpdates?: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  trackingNumber?: string; // manual tracking number set by admin
  estimatedDelivery?: string; // ISO date string set by admin (shown to customer)
  // Logistic bike assignment (new for delivery bike)
  assignedBike?: {
    bikeId: string;
    riderName: string;
    bikeNumber: string; // e.g. "NG-LOG-042"
  };
  // For automatic driver app updates
  driverPhone?: string; // phone of the driver/rider assigned to this delivery
  // Bike movement / live updates (now can come automatically from driver app)
  deliveryUpdates?: Array<{
    timestamp: string;
    location: string; // e.g. "Yaba roundabout", "Approaching customer address"
    note?: string;
    lat?: number;   // real GPS latitude
    lng?: number;   // real GPS longitude
  }>;
  currentLocation?: string; // latest quick view of where the bike is
  // Customer cancel/refund request
  cancelRequest?: {
    type: 'cancel' | 'refund';
    requestedAt: string;
    reason?: string;
    adminStatus?: 'pending' | 'approved' | 'rejected';
  };
}

export interface BusinessConfig {
  accountName: string;
  accountNumber: string;
  bankName: string; // Moniepoint
  whatsappNumber: string;
  // Delivery settings for Lagos (admin managed)
  lagosDeliveryFee: number;        // default fee for most of Lagos
  lagosFreeThreshold: number;      // free delivery if items total >= this (e.g. 35000)
  lagosIslandSurcharge: number;    // extra for Victoria Island, Ikoyi, Lekki etc.
  lagosMainlandFee: number;        // e.g. Surulere, Yaba, Ikeja
}

// New for admin features
export interface DiscountCode {
  code: string;
  percent: number;
  active: boolean;
}

export interface CustomerNote {
  phone: string;
  name: string;
  notes: string;
  ordersCount: number;
}

export interface ContentBlock {
  key: string; // e.g. 'hero_title', 'hero_subtitle', 'tagline'
  value: string;
}

export interface OrderWithNotes extends Order {
  adminNotes?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string; // Note: In real app, never store plain text. Use Supabase Auth or hash.
  createdAt: string;
}
