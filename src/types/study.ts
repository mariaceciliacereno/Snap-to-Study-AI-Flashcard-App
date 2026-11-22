import type { Timestamp } from 'firebase/firestore';

export type QuestionStyle =
  | 'definition'
  | 'identification'
  | 'conceptual'
  | 'explanation'
  | 'fact'
  | 'application';

export type SourceGrounding = 'direct' | 'ai_clarification';

export type DifficultyRating = 'easy' | 'medium' | 'difficult';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  studyGoalDaily: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SubjectRecord {
  id: string;
  userId: string;
  name: string;
  accentColor: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FlashcardDeckRecord {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  topic: string;
  cardCount: number;
  extractedSummary?: string;
  readabilityWarning?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FlashcardRecord {
  id: string;
  userId: string;
  deckId: string;
  subject: string;
  topic: string;
  cardNumber: number;
  question: string;
  answer: string;
  questionStyle: QuestionStyle;
  sourceGrounding: SourceGrounding;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudyProgressRecord {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  difficulty: DifficultyRating;
  reviewCount: number;
  lastReviewedAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ScannedDocumentRecord {
  id: string;
  userId: string;
  deckId: string;
  subjectName: string;
  topic: string;
  pageCount: number;
  thumbnailDataUrl?: string;
  isReadable: boolean;
  createdAt?: Timestamp;
}

export interface GeneratedFlashcardDraft {
  cardNumber: number;
  question: string;
  answer: string;
  questionStyle: QuestionStyle;
  sourceGrounding: SourceGrounding;
}

export interface NoteAnalysisResult {
  isReadable: boolean;
  readabilityWarning: string;
  subject: string;
  topic: string;
  extractedSummary: string;
  unclearSections: string[];
  flashcards: GeneratedFlashcardDraft[];
}

export interface CapturedPage {
  id: string;
  dataUrl: string;
  mimeType: string;
  base64Data: string;
  label: string;
}

export type AppTab = 'home' | 'scan' | 'decks' | 'study' | 'profile';
