package com.example.ui.viewmodel

import android.app.Application
import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.Deck
import com.example.data.model.Flashcard
import com.example.data.repository.DeckRepository
import com.example.data.service.GeminiFlashcardService
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val TAG = "SnapStudyVM"

sealed interface GenerationUiState {
    data object Idle : GenerationUiState
    data class Processing(val stage: String, val progress: Float) : GenerationUiState
    data class Success(val deckId: String, val deckTitle: String, val cardCount: Int) : GenerationUiState
    data class Error(val message: String) : GenerationUiState
}

class SnapStudyViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = DeckRepository(application)
    private val geminiService = GeminiFlashcardService()

    // Decks stream
    val decksState: StateFlow<List<Deck>> = repository.observeDecks()
        .catch { e ->
            Log.e(TAG, "Error observing decks", e)
            emit(emptyList())
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    // Current selected deck cards
    private val _currentDeck = MutableStateFlow<Deck?>(null)
    val currentDeck: StateFlow<Deck?> = _currentDeck.asStateFlow()

    private val _currentCards = MutableStateFlow<List<Flashcard>>(emptyList())
    val currentCards: StateFlow<List<Flashcard>> = _currentCards.asStateFlow()

    // Study session state
    private val _activeCardIndex = MutableStateFlow(0)
    val activeCardIndex: StateFlow<Int> = _activeCardIndex.asStateFlow()

    private val _isCardFlipped = MutableStateFlow(false)
    val isCardFlipped: StateFlow<Boolean> = _isCardFlipped.asStateFlow()

    private val _sessionMasteredCount = MutableStateFlow(0)
    val sessionMasteredCount: StateFlow<Int> = _sessionMasteredCount.asStateFlow()

    private val _sessionReviewCount = MutableStateFlow(0)
    val sessionReviewCount: StateFlow<Int> = _sessionReviewCount.asStateFlow()

    private val _isStudyFinished = MutableStateFlow(false)
    val isStudyFinished: StateFlow<Boolean> = _isStudyFinished.asStateFlow()

    // AI Generation state
    private val _generationState = MutableStateFlow<GenerationUiState>(GenerationUiState.Idle)
    val generationState: StateFlow<GenerationUiState> = _generationState.asStateFlow()

    // Custom API Key setting (optional user preference)
    private val _customApiKey = MutableStateFlow("")
    val customApiKey: StateFlow<String> = _customApiKey.asStateFlow()

    // Selected Subject filter for home screen
    private val _selectedFilter = MutableStateFlow("All")
    val selectedFilter: StateFlow<String> = _selectedFilter.asStateFlow()

    fun setFilter(filter: String) {
        _selectedFilter.value = filter
    }

    fun setCustomApiKey(key: String) {
        _customApiKey.value = key.trim()
    }

    fun selectDeck(deck: Deck) {
        _currentDeck.value = deck
        viewModelScope.launch {
            repository.observeCards(deck.id)
                .catch { e ->
                    Log.e(TAG, "Failed observing cards for ${deck.id}", e)
                    emit(emptyList())
                }
                .collect { cards ->
                    _currentCards.value = cards
                }
        }
    }

    fun startStudySession(deck: Deck) {
        selectDeck(deck)
        _activeCardIndex.value = 0
        _isCardFlipped.value = false
        _sessionMasteredCount.value = 0
        _sessionReviewCount.value = 0
        _isStudyFinished.value = false
    }

    fun toggleCardFlip() {
        _isCardFlipped.value = !_isCardFlipped.value
    }

    fun answerCard(isMastered: Boolean) {
        val cards = _currentCards.value
        val currentIndex = _activeCardIndex.value
        if (currentIndex in cards.indices) {
            val card = cards[currentIndex]
            val deckId = _currentDeck.value?.id ?: return

            if (isMastered) {
                _sessionMasteredCount.value += 1
            } else {
                _sessionReviewCount.value += 1
            }

            // Persist card review in Firestore
            viewModelScope.launch {
                repository.recordCardReview(deckId, card, isMastered)
            }

            if (currentIndex + 1 < cards.size) {
                _activeCardIndex.value = currentIndex + 1
                _isCardFlipped.value = false
            } else {
                _isStudyFinished.value = true
            }
        }
    }

    fun resetStudySession() {
        _activeCardIndex.value = 0
        _isCardFlipped.value = false
        _sessionMasteredCount.value = 0
        _sessionReviewCount.value = 0
        _isStudyFinished.value = false
    }

    fun generateFromCapturedImage(bitmap: Bitmap, sourceType: String = "textbook") {
        viewModelScope.launch {
            try {
                _generationState.value = GenerationUiState.Processing("Analyzing captured study material...", 0.2f)
                kotlinx.coroutines.delay(400)
                _generationState.value = GenerationUiState.Processing("Extracting core definitions & key concepts...", 0.5f)

                val key = _customApiKey.value.ifBlank { null }
                val result = geminiService.generateFlashcardsFromImage(bitmap, sourceType, key)

                _generationState.value = GenerationUiState.Processing("Creating 20 digital flashcards in cloud...", 0.85f)

                // Save deck to Firestore
                val deckIdResult = repository.createDeck(
                    title = result.deckTitle,
                    subject = result.subject,
                    sourceType = sourceType,
                    tags = result.tags
                )

                if (deckIdResult.isFailure) {
                    throw deckIdResult.exceptionOrNull() ?: Exception("Failed to save deck")
                }

                val deckId = deckIdResult.getOrThrow()
                val addCardsResult = repository.addFlashcards(deckId, result.cards)
                if (addCardsResult.isFailure) {
                    throw addCardsResult.exceptionOrNull() ?: Exception("Failed to save cards")
                }

                _generationState.value = GenerationUiState.Success(
                    deckId = deckId,
                    deckTitle = result.deckTitle,
                    cardCount = result.cards.size
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Generation failed", e)
                _generationState.value = GenerationUiState.Error(
                    e.localizedMessage ?: "Failed to generate flashcard deck."
                )
            }
        }
    }

    fun generateFromNotesText(notesText: String, subjectHint: String = "", sourceType: String = "handwritten") {
        viewModelScope.launch {
            try {
                _generationState.value = GenerationUiState.Processing("Scanning and parsing study notes...", 0.25f)
                val key = _customApiKey.value.ifBlank { null }
                val result = geminiService.generateFlashcardsFromText(notesText, subjectHint, key)

                _generationState.value = GenerationUiState.Processing("Synthesizing 20 flashcards...", 0.8f)

                val deckId = repository.createDeck(
                    title = result.deckTitle,
                    subject = result.subject,
                    sourceType = sourceType,
                    tags = result.tags
                ).getOrThrow()

                repository.addFlashcards(deckId, result.cards).getOrThrow()

                _generationState.value = GenerationUiState.Success(
                    deckId = deckId,
                    deckTitle = result.deckTitle,
                    cardCount = result.cards.size
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Text generation failed", e)
                _generationState.value = GenerationUiState.Error(
                    e.localizedMessage ?: "Failed to generate flashcards."
                )
            }
        }
    }

    fun resetGenerationState() {
        _generationState.value = GenerationUiState.Idle
    }

    fun deleteDeck(deckId: String) {
        viewModelScope.launch {
            repository.deleteDeck(deckId)
        }
    }
}
