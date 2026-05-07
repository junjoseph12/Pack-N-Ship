import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OrangeHeader from './OrangeHeader';
import { useSchedule } from './ScheduleContext';

export default function DropoffTypeScreen({ navigation }: any) {
  const { state, dispatch } = useSchedule();

  const selectType = (type: 'curb-side' | 'door-to-door') => {
    dispatch({ type: 'SET_DROPOFF_TYPE', payload: type });
    navigation.navigate('ShipmentSize');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader
        title="Schedule Delivery"
        subtitle="Your trusted partner in fast, secure, and hassle-free delivery services."
      />
    <View style={styles.centeredView}>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="git-compare-outline" size={24} color="#F27024" />
          <Text style={styles.cardTitle}>Drop-off Type</Text>
        </View>

        <TouchableOpacity
          style={[styles.option, state.dropoffType === 'curb-side' && styles.optionActive]}
          onPress={() => selectType('curb-side')}
          activeOpacity={0.7}
        >
          <Ionicons name="car-sport-outline" size={32} color="#111827" />
          <View style={styles.optionTextBlock}>
            <Text style={styles.optionLabel}>Curb‑side</Text>
            <Text style={styles.optionSub}>Receiver meets at vehicle</Text>
          </View>
          {state.dropoffType === 'curb-side' && (
            <Ionicons name="checkmark-circle" size={24} color="#F27024" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, state.dropoffType === 'door-to-door' && styles.optionActive]}
          onPress={() => selectType('door-to-door')}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={32} color="#111827" />
          <View style={styles.optionTextBlock}>
            <Text style={styles.optionLabel}>Door‑to‑Door</Text>
            <Text style={styles.optionSub}>Deliver to actual doorstep</Text>
          </View>
          {state.dropoffType === 'door-to-door' && (
            <Ionicons name="checkmark-circle" size={24} color="#F27024" />
          )}
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginLeft: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  centeredView: {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 20,
},
  optionActive: { borderColor: '#F27024', backgroundColor: '#FFF0E5' },
  optionTextBlock: { flex: 1, marginLeft: 14 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  optionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});