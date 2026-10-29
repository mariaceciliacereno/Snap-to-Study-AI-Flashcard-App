package com.example.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.FlashAuto
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GridOn
import androidx.compose.material.icons.filled.Notes
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.ui.viewmodel.SnapStudyViewModel
import java.io.InputStream
import java.util.concurrent.Executors

private const val TAG = "CameraCaptureScreen"

@Composable
fun CameraCaptureScreen(
    viewModel: SnapStudyViewModel,
    onBack: () -> Unit,
    onCaptured: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    var lensFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_BACK) }
    var flashMode by remember { mutableIntStateOf(ImageCapture.FLASH_MODE_AUTO) }
    var showGrid by remember { mutableStateOf(true) }
    var sourceType by remember { mutableStateOf("textbook") } // "textbook", "handwritten", "slides"
    var showManualTextDialog by remember { mutableStateOf(false) }

    val imageCapture = remember {
        ImageCapture.Builder()
            .setFlashMode(flashMode)
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
            .build()
    }

    // Photo picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            val bitmap = uriToBitmap(context, uri)
            if (bitmap != null) {
                viewModel.generateFromCapturedImage(bitmap, sourceType)
                onCaptured()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        if (hasCameraPermission) {
            // Live CameraX Preview
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    val previewView = PreviewView(ctx).apply {
                        scaleType = PreviewView.ScaleType.FILL_CENTER
                    }
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also {
                            it.surfaceProvider = previewView.surfaceProvider
                        }
                        val cameraSelector = CameraSelector.Builder()
                            .requireLensFacing(lensFacing)
                            .build()
                        try {
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                cameraSelector,
                                preview,
                                imageCapture
                            )
                        } catch (exc: Exception) {
                            Log.e(TAG, "Use case binding failed", exc)
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                update = {
                    // Update camera when lens or settings change
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also {
                            it.surfaceProvider = it.surfaceProvider
                        }
                        val cameraSelector = CameraSelector.Builder()
                            .requireLensFacing(lensFacing)
                            .build()
                        try {
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                cameraSelector,
                                preview,
                                imageCapture
                            )
                        } catch (exc: Exception) {
                            Log.e(TAG, "Use case update failed", exc)
                        }
                    }, ContextCompat.getMainExecutor(context))
                }
            )

            // Grid overlay if enabled
            if (showGrid) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    // 3x3 rule of thirds grid
                    drawLine(Color.White.copy(alpha = 0.25f), Offset(w / 3f, 0f), Offset(w / 3f, h), strokeWidth = 1.dp.toPx())
                    drawLine(Color.White.copy(alpha = 0.25f), Offset(2f * w / 3f, 0f), Offset(2f * w / 3f, h), strokeWidth = 1.dp.toPx())
                    drawLine(Color.White.copy(alpha = 0.25f), Offset(0f, h / 3f), Offset(w, h / 3f), strokeWidth = 1.dp.toPx())
                    drawLine(Color.White.copy(alpha = 0.25f), Offset(0f, 2f * h / 3f), Offset(w, 2f * h / 3f), strokeWidth = 1.dp.toPx())
                }
            }

            // Framing Bracket Guide in the center
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp, vertical = 110.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(2.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                ) {
                    Text(
                        text = "Align textbook page or handwritten notes inside frame",
                        color = Color.White.copy(alpha = 0.85f),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 16.dp)
                            .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        } else {
            // Permission fallback message
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Camera Permission Needed",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "SnapStudy requires camera access to scan textbook pages and notes. You can also pick photos from your library or try sample scans below.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Grant Camera Permission")
                    }
                }
            }
        }

        // Top Controls Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 40.dp, start = 16.dp, end = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                    .size(44.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }

            // Source Mode Chips
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(
                    "textbook" to "Textbook",
                    "handwritten" to "Notes",
                    "slides" to "Slides"
                ).forEach { (typeKey, label) ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (sourceType == typeKey) MaterialTheme.colorScheme.primary else Color.Black.copy(alpha = 0.45f),
                        modifier = Modifier.clickable { sourceType = typeKey }
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Camera Toggles (Flash / Grid / Flip)
            Row {
                IconButton(
                    onClick = {
                        flashMode = when (flashMode) {
                            ImageCapture.FLASH_MODE_AUTO -> ImageCapture.FLASH_MODE_ON
                            ImageCapture.FLASH_MODE_ON -> ImageCapture.FLASH_MODE_OFF
                            else -> ImageCapture.FLASH_MODE_AUTO
                        }
                        imageCapture.flashMode = flashMode
                    },
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        imageVector = when (flashMode) {
                            ImageCapture.FLASH_MODE_ON -> Icons.Default.FlashOn
                            ImageCapture.FLASH_MODE_OFF -> Icons.Default.FlashOff
                            else -> Icons.Default.FlashAuto
                        },
                        contentDescription = "Toggle Flash",
                        tint = Color.White
                    )
                }

                IconButton(
                    onClick = { showGrid = !showGrid },
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.GridOn,
                        contentDescription = "Toggle Grid",
                        tint = if (showGrid) MaterialTheme.colorScheme.primary else Color.White
                    )
                }

                IconButton(
                    onClick = {
                        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                            CameraSelector.LENS_FACING_FRONT
                        } else {
                            CameraSelector.LENS_FACING_BACK
                        }
                    },
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Cameraswitch,
                        contentDescription = "Switch Camera",
                        tint = Color.White
                    )
                }
            }
        }

        // Bottom Controls Container
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f), Color.Black)
                    )
                )
                .padding(bottom = 24.dp, start = 16.dp, end = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Sample Scans Row
            Text(
                text = "⚡ Instant Presets (Tap to test without physical book):",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                item {
                    SampleScanChip("🧬 Biology: Photosynthesis") {
                        viewModel.generateFromNotesText(
                            notesText = """
                                Photosynthesis occurs in chloroplasts of plant cells:
                                1. Light-Dependent Reactions occur in thylakoid membranes. Photons excite electrons in Chlorophyll inside Photosystem II. Water (H2O) is split (photolysis), releasing O2, protons (H+), and electrons.
                                2. Electron Transport Chain transports excited electrons, pumping H+ into thylakoid lumen. ATP Synthase generates ATP through photophosphorylation. Electrons reach Photosystem I, reducing NADP+ to NADPH.
                                3. Light-Independent Reactions (Calvin Cycle) occur in the stroma:
                                - Carbon Fixation: RuBisCO enzyme fixes atmospheric CO2 onto 5-carbon ribulose-1,5-bisphosphate (RuBP), forming 3-PGA.
                                - Reduction: 3-PGA is converted to glyceraldehyde-3-phosphate (G3P) using ATP and NADPH.
                                - Regeneration: Remaining G3P molecules regenerate RuBP using ATP.
                                One glucose molecule requires 6 turns of the Calvin cycle (6 CO2, 18 ATP, 12 NADPH).
                            """.trimIndent(),
                            subjectHint = "Biology",
                            sourceType = "textbook"
                        )
                        onCaptured()
                    }
                }
                item {
                    SampleScanChip("🏛️ History: Fall of Constantinople") {
                        viewModel.generateFromNotesText(
                            notesText = """
                                Fall of Constantinople (1453):
                                1. Background: Constantinople was the capital of the Eastern Roman (Byzantine) Empire, founded by Emperor Constantine in 330 AD.
                                2. Ottoman Forces: Led by Sultan Mehmed II ('The Conqueror'), boasting an army of over 80,000 soldiers and massive supercannons forged by engineer Orban.
                                3. Byzantine Defense: Commanded by Emperor Constantine XI Palaiologos, with approximately 7,000 defenders including Venetian and Genoese allies led by Giovanni Giustiniani.
                                4. The Golden Horn: Mehmed II bypassed the massive sea chain by hauling Ottoman ships overland on greased logs into the Golden Horn.
                                5. The Final Assault: On May 29, 1453, Ottoman Janissaries breached the Romanus gate. Constantine XI died fighting.
                                6. Impact: Marked the end of the Roman Empire, sparked the European Renaissance as Greek scholars fled to Italy, and closed land trade routes to Asia, spurring the Age of Exploration.
                            """.trimIndent(),
                            subjectHint = "World History",
                            sourceType = "textbook"
                        )
                        onCaptured()
                    }
                }
                item {
                    SampleScanChip("💻 CS: Sorting & Big-O Complexity") {
                        viewModel.generateFromNotesText(
                            notesText = """
                                Sorting Algorithms & Asymptotic Analysis:
                                1. Big-O Notation: Upper bound of algorithm execution time relative to input size n.
                                - O(1): Constant time (Hash map lookup)
                                - O(log n): Logarithmic time (Binary search)
                                - O(n): Linear time (Linear search)
                                - O(n log n): Optimal comparison-based sorting
                                - O(n^2): Quadratic time (Nested loops)
                                2. QuickSort: Divide-and-conquer algorithm. Selects a pivot, partitions array around pivot, recursively sorts sub-arrays. Average O(n log n), worst case O(n^2) when already sorted with bad pivot.
                                3. MergeSort: Stable divide-and-conquer sort. Divides array in half, sorts halves recursively, merges sorted lists. Guaranteed O(n log n) time, requires O(n) auxiliary memory.
                                4. HeapSort: Uses binary heap data structure. Builds max-heap, extracts root iteratively. In-place O(n log n), but not cache-friendly.
                                5. Stability: A sort algorithm is stable if equal elements maintain their relative original order.
                            """.trimIndent(),
                            subjectHint = "Computer Science",
                            sourceType = "handwritten"
                        )
                        onCaptured()
                    }
                }
            }

            // Main Shutter Action Controls Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Photo Picker button
                IconButton(
                    onClick = {
                        photoPickerLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                        .size(52.dp)
                        .testTag("gallery_picker_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.PhotoLibrary,
                        contentDescription = "Pick photo from gallery",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }

                // Shutter Button
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .border(4.dp, Color.White, CircleShape)
                        .padding(6.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary)
                        .clickable {
                            if (hasCameraPermission) {
                                takePhoto(
                                    imageCapture = imageCapture,
                                    context = context,
                                    onImageCaptured = { bitmap ->
                                        viewModel.generateFromCapturedImage(bitmap, sourceType)
                                        onCaptured()
                                    },
                                    onError = { exc ->
                                        Log.e(TAG, "Failed capturing photo", exc)
                                    }
                                )
                            } else {
                                permissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        }
                        .testTag("camera_shutter_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                    )
                }

                // Paste notes text button
                IconButton(
                    onClick = { showManualTextDialog = true },
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                        .size(52.dp)
                        .testTag("manual_notes_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Notes,
                        contentDescription = "Paste study notes text",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
        }
    }

    // Manual Notes Entry Dialog
    if (showManualTextDialog) {
        var manualNotes by remember { mutableStateOf("") }
        var manualSubject by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showManualTextDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Type or Paste Notes")
                }
            },
            text = {
                Column {
                    Text(
                        text = "Enter lecture notes, definitions, or textbook paragraphs. Gemini will extract core concepts and generate 20 flashcards.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = manualSubject,
                        onValueChange = { manualSubject = it },
                        label = { Text("Subject (e.g. Biology, History, CS)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = manualNotes,
                        onValueChange = { manualNotes = it },
                        label = { Text("Study Notes Content") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp),
                        maxLines = 8
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (manualNotes.isNotBlank()) {
                            showManualTextDialog = false
                            viewModel.generateFromNotesText(
                                notesText = manualNotes,
                                subjectHint = manualSubject,
                                sourceType = "handwritten"
                            )
                            onCaptured()
                        }
                    },
                    enabled = manualNotes.isNotBlank()
                ) {
                    Text("Generate 20 Cards")
                }
            },
            dismissButton = {
                TextButton(onClick = { showManualTextDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun SampleScanChip(
    label: String,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color.White.copy(alpha = 0.25f),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = Color(0xFFFDE047),
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

private fun takePhoto(
    imageCapture: ImageCapture,
    context: Context,
    onImageCaptured: (Bitmap) -> Unit,
    onError: (ImageCaptureException) -> Unit
) {
    val executor = ContextCompat.getMainExecutor(context)
    imageCapture.takePicture(
        executor,
        object : ImageCapture.OnImageCapturedCallback() {
            override fun onCaptureSuccess(image: ImageProxy) {
                val rotationDegrees = image.imageInfo.rotationDegrees
                val bitmap = imageProxyToBitmap(image, rotationDegrees)
                image.close()
                if (bitmap != null) {
                    onImageCaptured(bitmap)
                } else {
                    onError(ImageCaptureException(ImageCapture.ERROR_UNKNOWN, "Bitmap conversion failed", null))
                }
            }

            override fun onError(exception: ImageCaptureException) {
                onError(exception)
            }
        }
    )
}

private fun imageProxyToBitmap(image: ImageProxy, rotationDegrees: Int): Bitmap? {
    val plane = image.planes[0]
    val buffer = plane.buffer
    val bytes = ByteArray(buffer.remaining())
    buffer.get(bytes)
    val original = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null

    return if (rotationDegrees != 0) {
        val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
        Bitmap.createBitmap(original, 0, 0, original.width, original.height, matrix, true)
    } else {
        original
    }
}

private fun uriToBitmap(context: Context, uri: Uri): Bitmap? {
    return try {
        val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
        BitmapFactory.decodeStream(inputStream)
    } catch (e: Exception) {
        Log.e(TAG, "Failed reading URI bitmap", e)
        null
    }
}
