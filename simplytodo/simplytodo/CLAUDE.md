# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SimplyToDo is a React Native Todo management app built with Expo, evolving toward AI-powered smart features. The app uses Supabase for backend services and authentication.

## Development Commands

```bash
# Development
npm start                    # Start Expo development server
npx expo start              # Alternative start command
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npm run web                 # Run on web browser

# Code Quality
npm run lint                # Run ESLint for code quality checks

# Project Management
npm run reset-project       # Reset project to starter template

# Development Troubleshooting
npx expo start --clear      # Clear Metro cache and restart
npx expo start --reset-cache # Full cache reset for stubborn issues
```

## Architecture

### Core Structure
- **app/**: File-based routing (Expo Router)
  - `(tabs)/`: Tab-based navigation with index (main), completed, and explore screens
  - `auth/`: Authentication screens (login)
  - `_layout.tsx`: Root layout with authentication routing logic
- **components/**: Reusable UI components
  - `TodoItem.tsx`, `TodoList.tsx`, `AddTodo.tsx`: Core todo functionality
  - `CategoryManager.tsx`: Category management UI
  - `RecurringRuleForm.tsx`, `RecurringRuleManager.tsx`: Recurring task features
- **contexts/**: React Context providers
  - `AuthContext.tsx`: Supabase authentication state management
- **lib/**: Core utilities
  - `supabase.ts`: Supabase client configuration and API functions
  - `networkUtils.ts`: Network retry logic and utilities
- **types/**: TypeScript type definitions
  - `Todo.ts`: Todo and Category interfaces with factory functions
  - `RecurringRule.ts`: Recurring task type definitions

### Key Features
- **Todo Management**: Create, edit, delete, and complete todos with importance levels (1-5)
- **Hierarchical Subtasks**: 3-level task hierarchy (main → subtask → sub-subtask) with visual indentation
- **Categories**: Color-coded todo categorization with 5 default categories
- **Due Dates**: Deadline tracking with filtering and sorting
- **Progress Tracking**: Visual progress bars for subtask completion
- **Notifications**: Local notifications using expo-notifications
- **Supabase Integration**: Real-time sync with PostgreSQL backend
- **Authentication**: User authentication with protected routes and automatic token refresh

### Data Models

#### Todo Interface (Database Schema)
```typescript
interface TodoData {
  id?: string;
  text: string;
  completed: boolean;
  importance: number;        // 1-5 scale
  due_date: string | null;
  category_id: string | null;
  parent_id: string | null;  // For subtask hierarchy
  grade: number;             // 0: main, 1: subtask, 2: sub-subtask
  user_id?: string;
  created_at?: string;
}
```

#### Client-side Todo Interface
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  importance: number;        // 1-5 scale
  createdAt: number;
  dueDate: number | null;
  categoryId: string | null;
  parentId?: string | null;   // For subtasks
  grade?: number;             // Hierarchy level
  subtasks?: Todo[];          // Nested subtasks
}
```

#### Category Interface
```typescript
interface Category {
  id: string;
  name: string;
  color: string;
}
```

### Authentication Flow
- Uses Supabase auth with automatic routing in `app/_layout.tsx`
- Protected routes redirect to `/auth/login` if not authenticated
- Authenticated users redirected to `/(tabs)` from auth screens

### Supabase Configuration
- Platform-specific fetch wrapper with fallbacks (basic fetch for web, XMLHttpRequest for iOS simulator)
- Comprehensive network error handling and retry logic in `lib/networkUtils.ts`
- Platform-specific storage (AsyncStorage for mobile, localStorage for web)
- API functions organized by feature: `todosApi`, `categoriesApi`, `recurringRulesApi`
- Automatic token refresh with 10-minute interval checks
- Hierarchical query support for subtask relationships

### Color System
- Green-based theme with importance-based color intensity
- Defined in `constants/Colors.ts` as `TodoColors`
- Category colors defined in `types/Todo.ts` as `CategoryColors`

## Development Notes

- Uses Expo SDK ~53.0.12 with React Native 0.79.4
- TypeScript configuration in `tsconfig.json`
- ESLint configuration in `eslint.config.js`
- iOS project files in `ios/` directory for native builds
- Local notifications require permission handling in root layout

### Network & Platform Considerations
- iOS Simulator may require XMLHttpRequest fallback for network requests
- Web platform uses standard fetch without custom wrappers
- Network errors are categorized and handled with exponential backoff retry logic
- Cross-platform storage abstraction handles SSR and various environments

### Subtask System Architecture
- 3-level hierarchy: `grade` 0 (main) → 1 (subtask) → 2 (sub-subtask)
- Recursive UI components (`SubtaskList.tsx`) handle nested rendering
- Database relationships via `parent_id` foreign key
- Progress calculation considers all nested subtask completion states
- Visual indentation of 20px per level with grade-specific styling
- Tree-building utilities in `lib/supabase.ts` (`subtaskUtils`) for data transformation

### Authentication & Error Handling
- AuthContext provides automatic session management and token refresh
- Network errors are typed and categorized with `analyzeError()` function
- Retry logic with exponential backoff using `withRetry()` wrapper
- Platform-specific error handling for iOS Simulator and web environments
- Failed authentication automatically redirects to login screen

## Future Roadmap

The app is evolving toward AI-powered features including:
- Natural language task input with automatic breakdown
- Smart scheduling and priority recommendations
- Usage pattern analysis and productivity coaching
- Automatic categorization and routine suggestions