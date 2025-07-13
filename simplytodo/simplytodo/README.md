## SimplyToDo: AI 기반 스마트 할 일 관리 앱

SimplyToDo는 단순한 할 일 관리에서 한 걸음 더 나아가,  
AI 기반 Taskmaster-AI 스타일의 스마트 ToDo 앱으로 발전하고 있습니다.

- AI 기반 태스크 분해/추천
- 자연어 입력 및 일정/우선순위 자동 추천
- 반복/루틴 자동화, 생산성 코칭 등

## SimplyToDo: Towards an AI-powered Smart ToDo App

SimplyToDo is evolving from a simple todo manager to an AI-powered,  
Taskmaster-AI style smart productivity app.

- AI-based task breakdown & recommendations
- Natural language input, schedule/priority suggestions
- Routine automation, productivity coaching, and more

# SimplyToDo App 📝

간단한 할 일 관리 앱입니다. 따뜻한 연두색 테마로 구성되어 있으며, 중요도에 따라 더 높은 녹색을 띄도록 만들어졌습니다.

This is a simple Todo management app built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/).

## Features

### 기본 기능
- TODO 리스트를 화면 상단에서 간단히 작성할 수 있습니다.
- 아래 생성된 TODO 항목을 오른쪽으로 슬라이드하면 삭제할 수 있습니다.
- TODO 항목을 왼쪽으로 슬라이드하면 완료 처리할 수 있습니다.
- 중요도 5단계에 따라 더 높은 녹색을 띄도록 구현되었습니다.

### 고급 기능
- **반복 작업**: 매일/매주/매월 반복되는 할 일을 자동으로 생성
- **3단계 하위 작업**: 할 일을 세분화하여 관리 (메인 → 서브 → 서브-서브)
- **카테고리 관리**: 색상별 카테고리로 할 일 분류
- **마감일 필터링**: 오늘/내일/지난/다음주 마감 항목 필터링
- **클라우드 동기화**: Supabase를 통한 실시간 데이터 동기화
- **로컬 알림**: 마감일 기반 알림 시스템

### 반복 작업 시스템
- **생성 방식**: RecurringRule 생성 시점에 모든 Task 인스턴스를 미리 생성
- **생성 범위**: start_date부터 end_date까지 (미설정 시 1년간)
- **최대 제한**: 100개 인스턴스까지 생성
- **삭제 옵션**: 규칙만 삭제 또는 규칙+모든 인스턴스 삭제 선택 가능
- **지원 패턴**: 매일, 매주(요일 선택), 매월(특정 날짜) 반복

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
