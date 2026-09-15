import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MovieCard } from '../components/MovieCard';
import { fetchUpcomingMovies } from '../services/api';
import { Movie, RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants/theme';

/**
 * WatchScreen
 * 
 * The primary home feed displaying upcoming movies fetched live from TMDB.
 * Matches Figma Screen 01 with poster cards, titles, and quick search navigation.
 */
export const WatchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // State holding the list of live upcoming movies
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  // Loading spinner indicator while initial data is being fetched
  const [loading, setLoading] = useState(true);

  /**
   * Loads upcoming movies from the backend API on screen mount.
   * If request fails or server is offline, sets an empty list (no dummy fallback).
   */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchUpcomingMovies()
      .then((data) => {
        if (isMounted) {
          setMoviesList(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMoviesList([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Opens the full movie details screen when a movie card is tapped.
   */
  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movie });
  };

  /**
   * Opens the Search / Categories screen when the header magnifying glass icon is tapped.
   */
  const handleSearchPress = () => {
    (navigation as any).navigate('Search');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watch</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSearchPress}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        </View>
      ) : (
        /* Live Movie Feed (Only Live Data, Nothing if empty) */
        <FlatList
          data={moviesList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MovieCard movie={item} onPress={() => handleMoviePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvasLight,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F4',
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  searchButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90, // padding for bottom tab bar
  },
});
