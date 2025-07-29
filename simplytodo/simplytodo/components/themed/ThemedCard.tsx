import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface ThemedCardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'subtle';
  padding?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  borderRadius = 'medium',
  ...props
}) => {
  const { colors, isDark } = useTheme();

  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.background.card,
    };

    // 패딩 스타일
    const paddingStyles: Record<typeof padding, ViewStyle> = {
      none: {},
      small: { padding: 8 },
      medium: { padding: 16 },
      large: { padding: 24 },
    };

    // 보더 반지름 스타일
    const radiusStyles: Record<typeof borderRadius, ViewStyle> = {
      none: { borderRadius: 0 },
      small: { borderRadius: 4 },
      medium: { borderRadius: 8 },
      large: { borderRadius: 16 },
    };

    // 변형별 스타일
    const variantStyles: Record<typeof variant, ViewStyle> = {
      default: {},
      elevated: {
        shadowColor: isDark ? colors.interaction.shadow : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      outlined: {
        borderWidth: 1,
        borderColor: colors.interaction.border,
      },
      subtle: {
        backgroundColor: colors.background.surface,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...radiusStyles[borderRadius],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyles(), style]} {...props}>
      {children}
    </View>
  );
};