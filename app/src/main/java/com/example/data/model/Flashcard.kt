package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

@IgnoreExtraProperties
data class Flashcard(
    @DocumentId val id: String = "",
    val deckId: String = "",
    val question: String = "",
    val answer: String = "",
    val keyConcept: String = "",
    val explanation: String = "",
    val difficulty: String = "medium", // "easy", "medium", "hard"
    val status: String = "new", // "new", "learning", "mastered"
    val reviewInterval: Long = 1L, // in days
    val repetitions: Long = 0L,
    val easeFactor: Double = 2.5,
    val lastReviewedAt: Timestamp? = null,
    val nextReviewAt: Timestamp? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "deckId" to deckId,
        "question" to question,
        "answer" to answer,
        "keyConcept" to keyConcept,
        "explanation" to explanation,
        "difficulty" to difficulty,
        "status" to status,
        "reviewInterval" to reviewInterval,
        "repetitions" to repetitions,
        "easeFactor" to easeFactor,
        "lastReviewedAt" to lastReviewedAt,
        "nextReviewAt" to nextReviewAt,
        "createdAt" to createdAt,
        "updatedAt" to updatedAt
    ).filterValues { it != null }
}
