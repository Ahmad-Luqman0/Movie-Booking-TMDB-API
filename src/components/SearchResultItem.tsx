import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface SearchResultItemProps {
  title: string;
  category: string;
  image: any;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  title,
  category,
  image,
  onPress,
  onOptionsPress,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
      {image && image.uri ? (
        <Image source={image} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Ionicons name="film-outline" size={32} color="#B0B8C1" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.category}>{category}</Text>
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
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F6',
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
  category: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#DBDFE3',
  },
  optionsButton: {
    padding: 6,
  },
});
