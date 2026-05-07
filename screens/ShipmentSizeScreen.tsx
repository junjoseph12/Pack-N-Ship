import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OrangeHeader from './OrangeHeader';
import { useSchedule } from './ScheduleContext';

const sizeData = [
  { size: 'Small', weight: 'Less than 5kg', icon: 'cube-outline' },
  { size: 'Medium', weight: '5 to 20kg', icon: 'layers-outline' },
  { size: 'Large', weight: 'More than 20kg', icon: 'file-tray-stacked-outline' },
];

export default function ShipmentSizeScreen({ navigation }: any) {
  const { state, dispatch } = useSchedule();

  const addItem = (size: 'Small' | 'Medium' | 'Large') => {
    navigation.navigate('AddItem', { size });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.itemCard}>
      <View style={styles.itemPhotoPlaceholder}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
        ) : (
          <Ionicons name="camera-outline" size={20} color="#9CA3AF" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemSizeLabel}>{item.size} item</Text>
        {item.fragile && <Text style={styles.fragileTag}>Fragile</Text>}
        <Text style={styles.itemDesc}>{item.description}</Text>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title="What's in your shipment?" />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Shipment Size</Text>
        <View style={styles.sizeRow}>
          {sizeData.map((s) => (
            <TouchableOpacity
              key={s.size}
              style={styles.sizeCard}
              onPress={() => addItem(s.size as any)}
            >
              <Ionicons name={s.icon as any} size={28} color="#F27024" />
              <Text style={styles.sizeText}>{s.size}</Text>
              <Text style={styles.sizeWeight}>{s.weight}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Shipment Items ({state.items.length})
        </Text>

        {state.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No items added yet. Tap a size above to add.</Text>
          </View>
        ) : (
          <FlatList
            data={state.items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ maxHeight: 300 }}
          />
        )}

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            state.items.length === 0 && styles.confirmBtnDisabled,
          ]}
          disabled={state.items.length === 0}
          onPress={() => navigation.navigate('ScheduleCalendar')}
        >
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 20, flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  sizeCard: {
    width: '31%',
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  sizeText: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 6 },
  sizeWeight: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: { color: '#6B7280', fontSize: 13 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemPhoto: { width: 40, height: 40, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemSizeLabel: { fontSize: 12, fontWeight: '700', color: '#111827' },
  fragileTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  itemDesc: { fontSize: 11, color: '#6B7280' },
  removeText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  confirmBtn: {
    backgroundColor: '#111827',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  confirmBtnDisabled: { backgroundColor: '#D1D5DB' },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});