# Contributing to Social Media Prof

Thank you for contributing\! Please follow these guidelines to maintain code quality.

## Development Workflow

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Social-Media-Prof

# Install root dependencies (Husky)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Pre-Commit Hooks

Husky is configured to run automatic checks before each commit:

✅ Backend TypeScript compilation (`npm run build`)
✅ Frontend TypeScript compilation (`npm run build`)

If either build fails, the commit will be blocked. **Fix errors before committing\!**

### 3. Development Checklist

Before committing, always:

- [ ] Run `npm run build` in backend
- [ ] Run `npm run build` in frontend
- [ ] Run `npm run lint` to check for linting errors
- [ ] Fix all TypeScript errors
- [ ] Remove unused imports and variables
- [ ] Test your changes locally

### 4. Git Commit Convention

Use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi-colons, etc
refactor: code restructuring
test: adding tests
chore: maintain dependencies, configs
```

Example:
```bash
git commit -m "fix: resolve TypeScript error in Modal component"
```

### 5. Pull Request Process

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push to GitHub: `git push origin feature/your-feature`
4. Create Pull Request
5. Wait for CI checks to pass ✅
6. Request review from team
7. Merge after approval

### 6. VS Code Setup

Install recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

Settings are configured in `.vscode/settings.json` for:
- ✅ Auto-fix on save
- ✅ Format on save
- ✅ TypeScript strict mode

### 7. CI/CD Pipeline

GitHub Actions automatically runs on every push:

- ✅ Backend build and lint
- ✅ Frontend build, lint, and type-check
- ✅ Docker image builds
- ✅ Tests (when available)

**All checks must pass before merging\!**

### 8. Common Issues

#### "Husky - command not found"
```bash
npm install
```

#### "TypeScript errors in build"
```bash
# Check errors
npm run build

# Auto-fix ESLint issues
npm run lint -- --fix
```

#### "Dependencies missing"
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 9. Code Quality Standards

- ✅ TypeScript strict mode enabled
- ✅ No `any` types
- ✅ No unused variables/imports
- ✅ Proper error handling
- ✅ Comments for complex logic
- ✅ Consistent formatting (Prettier)

### 10. Testing

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

## Questions?

Open an issue or ask in team chat\!
