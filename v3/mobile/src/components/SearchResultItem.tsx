import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { CachedImage } from './CachedImage';

interface SearchResultItemProps {
  title: string;
  category: string;
  image: any;
  rating?: string;
  isCached?: boolean;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  title,
  category,
  image,
  rating,
  isCached,
  onPress,
  onOptionsPress,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
      <CachedImage
        source={image}
        style={styles.thumbnail}
        containerStyle={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.tagRow}>
          <View style={styles.genreBadge}>
            <Text style={styles.category}>{category}</Text>
          </View>
          {rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#CD9D0F" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
          {isCached ? (
            <View style={styles.cachedBadge}>
              <Ionicons name="flash" size={10} color="#15D2BC" style={{ marginRight: 2 }} />
              <Text style={styles.cachedText}>Fast</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        onPress={onOptionsPress || onPress}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.optionsButton}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.primaryBlue} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  thumbnail: {
    width: 130,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#EAEAEA',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreBadge: {
    backgroundColor: '#F0F3F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  category: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#827D88',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#8A6D14',
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cachedText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: '#0EA391',
  },
  optionsButton: {
    padding: 6,
  },
});
