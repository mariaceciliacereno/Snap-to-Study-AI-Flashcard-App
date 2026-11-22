# Snap-to-Study AI — Security Specification

## 1. Data Invariants

1. **Profile Ownership & PII Isolation**: A `profiles/{userId}` document can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`, with `uid == userId` immutable after creation.
2. **Subject Ownership**: A `subjects/{subjectId}` document belongs exclusively to `userId == request.auth.uid`, with bounded name length (`1..80`) and immutable `userId` and `createdAt`.
3. **Deck Relational Integrity**: A `flashcard_decks/{deckId}` document must reference an existing or atomically created `subjects/{subjectId}` owned by the same verified user (`getAfter(...).data.userId == request.auth.uid`).
4. **Flashcard Relational Integrity**: A `flashcards/{cardId}` document cannot exist without a valid parent `flashcard_decks/{deckId}` owned by `request.auth.uid`, and `cardNumber` must be bounded (`1..50`), `question` (`1..1000`), and `answer` (`1..2000`).
5. **Study Progress Integrity**: A `study_progress/{progressId}` document must reference a valid `flashcard_decks/{deckId}` and `flashcards/{cardId}` owned by `request.auth.uid`, with `difficulty` strictly in `['easy', 'medium', 'difficult']` and `reviewCount >= 1`.
6. **Scanned Document Integrity**: A `scanned_documents/{scanId}` document must reference a valid `flashcard_decks/{deckId}` owned by `request.auth.uid`, with `pageCount` between `1` and `10` and optional `thumbnailDataUrl` bounded to `<= 150000` chars.
7. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time` on creation, `createdAt` is immutable on update, and `updatedAt == request.time` on update.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Cross-User Profile Read**: Authenticated user A attempts `get(/profiles/userB)` -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Deck Create**: User A creates `/flashcard_decks/deck1` with `userId: "userB"` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: User with `email_verified: false` attempts to write `/subjects/sub1` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection (Ghost Field)**: User A creates `/profiles/userA` with extra key `isAdmin: true` -> `PERMISSION_DENIED` (`keys().hasOnly(...)`).
5. **ID Poisoning (1.5KB Document ID)**: User A creates `/flashcard_decks/<1500-char-id>` -> `PERMISSION_DENIED` (`isValidId()`).
6. **Denial-of-Wallet String Bloat**: User A creates `/flashcards/card1` with 200KB `question` string -> `PERMISSION_DENIED` (`size() <= 1000`).
7. **Orphaned Flashcard Creation**: User A creates `/flashcards/card1` pointing to non-existent `deckId: "missing"` -> `PERMISSION_DENIED` (`getAfter(...).data.userId`).
8. **Cross-Tenant Flashcard Injection**: User A creates `/flashcards/card1` pointing to User B's `deckId` -> `PERMISSION_DENIED`.
9. **Immortal Field Mutation**: User A updates `/flashcard_decks/deck1` changing `userId` or `createdAt` -> `PERMISSION_DENIED`.
10. **Client Timestamp Forgery**: User A creates `/subjects/sub1` with backdated `createdAt` != `request.time` -> `PERMISSION_DENIED`.
11. **Invalid Enum Injection**: User A writes `/study_progress/p1` with `difficulty: "impossible"` -> `PERMISSION_DENIED`.
12. **Blanket List Query Scraping**: User A runs `list` on `/flashcard_decks` without filtering `where('userId', '==', auth.uid)` -> `PERMISSION_DENIED` (`resource.data.userId == request.auth.uid`).
