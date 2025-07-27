# Apple Sign In 설정 가이드

SimplyToDo 앱에서 Apple Sign In을 사용하기 위한 Apple Developer 계정 설정 가이드입니다.

## 📋 목차
1. [Apple Developer 계정 준비](#apple-developer-계정-준비)
2. [App ID 구성](#app-id-구성)
3. [Sign in with Apple 설정](#sign-in-with-apple-설정)
4. [Supabase 연동 설정](#supabase-연동-설정)
5. [앱 설정 업데이트](#앱-설정-업데이트)
6. [테스트 및 검증](#테스트-및-검증)

## 🍎 Apple Developer 계정 준비

### 1단계: Apple Developer Program 가입
1. [Apple Developer](https://developer.apple.com) 사이트 접속
2. Apple ID로 로그인
3. Apple Developer Program 가입 ($99/년)
4. 계정 승인 대기 (보통 24-48시간)

### 2단계: 개발 환경 확인
- **macOS**: Apple Sign In 개발을 위해 필수
- **Xcode**: 최신 버전 권장
- **iOS Simulator**: iOS 13.0 이상

## 📱 App ID 구성

### 1단계: App ID 생성
1. [Apple Developer Console](https://developer.apple.com/account) 접속
2. "Certificates, Identifiers & Profiles" 선택
3. "Identifiers" → "+" 버튼 클릭
4. "App IDs" 선택 후 "Continue"

### 2단계: App ID 정보 입력
**기본 정보**:
- **Description**: `SimplyToDo`
- **Bundle ID**: `com.simplytodo.app` (app.config.js와 일치해야 함)
- **Platform**: iOS, macOS (필요시)

**Capabilities 설정**:
- ✅ **Sign In with Apple** - 필수 체크
- ✅ **Push Notifications** - 알림 기능용
- ✅ **Associated Domains** - 딥링크용 (선택사항)

### 3단계: App ID 등록
1. 설정 확인 후 "Continue"
2. "Register" 클릭하여 App ID 생성 완료

## 🔐 Sign in with Apple 설정

### 1단계: 서비스 ID 생성 (Supabase 연동용)
1. "Identifiers" → "+" 버튼 클릭
2. "Services IDs" 선택 후 "Continue"
3. 서비스 정보 입력:
   - **Description**: `SimplyToDo Web Service`
   - **Identifier**: `com.simplytodo.app.service`
4. "Sign In with Apple" 체크
5. "Configure" 클릭

### 2단계: 도메인 및 리턴 URL 설정
**Primary App ID**: 위에서 생성한 App ID 선택

**Website URLs**:
- **Domains**: `your-supabase-project.supabase.co`
- **Return URLs**: `https://your-supabase-project.supabase.co/auth/v1/callback`

**예시**:
```
Domains: abcdefghijk.supabase.co
Return URLs: https://abcdefghijk.supabase.co/auth/v1/callback
```

### 3단계: 개인 키 생성
1. "Keys" 섹션으로 이동
2. "+" 버튼 클릭
3. 키 정보 입력:
   - **Key Name**: `SimplyToDo Apple Sign In Key`
   - **Sign in with Apple** 체크
4. "Configure" 클릭 후 App ID 선택
5. "Save" → "Continue" → "Register"
6. **중요**: `.p8` 키 파일 다운로드 (한 번만 가능)
7. **Key ID** 기록 (나중에 Supabase 설정에 필요)

## 🔗 Supabase 연동 설정

### 1단계: Apple OAuth Provider 활성화
1. Supabase Dashboard → Authentication → Providers
2. "Apple" 선택
3. "Enable Sign in with Apple" 토글 활성화

### 2단계: Apple 설정 정보 입력
**Required Information**:
- **Client ID**: 서비스 ID (`com.simplytodo.app.service`)
- **Team ID**: Apple Developer 계정의 Team ID
- **Key ID**: 생성한 개인 키의 Key ID
- **Private Key**: 다운로드한 `.p8` 파일의 내용

**Team ID 찾는 방법**:
1. Apple Developer Console → Membership
2. "Team ID" 복사

**Private Key 설정**:
1. `.p8` 파일을 텍스트 에디터로 열기
2. 전체 내용을 복사하여 "Private Key" 필드에 입력

**Redirect URL**:
- 자동으로 설정됨: `https://your-project.supabase.co/auth/v1/callback`

## ⚙️ 앱 설정 업데이트

### app.config.js 업데이트
```javascript
export default ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: "com.simplytodo.app", // Apple Developer와 일치
      infoPlist: {
        ...config.ios.infoPlist,
        // Apple Sign In Capability 추가
        'com.apple.developer.applesignin': ['Default'],
      }
    },
    
    plugins: [
      ...config.plugins,
      // Apple Authentication 플러그인 추가
      [
        '@invertase/react-native-apple-authentication',
        {
          // iOS 13.0 이상 필요
          ios: {
            minimumVersion: '13.0'
          }
        }
      ]
    ]
  };
};
```

### entitlements 설정 (EAS Build)
`ios/SimplyToDo.entitlements` 파일 생성:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
</dict>
</plist>
```

## 🧪 테스트 및 검증

### 1단계: 개발 환경 테스트
```bash
# iOS 시뮬레이터에서 테스트 (iOS 13.0+)
npm run ios

# 실제 기기에서 테스트 (권장)
# Apple Sign In은 시뮬레이터에서 제한적으로 작동
```

### 2단계: Apple Sign In 기능 테스트
1. 앱에서 "Apple로 로그인" 버튼 클릭
2. Face ID/Touch ID 또는 비밀번호 인증
3. 이름/이메일 공유 선택
4. 로그인 성공 확인

### 3단계: 이메일 숨기기 기능 테스트
1. 첫 로그인 시 "이메일 숨기기" 선택
2. Apple이 생성한 릴레이 이메일 확인
3. 앱에서 올바른 사용자 정보 표시 확인

## ⚠️ 문제 해결

### 일반적인 오류들

#### 1. "Sign In with Apple is not available"
- **원인**: iOS 13 미만 또는 Apple Sign In 미지원 기기
- **해결**: iOS 13 이상 기기에서 테스트

#### 2. "Invalid client configuration"
- **원인**: Supabase 설정의 Client ID, Team ID, Key ID 불일치
- **해결**: Apple Developer Console 정보와 Supabase 설정 재확인

#### 3. "Invalid redirect URI"
- **원인**: Apple 서비스 ID의 Return URL 설정 오류
- **해결**: Supabase 프로젝트 URL과 Apple 설정 일치 확인

#### 4. "Private key error"
- **원인**: `.p8` 파일 내용이 올바르게 입력되지 않음
- **해결**: 파일 전체 내용(헤더 포함) 복사 확인

### 디버깅 방법
```bash
# iOS 기기/시뮬레이터 로그 확인
npx react-native log-ios

# Supabase 로그 확인
# Supabase Dashboard → Logs → Auth
```

## 📋 체크리스트

### 개발 전 준비
- [ ] Apple Developer Program 가입 및 승인
- [ ] App ID 생성 및 Sign In with Apple 활성화
- [ ] 서비스 ID 생성 및 도메인 설정
- [ ] 개인 키 생성 및 다운로드
- [ ] Team ID, Key ID 기록

### Supabase 설정
- [ ] Apple OAuth Provider 활성화
- [ ] Client ID, Team ID, Key ID 입력
- [ ] Private Key 내용 입력
- [ ] Redirect URL 확인

### 앱 설정
- [ ] app.config.js에 Apple Sign In 설정 추가
- [ ] Bundle Identifier 일치 확인
- [ ] iOS entitlements 파일 생성 (EAS Build 시)

### 테스트
- [ ] iOS 13+ 기기에서 Apple Sign In 테스트
- [ ] 이메일 숨기기 기능 테스트
- [ ] 사용자 정보 동기화 확인
- [ ] 로그아웃 기능 테스트

## 🔐 보안 고려사항

1. **개인 키 보안**: `.p8` 파일을 안전하게 보관하고 절대 Git에 커밋하지 마세요
2. **Team ID 보호**: Team ID는 민감한 정보이므로 환경 변수로 관리하세요
3. **Redirect URL 검증**: Supabase 설정의 Redirect URL이 정확한지 확인하세요
4. **앱 출시 전**: 테스트 계정으로 충분히 검증한 후 출시하세요

## 📚 참고 자료

- [Apple Sign In Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Apple Authentication Services](https://developer.apple.com/documentation/authenticationservices)
- [Supabase Apple OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [React Native Apple Authentication](https://github.com/invertase/react-native-apple-authentication)

## 📋 App Store 출시 요구사항

**중요**: iOS 앱에서 제3자 소셜 로그인을 제공하는 경우, Apple Sign In을 반드시 포함해야 합니다.

- ✅ Google 로그인을 제공하므로 Apple Sign In 필수
- ✅ Apple Sign In 버튼은 다른 소셜 로그인 버튼과 동등한 위치에 배치
- ✅ Apple 디자인 가이드라인 준수 필수

---

**문서 작성일**: 2025-01-24  
**최종 수정**: 2025-01-24  
**버전**: v1.0