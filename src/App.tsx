import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootStackParamList } from './navigation/types';
//import WelcomeScreen from './screens/WelcomeScreen';
import FirstScreen from './screens/FirstScreen';
import HomeScreen from './screens/HomeScreen';
import SelectLockScreen from './screens/SelectLockScreen';
//import DetailsScreen from './screens/DetailsScreen';
import '../global.css';
import { BleProvider } from './ble/BleProvider';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SnackbarProvider } from './components/SnackbarProvider';
import Step1Screen from './screens/Step1Screen';
import Step2Screen from './screens/Step2Screen';
import Step3Screen from './screens/Step3Screen';
import Step4Screen from './screens/Step4Screen';
import StepFinalScreen from './screens/StepFinalScreen';

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
          <SnackbarProvider>
            <BleProvider navigationRef={navigationRef}>
              <NavigationContainer ref={navigationRef}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <Stack.Navigator
                initialRouteName="First"
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: isDarkMode ? '#1a1a1a' : 'white',
                  },
                }}
              >
                <Stack.Screen name="First" component={FirstScreen}/>
                <Stack.Screen name="Home" component={HomeScreen}/>
                <Stack.Screen name="SelectLock" component={SelectLockScreen}/>
                <Stack.Screen name="Step1" component={Step1Screen}/>
                <Stack.Screen name="Step2" component={Step2Screen}/>
                <Stack.Screen name="Step3" component={Step3Screen}/>
                <Stack.Screen name="Step4" component={Step4Screen}/>
                <Stack.Screen name="Final" component={StepFinalScreen}/>
              </Stack.Navigator>
              </NavigationContainer>
            </BleProvider>
          </SnackbarProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;

