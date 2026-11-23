import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import {
  saveDeckToFirestore,
  type GeneratedDraft,
  type NoteAnalysisResponse,
} from '../studyService';

interface ScanScreenProps {
  userId: string;
  onDeckSaved: (deckId: string) => void;
}

interface CapturedAsset {
  uri: string;
  mimeType: string;
  base64: string;
}

export function ScanScreen({ userId, onDeckSaved }: ScanScreenProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [pages, setPages] = useState<CapturedAsset[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<NoteAnalysisResponse | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<GeneratedDraft[]>([]);

  const takePhoto = async () => {
    if (!cameraRef.current || pages.length >= 6) return;
    setError(null);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.75,
      base64: true,
    });
    if (photo?.base64) {
      setPages((prev) => [
        ...prev,
        { uri: photo.uri, mimeType: 'image/jpeg', base64: photo.base64! },
      ]);
    }
  };

  const pickImages = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 6 - pages.length),
      quality: 0.75,
      base64: true,
    });

    if (!result.canceled) {
      const additions: CapturedAsset[] = [];
      for (const asset of result.assets) {
        if (asset.base64) {
          additions.push({
            uri: asset.uri,
            mimeType: asset.mimeType || 'image/jpeg',
            base64: asset.base64,
          });
        }
      }
      setPages((prev) => [...prev, ...additions].slice(0, 6));
    }
  };

  const handleGenerate = async () => {
    if (pages.length === 0) return;
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: pages.map((p) => ({ mimeType: p.mimeType, data: p.base64 })),
        }),
      });
      const json = (await res.json()) as NoteAnalysisResponse & { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze images.');
      }
      setAnalysis(json);
      setSubject(json.subject || 'General Studies');
      setTopic(json.topic || 'Study Topic');
      setCards(json.flashcards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process notes.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis || cards.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const deckId = await saveDeckToFirestore({
        userId,
        subjectName: subject,
        topic,
        extractedSummary: analysis.extractedSummary,
        readabilityWarning: analysis.readabilityWarning,
        isReadable: analysis.isReadable,
        pageCount: pages.length,
        flashcards: cards,
      });
      setPages([]);
      setAnalysis(null);
      setCards([]);
      onDeckSaved(deckId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck.');
    } finally {
      setSaving(false);
    }
  };

  if (analyzing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.stateTitle}>Analyzing Notes with Gemini AI...</Text>
        <Text style={styles.stateSub}>
          Extracting text, identifying topic, and generating 20 flashcards.
        </Text>
      </View>
    );
  }

  if (analysis) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.reviewHeader}>
          <Text style={styles.pageTitle}>Review 20 Flashcards</Text>
          <TouchableOpacity onPress={() => setAnalysis(null)}>
            <Text style={styles.retakeLink}>Retake</Text>
          </TouchableOpacity>
        </View>

        {(!analysis.isReadable || analysis.readabilityWarning) && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Clarity Notice</Text>
            <Text style={styles.warningText}>
              {analysis.readabilityWarning || 'Image could not be read clearly. Please retake.'}
            </Text>
          </View>
        )}

        {error && <Text style={styles.errorBox}>{error}</Text>}

        {analysis.isReadable && cards.length > 0 && (
          <>
            <Text style={styles.fieldLabel}>Detected Subject</Text>
            <TextInput style={styles.input} value={subject} onChangeText={setSubject} />

            <Text style={styles.fieldLabel}>Detected Topic</Text>
            <TextInput style={styles.input} value={topic} onChangeText={setTopic} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save {cards.length} Flashcards &amp; Study</Text>
              )}
            </TouchableOpacity>

            {cards.map((c, idx) => (
              <View key={c.cardNumber} style={styles.cardItem}>
                <Text style={styles.cardMeta}>
                  Card {c.cardNumber} · {c.questionStyle}
                </Text>
                <TextInput
                  style={styles.cardInput}
                  multiline
                  value={c.question}
                  onChangeText={(txt) =>
                    setCards((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, question: txt } : item))
                    )
                  }
                />
                <TextInput
                  style={styles.cardInput}
                  multiline
                  value={c.answer}
                  onChangeText={(txt) =>
                    setCards((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, answer: txt } : item))
                    )
                  }
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Scan Your Notes</Text>
      <Text style={styles.pageSub}>Snap up to 6 pages or pick JPG/PNG images from gallery.</Text>

      {error && <Text style={styles.errorBox}>{error}</Text>}

      <View style={styles.cameraBox}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        ) : (
          <View style={styles.permBox}>
            <Text style={styles.permText}>Camera permission is needed to scan notes.</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.camControls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Ionicons name="camera-reverse" size={20} color="#1E293B" />
          <Text style={styles.ctrlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={pickImages}>
          <Ionicons name="images" size={20} color="#1E293B" />
          <Text style={styles.ctrlText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {pages.length > 0 && (
        <View style={styles.previewWrap}>
          <Text style={styles.previewLabel}>{pages.length} page(s) captured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.thumbRow}>
              {pages.map((p, idx) => (
                <TouchableOpacity
                  key={`${p.uri}_${idx}`}
                  onPress={() => setPages((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Image source={{ uri: p.uri }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleGenerate}>
            <Text style={styles.saveBtnText}>Generate 20 Flashcards</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { padding: 18, paddingBottom: 36 },
  centerState: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  stateSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  pageSub: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 14 },
  cameraBox: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  camera: { flex: 1 },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  permText: { color: '#E2E8F0', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  permBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700' },
  camControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  ctrlBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  shutterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4F46E5' },
  previewWrap: { marginTop: 18 },
  previewLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  thumbRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  thumb: { width: 78, height: 96, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  retakeLink: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  warningBox: { backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, marginBottom: 14 },
  warningTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  warningText: { fontSize: 12, color: '#92400E', marginTop: 4 },
  errorBox: { backgroundColor: '#FEF2F2', color: '#B91C1C', padding: 12, borderRadius: 12, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  cardMeta: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginBottom: 6 },
  cardInput: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    padding: 8,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 6,
  },
});
