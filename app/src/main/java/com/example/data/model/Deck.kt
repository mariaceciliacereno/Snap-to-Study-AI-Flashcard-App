package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

@IgnoreExtraProperties
data class Deck(
    @DocumentId val id: String = "",
    val title: String = "",
    val subject: String = "",
    val sourceType: String = "textbook", // "textbook", "handwritten", "slides", "manual"
    val cardCount: Long = 0L,
    val masteredCount: Long = 0L,
    val reviewCount: Long = 0L,
    val tags: List<String> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "title" to title,
        "subject" to subject,
        "sourceType" to sourceType,
        "cardCount" to cardCount,
        "masteredCount" to masteredCount,
        "reviewCount" to reviewCount,
        "tags" to tags,
        "createdAt" to createdAt,
        "updatedAt" to updatedAt
    ).filterValues { it != null }
}
