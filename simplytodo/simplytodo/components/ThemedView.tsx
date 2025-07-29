import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  // 새로운 테마 시스템 지원
  backgroundType?: 'app' | 'surface' | 'card' | 'modal' | 'input' | 'subtask';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  backgroundType = 'surface',
  ...otherProps 
}: ThemedViewProps) {
  const { colors } = useTheme();
  const legacyBackgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  
  // 색상 결정
  const backgroundColor = (lightColor || darkColor) 
    ? legacyBackgroundColor 
    : colors.background[backgroundType];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
