import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function ActivityScreen({ navigation }: any) {
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();
    if (!userRecord) return;

    // Active delivery (Accepted status)
    const { data: active } = await supabase
      .from('delivery_requests')
      .select(`
        request_id,
        pickup_type,
        scheduled_time,
        estimated_cost,
        pickup_location:locations!delivery_requests_pickup_location_id_fkey(*),
        dropoff_location:locations!delivery_requests_dropoff_location_id_fkey(*)
      `)
      .eq('sender_id', userRecord.user_id)
      .eq('delivery_status', 'Accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveDelivery(active);

    // History
    const { data: hist } = await supabase
      .from('delivery_requests')
      .select(`
        request_id,
        pickup_type,
        delivery_status,
        scheduled_time,
        estimated_cost,
        pickup_location:locations!delivery_requests_pickup_location_id_fkey(street_address),
        dropoff_location:locations!delivery_requests_dropoff_location_id_fkey(street_address)
      `)
      .eq('sender_id', userRecord.user_id)
      .in('delivery_status', ['Completed', 'Cancelled'])
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(hist || []);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.pageTitle}>Activity</Text>
        <Text style={styles.subtitle}>Active Delivery</Text>

        {/* Map Card */}
        {activeDelivery ? (
          <View style={styles.mapCard}>
            <MapView
              style={{ width: '100%', height: 220, borderRadius: 16 }}
              initialRegion={{
                latitude: activeDelivery.pickup_location.latitude,
                longitude: activeDelivery.pickup_location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker
                coordinate={{
                  latitude: activeDelivery.pickup_location.latitude,
                  longitude: activeDelivery.pickup_location.longitude,
                }}
                pinColor="#3B82F6"
                title="Pickup"
              />
              <Marker
                coordinate={{
                  latitude: activeDelivery.dropoff_location.latitude,
                  longitude: activeDelivery.dropoff_location.longitude,
                }}
                pinColor="#EF4444"
                title="Drop-off"
              />
              <Polyline
                coordinates={[
                  { latitude: activeDelivery.pickup_location.latitude, longitude: activeDelivery.pickup_location.longitude },
                  { latitude: activeDelivery.dropoff_location.latitude, longitude: activeDelivery.dropoff_location.longitude },
                ]}
                strokeColor="#F27024"
                strokeWidth={3}
              />
            </MapView>
            <View style={styles.mapOverlay}>
              <Ionicons name="bicycle-outline" size={14} color="#F27024" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#F27024', marginLeft: 4 }}>7 min / 2.9 km</Text>
            </View>
          </View>
        ) : (
          <View style={styles.mapCard}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color="#9CA3AF" />
              <Text style={{ color: '#6B7280', marginTop: 8 }}>No active delivery</Text>
            </View>
          </View>
        )}

        {/* History */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>History</Text>
              <Text style={styles.sectionSubtitle}>Recent</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {history.map((item) => (
            <View key={item.request_id} style={styles.historyCard}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.grayText}>{item.pickup_type}</Text>
                  <Text style={styles.dateText}>
                    {item.scheduled_time ? new Date(item.scheduled_time).toLocaleString() : 'N/A'}
                  </Text>
                </View>
                <Ionicons name="bookmark-outline" size={20} color="#111827" />
              </View>

              <View style={styles.timelineRow}>
                <View style={styles.timelineIcons}>
                  <View style={styles.blueDot} />
                  <View style={styles.verticalLine} />
                  <Ionicons name="location" size={16} color="#EF4444" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.boldText}>{item.pickup_location?.street_address}</Text>
                  <Text style={styles.grayText}>{item.pickup_location?.street_address}</Text>
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.boldText}>{item.dropoff_location?.street_address}</Text>
                    <Text style={styles.grayText}>{item.dropoff_location?.street_address}</Text>
                  </View>
                </View>
                <View style={styles.providerCol}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.boldText, { fontSize: 10 }]}>Jun Joseph P.</Text>
                  <TouchableOpacity>
                    <Text style={{ color: '#111827', fontSize: 10 }}>Rate Provider →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.cardBottomRow}>
                <Text style={styles.grayText}>CXV34DA675FAS</Text>
                <Text style={styles.priceText}>₱{item.estimated_cost}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#000000', paddingHorizontal: 20, paddingTop: 20 },
  subtitle: { fontSize: 18, fontWeight: '400', color: '#000000', paddingHorizontal: 20, marginBottom: 16 },
  mapCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 220, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  mapOverlay: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA',
  },
  boldText: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#000000' },
  sectionSubtitle: { fontSize: 16, fontWeight: '400', color: '#000000' },
  viewAll: { fontSize: 14, fontWeight: '400', color: '#F27024' },
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  grayText: { fontSize: 12, color: '#6B7280' },
  dateText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
  timelineRow: { flexDirection: 'row', marginBottom: 12 },
  timelineIcons: { alignItems: 'center', width: 20 },
  blueDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' },
  verticalLine: { width: 2, height: 30, backgroundColor: '#E5E7EB', marginVertical: 4 },
  providerCol: { alignItems: 'center', marginLeft: 12 },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#CC5500',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  cardBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  priceText: { fontSize: 14, fontWeight: '800', color: '#111827' },
});