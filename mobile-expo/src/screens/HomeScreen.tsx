import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type {
  FlashcardDeckRecord,
  FlashcardRecord,
  StudyProgressRecord,
  SubjectRecord,
} from '../studyService';

interface HomeScreenProps {
  displayName: string;
  subjects: SubjectRecord[];
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  onGoScan: () => void;
  onOpenDeckStudy: (deckId: string) => void;
  onGoDecks: () => void;
}

export function HomeScreen({
  displayName,
  subjects,
  decks,
  flashcards,
  progress,
  onGoScan,
  onOpenDeckStudy,
  onGoDecks,
}: HomeScreenProps) {
  const mastered = progress.filter((p) => p.difficulty === 'easy').length;
  const pct = flashcards.length > 0 ? Math.round((progress.length / flashcards.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="camera" size={20} color="#4F46E5" />
        </View>
        <View>
          <Text style={styles.appTitle}>Snap-to-Study AI</Text>
          <Text style={styles.tagline}>Snap • Learn • Remember</Text>
        </View>
      </View>

      <LinearGradient colors={['#5B21B6', '#4F46E5', '#2563EB']} style={styles.heroCard}>
        <Text style={styles.greeting}>Hello, {displayName.split(' ')[0]}</Text>
        <Text style={styles.heroTitle}>Turn your notes into 20 flashcards instantly</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={onGoScan}>
          <Ionicons name="camera" size={20} color="#4F46E5" />
          <Text style={styles.scanBtnText}>Scan Your Notes</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{flashcards.length}</Text>
          <Text style={styles.statLabel}>Flashcards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{decks.length}</Text>
          <Text style={styles.statLabel}>Decks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{pct}%</Text>
          <Text style={styles.statLabel}>{mastered} Mastered</Text>
        </View>
      </View>

      {subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Subjects</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.subjectRow}>
              {subjects.map((s) => (
                <TouchableOpacity key={s.id} style={styles.subjectChip} onPress={onGoDecks}>
                  <View style={[styles.subjectDot, { backgroundColor: s.accentColor }]} />
                  <Text style={styles.subjectText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My Flashcard Decks</Text>
          {decks.length > 0 && (
            <TouchableOpacity onPress={onGoDecks}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {decks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No decks yet</Text>
            <Text style={styles.emptySub}>
              Tap &ldquo;Scan Your Notes&rdquo; to snap a page and generate 20 flashcards.
            </Text>
          </View>
        ) : (
          decks.slice(0, 4).map((deck) => (
            <TouchableOpacity
              key={deck.id}
              style={styles.deckRow}
              onPress={() => onOpenDeckStudy(deck.id)}
            >
              <View style={styles.deckInfo}>
                <Text style={styles.deckMeta}>
                  {deck.subjectName} · {deck.cardCount} cards
                </Text>
                <Text style={styles.deckTitle}>{deck.title}</Text>
              </View>
              <View style={styles.studyBadge}>
                <Text style={styles.studyBadgeText}>Study</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { padding: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  tagline: { fontSize: 12, color: '#64748B' },
  heroCard: { borderRadius: 24, padding: 22, marginBottom: 16 },
  greeting: { fontSize: 13, color: '#E0E7FF', fontWeight: '600' },
  heroTitle: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 18 },
  scanBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  subjectRow: { flexDirection: 'row', gap: 8 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  subjectText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  deckRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deckInfo: { flex: 1, marginRight: 12 },
  deckMeta: { fontSize: 12, color: '#64748B' },
  deckTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  studyBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  studyBadgeText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
});
