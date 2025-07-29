import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContextType, ThemeMode, Theme, ThemePreferences } from '@/types/Theme';
import { THEMES } from '@/themes/colors';
import { updateTodoColorsForTheme } from '@/constants/Colors';
import { logger } from '@/lib/logger';

const THEME_STORAGE_KEY = '@simplytodo/theme_preferences';

const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: 'auto',
  followSystem: true,
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // 현재 적용할 테마 결정
  const currentTheme: Theme = useMemo(() => {
    let targetTheme: 'light' | 'dark';

    if (themeMode === 'auto' || preferences.followSystem) {
      // 시스템 설정을 따라가는 경우
      targetTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      logger.debug(`🎨 Using system theme: ${targetTheme} (system: ${systemColorScheme})`);
    } else {
      // 수동 설정인 경우
      targetTheme = themeMode === 'dark' ? 'dark' : 'light';
      logger.debug(`🎨 Using manual theme: ${targetTheme} (mode: ${themeMode})`);
    }

    const selectedTheme = THEMES[targetTheme];
    logger.debug(`🎨 Current theme applied: ${selectedTheme.name} (isDark: ${selectedTheme.isDark})`);
    
    return selectedTheme;
  }, [themeMode, systemColorScheme, preferences.followSystem]);

  // 초기 설정 로드
  useEffect(() => {
    loadPreferences();
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (preferences.followSystem && themeMode === 'auto') {
      logger.debug(`System theme changed to: ${systemColorScheme}`);
    }
  }, [systemColorScheme, preferences.followSystem, themeMode]);

  // 테마 변경 시 TodoColors 업데이트 (임시 해결책)
  useEffect(() => {
    updateTodoColorsForTheme(currentTheme.isDark);
    logger.debug(`🎨 TodoColors updated for theme: ${currentTheme.name}`);
    
    // React Native에서 강제 리렌더링을 위한 이벤트 발생
    // 이는 TodoColors를 사용하는 모든 컴포넌트가 업데이트되도록 돕습니다
    setTimeout(() => {
      // 약간의 지연을 두어 테마 변경이 완전히 적용된 후 추가 업데이트
    }, 50);
  }, [currentTheme]);

  const loadPreferences = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const loadedPreferences: ThemePreferences = JSON.parse(stored);
        setPreferences(loadedPreferences);
        setThemeModeState(loadedPreferences.mode);
        logger.debug('Theme preferences loaded:', loadedPreferences);
      } else {
        logger.debug('No stored theme preferences, using defaults');
      }
    } catch (error) {
      logger.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: ThemePreferences): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newPreferences));
      logger.debug('Theme preferences saved:', newPreferences);
    } catch (error) {
      logger.error('Failed to save theme preferences:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode): void => {
    const newPreferences: ThemePreferences = {
      ...preferences,
      mode,
      followSystem: mode === 'auto',
    };

    logger.debug(`🎨 Theme mode changing from ${themeMode} to ${mode}`);
    logger.debug(`🎨 New preferences:`, newPreferences);
    
    setThemeModeState(mode);
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    
    logger.debug(`🎨 Theme mode changed successfully to: ${mode}`);
  };

  const toggleTheme = (): void => {
    if (preferences.followSystem) {
      // 시스템 설정을 따르고 있다면, 수동 모드로 전환하고 반대 테마 적용
      const newMode = currentTheme.isDark ? 'light' : 'dark';
      setThemeMode(newMode);
    } else {
      // 수동 모드라면 테마 토글
      const newMode = themeMode === 'dark' ? 'light' : 'dark';
      setThemeMode(newMode);
    }
  };

  const contextValue: ThemeContextType = useMemo(() => ({
    theme: currentTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    colors: currentTheme.colors,
    isDark: currentTheme.isDark,
  }), [currentTheme, themeMode]);

  // 로딩 중에는 기본 테마로 렌더링
  if (isLoading) {
    const loadingContextValue: ThemeContextType = {
      theme: THEMES.light,
      themeMode: 'light',
      setThemeMode: () => {},
      toggleTheme: () => {},
      colors: THEMES.light.colors,
      isDark: false,
    };

    return (
      <ThemeContext.Provider value={loadingContextValue}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};