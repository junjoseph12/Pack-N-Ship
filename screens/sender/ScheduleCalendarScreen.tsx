import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Modal, ScrollView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSchedule } from './ScheduleContext';

const { width, height } = Dimensions.get('window');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Generate 30-minute interval time slots for the custom picker
const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM'
];

export default function ScheduleCalendarScreen({ navigation }: any) {
  const { state, dispatch } = useSchedule();
  const today = new Date();
  const insets = useSafeAreaInsets();
  
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<Date | null>(state.scheduledDate || today);

  // Initialize time state from global context or default to 10:00 AM
  const initialTime = state.scheduledDate 
    ? state.scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '10:00 AM';
    
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Fill the end of the calendar with next month's days for visual completion if needed
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const trailingDays = totalCells - calendarDays.length;

  const isSelected = (day: number) =>
    selectedDate?.getDate() === day &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getFullYear() === year;

  const isPastDay = (day: number) => {
    const date = new Date(year, month, day);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date < todayStart;
  };

  const handleSelect = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const goNext = () => {
    if (selectedDate && selectedTime) {
      // Parse the custom time string back into the Date object
      const [timeStr, period] = selectedTime.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const finalDate = new Date(selectedDate);
      finalDate.setHours(hours, minutes, 0, 0);

      dispatch({ type: 'SET_SCHEDULED_DATE', payload: finalDate });
      navigation.navigate('PickupLocation', { type: 'pickup' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Orange Header */}
      <View style={[styles.headerBackground, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Delivery</Text>
        </View>
        
        <Text style={styles.headerSubtitle}>
          Your trusted partner in fast, secure, and{'\n'}hassle-free delivery services.
        </Text>

        <Image 
          source={require('../../assets/Car-Grey.png')} 
          style={styles.carImage} 
        />
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          
          {/* Card Title */}
          <View style={styles.cardTitleRow}>
            <Image 
              source={require('../../assets/package-sizes.png')} 
              style={[styles.titleIcon, { tintColor: '#F59E0B' }]} 
            />
            <Text style={styles.cardTitle}>Schedule Delivery</Text>
          </View>

          {/* Calendar Container */}
          <View style={styles.calendarContainer}>
            
            {/* Month/Year Selector */}
            <View style={styles.monthSelectorRow}>
              <TouchableOpacity onPress={() => setMonth(m => (m === 0 ? 11 : m - 1))}>
                <Ionicons name="chevron-back" size={20} color="#111827" />
              </TouchableOpacity>
              
              <View style={styles.dropdownsContainer}>
                <TouchableOpacity style={styles.dropdownBox}>
                  <Text style={styles.dropdownText}>{MONTHS[month]}</Text>
                  <Ionicons name="chevron-down" size={14} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownBox}>
                  <Text style={styles.dropdownText}>{year}</Text>
                  <Ionicons name="chevron-down" size={14} color="#111827" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setMonth(m => (m === 11 ? 0 : m + 1))}>
                <Ionicons name="chevron-forward" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={styles.weekRow}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, idx) => (
                <View key={`day-${idx}`} style={styles.dayCellContainer}>
                  {day != null ? (
                    <TouchableOpacity
                      style={[
                        styles.dayCell,
                        isSelected(day) && styles.selectedDay,
                      ]}
                      disabled={isPastDay(day)}
                      onPress={() => handleSelect(day)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected(day) && styles.selectedDayText,
                        isPastDay(day) && styles.pastDayText,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dayCell} />
                  )}
                </View>
              ))}
              
              {Array.from({ length: trailingDays }).map((_, idx) => (
                <View key={`trail-${idx}`} style={styles.dayCellContainer}>
                  <View style={styles.dayCell}>
                    <Text style={styles.trailingDayText}>{idx + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Actions Row (Now displays selected date/time) */}
          <View style={styles.actionLinksRow}>
            <View style={styles.actionColLeft}>
              <Text style={styles.selectedValText}>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
              </Text>
              <TouchableOpacity>
                <Text style={styles.actionLinkText}>Change Date</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionColRight}>
              <Text style={styles.selectedValText}>{selectedTime}</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(true)}>
                <Text style={styles.actionLinkText}>Change Time</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.nextBtn, (!selectedDate || !selectedTime) && styles.disabledBtn]}
            disabled={!selectedDate || !selectedTime}
            onPress={goNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Next: Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- TIME SELECTION MODAL --- */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowTimeModal(false)} />
          <View style={[styles.timeModalContent, { paddingBottom: insets.bottom + 20 }]}>
            
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>Select Delivery Time</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
              {TIME_SLOTS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, selectedTime === time && styles.timeSlotActive]}
                  onPress={() => {
                    setSelectedTime(time);
                    setShowTimeModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeSlotText, selectedTime === time && styles.timeSlotTextActive]}>
                    {time}
                  </Text>
                  {selectedTime === time && (
                    <Ionicons name="checkmark-circle" size={20} color="#FA7A25" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  headerBackground: {
    backgroundColor: '#FA7A25',
    paddingHorizontal: 15,
    paddingBottom: 80, 
    position: 'relative',
    overflow: 'visible',
    height: 240,
    zIndex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    maxWidth: '70%',
  },
  carImage: {
    position: 'absolute',
    right: -30,
    bottom: 10, 
    width: 240,
    height: 120,
    resizeMode: 'contain',
    zIndex: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30, 
    zIndex: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    flex: 1,
    marginBottom: 20,
  },
  cardTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  titleIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
    resizeMode: 'contain',
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000000' 
  },
  
  // Calendar Container
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dropdownsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    marginRight: 6,
  },
  weekRow: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  weekDay: { 
    flex: 1, 
    textAlign: 'center', 
    fontWeight: '500', 
    color: '#9CA3AF', 
    fontSize: 11 
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  dayCellContainer: {
    width: '14.28%',
    aspectRatio: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayCell: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: { 
    fontSize: 14, 
    color: '#111827',
    fontWeight: '500',
  },
  selectedDay: { 
    backgroundColor: '#111827', 
  },
  selectedDayText: { 
    color: '#FFFFFF' 
  },
  pastDayText: { 
    color: '#D1D5DB' 
  },
  trailingDayText: {
    color: '#D1D5DB',
    fontSize: 14,
  },

  // Action Links (Date & Time Display)
  actionLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 'auto',
  },
  actionColLeft: {
    alignItems: 'flex-start',
  },
  actionColRight: {
    alignItems: 'flex-end',
  },
  selectedValText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  actionLinkText: {
    color: '#FA7A25', // Orange text
    fontSize: 12,
    fontWeight: '600',
  },

  // Next Button
  nextBtn: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: { 
    backgroundColor: '#D1D5DB' 
  },
  nextBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 15 
  },

  // --- Time Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: height * 0.6,
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 6,
  },
  timeScroll: {
    marginBottom: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeSlotActive: {
    backgroundColor: '#FFF8F4',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1, // overrides row styling for active
  },
  timeSlotText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#FA7A25',
    fontWeight: '700',
  },
});