import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ThemeColors } from '@/types/Theme';

/**
 * 테마 기반 스타일을 최적화된 방식으로 생성하는 hook
 * 메모이제이션을 통해 불필요한 스타일 재생성을 방지합니다.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (colors: ThemeColors, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  
  return useMemo(() => {
    return StyleSheet.create(styleFactory(colors, isDark));
  }, [colors, isDark, styleFactory]);
}

/**
 * 단일 색상 값을 테마에 따라 반환하는 최적화된 hook
 */
export function useThemedColor(
  lightColor: string,
  darkColor: string
): string {
  const { isDark } = useTheme();
  
  return useMemo(() => {
    return isDark ? darkColor : lightColor;
  }, [isDark, lightColor, darkColor]);
}

/**
 * 테마에 따른 조건부 값을 반환하는 hook
 */
export function useThemedValue<T>(
  lightValue: T,
  darkValue: T
): T {
  const { isDark } = useTheme();
  
  return useMemo(() => {
    return isDark ? darkValue : lightValue;
  }, [isDark, lightValue, darkValue]);
}