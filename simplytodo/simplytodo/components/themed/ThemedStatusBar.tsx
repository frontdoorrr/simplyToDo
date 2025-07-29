import React from 'react';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useTheme } from '@/hooks/useTheme';

export interface ThemedStatusBarProps extends Omit<StatusBarProps, 'style'> {
  // Override the style prop to make it optional and provide automatic theming
  style?: 'auto' | 'inverted' | 'light' | 'dark';
}

export const ThemedStatusBar: React.FC<ThemedStatusBarProps> = ({
  style = 'auto',
  backgroundColor,
  ...props
}) => {
  const { isDark, colors } = useTheme();
  
  // Determine status bar style based on theme
  let statusBarStyle: 'light' | 'dark';
  
  if (style === 'auto') {
    statusBarStyle = isDark ? 'light' : 'dark';
  } else if (style === 'inverted') {
    statusBarStyle = isDark ? 'dark' : 'light';
  } else {
    statusBarStyle = style;
  }
  
  // Set background color based on current theme if not specified
  const bgColor = backgroundColor || colors.background.app;

  return (
    <StatusBar 
      style={statusBarStyle}
      backgroundColor={bgColor}
      {...props}
    />
  );
};