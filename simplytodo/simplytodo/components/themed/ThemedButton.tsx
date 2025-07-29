import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  containerStyle,
  disabled,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };

    // 크기별 스타일
    const sizeStyles: Record<typeof size, ViewStyle> = {
      small: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 },
      medium: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44 },
      large: { paddingHorizontal: 20, paddingVertical: 14, minHeight: 52 },
    };

    // 변형별 스타일
    const variantStyles: Record<typeof variant, ViewStyle> = {
      primary: {
        backgroundColor: colors.button.primary,
        shadowColor: isDark ? colors.interaction.shadow : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
      secondary: {
        backgroundColor: colors.background.surface,
        borderWidth: 1,
        borderColor: colors.interaction.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.button.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // 크기별 텍스트 스타일
    const sizeStyles: Record<typeof size, TextStyle> = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    // 변형별 텍스트 색상
    const variantTextColors: Record<typeof variant, string> = {
      primary: colors.button.text,
      secondary: colors.text.primary,
      outline: colors.button.primary,
      ghost: colors.text.primary,
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color: variantTextColors[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[containerStyle, getButtonStyles(), style]}
      disabled={disabled}
      {...props}
    >
      <Text style={[getTextStyles(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};