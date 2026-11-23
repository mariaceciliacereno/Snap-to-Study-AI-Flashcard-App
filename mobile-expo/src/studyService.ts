import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db } from './firebase';

export type QuestionStyle =
  | 'definition'
  | 'identification'
  | 'conceptual'
  | 'explanation'
  | 'fact'
  | 'application';

export type SourceGrounding = 'direct' | 'ai_clarification';
export type DifficultyRating = 'easy' | 'medium' | 'difficult';

export interface SubjectRecord {
  id: string;
  userId: string;
  name: string;
  accentColor: string;
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
}

export interface StudyProgressRecord {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  difficulty: DifficultyRating;
  reviewCount: number;
}

export interface GeneratedDraft {
  cardNumber: number;
  question: string;
  answer: string;
  questionStyle: QuestionStyle;
  sourceGrounding: SourceGrounding;
}

export interface NoteAnalysisResponse {
  isReadable: boolean;
  readabilityWarning: string;
  subject: string;
  topic: string;
  extractedSummary: string;
  unclearSections: string[];
  flashcards: GeneratedDraft[];
}

function logAndRethrow(err: unknown, op: string, path: string): never {
  const payload = {
    error: err instanceof Error ? err.message : String(err),
    operationType: op,
    path,
    userId: auth.currentUser?.uid ?? null,
  };
  console.error('Firestore Error:', JSON.stringify(payload));
  throw new Error(payload.error);
}

const ACCENTS = ['#4F46E5', '#7C3AED', '#2563EB', '#0D9488', '#D97706', '#DB2777'];

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    ''
  );
}

function makeSubjectId(userId: string, name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'general';
  return `sub_${userId.slice(0, 16)}_${slug}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'profiles', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName: (user.displayName || user.email?.split('@')[0] || 'Student').slice(0, 120),
        email: (user.email || 'student@snaptostudy.local').slice(0, 254),
        studyGoalDaily: 20,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    logAndRethrow(err, 'write', `profiles/${user.uid}`);
  }
}

export function subscribeStudyData(
  userId: string,
  handlers: {
    onSubjects: (items: SubjectRecord[]) => void;
    onDecks: (items: FlashcardDeckRecord[]) => void;
    onFlashcards: (items: FlashcardRecord[]) => void;
    onProgress: (items: StudyProgressRecord[]) => void;
  }
): () => void {
  const u1 = onSnapshot(
    query(collection(db, 'subjects'), where('userId', '==', userId)),
    (snap) => {
      handlers.onSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubjectRecord)));
    },
    (err) => logAndRethrow(err, 'list', 'subjects')
  );
  const u2 = onSnapshot(
    query(collection(db, 'flashcard_decks'), where('userId', '==', userId)),
    (snap) => {
      handlers.onDecks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FlashcardDeckRecord)));
    },
    (err) => logAndRethrow(err, 'list', 'flashcard_decks')
  );
  const u3 = onSnapshot(
    query(collection(db, 'flashcards'), where('userId', '==', userId)),
    (snap) => {
      handlers.onFlashcards(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FlashcardRecord)));
    },
    (err) => logAndRethrow(err, 'list', 'flashcards')
  );
  const u4 = onSnapshot(
    query(collection(db, 'study_progress'), where('userId', '==', userId)),
    (snap) => {
      handlers.onProgress(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyProgressRecord)));
    },
    (err) => logAndRethrow(err, 'list', 'study_progress')
  );

  return () => {
    u1();
    u2();
    u3();
    u4();
  };
}

export async function saveDeckToFirestore(params: {
  userId: string;
  subjectName: string;
  topic: string;
  extractedSummary: string;
  readabilityWarning: string;
  isReadable: boolean;
  pageCount: number;
  flashcards: GeneratedDraft[];
}): Promise<string> {
  const cleanSubject = params.subjectName.trim().slice(0, 80) || 'General Studies';
  const cleanTopic = params.topic.trim().slice(0, 140) || 'Study Topic';
  const subjectId = makeSubjectId(params.userId, cleanSubject);
  const deckId = makeId('deck');
  const scanId = makeId('scan');

  const batch = writeBatch(db);
  const subRef = doc(db, 'subjects', subjectId);
  const existingSub = await getDoc(subRef);

  if (!existingSub.exists()) {
    batch.set(subRef, {
      userId: params.userId,
      name: cleanSubject,
      accentColor: ACCENTS[cleanSubject.length % ACCENTS.length],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const deckPayload: Record<string, unknown> = {
    userId: params.userId,
    subjectId,
    subjectName: cleanSubject,
    title: cleanTopic,
    topic: cleanTopic,
    cardCount: params.flashcards.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.extractedSummary.trim()) {
    deckPayload.extractedSummary = params.extractedSummary.trim().slice(0, 2000);
  }
  if (params.readabilityWarning.trim()) {
    deckPayload.readabilityWarning = params.readabilityWarning.trim().slice(0, 500);
  }

  batch.set(doc(db, 'flashcard_decks', deckId), deckPayload);

  params.flashcards.forEach((card, idx) => {
    batch.set(doc(db, 'flashcards', makeId(`c${idx + 1}`)), {
      userId: params.userId,
      deckId,
      subject: cleanSubject,
      topic: cleanTopic,
      cardNumber: idx + 1,
      question: card.question.trim().slice(0, 1000) || `Question ${idx + 1}`,
      answer: card.answer.trim().slice(0, 2000) || 'Answer pending review.',
      questionStyle: card.questionStyle,
      sourceGrounding: card.sourceGrounding,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  batch.set(doc(db, 'scanned_documents', scanId), {
    userId: params.userId,
    deckId,
    subjectName: cleanSubject,
    topic: cleanTopic,
    pageCount: Math.max(1, Math.min(10, params.pageCount)),
    isReadable: params.isReadable,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return deckId;
  } catch (err) {
    logAndRethrow(err, 'write', `flashcard_decks/${deckId}`);
  }
}

export async function recordCardProgress(params: {
  userId: string;
  deckId: string;
  cardId: string;
  difficulty: DifficultyRating;
}): Promise<void> {
  const progressId = `${params.userId}_${params.cardId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const ref = doc(db, 'study_progress', progressId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        difficulty: params.difficulty,
        reviewCount: ((snap.data().reviewCount as number) || 1) + 1,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId: params.userId,
        deckId: params.deckId,
        cardId: params.cardId,
        difficulty: params.difficulty,
        reviewCount: 1,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    logAndRethrow(err, 'write', `study_progress/${progressId}`);
  }
}

export async function renameDeckTitle(deckId: string, newTitle: string): Promise<void> {
  const clean = newTitle.trim().slice(0, 140);
  if (!clean) return;
  try {
    await updateDoc(doc(db, 'flashcard_decks', deckId), {
      title: clean,
      topic: clean,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    logAndRethrow(err, 'update', `flashcard_decks/${deckId}`);
  }
}

export async function deleteDeckAndCards(userId: string, deckId: string): Promise<void> {
  try {
    const [cards, prog, scans] = await Promise.all([
      getDocs(query(collection(db, 'flashcards'), where('userId', '==', userId), where('deckId', '==', deckId))),
      getDocs(query(collection(db, 'study_progress'), where('userId', '==', userId), where('deckId', '==', deckId))),
      getDocs(query(collection(db, 'scanned_documents'), where('userId', '==', userId), where('deckId', '==', deckId))),
    ]);
    const batch = writeBatch(db);
    cards.docs.forEach((d) => batch.delete(d.ref));
    prog.docs.forEach((d) => batch.delete(d.ref));
    scans.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'flashcard_decks', deckId));
    await batch.commit();
  } catch (err) {
    logAndRethrow(err, 'delete', `flashcard_decks/${deckId}`);
  }
}
