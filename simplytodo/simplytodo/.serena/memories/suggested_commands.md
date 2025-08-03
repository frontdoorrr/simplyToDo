# Suggested Shell Commands

## System Commands (macOS/Darwin)
```bash
ls -la                     # List files with details
cd <directory>             # Change directory
pwd                        # Print working directory
find . -name "*.ts"        # Find TypeScript files
grep -r "pattern" .        # Search for pattern in files
du -sh node_modules        # Check node_modules size
```

## Git Commands
```bash
git status                 # Check repository status
git add .                  # Stage all changes
git commit -m "message"    # Commit with message
git push                   # Push to remote
git pull                   # Pull from remote
git branch                 # List branches
git checkout -b <branch>   # Create and switch to new branch
```

## Node.js/npm Commands
```bash
npm install               # Install dependencies
npm audit                 # Check for security vulnerabilities
npm audit fix             # Fix security vulnerabilities
npm ls                    # List installed packages
npm outdated              # Check for outdated packages
npm update                # Update packages
```

## Expo/React Native Commands
```bash
npx expo start            # Start Expo dev server
npx expo start --clear    # Start with cleared cache
npx expo install          # Install Expo-compatible packages
npx expo doctor           # Check project health
npx expo prebuild         # Generate native code
```

## EAS Commands
```bash
eas build --platform ios --profile development
eas build --platform android --profile preview
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
eas project:info          # Show project information
```

## Development Utilities
```bash
npx tsc --noEmit         # TypeScript type checking
npx eslint . --fix       # Run ESLint with auto-fix
npx prettier --write .   # Format code with Prettier
```

## File Operations
```bash
cat <file>               # Display file contents
head -n 20 <file>        # Show first 20 lines
tail -n 20 <file>        # Show last 20 lines
wc -l <file>             # Count lines in file
```

## Process Management
```bash
ps aux | grep node       # Find running Node processes
kill <pid>               # Kill process by PID
killall node             # Kill all Node processes
lsof -i :3000           # Check what's using port 3000
```