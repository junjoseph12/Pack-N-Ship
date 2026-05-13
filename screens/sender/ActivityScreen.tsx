import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { deleteDelivery } from './scheduleService';

const { width } = Dimensions.get('window');

// Mock data fallback to maintain layout if the database is empty
const MOCK_DELIVERIES = [
  {
    request_id: 'CXV34DA675FAS1',
    pickup_type: 'Curb-side Drop-off',
    date: 'April 25, 2026',
    time: '6:40 PM',
    pickup_main: 'Landers Superstore Cebu',
    pickup_sub: 'Skyrise 4 Tower, Geonzon Street, cor V. Padriga Street, Cebu City',
    dropoff_main: 'Pardo Public Market',
    dropoff_sub: 'Cebu S Rd, Cebu City',
    status: 'Scheduled for Pickup',
    status_time: 'Today, 6:40 PM',
    provider_name: 'Moises Padriga',
    price: '30.00',
    coords: {
      pickup: { latitude: 10.3289, longitude: 123.9061 },
      dropoff: { latitude: 10.2833, longitude: 123.8605 }
    },
    isMock: true,
  },
  {
    request_id: 'CXV34DA675FAS2',
    pickup_type: 'Door-to-Door Drop-off',
    date: 'April 25, 2026',
    time: '6:20 PM',
    pickup_main: 'Landers Superstore Cebu',
    pickup_sub: 'Skyrise 4 Tower, Geonzon Street, cor V. Padriga Street, Cebu City',
    dropoff_main: 'Naga Rikyo',
    dropoff_sub: 'Cebu South Road, Barangay Inoburan, City of Naga',
    status: 'Booking Confirm',
    status_time: 'Today, 6:30 PM',
    provider_name: 'Jonel Jumawan',
    price: '45.00',
    coords: {
      pickup: { latitude: 10.3289, longitude: 123.9061 },
      dropoff: { latitude: 10.2081, longitude: 123.7570 }
    },
    isMock: true,
  }
];

export default function ActivityScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<any[]>(MOCK_DELIVERIES);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // New search state
  const insets = useSafeAreaInsets();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDeliveries(MOCK_DELIVERIES);
        setIsLoading(false);
        return;
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (!userRecord) {
        setDeliveries(MOCK_DELIVERIES);
        setIsLoading(false);
        return;
      }

      // Fetch Real Data with Full Joins
      const { data: active } = await supabase
        .from('delivery_requests')
        .select(`
          request_id, pickup_type, delivery_status, scheduled_time, estimated_cost, created_at,
          cargo_profiles ( cargo_id, cargo_pic, description, small_box_qty, medium_box_qty, large_box_qty, is_fragile ),
          pickup_location:locations!delivery_requests_pickup_location_id_fkey ( location_id, street_address, latitude, longitude ),
          dropoff_location:locations!delivery_requests_dropoff_location_id_fkey ( location_id, street_address, latitude, longitude )
        `)
        .eq('sender_id', userRecord.user_id)
        .in('delivery_status', ['Accepted', 'Pending', 'Finding Provider'])
        .order('created_at', { ascending: false });

      if (active && active.length > 0) {
        // Map Database Structure to the Visual UI Structure
        const mappedDeliveries = active.map((item: any) => {
          const scheduleDate = item.scheduled_time ? new Date(item.scheduled_time) : new Date(item.created_at);
          
          const parseAddr = (full: string) => {
            if (!full) return { main: 'Selected Location', sub: '' };
            const parts = full.split(', ');
            return { main: parts[0], sub: parts.slice(1).join(', ') || full };
          };

          const pickup = parseAddr(item.pickup_location?.street_address);
          const dropoff = parseAddr(item.dropoff_location?.street_address);

          return {
            request_id: item.request_id,
            pickup_type: item.pickup_type,
            date: scheduleDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: scheduleDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            pickup_main: pickup.main,
            pickup_sub: pickup.sub,
            dropoff_main: dropoff.main,
            dropoff_sub: dropoff.sub,
            status: item.delivery_status === 'Pending' ? 'Waiting for Provider' : item.delivery_status,
            status_time: 'Recently updated',
            provider_name: item.provider?.name || 'Assigning...',
            price: item.estimated_cost?.toFixed(2) || '0.00',
            coords: {
              pickup: { latitude: item.pickup_location?.latitude || 10.3157, longitude: item.pickup_location?.longitude || 123.8854 },
              dropoff: { latitude: item.dropoff_location?.latitude || 10.3157, longitude: item.dropoff_location?.longitude || 123.8854 }
            },
            rawData: item // Stored for edit/delete functions
          };
        });
        setDeliveries(mappedDeliveries);
      } else {
        setDeliveries(MOCK_DELIVERIES);
      }
    } catch (error) {
      console.error(error);
      setDeliveries(MOCK_DELIVERIES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, []);

  // --- Functionalities from DeliveryListScreen ---
  const handleEdit = (rawData: any) => {
    if (!rawData) {
      Alert.alert('Notice', 'Cannot edit mock data.');
      return;
    }
    setSelectedDelivery(null);
    navigation.navigate('ScheduleDelivery', {
      editData: rawData,
      mode: rawData.scheduled_time ? 'schedule' : 'sendNow',
    });
  };

  const handleDelete = (rawData: any) => {
    if (!rawData) {
      Alert.alert('Notice', 'Cannot delete mock data.');
      return;
    }
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel and delete this delivery?',
      [
        { text: 'Keep Delivery', style: 'cancel' },
        {
          text: 'Yes, Cancel it', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDelivery(
                rawData.request_id,
                rawData.cargo_profiles?.cargo_id,
                rawData.pickup_location?.location_id,
                rawData.dropoff_location?.location_id
              );
              setSelectedDelivery(null);
              fetchData(); 
            } catch (error: any) {
              Alert.alert('Delete Failed', error.message || 'Could not delete delivery.');
            }
          },
        },
      ]
    );
  };

  // --- Search Filtering Logic ---
  const filteredDeliveries = deliveries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    // Check location strings
    const matchPickup = (item.pickup_main + " " + item.pickup_sub).toLowerCase().includes(query);
    const matchDropoff = (item.dropoff_main + " " + item.dropoff_sub).toLowerCase().includes(query);
    
    // Check ID or Provider Name
    const matchId = String(item.request_id).toLowerCase().includes(query);
    const matchProvider = String(item.provider_name).toLowerCase().includes(query);
    
    // Check Package Description (if real data exists)
    const matchPackage = item.rawData?.cargo_profiles?.description?.toLowerCase().includes(query) || false;

    return matchPickup || matchDropoff || matchId || matchProvider || matchPackage;
  });

  // --- Render Functions ---

  const renderListView = () => (
    <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Active Delivery</Text>

      {/* Search Bar (Mirrors ExploreScreen style) */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by location, package, ID..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#F27024" style={{ marginTop: 50 }} />
      ) : filteredDeliveries.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No deliveries found matching</Text>
          <Text style={styles.noResultsQuery}>"{searchQuery}"</Text>
        </View>
      ) : (
        filteredDeliveries.map((item, index) => (
          <TouchableOpacity 
            key={item.request_id || index} 
            style={styles.card}
            onPress={() => setSelectedDelivery(item)}
            activeOpacity={0.9}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardLeftCol}>
                <Text style={styles.dropType}>{item.pickup_type}</Text>
                <Text style={styles.dateTime}>
                  <Text style={styles.bold}>{item.date}</Text>   {item.time}
                </Text>

                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <View style={styles.iconWrapper}>
                      <View style={styles.blueDot}><View style={styles.blueDotInner} /></View>
                    </View>
                    <View style={styles.addressWrapper}>
                      <Text style={styles.addressMain}>{item.pickup_main}</Text>
                      <Text style={styles.addressSub} numberOfLines={2}>{item.pickup_sub}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.connectingLine} />

                  <View style={[styles.timelineItem, { marginTop: 16 }]}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="location" size={18} color="#E11D48" />
                    </View>
                    <View style={styles.addressWrapper}>
                      <Text style={styles.addressMain}>{item.dropoff_main}</Text>
                      <Text style={styles.addressSub} numberOfLines={2}>{item.dropoff_sub}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardRightCol}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color="#FFF" />
                </View>
                <Text style={styles.providerName} numberOfLines={1}>{item.provider_name}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.circleBtn}><Ionicons name="call" size={14} color="#000" /></TouchableOpacity>
                  <TouchableOpacity style={styles.circleBtn}><Ionicons name="chatbubbles" size={14} color="#000" /></TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottomRow}>
              <View style={styles.statusWrapper}>
                <View style={[styles.greenDot, item.status === 'Waiting for Provider' && { backgroundColor: '#F59E0B' }]} />
                <View>
                  <Text style={styles.statusText}>{item.status}</Text>
                  <Text style={styles.statusTime}>{item.status_time}</Text>
                </View>
              </View>
              <Text style={styles.priceText}>₱{item.price}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderDetailView = () => (
    <ScrollView contentContainerStyle={styles.detailContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setSelectedDelivery(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.titleRow}>
        <Text style={styles.pageTitleDetail}>Active Delivery</Text>
        <Text style={styles.trackingId}>{selectedDelivery.request_id}</Text>
      </View>

      <TouchableOpacity 
        style={styles.detailMapCard} 
        activeOpacity={0.8}
        onPress={() => setShowFullMap(true)}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (selectedDelivery.coords.pickup.latitude + selectedDelivery.coords.dropoff.latitude) / 2,
              longitude: (selectedDelivery.coords.pickup.longitude + selectedDelivery.coords.dropoff.longitude) / 2,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={selectedDelivery.coords.pickup}>
              <View style={styles.blueDot}><View style={styles.blueDotInner} /></View>
            </Marker>
            <Marker coordinate={selectedDelivery.coords.dropoff}>
              <Ionicons name="location" size={24} color="#E11D48" />
            </Marker>
            <Polyline
              coordinates={[selectedDelivery.coords.pickup, selectedDelivery.coords.dropoff]}
              strokeColor="#0000CC"
              strokeWidth={4}
            />
          </MapView>
        </View>
        
        <View style={styles.mapOverlayPill}>
          <Ionicons name="bicycle" size={14} color="#FA7A25" />
          <Text style={styles.overlayPillText}>7 min{'\n'}2.9 km</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.packageStatusHeader}>
        <Text style={styles.packageStatusTitle}>Package Status</Text>
        <TouchableOpacity onPress={() => setShowFullMap(true)}>
          <Text style={styles.viewPackageText}>View Package</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusTimeline}>
        <View style={styles.statusStep}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#D1D5DB" />
            <View style={styles.statusLine} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusStepTitle}>Waiting For Provider Match</Text>
            <Text style={styles.statusStepTime}>Confirmed</Text>
          </View>
        </View>

        <View style={styles.statusStep}>
          <View style={styles.statusIconContainer}>
            <View style={[styles.greenDot, { width: 20, height: 20, borderRadius: 10 }]} />
            <View style={styles.statusLine} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusStepTitle, { color: '#000' }]}>{selectedDelivery.status}</Text>
            <Text style={styles.statusStepTime}>{selectedDelivery.status_time}</Text>
          </View>
        </View>

        <View style={styles.statusStep}>
          <View style={styles.statusIconContainer}>
            <View style={styles.pendingDot} />
            <View style={styles.statusLine} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.pendingStepTitle}>Item Collected (QR Verified)</Text>
            <Text style={styles.pendingStepTime}>Awaiting Pickup</Text>
          </View>
        </View>

        <View style={styles.statusStep}>
          <View style={styles.statusIconContainer}>
            <View style={styles.pendingDot} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.pendingStepTitle}>Delivered Successfully</Text>
            <Text style={styles.pendingStepTime}>Awaiting Pickup</Text>
          </View>
        </View>
      </View>

      {!selectedDelivery.isMock && (
        <View style={styles.detailActionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(selectedDelivery.rawData)}>
            <Ionicons name="create-outline" size={16} color="#FFF" />
            <Text style={styles.editBtnText}>Edit Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedDelivery.rawData)}>
            <Ionicons name="close-circle-outline" size={16} color="#FFF" />
            <Text style={styles.deleteBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderFullMapView = () => (
    <View style={styles.fullMapContainer}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: (selectedDelivery.coords.pickup.latitude + selectedDelivery.coords.dropoff.latitude) / 2,
          longitude: (selectedDelivery.coords.pickup.longitude + selectedDelivery.coords.dropoff.longitude) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={selectedDelivery.coords.pickup}>
          <View style={[styles.blueDot, { width: 16, height: 16, borderRadius: 8 }]}>
            <View style={[styles.blueDotInner, { width: 6, height: 6, borderRadius: 3 }]} />
          </View>
        </Marker>
        <Marker coordinate={selectedDelivery.coords.dropoff}>
          <Ionicons name="location" size={28} color="#E11D48" />
        </Marker>
        <Polyline
          coordinates={[selectedDelivery.coords.pickup, selectedDelivery.coords.dropoff]}
          strokeColor="#0000CC"
          strokeWidth={4}
        />
      </MapView>

      <View style={[styles.topOverlay, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backCircleBtn} onPress={() => setShowFullMap(false)}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetCardMatched}>
          <Text style={styles.matchedDropType}>{selectedDelivery.pickup_type}</Text>
          
          <View style={styles.matchedInnerCard}>
            <View style={styles.matchedRow}>
              <View style={styles.matchedLeftCol}>
                <View style={styles.matchedAvatarBox}>
                  <View style={styles.matchedAvatarCircle}>
                    <Ionicons name="person" size={32} color="#C2410C" />
                  </View>
                  <View style={styles.matchedAvatarLines}>
                      <View style={styles.placeholderLine} />
                      <View style={styles.placeholderLineShort} />
                  </View>
                </View>
                <View style={styles.qrCodeBox}>
                    <Ionicons name="qr-code-outline" size={60} color="#000" />
                </View>
              </View>

              <View style={styles.matchedRightCol}>
                <Text style={styles.matchedName}>{selectedDelivery.provider_name}</Text>
                
                <View style={styles.carDetailRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.carText}>Car: Honda Civic RS Turbo</Text>
                    <Text style={styles.carText}>Color: Sonic Gray Pearl</Text>
                    <Text style={styles.carText}>Plate Number: NDA-1234</Text>
                  </View>
                  <View style={styles.contactIcons}>
                    <View style={styles.contactIconCircle}><Ionicons name="chatbubbles" size={14} color="#000" /></View>
                    <View style={styles.contactIconCircle}><Ionicons name="call" size={14} color="#000" /></View>
                  </View>
                </View>

                <View style={styles.timelineSmall}>
                  <View style={styles.timelinePointSmall}>
                    <View style={[styles.blueDot, { width: 12, height: 12, marginRight: 6 }]}><View style={[styles.blueDotInner, { width: 4, height: 4 }]} /></View>
                    <View style={{flex: 1}}>
                      <Text style={styles.timelineMainTextSmall}>{selectedDelivery.pickup_main}</Text>
                      <Text style={styles.timelineSubTextSmall} numberOfLines={1}>{selectedDelivery.pickup_sub}</Text>
                    </View>
                  </View>
                  <View style={styles.timelineLineSmall} />
                  <View style={styles.timelinePointSmall}>
                    <Ionicons name="location" size={14} color="#E11D48" style={{ marginRight: 5, marginLeft: -1 }} />
                    <View style={{flex: 1}}>
                      <Text style={styles.timelineMainTextSmall}>{selectedDelivery.dropoff_main}</Text>
                      <Text style={styles.timelineSubTextSmall} numberOfLines={1}>{selectedDelivery.dropoff_sub}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.scheduledForText}>Scheduled for:</Text>
                <Text style={styles.scheduledTimeText}>{selectedDelivery.date}  {selectedDelivery.time}</Text>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₱{selectedDelivery.price}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={showFullMap ? [] : ['top']}>
      {showFullMap && selectedDelivery 
        ? renderFullMapView() 
        : selectedDelivery 
          ? renderDetailView() 
          : renderListView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  // --- Shared Styles ---
  blueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#0000CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0000CC',
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },

  // --- List View Styles ---
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 10,
  },
  pageTitle: { 
    fontSize: 30, 
    fontWeight: '700', 
    color: '#000', 
    marginBottom: 20 
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1, 
    fontSize: 14,
    color: '#000'
  },
  noResultsContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  noResultsQuery: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    top: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeftCol: { flex: 1, paddingRight: 10 },
  dropType: { fontSize: 10, color: '#6B7280', marginBottom: 4 },
  dateTime: { fontSize: 13, color: '#000', marginBottom: 16 },
  bold: { fontWeight: '700' },
  timeline: { position: 'relative' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrapper: { width: 20, alignItems: 'center', marginRight: 8, marginTop: 2 },
  connectingLine: { position: 'absolute', left: 9, top: 18, width: 1, height: 28, backgroundColor: '#D1D5DB' },
  addressWrapper: { flex: 1 },
  addressMain: { fontSize: 11, fontWeight: '600', color: '#000', marginBottom: 2 },
  addressSub: { fontSize: 9, color: '#6B7280', lineHeight: 12 },
  cardRightCol: { width: 90, alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D97706', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  providerName: { fontSize: 11, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', width: 60 },
  circleBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 16, marginBottom: 12 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusWrapper: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#000' },
  statusTime: { fontSize: 9, color: '#6B7280' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#000' },

  // --- Detail View Styles ---
  detailContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  detailHeader: { marginBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  pageTitleDetail: { fontSize: 22, fontWeight: '700', color: '#000' },
  trackingId: { fontSize: 12, color: '#4B5563', marginBottom: 4 },
  detailMapCard: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB' },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlayPill: { position: 'absolute', bottom: 16, left: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 6, flexDirection: 'row', alignItems: 'center' },
  overlayPillText: { fontSize: 9, fontWeight: '600', color: '#000', marginLeft: 6 },
  packageStatusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  packageStatusTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  viewPackageText: { fontSize: 13, color: '#FA7A25', fontWeight: '600', marginBottom: 2 },
  statusTimeline: { paddingLeft: 4 },
  statusStep: { flexDirection: 'row', marginBottom: 0 },
  statusIconContainer: { width: 30, alignItems: 'center', marginRight: 12 },
  statusLine: { width: 1, height: 30, backgroundColor: '#D1D5DB', marginVertical: 4 },
  statusTextContainer: { flex: 1, paddingBottom: 24 },
  statusStepTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 2 },
  statusStepTime: { fontSize: 10, color: '#6B7280' },
  pendingDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F3F4F6' },
  pendingStepTitle: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 2 },
  pendingStepTime: { fontSize: 10, color: '#D1D5DB' },

  detailActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  editBtn: {
    backgroundColor: '#FA7A25',
    paddingVertical: 14,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },

  // --- Full Map View Styles ---
  fullMapContainer: { flex: 1 },
  topOverlay: { position: 'absolute', left: 20, zIndex: 10 },
  backCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  sheetCardMatched: { width: '100%', backgroundColor: '#FFF', padding: 20, bottom: -20},
  matchedDropType: { fontSize: 11, color: '#000', marginBottom: 12 },
  matchedInnerCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16 },
  matchedRow: { flexDirection: 'row' },
  matchedLeftCol: { width: '35%', alignItems: 'center', marginRight: 16 },
  matchedAvatarBox: { width: '100%', backgroundColor: '#FDBA74', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10 },
  matchedAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  matchedAvatarLines: { width: '100%', alignItems: 'center' },
  placeholderLine: { width: '80%', height: 4, backgroundColor: '#FFF', borderRadius: 2, marginBottom: 4 },
  placeholderLineShort: { width: '50%', height: 4, backgroundColor: '#FFF', borderRadius: 2 },
  qrCodeBox: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  matchedRightCol: { flex: 1 },
  matchedName: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 4 },
  carDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  carText: { fontSize: 8, color: '#000', marginBottom: 2 },
  contactIcons: { justifyContent: 'space-around' },
  contactIconCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  timelineSmall: { marginBottom: 12 },
  timelinePointSmall: { flexDirection: 'row', alignItems: 'center' },
  timelineLineSmall: { width: 1, height: 16, backgroundColor: '#D1D5DB', marginLeft: 5, marginVertical: 2 },
  timelineMainTextSmall: { fontSize: 9, fontWeight: '500', color: '#000' },
  timelineSubTextSmall: { fontSize: 7, color: '#6B7280' },
  scheduledForText: { fontSize: 10, fontWeight: '600', color: '#000', marginBottom: 2 },
  scheduledTimeText: { fontSize: 10, color: '#000', marginBottom: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: '#000' },
  totalValue: { fontSize: 13, fontWeight: '700', color: '#000' },
});