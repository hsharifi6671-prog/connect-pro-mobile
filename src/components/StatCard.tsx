import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={23} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '46%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, borderWidth: 1, borderColor: '#E7EEEB' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value: { color: '#10231F', fontSize: 24, fontWeight: '900', textAlign: 'right' },
  title: { color: '#71817C', fontSize: 11.5, marginTop: 4, textAlign: 'right' },
});
