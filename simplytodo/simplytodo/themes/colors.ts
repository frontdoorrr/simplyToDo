import { ThemeColors, Theme } from '@/types/Theme';

// Light Theme Colors
export const lightTheme: ThemeColors = {
  // 기본 색상
  primary: '#4CAF50',
  secondary: '#8BC34A', 
  accent: '#2196F3',
  
  // 배경 색상
  background: {
    app: '#f0f7f0',        // 앱 전체 배경 (연한 민트 그린)
    surface: '#F5F5F5',
    card: '#ffffff',       // 카드 배경 (흰색)
    modal: '#ffffff',
    input: '#f2f7f2',      // 입력창 배경 (연한 민트 그린)
    subtask: '#f8fbf8',    // 서브태스크 배경 (더 연한 민트 그린)
  },
  
  // 텍스트 색상
  text: {
    primary: '#333333',    // 기본 텍스트 (진한 회색)
    secondary: '#666666',  // 보조 텍스트 (중간 회색)
    tertiary: '#999999',   // 삼차 텍스트 (더 연한 회색)
    placeholder: '#BDBDBD',
    disabled: '#E0E0E0',
    light: '#ffffff',      // 밝은 텍스트 (흰색)
    dark: '#333333',       // 어두운 텍스트 (진한 회색)
  },
  
  // 상태 색상
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  // 인터랙션 색상
  interaction: {
    border: '#E0E0E0',
    divider: '#F0F0F0',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // 버튼 색상
  button: {
    primary: '#4caf50',        // 기본 버튼 색상
    text: '#ffffff',           // 버튼 텍스트 색상
  },
  
  // 아이콘 색상
  icon: {
    check: '#4caf50',          // 체크 아이콘 색상
    default: '#687076',
    tabDefault: '#687076',
    tabSelected: '#0a7ea4',
  },
  
  // 중요도별 색상
  importance: {
    baseColor: [220, 237, 220], // 연한 민트 그린 (RGB)
    darkColor: [76, 175, 80],   // 더 진한 민트 그린 (RGB)
    high: '#F44336',
    medium: '#FF9800',
    low: '#4CAF50',
  },
  
  // 완료된 항목 색상
  completed: {
    background: '#e0e0e0',     // 연한 회색 배경
    opacity: 0.8,              // 투명도
  },
  
  // 액션 색상  
  delete: '#ff6b6b',           // 삭제 액션 색상 (빨간색)
  complete: '#4caf50',         // 완료 액션 색상 (녹색)
  
  // 탭 색상
  tint: '#0a7ea4',
};

// Dark Theme Colors
export const darkTheme: ThemeColors = {
  // 기본 색상
  primary: '#66BB6A',
  secondary: '#9CCC65',
  accent: '#42A5F5',
  
  // 배경 색상
  background: {
    app: '#121212',        // 다크 배경
    surface: '#1E1E1E',
    card: '#2C2C2C',       // 다크 카드 배경
    modal: '#2C2C2C',
    input: '#1E2C1E',      // 다크 입력창 배경
    subtask: '#1A251A',    // 다크 서브태스크 배경
  },
  
  // 텍스트 색상
  text: {
    primary: '#FFFFFF',    // 밝은 텍스트
    secondary: '#B3B3B3',  // 중간 밝기 텍스트
    tertiary: '#808080',   // 더 어두운 텍스트
    placeholder: '#666666',
    disabled: '#404040',
    light: '#ffffff',
    dark: '#121212',
  },
  
  // 상태 색상
  status: {
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#42A5F5',
  },
  
  // 인터랙션 색상
  interaction: {
    border: '#404040',
    divider: '#2C2C2C',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // 버튼 색상
  button: {
    primary: '#66BB6A',
    text: '#ffffff',
  },
  
  // 아이콘 색상
  icon: {
    check: '#66BB6A',
    default: '#9BA1A6',
    tabDefault: '#9BA1A6',
    tabSelected: '#fff',
  },
  
  // 중요도별 색상
  importance: {
    baseColor: [30, 50, 30], // 다크 베이스 (RGB)
    darkColor: [102, 187, 106], // 다크 테마 녹색 (RGB)
    high: '#EF5350',
    medium: '#FFB74D',
    low: '#66BB6A',
  },
  
  // 완료된 항목 색상
  completed: {
    background: '#404040',
    opacity: 0.6,
  },
  
  // 액션 색상
  delete: '#EF5350',
  complete: '#66BB6A',
  
  // 탭 색상
  tint: '#fff',
};

// Theme Objects
export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'Light',
  colors: lightTheme,
  isDark: false,
};

export const DARK_THEME: Theme = {
  id: 'dark', 
  name: 'Dark',
  colors: darkTheme,
  isDark: true,
};

export const THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
} as const;