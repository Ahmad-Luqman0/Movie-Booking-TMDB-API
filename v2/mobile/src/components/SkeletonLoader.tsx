import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { BORDER_RADIUS } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const MovieCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <SkeletonBox width="100%" height={180} borderRadius={BORDER_RADIUS.lg} />
      <View style={styles.textContainer}>
        <SkeletonBox width="70%" height={22} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#D6D6E0',
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  textContainer: {
    padding: 14,
  },
});
