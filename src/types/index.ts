export type Difficulty = 'easy' | 'medium' | 'hard';

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  coreConcept: string;
  keyFormulaOrTerm?: string;
  sourceSnippet: string;
  difficulty: Difficulty;
  // Spaced repetition state
  box?: LeitnerBox;
  lastReviewed?: number; // timestamp
  nextReview?: number;   // timestamp
  reviewCount?: number;
  lapseCount?: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
  sourceImage?: string; // base64 or placeholder url
  sourceType?: 'camera' | 'upload' | 'sample';
  cards: Flashcard[];
  estimatedStudyTimeMinutes: number;
  tags: string[];
  totalReviews?: number;
  masteryPercentage?: number;
}

export interface GenerateDeckRequest {
  imageBase64: string;
  mimeType: string;
  count: number;
  studyFocus: 'balanced' | 'definitions' | 'exam_qa' | 'formulas' | 'cloze';
  subjectHint?: string;
  difficulty: 'standard' | 'intro' | 'advanced';
  customInstructions?: string;
}

export interface ReviewLog {
  cardId: string;
  deckId: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  timestamp: number;
}

export interface UserStats {
  totalCardsLearned: number;
  studyStreakDays: number;
  totalDecksCreated: number;
  minutesStudied: number;
}
