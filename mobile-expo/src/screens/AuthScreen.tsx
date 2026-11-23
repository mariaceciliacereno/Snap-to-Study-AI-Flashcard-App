import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

type ScreenMode = 'welcome' | 'login' | 'signup' | 'forgot';

export function AuthScreen() {
  const [mode, setMode] = useState<ScreenMode>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
        setNotice('Verification email sent. Please verify your email address, then log in.');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/operation-not-allowed')) {
        setError(
          'Enable Email/Password in Firebase Console > Authentication > Sign-in method to sign in directly in Expo Go.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'welcome') {
    return (
      <ScrollView contentContainerStyle={styles.welcomeContainer}>
        <LinearGradient colors={['#5B21B6', '#4F46E5', '#2563EB']} style={styles.heroBanner}>
          <View style={styles.logoBox}>
            <Ionicons name="camera" size={28} color="#4F46E5" />
            <Ionicons name="school" size={18} color="#7C3AED" style={styles.capBadge} />
          </View>
          <Text style={styles.brandTitle}>Snap-to-Study AI</Text>
          <Text style={styles.brandTagline}>Snap • Learn • Remember</Text>
          <Text style={styles.heroHeadline}>
            Turn textbook pages and handwritten notes into 20 digital flashcards in seconds.
          </Text>
        </LinearGradient>

        <View style={styles.welcomeActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('signup')}>
            <Text style={styles.primaryBtnText}>Create Student Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('login')}>
            <Text style={styles.secondaryBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            setError(null);
            setNotice(null);
            setMode('welcome');
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>
          {mode === 'login'
            ? 'Welcome Back'
            : mode === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {notice && <Text style={styles.noticeText}>{notice}</Text>}

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Student Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {mode !== 'forgot' && (
          <TextInput
            style={styles.input}
            placeholder="Password (6+ characters)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'login' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
            </Text>
          )}
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('forgot')}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F6F7FB' },
  welcomeContainer: { flexGrow: 1, backgroundColor: '#F6F7FB', padding: 20, justifyContent: 'center' },
  heroBanner: { borderRadius: 28, padding: 28, alignItems: 'center' },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  capBadge: { position: 'absolute', top: 6, right: 6 },
  brandTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  brandTagline: { fontSize: 13, color: '#E0E7FF', marginTop: 4 },
  heroHeadline: {
    fontSize: 16,
    color: '#EEF2FF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 23,
  },
  welcomeActions: { marginTop: 24, gap: 12 },
  formContainer: { flexGrow: 1, backgroundColor: '#F6F7FB', padding: 24, paddingTop: 56 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  formTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
  errorText: {
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 13,
  },
  noticeText: {
    backgroundColor: '#ECFDF5',
    color: '#047857',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 13,
  },
});
