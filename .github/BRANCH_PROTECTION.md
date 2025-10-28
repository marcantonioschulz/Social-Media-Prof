# Branch Protection Rules

To enable branch protection on GitHub, follow these steps:

## Setup Instructions

1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable the following settings:

### Required Status Checks
✅ Require status checks to pass before merging
- ✅ backend-build
- ✅ frontend-build
- ✅ docker-build
- ✅ Require branches to be up to date before merging

### Pull Request Requirements
✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (optional)

### Additional Settings
✅ Require conversation resolution before merging
✅ Require signed commits (recommended)
✅ Require linear history
✅ Include administrators (enforce for all)

## Why These Rules?

**Status Checks:** Ensures code compiles and passes tests before merge
**PR Reviews:** Code quality through peer review
**Conversation Resolution:** All feedback addressed
**Linear History:** Clean git history without merge commits

## Direct Push Prevention

With these rules enabled:
- ❌ No direct pushes to `main`
- ✅ All changes must go through PR
- ✅ All CI checks must pass
- ✅ At least 1 approval required

This prevents broken code from reaching production\!
