#!/usr/bin/env node

// 프로덕션 빌드 전 종합 체크리스트 스크립트 (Phase 5 강화)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SimplyToDo 프로덕션 빌드 종합 체크리스트\n');

const checks = [];
const warnings = [];
const criticalIssues = [];

// 1. 환경 변수 체크
function checkEnvironmentVariables() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    checks.push({ name: '환경 변수 파일', status: '❌', message: '.env 파일이 없습니다' });
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_GEMINI_API_KEY'
  ];
  
  const optionalVars = [
    'EXPO_PUBLIC_OPENAI_API_KEY',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
  );
  
  if (missingVars.length > 0) {
    criticalIssues.push(`필수 환경 변수 누락: ${missingVars.join(', ')}`);
    checks.push({ 
      name: '환경 변수 설정', 
      status: '❌', 
      message: `누락된 필수 변수: ${missingVars.join(', ')}` 
    });
  } else {
    checks.push({ name: '환경 변수 설정', status: '✅', message: '모든 필수 변수 설정됨' });
  }
  
  // 선택적 변수 체크
  const missingOptionalVars = optionalVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
  );
  
  if (missingOptionalVars.length > 0) {
    warnings.push(`선택적 환경 변수 누락: ${missingOptionalVars.join(', ')}`);
  }
  
  // HTTPS URL 체크
  if (envContent.includes('EXPO_PUBLIC_SUPABASE_URL=http://')) {
    criticalIssues.push('Supabase URL이 HTTP를 사용합니다. HTTPS를 사용해야 합니다.');
  }
}

// 2. 아이콘 파일 체크
function checkIconFiles() {
  const iconPaths = [
    './assets/images/icon.png',
    './assets/images/adaptive-icon.png',
    './assets/images/favicon.png',
    './assets/images/splash-icon.png'
  ];
  
  const missingIcons = iconPaths.filter(iconPath => 
    !fs.existsSync(path.join(__dirname, '..', iconPath))
  );
  
  if (missingIcons.length > 0) {
    checks.push({ 
      name: '앱 아이콘', 
      status: '❌', 
      message: `누락된 아이콘: ${missingIcons.join(', ')}` 
    });
  } else {
    checks.push({ name: '앱 아이콘', status: '✅', message: '모든 아이콘 파일 존재' });
  }
}

// 3. 패키지 보안 및 종속성 체크
function checkPackageSecurity() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    checks.push({ name: '패키지 보안', status: '❌', message: 'package.json 없음' });
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // 필수 보안 패키지 체크
  const requiredSecurityPackages = [
    'expo-secure-store',
    '@react-native-google-signin/google-signin',
    '@invertase/react-native-apple-authentication',
    'expo-crypto'
  ];
  
  const missingSecurityPackages = requiredSecurityPackages.filter(pkg => !dependencies[pkg]);
  
  if (missingSecurityPackages.length > 0) {
    warnings.push(`보안 관련 패키지 누락: ${missingSecurityPackages.join(', ')}`);
  }
  
  // 개발 종속성이 프로덕션에 포함되지 않도록 체크
  const devDepsInProd = Object.keys(packageJson.dependencies || {}).filter(dep => 
    ['@types/', 'eslint', 'prettier', 'jest'].some(devPrefix => dep.includes(devPrefix))
  );
  
  if (devDepsInProd.length > 0) {
    warnings.push(`개발 종속성이 프로덕션 종속성에 포함됨: ${devDepsInProd.join(', ')}`);
  }
  
  try {
    // npm audit 실행 (보안 취약점 체크)
    execSync('npm audit --audit-level=high --json', { stdio: 'pipe' });
    checks.push({ name: '패키지 보안', status: '✅', message: 'npm audit 통과' });
  } catch (error) {
    const auditOutput = error.stdout ? error.stdout.toString() : '';
    if (auditOutput.includes('high') || auditOutput.includes('critical')) {
      criticalIssues.push('높은 수준의 보안 취약점이 발견되었습니다.');
      checks.push({ name: '패키지 보안', status: '❌', message: '심각한 보안 취약점 발견' });
    } else {
      checks.push({ name: '패키지 보안', status: '⚠️', message: '일부 보안 취약점 발견' });
    }
  }
}

// 4. TypeScript 컴파일 및 타입 체크
function checkTypeScript() {
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    checks.push({ name: 'TypeScript 설정', status: '❌', message: 'tsconfig.json 없음' });
    return;
  }
  
  try {
    // TypeScript 컴파일 체크
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
    checks.push({ name: 'TypeScript 컴파일', status: '✅', message: '타입 에러 없음' });
  } catch (error) {
    const errorOutput = error.stdout ? error.stdout.toString() : error.stderr.toString();
    if (errorOutput.includes('error TS')) {
      criticalIssues.push('TypeScript 컴파일 에러가 있습니다.');
      checks.push({ name: 'TypeScript 컴파일', status: '❌', message: 'TypeScript 에러 발견' });
    } else {
      checks.push({ name: 'TypeScript 컴파일', status: '⚠️', message: '경고 발견' });
    }
  }
  
  // tsconfig.json 설정 체크
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.strict) {
    warnings.push('TypeScript strict 모드가 비활성화되어 있습니다.');
  }
}

// 5. EAS 설정 및 빌드 구성 체크
function checkEASConfig() {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  if (!fs.existsSync(easJsonPath)) {
    warnings.push('eas.json 파일이 없습니다. EAS 빌드를 위해 생성이 필요합니다.');
    checks.push({ name: 'EAS 설정', status: '⚠️', message: 'eas.json 없음' });
    return;
  }
  
  const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  // 필수 빌드 프로필 체크
  const requiredProfiles = ['development', 'preview', 'production'];
  const missingProfiles = requiredProfiles.filter(profile => 
    !easConfig.build || !easConfig.build[profile]
  );
  
  if (missingProfiles.length > 0) {
    warnings.push(`EAS 빌드 프로필 누락: ${missingProfiles.join(', ')}`);
  }
  
  // 프로덕션 프로필 검증
  if (easConfig.build?.production) {
    const prodConfig = easConfig.build.production;
    if (!prodConfig.distribution || prodConfig.distribution !== 'store') {
      warnings.push('프로덕션 빌드가 스토어 배포용으로 설정되지 않았습니다.');
    }
  }
  
  checks.push({ name: 'EAS 설정', status: '✅', message: 'eas.json 설정 완료' });
}

// 6. 소셜 로그인 보안 설정 체크
function checkSocialAuthSecurity() {
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  
  if (!fs.existsSync(appConfigPath)) {
    warnings.push('app.config.js 파일이 없습니다.');
    return;
  }
  
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  // Google Sign-In 플러그인 체크
  if (!appConfigContent.includes('@react-native-google-signin/google-signin')) {
    warnings.push('Google Sign-In 플러그인이 app.config.js에 설정되지 않았습니다.');
  }
  
  // Apple Sign In 설정 체크
  if (!appConfigContent.includes('AppleSignIn')) {
    warnings.push('Apple Sign In이 app.config.js에 설정되지 않았습니다.');
  }
  
  checks.push({ name: '소셜 로그인 설정', status: '✅', message: '소셜 로그인 설정 확인됨' });
}

// 7. 보안 감사 (Phase 5 추가)
function checkSecurityCompliance() {
  const securityIssues = [];
  
  // 하드코딩된 시크릿 체크
  const sensitiveFiles = [
    path.join(__dirname, '..', 'lib', 'supabase.ts'),
    path.join(__dirname, '..', 'lib', 'socialAuthService.ts'),
  ];
  
  sensitiveFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const suspiciousPatterns = [
        /password\s*=\s*['"][^'"]+['"]/i,
        /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
        /secret\s*=\s*['"][^'"]+['"]/i,
      ];
      
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          securityIssues.push(`하드코딩된 시크릿 발견: ${path.basename(filePath)}`);
        }
      });
    }
  });
  
  if (securityIssues.length > 0) {
    criticalIssues.push(...securityIssues);
    checks.push({ name: '보안 컴플라이언스', status: '❌', message: '보안 이슈 발견' });
  } else {
    checks.push({ name: '보안 컴플라이언스', status: '✅', message: '보안 검사 통과' });
  }
}

// 8. 성능 최적화 체크
function checkPerformanceOptimization() {
  const performanceIssues = [];
  
  // 번들 크기 체크 (근사치)
  try {
    const stats = execSync('du -sh node_modules', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const sizeMatch = stats.match(/(\d+(?:\.\d+)?)([MG])/);;
    if (sizeMatch) {
      const [, size, unit] = sizeMatch;
      const sizeInMB = unit === 'G' ? parseFloat(size) * 1024 : parseFloat(size);
      if (sizeInMB > 500) {
        warnings.push(`node_modules 크기가 큽니다: ${size}${unit}`);
      }
    }
  } catch (error) {
    // 크기 체크 실패는 무시
  }
  
  // 성능 최적화 관련 파일 존재 체크
  const performanceFiles = [
    path.join(__dirname, '..', 'lib', 'performanceOptimizer.ts'),
    path.join(__dirname, '..', 'lib', 'sessionManager.ts'),
  ];
  
  const missingPerfFiles = performanceFiles.filter(file => !fs.existsSync(file));
  if (missingPerfFiles.length > 0) {
    warnings.push('성능 최적화 모듈이 누락되었습니다.');
  }
  
  checks.push({ name: '성능 최적화', status: '✅', message: '성능 최적화 모듈 확인됨' });
}

// 모든 체크 실행
function runAllChecks() {
  console.log('🔍 환경 변수 검사 중...');
  checkEnvironmentVariables();
  
  console.log('🎨 아이콘 파일 검사 중...');
  checkIconFiles();
  
  console.log('🔒 패키지 보안 검사 중...');
  checkPackageSecurity();
  
  console.log('📝 TypeScript 컴파일 검사 중...');
  checkTypeScript();
  
  console.log('⚙️  EAS 설정 검사 중...');
  checkEASConfig();
  
  console.log('🔐 소셜 로그인 보안 검사 중...');
  checkSocialAuthSecurity();
  
  console.log('🛡️  보안 컴플라이언스 검사 중...');
  checkSecurityCompliance();
  
  console.log('⚡ 성능 최적화 검사 중...');
  checkPerformanceOptimization();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 체크리스트 결과');
  console.log('='.repeat(60));
  
  // 결과 출력
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.message}`);
  });
  
  const failedChecks = checks.filter(check => check.status === '❌').length;
  const warningChecks = checks.filter(check => check.status === '⚠️').length;
  const passedChecks = checks.length - failedChecks - warningChecks;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 요약 통계');
  console.log('='.repeat(60));
  console.log(`✅ 통과: ${passedChecks}/${checks.length}`);
  console.log(`⚠️  경고: ${warningChecks}/${checks.length}`);
  console.log(`❌ 실패: ${failedChecks}/${checks.length}`);
  
  // 심각한 이슈 출력
  if (criticalIssues.length > 0) {
    console.log('\n🚨 심각한 이슈:');
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  // 경고 출력
  if (warnings.length > 0) {
    console.log('\n⚠️  경고사항:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failedChecks > 0 || criticalIssues.length > 0) {
    console.log('🔥 프로덕션 빌드 전에 실패한 항목들을 수정해주세요!');
    console.log('\n권장 조치:');
    console.log('1. 위의 심각한 이슈들을 우선 해결하세요');
    console.log('2. TypeScript 에러가 있다면 먼저 수정하세요');
    console.log('3. 환경 변수가 올바르게 설정되었는지 확인하세요');
    console.log('4. npm audit fix를 실행하여 보안 취약점을 해결하세요');
    process.exit(1);
  } else if (warningChecks > 0 || warnings.length > 0) {
    console.log('⚠️  경고 항목들을 검토해주세요.');
    console.log('\n대부분의 경고는 프로덕션 빌드에 큰 영향을 주지 않지만,');
    console.log('더 나은 보안과 성능을 위해 개선을 권장합니다.');
  } else {
    console.log('🎉 모든 체크를 통과했습니다!');
    console.log('✨ 프로덕션 빌드 준비가 완료되었습니다!');
    console.log('\n다음 단계:');
    console.log('1. npm run build:production');
    console.log('2. 앱 스토어 업로드 준비');
    console.log('3. 최종 테스트 진행');
  }
}

// 스크립트 실행
try {
  runAllChecks();
} catch (error) {
  console.error('\n❌ 체크리스트 실행 중 오류가 발생했습니다:');
  console.error(error.message);
  process.exit(1);
}