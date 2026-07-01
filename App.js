import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import AppTabs from './src/navigation/AppTabs';
import { navigationRef, navigate } from './src/navigation/RootNavigation';
import apiClient from './src/api/client';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Listen for network state changes globally
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      
      if (offline && isAuthenticated) {
        Alert.alert(
          "You are Offline", 
          "Internet connection lost. Redirecting to your Downloads.",
          [{ text: "OK" }]
        );
        // Force navigate to Downloads when offline
        navigate('Batches', { screen: 'Downloads' });
      } else if (!offline && isAuthenticated) {
        // App is back online. 
        // We ping auth/me to ensure the session hasn't expired while they were offline.
        // If it returns 401, the global Axios interceptor will automatically log them out.
        apiClient.get('/auth/me').catch(() => {
          console.log("Auth ping failed on reconnect");
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
