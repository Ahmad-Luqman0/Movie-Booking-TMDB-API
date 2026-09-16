import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CinemaHall } from '../types';
import { COLORS, FONTS } from '../constants/theme';

interface HallCardProps {
  hall: CinemaHall;
  isSelected: boolean;
  onSelect: () => void;
}

export const HallCard: React.FC<HallCardProps> = ({ hall, isSelected, onSelect }) => {
  // Renders a mini preview seating grid matching the design
  const renderMiniGrid = () => {
    const rows = 8;
    const colsLeft = 3;
    const colsCenter = 10;
    const colsRight = 3;

    return (
      <View style={styles.miniMap}>
        {/* Screen curve */}
        <Svg height="14" width="180" viewBox="0 0 180 14" style={styles.screenCurve}>
          <Path
            d="M 10 12 Q 90 2 170 12"
            fill="transparent"
            stroke={COLORS.primaryBlue}
            strokeWidth="1.5"
          />
        </Svg>

        {/* Seat rows */}
        <View style={styles.rowsContainer}>
          {Array.from({ length: rows }).map((_, rIdx) => {
            const isVipRow = rIdx === rows - 1;
            return (
              <View key={`row-${rIdx}`} style={styles.miniRow}>
                {/* Left block */}
                <View style={styles.miniBlock}>
                  {Array.from({ length: colsLeft }).map((_, cIdx) => (
                    <View
                      key={`l-${rIdx}-${cIdx}`}
                      style={[
                        styles.miniDot,
                        {
                          backgroundColor:
                            (rIdx + cIdx) % 3 === 0
                              ? COLORS.seat.notAvailable
                              : isVipRow
                              ? COLORS.seat.vip
                              : COLORS.seat.regular,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Center block */}
                <View style={[styles.miniBlock, styles.centerBlock]}>
                  {Array.from({ length: colsCenter }).map((_, cIdx) => {
                    let color = isVipRow ? COLORS.seat.vip : COLORS.seat.regular;
                    if ((rIdx === 2 && cIdx === 4) || (rIdx === 3 && cIdx === 8)) {
                      color = COLORS.genres.thriller;
                    } else if ((rIdx + cIdx) % 4 === 0) {
                      color = COLORS.seat.notAvailable;
                    }
                    return (
                      <View
                        key={`c-${rIdx}-${cIdx}`}
                        style={[styles.miniDot, { backgroundColor: color }]}
                      />
                    );
                  })}
                </View>

                {/* Right block */}
                <View style={styles.miniBlock}>
                  {Array.from({ length: colsRight }).map((_, cIdx) => (
                    <View
                      key={`r-${rIdx}-${cIdx}`}
                      style={[
                        styles.miniDot,
                        {
                          backgroundColor:
                            (rIdx + cIdx) % 3 === 1
                              ? COLORS.seat.notAvailable
                              : isVipRow
                              ? COLORS.seat.vip
                              : COLORS.seat.regular,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Header Info: Time + Hall Name */}
      <View style={styles.headerRow}>
        <Text style={styles.timeText}>{hall.time}</Text>
        <Text style={styles.hallNameText}>{hall.hallName}</Text>
      </View>

      {/* Hall Seating Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        style={[
          styles.card,
          isSelected ? styles.cardSelected : styles.cardUnselected,
        ]}
      >
        {renderMiniGrid()}
      </TouchableOpacity>

      {/* Price & Bonus Info */}
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>From </Text>
        <Text style={styles.priceBold}>{hall.price}$ </Text>
        <Text style={styles.priceLabel}>or </Text>
        <Text style={styles.priceBold}>{hall.bonusPoints} bonus</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 250,
    marginRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  hallNameText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  card: {
    height: 145,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: '#E8E8EE',
  },
  miniMap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenCurve: {
    marginBottom: 4,
  },
  rowsContainer: {
    gap: 3.5,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBlock: {
    flexDirection: 'row',
    gap: 2.5,
  },
  centerBlock: {
    marginHorizontal: 7,
  },
  miniDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  priceLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceBold: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});
