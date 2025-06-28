/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// 기존 색상
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// SimplyToDo 앱 색상 - 이미지 참고
export const TodoColors = {
  // 기본 테마 색상
  primary: '#4caf50',  // 기본 녹색
  
  // 배경 색상
  background: {
    app: '#f0f7f0',        // 앱 전체 배경 (연한 민트 그린)
    card: '#ffffff',       // 할 일 카드 배경 (흰색)
    input: '#f2f7f2',      // 입력창 배경 (연한 민트 그린)
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
