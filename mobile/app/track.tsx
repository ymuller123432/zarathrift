import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getOrders, formatPrice } from '../lib/data';
import { Order } from '../lib/types';

interface Step {
  label: string;
  active: boolean;
  date?: string;
}

function getTrackingSteps(order: Order): Step[] {
  const status = order.status || 'pending';
  const updates = order.trackingUpdates || [];
  const findDate = (s: string) => {
    const u = updates.find(x => x.status === s);
    return u ? new Date(u.date).toLocaleDateString() : undefined;
  };
  const placed = new Date(order.createdAt).toLocaleDateString();

  if (status === 'cancelled') {
    return [
      { label: 'Order Placed', active: true, date: placed },
      { label: 'Cancelled', active: true, date: findDate('cancelled') || new Date().toLocaleDateString() },
    ];
  }

  return [
    { label: 'Order Placed', active: true, date: placed },
    { label: 'Confirmed', active: ['accepted', 'shipped', 'delivered'].includes(status), date: findDate('accepted') },
    { label: 'Shipped', active: ['shipped', 'delivered'].includes(status), date: findDate('shipped') },
    { label: 'Delivered', active: status === 'delivered', date: findDate('delivered') },
  ];
}

export default function TrackScreen() {
  const params = useLocalSearchParams<{ ref?: string }>();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-load from deep link param
  useEffect(() => {
    if (params.ref) {
      setQuery(String(params.ref));
      lookup(String(params.ref));
    }
  }, [params.ref]);

  const lookup = async (q: string) => {
    try {
      const all = await getOrders();
      const upper = q.trim().toUpperCase();
      const found = all.find(o =>
        o.reference.toUpperCase() === upper ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === upper)
      );
      setOrder(found || null);
      setSearched(true);
      if (!found) {
        Alert.alert('Not found', 'No order matches that reference or tracking number.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not look up order.');
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    lookup(query);
  };

  const openWhatsApp = () => {
    if (!order) return;
    const msg = `Hi Zara Thrift, tracking order ${order.reference}${order.trackingNumber ? ` (${order.trackingNumber})` : ''}. Please update me.`;
    const url = `https://wa.me/2348012345678?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp', 'Could not open WhatsApp.'));
  };

  const steps = order ? getTrackingSteps(order) : [];
  const isCancelled = order?.status === 'cancelled';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#888', fontSize: 13 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>TRACK ORDER</Text>
      <Text style={styles.hint}>Enter order reference (ZT-...) or tracking number (ZARA...)</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="ZT-ABC123 or ZARA1234567890"
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>SEARCH</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#333', marginLeft: 6 }} 
          onPress={() => { if (query.trim()) lookup(query.trim()); }}
        >
          <Text style={{ color: '#888', fontSize: 11 }}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {searched && order && (
        <View style={styles.card}>
          {/* Ref + Status */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={styles.label}>ORDER REFERENCE</Text>
              <Text style={styles.ref}>{order.reference}</Text>
            </View>
            <View style={[styles.statusPill, isCancelled ? styles.cancelled : order.status === 'delivered' ? styles.delivered : styles.normal]}>
              <Text style={styles.statusText}>{(order.status || 'PENDING').toUpperCase()}</Text>
            </View>
          </View>

          {/* Tracking # */}
          {order.trackingNumber ? (
            <View style={styles.trackBox}>
              <Text style={styles.label}>TRACKING NUMBER</Text>
              <Text style={styles.trackNum}>{order.trackingNumber}</Text>
              <Text style={styles.trackNote}>Share this with us for faster updates.</Text>
            </View>
          ) : (
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
              Tracking number will be sent via WhatsApp once shipped.
            </Text>
          )}

          {/* Estimated Delivery */}
          {order.estimatedDelivery && (
            <View style={{ backgroundColor: '#0f1f14', borderWidth: 1, borderColor: '#14532d', padding: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
              <View>
                <Text style={{ color: '#4ade80', fontSize: 10, letterSpacing: 1 }}>ESTIMATED DELIVERY</Text>
                <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '600' }}>
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          )}

          {/* Logistic Bike + that the order is moving */}
          {order.assignedBike && (
            <View style={{ backgroundColor: '#111', borderWidth: 1, borderColor: '#333', padding: 10, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>🚲</Text>
                <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '600' }}>DELIVERED BY BIKE</Text>
              </View>
              <Text style={{ color: '#f5f5f5', fontSize: 13, marginTop: 2 }}>
                {order.assignedBike.riderName} on <Text style={{ fontFamily: 'monospace', color: '#4ade80' }}>{order.assignedBike.bikeNumber}</Text>
              </Text>
              {order.currentLocation && (
                <Text style={{ color: '#4ade80', marginTop: 4 }}>Last seen: {order.currentLocation}</Text>
              )}
              {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
                <Text style={{ color: '#888', fontSize: 10, marginTop: 3 }}>{order.deliveryUpdates.length} live updates — bike is moving</Text>
              )}
            </View>
          )}

          {/* Progress - prettier vertical timeline */}
          <Text style={styles.label}>PROGRESS</Text>
          {isCancelled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#f87171', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#111', fontSize: 10 }}>✕</Text>
              </View>
              <Text style={{ color: '#f87171', marginLeft: 10, fontSize: 13 }}>This order was cancelled</Text>
            </View>
          ) : (
            <View style={{ marginTop: 6, marginBottom: 10 }}>
              {steps.map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: i < steps.length - 1 ? 10 : 0 }}>
                  <View style={{ alignItems: 'center', width: 22 }}>
                    <View style={[styles.dot, step.active ? styles.dotActive : styles.dotInactive, { width: 14, height: 14 }]} />
                    {i < steps.length - 1 && (
                      <View style={{ width: 2, flex: 1, backgroundColor: step.active && steps[i+1].active ? '#fff' : '#333', marginVertical: 2 }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 8, paddingTop: 1 }}>
                    <Text style={{ color: step.active ? '#f5f5f5' : '#666', fontSize: 13, fontWeight: '500' }}>{step.label}</Text>
                    {step.date && <Text style={{ color: '#555', fontSize: 10, marginTop: 1 }}>{step.date}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent bike movements so customer sees the order moving */}
          {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>BIKE MOVEMENTS (LIVE)</Text>
              {order.deliveryUpdates.slice().reverse().slice(0, 4).map((u, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 11 }}>
                    {new Date(u.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — at <Text style={{ color: '#4ade80' }}>{u.location}</Text>
                    {u.note ? ` (${u.note})` : ''}
                  </Text>
                  {u.lat && u.lng && (
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`https://www.google.com/maps?q=${u.lat},${u.lng}`)}
                      style={{ marginLeft: 12, marginTop: 1 }}
                    >
                      <Text style={{ color: '#4ade80', fontSize: 10, textDecorationLine: 'underline' }}>
                        GPS: {u.lat.toFixed(5)}, {u.lng.toFixed(5)} — Open in Maps
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <Text style={{ color: '#555', fontSize: 9, marginTop: 2 }}>Admin updates these as the bike moves. Re-open this screen to refresh.</Text>
            </View>
          )}

          {/* Note about richer visual route on web */}
          {order.deliveryUpdates && order.deliveryUpdates.length > 1 && (
            <Text style={{ color: '#555', fontSize: 9, marginBottom: 8, fontStyle: 'italic' }}>
              For the visual live route map (growing path), open the Track page on the website.
            </Text>
          )}

          {/* History */}
          {order.trackingUpdates && order.trackingUpdates.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>HISTORY</Text>
              {order.trackingUpdates.slice().reverse().map((u, i) => (
                <Text key={i} style={styles.historyLine}>
                  {new Date(u.date).toLocaleDateString()} — {u.status}{u.note ? ` (${u.note})` : ''}
                </Text>
              ))}
            </View>
          )}

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={{ color: '#ccc', fontSize: 13 }}>{order.items?.length || 0} item(s) • {formatPrice(order.total)}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              To: {order.customer.city}{order.customer.state ? ', ' + order.customer.state : ''}
            </Text>
          </View>

          {/* Live map placeholder */}
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' }}>
            <Text style={{ color: '#666', fontSize: 10, letterSpacing: 1 }}>LIVE TRACKING</Text>
            <Text style={{ color: '#555', fontSize: 11, marginTop: 3 }}>Real-time map &amp; courier GPS coming soon. Message us with your tracking number for live location.</Text>
          </View>

          <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp}>
            <Text style={styles.waText}>MESSAGE US ON WHATSAPP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/account')}>
            <Text style={styles.secondaryText}>VIEW IN MY ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      )}

      {searched && !order && (
        <View style={styles.notFound}>
          <Text style={{ color: '#ccc' }}>Order not found.</Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
            Double-check the reference from your confirmation or WhatsApp message.
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.replace('/(tabs)/account')} style={{ marginTop: 30, alignSelf: 'center' }}>
        <Text style={{ color: '#666', fontSize: 12 }}>Back to account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  hint: { color: '#888', fontSize: 12, marginBottom: 16 },
  searchRow: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#111', borderColor: '#333', borderWidth: 1, color: '#f5f5f5', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'monospace' },
  searchBtn: { backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 20, marginLeft: 8, borderRadius: 2 },
  searchBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 16, borderRadius: 6 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  ref: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  normal: { backgroundColor: '#222' },
  delivered: { backgroundColor: '#052e16' },
  cancelled: { backgroundColor: '#3f1f1f' },
  trackBox: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', padding: 12, marginBottom: 16 },
  trackNum: { color: '#4ade80', fontSize: 16, fontFamily: 'monospace', marginTop: 2 },
  trackNote: { color: '#666', fontSize: 10, marginTop: 4 },
  dot: { width: 11, height: 11, borderRadius: 6, marginBottom: 4 },
  dotActive: { backgroundColor: '#fff' },
  dotInactive: { backgroundColor: '#333' },
  stepLabel: { color: '#555', fontSize: 10, textAlign: 'center' },
  stepDate: { color: '#444', fontSize: 9, marginTop: 1 },
  historyLine: { color: '#888', fontSize: 11, marginBottom: 3 },
  summary: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#222' },
  waBtn: { marginTop: 18, backgroundColor: '#25D366', paddingVertical: 13, alignItems: 'center', borderRadius: 3 },
  waText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  secondaryBtn: { marginTop: 10, borderWidth: 1, borderColor: '#444', paddingVertical: 12, alignItems: 'center', borderRadius: 2 },
  secondaryText: { color: '#aaa', fontSize: 12 },
  notFound: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 16, marginTop: 10 },
});
