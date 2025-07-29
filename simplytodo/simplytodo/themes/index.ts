// Theme system exports
export { lightTheme, darkTheme, LIGHT_THEME, DARK_THEME, THEMES } from './colors';

// Context and hooks
export { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Theme manager
export { ThemeManager } from '@/lib/themeManager';

// Types
export type { 
  Theme, 
  ThemeColors, 
  ThemeMode, 
  ThemePreferences, 
  ThemeContextType 
} from '@/types/Theme';

// Themed components
export * from '@/components/themed';