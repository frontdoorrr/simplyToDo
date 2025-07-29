# 🌙 SimplyToDo 다크모드 지원 PRD v1.0

## 📋 문서 정보
- **제품명**: SimplyToDo
- **기능명**: 다크모드 테마 시스템 (Dark Mode Theme System)
- **버전**: v1.0
- **작성일**: 2025-01-29
- **작성자**: Development Team
- **관련 문서**: Task.md Section 5.1

## 🎯 개요 (Overview)

### 핵심 목표 (Core Objectives)
SimplyToDo 앱에 사용자 친화적인 다크모드 테마 시스템을 구현하여, 다양한 환경과 사용자 선호도에 맞춰 최적화된 시각적 경험을 제공합니다.

### 핵심 가치 제안
- **👁️ 눈의 피로 감소**: 저조도 환경에서 편안한 사용 경험
- **🔋 배터리 절약**: OLED 디스플레이에서 전력 소비 최적화  
- **🎨 개인화**: 사용자 취향에 맞는 테마 선택
- **♿ 접근성 향상**: 시각적 대비 개선으로 가독성 증대
- **🌍 트렌드 부응**: 모던 앱의 필수 기능으로 자리잡은 다크모드

### 비즈니스 배경
- **사용자 요구**: 대부분의 모던 앱이 다크모드 지원
- **UX 트렌드**: iOS/Android 시스템 차원의 다크모드 표준화
- **경쟁력**: 사용자 만족도 및 앱 완성도 향상
- **접근성**: 시각 장애인 및 광과민성 사용자 지원

### 성공 지표 (Success Metrics)
#### 기능적 지표
- **테마 전환 성공률**: 100% 오류 없는 전환
- **설정 저장률**: 99% 이상 사용자 선택 유지
- **컴포넌트 호환성**: 모든 UI 요소 완벽 지원

#### 성능 지표  
- **전환 속도**: 테마 변경 시 200ms 이내 완료
- **메모리 사용량**: 기존 대비 5% 이내 증가
- **렌더링 성능**: 60fps 유지

#### 사용자 경험 지표
- **다크모드 사용률**: 30% 이상 사용자 활용
- **사용자 만족도**: 4.5/5 이상
- **접근성 점수**: WCAG 2.1 AA 수준 달성

## 🎯 핵심 기능 요구사항

### 1. 테마 시스템 아키텍처

#### 1.1 테마 데이터 구조
```typescript
interface ThemeColors {
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
  };
  
  // 텍스트 색상
  text: {
    primary: string;
    secondary: string;
    placeholder: string;
    disabled: string;
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
  
  // 중요도별 색상
  importance: {
    high: string;
    medium: string;
    low: string;
  };
}

interface Theme {
  id: 'light' | 'dark' | 'auto';
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}
```

#### 1.2 테마 타입 정의
```typescript
type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemePreferences {
  mode: ThemeMode;
  followSystem: boolean;
  autoSwitchTime?: {
    lightModeStart: string; // "06:00"
    darkModeStart: string;  // "18:00"
  };
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}
```

### 2. 테마 관리 시스템

#### 2.1 ThemeProvider 구현
```typescript
class ThemeManager {
  private currentTheme: Theme;
  private preferences: ThemePreferences;
  
  // 시스템 테마 감지
  detectSystemTheme(): 'light' | 'dark';
  
  // 테마 전환
  switchTheme(mode: ThemeMode): void;
  
  // 자동 전환 스케줄링
  scheduleAutoSwitch(): void;
  
  // 테마 저장/로드
  savePreferences(): Promise<void>;
  loadPreferences(): Promise<ThemePreferences>;
}
```

#### 2.2 테마 컨텍스트
```typescript
export const ThemeContext = createContext<ThemeContextType>();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 3. 컴포넌트별 다크모드 지원

#### 3.1 기본 컴포넌트 업데이트
- **ThemedView**: 배경색 자동 적용
- **ThemedText**: 텍스트 색상 자동 적용  
- **ThemedButton**: 버튼 스타일 테마 적용
- **ThemedInput**: 입력 필드 테마 적용
- **ThemedCard**: 카드 컴포넌트 테마 지원

#### 3.2 커스텀 컴포넌트 테마 적용
```typescript
// TodoItem 컴포넌트 예시
const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const { colors, isDark } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background.card,
      borderColor: colors.interaction.border,
      shadowColor: isDark ? colors.interaction.shadow : '#000',
    },
    text: {
      color: colors.text.primary,
    },
    // ...
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{todo.text}</Text>
    </View>
  );
};
```

### 4. 설정 화면 통합

#### 4.1 테마 설정 UI
```typescript
interface ThemeSettingsProps {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  followSystem: boolean;
  onSystemToggle: (enabled: boolean) => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  currentMode,
  onModeChange,
  followSystem,
  onSystemToggle
}) => {
  return (
    <View>
      {/* 시스템 설정 따라가기 */}
      <SettingRow
        title="시스템 설정 따라가기"
        value={followSystem}
        onToggle={onSystemToggle}
      />
      
      {!followSystem && (
        <>
          {/* 수동 테마 선택 */}
          <SettingRow
            title="라이트 모드"
            selected={currentMode === 'light'}
            onPress={() => onModeChange('light')}
          />
          <SettingRow
            title="다크 모드"
            selected={currentMode === 'dark'}
            onPress={() => onModeChange('dark')}
          />
        </>
      )}
    </View>
  );
};
```

### 5. 시스템 연동

#### 5.1 시스템 테마 감지
```typescript
import { useColorScheme } from 'react-native';

const useSystemTheme = () => {
  const systemColorScheme = useColorScheme();
  
  useEffect(() => {
    if (followSystemTheme) {
      const newTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeMode(newTheme);
    }
  }, [systemColorScheme, followSystemTheme]);
  
  return systemColorScheme;
};
```

#### 5.2 StatusBar 자동 조정
```typescript
const AppStatusBar: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <StatusBar 
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#000000' : '#FFFFFF'}
    />
  );
};
```

## 🎨 UI/UX 디자인 (User Interface Design)

### 1. 컬러 팔레트 정의

#### 라이트 모드
```typescript
const lightTheme: ThemeColors = {
  primary: '#4CAF50',
  secondary: '#8BC34A',
  accent: '#2196F3',
  
  background: {
    app: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    modal: '#FFFFFF',
  },
  
  text: {
    primary: '#212121',
    secondary: '#757575',
    placeholder: '#BDBDBD',
    disabled: '#E0E0E0',
  },
  
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  interaction: {
    border: '#E0E0E0',
    divider: '#F0F0F0',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};
```

#### 다크 모드
```typescript
const darkTheme: ThemeColors = {
  primary: '#66BB6A',
  secondary: '#9CCC65',
  accent: '#42A5F5',
  
  background: {
    app: '#121212',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    modal: '#2C2C2C',
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    placeholder: '#666666',
    disabled: '#404040',
  },
  
  status: {
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#42A5F5',
  },
  
  interaction: {
    border: '#404040',
    divider: '#2C2C2C',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
};
```

### 2. 접근성 고려사항

#### WCAG 2.1 AA 준수
- **대비비**: 텍스트와 배경 간 4.5:1 이상
- **초점 표시**: 키보드 네비게이션 시 명확한 포커스
- **색상 의존성**: 색상 외 다른 시각적 단서 제공

#### 사용자 맞춤 설정
- **텍스트 크기**: 시스템 폰트 크기 설정 따라가기
- **고대비 모드**: 시각 장애인을 위한 높은 대비 옵션
- **색상 필터**: 색맹 사용자를 위한 색상 조정

### 3. 애니메이션 및 전환

#### 부드러운 테마 전환
```typescript
const useThemeTransition = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const animateThemeChange = (isDark: boolean) => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  return { animatedValue, animateThemeChange };
};
```

## 🛠 기술 구현 아키텍처

### 1. 파일 구조
```
src/
├── contexts/
│   ├── ThemeContext.tsx
│   └── ThemeProvider.tsx
├── hooks/
│   ├── useTheme.ts
│   ├── useSystemTheme.ts
│   └── useThemeStorage.ts
├── themes/
│   ├── colors.ts
│   ├── lightTheme.ts
│   ├── darkTheme.ts
│   └── index.ts
├── components/
│   ├── themed/
│   │   ├── ThemedView.tsx
│   │   ├── ThemedText.tsx
│   │   └── ThemedButton.tsx
│   └── settings/
│       └── ThemeSettings.tsx
└── utils/
    ├── themeManager.ts
    └── colorUtils.ts
```

### 2. 성능 최적화

#### 메모이제이션
```typescript
const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  
  const themeValue = useMemo(() => ({
    theme: currentTheme,
    themeMode,
    setThemeMode,
    colors: currentTheme.colors,
    isDark: currentTheme.isDark,
  }), [currentTheme, themeMode]);
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### 조건부 스타일 로딩
```typescript
const createThemedStyles = (colors: ThemeColors, isDark: boolean) => {
  return StyleSheet.create({
    // 스타일 정의
  });
};

// 컴포넌트에서 사용
const styles = useMemo(
  () => createThemedStyles(colors, isDark),
  [colors, isDark]
);
```

### 3. 저장소 연동

#### AsyncStorage 활용
```typescript
const THEME_STORAGE_KEY = '@simplytodo/theme_preferences';

export const ThemeStorage = {
  async save(preferences: ThemePreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY, 
        JSON.stringify(preferences)
      );
    } catch (error) {
      logger.error('Theme preferences save failed:', error);
    }
  },
  
  async load(): Promise<ThemePreferences | null> {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error('Theme preferences load failed:', error);
      return null;
    }
  }
};
```

## 🧪 테스트 계획 (Test Plan)

### 1. 단위 테스트
- ThemeManager 클래스 메서드 테스트
- 테마 컨텍스트 상태 변경 테스트
- 색상 계산 유틸리티 함수 테스트

### 2. 통합 테스트
- 시스템 테마 변경 감지 테스트
- 테마 전환 시 모든 컴포넌트 리렌더링 테스트
- 설정 저장/로드 테스트

### 3. 시각적 테스트
- 라이트/다크 모드 스크린샷 비교
- 접근성 대비비 검증
- 다양한 디바이스에서 테마 표시 확인

### 4. 성능 테스트
- 테마 전환 속도 측정
- 메모리 사용량 분석
- 배터리 소모량 비교 (OLED 디스플레이)

## 🚀 구현 로드맵 (Implementation Roadmap)

### Phase 1: 기본 테마 시스템 (3일)

#### Day 1: 테마 아키텍처 구축
- [ ] 테마 타입 정의 및 컬러 팔레트 생성
- [ ] ThemeContext 및 ThemeProvider 구현
- [ ] 기본 테마 매니저 클래스 개발

#### Day 2: 컴포넌트 테마 적용
- [ ] 기존 Colors.ts를 테마 시스템으로 마이그레이션
- [ ] ThemedView, ThemedText 등 기본 컴포넌트 개발
- [ ] 주요 화면들 테마 적용 (홈, 설정, 완료 목록)

#### Day 3: 시스템 연동 및 저장
- [ ] 시스템 테마 감지 기능 구현
- [ ] AsyncStorage를 통한 설정 저장/로드
- [ ] StatusBar 자동 조정 기능

### Phase 2: 설정 UI 및 고급 기능 (2일)

#### Day 4: 설정 화면 구현
- [ ] Settings 탭에 테마 설정 섹션 추가
- [ ] 테마 선택 UI 개발 (라이트/다크/자동)
- [ ] 실시간 미리보기 기능

#### Day 5: 최적화 및 폴리싱
- [ ] 성능 최적화 (메모이제이션, 조건부 렌더링)
- [ ] 부드러운 전환 애니메이션 추가
- [ ] 접근성 개선 및 대비비 검증

### Phase 3: 테스트 및 검증 (2일)

#### Day 6: 종합 테스트
- [ ] 모든 화면과 컴포넌트 테마 적용 확인
- [ ] 다양한 디바이스에서 테스트
- [ ] 성능 및 메모리 사용량 측정

#### Day 7: 버그 수정 및 최종 검토
- [ ] 발견된 이슈 수정
- [ ] 코드 리뷰 및 문서 업데이트
- [ ] 출시 준비 완료

## 📊 측정 지표 (Success Metrics)

### 기능적 지표
- **테마 전환 성공률**: 100%
- **컴포넌트 호환성**: 모든 UI 요소 완벽 지원
- **설정 저장률**: 99% 이상

### 성능 지표
- **전환 속도**: < 200ms
- **메모리 사용량 증가**: < 5%
- **렌더링 성능**: 60fps 유지

### 사용자 경험 지표
- **다크모드 사용률**: > 30%
- **접근성 점수**: WCAG 2.1 AA 수준
- **사용자 만족도**: > 4.5/5

## 📋 체크리스트 (Implementation Checklist)

### 🎨 테마 시스템 구축
- [ ] **테마 타입 정의 완료**
  - [ ] ThemeColors 인터페이스 정의
  - [ ] Theme 및 ThemeMode 타입 생성
  - [ ] 라이트/다크 컬러 팔레트 정의

- [ ] **컨텍스트 시스템 구현**
  - [ ] ThemeContext 생성
  - [ ] ThemeProvider 구현
  - [ ] useTheme 훅 개발

### 🔧 핵심 기능 구현
- [ ] **테마 매니저 클래스**
  - [ ] 테마 전환 로직
  - [ ] 시스템 테마 감지
  - [ ] 설정 저장/로드 기능

- [ ] **컴포넌트 테마 지원**
  - [ ] 기존 컴포넌트 테마 적용
  - [ ] 새로운 Themed 컴포넌트 생성
  - [ ] 모든 화면 테마 호환성 확보

### ⚙️ 설정 및 UI
- [ ] **설정 화면 통합**
  - [ ] Settings 탭에 테마 섹션 추가
  - [ ] 테마 선택 UI 구현
  - [ ] 실시간 미리보기 기능

- [ ] **시스템 연동**
  - [ ] 시스템 테마 자동 감지
  - [ ] StatusBar 자동 조정
  - [ ] 앱 생명주기 이벤트 처리

### 🎯 최적화 및 검증
- [ ] **성능 최적화**
  - [ ] 메모이제이션 적용
  - [ ] 불필요한 리렌더링 방지
  - [ ] 조건부 스타일 로딩

- [ ] **접근성 및 테스트**
  - [ ] WCAG 2.1 AA 준수 확인
  - [ ] 다양한 디바이스 테스트
  - [ ] 성능 벤치마크 측정

---

## 📄 문서 정보

**문서 버전**: v1.0  
**최종 수정**: 2025-01-29  
**작성자**: Development Team  
**승인자**: Product Team, UX Team  

**관련 문서**: 
- Task.md Section 5.1 (UI/UX 개선)
- constants/Colors.ts (기존 컬러 시스템)

**다음 단계**: Phase 1 개발 시작 - 기본 테마 시스템 구축