import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OrangeHeader from './OrangeHeader';
import { useSchedule } from './ScheduleContext';
import { saveScheduleToDB } from './scheduleService';

export default function BookingScreen({ navigation }: any) {
  const { state, dispatch } = useSchedule();
  const [bookingState, setBookingState] = useState<'review' | 'finding' | 'matched'>('review');
  const [saving, setSaving] = useState(false);
  const [matchedProvider] = useState({
    name: 'Jun Joseph Pestaño',
    vehicle: 'Commercial Civic RS Turbo',
    color: 'Sonic Grey Pearl',
    plate: 'NDA-024',
    schedule: 'April 25, 2026, 6:40 PM',
  });

  // Animated provider search
  const pulseAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (bookingState === 'finding') {
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
    } else {
      pulseAnims.forEach(anim => anim.setValue(0));
    }
  }, [bookingState]);

  const handleBook = () => {
    setBookingState('finding');
    setTimeout(() => setBookingState('matched'), 3000);
  };

 const handleConfirm = async () => {
  setSaving(true);
  try {
    await saveScheduleToDB(state);
    dispatch({ type: 'RESET' });
    navigation.navigate('Home');   
  } catch (err) {
    console.error('Failed to save:', err);
  } finally {
    setSaving(false);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title="Review & Book" showBack={bookingState !== 'matched'} />
      <View style={styles.content}>
        {bookingState === 'review' && (
          <>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Review Your Booking</Text>

              {/* Drop-off Type */}
              <View style={styles.reviewRow}>
                <Ionicons name="git-compare-outline" size={18} color="#F27024" style={styles.reviewIcon} />
                <Text style={styles.reviewLabel}>Drop-off type:</Text>
                <Text style={styles.reviewValue}>{state.dropoffType}</Text>
              </View>

              {/* Items */}
              <View style={styles.reviewRow}>
                <Ionicons name="cube-outline" size={18} color="#F27024" style={styles.reviewIcon} />
                <Text style={styles.reviewLabel}>Items:</Text>
                <Text style={styles.reviewValue}>
                  {state.items.length > 0
                    ? `${state.items.length} item${state.items.length > 1 ? 's' : ''}`
                    : 'None'}
                  {state.items.some(i => i.fragile) && ' (Fragile)'}
                </Text>
              </View>

              {/* Sizes */}
              {state.items.length > 0 && (
                <View style={styles.itemDetail}>
                  <Text style={styles.detailText}>
                    Small: {state.items.filter(i => i.size === 'Small').length} · 
                    Medium: {state.items.filter(i => i.size === 'Medium').length} · 
                    Large: {state.items.filter(i => i.size === 'Large').length}
                  </Text>
                </View>
              )}

              {/* Scheduled Date */}
              <View style={styles.reviewRow}>
                <Ionicons name="calendar-outline" size={18} color="#F27024" style={styles.reviewIcon} />
                <Text style={styles.reviewLabel}>Schedule:</Text>
                <Text style={styles.reviewValue}>
                  {state.scheduledDate
                    ? state.scheduledDate.toLocaleDateString()
                    : 'Not selected'}
                </Text>
              </View>

              {/* Pickup & Dropoff */}
              <View style={styles.reviewRow}>
                <Ionicons name="location" size={18} color="#3B82F6" style={styles.reviewIcon} />
                <Text style={styles.reviewLabel}>Pickup:</Text>
                <Text style={styles.reviewValue}>{state.pickupLocation?.address}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="location" size={18} color="#EF4444" style={styles.reviewIcon} />
                <Text style={styles.reviewLabel}>Drop-off:</Text>
                <Text style={styles.reviewValue}>{state.dropoffLocation?.address}</Text>
              </View>

              {/* Estimated Cost */}
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Estimated total cost</Text>
                <Text style={styles.costValue}>P{state.estimatedCost?.toFixed(2) ?? '--'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
              <Text style={styles.bookBtnText}>Confirm & Book</Text>
            </TouchableOpacity>
          </>
        )}

        {bookingState === 'finding' && (
          <View style={styles.findingContainer}>
            <Text style={styles.findingTitle}>Finding the best provider…</Text>
            <Text style={styles.findingSub}>Scanning nearby drivers for your delivery</Text>

            <View style={styles.driverPlaceholderContainer}>
              {pulseAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.driverPlaceholder,
                    {
                      opacity: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      transform: [{
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1.05],
                        }),
                      }],
                    },
                  ]}
                >
                  <Ionicons name="person-outline" size={28} color="#9CA3AF" />
                </Animated.View>
              ))}
            </View>

            <TouchableOpacity onPress={() => setBookingState('review')}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {bookingState === 'matched' && (
          <View style={styles.matchedContainer}>
            <View style={styles.matchedCard}>
              <Text style={styles.matchedTitle}>Provider has been matched!</Text>

              <View style={styles.providerRow}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={32} color="#F27024" />
                </View>
                <View style={styles.providerDetails}>
                  <Text style={styles.driverName}>{matchedProvider.name}</Text>
                  <View style={styles.vehicleInfoRow}>
                    <Ionicons name="car-sport-outline" size={14} color="#6B7280" />
                    <Text style={styles.vehicleText}>{matchedProvider.vehicle}</Text>
                  </View>
                  <Text style={styles.colorText}>{matchedProvider.color}</Text>
                  <Text style={styles.plateText}>Plate: {matchedProvider.plate}</Text>
                </View>
              </View>

              <View style={styles.providerActions}>
                <TouchableOpacity style={styles.callBtn}>
                  <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.msgBtn}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F27024" />
                  <Text style={[styles.actionBtnText, { color: '#F27024' }]}>Message</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.routeSummary}>
                <View style={styles.routePoints}>
                  <Ionicons name="location" size={16} color="#3B82F6" />
                  <Text style={styles.routeAddress}>{state.pickupLocation?.address}</Text>
                </View>
                <Ionicons name="arrow-down" size={16} color="#D1D5DB" style={{ marginVertical: 4 }} />
                <View style={styles.routePoints}>
                  <Ionicons name="location" size={16} color="#EF4444" />
                  <Text style={styles.routeAddress}>{state.dropoffLocation?.address}</Text>
                </View>
              </View>

              <View style={styles.scheduleBox}>
                <View style={styles.scheduleRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.scheduleText}>{matchedProvider.schedule}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>P{state.estimatedCost}.00</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  // Review
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewIcon: { marginRight: 10, width: 24, textAlign: 'center' },
  reviewLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#6B7280' },
  reviewValue: { flex: 2, fontSize: 13, color: '#111827' },
  itemDetail: { marginLeft: 34, marginBottom: 12 },
  detailText: { fontSize: 12, color: '#6B7280' },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  costLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  costValue: { fontSize: 18, fontWeight: '800', color: '#F27024' },
  bookBtn: {
    backgroundColor: '#F27024',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  bookBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  // Finding
  findingContainer: { alignItems: 'center', flex: 1, paddingTop: 40 },
  findingTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  findingSub: { fontSize: 13, color: '#6B7280', marginBottom: 30 },
  driverPlaceholderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 30,
  },
  driverPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtn: { color: '#F27024', fontWeight: '700', marginTop: 40 },
  // Matched
  matchedContainer: { flex: 1 },
  matchedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  matchedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 20,
    textAlign: 'center',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
    marginRight: 16,
  },
  providerDetails: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  vehicleInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  vehicleText: { fontSize: 13, color: '#6B7280', marginLeft: 4 },
  colorText: { fontSize: 12, color: '#9CA3AF' },
  plateText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  providerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  callBtn: {
    backgroundColor: '#F27024',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  msgBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    flex: 0.48,
    justifyContent: 'center',
  },
  actionBtnText: { fontWeight: '700', color: '#FFFFFF', fontSize: 14 },
  routeSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  routePoints: { flexDirection: 'row', alignItems: 'center' },
  routeAddress: { fontSize: 13, color: '#374151', marginLeft: 8, flex: 1 },
  scheduleBox: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  scheduleText: { fontSize: 14, color: '#111827', marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#F27024' },
  confirmBtn: {
    backgroundColor: '#111827',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});