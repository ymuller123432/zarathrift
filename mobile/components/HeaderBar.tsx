import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { getCurrentUser, getCart } from '../lib/data';
import { User } from '../lib/types';

export function HeaderBar() {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  const load = async () => {
    const u = await getCurrentUser();
    setUser(u);
    const c = await getCart();
    const count = c.reduce((sum, i) => sum + (i.quantity || 1), 0);
    setCartCount(count);
  };

  useEffect(() => {
    load();
  }, [pathname]);

  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.logo}>ZARA THRIFT</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => router.push('/shop')}>
          <Text style={styles.actionText}>SHOP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => router.push('/cart')}>
          <Text style={styles.actionText}>CART</Text>
          {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity style={styles.action} onPress={() => router.push('/account')}>
            <Text style={styles.actionText}>{user.firstName.toUpperCase()}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.action} onPress={() => router.push('/login')}>
            <Text style={styles.actionText}>LOGIN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  logo: { color: '#f5f5f5', fontWeight: '800', letterSpacing: 2, fontSize: 15 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#ccc', fontSize: 12, letterSpacing: 1 },
  badge: { backgroundColor: '#f5f5f5', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 4, paddingHorizontal: 4 },
  badgeText: { color: '#0a0a0a', fontSize: 10, fontWeight: '700' },
});
