# Development Commands

## Core Development Commands
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

## TypeScript Commands
```bash
npx tsc --noEmit           # Type check without emitting files
```

## EAS Commands
```bash
npm install -g @expo/eas-cli  # Install EAS CLI globally
eas login                     # Login to EAS
eas build:configure          # Configure EAS builds
eas build --platform all --profile preview    # Build preview
eas build --platform all --profile production # Build production
```

## Environment Setup
1. Copy `.env.example` to `.env`
2. Set required environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_GEMINI_API_KEY`
3. Optional: Set social auth variables for full functionality

## Project Reset
```bash
npm run reset-project      # Move starter code and create blank app directory
```