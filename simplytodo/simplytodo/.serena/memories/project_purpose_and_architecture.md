# SimplyToDo - Project Purpose and Architecture

## Project Purpose
SimplyToDo is a React Native/Expo-based smart todo management app that is evolving into an AI-powered productivity app. It provides hierarchical task management with cloud synchronization, social authentication, and AI-based task assistance.

## Core Features
- **Hierarchical Tasks**: 3-level nesting (main → subtask → sub-subtask)
- **AI Integration**: Automated subtask generation using Gemini/OpenAI
- **Cloud Sync**: Supabase-powered real-time synchronization
- **Social Auth**: Google and Apple authentication
- **Categories**: Color-coded task categorization
- **Recurring Tasks**: Rule-based recurring task system
- **Smart Notifications**: Deadline-based local notifications
- **Statistics & Analytics**: Productivity insights with charts

## Technology Stack
- **Frontend**: React Native + Expo (~53.0.12) with TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (authentication, database, real-time sync)
- **AI Providers**: Gemini (primary), OpenAI (backup)
- **Charts**: react-native-chart-kit
- **Authentication**: @react-native-google-signin, @invertase/react-native-apple-authentication
- **Security**: expo-secure-store, expo-crypto
- **Notifications**: expo-notifications

## Architecture Overview
- **app/**: File-based routing with (tabs) layout
- **lib/**: Core business logic and services
  - **ai/**: Modular AI provider system with category-specific prompts
  - **supabase.ts**: Database operations and schema
- **components/**: Reusable UI components
- **types/**: TypeScript definitions
- **contexts/**: React contexts (AuthContext)

## Database Schema (Supabase)
- **todos**: Hierarchical tasks with parent_id relationships
- **categories**: User-defined categories with colors
- **recurring_rules**: Templates for recurring tasks
- **recurring_task_instances**: Generated recurring task instances

## Build System
- **EAS (Expo Application Services)** with three profiles:
  - `development`: Development builds
  - `preview`: Testing builds
  - `production`: Store-ready builds