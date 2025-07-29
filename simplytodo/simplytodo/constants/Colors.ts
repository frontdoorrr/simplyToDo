/**
 * Legacy color definitions - now integrated with the new theme system.
 * For new components, use the ThemeContext instead of these static colors.
 * @deprecated Use ThemeContext and themed components for new features
 */

import { lightTheme, darkTheme } from '@/themes/colors';

// 기존 색상 (하위 호환성 유지)
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// SimplyToDo 앱 색상 - 테마 시스템으로 마이그레이션됨
// @deprecated - Use useTheme().colors instead
export const TodoColors = {
  // 기본 테마 색상
  primary: '#4caf50',  // 기본 녹색
  
  // 배경 색상
  background: {
    app: '#f0f7f0',        // 앱 전체 배경 (연한 민트 그린)
    card: '#ffffff',       // 할 일 카드 배경 (흰색)
    input: '#f2f7f2',      // 입력창 배경 (연한 민트 그린)
    subtask: '#f8fbf8',    // Subtask 배경 (더 연한 민트 그린)
  },
  
  // 중요도에 따른 색상 (1-5)
  importance: {
    baseColor: [220, 237, 220], // 연한 민트 그린 (RGB)
    darkColor: [76, 175, 80],   // 더 진한 민트 그린 (RGB)
  },
  
  // 액션 색상
  delete: '#ff6b6b',           // 삭제 액션 색상 (빨간색)
  complete: '#4caf50',         // 완료 액션 색상 (녹색)
  
  // 완료된 항목 색상
  completed: {
    background: '#e0e0e0',     // 연한 회색 배경
    opacity: 0.8,              // 투명도
  },
  
  // 텍스트 색상
  text: {
    primary: '#333333',        // 기본 텍스트 (진한 회색)
    secondary: '#666666',      // 보조 텍스트 (중간 회색)
    tertiary: '#999999',       // 삼차 텍스트 (더 연한 회색)
    light: '#ffffff',          // 밝은 텍스트 (흰색)
    dark: '#333333',           // 어두운 텍스트 (진한 회색)
  },
  
  // 버튼 색상
  button: {
    primary: '#4caf50',        // 기본 버튼 색상
    text: '#ffffff',           // 버튼 텍스트 색상
  },
  
  // 아이콘 색상
  icon: {
    check: '#4caf50',          // 체크 아이콘 색상
  }
};

// Legacy Colors - 하위 호환성을 위해 유지
// @deprecated - Use useTheme().colors instead
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// 새로운 테마 시스템과의 연결점
// 테마 컨텍스트 없이 색상이 필요한 경우를 위한 헬퍼
export const getThemeColors = (isDark: boolean = false) => {
  return isDark ? darkTheme : lightTheme;
};

// TodoColors를 현재 테마에 맞게 동적으로 업데이트하는 함수
// 이것은 임시 해결책입니다. 모든 컴포넌트를 테마 시스템으로 마이그레이션하는 것이 최종 목표입니다.
export const updateTodoColorsForTheme = (isDark: boolean) => {
  const themeColors = getThemeColors(isDark);
  
  console.log(`🎨 Updating TodoColors for theme: ${isDark ? 'dark' : 'light'}`);
  
  // TodoColors의 값들을 현재 테마에 맞게 완전히 교체
  TodoColors.primary = themeColors.primary;
  TodoColors.background.app = themeColors.background.app;
  TodoColors.background.card = themeColors.background.card;
  TodoColors.background.input = themeColors.background.input;
  TodoColors.background.subtask = themeColors.background.subtask;
  
  TodoColors.text.primary = themeColors.text.primary;
  TodoColors.text.secondary = themeColors.text.secondary;
  TodoColors.text.tertiary = themeColors.text.tertiary;
  TodoColors.text.light = themeColors.text.light;
  TodoColors.text.dark = themeColors.text.dark;
  
  TodoColors.button.primary = themeColors.button.primary;
  TodoColors.button.text = themeColors.button.text;
  
  TodoColors.icon.check = themeColors.icon.check;
  
  TodoColors.delete = themeColors.delete;
  TodoColors.complete = themeColors.complete;
  
  TodoColors.completed.background = themeColors.completed.background;
  TodoColors.completed.opacity = themeColors.completed.opacity;
  
  // 중요도별 색상도 업데이트
  TodoColors.importance.baseColor = themeColors.importance.baseColor;
  TodoColors.importance.darkColor = themeColors.importance.darkColor;
  
  console.log(`🎨 TodoColors updated:`, {
    app: TodoColors.background.app,
    card: TodoColors.background.card,
    textPrimary: TodoColors.text.primary
  });
};
