import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

function BouncingSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Elegant luxury entrance: fade + lift + soft scale settle
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 35,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View
        style={[
          splashStyles.content,
          {
            opacity,
            transform: [
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <Text style={splashStyles.brand}>ZARA</Text>
        <Text style={splashStyles.subBrand}>THRIFT</Text>

        {/* Elegant thin rule - luxury detail */}
        <View style={splashStyles.rule} />

        <Text style={splashStyles.tagline}>CURATED IN NIGERIA</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  brand: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    lineHeight: 54,
  },
  subBrand: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '400',
    letterSpacing: 14,
    textAlign: 'center',
    lineHeight: 54,
    marginTop: -8,
  },
  rule: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 24,
    marginBottom: 18,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Luxurious opening — gives the elegant animation time to breathe
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2450);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <BouncingSplash />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0a' },
            headerTintColor: '#f5f5f5',
            headerTitleStyle: { fontWeight: '600', fontSize: 16, color: '#f5f5f5' },
            contentStyle: { backgroundColor: '#0a0a0a' },
            headerShadowVisible: false,
            headerBackTitle: 'Back',
          }}
        >
          {/* Bottom tabs group */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Stack screens with explicit Back navigation */}
          <Stack.Screen 
            name="product/[id]" 
            options={{ 
              headerShown: true, 
              title: '', 
              headerBackTitle: 'Back',
            }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ 
              headerShown: true, 
              title: 'Checkout', 
              headerBackTitle: 'Back',
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: true, 
              title: 'Login', 
              headerBackTitle: 'Back',
              presentation: 'card',
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: true, 
              title: 'Create Account', 
              headerBackTitle: 'Back',
            }} 
          />
          <Stack.Screen 
            name="forgot-password" 
            options={{ 
              headerShown: true, 
              title: 'Forgot Password', 
              headerBackTitle: 'Back',
            }} 
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
