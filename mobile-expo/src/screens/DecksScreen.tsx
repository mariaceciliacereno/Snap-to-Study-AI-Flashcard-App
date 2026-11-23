import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteDeckAndCards,
  renameDeckTitle,
  type FlashcardDeckRecord,
} from '../studyService';

interface DecksScreenProps {
  userId: string;
  decks: FlashcardDeckRecord[];
  onStartStudy: (deckId: string) => void;
  onGoScan: () => void;
}

export function DecksScreen({
  userId,
  decks,
  onStartStudy,
  onGoScan,
}: DecksScreenProps) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = decks.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.subjectName.toLowerCase().includes(q)
    );
    const map = new Map<string, FlashcardDeckRecord[]>();
    filtered.forEach((d) => {
      const list = map.get(d.subjectName) || [];
      list.push(d);
      map.set(d.subjectName, list);
    });
    return Array.from(map.entries());
  }, [decks, search]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Flashcard Decks</Text>

      <TextInput
        style={styles.search}
        placeholder="Search topics or subjects..."
        value={search}
        onChangeText={setSearch}
      />

      {grouped.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No flashcard decks found</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={onGoScan}>
            <Text style={styles.scanBtnText}>Scan Your Notes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        grouped.map(([subjectName, list]) => (
          <View key={subjectName} style={styles.subjectGroup}>
            <Text style={styles.subjectHeader}>{subjectName}</Text>
            {list.map((deck) => (
              <View key={deck.id} style={styles.deckCard}>
                {renamingId === deck.id ? (
                  <View style={styles.renameRow}>
                    <TextInput
                      style={styles.renameInput}
                      value={renameText}
                      onChangeText={setRenameText}
                    />
                    <TouchableOpacity
                      style={styles.saveSmall}
                      onPress={async () => {
                        await renameDeckTitle(deck.id, renameText);
                        setRenamingId(null);
                      }}
                    >
                      <Text style={styles.saveSmallText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.deckTitle}>{deck.title}</Text>
                    <Text style={styles.deckSub}>{deck.cardCount} Flashcards</Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.studyBtn}
                    onPress={() => onStartStudy(deck.id)}
                  >
                    <Text style={styles.studyBtnText}>Study</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                      setRenamingId(deck.id);
                      setRenameText(deck.title);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#475569" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      Alert.alert('Delete Deck', `Delete "${deck.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => void deleteDeckAndCards(userId, deck.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { padding: 18, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 18,
  },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 12 },
  scanBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  subjectGroup: { marginBottom: 20 },
  subjectHeader: { fontSize: 15, fontWeight: '800', color: '#4F46E5', marginBottom: 8 },
  deckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
  },
  deckTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  deckSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  studyBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  studyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F8FAFC' },
  renameRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveSmall: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  saveSmallText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
