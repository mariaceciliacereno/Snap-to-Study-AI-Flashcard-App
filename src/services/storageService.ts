import { FlashcardDeck, LeitnerBox, UserStats } from '../types';
import { STARTER_DECKS } from '../data/starterDecks';

const STORAGE_KEY_DECKS = 'snapstudy_decks_v1';
const STORAGE_KEY_STATS = 'snapstudy_user_stats_v1';

export const storageService = {
  getDecks(): FlashcardDeck[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DECKS);
      if (!stored) {
        // Initialize with default decks
        this.saveDecks(STARTER_DECKS);
        return STARTER_DECKS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load decks from localStorage:', e);
      return STARTER_DECKS;
    }
  },

  saveDecks(decks: FlashcardDeck[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to save decks:', e);
    }
  },

  addDeck(deck: FlashcardDeck): void {
    const decks = this.getDecks();
    const updated = [deck, ...decks.filter(d => d.id !== deck.id)];
    this.saveDecks(updated);
    this.incrementStats('totalDecksCreated', 1);
  },

  updateDeck(updatedDeck: FlashcardDeck): void {
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === updatedDeck.id);
    if (index !== -1) {
      decks[index] = {
        ...updatedDeck,
        updatedAt: Date.now(),
      };
      this.saveDecks(decks);
    }
  },

  deleteDeck(deckId: string): void {
    const decks = this.getDecks().filter(d => d.id !== deckId);
    this.saveDecks(decks);
  },

  updateCardReview(deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy'): FlashcardDeck | null {
    const decks = this.getDecks();
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return null;

    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return null;

    let currentBox: LeitnerBox = card.box || 1;
    let lapseCount = card.lapseCount || 0;

    if (rating === 'again') {
      currentBox = 1;
      lapseCount += 1;
    } else if (rating === 'hard') {
      currentBox = Math.max(1, currentBox) as LeitnerBox;
    } else if (rating === 'good') {
      currentBox = Math.min(5, currentBox + 1) as LeitnerBox;
    } else if (rating === 'easy') {
      currentBox = Math.min(5, currentBox + 2) as LeitnerBox;
    }

    card.box = currentBox;
    card.lapseCount = lapseCount;
    card.reviewCount = (card.reviewCount || 0) + 1;
    card.lastReviewed = Date.now();

    // Spaced repetition intervals: Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days
    const intervalDays = [0, 1, 3, 7, 14, 30][currentBox];
    card.nextReview = Date.now() + intervalDays * 86400000;

    // Recalculate deck mastery
    const masteredCards = deck.cards.filter(c => (c.box || 1) >= 4).length;
    deck.masteryPercentage = Math.round((masteredCards / deck.cards.length) * 100);
    deck.totalReviews = (deck.totalReviews || 0) + 1;
    deck.updatedAt = Date.now();

    this.saveDecks(decks);
    this.incrementStats('totalCardsLearned', rating === 'easy' || rating === 'good' ? 1 : 0);

    return deck;
  },

  getUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      totalCardsLearned: 38,
      studyStreakDays: 4,
      totalDecksCreated: 3,
      minutesStudied: 45,
    };
  },

  incrementStats(key: keyof UserStats, delta: number): void {
    const stats = this.getUserStats();
    stats[key] = (stats[key] || 0) + delta;
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.error(e);
    }
  },

  exportAllAsJson(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      decks: this.getDecks(),
      stats: this.getUserStats(),
    };
    return JSON.stringify(data, null, 2);
  },

  importFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.decks)) {
        const existing = this.getDecks();
        const existingIds = new Set(existing.map(d => d.id));
        const newDecks = parsed.decks.filter((d: FlashcardDeck) => !existingIds.has(d.id));
        const merged = [...newDecks, ...existing];
        this.saveDecks(merged);
        return { success: true, count: newDecks.length };
      }
      return { success: false, count: 0, error: 'Invalid JSON format: missing decks array' };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message };
    }
  },
};
