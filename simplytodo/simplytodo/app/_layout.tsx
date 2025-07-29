import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { useTheme } from '@/hooks/useTheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemedStatusBar } from '@/components/themed/ThemedStatusBar';
import { ActivityIndicator, View } from 'react-native';
import { TodoColors } from '@/constants/Colors';



// 인증 상태에 따른 라우팅 처리
function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  
  useEffect(() => {
    if (loading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!user && !inAuthGroup) {
      // 로그인되지 않았는데 인증이 필요한 화면에 있으면 로그인 화면으로 이동
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // 이미 로그인되었는데 인증 화면에 있으면 메인 화면으로 이동
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, navigationState]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
    </Stack>
  );
}

// Loading screen component that can be used before theme context is available
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: TodoColors.background.app 
    }}>
      <ActivityIndicator size="large" color={TodoColors.primary} />
    </View>
  );
}

// Navigation wrapper that uses our theme system
function ThemedNavigation() {
  const { isDark } = useTheme();
  
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <RootNavigation />
      <ThemedStatusBar />
    </NavigationThemeProvider>
  );
}

function RootLayoutContent() {
  const { loading } = useAuth();
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 알림 권한 요청 및 핸들러 세팅
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  if (!loaded || loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemedNavigation />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
