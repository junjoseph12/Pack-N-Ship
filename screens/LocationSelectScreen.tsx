import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import OrangeHeader from './OrangeHeader';
import { useSchedule } from './ScheduleContext';

export default function LocationSelectScreen({ route, navigation }: any) {
  const { type, initialCoords } = route.params; // 'pickup' or 'dropoff'
  const { state, dispatch } = useSchedule();

  const [region, setRegion] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoord, setMarkerCoord] = useState({
    latitude: region.latitude,
    longitude: region.longitude,
  });
  const [address, setAddress] = useState<string>('');

  const reverseGeocode = async (coords: { latitude: number; longitude: number }) => {
    try {
      const [addr] = await Location.reverseGeocodeAsync(coords);
      if (addr) {
        const parts = [addr.street, addr.city, addr.region].filter(Boolean).join(', ');
        setAddress(parts || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (type === 'dropoff' && initialCoords) {
      setRegion(prev => ({ ...prev, ...initialCoords }));
      setMarkerCoord(initialCoords);
      reverseGeocode(initialCoords);
      return;
    }

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is needed to select an address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const newCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setRegion(prev => ({ ...prev, ...newCoords }));
      setMarkerCoord(newCoords);
      reverseGeocode(newCoords);
    })();
  }, [type, initialCoords]);

  const confirmLocation = () => {
    const locationInfo = { address, latitude: markerCoord.latitude, longitude: markerCoord.longitude };
    if (type === 'pickup') {
      dispatch({ type: 'SET_PICKUP_LOCATION', payload: locationInfo });
      navigation.navigate('DropoffLocation', {
        type: 'dropoff',
        initialCoords: markerCoord,
      });
    } else {
      dispatch({ type: 'SET_DROPOFF_LOCATION', payload: locationInfo });
      const cost = Math.floor(Math.random() * 30) + 20;
      dispatch({ type: 'SET_ESTIMATED_COST', payload: cost });
      navigation.navigate('Booking');
    }
  };

  const nextLabel = type === 'pickup' ? 'Confirm Pickup' : 'Next: Review';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title={`${type === 'pickup' ? 'Pickup' : 'Drop-off'} Location`} />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={type === 'pickup' ? 'Current Location' : 'Where to Drop-off?'}
          placeholderTextColor="#9CA3AF"
          value={address}
          editable={false}
        />
      </View>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={(e) => {
            const coord = e.nativeEvent.coordinate;
            setMarkerCoord(coord);
            reverseGeocode(coord);
          }}
        >
          <Marker
            draggable
            coordinate={markerCoord}
            onDragEnd={(e) => {
              setMarkerCoord(e.nativeEvent.coordinate);
              reverseGeocode(e.nativeEvent.coordinate);
            }}
            pinColor={type === 'pickup' ? '#3B82F6' : '#EF4444'}
          />
        </MapView>
      </View>
      <View style={styles.bottomSheet}>
        <Text style={styles.addressText}>{address || 'Move the pin to select location'}</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={confirmLocation}>
          <Text style={styles.confirmBtnText}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F27024',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  bottomSheet: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  addressText: { fontSize: 14, color: '#111827', marginBottom: 12 },
  confirmBtn: {
    backgroundColor: '#111827',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});