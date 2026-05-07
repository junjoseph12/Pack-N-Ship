import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, Alert, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// Essential for handling the redirect back from the browser to Expo Go
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState(''); // For debugging

  // Standard Email/Password Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } catch (error: any) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login Flow (DEBUGGING VERSION)
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setDebugInfo('Starting Google login...');

      // ✅ Use the Expo proxy
      const redirectTo = makeRedirectUri({ useProxy: true });
      setDebugInfo(`Redirect URL: ${redirectTo}`);
      
      console.log('Redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setDebugInfo(`Supabase OAuth error: ${error.message}`);
        throw error;
      }

      if (data?.url) {
        setDebugInfo('Opening browser...');
        console.log('Auth URL:', data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        setDebugInfo(`Browser result type: ${result.type}`);
        console.log('Browser result:', result);

        if (result.type === 'success') {
          setDebugInfo('Browser returned success, extracting session...');
          
          // Try to extract session from URL
          const { data: sessionData, error: sessionError } = 
            await supabase.auth.getSessionFromUrl(result.url);

          if (sessionError) {
            setDebugInfo(`Session extraction error: ${sessionError.message}`);
            throw sessionError;
          }

          console.log('Session data:', sessionData);

          if (sessionData?.session) {
            setDebugInfo('Session obtained successfully!');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            setDebugInfo('No session in response, checking existing session...');
            
            // Fallback: Check if session was set anyway
            const { data: existingSession } = await supabase.auth.getSession();
            
            if (existingSession?.session) {
              setDebugInfo('Found existing session!');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } else {
              throw new Error('No session found after Google sign-in');
            }
          }
        } else if (result.type === 'cancel') {
          setDebugInfo('User cancelled the login');
        } else {
          setDebugInfo(`Unexpected result type: ${result.type}`);
        }
      } else {
        setDebugInfo('No auth URL returned from Supabase');
      }
    } catch (error: any) {
      setDebugInfo(`Error: ${error.message}`);
      Alert.alert(
        'Google Login Error',
        `${error.message}\n\nDebug: ${debugInfo}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>

            <View style={styles.logoSection}>
              <Image 
                source={require('../assets/Pack-N-Ship-Logo2.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
              <Text style={styles.logoText}>
                Pack-<Text style={styles.logoTextOrange}>N-Ship</Text>
              </Text>
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.header}>Glad to see you back!</Text>
              <Text style={styles.subHeader}>Log in to access your dashboard and packages.</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                editable={!loading}
              />

              <View style={[styles.passwordInputWrapper, focusedInput === 'password' && styles.inputFocused]}>
                <TextInput
                  style={{ flex: 1, paddingVertical: 14, paddingLeft: 14, fontSize: 15, color: '#111827' }}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPasswordButton} disabled={loading}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginText}>Log In</Text>}
            </TouchableOpacity>

            {/* Debug Info Display */}
            {debugInfo ? (
              <View style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 10, width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#666' }}>{debugInfo}</Text>
              </View>
            ) : null}

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={[styles.googleButton, loading && { opacity: 0.7 }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Image 
                source={require('../assets/google.png')} 
                style={styles.googleIcon} 
                resizeMode="contain" 
              />
              <Text style={styles.googleText}>Continue With Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signUpContainer}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardAvoid: { flex: 1 },
  innerContainer: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 140, height: 80, marginBottom: -25 },
  logoText: { fontSize: 26, fontWeight: '900', fontStyle: 'italic', color: '#111827' },
  logoTextOrange: { color: '#F27024' },
  headerContainer: { width: '100%', marginBottom: 24 },
  header: { fontSize: 24, fontWeight: '800', marginBottom: 6, color: '#111827', letterSpacing: -0.3 },
  subHeader: { fontSize: 14, color: '#6B7280', fontWeight: '400' },
  inputContainer: { width: '100%', marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 15, marginBottom: 14, fontSize: 15, color: '#111827', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  inputFocused: { borderColor: '#F27024', shadowColor: '#F27024', shadowOpacity: 0.1, shadowRadius: 6 },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#FFFFFF', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  eyeIcon: { paddingHorizontal: 16 },
  forgotPasswordButton: { alignSelf: 'flex-end', paddingVertical: 2, marginBottom: 6 },
  forgotPasswordText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  loginButton: { backgroundColor: '#F27024', padding: 16, borderRadius: 16, alignItems: 'center', width: '100%', marginTop: 6, marginBottom: 24, shadowColor: '#F27024', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { marginHorizontal: 15, color: '#111827', fontWeight: '600', fontSize: 14 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#111827', borderRadius: 14, padding: 14, width: '100%', marginBottom: 20, backgroundColor: '#FFFFFF' },
  googleIcon: { width: 24, height: 24, marginRight: 10 },
  googleText: { color: '#111827', fontWeight: '600', fontSize: 15 },
  signUpContainer: { width: '100%', alignItems: 'center', paddingVertical: 8 },
  signUpText: { color: '#6B7280', fontWeight: '400', fontSize: 14 },
  signUpTextBold: { color: '#F27024', fontWeight: '700' },
});