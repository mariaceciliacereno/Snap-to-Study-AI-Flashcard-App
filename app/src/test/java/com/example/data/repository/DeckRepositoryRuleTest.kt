package com.example.data.repository

import com.example.base.FirestoreEmulatorTestBase
import com.example.data.model.Flashcard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Test

class DeckRepositoryRuleTest : FirestoreEmulatorTestBase() {

    @Test
    fun createDeck_authenticatedUser_createsDocumentSuccessfully() = runBlocking {
        signInTestUser(ALICE_EMAIL)
        val repository = DeckRepository(firestore)

        val createResult = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.createDeck("Cell Biology", "Biology", "textbook", listOf("science", "cells"))
        }
        assertTrue(createResult.isSuccess)
        val deckId = createResult.getOrThrow()
        assertTrue(deckId.isNotEmpty())

        val decks = withTimeout(FLOW_TIMEOUT_MS) {
            repository.observeDecks().first()
        }
        assertTrue(decks.map { it.id }.contains(deckId))
    }

    @Test
    fun addFlashcards_authenticatedUser_addsCardsSuccessfully() = runBlocking {
        signInTestUser(ALICE_EMAIL)
        val repository = DeckRepository(firestore)

        val deckId = repository.createDeck("World War II", "History", "textbook").getOrThrow()
        val card = Flashcard(
            deckId = deckId,
            question = "When did World War II end?",
            answer = "1945",
            keyConcept = "WWII Timeline",
            explanation = "World War II concluded with the surrender of the Axis powers in 1945.",
            difficulty = "medium",
            status = "new",
            reviewInterval = 1,
            repetitions = 0
        )

        val addResult = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.addFlashcards(deckId, listOf(card))
        }
        assertTrue(addResult.isSuccess)

        val cards = withTimeout(FLOW_TIMEOUT_MS) {
            repository.observeCards(deckId).first()
        }
        assertTrue(cards.any { it.question == "When did World War II end?" })
    }

    @Test
    fun observeDecks_unauthenticatedUser_failsWithPermissionDenied() = runBlocking {
        auth.signOut()
        val repository = DeckRepository(firestore)

        try {
            withTimeout(FLOW_TIMEOUT_MS) { repository.observeDecks().first() }
            fail("Expected exception when unauthenticated")
        } catch (e: Exception) {
            assertTrue(e.message?.contains("User must be signed in") == true)
        }
    }

    private companion object {
        const val ALICE_EMAIL = "alice@example.com"
        const val BOB_EMAIL = "bob@example.com"
        const val DEFAULT_TIMEOUT_MS = 6000L
        const val FLOW_TIMEOUT_MS = 6000L
    }
}
