import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../components/CustomTabBar';
import { WatchScreen } from '../screens/WatchScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { MovieDetailScreen } from '../screens/MovieDetailScreen';
import { CinemaDateScreen } from '../screens/CinemaDateScreen';
import { SeatSelectionScreen } from '../screens/SeatSelectionScreen';
import {
  DashboardScreen,
  MediaLibraryScreen,
  MoreScreen,
} from '../screens/PlaceholderTabs';
import { Movie } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  Search: undefined;
  MovieDetail: { movie: Movie };
  CinemaDate: { movie: Movie };
  SeatSelection: {
    movie: Movie;
    date: any;
    hall: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Watch"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Watch" component={WatchScreen} />
      <Tab.Screen name="MediaLibrary" component={MediaLibraryScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="CinemaDate" component={CinemaDateScreen} />
        <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
