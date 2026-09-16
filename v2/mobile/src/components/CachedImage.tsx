import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ImageStyle>;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  fallbackIcon = 'film-outline',
  containerStyle,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasValidUri =
    source &&
    (typeof source === 'number' || (typeof source === 'object' && source.uri && source.uri.trim().length > 0));

  if (!hasValidUri || error) {
    return (
      <View style={[styles.fallbackContainer, containerStyle, style]}>
        <Ionicons name={fallbackIcon} size={32} color={COLORS.textSecondary} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Image
        {...props}
        source={source}
        style={[style]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color={COLORS.primaryBlue} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(46, 39, 57, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    backgroundColor: '#EAEAEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
