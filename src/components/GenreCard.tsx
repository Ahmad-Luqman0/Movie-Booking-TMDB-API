import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GenreCategory } from '../types';
import { COLORS, FONTS } from '../constants/theme';

interface GenreCardProps {
  genre: GenreCategory;
  onPress: () => void;
}

export const GenreCard: React.FC<GenreCardProps> = ({ genre, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <ImageBackground
        source={genre.image}
        style={styles.imageBackground}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
          locations={[0.3, 1]}
          style={styles.gradient}
        >
          <Text style={styles.title}>{genre.name}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    flex: 1,
    margin: 6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    borderRadius: 10,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  title: {
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
