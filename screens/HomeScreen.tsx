import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [firstName, setFirstName] = useState<string>('First');
  const [lastName, setLastName] = useState<string>('Last');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name);
        }
        if (user.user_metadata?.last_name) {
          setLastName(user.user_metadata.last_name);
        }
        if (user.user_metadata?.avatar_url) {
          console.log("Loading Home Avatar URL:", user.user_metadata.avatar_url); // Check your terminal!
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }
    };
    fetchUser();
  }, []);

  const handleSendPackage = () => {
    // Add tracking functionality here
  };

  const handleScheduleDelivery = () => {
    // Add tracking functionality here
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#F27024" />
      
      <View style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.profilePicContainer} onPress={() => navigation.navigate('Account')}>
            {avatarUrl && !imageError ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.profileImage} 
                onError={(e) => {
                  console.log('Home Image Load Error:', e.nativeEvent.error);
                  setImageError(true);
                }}
              />
            ) : (
              <Text style={styles.profileInitials}>
                {firstName.charAt(0)}
                {lastName.charAt(0)}
              </Text>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.headerWelcome}>Welcome,</Text>
            <Text style={styles.headerUsername}>{firstName} {lastName} 👋</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.upperBanner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Ship Your Packages with Confidence</Text>
            <Text style={styles.bannerSubtitle}>
              We make sure your packages arrive safely, on time, and without worries.
            </Text>
          </View>
          <View style={styles.bannerImageContainer}>
            <Image 
              source={require('../assets/Pack-N-Ship-Packages.png')} 
              style={styles.bannerImage} 
              resizeMode="contain" 
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <TouchableOpacity style={styles.card} onPress={handleSendPackage}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="cube-outline" size={32} color="#000" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Sends package now</Text>
              <Text style={styles.cardSubtitle}>Sends a package and drop-off immediately</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleScheduleDelivery}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="calendar-outline" size={32} color="#000" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Schedule a Delivery</Text>
              <Text style={styles.cardSubtitle}>Plan a future date and time for courier pickup of your package.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Quick Services</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calculator-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.gridText}>Calculate Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="scan-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.gridText}>Scan QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="location-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.gridText}>Drop-off Points</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.sectionContainer, { paddingBottom: 100 }]}>
          <Text style={styles.sectionHeading}>Recent Deliveries</Text>
          
          <View style={styles.deliveryItem}>
            <View style={styles.deliveryLeft}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <View>
                <Text style={styles.deliveryTitle}>#PNS-92841-A</Text>
                <Text style={styles.deliverySubtitle}>Delivered • To Quezon City</Text>
              </View>
            </View>
            <Text style={styles.deliveryDate}>May 06</Text>
          </View>

          <View style={styles.deliveryItem}>
            <View style={styles.deliveryLeft}>
              <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={styles.deliveryTitle}>#PNS-82749-B</Text>
                <Text style={styles.deliverySubtitle}>In-Transit • To Cebu City</Text>
              </View>
            </View>
            <Text style={styles.deliveryDate}>May 04</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
          <Ionicons name="cube" size={20} color="#F27024" />
          <Text style={[styles.tabText, styles.tabTextActive]}>Home</Text>
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
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Account')}>
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <Text style={styles.tabText}>Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F27024',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#E65A0D',
  },
  profileImage: {
    width: 58, // Explicit exact sizing fixes Android invisibility bugs
    height: 58,
    borderRadius: 30,
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F27024',
  },
  headerWelcome: { fontSize: 14, color: '#FFDDC2', fontWeight: '400' },
  headerUsername: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  notificationIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationBadge: {
    position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF',
  },
  scrollContent: { paddingBottom: 40 },
  upperBanner: {
    backgroundColor: '#F27024', flexDirection: 'row', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginTop: 0,
  },
  bannerTextContainer: { flex: 1.5, justifyContent: 'center' },
  bannerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 10, lineHeight: 26 },
  bannerSubtitle: { color: '#FFFFFF', fontSize: 11, lineHeight: 16, opacity: 0.9 },
  bannerImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'flex-end' },
  bannerImage: { width: 220, height: 130, marginRight: -90 },
  contentContainer: { paddingHorizontal: 24, paddingVertical: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 18, marginBottom: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardIconContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { color: '#9CA3AF', fontSize: 9, lineHeight: 13 },
  sectionContainer: { paddingHorizontal: 24, marginTop: 8 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    backgroundColor: '#F9FAFB', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    width: '31%', borderWidth: 1, borderColor: '#E5E7EB',
  },
  gridIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 9, fontWeight: '700', color: '#374151' },
  deliveryItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  deliveryTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  deliverySubtitle: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  deliveryDate: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  tabBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  tabItem: { alignItems: 'center' },
  tabItemActive: {},
  tabText: { fontSize: 9, fontWeight: '600', color: '#6B7280', marginTop: 3 },
  tabTextActive: { color: '#F27024', fontWeight: '800' },
});