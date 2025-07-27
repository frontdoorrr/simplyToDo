# Google OAuth 2.0 설정 가이드

SimplyToDo 앱에서 Google 소셜 로그인을 사용하기 위한 Google Cloud Console 설정 가이드입니다.

⚠️ **중요**: 이 설정을 완료해야 앱이 정상적으로 실행됩니다. `iosUrlScheme` 에러를 방지하려면 환경 변수를 올바르게 설정해야 합니다.

## 📋 목차
1. [Google Cloud Project 생성](#google-cloud-project-생성)
2. [OAuth 2.0 클라이언트 ID 생성](#oauth-20-클라이언트-id-생성)
3. [Android 설정](#android-설정)
4. [iOS 설정](#ios-설정)
5. [환경 변수 설정](#환경-변수-설정)
6. [빠른 임시 설정](#빠른-임시-설정)
7. [테스트 및 검증](#테스트-및-검증)

## 🚀 Google Cloud Project 생성

### 1단계: Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 구글 계정으로 로그인

### 2단계: 새 프로젝트 생성
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 정보 입력:
   - **프로젝트 이름**: `SimplyToDo`
   - **조직**: 개인 계정 사용 시 선택 안함
   - **위치**: 기본값 유지
4. "만들기" 클릭

### 3단계: Google Sign-In API 활성화
1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. "Google Sign-In API" 검색
3. "Google Sign-In API" 클릭
4. "사용 설정" 클릭

## 🔑 OAuth 2.0 클라이언트 ID 생성

### 1단계: OAuth 동의 화면 설정
1. 좌측 메뉴에서 "API 및 서비스" > "OAuth 동의 화면" 선택
2. 사용자 유형 선택:
   - **외부**: 모든 Google 계정 사용자가 로그인 가능
   - **내부**: 조직 내부 사용자만 로그인 가능 (개인 개발자는 선택 불가)
3. "외부" 선택 후 "만들기" 클릭

### 2단계: 앱 정보 입력
**필수 정보**:
- **앱 이름**: `SimplyToDo`
- **사용자 지원 이메일**: 본인 이메일 주소
- **앱 로고**: (선택사항) 앱 아이콘 업로드
- **앱 도메인**: (선택사항)
  - 홈페이지: `https://simplytodo.app` (예시)
  - 개인정보처리방침: `https://simplytodo.app/privacy` (예시)
  - 서비스 약관: `https://simplytodo.app/terms` (예시)
- **승인된 도메인**: (선택사항)
- **개발자 연락처 정보**: 본인 이메일 주소

### 3단계: 범위 설정
1. "범위" 단계에서 "범위 추가 또는 삭제" 클릭
2. 다음 범위 선택:
   - `../auth/userinfo.email` - 이메일 주소 조회
   - `../auth/userinfo.profile` - 기본 프로필 정보 조회
   - `openid` - OpenID Connect 인증
3. "업데이트" 클릭

### 4단계: 테스트 사용자 추가 (개발 중)
1. "테스트 사용자" 단계에서 "사용자 추가" 클릭
2. 테스트에 사용할 Gmail 주소 입력
3. "저장 후 계속" 클릭

### 5단계: OAuth 클라이언트 ID 생성
1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. 상단의 "+ 사용자 인증 정보 만들기" 클릭
3. "OAuth 클라이언트 ID" 선택

## 📱 Android 설정

### 1단계: Android 클라이언트 생성
1. 애플리케이션 유형: **Android** 선택
2. 정보 입력:
   - **이름**: `SimplyToDo Android`
   - **패키지 이름**: `com.simplytodo.app` (app.config.js의 android.package와 일치)

### 2단계: SHA-1 인증서 지문 생성
개발용 키스토어의 SHA-1 지문을 생성해야 합니다.

```bash
# 개발용 키스토어 (디버그)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# 프로덕션용 키스토어 (EAS Build 사용 시)
# EAS CLI에서 자동 생성된 키스토어 정보 사용
eas credentials
```

### 3단계: SHA-1 지문 등록
1. 생성된 SHA-1 지문을 복사
2. Google Cloud Console의 Android 클라이언트 설정에서 "SHA-1 인증서 지문" 필드에 입력
3. "만들기" 클릭

## 🍎 iOS 설정

### 1단계: iOS 클라이언트 생성
1. 애플리케이션 유형: **iOS** 선택
2. 정보 입력:
   - **이름**: `SimplyToDo iOS`
   - **번들 ID**: `com.simplytodo.app` (app.config.js의 ios.bundleIdentifier와 일치)

### 2단계: URL 스킴 설정
1. 생성된 iOS 클라이언트의 "클라이언트 ID"를 복사
2. 이 ID는 나중에 URL 스킴으로 사용됩니다 (역순으로)

## 🌐 웹 클라이언트 생성 (Supabase 연동용)

### 1단계: 웹 애플리케이션 클라이언트 생성
1. 애플리케이션 유형: **웹 애플리케이션** 선택
2. 정보 입력:
   - **이름**: `SimplyToDo Web (Supabase)`
   - **승인된 자바스크립트 원본**: 
     - `http://localhost:3000` (개발용)
     - `https://your-supabase-project.supabase.co` (프로덕션용)
   - **승인된 리디렉션 URI**:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`

## ⚙️ 환경 변수 설정

생성된 클라이언트 ID들을 `.env` 파일에 설정합니다:

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android-client-id.apps.googleusercontent.com
```

### 클라이언트 ID 찾는 방법
1. Google Cloud Console > "API 및 서비스" > "사용자 인증 정보"
2. 생성된 OAuth 2.0 클라이언트 ID 목록에서 각각 클릭
3. "클라이언트 ID" 복사하여 해당 환경 변수에 설정

## 📲 앱 설정 업데이트

### app.config.js 업데이트
```javascript
export default {
  expo: {
    // ... 기존 설정
    
    android: {
      package: "com.simplytodo.app", // Google Console과 동일해야 함
      googleServicesFile: "./google-services.json", // 향후 FCM 사용 시
      // ... 기존 설정
    },
    
    ios: {
      bundleIdentifier: "com.simplytodo.app", // Google Console과 동일해야 함
      // URL 스킴 추가 (Google Sign-In용)
      scheme: "com.simplytodo.app",
      // ... 기존 설정
    },
    
    // Google Sign-In URL 스킴 추가
    scheme: [
      "com.simplytodo.app",
      // iOS 클라이언트 ID를 역순으로 (com.googleusercontent.apps.CLIENT_ID)
      "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
    ]
  }
};
```

## 🚀 빠른 임시 설정 (개발용)

만약 Google OAuth 설정이 아직 완료되지 않았다면, 다음과 같이 임시 설정으로 앱을 실행할 수 있습니다:

### .env 파일 생성
```bash
# .env 파일을 복사하고 기본값 설정
cp .env.example .env
```

### 임시 환경 변수 설정
`.env` 파일에 다음과 같이 설정하세요:
```bash
# Supabase (필수)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# AI (선택)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key

# Google OAuth (임시 - 실제 로그인은 작동하지 않음)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-placeholder.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios-placeholder.apps.googleusercontent.com
```

이렇게 설정하면 앱이 시작되지만, Google 로그인 기능은 실제로 작동하지 않습니다. 실제 Google 로그인을 사용하려면 위의 전체 설정 과정을 완료해야 합니다.

## 🧪 테스트 및 검증

### 1단계: 설정 검증
```bash
# 패키지 설치 확인
npm list @react-native-google-signin/google-signin

# 환경 변수 확인
echo $EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
```

### 2단계: 개발 서버 테스트
```bash
# Expo 개발 서버 시작
npm start

# Android에서 테스트
npm run android

# iOS에서 테스트 (Mac에서만)
npm run ios
```

### 3단계: Google 로그인 테스트
1. 앱에서 Google 로그인 버튼 클릭
2. Google 계정 선택 화면 확인
3. 권한 동의 화면 확인
4. 로그인 성공 후 사용자 정보 표시 확인

## ⚠️ 문제 해결

### 일반적인 오류들

#### 1. "Google Play Services not available"
- **원인**: Android 에뮬레이터에 Google Play Services 미설치
- **해결**: Google Play가 포함된 AVD 사용 또는 실제 기기에서 테스트

#### 2. "Invalid client ID"
- **원인**: 클라이언트 ID 불일치 또는 잘못된 설정
- **해결**: 환경 변수와 Google Console 설정 재확인

#### 3. "Package name mismatch"
- **원인**: app.config.js의 패키지명과 Google Console 설정 불일치
- **해결**: 두 설정이 정확히 일치하는지 확인

#### 4. "SHA-1 fingerprint mismatch"
- **원인**: 등록된 SHA-1 지문과 실제 앱 서명 불일치
- **해결**: 정확한 키스토어의 SHA-1 지문 재등록

### 로그 확인 방법
```bash
# React Native 로그 확인
npx react-native log-android  # Android
npx react-native log-ios      # iOS

# Expo 로그 확인
expo logs
```

## 📚 참고 자료

- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 🔐 보안 고려사항

1. **클라이언트 시크릿 보호**: 클라이언트 시크릿은 절대 앱에 포함하지 마세요
2. **환경 변수 관리**: `.env` 파일을 Git에 커밋하지 마세요
3. **범위 최소화**: 필요한 최소한의 권한만 요청하세요
4. **테스트 계정**: 프로덕션 환경에서는 테스트 사용자 제한을 해제하세요

---

**문서 작성일**: 2025-01-24  
**최종 수정**: 2025-01-24  
**버전**: v1.0