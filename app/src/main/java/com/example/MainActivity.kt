package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.Deck
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.CameraCaptureScreen
import com.example.ui.screens.DeckDetailScreen
import com.example.ui.screens.DeckListScreen
import com.example.ui.screens.ProcessingScreen
import com.example.ui.screens.SettingsDialog
import com.example.ui.screens.attemptAutoSignIn
import com.example.ui.theme.SnapStudyTheme
import com.example.ui.viewmodel.SnapStudyViewModel
import com.example.util.configureAppCheck
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import androidx.credentials.CredentialManager

enum class Screen {
    DECK_LIST,
    CAMERA_CAPTURE,
    PROCESSING,
    STUDY_SESSION,
    DECK_DETAIL
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // STEP 1: Mandatory App Check configuration with launch intent before any UI or Firebase ops
        configureAppCheck(this, intent)

        enableEdgeToEdge()

        setContent {
            SnapStudyTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SnapStudyApp(activity = this)
                }
            }
        }
    }
}

@Composable
fun SnapStudyApp(activity: ComponentActivity) {
    val coroutineScope = rememberCoroutineScope()
    val credentialManager = remember { CredentialManager.create(activity) }
    var currentUser by remember { mutableStateOf(Firebase.auth.currentUser) }

    // Realtime auth state observation
    DisposableEffect(Unit) {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            currentUser = auth.currentUser
        }
        Firebase.auth.addAuthStateListener(listener)
        onDispose {
            Firebase.auth.removeAuthStateListener(listener)
        }
    }

    // Attempt silent auto-sign-in on startup if not already signed in
    LaunchedEffect(Unit) {
        if (currentUser == null) {
            attemptAutoSignIn(
                context = activity,
                credentialManager = credentialManager,
                onAuthSuccess = { currentUser = Firebase.auth.currentUser },
                onUnauthenticated = { /* Wait for interactive login */ },
                scope = coroutineScope
            )
        }
    }

    if (currentUser == null) {
        AuthScreen(
            onAuthSuccess = { currentUser = Firebase.auth.currentUser }
        )
    } else {
        val viewModel: SnapStudyViewModel = viewModel()
        var currentScreen by remember { mutableStateOf(Screen.DECK_LIST) }
        var showSettings by remember { mutableStateOf(false) }

        when (currentScreen) {
            Screen.DECK_LIST -> {
                DeckListScreen(
                    viewModel = viewModel,
                    onNavigateToCamera = {
                        viewModel.resetGenerationState()
                        currentScreen = Screen.CAMERA_CAPTURE
                    },
                    onNavigateToStudy = { deck ->
                        viewModel.startStudySession(deck)
                        currentScreen = Screen.STUDY_SESSION
                    },
                    onNavigateToDeckDetail = { deck ->
                        viewModel.selectDeck(deck)
                        currentScreen = Screen.DECK_DETAIL
                    },
                    onOpenSettings = { showSettings = true }
                )
            }

            Screen.CAMERA_CAPTURE -> {
                BackHandler { currentScreen = Screen.DECK_LIST }
                CameraCaptureScreen(
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.DECK_LIST },
                    onCaptured = { currentScreen = Screen.PROCESSING }
                )
            }

            Screen.PROCESSING -> {
                BackHandler {
                    viewModel.resetGenerationState()
                    currentScreen = Screen.DECK_LIST
                }
                ProcessingScreen(
                    viewModel = viewModel,
                    onNavigateToHome = {
                        viewModel.resetGenerationState()
                        currentScreen = Screen.DECK_LIST
                    },
                    onStartStudying = {
                        val deck = viewModel.currentDeck.value
                        if (deck != null) {
                            viewModel.startStudySession(deck)
                            currentScreen = Screen.STUDY_SESSION
                        } else {
                            currentScreen = Screen.DECK_LIST
                        }
                    }
                )
            }

            Screen.STUDY_SESSION -> {
                BackHandler { currentScreen = Screen.DECK_LIST }
                com.example.ui.screens.DeckStudyScreen(
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.DECK_LIST }
                )
            }

            Screen.DECK_DETAIL -> {
                BackHandler { currentScreen = Screen.DECK_LIST }
                DeckDetailScreen(
                    viewModel = viewModel,
                    onBack = { currentScreen = Screen.DECK_LIST },
                    onStudyClick = { deck ->
                        viewModel.startStudySession(deck)
                        currentScreen = Screen.STUDY_SESSION
                    }
                )
            }
        }

        if (showSettings) {
            SettingsDialog(
                viewModel = viewModel,
                onDismiss = { showSettings = false },
                coroutineScope = coroutineScope,
                onSignedOut = {
                    currentUser = null
                    currentScreen = Screen.DECK_LIST
                }
            )
        }
    }
}
