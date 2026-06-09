import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { getCurrentUser, getCart, formatPrice, getActiveDiscounts, calculateDiscount, placeOrder, generateOrderReference, nigerianStates } from '../lib/data';
import { CartItem, Order } from '../lib/types';

const MONIEPOINT = {
  bank: 'Moniepoint Microfinance Bank',
  accountNumber: '0123456789',
  accountName: 'ZARA THRIFT LTD',
  note: 'Use your order reference (ZT-...) as payment narration',
};

export default function Checkout() {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showStates, setShowStates] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ reference: string; total: number; items: CartItem[] } | null>(null);

  useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      setUser(u);
      const c = await getCart();
      setCart(c);

      if (u) {
        setFullName(`${u.firstName || ''} ${u.lastName || ''}`.trim());
        setPhone(u.phone || '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyDiscount = async () => {
    setDiscountError('');
    if (!discountCode.trim()) {
      setAppliedDiscount(null);
      return;
    }
    const active = await getActiveDiscounts();
    const res = calculateDiscount(subtotal, discountCode, active);
    if (res.valid && res.discountAmount > 0) {
      setAppliedDiscount({ percent: res.percent, amount: res.discountAmount });
      setDiscountError('');
    } else {
      setAppliedDiscount(null);
      setDiscountError('Invalid or inactive code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim() || !state) {
      Alert.alert('Missing info', 'Please fill name, phone, address, city and select a state.');
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const reference = generateOrderReference();
      const order: Order = {
        id: 'ord_' + Date.now(),
        reference,
        customer: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: user?.email || undefined,
          address: address.trim(),
          city: city.trim(),
          state,
        },
        items: cart.map(i => ({ ...i })),
        total,
        discountCode: appliedDiscount ? discountCode.toUpperCase() : undefined,
        discountAmount: discountAmount || undefined,
        paymentMethod: 'moniepoint',
        status: 'pending',
        createdAt: new Date().toISOString(),
        deliveryFee: 0,                    // Admin calculates final Lagos delivery fee
        deliveryNotes: undefined,
        trackingUpdates: [{ status: 'pending', date: new Date().toISOString(), note: 'Order received' }],
      };

      await placeOrder(order as any);

      setOrderSuccess({ reference, total, items: [...cart] });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    if (!orderSuccess) return;
    const itemsList = orderSuccess.items.slice(0, 3).map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
    const more = orderSuccess.items.length > 3 ? ` +${orderSuccess.items.length - 3} more` : '';
    const msg = `Hi Zara Thrift, I just placed order ${orderSuccess.reference} for NGN ${orderSuccess.total}. Items: ${itemsList}${more}. I have paid / will pay via Moniepoint. Please confirm.`;
    const url = `https://wa.me/2348012345678?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp', 'Could not open WhatsApp. Please message us manually with your reference.');
    });
  };

  if (loading) {
    return <View style={styles.container}><Text style={{ color: '#888' }}>Loading...</Text></View>;
  }

  if (orderSuccess) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContainer}>
        <Text style={styles.successTitle}>ORDER PLACED</Text>
        <Text style={styles.reference}>{orderSuccess.reference}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PAY VIA MONIEPOINT</Text>
          <Text style={styles.monieLabel}>Bank</Text>
          <Text style={styles.monieValue}>{MONIEPOINT.bank}</Text>
          <Text style={styles.monieLabel}>Account Number</Text>
          <Text style={styles.monieValue}>{MONIEPOINT.accountNumber}</Text>
          <Text style={styles.monieLabel}>Account Name</Text>
          <Text style={styles.monieValue}>{MONIEPOINT.accountName}</Text>
          <Text style={styles.monieNote}>{MONIEPOINT.note}</Text>

          <View style={styles.divider} />
          <Text style={styles.payAmount}>PAY EXACTLY: {formatPrice(orderSuccess.total)}</Text>
          <Text style={styles.payRef}>Reference to use: {orderSuccess.reference}</Text>
        </View>

        <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp}>
          <Text style={styles.waText}>OPEN WHATSAPP &amp; SEND CONFIRMATION</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.homeText}>BACK TO HOME</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.homeBtn, { marginTop: 8, backgroundColor: '#222', borderWidth: 1, borderColor: '#444' }]} 
          onPress={() => router.push({ pathname: '/track', params: { ref: orderSuccess.reference } })}
        >
          <Text style={[styles.homeText, { color: '#ccc' }]}>TRACK THIS ORDER</Text>
        </TouchableOpacity>

        <Text style={styles.help}>After transfer, message us on WhatsApp with the reference above. We will confirm and ship.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Text style={styles.title}>CHECKOUT</Text>
      <Text style={styles.subtitle}>Pay manually via Moniepoint after placing order.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DELIVERY DETAILS</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#555"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#555"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder="Delivery address (street, landmark)"
          placeholderTextColor="#555"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <TouchableOpacity style={styles.stateBtn} onPress={() => setShowStates(true)}>
          <Text style={[styles.stateBtnText, !state && { color: '#555' }]}>
            {state || 'SELECT STATE (all 36 + FCT)'}
          </Text>
          <Text style={styles.stateArrow}>v</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="City / Town"
          placeholderTextColor="#555"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DISCOUNT CODE</Text>
        <View style={styles.discountRow}>
          <TextInput
            style={[styles.input, styles.discountInput]}
            placeholder="THRIFT10 or ZARA20"
            placeholderTextColor="#555"
            value={discountCode}
            onChangeText={(t) => { setDiscountCode(t); setDiscountError(''); }}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyBtn} onPress={applyDiscount}>
            <Text style={styles.applyText}>APPLY</Text>
          </TouchableOpacity>
        </View>
        {appliedDiscount && (
          <Text style={styles.discountOk}>Applied: {appliedDiscount.percent}% off (-{formatPrice(appliedDiscount.amount)})</Text>
        )}
        {!!discountError && <Text style={styles.discountErr}>{discountError}</Text>}
        <Text style={styles.hint}>Try THRIFT10 or ZARA20</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        {appliedDiscount && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.discountVal}>-{formatPrice(discountAmount)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <Text style={styles.payNote}>Payment method: Moniepoint (manual transfer after order)</Text>
      </View>

      <TouchableOpacity
        style={[styles.placeBtn, submitting && { opacity: 0.6 }]}
        onPress={handlePlaceOrder}
        disabled={submitting}
      >
        <Text style={styles.placeText}>{submitting ? 'PLACING ORDER...' : 'PLACE ORDER & SEE PAYMENT DETAILS'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#666', textAlign: 'center' }}>BACK TO CART</Text>
      </TouchableOpacity>

      <Modal visible={showStates} animationType="slide" onRequestClose={() => setShowStates(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SELECT STATE</Text>
            <TouchableOpacity onPress={() => setShowStates(false)}>
              <Text style={styles.modalClose}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {nigerianStates.map((s: string) => (
              <TouchableOpacity
                key={s}
                style={[styles.stateItem, state === s && styles.stateItemActive]}
                onPress={() => {
                  setState(s);
                  setShowStates(false);
                }}
              >
                <Text style={[styles.stateItemText, state === s && styles.stateItemTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4, letterSpacing: 1 },
  subtitle: { color: '#666', fontSize: 12, marginBottom: 16 },

  section: { marginBottom: 18, backgroundColor: '#111', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#222' },
  sectionLabel: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },

  input: { backgroundColor: '#0a0a0a', color: '#f5f5f5', borderWidth: 1, borderColor: '#333', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, marginBottom: 8 },
  stateBtn: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stateBtnText: { color: '#f5f5f5', fontSize: 15 },
  stateArrow: { color: '#666', fontSize: 12 },

  discountRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  discountInput: { flex: 1, marginBottom: 0 },
  applyBtn: { backgroundColor: '#f5f5f5', paddingHorizontal: 18, justifyContent: 'center', borderRadius: 6 },
  applyText: { color: '#0a0a0a', fontWeight: '700', letterSpacing: 0.5 },
  discountOk: { color: '#22c55e', fontSize: 12, marginTop: 6 },
  discountErr: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  hint: { color: '#555', fontSize: 11, marginTop: 4 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#f5f5f5', fontSize: 14 },
  discountVal: { color: '#22c55e', fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 8, marginTop: 6 },
  totalLabel: { color: '#f5f5f5', fontSize: 15, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  payNote: { color: '#555', fontSize: 11, marginTop: 8 },

  placeBtn: { backgroundColor: '#f5f5f5', paddingVertical: 12, borderRadius: 3, alignItems: 'center', marginTop: 6 },
  placeText: { color: '#0a0a0a', fontWeight: '700', letterSpacing: 0.5, fontSize: 13 },

  successContainer: { padding: 20, alignItems: 'center' },
  successTitle: { color: '#22c55e', fontSize: 14, letterSpacing: 3, marginBottom: 8 },
  reference: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },
  card: { width: '100%', backgroundColor: '#111', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#222', marginBottom: 16 },
  cardTitle: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  monieLabel: { color: '#555', fontSize: 11, marginTop: 8 },
  monieValue: { color: '#f5f5f5', fontSize: 16, fontWeight: '600' },
  monieNote: { color: '#666', fontSize: 11, marginTop: 12, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 14 },
  payAmount: { color: '#fff', fontSize: 18, fontWeight: '700' },
  payRef: { color: '#aaa', fontSize: 13, marginTop: 4 },
  waBtn: { backgroundColor: '#25D366', paddingVertical: 11, borderRadius: 3, alignItems: 'center', width: '100%', marginBottom: 8 },
  waText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  homeBtn: { borderWidth: 1, borderColor: '#444', paddingVertical: 14, borderRadius: 4, alignItems: 'center', width: '100%' },
  homeText: { color: '#888' },
  help: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 16 },

  modal: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalClose: { color: '#888', fontSize: 14 },
  stateItem: { paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  stateItemActive: { backgroundColor: '#222' },
  stateItemText: { color: '#ddd', fontSize: 15 },
  stateItemTextActive: { color: '#fff', fontWeight: '600' },
});
