import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength } from '../lib/auth';

interface Props {
  password: string;
}

export function PasswordStrengthBar({ password }: Props) {
  const { score, label, color, feedback } = getPasswordStrength(password || '');

  const segments = [0, 1, 2, 3];

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {segments.map((i) => {
          const filled = score > i;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                filled && { backgroundColor: color },
              ]}
            />
          );
        })}
      </View>
      {password.length > 0 && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color }]}>{label}</Text>
          <Text style={styles.feedback}>{feedback}</Text>
        </View>
      )}
      {password.length > 0 && (
        <View style={styles.checklist}>
          {[
            { ok: password.length >= 6, text: 'At least 6 characters' },
            { ok: password.length >= 8, text: '8+ characters (stronger)' },
            { ok: /[0-9]/.test(password), text: 'Contains a number' },
            { ok: /[A-Z]/.test(password), text: 'Contains uppercase letter' },
            { ok: /[^A-Za-z0-9]/.test(password), text: 'Contains special character' },
          ].map((c, idx) => (
            <View key={idx} style={styles.criteriaRow}>
              <Text style={[styles.criteriaDot, { color: c.ok ? '#22c55e' : '#555' }]}>{c.ok ? '*' : 'o'}</Text>
              <Text style={[styles.criteriaText, c.ok && styles.criteriaOk]}>{c.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4, marginBottom: 8 },
  barRow: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  feedback: { color: '#777', fontSize: 11, flex: 1 },
  checklist: { marginTop: 8, gap: 3 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  criteriaDot: { fontSize: 10, width: 12 },
  criteriaText: { color: '#777', fontSize: 11 },
  criteriaOk: { color: '#aaa' },
});
