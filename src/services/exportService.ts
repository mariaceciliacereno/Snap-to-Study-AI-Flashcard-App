import { FlashcardDeck } from '../types';

export const exportService = {
  // Generate Anki-compatible Tab-Separated Text File
  toAnki(deck: FlashcardDeck): string {
    const lines = [
      `#separator:tab`,
      `#html:true`,
      `#tags column:3`,
      `#deck:${deck.title.replace(/[\t\n]/g, ' ')}`,
    ];

    deck.cards.forEach(card => {
      const front = card.front.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      let back = card.back.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      
      if (card.hint) {
        back += `<br><br><small style="color:#64748b"><i>💡 Hint: ${card.hint.replace(/\t/g, ' ')}</i></small>`;
      }
      if (card.sourceSnippet) {
        back += `<br><small style="color:#94a3b8"><i>📖 Source: "${card.sourceSnippet.replace(/\t/g, ' ')}"</i></small>`;
      }

      const tags = [deck.subject, card.coreConcept, `box_${card.box || 1}`]
        .map(t => t.replace(/[\s\t\n]/g, '_'))
        .join(' ');

      lines.push(`${front}\t${back}\t${tags}`);
    });

    return lines.join('\n');
  },

  // Generate Quizlet-compatible import format
  toQuizlet(deck: FlashcardDeck): string {
    return deck.cards
      .map(card => {
        let answer = card.back;
        if (card.keyFormulaOrTerm) answer = `[${card.keyFormulaOrTerm}] ${answer}`;
        return `${card.front.replace(/\t/g, ' ')}\t${answer.replace(/\t/g, ' ')}`;
      })
      .join('\n\n');
  },

  // Generate CSV format
  toCsv(deck: FlashcardDeck): string {
    const headers = ['Front', 'Back', 'Hint', 'Core Concept', 'Formula / Key Term', 'Source Citation', 'Difficulty', 'Leitner Box'];
    const rows = deck.cards.map(c => [
      `"${c.front.replace(/"/g, '""')}"`,
      `"${c.back.replace(/"/g, '""')}"`,
      `"${(c.hint || '').replace(/"/g, '""')}"`,
      `"${c.coreConcept.replace(/"/g, '""')}"`,
      `"${(c.keyFormulaOrTerm || '').replace(/"/g, '""')}"`,
      `"${(c.sourceSnippet || '').replace(/"/g, '""')}"`,
      `"${c.difficulty}"`,
      `"${c.box || 1}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // Generate Full React Native (Expo + Antigravity IDE) Project Template
  toReactNativeAppCode(deck?: FlashcardDeck): string {
    const sampleCardsJson = JSON.stringify(deck ? deck.cards.slice(0, 10) : [
      { id: '1', front: 'What is ATP Synthase?', back: 'Enzyme catalyzing ATP synthesis via proton-motive force.', coreConcept: 'Cellular Respiration', box: 1 },
      { id: '2', front: 'Where does Glycolysis occur?', back: 'In the cytoplasm; requires no oxygen.', coreConcept: 'Glycolysis', box: 2 },
    ], null, 2);

    return `// ========================================================
// SnapStudy AI - React Native Prototype for Antigravity IDE
// Framework: React Native (Expo SDK 52+ / Bare RN)
// Features: Camera snap, Gemini 3.8 Flash OCR, 3D Reanimated flip, Spaced Repetition
// ========================================================

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Seed Flashcards extracted from SnapStudy AI
const INITIAL_DECK = ${sampleCardsJson};

export default function App() {
  const [mode, setMode] = useState<'camera' | 'study' | 'decks'>('camera');
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [cards, setCards] = useState(INITIAL_DECK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cameraRef = useRef<any>(null);
  const flipRotation = useSharedValue(0);

  // 3D Flip Card Animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: \`\${rotateValue}deg\` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: \`\${rotateValue}deg\` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const toggleFlip = () => {
    flipRotation.value = withTiming(isFlipped ? 0 : 180, { duration: 350 });
    setIsFlipped(!isFlipped);
  };

  const handleSnap = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      setCapturedPhoto(photo.uri);
      setIsExtracting(true);

      // In production, send photo.base64 to your SnapStudy server:
      // const res = await fetch('YOUR_SERVER_URL/api/generate-flashcards', { ... });
      
      setTimeout(() => {
        setIsExtracting(false);
        Alert.alert('Deck Generated!', 'Gemini extracted 20 high-yield flashcards with source verification.');
        setMode('study');
      }, 2000);
    } catch (err) {
      Alert.alert('Error', 'Camera capture failed');
    }
  };

  const rateCard = (rating: 'again' | 'good' | 'easy') => {
    flipRotation.value = 0;
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('Session Complete! 🎉', 'You reviewed all cards in this deck.');
      setCurrentIndex(0);
      setMode('decks');
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.titleText}>Camera Access Required</Text>
        <Text style={styles.subText}>SnapStudy needs your camera to photograph textbook pages.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Bar */}
      <View style={styles.header}>
        <Text style={styles.headerBrand}>⚡ SnapStudy AI</Text>
        <View style={styles.modeTabs}>
          <TouchableOpacity onPress={() => setMode('camera')} style={[styles.tab, mode === 'camera' && styles.activeTab]}>
            <Text style={[styles.tabText, mode === 'camera' && styles.activeTabText]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('study')} style={[styles.tab, mode === 'study' && styles.activeTab]}>
            <Text style={[styles.tabText, mode === 'study' && styles.activeTabText]}>Study</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CAMERA SCREEN */}
      {mode === 'camera' && (
        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            {/* Viewfinder Target Box */}
            <View style={styles.viewfinderBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.guideText}>Align textbook page or handwritten notes</Text>
            </View>

            {/* Shutter Bar */}
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} style={styles.iconButton}>
                <Text style={{ color: '#fff', fontSize: 18 }}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSnap} style={styles.shutterButton} activeOpacity={0.7}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('study')} style={styles.iconButton}>
                <Text style={{ color: '#fff', fontSize: 18 }}>📚</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {/* STUDY SCREEN */}
      {mode === 'study' && (
        <View style={styles.studyContainer}>
          <Text style={styles.progressText}>Card {currentIndex + 1} of {cards.length}</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleFlip} style={styles.cardContainer}>
            <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
              <Text style={styles.conceptLabel}>{cards[currentIndex]?.coreConcept || 'Core Concept'}</Text>
              <Text style={styles.frontText}>{cards[currentIndex]?.front}</Text>
              <Text style={styles.tapPrompt}>Tap to flip</Text>
            </Animated.View>
            <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
              <Text style={styles.conceptLabel}>Answer & Key Insight</Text>
              <Text style={styles.backText}>{cards[currentIndex]?.back}</Text>
              {cards[currentIndex]?.sourceSnippet ? (
                <Text style={styles.sourceQuote}>" {cards[currentIndex]?.sourceSnippet} "</Text>
              ) : null}
            </Animated.View>
          </TouchableOpacity>

          {/* Rating Buttons */}
          <View style={styles.ratingRow}>
            <TouchableOpacity onPress={() => rateCard('again')} style={[styles.rateButton, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.rateButtonText}>Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rateCard('good')} style={[styles.rateButton, { backgroundColor: '#10b981' }]}>
              <Text style={styles.rateButtonText}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rateCard('easy')} style={[styles.rateButton, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.rateButtonText}>Easy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isExtracting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Extracting 20 High-Yield Flashcards via Gemini AI...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#090d16' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  headerBrand: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  modeTabs: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 20, padding: 3 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  activeTab: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  cameraWrapper: { flex: 1 },
  camera: { flex: 1, justifyContent: 'space-between' },
  viewfinderBox: { flex: 1, margin: 30, borderWidth: 2, borderColor: 'rgba(99,102,241,0.4)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#6366f1' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  guideText: { color: '#e0e7ff', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 12 },
  cameraBottomBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 30, backgroundColor: 'rgba(0,0,0,0.5)' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  shutterButton: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#6366f1' },
  studyContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  progressText: { color: '#94a3b8', fontSize: 14, marginBottom: 16, fontWeight: '600' },
  cardContainer: { width: width - 40, height: 380 },
  card: { flex: 1, borderRadius: 24, padding: 24, justifyContent: 'space-between', borderWidth: 1, borderColor: '#334155' },
  frontCard: { backgroundColor: '#0f172a' },
  backCard: { backgroundColor: '#1e1b4b', borderColor: '#4f46e5' },
  conceptLabel: { color: '#818cf8', fontSize: 13, textTransform: 'uppercase', fontWeight: '700' },
  frontText: { color: '#f8fafc', fontSize: 22, fontWeight: '700', lineHeight: 30 },
  backText: { color: '#f8fafc', fontSize: 16, lineHeight: 24 },
  sourceQuote: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', borderLeftWidth: 2, borderLeftColor: '#6366f1', paddingLeft: 8 },
  tapPrompt: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 24 },
  rateButton: { flex: 1, marginHorizontal: 6, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  rateButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  titleText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  primaryButton: { backgroundColor: '#6366f1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
`;
  },

  // Generate package.json for the React Native project
  toReactNativePackageJson(): string {
    return JSON.stringify({
      name: 'snapstudy-ai-mobile',
      version: '1.0.0',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      },
      dependencies: {
        expo: '~52.0.0',
        'expo-camera': '~16.0.0',
        'expo-status-bar': '~2.0.0',
        react: '18.3.1',
        'react-native': '0.76.5',
        'react-native-reanimated': '~3.16.1',
        '@supabase/supabase-js': '^2.48.1',
      },
      devDependencies: {
        '@types/react': '~18.3.12',
        typescript: '^5.3.3',
      },
      private: true,
    }, null, 2);
  },

  // Helper to trigger browser file download
  downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
