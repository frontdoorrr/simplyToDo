import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemeSettings } from '@/components/settings/ThemeSettings';

export default function ThemeSettingsScreen() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeSettings onNavigateBack={handleNavigateBack} />
    </SafeAreaView>
  );
}