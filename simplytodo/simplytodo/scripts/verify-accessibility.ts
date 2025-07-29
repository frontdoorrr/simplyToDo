/**
 * 테마 접근성 검증 스크립트
 * 
 * 실행 방법:
 * npx ts-node scripts/verify-accessibility.ts
 */

import { lightTheme, darkTheme } from '../themes/colors';
import { validateAllThemesAccessibility, generateAccessibilitySuggestions } from '../lib/accessibilityUtils';

function verifyAccessibility() {
  console.log('🔍 SimplyToDo 테마 접근성 검증 시작...\n');

  const themes = {
    light: lightTheme,
    dark: darkTheme,
  };

  const results = validateAllThemesAccessibility(themes);

  Object.entries(results).forEach(([themeName, report]) => {
    console.log(`📋 ${themeName.toUpperCase()} 테마 검증 결과:`);
    console.log(`   점수: ${report.score}/100`);
    console.log(`   상태: ${report.passed ? '✅ 통과' : '❌ 실패'}`);
    
    if (report.issues.length > 0) {
      console.log(`   ❌ 문제점 (${report.issues.length}개):`);
      report.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (report.warnings.length > 0) {
      console.log(`   ⚠️  경고 (${report.warnings.length}개):`);
      report.warnings.forEach(warning => console.log(`      - ${warning}`));
    }

    const suggestions = generateAccessibilitySuggestions(report);
    if (suggestions.length > 0) {
      console.log(`   💡 개선 제안:`);
      suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }
    
    console.log('');
  });

  // 전체 요약
  const allPassed = Object.values(results).every(r => r.passed);
  const averageScore = Object.values(results).reduce((sum, r) => sum + r.score, 0) / Object.keys(results).length;

  console.log('📊 전체 요약:');
  console.log(`   전체 통과: ${allPassed ? '✅' : '❌'}`);
  console.log(`   평균 점수: ${Math.round(averageScore)}/100`);
  
  if (allPassed) {
    console.log('🎉 모든 테마가 WCAG 2.1 AA 기준을 충족합니다!');
  } else {
    console.log('⚠️  일부 테마에서 접근성 개선이 필요합니다.');
    console.log('   위의 개선 제안을 참고하여 색상을 조정해주세요.');
  }

  return allPassed;
}

if (require.main === module) {
  const success = verifyAccessibility();
  process.exit(success ? 0 : 1);
}

export { verifyAccessibility };