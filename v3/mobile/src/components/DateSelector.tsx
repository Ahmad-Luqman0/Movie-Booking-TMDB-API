import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CinemaDate } from '../types';
import { COLORS, FONTS } from '../constants/theme';

interface DateSelectorProps {
  dates: CinemaDate[];
  selectedDate: CinemaDate;
  onSelectDate: (date: CinemaDate) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date) => {
          const isSelected = date.id === selectedDate.id;
          return (
            <TouchableOpacity
              key={date.id}
              activeOpacity={0.8}
              onPress={() => onSelectDate(date)}
              style={[
                styles.datePill,
                isSelected ? styles.datePillActive : styles.datePillInactive,
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  isSelected ? styles.dateTextActive : styles.dateTextInactive,
                ]}
              >
                {date.dayNumber} {date.month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillInactive: {
    backgroundColor: 'rgba(166, 166, 166, 0.12)',
  },
  datePillActive: {
    backgroundColor: COLORS.primaryBlue,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  dateText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  dateTextInactive: {
    color: COLORS.textPrimary,
  },
  dateTextActive: {
    color: COLORS.textLight,
  },
});
