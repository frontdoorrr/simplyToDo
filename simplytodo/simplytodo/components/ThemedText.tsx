import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  // 새로운 테마 시스템 지원
  textType?: 'primary' | 'secondary' | 'tertiary' | 'placeholder' | 'disabled' | 'light' | 'dark';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  textType = 'primary',
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const legacyTextColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  // 색상 결정
  let color: string;
  
  if (lightColor || darkColor) {
    // 기존 방식 (하위 호환성)
    color = legacyTextColor;
  } else {
    // 새로운 테마 시스템
    color = colors.text[textType];
  }

  // 링크 타입의 경우 테마에 맞는 accent 색상 사용
  if (type === 'link') {
    color = colors.accent;
  }

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    // color will be set by theme system
  },
});
