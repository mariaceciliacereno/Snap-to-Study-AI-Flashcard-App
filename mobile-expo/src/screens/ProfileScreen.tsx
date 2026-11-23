import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface ProfileScreenProps {
  displayName: string;
  email: string;
  deckCount: number;
  cardCount: number;
  masteredCount: number;
}

export function ProfileScreen({
  displayName,
  email,
  deckCount,
  cardCount,
  masteredCount,
}: ProfileScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Profile</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{deckCount}</Text>
          <Text style={styles.statLbl}>Decks</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{cardCount}</Text>
          <Text style={styles.statLbl}>Cards</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{masteredCount}</Text>
          <Text style={styles.statLbl}>Mastered</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => void signOut(auth)}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB', padding: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
  },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  email: { fontSize: 14, color: '#64748B', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  statVal: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  statLbl: { fontSize: 12, color: '#64748B', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
});
