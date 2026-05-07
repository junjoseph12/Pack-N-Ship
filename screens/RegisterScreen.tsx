import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  // Image states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Verification & Timer States
  const [pendingVerification, setPendingVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pendingVerification && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [pendingVerification, timer]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick an image.");
    }
  };

  const handleSignUpHandler = async () => {
    if (!firstName || !lastName || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setUploading(true);
    let avatarUrl = '';

    try {
      if (imageBase64) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${firstName.toLowerCase()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars') 
          .upload(fileName, decode(imageBase64), { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            avatar_url: avatarUrl,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.session === null) {
        setPendingVerification(true);
        setTimer(60);
        setCanResend(false);
        Alert.alert('Verify Your Account', 'A 6-digit code has been sent to your email.');
      } else {
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Login');
      }
      
    } catch (error: any) {
      Alert.alert('Signup Error', error.message || 'An error occurred during sign up.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code.');
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });

      if (error) throw error;

      Alert.alert('Verified!', 'Your account has been successfully verified.');
      setPendingVerification(false);
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid or expired code.');
    } finally {
      setUploading(false);
    }
  };

  const handleResendOtp = async () => {
    setUploading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setTimer(60);
      setCanResend(false);
      setOtpCode('');
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not resend code.');
    } finally {
      setUploading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.innerContainer, { justifyContent: 'center' }]}>
              
              <Ionicons name="mail-unread-outline" size={80} color="#F27024" style={{ marginBottom: 20 }} />
              
              <View style={styles.headerContainer}>
                <Text style={[styles.header, { textAlign: 'center' }]}>Verify Email</Text>
                <Text style={[styles.subHeader, { textAlign: 'center', marginBottom: 10 }]}>
                  We sent a 6-digit code to{'\n'}<Text style={{ fontWeight: '700', color: '#111827' }}>{email}</Text>
                </Text>
                
                <Text style={styles.timerText}>
                  {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive a code?"}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput 
                  placeholder="000000" 
                  style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '700' }]} 
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode} 
                  onChangeText={setOtpCode}
                />
              </View>

              {canResend ? (
                <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={uploading}>
                  <Text style={styles.resendButtonText}>Resend Verification Code</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, uploading && styles.buttonDisabled]} 
                  onPress={handleVerifyOtp}
                  disabled={uploading}
                >
                  {uploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify Account</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setPendingVerification(false)} style={styles.linkContainer}>
                <Text style={styles.link}>Mistyped email? <Text style={styles.linkBold}>Go Back</Text></Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.innerContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.logoSection}>
              <Image source={require('../assets/Pack-N-Ship-Logo2.png')} style={styles.logoImage} resizeMode="contain" />
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.header}>Create Account</Text>
              <Text style={styles.subHeader}>Start shipping your packages securely today.</Text>
            </View>

            <View style={styles.imageUploadSection}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.profilePreview} /> : (
                  <View style={styles.imagePlaceholder}><Ionicons name="camera" size={32} color="#9CA3AF" /></View>
                )}
                <View style={styles.uploadBadge}><Ionicons name="add" size={16} color="#FFF" /></View>
              </TouchableOpacity>
              <Text style={styles.uploadText}>Upload Profile Picture</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput placeholder="First Name" style={[styles.input, focusedInput === 'firstName' && styles.inputFocused]} placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} onFocus={() => setFocusedInput('firstName')} onBlur={() => setFocusedInput(null)} />
              <TextInput placeholder="Last Name" style={[styles.input, focusedInput === 'lastName' && styles.inputFocused]} placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} onFocus={() => setFocusedInput('lastName')} onBlur={() => setFocusedInput(null)} />
              <TextInput placeholder="Phone Number" style={[styles.input, focusedInput === 'phone' && styles.inputFocused]} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} onFocus={() => setFocusedInput('phone')} onBlur={() => setFocusedInput(null)} />
              <TextInput placeholder="Email Address" style={[styles.input, focusedInput === 'email' && styles.inputFocused]} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)} />
              
              <View style={[styles.passwordInputWrapper, focusedInput === 'password' && styles.inputFocused]}>
                <TextInput placeholder="Password" secureTextEntry={!showPassword} style={{ flex: 1, paddingVertical: 14, paddingLeft: 14, fontSize: 15, color: '#111827' }} placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.button, uploading && styles.buttonDisabled]} onPress={handleSignUpHandler} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
              <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardAvoid: { flex: 1 },
  innerContainer: { paddingHorizontal: 28, paddingTop: 10, paddingBottom: 40, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 5 },
  logoImage: { width: 140, height: 80 },
  headerContainer: { width: '100%', marginBottom: 20, alignItems: 'center' },
  header: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.3 },
  subHeader: { fontSize: 14, color: '#6B7280', fontWeight: '400' },
  timerText: { fontSize: 13, color: '#F27024', fontWeight: '600', marginTop: 10 },
  imageUploadSection: { alignItems: 'center', marginBottom: 24 },
  imagePicker: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  profilePreview: { width: 86, height: 86, borderRadius: 43 },
  uploadBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#F27024', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  uploadText: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 10 },
  inputContainer: { width: '100%', marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 15, marginBottom: 14, fontSize: 15, color: '#111827', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  inputFocused: { borderColor: '#F27024', shadowColor: '#F27024', shadowOpacity: 0.1, shadowRadius: 6 },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#FFFFFF', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  eyeIcon: { paddingHorizontal: 16 },
  button: { backgroundColor: '#F27024', padding: 16, borderRadius: 16, alignItems: 'center', width: '100%', marginTop: 6, marginBottom: 24, shadowColor: '#F27024', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  resendButton: { padding: 16, width: '100%', alignItems: 'center', marginBottom: 10 },
  resendButtonText: { color: '#F27024', fontWeight: '700', fontSize: 15, textDecorationLine: 'underline' },
  linkContainer: { paddingVertical: 10 },
  link: { textAlign: 'center', color: '#6B7280', fontSize: 14, fontWeight: '400' },
  linkBold: { color: '#F27024', fontWeight: '700' }
});