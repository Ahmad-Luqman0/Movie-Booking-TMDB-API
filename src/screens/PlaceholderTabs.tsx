import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface PlaceholderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}

const PlaceholderTab: React.FC<PlaceholderProps> = ({ title, icon, subtitle }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color={COLORS.primaryBlue} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
};

export const DashboardScreen: React.FC = () => (
  <PlaceholderTab
    title="Dashboard"
    icon="grid-outline"
    subtitle="Quick stats, upcoming shows, and personalized recommendations."
  />
);

export const MediaLibraryScreen: React.FC = () => (
  <PlaceholderTab
    title="Media Library"
    icon="folder-outline"
    subtitle="Your saved tickets, downloaded trailers, and favorite movie lists."
  />
);

export const MoreScreen: React.FC = () => (
  <PlaceholderTab
    title="More"
    icon="list-outline"
    subtitle="App settings, payment methods, cinema locations, and support."
  />
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvasLight,
  },
  header: {
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F4',
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 90,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
