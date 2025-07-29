export interface ThemeColors {
  // 기본 색상
  primary: string;
  secondary: string;
  accent: string;
  
  // 배경 색상
  background: {
    app: string;
    surface: string;
    card: string;
    modal: string;
    input: string;
    subtask: string;
  };
  
  // 텍스트 색상
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    placeholder: string;
    disabled: string;
    light: string;
    dark: string;
  };
  
  // 상태 색상
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 인터랙션 색상
  interaction: {
    border: string;
    divider: string;
    shadow: string;
    overlay: string;
  };
  
  // 버튼 색상
  button: {
    primary: string;
    text: string;
  };
  
  // 아이콘 색상
  icon: {
    check: string;
    default: string;
    tabDefault: string;
    tabSelected: string;
  };
  
  // 중요도별 색상
  importance: {
    baseColor: [number, number, number]; // RGB
    darkColor: [number, number, number]; // RGB
    high: string;
    medium: string;
    low: string;
  };
  
  // 완료된 항목 색상
  completed: {
    background: string;
    opacity: number;
  };
  
  // 액션 색상
  delete: string;
  complete: string;
  
  // 탭 색상
  tint: string;
}

export interface Theme {
  id: 'light' | 'dark';
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemePreferences {
  mode: ThemeMode;
  followSystem: boolean;
  autoSwitchTime?: {
    lightModeStart: string; // "06:00"
    darkModeStart: string;  // "18:00"
  };
}

export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}