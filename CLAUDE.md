# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run on web browser

# Code Quality
npm run lint                # Run ESLint
npm run production-check    # Validate production readiness

# Building & Deployment
npm run build:preview       # Build preview versions for testing
npm run build:production    # Build production versions (includes validation)
npm run submit:ios         # Submit to App Store
npm run submit:android     # Submit to Play Store
npm run submit:all         # Submit to both stores
```

## Architecture Overview

This is a React Native/Expo todo application with AI integration and cloud synchronization.

### Core Technologies
- **React Native + Expo** (~53.0.12) with TypeScript
- **Expo Router** for file-based navigation
- **Supabase** for authentication and database
- **AI Integration** via Gemini (primary) and OpenAI providers

### Key Directories
- `app/` - File-based routing with (tabs) layout
- `lib/ai/` - Modular AI provider system with prompts
- `lib/supabase.ts` - Database operations and schema
- `components/` - Reusable UI components
- `types/` - TypeScript definitions
- `contexts/` - React contexts (AuthContext)

### Database Schema (Supabase)
- `todos` - Hierarchical tasks (3 levels: main → subtask → sub-subtask)
- `categories` - User-defined categories with colors
- `recurring_rules` - Templates for recurring tasks
- `recurring_task_instances` - Generated recurring task instances

### AI System Architecture
The AI system uses a provider pattern in `lib/ai/providers/`:
- `base.ts` - Abstract provider interface
- `gemini.ts` - Gemini AI implementation (primary)
- `openai.ts` - OpenAI implementation (backup)

AI features include subtask generation, category suggestions, and task processing. Prompts are centralized in `lib/ai/prompts/`.

### Environment Configuration
Required environment variables (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`
- Optional: `EXPO_PUBLIC_OPENAI_API_KEY`

### Build System
Uses EAS (Expo Application Services) with three profiles:
- `development` - Development builds
- `preview` - Testing builds  
- `production` - Store-ready builds

Run `npm run production-check` before production builds to validate configuration, icons, and security.

### Todo System Features
- **Hierarchical Tasks**: 3-level nesting with parent-child relationships
- **Categories**: Color-coded user categories
- **Importance Levels**: 5-level scale (1=lowest, 5=highest)
- **Due Dates**: Full date/time support with timezone handling
- **Recurring Tasks**: Rule-based system generating up to 100 instances per rule
- **Real-time Sync**: Supabase-powered cloud synchronization

### Authentication Flow
Uses Supabase Auth with automatic routing:
- Unauthenticated users → `app/auth/` screens
- Authenticated users → `app/(tabs)/` screens
- Session managed via AuthContext

### Common Development Patterns
- Use existing components from `components/` directory
- Database operations go through `lib/supabase.ts`
- AI operations use the provider pattern in `lib/ai/`
- New screens follow Expo Router file-based convention
- TypeScript types are centralized in `types/` directory