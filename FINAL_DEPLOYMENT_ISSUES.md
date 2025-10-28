# 🚨 FINAL Deployment Issues - Requires Developer Fix

**Date**: October 28, 2025  
**Status**: Infrastructure ✅ Fixed | Application Code ❌ Broken  
**Root Cause**: TypeORM + Webpack incompatibility

---

## ✅ What We Fixed (Infrastructure)

### 1. Network Architecture (Now Correct per Server-Setup-Guide)
```yaml
# backend/postgres/redis/minio: ONLY backend network
# frontend: backend + frontend networks (acts as reverse proxy)
# backend: ONLY backend network (not exposed externally)
```

**Status**: ✅ Deployed and working

### 2. NPM Proxy Configuration
- NPM → Frontend (172.18.0.10 on frontend network)
- Frontend Nginx → Backend (via backend network hostname)
- Backend not directly accessible from NPM

**Status**: ✅ Configured correctly

### 3. Database Schema
- All 9 tables created
- 3 test users inserted (admin, manager, creator)
- Passwords: Admin123!, Manager123!, Creator123!

**Status**: ✅ Data ready

---

## ❌ What's Broken (Application Code)

### ERROR: "No metadata for User was found"

**Full Error**:
```
[Nest] ERROR [ExceptionsHandler] No metadata for "User" was found.
EntityMetadataNotFoundError: No metadata for "User" was found.
    at DataSource.getMetadata
    at Repository.findOne
    at UsersService.findByEmail
    at AuthService.login
```

**Root Cause**: Webpack bundles entities into single `main.js` file, but TypeORM cannot discover entity metadata at runtime.

**Why This Happens**:
1. `nest-cli.json` uses `webpack: true`
2. Webpack creates single bundle: `/app/dist/main.js`
3. `typeorm.config.ts` uses glob pattern: `join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')`
4. At runtime, `__dirname` is `/app/dist`, and glob finds NO files (everything is in bundle)
5. TypeORM has no entity metadata → crashes on first database query

---

## 🛠️ SOLUTION (Developer Must Implement)

**You have 3 options. Pick ONE:**

### OPTION A: Use TSC Instead of Webpack (Recommended)

**Change**: `backend/nest-cli.json`
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
    // Remove "webpack": true
  }
}
```

**Change**: `backend/src/config/typeorm.config.ts`
```typescript
entities: [join(__dirname, '..', 'modules', '**', '*.entity.js')],
// Use ONLY .js in production (not .ts)
```

**Why This Works**: TSC compiles files individually, preserving directory structure. TypeORM can find entities via glob.

**Test Before Pushing**:
```bash
npm run build
ls -R dist/modules/users/entities/  # Should see user.entity.js
docker compose build backend
docker compose up backend
docker logs -f socialmedia-backend  # Should NOT see metadata error
```

---

### OPTION B: Explicitly Import All Entities (Works with Webpack)

**Change**: `backend/src/config/typeorm.config.ts`
```typescript
import { User } from '../modules/users/entities/user.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { Post } from '../modules/posts/entities/post.entity';
import { Asset } from '../modules/assets/entities/asset.entity';
import { License } from '../modules/assets/entities/license.entity';
import { ApprovalWorkflow } from '../modules/approvals/entities/approval-workflow.entity';
import { ApprovalStep } from '../modules/approvals/entities/approval-step.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  // ... other config
  entities: [User, Organization, Post, Asset, License, ApprovalWorkflow, ApprovalStep, AuditLog],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  ssl: false,
});
```

**Why This Works**: Direct imports are resolved by Webpack at build time. No runtime glob needed.

**Downside**: Must update this list whenever you add new entities.

---

### OPTION C: Use NestJS AutoLoadEntities (Cleanest)

**Change**: `backend/src/app.module.ts`
```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...typeOrmConfigFactory(configService),
        autoLoadEntities: true,  // ← Add this
      }),
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

**Change**: `backend/src/config/typeorm.config.ts`
```typescript
export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  // ... other config
  autoLoadEntities: true,  // ← Add this
  // entities: [...], ← Remove glob pattern
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  ssl: false,
});
```

**Why This Works**: NestJS scans all `@Entity()` decorators automatically. Works with Webpack.

**Best Practice**: This is the official NestJS recommendation for production.

---

## 🎯 My Recommendation

**Use OPTION C (AutoLoadEntities)**

**Why**:
- ✅ Official NestJS pattern
- ✅ Works with Webpack (fast builds)
- ✅ No glob patterns (no runtime file scanning)
- ✅ Automatically finds new entities
- ✅ Clean and maintainable

**Implementation Time**: 5 minutes

---

## 📋 Testing Checklist

After implementing solution, test LOCALLY before pushing:

```bash
# 1. Clean build
cd backend
rm -rf dist node_modules
npm install
npm run build

# 2. Check output structure
ls -la dist/
# Webpack: single main.js file
# TSC: folder structure with .js files

# 3. Test in Docker
cd ..
docker compose build backend
docker compose up -d
sleep 10

# 4. Check logs for errors
docker logs socialmedia-backend | grep ERROR
# Should be EMPTY (no metadata errors)

# 5. Test login API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
# Should return: {"access_token":"...","refresh_token":"..."}

# 6. If successful, push
git add -A
git commit -m "fix: resolve TypeORM entity metadata issue with webpack"
git push
```

---

## 🚫 What NOT to Do

**Don't**:
- ❌ Use `synchronize: true` in production (data loss risk)
- ❌ Keep glob patterns with Webpack (won't work)
- ❌ Use `migrationsRun: true` with Webpack (migrations won't be found)
- ❌ Push without local testing

**Do**:
- ✅ Use `autoLoadEntities: true` (recommended)
- ✅ OR use TSC compiler instead of Webpack
- ✅ OR explicitly import all entities
- ✅ Test locally before pushing

---

## 📊 Current Production State

**Infrastructure**: ✅ Ready
- Networks configured correctly (frontend + backend external networks)
- NPM proxy working (Frontend on 172.18.0.10)
- Database healthy with all tables and test users
- Frontend container acting as reverse proxy to backend

**Application**: ❌ Broken
- Backend starts but crashes on first database query
- Error: "No metadata for User was found"
- Login returns 500 Internal Server Error

**Once Fixed**: Application will be immediately functional
- Login: admin@example.com / Admin123!
- API: https://socialmedia.cloud-schulz.de/api/*
- Docs: https://socialmedia.cloud-schulz.de/api/docs

---

## 🔗 Related Issues

None of these are actual problems anymore:
- ✅ Database schema created (manual SQL executed)
- ✅ Network architecture fixed (per server guide)
- ✅ NPM proxy configured (routing through frontend)
- ✅ Test users created (admin/manager/creator)

**Only issue**: TypeORM entity discovery with Webpack

---

## 💡 Long-Term Recommendation

Consider using **TypeORM DataMapper pattern** instead of ActiveRecord for large projects. It separates entities from database logic and works better with bundlers.

But for now, just use `autoLoadEntities: true` and move on.

---

**Next Step**: Implement OPTION C (autoLoadEntities), test locally, push to GitHub.

**ETA**: 10 minutes to fix + test + deploy
