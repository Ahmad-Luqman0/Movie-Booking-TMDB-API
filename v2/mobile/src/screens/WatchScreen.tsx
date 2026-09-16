import React, { useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
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
import { MovieCardSkeleton } from '../components/SkeletonLoader';
import { fetchFeaturedMovies } from '../services/api';
import { Movie, RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants/theme';

export const WatchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMovies = async () => {
    try {
      const data = await fetchFeaturedMovies();
      setMoviesList(data);
    } catch {
      setMoviesList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMovies();
  };

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movie });
  };

  const handleSearchPress = () => {
    (navigation as any).navigate('Search');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Watch</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>v2 • PostgreSQL Cache</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSearchPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content Feed */}
      {loading ? (
        <View style={styles.skeletonList}>
          <MovieCardSkeleton />
          <MovieCardSkeleton />
          <MovieCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={moviesList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MovieCard movie={item} onPress={() => handleMoviePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primaryBlue}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No movies cached yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Pull down to refresh or check backend connection.
              </Text>
            </View>
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.canvasLight,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  badge: {
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: '#0EA391',
  },
  searchButton: {
    padding: 6,
  },
  skeletonList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100, // Space for sticky bottom tab bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
