# Task Completion Workflow

## Required Steps After Code Changes

### 1. Type Checking
```bash
npx tsc --noEmit
```
- **Purpose**: Ensure no TypeScript compilation errors
- **Required**: Always run before committing
- **Location**: Project root

### 2. Linting
```bash
npm run lint
```
- **Purpose**: Code style and quality checks
- **Config**: Uses eslint-config-expo
- **Required**: Fix all linting errors before production

### 3. Production Readiness Check
```bash
npm run production-check
```
- **Purpose**: Comprehensive pre-build validation
- **Checks**: Environment variables, icons, security, dependencies
- **Location**: `scripts/production-check.js`
- **Required**: Must pass all checks before production build

## Pre-Commit Checklist
- [ ] TypeScript compilation passes
- [ ] ESLint passes without errors
- [ ] All tests pass (if applicable)
- [ ] Environment variables properly configured
- [ ] No hardcoded secrets in code

## Pre-Production Checklist
- [ ] `npm run production-check` passes completely
- [ ] All critical security issues resolved
- [ ] App icons and assets in place
- [ ] EAS build configuration validated
- [ ] Social authentication properly configured

## Testing Strategy
- **Manual Testing**: Test core functionality on device/simulator
- **Integration Testing**: Use `IntegrationTester` class for comprehensive testing
- **Performance Testing**: Monitor with `PerformanceOptimizer` class

## Build Process
1. Run production check: `npm run production-check`
2. Build for preview: `npm run build:preview`
3. Test preview build thoroughly
4. Build for production: `npm run build:production`
5. Submit to stores: `npm run submit:all`