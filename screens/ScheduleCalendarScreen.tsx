import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OrangeHeader from './OrangeHeader';
import { useSchedule } from './ScheduleContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ScheduleCalendarScreen({ navigation }: any) {
  const { state, dispatch } = useSchedule();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<Date | null>(state.scheduledDate);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

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
    dispatch({ type: 'SET_SCHEDULED_DATE', payload: selectedDate! });
    navigation.navigate('PickupLocation', { type: 'pickup' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrangeHeader title="Schedule Delivery" />
      <View style={styles.content}>
        {/* Month/Year Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => setMonth(m => (m === 0 ? 11 : m - 1))}>
            <Ionicons name="chevron-back" size={24} color="#F27024" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={() => setMonth(m => (m === 11 ? 0 : m + 1))}>
            <Ionicons name="chevron-forward" size={24} color="#F27024" />
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={styles.weekRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayCell,
                day && isSelected(day) && styles.selectedDay,
                day && isPastDay(day) && styles.pastDay,
              ]}
              disabled={!day || isPastDay(day)}
              onPress={() => day && handleSelect(day)}
            >
              <Text style={[
                styles.dayText,
                day && isSelected(day) && styles.selectedDayText,
                day && isPastDay(day) && styles.pastDayText,
              ]}>
                {day || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !selectedDate && styles.disabledBtn]}
          disabled={!selectedDate}
          onPress={goNext}
        >
          <Text style={styles.nextBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, flex: 1 },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontWeight: '600', color: '#6B7280', fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: { fontSize: 13, color: '#111827' },
  selectedDay: { backgroundColor: '#111827', borderRadius: 20 },
  selectedDayText: { color: '#FFFFFF' },
  pastDay: { opacity: 0.4 },
  pastDayText: { color: '#9CA3AF' },
  nextBtn: {
    backgroundColor: '#111827',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  disabledBtn: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});