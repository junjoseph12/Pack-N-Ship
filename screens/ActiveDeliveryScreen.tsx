import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import OrangeHeader from './OrangeHeader';

export default function ActiveDeliveryScreen({ navigation }: any) {
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  const fetchActiveDelivery = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();
    if (!userRecord) return;

    const { data } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        cargo_profiles(*),
        pickup_location:locations!delivery_requests_pickup_location_id_fkey(*),
        dropoff_location:locations!delivery_requests_dropoff_location_id_fkey(*)
      `)
      .eq('sender_id', userRecord.user_id)
      .eq('delivery_status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setDelivery(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveDelivery();
  }, []);

  // Animated provider search effect
  useEffect(() => {
    if (delivery?.delivery_status === 'Pending') {
      const loop = Animated.loop(
        Animated.stagger(200, pulseAnims.map(anim =>
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        ))
      );
      loop.start();
      return () => loop.stop();
    }
  }, [delivery]);

  const cancelRequest = async () => {
    if (!delivery) return;
    await supabase
      .from('delivery_requests')
      .update({ delivery_status: 'Cancelled' })
      .eq('request_id', delivery.request_id);
    navigation.goBack();
  };

  const editRequest = () => {
    // Navigate to the schedule flow, passing the existing request as initial state
    navigation.navigate('ScheduleDelivery', {
      editMode: true,
      requestId: delivery.request_id,
      initialData: delivery,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OrangeHeader title="Active Delivery" />
        <View style={styles.center}><ActivityIndicator size="large" color="#F27024" /></View>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OrangeHeader title="Active Delivery" />
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noDelivery}>No active delivery</Text>
          <TouchableOpacity style={styles.newBookingBtn} onPress={() => navigation.navigate('ScheduleDelivery')}>
            <Text style={styles.newBookingBtnText}>Create a booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // When pending, show "Looking for provider" animation
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title="Active Delivery" />
      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status: {delivery.delivery_status}</Text>
          {delivery.delivery_status === 'Pending' && (
            <View style={styles.findingContainer}>
              <Text style={styles.findingTitle}>Looking for a provider…</Text>
              <View style={styles.driverPlaceholderContainer}>
                {pulseAnims.map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.driverPlaceholder,
                      {
                        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
                      },
                    ]}
                  >
                    <Ionicons name="person-outline" size={28} color="#9CA3AF" />
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Delivery details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <Text style={styles.detailRow}>Type: {delivery.pickup_type}</Text>
          <Text style={styles.detailRow}>Items: {delivery.cargo_profiles?.small_box_qty ?? 0} small, {delivery.cargo_profiles?.medium_box_qty ?? 0} medium, {delivery.cargo_profiles?.large_box_qty ?? 0} large</Text>
          <Text style={styles.detailRow}>Pickup: {delivery.pickup_location?.street_address}</Text>
          <Text style={styles.detailRow}>Dropoff: {delivery.dropoff_location?.street_address}</Text>
          <Text style={styles.detailRow}>Scheduled: {delivery.scheduled_time ? new Date(delivery.scheduled_time).toLocaleString() : 'Not set'}</Text>
          <Text style={styles.detailRow}>Estimated Cost: P{delivery.estimated_cost}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={editRequest}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRequest}>
            <Text style={styles.cancelBtnText}>Cancel Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDelivery: { fontSize: 16, color: '#6B7280', marginTop: 10 },
  newBookingBtn: { marginTop: 20, backgroundColor: '#F27024', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 50 },
  newBookingBtnText: { color: '#FFF', fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  findingContainer: { alignItems: 'center' },
  findingTitle: { fontSize: 14, color: '#F27024', marginBottom: 16 },
  driverPlaceholderContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  driverPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detailRow: { fontSize: 13, color: '#374151', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  editBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    flex: 0.48,
    alignItems: 'center',
  },
  editBtnText: { color: '#FFFFFF', fontWeight: '700' },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#FFFFFF', fontWeight: '700' },
});