import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Account: undefined;
  EditProfile: undefined;
  ScheduleDelivery: undefined; 
  ActiveDelivery: undefined;
};

import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AccountScreen from './screens/AccountScreen';
import EditProfileScreen from './screens/EditProfileScreen';

// ---- Schedule Delivery Flow ----
import { ScheduleProvider } from './screens/ScheduleContext';
import DropoffTypeScreen from './screens/DropoffTypeScreen';
import ShipmentSizeScreen from './screens/ShipmentSizeScreen';
import AddItemScreen from './screens/AddItemScreen';
import ScheduleCalendarScreen from './screens/ScheduleCalendarScreen';
import LocationSelectScreen from './screens/LocationSelectScreen';
import BookingScreen from './screens/BookingScreen';
import ActiveDeliveryScreen from './screens/ActiveDeliveryScreen';

const ScheduleFlowStack = () => (
  <ScheduleProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DropoffType" component={DropoffTypeScreen} />
      <Stack.Screen name="ShipmentSize" component={ShipmentSizeScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
      <Stack.Screen name="ScheduleCalendar" component={ScheduleCalendarScreen} />
      <Stack.Screen name="PickupLocation" component={LocationSelectScreen} />
      <Stack.Screen name="DropoffLocation" component={LocationSelectScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
    </Stack.Navigator>
  </ScheduleProvider>
);
// -----------------------------------

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
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
          <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}