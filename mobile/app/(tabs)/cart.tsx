import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCart, saveCart, formatPrice, getCurrentUser } from '../../lib/data';
import { CartItem } from '../../lib/types';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<CartItem[]>([]);

  const load = async () => {
    const c = await getCart();
    setCart(c);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const updateQty = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    const updated = cart.map(item => item.id === id ? { ...item, quantity: newQty } : item);
    setCart(updated);
    await saveCart(updated);
  };

  const removeItem = async (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    await saveCart(updated);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.shopBtnText}>BROWSE COLLECTION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {cart.map(item => (
          <View key={item.id} style={styles.row}>
            <Image source={{ uri: item.images?.[0] }} style={styles.img} />
            <View style={styles.details}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.meta}>{item.size} / {item.condition}</Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyCtrl} onPress={() => updateQty(item.id, (item.quantity || 1) - 1)}><Text style={styles.ctrlText}>-</Text></TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity || 1}</Text>
                <TouchableOpacity style={styles.qtyCtrl} onPress={() => updateQty(item.id, (item.quantity || 1) + 1)}><Text style={styles.ctrlText}>+</Text></TouchableOpacity>
                <TouchableOpacity style={styles.remove} onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeText}>REMOVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL</Text>
          <Text style={styles.total}>{formatPrice(subtotal)}</Text>
        </View>
        <Text style={styles.note}>Shipping calculated at checkout. Pay via Moniepoint transfer.</Text>

        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/shop')} style={{ marginTop: 10 }}>
          <Text style={styles.continue}>CONTINUE SHOPPING</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  emptyTitle: { color: '#888', fontSize: 18 },
  shopBtn: { marginTop: 20, borderWidth: 1, borderColor: '#f5f5f5', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 4 },
  shopBtnText: { color: '#f5f5f5', letterSpacing: 1 },

  row: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 4, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  img: { width: 78, height: 78, backgroundColor: '#222' },
  details: { flex: 1, padding: 12, justifyContent: 'space-between' },
  name: { color: '#f5f5f5', fontSize: 12, fontWeight: '600' },
  meta: { color: '#777', fontSize: 10, marginTop: 1 },
  price: { color: '#f5f5f5', fontWeight: '700', marginTop: 2, fontSize: 13 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyCtrl: { width: 28, height: 28, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  ctrlText: { color: '#ddd', fontSize: 16 },
  qtyNum: { color: '#fff', width: 28, textAlign: 'center', fontWeight: '600' },
  remove: { marginLeft: 'auto', paddingHorizontal: 8 },
  removeText: { color: '#ef4444', fontSize: 11, letterSpacing: 0.5 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000', padding: 18, borderTopWidth: 1, borderTopColor: '#222' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { color: '#888', fontSize: 11, letterSpacing: 1 },
  total: { color: '#f5f5f5', fontSize: 20, fontWeight: '700' },
  note: { color: '#555', fontSize: 11, marginBottom: 14 },
  checkoutBtn: { backgroundColor: '#f5f5f5', paddingVertical: 11, borderRadius: 3, alignItems: 'center' },
  checkoutText: { color: '#0a0a0a', fontWeight: '700', letterSpacing: 0.5, fontSize: 12 },
  continue: { color: '#666', textAlign: 'center', fontSize: 12, letterSpacing: 1 },
});
