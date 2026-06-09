import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPassword() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FORGOT PASSWORD</Text>
      <Text style={styles.text}>Demo flow. In a real app this would send an SMS or email.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  text: { color: '#ccc', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#f5f5f5', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  btnText: { color: '#0a0a0a', fontWeight: '700' },
});
