import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  ScheduleDelivery: undefined;
  ActiveDeliveries: undefined;
  ScheduledDeliveries: undefined;
  CompletedDeliveries: undefined
};

export type BottomTabParamList = {
  Home: undefined;
  Activity: undefined;
  Explore: undefined;
  Messages: undefined;
  Account: undefined;
};

import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AccountScreen from './screens/AccountScreen';
import EditProfileScreen from './screens/EditProfileScreen';

import { ScheduleProvider } from './screens/ScheduleContext';
import DropoffTypeScreen from './screens/DropoffTypeScreen';
import ShipmentSizeScreen from './screens/ShipmentSizeScreen';
import AddItemScreen from './screens/AddItemScreen';
import ScheduleCalendarScreen from './screens/ScheduleCalendarScreen';
import LocationSelectScreen from './screens/LocationSelectScreen';
import BookingScreen from './screens/BookingScreen';
import DeliveryListScreen from './screens/DeliveryListScreen';

import ActivityScreen from './screens/ActivityScreen';
import ExploreScreen from './screens/ExploreScreen';
import MessagesScreen from './screens/MessagesScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Bottom tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';
          if (route.name === 'Home') iconName = 'cube-outline';
          else if (route.name === 'Activity') iconName = 'time-outline';
          else if (route.name === 'Explore') iconName = 'compass-outline';
          else if (route.name === 'Messages') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'Account') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F27024',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

const ScheduleFlowStack = ({ route }: any) => {
  const params = route.params || {};
  return (
    <ScheduleProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DropoffType" component={DropoffTypeScreen} initialParams={params} />
        <Stack.Screen name="ShipmentSize" component={ShipmentSizeScreen} />
        <Stack.Screen name="AddItem" component={AddItemScreen} />
        <Stack.Screen name="ScheduleCalendar" component={ScheduleCalendarScreen} />
        <Stack.Screen name="PickupLocation" component={LocationSelectScreen} />
        <Stack.Screen name="DropoffLocation" component={LocationSelectScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
      </Stack.Navigator>
    </ScheduleProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Loading">
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ScheduleDelivery"
            component={ScheduleFlowStack}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ActiveDeliveries"
            component={DeliveryListScreen}
            initialParams={{ status: 'Accepted' }}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ScheduledDeliveries"
            component={DeliveryListScreen}
            initialParams={{ status: 'Pending' }}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CompletedDeliveries"
            component={DeliveryListScreen}
            initialParams={{ status: 'Completed' }}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}