import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// For Expo, use EXPO_PUBLIC_ prefixed vars or configure in app.json extra.
// Recommended: Add to your .env (and .env.local) and use with expo:
// EXPO_PUBLIC_SUPABASE_URL=...
// EXPO_PUBLIC_SUPABASE_ANON_KEY=...

const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL; // fallback if sharing config

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Helper to check if using Supabase (real backend) or AsyncStorage (demo)
export const isUsingSupabase = !!supabase;

// Types for Supabase tables - extend as needed
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
  driver_phone?: string;
  assigned_bike?: any;
  delivery_updates?: any[];
  current_location?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  // add other fields as you expand
};

// To configure env in Expo:
// 1. Create app.config.js or use app.json "extra"
// 2. Or use .env with expo-constants
// 3. For EAS builds: expo env:edit or eas secrets
// 
// Example app.json extra:
// "extra": {
//   "supabaseUrl": "https://xxx.supabase.co",
//   "supabaseAnonKey": "eyJ..."
// },
// Then access via Constants.expoConfig.extra.supabaseUrl

// IMPORTANT for Realtime + driver sync:
// 1. In Supabase SQL Editor, run:
//    ALTER TABLE orders 
//    ADD COLUMN IF NOT EXISTS delivery_updates JSONB DEFAULT '[]',
//    ADD COLUMN IF NOT EXISTS current_location TEXT,
//    ADD COLUMN IF NOT EXISTS driver_phone TEXT,
//    ADD COLUMN IF NOT EXISTS assigned_bike JSONB,
//    ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;
//
// 2. Enable Realtime:
//    - Supabase Dashboard → Database → Replication
//    - Toggle ON for the "orders" table
//
// 3. RLS policies (example for demo):
//    - Allow drivers (via phone or anon) to UPDATE orders where driver_phone = auth.jwt() or similar
//    - Customers can SELECT their orders
//
// 4. In your Expo app.json or eas, set extra or use EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
//
// The driver app will now push real GPS + notes automatically, and customer /track pages
// (when using Supabase getOrders) will see live updates across devices.