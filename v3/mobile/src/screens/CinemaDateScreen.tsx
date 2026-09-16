import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CINEMA_HALLS, DATES } from '../data/mockData';
import { DateSelector } from '../components/DateSelector';
import { HallCard } from '../components/HallCard';
import { CinemaDate, CinemaHall, RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants/theme';

type CinemaDateRouteProp = RouteProp<RootStackParamList, 'CinemaDate'>;

/**
 * CinemaDateScreen
 * 
 * Lets the user pick a show date and cinema hall/timeslot for a selected movie
 * before proceeding to the seat selection screen.
 */
export const CinemaDateScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CinemaDateRouteProp>();
  // Receive movie details passed from previous screen (MovieDetailScreen)
  const { movie } = route.params;

  // Track the date selected by user (defaults to first available date)
  const [selectedDate, setSelectedDate] = useState<CinemaDate>(DATES[0]);
  // Track the cinema hall and time slot selected by user (defaults to first hall)
  const [selectedHall, setSelectedHall] = useState<CinemaHall>(CINEMA_HALLS[0]);

  /**
   * Navigates to the SeatSelection screen with the chosen movie, date, and hall details.
   */
  const handleSelectSeats = () => {
    navigation.navigate('SeatSelection', {
      movie,
      date: selectedDate,
      hall: selectedHall,
    });
  };

  /**
   * Goes back to the previous screen when the user taps the back arrow.
   */
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top navigation bar showing movie title and release date */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.releaseDateText}>{movie.formattedDate}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Horizontal date selector component */}
        <DateSelector
          dates={DATES}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Horizontal scroll list of cinema halls, seating mini-maps & prices */}
        <View style={styles.hallsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hallsScrollContent}
          >
            {CINEMA_HALLS.map((hall) => (
              <HallCard
                key={hall.id}
                hall={hall}
                isSelected={hall.id === selectedHall.id}
                onSelect={() => setSelectedHall(hall)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Fixed bottom action button to proceed to seat selection */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSelectSeats}
          style={styles.selectSeatsButton}
        >
          <Text style={styles.selectSeatsText}>Select Seats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F4',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // balance back button width
  },
  movieTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  releaseDateText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.primaryBlue,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hallsSection: {
    marginTop: 20,
  },
  hallsScrollContent: {
    paddingHorizontal: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F4',
  },
  selectSeatsButton: {
    height: 50,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  selectSeatsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
