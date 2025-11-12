/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootStackParamList } from './navigation/types';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import '../global.css';
import { BleProvider } from './ble/BleProvider';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const settings = {
  icon: (props: any) => <MaterialCommunityIcons {...props} />,
};

const theme = {
  ...DefaultTheme,
  // Specify custom property
  myOwnProperty: true,
  // Specify custom property in nested object
  colors: {
    ...DefaultTheme.colors,
    primary: "rgb(0, 0, 255)",
    // onPrimary: "rgba(0, 0, 255, 1)",
    myOwnColor: '#BADA55',
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a navigation ref that can be used outside of navigation components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider settings={settings} theme={theme}>
          <BleProvider navigationRef={navigationRef}>
            <NavigationContainer ref={navigationRef}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                  },
                }}
              >
                <Stack.Screen
                  name="Welcome"
                  component={WelcomeScreen}
                  options={{ title: 'Welcome' }}
                />
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ title: 'Home' }}
                />
                <Stack.Screen
                  name="Details"
                  component={DetailsScreen}
                  options={{ title: 'Details' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </BleProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;

