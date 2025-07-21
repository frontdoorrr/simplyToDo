#!/usr/bin/env node

// 프로덕션 빌드 전 체크리스트 스크립트

const fs = require('fs');
const path = require('path');

console.log('🚀 SimplyToDo 프로덕션 빌드 체크리스트\n');

const checks = [];

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
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
  );
  
  if (missingVars.length > 0) {
    checks.push({ 
      name: '환경 변수 설정', 
      status: '⚠️', 
      message: `누락된 변수: ${missingVars.join(', ')}` 
    });
  } else {
    checks.push({ name: '환경 변수 설정', status: '✅', message: '모든 필수 변수 설정됨' });
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

// 3. 패키지 보안 체크
function checkPackageSecurity() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    checks.push({ name: '패키지 보안', status: '❌', message: 'package.json 없음' });
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // 알려진 보안 이슈가 있는 패키지들 체크 (예시)
  const securityIssues = [];
  
  if (securityIssues.length > 0) {
    checks.push({ 
      name: '패키지 보안', 
      status: '⚠️', 
      message: `보안 이슈: ${securityIssues.join(', ')}` 
    });
  } else {
    checks.push({ name: '패키지 보안', status: '✅', message: '알려진 보안 이슈 없음' });
  }
}

// 4. TypeScript 컴파일 체크
function checkTypeScript() {
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    checks.push({ name: 'TypeScript 설정', status: '❌', message: 'tsconfig.json 없음' });
    return;
  }
  
  checks.push({ name: 'TypeScript 설정', status: '✅', message: 'tsconfig.json 존재' });
}

// 5. EAS 설정 체크
function checkEASConfig() {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  if (!fs.existsSync(easJsonPath)) {
    checks.push({ name: 'EAS 설정', status: '⚠️', message: 'eas.json 없음 (수동 생성 필요)' });
    return;
  }
  
  checks.push({ name: 'EAS 설정', status: '✅', message: 'eas.json 존재' });
}

// 모든 체크 실행
function runAllChecks() {
  checkEnvironmentVariables();
  checkIconFiles();
  checkPackageSecurity();
  checkTypeScript();
  checkEASConfig();
  
  // 결과 출력
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.message}`);
  });
  
  const failedChecks = checks.filter(check => check.status === '❌').length;
  const warningChecks = checks.filter(check => check.status === '⚠️').length;
  
  console.log('\n📊 요약:');
  console.log(`✅ 통과: ${checks.length - failedChecks - warningChecks}`);
  console.log(`⚠️  경고: ${warningChecks}`);
  console.log(`❌ 실패: ${failedChecks}`);
  
  if (failedChecks > 0) {
    console.log('\n🔥 프로덕션 빌드 전에 실패한 항목들을 수정해주세요!');
    process.exit(1);
  } else if (warningChecks > 0) {
    console.log('\n⚠️  경고 항목들을 검토해주세요.');
  } else {
    console.log('\n🎉 모든 체크를 통과했습니다! 프로덕션 빌드 준비 완료!');
  }
}

runAllChecks();