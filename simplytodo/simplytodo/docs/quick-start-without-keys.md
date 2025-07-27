# 🚀 키 없이 빠른 시작 가이드

API 키나 서비스 설정 없이 SimplyToDo 앱을 바로 테스트해보는 방법입니다.

## ⚡ 즉시 실행하기

### 1단계: 환경 파일 설정
```bash
# 프로젝트 디렉토리로 이동
cd simplytodo/simplytodo

# 개발용 환경 파일 복사
cp .env.development .env
```

### 2단계: 앱 실행
```bash
# 의존성 설치 (한 번만)
npm install

# 개발 서버 시작
npm start

# 또는 플랫폼별로 실행
npm run web     # 웹 브라우저에서 실행
npm run ios     # iOS 시뮬레이터 (Mac에서만)
npm run android # Android 에뮬레이터
```

## 🔧 이 설정으로 할 수 있는 것

✅ **앱 기본 기능**:
- 할 일 추가/수정/삭제
- 카테고리 관리
- 중요도 설정
- 마감일 설정
- 서브태스크 관리
- 반복 작업 설정

✅ **UI/UX 테스트**:
- 모든 화면 탐색
- 애니메이션 확인
- 반응형 디자인 테스트

❌ **사용할 수 없는 기능**:
- 소셜 로그인 (Google, Apple)
- AI 기반 서브태스크 생성
- 클라우드 동기화
- 푸시 알림

## 📱 어떻게 작동하는가?

1. **소셜 로그인 버튼 숨김**: 환경 변수가 없으면 소셜 로그인 옵션이 표시되지 않음
2. **AI 기능 비활성화**: AI 서비스 키가 없으면 AI 관련 기능이 자동으로 비활성화
3. **로컬 데이터만 사용**: AsyncStorage를 사용한 로컬 데이터 저장만 작동

## 🔑 실제 기능을 사용하려면

### Supabase 설정 (클라우드 동기화)
1. [Supabase](https://supabase.com)에서 무료 프로젝트 생성
2. `.env` 파일에 URL과 anon key 추가:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### AI 기능 활성화
1. [Google AI Studio](https://aistudio.google.com)에서 Gemini API 키 생성 (무료)
2. `.env` 파일에 추가:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 소셜 로그인 설정
- 자세한 가이드: `docs/google-oauth-setup.md`, `docs/apple-signin-setup.md`

## ⚠️ 주의사항

- 이 설정은 **개발/테스트 목적만**을 위한 것입니다
- 프로덕션 배포 시에는 모든 서비스를 올바르게 설정해야 합니다
- 로컬 데이터는 앱을 삭제하면 사라집니다

## 🐛 문제 해결

### 앱이 시작되지 않는 경우
```bash
# 캐시 삭제 후 재시작
npx expo start --clear

# node_modules 재설치
rm -rf node_modules
npm install
npm start
```

### 특정 기능이 작동하지 않는 경우
1. 브라우저 개발자 도구에서 콘솔 로그 확인
2. 해당 기능에 필요한 API 키가 설정되어 있는지 확인
3. `docs/` 폴더의 상세 설정 가이드 참조

---

**이제 키 없이도 SimplyToDo의 핵심 기능을 테스트할 수 있습니다!** 🎉