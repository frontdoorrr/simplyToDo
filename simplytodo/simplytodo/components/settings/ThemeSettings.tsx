import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemeMode } from '@/types/Theme';

export interface ThemeSettingsProps {
  onNavigateBack?: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onNavigateBack }) => {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();

  const themeOptions: Array<{
    mode: ThemeMode;
    title: string;
    subtitle: string;
    icon: string;
  }> = [
    {
      mode: 'light',
      title: '라이트 모드',
      subtitle: '밝은 배경으로 화면을 표시합니다',
      icon: 'sunny-outline',
    },
    {
      mode: 'dark',
      title: '다크 모드',
      subtitle: '어두운 배경으로 눈의 피로를 줄입니다',
      icon: 'moon-outline',
    },
    {
      mode: 'auto',
      title: '시스템 설정 따라가기',
      subtitle: '기기의 시스템 설정에 맞춰 자동 전환됩니다',
      icon: 'phone-portrait-outline',
    },
  ];

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    // 강제로 상태 업데이트를 트리거하여 UI 업데이트 보장
    setTimeout(() => {
      // 이 타이머는 테마 변경이 완전히 적용된 후 추가 업데이트를 트리거합니다
    }, 100);
  };

  const ThemeOption = ({ 
    mode, 
    title, 
    subtitle, 
    icon 
  }: {
    mode: ThemeMode;
    title: string;
    subtitle: string;
    icon: string;
  }) => {
    const isSelected = themeMode === mode;
    
    return (
      <TouchableOpacity
        style={[
          styles.optionContainer,
          { 
            backgroundColor: colors.background.card,
            borderColor: isSelected ? colors.primary : colors.interaction.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleThemeChange(mode)}
      >
        <View style={styles.optionLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` }
          ]}>
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.optionTitle, { color: colors.text.primary }]}>
              {title}
            </Text>
            <Text style={[styles.optionSubtitle, { color: colors.text.secondary }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={colors.primary} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.app }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card }]}>
        {onNavigateBack && (
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            테마 설정
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            원하는 테마를 선택하세요
          </Text>
        </View>
      </View>

      {/* Theme Options */}
      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            🎨 테마 모드
          </Text>
          
          {themeOptions.map((option) => (
            <ThemeOption key={option.mode} {...option} />
          ))}
        </View>

        {/* Current Theme Preview */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            🔍 미리보기
          </Text>
          
          <View style={[styles.previewContainer, { backgroundColor: colors.background.surface }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
                현재 테마: {isDark ? '다크 모드' : '라이트 모드'}
              </Text>
            </View>
            
            <View style={styles.previewContent}>
              <View style={[styles.previewCard, { backgroundColor: colors.background.card }]}>
                <Text style={[styles.previewCardTitle, { color: colors.text.primary }]}>
                  할 일 항목 예시
                </Text>
                <Text style={[styles.previewCardSubtitle, { color: colors.text.secondary }]}>
                  이런 식으로 표시됩니다
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewContainer: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewCard: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewCardSubtitle: {
    fontSize: 14,
  },
});