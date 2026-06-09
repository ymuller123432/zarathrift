export interface Product {
  id: string;
  name: string;
  price: number;
  originalBrand?: string;
  size: string;
  condition: 'Excellent' | 'Good' | 'Fair';
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  category: 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Footwear' | 'Accessories';
  description: string;
  images: string[];
  measurements?: string;
  material?: string;
  featured?: boolean;
  quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
  };
  items: CartItem[];
  total: number;
  discountCode?: string;
  discountAmount?: number;
  paymentMethod: 'moniepoint';
  status: string;
  createdAt: string;
  deliveryFee?: number;
  deliveryNotes?: string;
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

export interface DiscountCode {
  code: string;
  percent: number;
  active: boolean;
}
