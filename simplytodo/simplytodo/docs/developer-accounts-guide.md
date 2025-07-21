# 📱 Apple Developer & Google Play Console 계정 준비 가이드

## 🍎 Apple Developer Program

### 1. 계정 신청
- **웹사이트**: https://developer.apple.com/programs/
- **비용**: $99/년 (USD)
- **승인 시간**: 1-2일 (신용카드 결제 시), 1-2주 (은행 이체 시)

### 2. 필요한 정보
- **Apple ID**: 기존 또는 새로 생성
- **법적 주체명**: 개인 또는 회사명
- **D-U-N-S 번호**: 회사인 경우 (무료 발급 가능)
- **결제 정보**: 신용카드 또는 은행 계좌

### 3. 등록 절차
1. Apple Developer 웹사이트 방문
2. "Enroll" 클릭
3. Apple ID로 로그인
4. 개인/조직 선택
5. 연락처 정보 입력
6. 결제 및 계약 동의
7. 이메일 인증 완료

### 4. App Store Connect 설정
- **웹사이트**: https://appstoreconnect.apple.com/
- 앱 메타데이터 입력
- 번들 ID 설정: `com.simplytodo.app`
- 카테고리: Productivity
- 연령 등급 설정

## 🤖 Google Play Console

### 1. 계정 신청
- **웹사이트**: https://play.google.com/console/
- **비용**: $25 (1회 등록비)
- **승인 시간**: 즉시 (결제 후)

### 2. 필요한 정보
- **Google 계정**: 기존 또는 새로 생성
- **개발자명**: 개인 또는 회사명
- **연락처 정보**: 주소, 전화번호, 이메일
- **결제 정보**: 신용카드

### 3. 등록 절차
1. Google Play Console 웹사이트 방문
2. Google 계정으로 로그인
3. "계정 만들기" 클릭
4. 개발자 프로필 작성
5. $25 등록비 결제
6. 개발자 배포 계약 동의

### 4. Play Console 설정
- 앱 생성 및 메타데이터 입력
- 패키지명 설정: `com.simplytodo.app`
- 카테고리: Productivity
- 콘텐츠 등급 설정

## 🔑 추가 설정 사항

### EAS CLI 설치 및 설정
```bash
# EAS CLI 설치
npm install -g @expo/eas-cli

# EAS 로그인
eas login

# 프로젝트 설정
eas build:configure
```

### 인증서 및 프로비저닝 프로필
- **iOS**: EAS가 자동으로 관리
- **Android**: EAS가 자동으로 키스토어 생성

### 프로젝트 ID 설정
```bash
# EAS 프로젝트 생성
eas project:init
```

## 📋 체크리스트

### Apple Developer Program
- [ ] Apple Developer 계정 생성 및 결제
- [ ] App Store Connect 접근 확인
- [ ] 번들 ID 등록: `com.simplytodo.app`
- [ ] 개발팀 ID 확인
- [ ] 앱 메타데이터 초안 작성

### Google Play Console
- [ ] Google Play Console 계정 생성 및 결제
- [ ] 개발자 프로필 완성
- [ ] 패키지명 등록: `com.simplytodo.app`
- [ ] 앱 메타데이터 초안 작성
- [ ] 콘텐츠 등급 완료

### EAS 설정
- [ ] EAS CLI 설치
- [ ] EAS 계정 생성 및 로그인
- [ ] 프로젝트 초기화
- [ ] 빌드 프로필 설정 (eas.json)

## 💡 팁 및 주의사항

### Apple Developer
- 개인 계정으로도 충분하지만, 회사 계정은 팀 관리 기능 제공
- DUNS 번호는 Dun & Bradstreet에서 무료로 발급 (1-2주 소요)
- 연간 갱신 필요 ($99/년)

### Google Play Console
- 개발자명은 변경이 어려우므로 신중히 선택
- 정책 위반 시 계정 정지 위험이 있으므로 가이드라인 숙지 필요
- 1회 등록비로 평생 사용 가능

### 공통 사항
- 두 플랫폼 모두 본인 인증이 필요할 수 있음
- 법인의 경우 사업자등록증 등 서류 제출 필요
- 앱 이름 중복 확인 필요 (SimplyToDo 사용 가능 여부)