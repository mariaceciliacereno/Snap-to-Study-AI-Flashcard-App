package com.example.data.service

import android.graphics.Bitmap
import android.util.Log
import com.example.BuildConfig
import com.example.data.model.Flashcard
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.content
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

private const val TAG = "GeminiService"

data class GeneratedDeckResult(
    val deckTitle: String,
    val subject: String,
    val tags: List<String>,
    val cards: List<Flashcard>
)

class GeminiFlashcardService {

    // Structured JSON Schema for Firebase AI Logic
    private val flashcardItemSchema = Schema.obj(
        properties = mapOf(
            "question" to Schema.string(description = "Concise, high-yield question or prompt testing a core concept"),
            "answer" to Schema.string(description = "Accurate, clear, and comprehensive answer"),
            "keyConcept" to Schema.string(description = "The specific key concept or terminology"),
            "explanation" to Schema.string(description = "Context, mnemonic, or rationale explaining why the answer is correct"),
            "difficulty" to Schema.enumeration(listOf("easy", "medium", "hard"), description = "Difficulty level")
        )
    )

    private val deckSchema = Schema.obj(
        properties = mapOf(
            "deckTitle" to Schema.string(description = "Descriptive title for the flashcard deck based on the captured material"),
            "subject" to Schema.string(description = "Academic subject or category (e.g. Biology, History, Computer Science, Chemistry, Physics)"),
            "tags" to Schema.array(Schema.string(), description = "3 to 5 relevant topic keywords"),
            "cards" to Schema.array(flashcardItemSchema, description = "Exactly 20 high-yield flashcards extracted from the content")
        )
    )

    private val generationConfig = generationConfig {
        responseMimeType = "application/json"
        responseSchema = deckSchema
    }

    private val model by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig
        )
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    /**
     * Extracts core concepts and generates 20 flashcards from a captured bitmap image or text.
     */
    suspend fun generateFlashcardsFromImage(
        bitmap: Bitmap,
        sourceType: String = "textbook",
        customApiKey: String? = null
    ): GeneratedDeckResult = withContext(Dispatchers.IO) {
        val prompt = """
            You are a world-class academic tutor and spaced-repetition flashcard architect.
            Analyze this study material (which is a $sourceType page/photo).
            Carefully transcribe and extract all key concepts, definitions, formulas, theories, historical events, and principles.
            Generate a deck of exactly 20 digital flashcards designed for maximum learning retention and spaced-repetition mastery.
            Ensure utmost factual accuracy, clarity, and depth in explanations.
        """.trimIndent()

        // 1. If user provided a custom Gemini API key, use direct REST API
        if (!customApiKey.isNullOrBlank()) {
            return@withContext generateWithRestApiKey(bitmap, prompt, customApiKey)
        }

        // 2. Otherwise try Firebase AI Logic
        try {
            val response = withTimeout(60_000L) {
                model.generateContent(
                    content {
                        image(bitmap)
                        text(prompt)
                    }
                )
            }
            val jsonText = response.text ?: throw IllegalStateException("Model returned empty text.")
            parseDeckJson(jsonText)
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "Generation timed out", e)
            throw IllegalStateException("Flashcard generation timed out after 60 seconds. Please try again.")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "Firebase AI Logic attempt failed, checking fallback: ${e.localizedMessage}")
            // Check BuildConfig GEMINI_API_KEY as fallback
            val buildConfigKey = try {
                val field = BuildConfig::class.java.getField("GEMINI_API_KEY")
                field.get(null) as? String
            } catch (ignored: Exception) {
                null
            }

            if (!buildConfigKey.isNullOrBlank() && buildConfigKey != "MY_GEMINI_API_KEY") {
                return@withContext generateWithRestApiKey(bitmap, prompt, buildConfigKey)
            }
            throw e
        }
    }

    /**
     * Extracts core concepts and generates 20 flashcards from raw study notes / text.
     */
    suspend fun generateFlashcardsFromText(
        textNotes: String,
        subjectHint: String = "",
        customApiKey: String? = null
    ): GeneratedDeckResult = withContext(Dispatchers.IO) {
        val prompt = """
            You are a world-class academic tutor and spaced-repetition flashcard architect.
            Analyze these study notes / textbook excerpt:
            ${if (subjectHint.isNotBlank()) "Subject focus: $subjectHint\n" else ""}
            ---
            $textNotes
            ---
            Extract all key concepts, definitions, formulas, and principles.
            Generate a deck of exactly 20 digital flashcards designed for maximum learning retention.
            Ensure high factual accuracy, clear questions, concise answers, and rich explanations.
        """.trimIndent()

        if (!customApiKey.isNullOrBlank()) {
            return@withContext generateTextWithRestApiKey(prompt, customApiKey)
        }

        try {
            val response = withTimeout(60_000L) {
                model.generateContent(prompt)
            }
            val jsonText = response.text ?: throw IllegalStateException("Model returned empty text.")
            parseDeckJson(jsonText)
        } catch (e: TimeoutCancellationException) {
            throw IllegalStateException("Flashcard generation timed out after 60 seconds.")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            val buildConfigKey = try {
                val field = BuildConfig::class.java.getField("GEMINI_API_KEY")
                field.get(null) as? String
            } catch (ignored: Exception) {
                null
            }
            if (!buildConfigKey.isNullOrBlank() && buildConfigKey != "MY_GEMINI_API_KEY") {
                return@withContext generateTextWithRestApiKey(prompt, buildConfigKey)
            }
            throw e
        }
    }

    private fun generateWithRestApiKey(bitmap: Bitmap, promptText: String, apiKey: String): GeneratedDeckResult {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
        val imageBytes = outputStream.toByteArray()
        val base64Image = android.util.Base64.encodeToString(imageBytes, android.util.Base64.NO_WRAP)

        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
        val requestJson = JSONObject().apply {
            val contents = JSONArray().apply {
                put(JSONObject().apply {
                    val parts = JSONArray().apply {
                        put(JSONObject().apply {
                            put("inline_data", JSONObject().apply {
                                put("mime_type", "image/jpeg")
                                put("data", base64Image)
                            })
                        })
                        put(JSONObject().apply {
                            put("text", promptText)
                        })
                    }
                    put("parts", parts)
                })
            }
            put("contents", contents)
            put("generationConfig", JSONObject().apply {
                put("response_mime_type", "application/json")
            })
        }

        val request = Request.Builder()
            .url(url)
            .post(requestJson.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val response = okHttpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            val errBody = response.body?.string() ?: ""
            throw IllegalStateException("Gemini API error (HTTP ${response.code}): $errBody")
        }

        val resBody = response.body?.string() ?: throw IllegalStateException("Empty Gemini response")
        val root = JSONObject(resBody)
        val text = root.getJSONArray("candidates")
            .getJSONObject(0)
            .getJSONObject("content")
            .getJSONArray("parts")
            .getJSONObject(0)
            .getString("text")

        return parseDeckJson(text)
    }

    private fun generateTextWithRestApiKey(promptText: String, apiKey: String): GeneratedDeckResult {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
        val requestJson = JSONObject().apply {
            val contents = JSONArray().apply {
                put(JSONObject().apply {
                    val parts = JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", promptText)
                        })
                    }
                    put("parts", parts)
                })
            }
            put("contents", contents)
            put("generationConfig", JSONObject().apply {
                put("response_mime_type", "application/json")
            })
        }

        val request = Request.Builder()
            .url(url)
            .post(requestJson.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val response = okHttpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            val errBody = response.body?.string() ?: ""
            throw IllegalStateException("Gemini API error (HTTP ${response.code}): $errBody")
        }

        val resBody = response.body?.string() ?: throw IllegalStateException("Empty response")
        val root = JSONObject(resBody)
        val text = root.getJSONArray("candidates")
            .getJSONObject(0)
            .getJSONObject("content")
            .getJSONArray("parts")
            .getJSONObject(0)
            .getString("text")

        return parseDeckJson(text)
    }

    private fun parseDeckJson(jsonText: String): GeneratedDeckResult {
        val cleaned = jsonText.trim()
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()

        val obj = JSONObject(cleaned)
        val deckTitle = obj.optString("deckTitle", "Generated Study Deck")
        val subject = obj.optString("subject", "General Study")
        val tagsArray = obj.optJSONArray("tags")
        val tags = mutableListOf<String>()
        if (tagsArray != null) {
            for (i in 0 until tagsArray.length()) {
                tags.add(tagsArray.getString(i))
            }
        }

        val cardsArray = obj.getJSONArray("cards")
        val cards = mutableListOf<Flashcard>()
        for (i in 0 until cardsArray.length()) {
            val cardObj = cardsArray.getJSONObject(i)
            cards.add(
                Flashcard(
                    question = cardObj.optString("question", "Question ${i + 1}"),
                    answer = cardObj.optString("answer", "Answer"),
                    keyConcept = cardObj.optString("keyConcept", "Concept"),
                    explanation = cardObj.optString("explanation", ""),
                    difficulty = cardObj.optString("difficulty", "medium"),
                    status = "new",
                    reviewInterval = 1,
                    repetitions = 0,
                    easeFactor = 2.5
                )
            )
        }

        return GeneratedDeckResult(
            deckTitle = deckTitle,
            subject = subject,
            tags = tags,
            cards = cards
        )
    }
}
