import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export const ThemedInput = forwardRef<TextInput, ThemedInputProps>(function ThemedInput({
  label,
  error,
  helperText,
  style,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'default',
  size = 'medium',
  editable = true,
  ...props
}, ref) {
  const { colors } = useTheme();

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      opacity: editable ? 1 : 0.6,
    };

    return baseStyle;
  };

  const getInputStyles = () => {
    const baseStyle = {
      color: colors.text.primary,
    };

    // 크기별 스타일
    const sizeStyles: Record<typeof size, any> = {
      small: { 
        fontSize: 14, 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        minHeight: 36 
      },
      medium: { 
        fontSize: 16, 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        minHeight: 44 
      },
      large: { 
        fontSize: 18, 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        minHeight: 52 
      },
    };

    // 변형별 스타일
    const variantStyles: Record<typeof variant, any> = {
      default: {
        backgroundColor: colors.background.input,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: error ? colors.status.error : colors.interaction.border,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: error ? colors.status.error : colors.interaction.border,
      },
      filled: {
        backgroundColor: colors.background.surface,
        borderRadius: 8,
        borderBottomWidth: 2,
        borderBottomColor: error ? colors.status.error : colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getLabelStyles = (): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: '500',
      color: error ? colors.status.error : colors.text.secondary,
      marginBottom: 6,
    };
  };

  const getHelperTextStyles = (): TextStyle => {
    return {
      fontSize: 12,
      color: error ? colors.status.error : colors.text.tertiary,
      marginTop: 4,
    };
  };

  return (
    <View style={[getContainerStyles(), containerStyle]}>
      {label && (
        <Text style={[getLabelStyles(), labelStyle]}>
          {label}
        </Text>
      )}
      
      <TextInput
        ref={ref}
        style={[getInputStyles(), inputStyle, style]}
        placeholderTextColor={colors.text.placeholder}
        editable={editable}
        {...props}
      />
      
      {(error || helperText) && (
        <Text style={getHelperTextStyles()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});