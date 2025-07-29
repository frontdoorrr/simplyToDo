import { meetsWCAGAA, meetsWCAGAAA, getContrastRatio } from '@/lib/colorUtils';
import { ThemeColors } from '@/types/Theme';
import { logger } from '@/lib/logger';

/**
 * WCAG 2.1 접근성 기준 검증 유틸리티
 */

export interface AccessibilityReport {
  passed: boolean;
  issues: string[];
  warnings: string[];
  score: number; // 0-100
}

/**
 * 테마의 접근성 준수 여부를 검증합니다
 */
export function validateThemeAccessibility(colors: ThemeColors, themeName: string): AccessibilityReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  // 기본 텍스트와 배경 간 대비 검증
  totalChecks++;
  const primaryTextContrast = meetsWCAGAA(colors.text.primary, colors.background.app);
  if (!primaryTextContrast) {
    issues.push(`Primary text on app background fails WCAG AA (${getContrastRatio(colors.text.primary, colors.background.app).toFixed(2)}:1)`);
  } else {
    passedChecks++;
  }

  // 보조 텍스트 대비 검증
  totalChecks++;
  const secondaryTextContrast = meetsWCAGAA(colors.text.secondary, colors.background.app);
  if (!secondaryTextContrast) {
    warnings.push(`Secondary text on app background may not meet WCAG AA (${getContrastRatio(colors.text.secondary, colors.background.app).toFixed(2)}:1)`);
  } else {
    passedChecks++;
  }

  // 카드 배경과 텍스트 간 대비 검증
  totalChecks++;
  const cardTextContrast = meetsWCAGAA(colors.text.primary, colors.background.card);
  if (!cardTextContrast) {
    issues.push(`Primary text on card background fails WCAG AA (${getContrastRatio(colors.text.primary, colors.background.card).toFixed(2)}:1)`);
  } else {
    passedChecks++;
  }

  // 버튼 텍스트와 배경 간 대비 검증
  totalChecks++;
  const buttonTextContrast = meetsWCAGAA(colors.button.text, colors.button.primary);
  if (!buttonTextContrast) {
    issues.push(`Button text on button background fails WCAG AA (${getContrastRatio(colors.button.text, colors.button.primary).toFixed(2)}:1)`);
  } else {
    passedChecks++;
  }

  // 링크 색상과 배경 간 대비 검증
  totalChecks++;
  const linkContrast = meetsWCAGAA(colors.accent, colors.background.app);
  if (!linkContrast) {
    issues.push(`Link color on app background fails WCAG AA (${getContrastRatio(colors.accent, colors.background.app).toFixed(2)}:1)`);
  } else {
    passedChecks++;
  }

  // 상태 색상들 검증
  const statusColors = [colors.status.success, colors.status.warning, colors.status.error, colors.status.info];
  statusColors.forEach((statusColor, index) => {
    const statusNames = ['success', 'warning', 'error', 'info'];
    totalChecks++;
    const statusContrast = meetsWCAGAA(statusColor, colors.background.app);
    if (!statusContrast) {
      warnings.push(`${statusNames[index]} status color may not meet WCAG AA (${getContrastRatio(statusColor, colors.background.app).toFixed(2)}:1)`);
    } else {
      passedChecks++;
    }
  });

  // AAA 수준 검증 (경고로만 표시)
  if (meetsWCAGAAA(colors.text.primary, colors.background.app)) {
    warnings.push('Primary text meets WCAG AAA standard - excellent accessibility!');
  }

  const score = Math.round((passedChecks / totalChecks) * 100);
  const passed = issues.length === 0;

  // 로그 출력
  if (__DEV__) {
    logger.debug(`🔍 Accessibility check for ${themeName} theme:`);
    logger.debug(`Score: ${score}/100 (${passedChecks}/${totalChecks} checks passed)`);
    
    if (issues.length > 0) {
      logger.warn('❌ Accessibility issues found:', issues);
    }
    
    if (warnings.length > 0) {
      logger.debug('⚠️ Accessibility warnings:', warnings);
    }
  }

  return {
    passed,
    issues,
    warnings,
    score
  };
}

/**
 * 모든 테마의 접근성을 검증합니다
 */
export function validateAllThemesAccessibility(themes: Record<string, ThemeColors>): Record<string, AccessibilityReport> {
  const results: Record<string, AccessibilityReport> = {};
  
  Object.entries(themes).forEach(([themeName, colors]) => {
    results[themeName] = validateThemeAccessibility(colors, themeName);
  });

  return results;
}

/**
 * 접근성 개선 제안을 생성합니다
 */
export function generateAccessibilitySuggestions(report: AccessibilityReport): string[] {
  const suggestions: string[] = [];

  if (report.score < 80) {
    suggestions.push('Consider increasing color contrast ratios to meet WCAG AA standards');
  }

  if (report.issues.some(issue => issue.includes('Primary text'))) {
    suggestions.push('Adjust primary text color or background color for better readability');
  }

  if (report.issues.some(issue => issue.includes('Button'))) {
    suggestions.push('Use a darker or lighter button text color for better contrast');
  }

  if (report.score === 100) {
    suggestions.push('Excellent accessibility! All colors meet WCAG AA standards.');
  }

  return suggestions;
}