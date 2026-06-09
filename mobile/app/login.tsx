import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { login } from '../lib/auth';

export default function Login() {
  const params = useLocalSearchParams<{ redirect?: string }>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Phone/email and password required.');
      return;
    }
    const res = await login(identifier, password);
    if (res.error) {
      Alert.alert('Login failed', res.error);
      return;
    }
    const redirect = (params.redirect as string) || '/';
    router.replace(redirect as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LOGIN</Text>

      <Text style={styles.hint}>Demo ready - Phone: 08012345678   Password: Demo123!</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Phone or email" 
        placeholderTextColor="#666" 
        value={identifier} 
        onChangeText={setIdentifier} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        placeholderTextColor="#666" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>SIGN IN</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>Create account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  hint: { color: '#22c55e', fontSize: 11, textAlign: 'center', marginBottom: 14, backgroundColor: '#111', padding: 6, borderRadius: 3 },
  input: { backgroundColor: '#111', color: '#f5f5f5', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#222', marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: '#f5f5f5', paddingVertical: 10, borderRadius: 3, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 12 },
  link: { color: '#888', textAlign: 'center', marginTop: 16 },
});
