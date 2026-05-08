import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Animated, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import OrangeHeader from './OrangeHeader';
import { supabase } from '../lib/supabase';
import { deleteDelivery } from './scheduleService';

// ---------- MOCK ACTIVE DELIVERIES (Provider Routes) ----------
const MOCK_ACTIVE = [
  {
    request_id: 1001,
    pickup_type: 'Curb-side',
    delivery_status: 'Accepted',
    scheduled_time: null,
    estimated_cost: 24.00,
    cargo_profiles: {
      cargo_pic: null,
      description: 'Glass flower vase, books',
      small_box_qty: 1,
      medium_box_qty: 0,
      large_box_qty: 0,
      is_fragile: true,
    },
    pickup_location: {
      location_id: 201,
      street_address: 'Landers Superstore, Cebu',
      latitude: 10.3157,
      longitude: 123.8854,
    },
    dropoff_location: {
      location_id: 202,
      street_address: 'Ayala Center Cebu',
      latitude: 10.3178,
      longitude: 123.9050,
    },
    provider: {
      name: 'Jun Joseph Pestaño',
      vehicle: 'Civic RS Turbo',
      plate: 'NDA-024',
      rating: 4.8,
    },
  },
  {
    request_id: 1002,
    pickup_type: 'Door-to-door',
    delivery_status: 'Accepted',
    scheduled_time: null,
    estimated_cost: 36.50,
    cargo_profiles: {
      cargo_pic: null,
      description: 'Office chair, laptop stand',
      small_box_qty: 0,
      medium_box_qty: 1,
      large_box_qty: 0,
      is_fragile: false,
    },
    pickup_location: {
      location_id: 203,
      street_address: 'IT Park, Lahug, Cebu City',
      latitude: 10.3313,
      longitude: 123.9064,
    },
    dropoff_location: {
      location_id: 204,
      street_address: 'SM Seaside City Cebu',
      latitude: 10.2800,
      longitude: 123.8800,
    },
    provider: {
      name: 'Maria Santos',
      vehicle: 'Toyota Vios',
      plate: 'ABC-1234',
      rating: 4.6,
    },
  },
  {
    request_id: 1003,
    pickup_type: 'Curb-side',
    delivery_status: 'Accepted',
    scheduled_time: null,
    estimated_cost: 18.75,
    cargo_profiles: {
      cargo_pic: null,
      description: 'Box of clothes, shoes',
      small_box_qty: 2,
      medium_box_qty: 0,
      large_box_qty: 0,
      is_fragile: false,
    },
    pickup_location: {
      location_id: 205,
      street_address: 'Mactan Airport, Lapu-Lapu City',
      latitude: 10.3091,
      longitude: 123.9798,
    },
    dropoff_location: {
      location_id: 206,
      street_address: 'Basilica del Santo Niño, Cebu City',
      latitude: 10.2943,
      longitude: 123.9016,
    },
    provider: {
      name: 'FastTrack Logistics',
      vehicle: 'Van',
      plate: 'FT-5678',
      rating: 4.9,
    },
  },
];

// ---------- Animated "Looking for provider…" for pending ----------
const PendingPulse = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.Text style={{ color: '#D97706', fontWeight: '600', fontSize: 10, opacity: pulseAnim }}>
      Looking for provider…
    </Animated.Text>
  );
};

export default function DeliveryListScreen({ route, navigation }: any) {
  const { status } = route.params || {};
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load data: mock for Accepted, real for Pending
  const fetchDeliveries = async () => {
    if (status === 'Accepted') {
  // Fetch real active deliveries from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setLoading(false); return; }
  const { data: userRecord } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', user.id)
    .single();
  if (!userRecord) { setLoading(false); return; }

  const { data } = await supabase
    .from('delivery_requests')
    .select(`
      request_id, pickup_type, delivery_status, scheduled_time, estimated_cost,
      cargo_profiles ( cargo_id, cargo_pic, description, small_box_qty, medium_box_qty, large_box_qty, is_fragile ),
      pickup_location:locations!delivery_requests_pickup_location_id_fkey ( location_id, street_address, latitude, longitude ),
      dropoff_location:locations!delivery_requests_dropoff_location_id_fkey ( location_id, street_address, latitude, longitude )
    `)
    .eq('sender_id', userRecord.user_id)
    .eq('delivery_status', 'Accepted')
    .order('created_at', { ascending: false });
  setDeliveries(data || []);
  setLoading(false);
  return;
}

    // Fetch real scheduled deliveries from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();
    if (!userRecord) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('delivery_requests')
      .select(`
        request_id, pickup_type, delivery_status, scheduled_time, estimated_cost,
        cargo_profiles ( cargo_id, cargo_pic, description, small_box_qty, medium_box_qty, large_box_qty, is_fragile ),
        pickup_location:locations!delivery_requests_pickup_location_id_fkey ( location_id, street_address, latitude, longitude ),
        dropoff_location:locations!delivery_requests_dropoff_location_id_fkey ( location_id, street_address, latitude, longitude )
      `)
      .eq('sender_id', userRecord.user_id)
      .eq('delivery_status', 'Pending')
      .order('created_at', { ascending: false });
    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchDeliveries);
    return unsubscribe;
  }, []);

  const handleDelete = (item: any) => {
  Alert.alert('Delete Delivery', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive',
      onPress: async () => {
        setDeletingId(item.request_id);
        try {
          if (status === 'Pending') {
            await deleteDelivery(
              item.request_id,
              item.cargo_profiles.cargo_id,
              item.pickup_location.location_id,
              item.dropoff_location.location_id
            );
          } else {
            setDeliveries(prev => prev.filter(d => d.request_id !== item.request_id));
          }
          fetchDeliveries(); // refresh list after delete
        } catch (error: any) {
          Alert.alert('Delete Failed', error.message || 'Could not delete delivery.');
        } finally {
          setDeletingId(null);
        }
      },
    },
  ]);
};

  const handleEdit = (item: any) => {
    navigation.navigate('ScheduleDelivery', {
      editData: item,
      mode: item.scheduled_time ? 'schedule' : 'sendNow',
    });
  };

  const renderItem = ({ item }: any) => {
    const pickup = item.pickup_location;
    const dropoff = item.dropoff_location;
    const cargo = item.cargo_profiles || {};
    const provider = item.provider || null;   // exists only in mock
    const isActive = status === 'Accepted';

    return (
      <View style={styles.card}>
        {/* Mini Map with route */}
        <MapView
          style={styles.miniMap}
          scrollEnabled={false}
          zoomEnabled={false}
          initialRegion={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
        >
          <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} pinColor="#3B82F6" />
          <Marker coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }} pinColor="#EF4444" />
          <Polyline
            coordinates={[
              { latitude: pickup.latitude, longitude: pickup.longitude },
              { latitude: dropoff.latitude, longitude: dropoff.longitude },
            ]}
            strokeColor="#F27024"
            strokeWidth={3}
          />
        </MapView>

        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryId}>#{item.request_id}</Text>
              <Text style={styles.pickupType}>{item.pickup_type}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#D1FAE5' : '#FEF3C7' }]}>
              {isActive ? (
                <Text style={{ color: '#059669', fontWeight: '600', fontSize: 10 }}>Active</Text>
              ) : (
                <PendingPulse />
              )}
            </View>
          </View>

          {/* Cargo */}
          <View style={styles.section}>
            <Ionicons name="cube-outline" size={16} color="#F27024" />
            <Text style={styles.sectionTitle}>Shipment</Text>
          </View>
          {cargo.cargo_pic ? (
            <Image source={{ uri: cargo.cargo_pic }} style={styles.cargoPhoto} />
          ) : null}
          <Text style={styles.detailText}>{cargo.description || 'No description'}</Text>
          <View style={styles.itemSizes}>
            <Text style={styles.sizeTag}>Small: {cargo.small_box_qty || 0}</Text>
            <Text style={styles.sizeTag}>Medium: {cargo.medium_box_qty || 0}</Text>
            <Text style={styles.sizeTag}>Large: {cargo.large_box_qty || 0}</Text>
          </View>
          {cargo.is_fragile && (
            <View style={styles.fragileBadge}>
              <Ionicons name="warning-outline" size={12} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 10, marginLeft: 4 }}>Fragile</Text>
            </View>
          )}

          {/* Pickup */}
          <View style={styles.section}>
            <Ionicons name="location-outline" size={16} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Pickup</Text>
          </View>
          <Text style={styles.detailText}>{pickup.street_address}</Text>
          <Ionicons name="arrow-down" size={14} color="#D1D5DB" style={{ marginLeft: 8, marginVertical: 2 }} />
          {/* Dropoff */}
          <View style={styles.section}>
            <Ionicons name="location-outline" size={16} color="#EF4444" />
            <Text style={styles.sectionTitle}>Drop-off</Text>
          </View>
          <Text style={styles.detailText}>{dropoff.street_address}</Text>

          {/* Schedule (if any) */}
          {item.scheduled_time && (
            <>
              <View style={styles.section}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              <Text style={styles.detailText}>{new Date(item.scheduled_time).toLocaleString()}</Text>
            </>
          )}

          {/* Provider (active only) */}
          {provider && (
            <View style={styles.providerCard}>
              <View style={styles.providerAvatarCircle}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerInfo}>{provider.vehicle} · {provider.plate}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callIcon}>
                <Ionicons name="call-outline" size={20} color="#F27024" />
              </TouchableOpacity>
            </View>
          )}

          {/* Cost */}
          <View style={styles.costContainer}>
            <Text style={styles.costLabel}>Total</Text>
            <Text style={styles.costValue}>₱{item.estimated_cost.toFixed(2)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              {deletingId === item.request_id ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <OrangeHeader title={status === 'Pending' ? 'Scheduled Deliveries' : 'Active Deliveries'} />
        <View style={styles.center}><ActivityIndicator size="large" color="#F27024" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title={status === 'Pending' ? 'Scheduled Deliveries' : 'Active Deliveries'} />
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.request_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No deliveries found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  miniMap: { height: 140 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  deliveryId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pickupType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  section: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 6 },
  detailText: { fontSize: 13, color: '#374151', marginBottom: 2 },
  cargoPhoto: { width: '100%', height: 100, borderRadius: 8, marginTop: 8, resizeMode: 'cover' },
  itemSizes: { flexDirection: 'row', marginTop: 8, gap: 8 },
  sizeTag: {
    fontSize: 10, fontWeight: '600', color: '#6B7280',
    backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  fragileBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start',
  },
  providerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED',
    borderRadius: 12, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  providerAvatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#CC5500',
    justifyContent: 'center', alignItems: 'center',
  },
  providerName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  providerInfo: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  ratingText: { fontSize: 10, color: '#6B7280', marginLeft: 2 },
  callIcon: { padding: 8 },
  costContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  costLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  costValue: { fontSize: 18, fontWeight: '800', color: '#F27024' },
  actions: { flexDirection: 'row', marginTop: 12 },
  editBtn: { backgroundColor: '#F27024', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginRight: 10 },
  editBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  deleteBtn: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  deleteBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});