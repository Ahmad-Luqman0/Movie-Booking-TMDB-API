import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
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
import { generateInitialSeats } from '../data/mockData';
import { InteractiveSeatMap } from '../components/InteractiveSeatMap';
import { RootStackParamList, Seat } from '../types';
import { COLORS, FONTS } from '../constants/theme';

type SeatSelectionRouteProp = RouteProp<RootStackParamList, 'SeatSelection'>;

/**
 * SeatSelectionScreen
 * 
 * Interactive cinema seat selection screen matching Figma Screen 07.
 * Allows the user to pan/zoom a 10-row theater map, select/deselect seats,
 * view price breakdowns, and confirm ticket bookings.
 */
export const SeatSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SeatSelectionRouteProp>();
  // Retrieve selected movie, date, and hall passed from CinemaDateScreen
  const { movie, date, hall } = route.params;

  // Initialize seat grid (10 rows: left, center, right sections + VIP tier on row 10)
  const [seats, setSeats] = useState<Seat[]>(generateInitialSeats());
  // Controls visibility of booking confirmation success modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  /**
   * Filters all currently selected seats from the grid state.
   */
  const selectedSeats = useMemo(() => {
    return seats.filter((s) => s.status === 'selected');
  }, [seats]);

  /**
   * Computes the total price by summing up the cost of all selected regular & VIP seats.
   */
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSeats]);

  /**
   * Toggles seat status between 'available' and 'selected' when a user taps any seat.
   */
  const handleToggleSeat = (toggledSeat: Seat) => {
    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (s.id === toggledSeat.id) {
          const nextStatus = s.status === 'selected' ? 'available' : 'selected';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  /**
   * Removes a seat from selection when the user taps the 'X' icon on the bottom seat chip.
   */
  const handleRemoveSelectedSeat = (seatId: string) => {
    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (s.id === seatId) {
          return { ...s, status: 'available' };
        }
        return s;
      })
    );
  };

  /**
   * Validates that at least one seat is chosen before opening the payment confirmation modal.
   */
  const handleProceedToPay = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No Seats Selected', 'Please select at least one seat to proceed.');
      return;
    }
    setShowConfirmation(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.sessionSubtitle}>
            {date.fullDate} | {hall.time} {hall.hallName}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Interactive Cinema Seating Grid */}
        <InteractiveSeatMap seats={seats} onToggleSeat={handleToggleSeat} />

        {/* Legend Section matching Figma */}
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: COLORS.seat.selected }]} />
              <Text style={styles.legendLabel}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: COLORS.seat.notAvailable }]} />
              <Text style={styles.legendLabel}>Not available</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: COLORS.seat.vip }]} />
              <Text style={styles.legendLabel}>VIP (150$)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: COLORS.seat.regular }]} />
              <Text style={styles.legendLabel}>Regular (50 $)</Text>
            </View>
          </View>
        </View>

        {/* Selected Seat Badges (e.g. "4 / 3 row ✕") */}
        <View style={styles.selectedBadgesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {selectedSeats.map((s) => (
              <View key={s.id} style={styles.seatChip}>
                <Text style={styles.seatChipBold}>{s.number} / </Text>
                <Text style={styles.seatChipNormal}>{s.row} row</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSelectedSeat(s.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.removeChipButton}
                >
                  <Ionicons name="close" size={14} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Payment Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceCard}>
          <Text style={styles.totalPriceLabel}>Total Price</Text>
          <Text style={styles.totalPriceValue}>$ {totalPrice}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleProceedToPay}
          style={styles.proceedButton}
        >
          <Text style={styles.proceedButtonText}>Proceed to pay</Text>
        </TouchableOpacity>
      </View>

      {/* Order Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSub}>
              {movie.title} • {date.fullDate} at {hall.time}
            </Text>

            <View style={styles.ticketSummaryBox}>
              <View style={styles.ticketSummaryRow}>
                <Text style={styles.summaryRowLabel}>Hall</Text>
                <Text style={styles.summaryRowValue}>{hall.hallName}</Text>
              </View>
              <View style={styles.ticketSummaryRow}>
                <Text style={styles.summaryRowLabel}>Seats</Text>
                <Text style={styles.summaryRowValue}>
                  {selectedSeats.map((s) => `R${s.row}:S${s.number}`).join(', ')}
                </Text>
              </View>
              <View style={styles.ticketSummaryRow}>
                <Text style={styles.summaryRowLabel}>Total Paid</Text>
                <Text style={styles.summaryRowPrice}>${totalPrice}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneButton}
              activeOpacity={0.88}
              onPress={() => {
                setShowConfirmation(false);
                navigation.navigate('MainTabs');
              }}
            >
              <Text style={styles.modalDoneButtonText}>Back to Movies</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginRight: 40,
  },
  movieTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  sessionSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.primaryBlue,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  legendContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedBadgesContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  chipsScroll: {
    gap: 10,
  },
  seatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 166, 166, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  seatChipBold: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  seatChipNormal: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  removeChipButton: {
    padding: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F4',
    gap: 12,
  },
  priceCard: {
    width: 108,
    height: 50,
    backgroundColor: 'rgba(166, 166, 166, 0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  totalPriceLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  totalPriceValue: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  proceedButton: {
    flex: 1,
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
  proceedButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.genres.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  successSub: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  ticketSummaryBox: {
    width: '100%',
    backgroundColor: COLORS.canvasLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryRowValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  summaryRowPrice: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primaryBlue,
  },
  modalDoneButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
