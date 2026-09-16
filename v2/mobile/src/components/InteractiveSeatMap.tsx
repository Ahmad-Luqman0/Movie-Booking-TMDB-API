import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Seat } from '../types';
import { COLORS, FONTS } from '../constants/theme';

interface InteractiveSeatMapProps {
  seats: Seat[];
  onToggleSeat: (seat: Seat) => void;
}

export const InteractiveSeatMap: React.FC<InteractiveSeatMapProps> = ({
  seats,
  onToggleSeat,
}) => {
  const [scale, setScale] = useState(1.0);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 1.45));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.85));
  };

  // Group seats by row
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);


  
  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'selected') return COLORS.seat.selected;
    if (seat.status === 'reserved') return COLORS.seat.notAvailable;
    if (seat.tier === 'vip') return COLORS.seat.vip;
    return COLORS.seat.regular;
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Cinema Hall Viewport */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollViewport}
      >
        <View style={[styles.seatMapScaleWrapper, { transform: [{ scale }] }]}>
          {/* Cinema Screen Curve */}
          <View style={styles.screenWrapper}>
            <Svg height="26" width="340" viewBox="0 0 340 26">
              <Path
                d="M 10 22 Q 170 2 330 22"
                fill="transparent"
                stroke={COLORS.primaryBlue}
                strokeWidth="2"
              />
            </Svg>
            <Text style={styles.screenLabel}>SCREEN</Text>
          </View>

          {/* Rows Grid */}
          <View style={styles.gridContainer}>
            {rows.map((rowNum) => {
              const rowSeats = seats.filter((s) => s.row === rowNum);
              const leftSeats = rowSeats.filter((s) => s.section === 'left');
              const centerSeats = rowSeats.filter((s) => s.section === 'center');
              const rightSeats = rowSeats.filter((s) => s.section === 'right');

              return (
                <View key={`row-${rowNum}`} style={styles.row}>
                  {/* Row Number Label */}
                  <View style={styles.rowNumberContainer}>
                    <Text style={styles.rowNumber}>{rowNum}</Text>
                  </View>

                  {/* Left Section (4 seats) */}
                  <View style={styles.sectionBlock}>
                    {leftSeats.map((seat) => (
                      <TouchableOpacity
                        key={seat.id}
                        activeOpacity={0.7}
                        disabled={seat.status === 'reserved'}
                        onPress={() => onToggleSeat(seat)}
                        style={[
                          styles.seat,
                          { backgroundColor: getSeatColor(seat) },
                          seat.status === 'selected' && styles.selectedGlow,
                        ]}
                      />
                    ))}
                  </View>

                  {/* Center Section (12 seats) */}
                  <View style={[styles.sectionBlock, styles.centerSection]}>
                    {centerSeats.map((seat) => (
                      <TouchableOpacity
                        key={seat.id}
                        activeOpacity={0.7}
                        disabled={seat.status === 'reserved'}
                        onPress={() => onToggleSeat(seat)}
                        style={[
                          styles.seat,
                          { backgroundColor: getSeatColor(seat) },
                          seat.status === 'selected' && styles.selectedGlow,
                        ]}
                      />
                    ))}
                  </View>

                  {/* Right Section (4 seats) */}
                  <View style={styles.sectionBlock}>
                    {rightSeats.map((seat) => (
                      <TouchableOpacity
                        key={seat.id}
                        activeOpacity={0.7}
                        disabled={seat.status === 'reserved'}
                        onPress={() => onToggleSeat(seat)}
                        style={[
                          styles.seat,
                          { backgroundColor: getSeatColor(seat) },
                          seat.status === 'selected' && styles.selectedGlow,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Zoom Controls (+ / -) matching Figma */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleZoomIn}
          style={styles.zoomButton}
        >
          <Ionicons name="add" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleZoomOut}
          style={[styles.zoomButton, { marginLeft: 8 }]}
        >
          <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FC',
    paddingVertical: 10,
    position: 'relative',
    minHeight: 310,
    justifyContent: 'center',
  },
  scrollViewport: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
  },
  seatMapScaleWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  screenWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  screenLabel: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: '#8F9CA9',
    letterSpacing: 2,
    marginTop: 2,
  },
  gridContainer: {
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowNumberContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowNumber: {
    fontFamily: FONTS.semiBold,
    fontSize: 8.5,
    color: '#8F9CA9',
  },
  sectionBlock: {
    flexDirection: 'row',
    gap: 4,
  },
  centerSection: {
    marginHorizontal: 12,
  },
  seat: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  selectedGlow: {
    transform: [{ scale: 1.25 }],
    shadowColor: COLORS.seat.selected,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});
