import { ScrollView } from "react-native";
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { register } from '../lib/auth';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    const res = await register({ firstName, lastName, phone, email: email || undefined, password, confirmPassword });
    if (res.error) {
      Alert.alert('Registration failed', res.error);
      return;
    }
    Alert.alert('Account created', 'Welcome!', [{ text: 'Continue', onPress: () => router.replace('/shop') }]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>CREATE ACCOUNT</Text>

        <Text style={styles.hint}>Quick test? Use demo instead: 08012345678 / Demo123! (go back to Login)</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>FIRST NAME</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First" placeholderTextColor="#555" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>LAST NAME</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last" placeholderTextColor="#555" />
          </View>
        </View>

        <Text style={styles.label}>PHONE (NIGERIAN)</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0801 234 5678" keyboardType="phone-pad" placeholderTextColor="#555" />

        <Text style={styles.label}>EMAIL (OPTIONAL)</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#555" />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor="#555" />
        <PasswordStrengthBar password={password} />

        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm" secureTextEntry placeholderTextColor="#555" />

        <TouchableOpacity style={styles.btn} onPress={handleRegister}>
          <Text style={styles.btnText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#f5f5f5', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  hint: { color: '#22c55e', fontSize: 10, textAlign: 'center', marginBottom: 8, backgroundColor: '#111', padding: 6, borderRadius: 3 },
  label: { color: '#888', fontSize: 9, letterSpacing: 1, marginBottom: 3, marginTop: 6 },
  input: { backgroundColor: '#111', color: '#f5f5f5', padding: 9, borderRadius: 4, borderWidth: 1, borderColor: '#222', fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: '#f5f5f5', paddingVertical: 10, borderRadius: 3, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 12 },
  link: { color: '#888', textAlign: 'center', marginTop: 16 },
});
