import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { supabase } from '../lib/supabase';

export default function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [firstName, setFirstName] = useState<string>('First');
  const [lastName, setLastName] = useState<string>('Last');
  const [userEmail, setUserEmail] = useState<string>('john.doe@example.com');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || 'john.doe@example.com');
          
          if (user.user_metadata?.first_name) {
            setFirstName(user.user_metadata.first_name);
          }
          if (user.user_metadata?.last_name) {
            setLastName(user.user_metadata.last_name);
          }
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
            setImageError(false); 
          }
        }
      };
      fetchUserData();
    }, [])
  );

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerSection}>
        <View style={styles.headerProfileInfo}>
          <View style={styles.profilePicContainer}>
            {avatarUrl && !imageError ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.profileImage} 
                onError={(e) => {
                  console.log('Account Image Load Error:', e.nativeEvent.error);
                  setImageError(true);
                }}
              />
            ) : (
              <Text style={styles.profileInitials}>
                {firstName.charAt(0)}
                {lastName.charAt(0)}
              </Text>
            )}
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutIconContainer} onPress={handleLogoutConfirm}>
          <Ionicons name="log-out-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            // @ts-ignore
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="person-circle-outline" size={24} color="#D97706" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.menuText}>Billing & Payments</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="location-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.menuText}>Saved Addresses</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Support & About</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
            </View>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="help-circle-outline" size={24} color="#374151" />
            </View>
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Pack-N-Go v1.0.0</Text>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="cube-outline" size={20} color="#6B7280" />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.tabText}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="compass-outline" size={20} color="#6B7280" />
          <Text style={styles.tabText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6B7280" />
          <Text style={styles.tabText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
          <Ionicons name="person" size={20} color="#F27024" />
          <Text style={[styles.tabText, styles.tabTextActive]}>Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerSection: {
    backgroundColor: '#F27024', 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24, 
    paddingVertical: 32,
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicContainer: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 18,
    borderWidth: 2, borderColor: '#E65A0D', overflow: 'hidden', 
  },
  profileImage: { width: 64, height: 64, borderRadius: 32 },
  profileInitials: { fontSize: 22, fontWeight: '800', color: '#F27024' },
  profileTextContainer: { justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  profileEmail: { fontSize: 12, color: '#FFDDC2', fontWeight: '500' },
  logoutIconContainer: {
    padding: 8,
  },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 28, paddingBottom: 100 },
  sectionContainer: {
    marginBottom: 24, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#374151' },
  versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, fontWeight: '500', marginTop: 10 },
  tabBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  tabItem: { alignItems: 'center' },
  tabItemActive: { },
  tabText: { fontSize: 9, fontWeight: '600', color: '#6B7280', marginTop: 3 },
  tabTextActive: { color: '#F27024', fontWeight: '800' },
});