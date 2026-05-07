import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function OrangeHeader({ title, subtitle, showBack = true }: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {/* replace missing van image with a placeholder icon */}
      <Ionicons name="car-outline" size={48} color="#FFFFFF" style={styles.vanIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F27024',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  headerRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  textBlock: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 11, color: '#FFDDC2', marginTop: 4, lineHeight: 14 },
  vanIcon: { marginLeft: 12 },
});