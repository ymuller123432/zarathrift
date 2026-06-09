import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, getUserOrders, formatPrice, updateOrder } from '../../lib/data';

export default function Account() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [quickTrack, setQuickTrack] = useState('');

  useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u?.phone) {
        const myOrders = await getUserOrders(u.phone);
        setOrders(myOrders.slice(0, 10));
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    const { logout } = await import('../../lib/auth');
    await logout();
    router.replace('/');
  };

  const requestCancelOrRefund = async (orderId: string, type: 'cancel' | 'refund') => {
    const reason = 'Customer requested via mobile app';
    try {
      await updateOrder(orderId, {
        cancelRequest: {
          type,
          requestedAt: new Date().toISOString(),
          reason,
          adminStatus: 'pending',
        },
      } as any);
      // Refresh list
      if (user?.phone) {
        const myOrders = await getUserOrders(user.phone);
        setOrders(myOrders.slice(0, 10));
      }
      alert(`${type} request submitted. Admin will review.`);
    } catch (e) {
      alert('Failed to submit request');
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.notSignedIn, { paddingTop: insets.top }]}>
        <Text style={styles.notSignedText}>Not signed in.</Text>
        <Text style={styles.hint}>Use the demo account: 08012345678 / Demo123!</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>MY ACCOUNT</Text>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <Text style={styles.phone}>{user.phone}</Text>
      {user.email ? <Text style={styles.phone}>{user.email}</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>SIGN OUT</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: '#222', marginTop: 8 }]} 
        onPress={() => router.push('/driver')}
      >
        <Text style={[styles.btnText, { color: '#4ade80' }]}>SWITCH TO DRIVER MODE (Live GPS)</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 32 }}>
        <Text style={styles.section}>TRACK ORDER</Text>
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: '#111', borderColor: '#333', borderWidth: 1, color: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }}
            placeholder="Reference or tracking #"
            placeholderTextColor="#555"
            value={quickTrack}
            onChangeText={setQuickTrack}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={{ backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 16, marginLeft: 6 }}
            onPress={() => {
              if (quickTrack.trim()) {
                router.push({ pathname: '/track', params: { ref: quickTrack.trim() } });
              }
            }}
          >
            <Text style={{ color: '#0a0a0a', fontSize: 11, fontWeight: '700' }}>GO</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>ORDER HISTORY</Text>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No orders yet. Start shopping!</Text>
        ) : (
          orders.map((o, idx) => (
            <View key={idx} style={styles.orderCard}>
              <View style={styles.orderHead}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/track', params: { ref: o.reference } })}>
                  <Text style={[styles.orderRef, { textDecorationLine: 'underline' }]}>{o.reference}</Text>
                </TouchableOpacity>
                <Text style={styles.orderTotal}>{formatPrice(o.total)}</Text>
              </View>
              <Text style={styles.orderMeta}>{o.customer.city}, {o.customer.state}  |  {o.items?.length || 0} item(s)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={[styles.orderStatus, { color: (o.status === 'cancelled' || o.status === 'rejected') ? '#f87171' : o.status === 'delivered' ? '#4ade80' : '#22c55e' }]}>{(o.status || 'pending').toUpperCase()}</Text>
                {o.trackingNumber && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/track', params: { ref: o.trackingNumber } })}>
                    <Text style={{ color: '#aaa', fontSize: 10, marginLeft: 8, textDecorationLine: 'underline' }}>Track: {o.trackingNumber} →</Text>
                  </TouchableOpacity>
                )}
                {o.estimatedDelivery && (
                  <Text style={{ color: '#4ade80', fontSize: 9, marginLeft: 8, marginTop: 1 }}>Est: {new Date(o.estimatedDelivery).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</Text>
                )}
                {o.assignedBike && (
                  <Text style={{ color: '#4ade80', fontSize: 9, marginLeft: 8, marginTop: 1 }}>
                    🚲 {o.assignedBike.bikeNumber} {o.currentLocation ? `• ${o.currentLocation}` : ''}
                  </Text>
                )}
              </View>
              {o.trackingUpdates && o.trackingUpdates.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ color: '#888', fontSize: 10 }}>Tracking History:</Text>
                  {o.trackingUpdates.map((u: any, i: number) => (
                    <Text key={i} style={{ color: '#666', fontSize: 9, marginLeft: 8 }}>
                      • {u.status} - {new Date(u.date).toLocaleDateString()} {u.note ? `(${u.note})` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Cancel/Refund Request UI */}
              {(o.status === 'pending' || o.status === 'accepted') && (
                <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#333' }}>
                  {o.cancelRequest && o.cancelRequest.adminStatus === 'pending' ? (
                    <Text style={{ color: '#f59e0b', fontSize: 10 }}>
                      {o.cancelRequest.type} requested — awaiting admin.
                    </Text>
                  ) : o.cancelRequest && o.cancelRequest.adminStatus === 'approved' ? (
                    <Text style={{ color: '#22c55e', fontSize: 10 }}>
                      {o.cancelRequest.type} approved.
                    </Text>
                  ) : o.cancelRequest && o.cancelRequest.adminStatus === 'rejected' ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ color: '#ef4444', fontSize: 9 }}>Request rejected.</Text>
                      <TouchableOpacity 
                        onPress={() => requestCancelOrRefund(o.id, 'cancel')}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#444', borderRadius: 2 }}
                      >
                        <Text style={{ color: '#888', fontSize: 9 }}>Request Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => requestCancelOrRefund(o.id, 'refund')}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#444', borderRadius: 2 }}
                      >
                        <Text style={{ color: '#888', fontSize: 9 }}>Request Refund</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => requestCancelOrRefund(o.id, 'cancel')}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#444', borderRadius: 2 }}
                      >
                        <Text style={{ color: '#888', fontSize: 9 }}>Request Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => requestCancelOrRefund(o.id, 'refund')}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#444', borderRadius: 2 }}
                      >
                        <Text style={{ color: '#888', fontSize: 9 }}>Request Refund</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  notSignedIn: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  notSignedText: { 
    color: '#f5f5f5', 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  },
  hint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 260
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  name: { color: '#f5f5f5', fontSize: 14, marginBottom: 1 },
  phone: { color: '#888', fontSize: 11, marginBottom: 1 },
  btn: { backgroundColor: '#f5f5f5', paddingVertical: 9, borderRadius: 3, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#0a0a0a', fontWeight: '700' },
  section: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  empty: { color: '#555', fontSize: 13 },
  orderCard: { backgroundColor: '#111', borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  orderHead: { flexDirection: 'row', justifyContent: 'space-between' },
  orderRef: { color: '#fff', fontWeight: '700' },
  orderTotal: { color: '#f5f5f5', fontWeight: '600' },
  orderMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  orderStatus: { color: '#22c55e', fontSize: 11, marginTop: 6, letterSpacing: 1 },
});
