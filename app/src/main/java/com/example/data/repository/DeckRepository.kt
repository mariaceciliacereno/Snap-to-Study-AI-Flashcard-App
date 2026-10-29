package com.example.data.repository

import android.content.Context
import com.example.R
import com.example.data.model.Deck
import com.example.data.model.Flashcard
import com.example.util.OperationType
import com.example.util.handleFirestoreError
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class DeckRepository(private val db: FirebaseFirestore) {

    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private val auth = Firebase.auth

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")
    }

    fun observeDecks(): Flow<List<Deck>> = flow {
        val uid = requireUserId()
        val path = "users/$uid/decks"
        emitAll(
            db.collection("users").document(uid).collection("decks")
                .snapshots()
                .map { snapshot -> snapshot.toObjects(Deck::class.java) }
                .catch { error ->
                    if (error is Exception) handleFirestoreError(error, OperationType.LIST, path)
                    throw error
                }
        )
    }

    suspend fun createDeck(title: String, subject: String, sourceType: String, tags: List<String> = emptyList()): Result<String> {
        val uid = requireUserId()
        val path = "users/$uid/decks"
        val docRef = db.collection("users").document(uid).collection("decks").document()
        val payload = mapOf(
            "title" to title,
            "subject" to subject,
            "sourceType" to sourceType,
            "cardCount" to 0L,
            "masteredCount" to 0L,
            "reviewCount" to 0L,
            "tags" to tags,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        return try {
            docRef.set(payload).await()
            Result.success(docRef.id)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateDeck(deck: Deck): Result<Unit> {
        val uid = requireUserId()
        require(deck.id.isNotBlank()) { "Deck ID must not be blank" }
        requireNotNull(deck.createdAt) { "Deck createdAt must not be null for update" }
        val docRef = db.collection("users").document(uid).collection("decks").document(deck.id)
        return try {
            docRef.set(deck.copy(updatedAt = null).toMap()).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteDeck(deckId: String): Result<Unit> {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid).collection("decks").document(deckId)
        return try {
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    fun observeCards(deckId: String): Flow<List<Flashcard>> = flow {
        val uid = requireUserId()
        val path = "users/$uid/decks/$deckId/cards"
        emitAll(
            db.collection("users").document(uid).collection("decks").document(deckId).collection("cards")
                .snapshots()
                .map { snapshot -> snapshot.toObjects(Flashcard::class.java) }
                .catch { error ->
                    if (error is Exception) handleFirestoreError(error, OperationType.LIST, path)
                    throw error
                }
        )
    }

    suspend fun addFlashcards(deckId: String, cards: List<Flashcard>): Result<Unit> {
        val uid = requireUserId()
        val deckRef = db.collection("users").document(uid).collection("decks").document(deckId)
        val cardsCollection = deckRef.collection("cards")

        return try {
            val batch = db.batch()
            for (card in cards) {
                val cardDoc = cardsCollection.document()
                val payload = mapOf(
                    "deckId" to deckId,
                    "question" to card.question,
                    "answer" to card.answer,
                    "keyConcept" to card.keyConcept,
                    "explanation" to card.explanation,
                    "difficulty" to card.difficulty,
                    "status" to card.status,
                    "reviewInterval" to card.reviewInterval,
                    "repetitions" to card.repetitions,
                    "easeFactor" to card.easeFactor,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                batch.set(cardDoc, payload)
            }
            // Update deck card count and review count
            batch.update(
                deckRef,
                mapOf(
                    "cardCount" to FieldValue.increment(cards.size.toLong()),
                    "reviewCount" to FieldValue.increment(cards.size.toLong()),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, cardsCollection.path)
            Result.failure(e)
        }
    }

    suspend fun updateFlashcard(deckId: String, card: Flashcard): Result<Unit> {
        val uid = requireUserId()
        require(card.id.isNotBlank()) { "Card ID must not be blank" }
        requireNotNull(card.createdAt) { "Card createdAt must not be null" }
        val docRef = db.collection("users").document(uid).collection("decks").document(deckId).collection("cards").document(card.id)
        return try {
            docRef.set(card.copy(updatedAt = null).toMap()).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun recordCardReview(deckId: String, card: Flashcard, isMastered: Boolean): Result<Unit> {
        val uid = requireUserId()
        val deckRef = db.collection("users").document(uid).collection("decks").document(deckId)
        val cardRef = deckRef.collection("cards").document(card.id)

        val newRepetitions = card.repetitions + 1
        val newInterval = if (isMastered) (card.reviewInterval * 2).coerceAtLeast(2) else 1L
        val newStatus = if (isMastered) "mastered" else "learning"

        val wasMastered = card.status == "mastered"
        val statusChangedToMastered = isMastered && !wasMastered
        val statusChangedFromMastered = !isMastered && wasMastered

        return try {
            val batch = db.batch()
            batch.update(
                cardRef,
                mapOf(
                    "repetitions" to newRepetitions,
                    "reviewInterval" to newInterval,
                    "status" to newStatus,
                    "lastReviewedAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            if (statusChangedToMastered) {
                batch.update(
                    deckRef,
                    mapOf(
                        "masteredCount" to FieldValue.increment(1),
                        "reviewCount" to FieldValue.increment(-1),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            } else if (statusChangedFromMastered) {
                batch.update(
                    deckRef,
                    mapOf(
                        "masteredCount" to FieldValue.increment(-1),
                        "reviewCount" to FieldValue.increment(1),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            } else {
                batch.update(deckRef, "updatedAt", FieldValue.serverTimestamp())
            }
            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, cardRef.path)
            Result.failure(e)
        }
    }
}
