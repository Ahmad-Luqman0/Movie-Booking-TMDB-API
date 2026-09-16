import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie } from '../types';
import { COLORS, FONTS } from '../constants/theme';

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.container}
    >
      <ImageBackground
        source={movie.posterImage || movie.heroImage}
        style={styles.imageBackground}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
          locations={[0.4, 0.7, 1]}
          style={styles.gradient}
        >
          <Text style={styles.title}>{movie.title}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    width: '100%',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 10,
  },
  gradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: COLORS.textLight,
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    letterSpacing: 0.2,
  },
});
