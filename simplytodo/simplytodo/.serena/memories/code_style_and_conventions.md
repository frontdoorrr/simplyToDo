# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled**: `"strict": true` in tsconfig.json
- **Path aliases**: `@/*` maps to project root
- **File naming**: camelCase for files, PascalCase for components

## ESLint Configuration
- **Config**: Uses `eslint-config-expo/flat`
- **Command**: `npm run lint`
- **Ignored**: `dist/*` directory

## Naming Conventions
- **Components**: PascalCase (e.g., `TodoItem.tsx`, `AddTodo.tsx`)
- **Services**: camelCase with Service suffix (e.g., `aiService`, `statisticsService`)
- **Types/Interfaces**: PascalCase (e.g., `Todo`, `Category`, `NotificationSettings`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEYS`, `DEFAULT_PROMPTS`)
- **Functions**: camelCase (e.g., `handleAddTodo`, `createTodo`)

## File Organization
- **Services**: Exported as default instances (e.g., `export default new StatisticsService()`)
- **Utilities**: Pure functions in lib/ directory
- **Components**: Default export for main component, named exports for related types
- **API modules**: Organized by domain (e.g., `todosApi`, `categoriesApi`)

## Import/Export Patterns
```typescript
// Services
export default new ServiceClass();

// Components
export default function ComponentName() { ... }
export type ComponentProps = { ... };

// Utilities
export function utilityFunction() { ... }
export const CONSTANT_VALUE = ...;
```

## Code Architecture Patterns
- **Provider Pattern**: AI services use abstract base class
- **Factory Pattern**: `createTodo` factory functions
- **Singleton Pattern**: Service instances
- **Context Pattern**: React contexts for global state

## Security Practices
- **No hardcoded secrets**: All sensitive data in environment variables
- **Secure storage**: Uses expo-secure-store for tokens
- **Input validation**: TypeScript types + runtime validation
- **API security**: Supabase RLS (Row Level Security) policies