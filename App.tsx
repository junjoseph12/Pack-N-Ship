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
};

import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AccountScreen from './screens/AccountScreen';
import EditProfileScreen from './screens/EditProfileScreen';

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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}