import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? COLORS.tabBarActive : COLORS.tabBarInactive;
    switch (routeName) {
      case 'Dashboard':
        return <Ionicons name={isFocused ? 'grid' : 'grid-outline'} size={18} color={color} />;
      case 'Watch':
        return <Ionicons name={isFocused ? 'play' : 'play-outline'} size={18} color={color} />;
      case 'MediaLibrary':
        return <Ionicons name={isFocused ? 'folder' : 'folder-outline'} size={18} color={color} />;
      case 'More':
        return <Ionicons name={isFocused ? 'list' : 'list-outline'} size={18} color={color} />;
      default:
        return <Ionicons name="ellipse" size={18} color={color} />;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Dashboard':
        return 'Dashboard';
      case 'Watch':
        return 'Watch';
      case 'MediaLibrary':
        return 'Media Library';
      case 'More':
        return 'More';
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.containerWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              <View style={styles.iconContainer}>{getIcon(route.name, isFocused)}</View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? COLORS.tabBarActive : COLORS.tabBarInactive,
                    fontFamily: isFocused ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                {getLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkNavy,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
