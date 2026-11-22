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
import { db } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreError.ts';
import type {
  DifficultyRating,
  FlashcardDeckRecord,
  FlashcardRecord,
  GeneratedFlashcardDraft,
  ScannedDocumentRecord,
  StudyProgressRecord,
  SubjectRecord,
  UserProfile,
} from '../types/study.ts';

const SUBJECT_ACCENTS = [
  '#4F46E5',
  '#7C3AED',
  '#2563EB',
  '#0D9488',
  '#D97706',
  '#DB2777',
];

function makeSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function makeSubjectDocId(userId: string, subjectName: string): string {
  const slug =
    subjectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'general';
  return `sub_${userId.slice(0, 16)}_${slug}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function pickSubjectAccent(subjectName: string): string {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i += 1) {
    hash = (hash * 31 + subjectName.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_ACCENTS[hash % SUBJECT_ACCENTS.length];
}

export async function ensureUserProfile(user: User): Promise<void> {
  const profileRef = doc(db, 'profiles', user.uid);
  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      const displayName = (
        user.displayName ||
        user.email?.split('@')[0] ||
        'Student'
      ).slice(0, 120);
      const email = (user.email || 'student@snaptostudy.local').slice(0, 254);
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        email,
        studyGoalDaily: 20,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (user.photoURL && user.photoURL.length <= 1000) {
        payload.photoUrl = user.photoURL;
      }
      await setDoc(profileRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
  }
}

export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; studyGoalDaily?: number }
): Promise<void> {
  const profileRef = doc(db, 'profiles', userId);
  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.displayName !== undefined) {
      payload.displayName = updates.displayName.trim().slice(0, 120) || 'Student';
    }
    if (updates.studyGoalDaily !== undefined) {
      payload.studyGoalDaily = Math.max(
        5,
        Math.min(200, Math.round(updates.studyGoalDaily))
      );
    }
    await updateDoc(profileRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${userId}`);
  }
}

export function subscribeToProfile(
  userId: string,
  onData: (profile: UserProfile | null) => void
): () => void {
  const path = `profiles/${userId}`;
  return onSnapshot(
    doc(db, 'profiles', userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as UserProfile);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToUserStudyData(
  userId: string,
  callbacks: {
    onSubjects: (items: SubjectRecord[]) => void;
    onDecks: (items: FlashcardDeckRecord[]) => void;
    onFlashcards: (items: FlashcardRecord[]) => void;
    onProgress: (items: StudyProgressRecord[]) => void;
    onScans: (items: ScannedDocumentRecord[]) => void;
  }
): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    onSnapshot(
      query(collection(db, 'subjects'), where('userId', '==', userId)),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as SubjectRecord)
        );
        items.sort((a, b) => a.name.localeCompare(b.name));
        callbacks.onSubjects(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'subjects')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'flashcard_decks'), where('userId', '==', userId)),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as FlashcardDeckRecord)
        );
        items.sort(
          (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
        );
        callbacks.onDecks(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'flashcard_decks')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'flashcards'), where('userId', '==', userId)),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as FlashcardRecord)
        );
        items.sort((a, b) => {
          const timeDiff =
            (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0);
          if (timeDiff !== 0) return timeDiff;
          return a.cardNumber - b.cardNumber;
        });
        callbacks.onFlashcards(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'flashcards')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'study_progress'), where('userId', '==', userId)),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as StudyProgressRecord)
        );
        callbacks.onProgress(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'study_progress')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'scanned_documents'), where('userId', '==', userId)),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as ScannedDocumentRecord)
        );
        items.sort(
          (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
        );
        callbacks.onScans(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'scanned_documents')
    )
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

export async function saveGeneratedDeck(params: {
  userId: string;
  subjectName: string;
  topic: string;
  title: string;
  extractedSummary: string;
  readabilityWarning: string;
  isReadable: boolean;
  pageCount: number;
  thumbnailDataUrl?: string;
  flashcards: GeneratedFlashcardDraft[];
}): Promise<string> {
  const {
    userId,
    subjectName,
    topic,
    title,
    extractedSummary,
    readabilityWarning,
    isReadable,
    pageCount,
    thumbnailDataUrl,
    flashcards,
  } = params;

  const cleanSubject = subjectName.trim().slice(0, 80) || 'General Studies';
  const cleanTopic = topic.trim().slice(0, 140) || 'Study Topic';
  const cleanTitle = title.trim().slice(0, 140) || cleanTopic;

  const subjectId = makeSubjectDocId(userId, cleanSubject);
  const deckId = makeSafeId('deck');
  const scanId = makeSafeId('scan');

  const batch = writeBatch(db);

  const subjectRef = doc(db, 'subjects', subjectId);
  let subjectExists = false;
  try {
    const existingSubject = await getDoc(subjectRef);
    subjectExists = existingSubject.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `subjects/${subjectId}`);
  }

  if (!subjectExists) {
    batch.set(subjectRef, {
      userId,
      name: cleanSubject,
      accentColor: pickSubjectAccent(cleanSubject),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const deckPayload: Record<string, unknown> = {
    userId,
    subjectId,
    subjectName: cleanSubject,
    title: cleanTitle,
    topic: cleanTopic,
    cardCount: flashcards.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (extractedSummary.trim()) {
    deckPayload.extractedSummary = extractedSummary.trim().slice(0, 2000);
  }
  if (readabilityWarning.trim()) {
    deckPayload.readabilityWarning = readabilityWarning.trim().slice(0, 500);
  }

  batch.set(doc(db, 'flashcard_decks', deckId), deckPayload);

  flashcards.forEach((card, index) => {
    const cardId = makeSafeId(`card${index + 1}`);
    batch.set(doc(db, 'flashcards', cardId), {
      userId,
      deckId,
      subject: cleanSubject,
      topic: cleanTopic,
      cardNumber: index + 1,
      question: card.question.trim().slice(0, 1000) || `Question ${index + 1}`,
      answer: card.answer.trim().slice(0, 2000) || 'Answer pending review.',
      questionStyle: card.questionStyle,
      sourceGrounding: card.sourceGrounding,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const scanPayload: Record<string, unknown> = {
    userId,
    deckId,
    subjectName: cleanSubject,
    topic: cleanTopic,
    pageCount: Math.max(1, Math.min(10, pageCount)),
    isReadable,
    createdAt: serverTimestamp(),
  };
  if (thumbnailDataUrl && thumbnailDataUrl.length <= 150000) {
    scanPayload.thumbnailDataUrl = thumbnailDataUrl;
  }
  batch.set(doc(db, 'scanned_documents', scanId), scanPayload);

  try {
    await batch.commit();
    return deckId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `flashcard_decks/${deckId}`);
  }
}

export async function renameDeck(
  deckId: string,
  newTitle: string,
  newSubjectName?: string
): Promise<void> {
  const deckRef = doc(db, 'flashcard_decks', deckId);
  const cleanTitle = newTitle.trim().slice(0, 140);
  if (!cleanTitle) return;

  const payload: Record<string, unknown> = {
    title: cleanTitle,
    topic: cleanTitle,
    updatedAt: serverTimestamp(),
  };
  if (newSubjectName && newSubjectName.trim()) {
    payload.subjectName = newSubjectName.trim().slice(0, 80);
  }

  try {
    await updateDoc(deckRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `flashcard_decks/${deckId}`);
  }
}

export async function updateFlashcardContent(
  cardId: string,
  updates: { question: string; answer: string }
): Promise<void> {
  const cardRef = doc(db, 'flashcards', cardId);
  try {
    await updateDoc(cardRef, {
      question: updates.question.trim().slice(0, 1000),
      answer: updates.answer.trim().slice(0, 2000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `flashcards/${cardId}`);
  }
}

export async function deleteDeckCascade(
  userId: string,
  deckId: string
): Promise<void> {
  try {
    const [cardsSnap, progressSnap, scansSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'flashcards'),
          where('userId', '==', userId),
          where('deckId', '==', deckId)
        )
      ),
      getDocs(
        query(
          collection(db, 'study_progress'),
          where('userId', '==', userId),
          where('deckId', '==', deckId)
        )
      ),
      getDocs(
        query(
          collection(db, 'scanned_documents'),
          where('userId', '==', userId),
          where('deckId', '==', deckId)
        )
      ),
    ]);

    const batch = writeBatch(db);
    cardsSnap.docs.forEach((d) => batch.delete(d.ref));
    progressSnap.docs.forEach((d) => batch.delete(d.ref));
    scansSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'flashcard_decks', deckId));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `flashcard_decks/${deckId}`);
  }
}

export async function recordCardStudyProgress(params: {
  userId: string;
  deckId: string;
  cardId: string;
  difficulty: DifficultyRating;
  existingReviewCount?: number;
}): Promise<void> {
  const { userId, deckId, cardId, difficulty, existingReviewCount } = params;
  const progressId = `${userId}_${cardId}`
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
  const ref = doc(db, 'study_progress', progressId);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const currentCount =
        (snap.data().reviewCount as number | undefined) ??
        existingReviewCount ??
        1;
      await updateDoc(ref, {
        difficulty,
        reviewCount: currentCount + 1,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId,
        deckId,
        cardId,
        difficulty,
        reviewCount: 1,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `study_progress/${progressId}`
    );
  }
}
