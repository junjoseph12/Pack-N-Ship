import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        Alert.alert('Error', 'Could not load user data.');
      } else if (user?.user_metadata) {
        setFirstName(user.user_metadata.first_name || '');
        setLastName(user.user_metadata.last_name || '');
        setPhone(user.user_metadata.phone || '');
        setImageUri(user.user_metadata.avatar_url || null);
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

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

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert('Error', 'Please fill out your name and phone number.');
      return;
    }

    setSaving(true);
    let finalAvatarUrl = imageUri;

    try {
      if (imageBase64) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${firstName.toLowerCase()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(imageBase64), { 
            contentType: 'image/jpeg',
            upsert: true 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalAvatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          avatar_url: finalAvatarUrl,
        }
      });

      if (updateError) throw updateError;

      Alert.alert('Success', 'Your profile has been updated!');
      navigation.goBack(); 
      
    } catch (error: any) {
      Alert.alert('Update Error', error.message || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F27024" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.imageUploadSection}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profilePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.profileInitials}>
                    {firstName ? firstName.charAt(0) : ''}
                    {lastName ? lastName.charAt(0) : ''}
                  </Text>
                </View>
              )}
              <View style={styles.uploadBadge}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.uploadText}>Change Photo</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput 
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput 
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderColor: '#F3F4F6',
  },
  backButton: { 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#111827' 
  },
  scrollContent: { 
    paddingHorizontal: 24, 
    paddingTop: 32, 
    paddingBottom: 40 
  },
  imageUploadSection: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  imagePicker: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#F27024',
    position: 'relative',
  },
  profilePreview: { 
    width: 96, 
    height: 96, 
    borderRadius: 48 
  },
  imagePlaceholder: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileInitials: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#9CA3AF' 
  },
  uploadBadge: {
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#F27024',
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: '#FFFFFF',
  },
  uploadText: { 
    fontSize: 13, 
    color: '#6B7280', 
    fontWeight: '600', 
    marginTop: 12 
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 8 
  },
  input: {
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    padding: 14,
    fontSize: 15, 
    color: '#111827', 
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#F27024', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    marginTop: 20, 
    shadowColor: '#F27024', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
});