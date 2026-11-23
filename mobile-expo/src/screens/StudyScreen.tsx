import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  recordCardProgress,
  type DifficultyRating,
  type FlashcardDeckRecord,
  type FlashcardRecord,
  type StudyProgressRecord,
} from '../studyService';

interface StudyScreenProps {
  userId: string;
  decks: FlashcardDeckRecord[];
  flashcards: FlashcardRecord[];
  progress: StudyProgressRecord[];
  selectedDeckId: string | null;
  onGoScan: () => void;
}

export function StudyScreen({
  userId,
  decks,
  flashcards,
  progress,
  selectedDeckId,
  onGoScan,
}: StudyScreenProps) {
  const activeDeck = useMemo(() => {
    if (decks.length === 0) return null;
    return decks.find((d) => d.id === selectedDeckId) || decks[0];
  }, [decks, selectedDeckId]);

  const deckCards = useMemo(() => {
    if (!activeDeck) return [];
    return flashcards
      .filter((c) => c.deckId === activeDeck.id)
      .sort((a, b) => a.cardNumber - b.cardNumber);
  }, [flashcards, activeDeck]);

  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setOrderIds(deckCards.map((c) => c.id));
    setIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
  }, [activeDeck?.id, deckCards.length]);

  const cards = useMemo(() => {
    const map = new Map(deckCards.map((c) => [c.id, c]));
    return orderIds.map((id) => map.get(id)).filter((c): c is FlashcardRecord => Boolean(c));
  }, [deckCards, orderIds]);

  const current = cards[index];

  const toggleFlip = () => {
    const toValue = flipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 12,
    }).start();
    setFlipped(!flipped);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const handleShuffle = () => {
    const copy = [...orderIds];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setOrderIds(copy);
    setIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
  };

  const handleRestart = () => {
    setOrderIds(deckCards.map((c) => c.id));
    setIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
  };

  const handleRate = async (difficulty: DifficultyRating) => {
    if (!current || !activeDeck) return;
    await recordCardProgress({
      userId,
      deckId: activeDeck.id,
      cardId: current.id,
      difficulty,
    });
    if (index < cards.length - 1) {
      setFlipped(false);
      flipAnim.setValue(0);
      setIndex((i) => i + 1);
    }
  };

  if (!activeDeck || !current) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No Flashcards Ready</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoScan}>
          <Text style={styles.primaryBtnText}>Scan Notes First</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const savedRating = progress.find((p) => p.cardId === current.id)?.difficulty;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.deckName}>{activeDeck.title}</Text>
          <Text style={styles.counter}>
            {index + 1} of {cards.length} · {activeDeck.subjectName}
          </Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.smallBtn} onPress={handleShuffle}>
            <Ionicons name="shuffle" size={18} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={handleRestart}>
            <Ionicons name="refresh" size={18} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={toggleFlip} style={styles.cardStage}>
        <Animated.View
          style={[styles.cardFace, { transform: [{ rotateY: frontRotate }] }]}
        >
          <Text style={styles.sideLabel}>QUESTION #{current.cardNumber}</Text>
          <Text style={styles.questionText}>{current.question}</Text>
          <Text style={styles.tapHint}>Tap card to flip</Text>
        </Animated.View>

        <Animated.View
          style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}
        >
          <Text style={styles.sideLabelBack}>ANSWER</Text>
          <Text style={styles.answerText}>{current.answer}</Text>
          <Text style={styles.tapHintBack}>
            {savedRating ? `Rated: ${savedRating}` : 'Tap card to flip back'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.rateRow}>
        <TouchableOpacity
          style={[styles.rateBtn, styles.easyBtn]}
          onPress={() => void handleRate('easy')}
        >
          <Text style={styles.easyText}>Easy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rateBtn, styles.medBtn]}
          onPress={() => void handleRate('medium')}
        >
          <Text style={styles.medText}>Medium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rateBtn, styles.hardBtn]}
          onPress={() => void handleRate('difficult')}
        >
          <Text style={styles.hardText}>Difficult</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, index === 0 && styles.disabled]}
          disabled={index === 0}
          onPress={() => {
            setFlipped(false);
            flipAnim.setValue(0);
            setIndex((i) => Math.max(0, i - 1));
          }}
        >
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.navNext, index >= cards.length - 1 && styles.disabled]}
          disabled={index >= cards.length - 1}
          onPress={() => {
            setFlipped(false);
            flipAnim.setValue(0);
            setIndex((i) => Math.min(cards.length - 1, i + 1));
          }}
        >
          <Text style={styles.navNextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB', padding: 18 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  primaryBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  deckName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  counter: { fontSize: 13, color: '#64748B', marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 12,
  },
  cardStage: { flex: 1, minHeight: 280, marginBottom: 16 },
  cardFace: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
  },
  cardBack: { backgroundColor: '#4F46E5', borderColor: '#4338CA' },
  sideLabel: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },
  sideLabelBack: { fontSize: 12, fontWeight: '800', color: '#C7D2FE' },
  questionText: { fontSize: 21, fontWeight: '700', color: '#0F172A', lineHeight: 29 },
  answerText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', lineHeight: 27 },
  tapHint: { fontSize: 12, color: '#94A3B8' },
  tapHintBack: { fontSize: 12, color: '#E0E7FF' },
  rateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rateBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  easyBtn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  medBtn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  hardBtn: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  easyText: { color: '#065F46', fontWeight: '800', fontSize: 13 },
  medText: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  hardText: { color: '#9F1239', fontWeight: '800', fontSize: 13 },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navNext: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  navText: { color: '#1E293B', fontWeight: '700' },
  navNextText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
