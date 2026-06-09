import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getOrders, addDeliveryUpdate, formatPrice } from '../lib/data';
import { supabase } from '../lib/supabase';

const LOCATION_TASK_NAME = 'zarathrift-background-location-task';
const CURRENT_TRACKING_KEY = 'zarathrift_current_driver_tracking';

// Define background task (works best in dev builds, limited in Expo Go)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      try {
        const orderId = await AsyncStorage.getItem(CURRENT_TRACKING_KEY); // note: need import
        if (orderId) {
          const { latitude, longitude, speed } = location.coords;
          const speedKmh = speed != null ? Math.round(speed * 3.6) : null;
          const update = {
            timestamp: new Date().toISOString(),
            location: `Background - ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            note: speedKmh ? `Speed: ${speedKmh} km/h (background)` : 'Auto background update',
          };
          // This will use Supabase if configured
          await addDeliveryUpdate(orderId, update);
        }
      } catch (e) {
        console.warn('Background update failed', e);
      }
    }
  }
});

export default function DriverScreen() {
  const [driverPhone, setDriverPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedRef, setSelectedRef] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [status, setStatus] = useState('Idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'active'>('all');
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [driverNote, setDriverNote] = useState('');

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn, driverPhone, searchTerm, filterMode]);

  const loadOrders = async () => {
    const all = await getOrders();
    let relevant = all
      .filter((o: any) => !!o.assignedBike) // only orders with bikes assigned
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Better filtering
    if (filterMode === 'assigned' && driverPhone) {
      relevant = relevant.filter((o: any) => o.driverPhone === driverPhone);
    } else if (filterMode === 'active') {
      relevant = relevant.filter((o: any) => o.status === 'shipped' || o.status === 'accepted');
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toUpperCase().trim();
      relevant = relevant.filter((o: any) => 
        o.reference.toUpperCase().includes(term) ||
        (o.customer?.name || '').toUpperCase().includes(term) ||
        (o.customer?.city || '').toUpperCase().includes(term)
      );
    }

    setOrders(relevant.slice(0, 15));
  };

  const sendOtp = async () => {
    if (!driverPhone.trim()) {
      Alert.alert('Enter phone', 'Please enter your driver phone number');
      return;
    }
    if (!supabase) {
      // Fallback for local/demo: just login with phone
      setIsLoggedIn(true);
      setStatus('Logged in (demo mode - no Supabase)');
      return;
    }
    setIsSendingOtp(true);
    try {
      // Format phone - assume user enters with country code or add +234 for NG demo
      let phone = driverPhone.trim();
      if (!phone.startsWith('+')) {
        phone = '+234' + phone.replace(/^0/, ''); // simple NG formatting
      }
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setShowOtpInput(true);
      Alert.alert('OTP Sent', 'Check your phone for the 6-digit code.');
    } catch (e: any) {
      Alert.alert('Error sending OTP', e.message || 'Failed to send code. Check phone format or Supabase config.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim() || !driverPhone.trim()) {
      Alert.alert('Enter code', 'Please enter the 6-digit OTP.');
      return;
    }
    if (!supabase) {
      setIsLoggedIn(true);
      setStatus('Logged in (demo)');
      return;
    }
    setIsVerifying(true);
    try {
      let phone = driverPhone.trim();
      if (!phone.startsWith('+')) {
        phone = '+234' + phone.replace(/^0/, '');
      }
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp.trim(),
        type: 'sms',
      });
      if (error) throw error;
      setIsLoggedIn(true);
      setShowOtpInput(false);
      setOtp('');
      // Use the verified phone if available
      if (data?.user?.phone) {
        setDriverPhone(data.user.phone);
      }
      setStatus('Logged in via Supabase Auth');
    } catch (e: any) {
      Alert.alert('Verification failed', e.message || 'Invalid code. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loginAsDriver = () => {
    // Kept for backward, but now use sendOtp
    sendOtp();
  };

  const selectOrder = (order: any) => {
    setSelectedRef(order.reference);
    setSelectedOrder(order);
    setStatus(`Ready to track order ${order.reference}`);
  };

  const startLiveTracking = async () => {
    if (!selectedOrder) {
      Alert.alert('Select order', 'Please select or enter an order reference first.');
      return;
    }

    // Request permissions (foreground + background for better coverage)
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required for live tracking.');
      return;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      Alert.alert('Background permission', 'For updates when app is in background, grant "Always" location. Continuing with foreground only.');
    }

    setIsTracking(true);
    setStatus('LIVE - Reporting GPS every ~15s');
    startPulse();

    // Start foreground watch
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,
          distanceInterval: 15,
        },
        async (position) => {
          const { latitude, longitude, speed } = position.coords;

          setCurrentLocation({ lat: latitude, lng: longitude });
          const speedKmh = speed != null ? Math.round(speed * 3.6) : null;
          setCurrentSpeed(speedKmh);

          const update = {
            timestamp: new Date().toISOString(),
            location: `Moving - ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            note: speedKmh != null ? `Speed: ${speedKmh} km/h` : 'Auto-reported by driver app',
          };

          await addDeliveryUpdate(selectedOrder.id, update);
          setLastUpdate(new Date().toLocaleTimeString());

          setRecentUpdates(prev => [update, ...prev].slice(0, 4));

          const freshOrders = await getOrders();
          const fresh = freshOrders.find((o: any) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      );

      // Start background task (for when app is backgrounded - best with dev build)
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000,
          distanceInterval: 50,
          foregroundService: {
            notificationTitle: 'Zara Thrift Logistics',
            notificationBody: 'Updating customers with your live location',
          },
          showsBackgroundLocationIndicator: true,
        });
        await AsyncStorage.setItem(CURRENT_TRACKING_KEY, selectedOrder.id);
      } catch (bgErr) {
        console.warn('Background location start failed (Expo Go has limits; use dev build for full bg):', bgErr);
      }
    } catch (e) {
      Alert.alert('Tracking error', 'Could not start location tracking.');
      stopTracking();
    }
  };

  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch {}
    await AsyncStorage.removeItem(CURRENT_TRACKING_KEY).catch(() => {});

    stopPulse();
    setIsTracking(false);
    setStatus('Tracking stopped');
    setCurrentLocation(null);
    setCurrentSpeed(null);
    setRecentUpdates([]);
  };

  const logout = async () => {
    stopTracking();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsLoggedIn(false);
    setDriverPhone('');
    setOtp('');
    setShowOtpInput(false);
    setOrders([]);
    setSelectedOrder(null);
    setSelectedRef('');
    setStatus('Idle');
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#888' }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>DRIVER MODE</Text>
        <Text style={styles.subtitle}>Zara Thrift Logistics</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Enter your driver phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="+2348012345678 or 08012345678"
            value={driverPhone}
            onChangeText={setDriverPhone}
            keyboardType="phone-pad"
            editable={!showOtpInput}
          />
          {!showOtpInput ? (
            <TouchableOpacity 
              style={[styles.primaryBtn, isSendingOtp && { opacity: 0.6 }]} 
              onPress={sendOtp}
              disabled={isSendingOtp}
            >
              <Text style={styles.primaryBtnText}>
                {isSendingOtp ? 'SENDING OTP...' : 'SEND OTP / LOGIN AS DRIVER'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.label}>Enter the 6-digit code sent to your phone</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity 
                style={[styles.primaryBtn, isVerifying && { opacity: 0.6 }]} 
                onPress={verifyOtp}
                disabled={isVerifying}
              >
                <Text style={styles.primaryBtnText}>
                  {isVerifying ? 'VERIFYING...' : 'VERIFY OTP & LOGIN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowOtpInput(false); setOtp(''); }}>
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 8 }}>Resend or change number</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.hint}>
            Production: Uses Supabase Phone OTP auth. Demo: falls back to phone match for local mode. Use the phone you set in admin when assigning the bike.
          </Text>
        </View>

        <Text style={styles.hint}>After login you can start automatic GPS reporting for your assigned orders.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#888' }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: '#f87171' }}>Logout Driver</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>DRIVER DASHBOARD</Text>
      <Text style={styles.subtitle}>Logged in: {driverPhone}</Text>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{status}</Text>
        {isTracking && <View style={styles.liveDot} />}
      </View>

      {/* Order selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SELECT ORDER TO TRACK</Text>
        
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Order reference (e.g. ZT-ABC123)"
            value={selectedRef}
            onChangeText={setSelectedRef}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.smallBtn} 
            onPress={async () => {
              if (!selectedRef) return;
              const all = await getOrders();
              const found = all.find((o: any) => o.reference.toUpperCase() === selectedRef.toUpperCase());
              if (found) {
                setSelectedOrder(found);
              } else {
                Alert.alert('Not found', 'Order not found in this device storage.');
              }
            }}
          >
            <Text style={styles.smallBtnText}>LOAD</Text>
          </TouchableOpacity>
        </View>

        {/* Better filtering UI */}
        <View style={{ marginBottom: 8 }}>
          <TextInput
            style={[styles.input, { marginBottom: 6, fontSize: 13, paddingVertical: 8 }]}
            placeholder="Search ref, name or city..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="characters"
          />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['all', 'assigned', 'active'] as const).map(mode => (
              <TouchableOpacity 
                key={mode}
                style={[styles.filterBtn, filterMode === mode && styles.filterBtnActive]}
                onPress={() => setFilterMode(mode)}
              >
                <Text style={[styles.filterText, filterMode === mode && styles.filterTextActive]}>
                  {mode === 'all' ? 'All Bikes' : mode === 'assigned' ? 'My Assigned' : 'Active'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {orders.length > 0 && (
          <>
            <Text style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Tap an order to load it for tracking</Text>
            {orders.map((o, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.orderRow, selectedOrder?.id === o.id && { borderColor: '#4ade80' }]} 
                onPress={() => selectOrder(o)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.orderRef}>{o.reference}</Text>
                  <Text style={styles.orderMeta}>{formatPrice(o.total)}</Text>
                </View>
                <Text style={styles.orderMeta}>{o.customer.name} • {o.customer.city}</Text>
                {o.assignedBike && <Text style={styles.bikeTag}>{o.assignedBike.bikeNumber} • {o.assignedBike.riderName}</Text>}
                {o.driverPhone && <Text style={{ color: '#888', fontSize: 10 }}>Driver: {o.driverPhone}</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Selected order + tracking controls - much nicer live UI */}
      {selectedOrder && (
        <View style={styles.card}>
          <Text style={styles.label}>CURRENT DELIVERY</Text>
          <Text style={styles.bigRef}>{selectedOrder.reference}</Text>

          {/* Full customer details */}
          <View style={styles.customerDetails}>
            <Text style={styles.detailTitle}>CUSTOMER</Text>
            <Text style={styles.detailText}>{selectedOrder.customer.name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedOrder.customer.phone}`)}>
              <Text style={styles.linkText}>📞 {selectedOrder.customer.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              const msg = `Hi ${selectedOrder.customer.name.split(' ')[0]}, your Zara Thrift order ${selectedOrder.reference} is on the way.`;
              Linking.openURL(`whatsapp://send?phone=${selectedOrder.customer.phone}&text=${encodeURIComponent(msg)}`);
            }}>
              <Text style={styles.linkText}>💬 WhatsApp customer</Text>
            </TouchableOpacity>

            <Text style={styles.detailTitle}>DELIVERY ADDRESS</Text>
            <Text style={styles.detailText}>{selectedOrder.customer.address}</Text>
            <Text style={styles.detailText}>{selectedOrder.customer.city}{selectedOrder.customer.state ? `, ${selectedOrder.customer.state}` : ''}</Text>
            {selectedOrder.customer.notes && <Text style={styles.detailText}>Note: {selectedOrder.customer.notes}</Text>}

            <Text style={styles.detailTitle}>ORDER</Text>
            <Text style={styles.detailText}>{selectedOrder.items?.length || 0} item(s) • {formatPrice(selectedOrder.total)}</Text>
            {selectedOrder.estimatedDelivery && (
              <Text style={styles.detailText}>Est. delivery: {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</Text>
            )}
          </View>

          {selectedOrder.assignedBike && (
            <Text style={{ color: '#4ade80', fontSize: 12, marginBottom: 8 }}>
              🚲 {selectedOrder.assignedBike.bikeNumber} • {selectedOrder.assignedBike.riderName}
            </Text>
          )}

          <View style={{ marginTop: 12 }}>
            {!isTracking ? (
              <TouchableOpacity style={styles.startBtn} onPress={startLiveTracking}>
                <Text style={styles.startBtnText}>▶ START LIVE GPS TRACKING</Text>
                <Text style={{ color: '#111', fontSize: 10, textAlign: 'center' }}>
                  Real device GPS • Automatic updates
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
                <Text style={styles.stopBtnText}>■ STOP LIVE TRACKING</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nicer live UI with animation and driver notes */}
          {isTracking && (
            <View style={styles.livePanel}>
              <View style={styles.liveHeader}>
                <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.liveText}>● LIVE</Text>
                </Animated.View>
                <Text style={styles.statusLive}>Auto-reporting • Background enabled</Text>
              </View>

              {currentLocation && (
                <View style={styles.liveData}>
                  <View>
                    <Text style={styles.liveLabel}>SPEED</Text>
                    <Text style={styles.speedText}>{currentSpeed != null ? `${currentSpeed} km/h` : '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.liveLabel}>GPS POSITION</Text>
                    <Text style={styles.coordsSmall}>
                      {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`)}>
                      <Text style={{ color: '#4ade80', fontSize: 10, textDecorationLine: 'underline' }}>Open in Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {lastUpdate && <Text style={styles.lastUpdate}>Last report: {lastUpdate}</Text>}

              {/* Driver note input for manual context */}
              <View style={{ marginTop: 10 }}>
                <Text style={styles.liveLabel}>ADD NOTE TO NEXT UPDATE (e.g. "Traffic at bridge")</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, fontSize: 12, paddingVertical: 6 }]}
                    placeholder="Optional note for customers"
                    value={driverNote}
                    onChangeText={setDriverNote}
                  />
                  <TouchableOpacity 
                    style={[styles.smallBtn, { paddingHorizontal: 12 }]}
                    onPress={async () => {
                      if (!currentLocation || !selectedOrder) return;
                      const noteUpdate = {
                        timestamp: new Date().toISOString(),
                        location: `Note: ${driverNote || 'Update from driver'}`,
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                        note: driverNote || 'Driver note',
                      };
                      await addDeliveryUpdate(selectedOrder.id, noteUpdate);
                      setRecentUpdates(prev => [noteUpdate, ...prev].slice(0, 4));
                      setDriverNote('');
                      setLastUpdate(new Date().toLocaleTimeString());
                      Alert.alert('Note sent', 'Customers will see your note with the location.');
                    }}
                  >
                    <Text style={styles.smallBtnText}>SEND NOTE</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {recentUpdates.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.liveLabel}>RECENT AUTO UPDATES</Text>
                  {recentUpdates.map((u, i) => (
                    <Text key={i} style={styles.recentUpdate}>
                      {new Date(u.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — {u.location} {u.note ? `(${u.note})` : ''}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <Text style={{ color: '#666', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
            Location pushes automatically to customer track page.
          </Text>
        </View>
      )}

      <View style={{ marginTop: 30, padding: 12, backgroundColor: '#111', borderRadius: 6 }}>
        <Text style={{ color: '#888', fontSize: 11 }}>
          Note for production: To have the driver phone automatically push to customers on different devices, you need a backend (Supabase Realtime, Firebase, or your server) with proper auth for drivers. This demo works great when testing driver + customer on the same device or when using a shared backend.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#888', marginBottom: 20 },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#222', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#111', borderColor: '#333', borderWidth: 1, color: '#f5f5f5', padding: 12, fontSize: 16, borderRadius: 4, marginBottom: 8 },
  primaryBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  primaryBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 15 },
  smallBtn: { backgroundColor: '#222', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 4 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  hint: { color: '#666', fontSize: 11, marginTop: 8 },
  statusBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 6, marginBottom: 16 },
  statusText: { color: '#f5f5f5', flex: 1 },
  liveDot: { width: 10, height: 10, backgroundColor: '#4ade80', borderRadius: 5, marginLeft: 8 },
  pulse: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  orderRow: { backgroundColor: '#111', padding: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#222' },
  orderRef: { color: '#fff', fontWeight: '600', fontSize: 15 },
  orderMeta: { color: '#888', fontSize: 12 },
  bikeTag: { color: '#4ade80', fontSize: 11, marginTop: 2 },
  startBtn: { backgroundColor: '#4ade80', paddingVertical: 16, borderRadius: 6, alignItems: 'center' },
  startBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 16 },
  stopBtn: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 6, alignItems: 'center' },
  stopBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  liveInfo: { marginTop: 16, backgroundColor: '#0a0a0a', padding: 12, borderRadius: 6 },
  coords: { color: '#4ade80', fontFamily: 'monospace', fontSize: 15, marginTop: 4 },
  label: { color: '#888', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  bigRef: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: 'monospace', marginBottom: 4 },

  // New improved styles
  customerDetails: { backgroundColor: '#0a0a0a', padding: 10, borderRadius: 6, marginVertical: 8, borderWidth: 1, borderColor: '#222' },
  detailTitle: { color: '#4ade80', fontSize: 10, letterSpacing: 1, marginTop: 6, marginBottom: 2 },
  detailText: { color: '#ccc', fontSize: 13, marginBottom: 2 },
  linkText: { color: '#60a5fa', fontSize: 13, textDecorationLine: 'underline', marginBottom: 4 },

  livePanel: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#4ade80' },
  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  liveText: { color: '#4ade80', fontWeight: '700', fontSize: 14 },
  statusLive: { color: '#888', fontSize: 11 },
  liveData: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  liveLabel: { color: '#666', fontSize: 10, letterSpacing: 0.5 },
  speedText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  coordsSmall: { color: '#4ade80', fontFamily: 'monospace', fontSize: 12 },
  lastUpdate: { color: '#888', fontSize: 11, marginTop: 4 },
  recentUpdate: { color: '#aaa', fontSize: 10, marginTop: 2 },

  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  filterText: { color: '#aaa', fontSize: 11 },
  filterTextActive: { color: '#0a0a0a', fontWeight: '600' },
});