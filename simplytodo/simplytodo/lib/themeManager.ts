import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, ThemePreferences, Theme } from '@/types/Theme';
import { THEMES } from '@/themes/colors';
import { logger } from '@/lib/logger';

const THEME_STORAGE_KEY = '@simplytodo/theme_preferences';

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = THEMES.light;
  private preferences: ThemePreferences = {
    mode: 'auto',
    followSystem: true,
  };

  private constructor() {}

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // 시스템 테마 감지
  detectSystemTheme(systemColorScheme: 'light' | 'dark' | null | undefined): 'light' | 'dark' {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }

  // 현재 적용할 테마 계산
  getCurrentTheme(systemColorScheme: 'light' | 'dark' | null | undefined): Theme {
    let targetTheme: 'light' | 'dark';

    if (this.preferences.mode === 'auto' || this.preferences.followSystem) {
      targetTheme = this.detectSystemTheme(systemColorScheme);
    } else {
      targetTheme = this.preferences.mode === 'dark' ? 'dark' : 'light';
    }

    this.currentTheme = THEMES[targetTheme];
    return this.currentTheme;
  }

  // 테마 전환
  async switchTheme(mode: ThemeMode): Promise<void> {
    const newPreferences: ThemePreferences = {
      ...this.preferences,
      mode,
      followSystem: mode === 'auto',
    };

    this.preferences = newPreferences;
    await this.savePreferences();
    
    logger.debug(`ThemeManager: Theme switched to ${mode}`);
  }

  // 자동 전환 스케줄링 (향후 구현 예정)
  scheduleAutoSwitch(): void {
    // TODO: 시간 기반 자동 전환 로직 구현
    if (this.preferences.autoSwitchTime) {
      logger.debug('Auto switch scheduled:', this.preferences.autoSwitchTime);
    }
  }

  // 설정 저장
  async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(this.preferences));
      logger.debug('ThemeManager: Preferences saved successfully');
    } catch (error) {
      logger.error('ThemeManager: Failed to save preferences:', error);
      throw error;
    }
  }

  // 설정 로드
  async loadPreferences(): Promise<ThemePreferences> {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
        logger.debug('ThemeManager: Preferences loaded successfully:', this.preferences);
      } else {
        logger.debug('ThemeManager: No stored preferences, using defaults');
      }
      return this.preferences;
    } catch (error) {
      logger.error('ThemeManager: Failed to load preferences:', error);
      throw error;
    }
  }

  // 현재 설정 반환
  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  // 현재 테마 반환
  getTheme(): Theme {
    return this.currentTheme;
  }

  // 다크모드 여부 확인
  isDarkMode(): boolean {
    return this.currentTheme.isDark;
  }

  // 테마 초기화
  async resetToDefaults(): Promise<void> {
    this.preferences = {
      mode: 'auto',
      followSystem: true,
    };
    await this.savePreferences();
    logger.debug('ThemeManager: Reset to default preferences');
  }
}