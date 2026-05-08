import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PLACES = [
  'Landers Superstore', 'Ayala Center Cebu', 'SM Seaside', 'IT Park',
  'Mactan Airport', 'Basilica del Santo Niño', 'Temple of Leah', 'Cebu Ocean Park',
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const filtered = PLACES.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        <Text style={styles.pageTitle}>Explore</Text>
        <Text style={styles.subtitle}>Discover Pack n' Go</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Find services, drop-off points..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14 }}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>50% Off First Delivery</Text>
          <Text style={styles.promoSub}>Use code: WELCOME50</Text>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Claim Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Services</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="calculator-outline" size={28} color="#D97706" />
            <Text style={styles.gridText}>Calculate Rate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="location-outline" size={28} color="#2563EB" />
            <Text style={styles.gridText}>Find Drop-off</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="scan-outline" size={28} color="#059669" />
            <Text style={styles.gridText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="help-circle-outline" size={28} color="#9333EA" />
            <Text style={styles.gridText}>Help Center</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Popular Drop-off Points</Text>
        {filtered.length === 0 ? (
          <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 20 }}>No results found.</Text>
        ) : (
          filtered.map((place, index) => (
            <TouchableOpacity key={index} style={styles.placeRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.placeText}>{place}</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#000000' },
  subtitle: { fontSize: 18, fontWeight: '400', color: '#000000', marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 50, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  promoCard: {
    backgroundColor: '#FFF7ED', borderRadius: 16, padding: 20,
    borderLeftWidth: 4, borderLeftColor: '#F27024', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  promoTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  promoSub: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  promoBtn: {
    backgroundColor: '#F27024', borderRadius: 50, paddingVertical: 8, paddingHorizontal: 20, alignSelf: 'flex-start',
  },
  promoBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#000000', marginTop: 24, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  gridText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 8, textAlign: 'center' },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  placeText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#374151' },
});