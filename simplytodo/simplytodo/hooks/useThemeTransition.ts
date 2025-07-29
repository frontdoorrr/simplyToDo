import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

/**
 * 테마 전환을 위한 애니메이션 hook
 */
export function useThemeTransition(duration: number = 200) {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, [isDark, duration, animatedValue]);
  
  return animatedValue;
}

/**
 * 색상 전환을 위한 애니메이션 hook
 */
export function useAnimatedColor(
  lightColor: string,
  darkColor: string,
  duration: number = 200
): Animated.AnimatedAddition<string> {
  const animatedValue = useThemeTransition(duration);
  
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColor, darkColor],
  }) as Animated.AnimatedAddition<string>;
}

/**
 * 배경색 전환을 위한 애니메이션 hook
 */
export function useAnimatedBackgroundColor(
  lightColor: string,
  darkColor: string,
  duration: number = 200
) {
  const animatedColor = useAnimatedColor(lightColor, darkColor, duration);
  
  return {
    backgroundColor: animatedColor as any,
  };
}