import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from './src/firebase';
import {
  ensureUserProfile,
  subscribeStudyData,
  type FlashcardDeckRecord,
  type FlashcardRecord,
  type StudyProgressRecord,
  type SubjectRecord,
} from './src/studyService';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { DecksScreen } from './src/screens/DecksScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [decks, setDecks] = useState<FlashcardDeckRecord[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardRecord[]>([]);
  const [progress, setProgress] = useState<StudyProgressRecord[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser && nextUser.emailVerified) {
        await ensureUserProfile(nextUser);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setSubjects([]);
      setDecks([]);
      setFlashcards([]);
      setProgress([]);
      return;
    }
    return subscribeStudyData(user.uid, {
      onSubjects: setSubjects,
      onDecks: setDecks,
      onFlashcards: setFlashcards,
      onProgress: setProgress,
    });
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user || !user.emailVerified) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'Student';
  const masteredCount = progress.filter((p) => p.difficulty === 'easy').length;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { fontWeight: '800', color: '#0F172A' },
            tabBarActiveTintColor: '#4F46E5',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: { height: 66, paddingBottom: 8, paddingTop: 6 },
          }}
        >
          <Tab.Screen
            name="Home"
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }}
          >
            {({ navigation }) => (
              <HomeScreen
                displayName={displayName}
                subjects={subjects}
                decks={decks}
                flashcards={flashcards}
                progress={progress}
                onGoScan={() => navigation.navigate('Scan')}
                onGoDecks={() => navigation.navigate('My Decks')}
                onOpenDeckStudy={(deckId) => {
                  setSelectedDeckId(deckId);
                  navigation.navigate('Study');
                }}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="My Decks"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="folder-open" size={size} color={color} />
              ),
            }}
          >
            {({ navigation }) => (
              <DecksScreen
                userId={user.uid}
                decks={decks}
                onGoScan={() => navigation.navigate('Scan')}
                onStartStudy={(deckId) => {
                  setSelectedDeckId(deckId);
                  navigation.navigate('Study');
                }}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Scan"
            options={{
              tabBarLabel: 'Scan',
              tabBarIcon: () => (
                <View style={styles.scanTabBtn}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
              ),
            }}
          >
            {({ navigation }) => (
              <ScanScreen
                userId={user.uid}
                onDeckSaved={(deckId) => {
                  setSelectedDeckId(deckId);
                  navigation.navigate('Study');
                }}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Study"
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }}
          >
            {({ navigation }) => (
              <StudyScreen
                userId={user.uid}
                decks={decks}
                flashcards={flashcards}
                progress={progress}
                selectedDeckId={selectedDeckId}
                onGoScan={() => navigation.navigate('Scan')}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
            }}
          >
            {() => (
              <ProfileScreen
                displayName={displayName}
                email={user.email || ''}
                deckCount={decks.length}
                cardCount={flashcards.length}
                masteredCount={masteredCount}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' },
  scanTabBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
});
