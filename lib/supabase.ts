import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if using Supabase (real backend) or localStorage (demo)
export const isUsingSupabase = !!supabase;

// Types for Supabase tables (you'll need to create these in Supabase dashboard)
// Run the updated supabase-setup.sql in your project's SQL Editor.

export type SupabaseProduct = {
  id: string;
  name: string;
  price: number;
  original_brand?: string;
  size: string;
  condition: string;
  gender: string;
  category: string;
  description: string;
  images: string[];
  measurements?: string;
  material?: string;
  in_stock: boolean;
  quantity: number;
  featured: boolean;
  photo_captions?: string[]; // for per-photo captions
  condition_closeups?: string[]; // separate uploads
  created_at?: string;
};

export type SupabaseOrder = {
  id: string;
  reference: string;
  items: any[];
  total: number;
  customer: any;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  admin_notes?: string;
  payment_proof?: string;
};

export type SupabaseSetting = {
  key: string;
  value: any;
};

export type SupabaseDiscount = {
  code: string;
  percent: number;
  active: boolean;
};

export type SupabaseCustomer = {
  phone: string;
  name: string;
  notes?: string;
  orders_count?: number;
};

export type SupabaseContent = {
  key: string;
  value: string;
};