# Codebase Structure Overview

## Root Directory Structure
```
simplytodo/
├── app/                 # Expo Router file-based routing
├── components/          # Reusable UI components
├── lib/                 # Core business logic and services
├── types/              # TypeScript type definitions
├── contexts/           # React contexts
├── constants/          # App constants
├── themes/            # Theme configurations
├── hooks/             # Custom React hooks
├── assets/            # Images, fonts, static assets
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── prd/               # Product requirement documents
```

## Key Directories

### app/ (Expo Router)
- `(tabs)/`: Tab-based navigation screens
  - `index.tsx`: Home screen with todo list
  - `completed.tsx`: Completed todos screen
  - `settings.tsx`: Settings hub screen
- `auth/`: Authentication screens
- `_layout.tsx`: Root layout with navigation
- Individual screens: `statistics.tsx`, `notification-settings.tsx`, etc.

### lib/ (Core Services)
- **AI System**: `ai/` directory with provider pattern
  - `providers/`: Gemini, OpenAI implementations
  - `prompts/`: Category-specific prompt management
- **Database**: `supabase.ts` - Database operations and schema
- **Services**: Authentication, statistics, notifications, etc.
- **Utilities**: Logger, performance optimizer, security auditor

### components/
- `TodoItem.tsx`: Individual todo item component
- `AddTodo.tsx`: Todo creation with AI integration
- Various UI components and form elements

### Key Features by Directory
- **Hierarchical Todos**: `lib/supabase.ts` (subtaskUtils)
- **AI Integration**: `lib/ai/` (provider system)
- **Social Auth**: `lib/socialAuthService.ts`
- **Statistics**: `lib/statisticsService.ts`
- **Notifications**: `lib/notificationSettings.ts`
- **Recurring Tasks**: `lib/supabase.ts` (recurringUtils)

## Configuration Files
- `app.config.js`: Expo app configuration
- `eas.json`: EAS build configuration
- `tsconfig.json`: TypeScript configuration
- `eslint.config.js`: ESLint configuration
- `package.json`: Dependencies and scripts