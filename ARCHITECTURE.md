# Architektur-Dokumentation - Social Media Compliance Platform

## Überblick

Die Social Media Compliance Platform ist eine moderne, skalierbare Multi-Tenant SaaS-Anwendung für Unternehmen zur rechtssicheren Verwaltung von Social Media Posts.

## Technologie-Stack

### Backend
- **Framework**: NestJS 10 (Node.js 20)
- **Sprache**: TypeScript 5.3
- **Datenbank**: PostgreSQL 16
- **ORM**: TypeORM 0.3
- **Cache**: Redis 7
- **Storage**: MinIO (S3-kompatibel)
- **Authentication**: JWT (Passport.js)
- **Validation**: Class Validator/Transformer
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Sprache**: TypeScript 5.3
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Server State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt (Certbot)

## Architektur-Patterns

### Multi-Tenant Architecture

Die Plattform verwendet eine **Shared Database, Shared Schema** Strategie mit Row-Level Isolation:

```
Organization 1 ─┐
Organization 2 ─┼─> PostgreSQL (Single Database)
Organization 3 ─┘   └─> Row-Level Security via organizationId
```

**Vorteile:**
- Einfache Wartung
- Kosteneffizient
- Einfache Backups
- Gute Performance für kleine/mittlere Mandanten

**Isolation:**
- Jede Query enthält `WHERE organizationId = ?`
- TypeORM Interceptors erzwingen Tenant-Filter
- JWT enthält organizationId
- Automatische Validierung in Guards

### API-First Design

```
┌─────────────────────────────────────────┐
│           REST API (NestJS)              │
│  - OpenAPI Documentation                 │
│  - Versioned Endpoints (/api/v1)         │
│  - Standardized Responses                │
└─────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    React App         Future: Mobile App
```

**Best Practices:**
- Konsistente Fehlerbehandlung
- Standardisierte Response-Formate
- Pagination für Listen
- Filtering & Sorting
- API-Dokumentation mit Swagger

### Microservices-Ready Architecture

Obwohl aktuell als Monolith deployed, ist die Architektur für eine spätere Aufteilung vorbereitet:

```
Current (Monolith):
┌──────────────────────────────────────┐
│         NestJS Application            │
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │  Auth  │ │ Posts  │ │  Assets  │ │
│  │ Module │ │ Module │ │  Module  │ │
│  └────────┘ └────────┘ └──────────┘ │
└──────────────────────────────────────┘

Future (Microservices):
┌──────────┐ ┌──────────┐ ┌──────────┐
│   Auth   │ │  Posts   │ │  Assets  │
│ Service  │ │ Service  │ │ Service  │
└──────────┘ └──────────┘ └──────────┘
      │            │            │
      └────────────┴────────────┘
               Message Queue
```

## Datenmodell

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │
│  - name         │
│  - slug         │
│  - settings     │
└────────┬────────┘
         │ 1
         │
         │ n
┌────────▼────────┐
│      User       │
│  - email        │
│  - role         │
│  - password     │
└────────┬────────┘
         │ 1
         │
         │ n
┌────────▼────────┐         ┌─────────────────┐
│      Post       │◄────────┤ ApprovalWorkflow│
│  - title        │ 1     1 │  - status       │
│  - content      │         │  - steps        │
│  - status       │         └─────────────────┘
│  - platform     │
└────────┬────────┘
         │ 1
         │
         │ n
┌────────▼────────┐         ┌─────────────────┐
│     Asset       │ 1     1 │     License     │
│  - type         ├─────────┤  - type         │
│  - fileName     │         │  - holder       │
│  - fileUrl      │         │  - terms        │
└─────────────────┘         └─────────────────┘

        All Entities
             │
             │ n
             ▼
      ┌─────────────┐
      │  AuditLog   │
      │  - action   │
      │  - metadata │
      └─────────────┘
```

### Entitäten im Detail

#### Organization (Mandant)
- Haupt-Tenant Entity
- Jede Organization ist isoliert
- Kann eigene Settings haben
- Verwaltet Users, Posts, Assets

#### User
- Rollenbasierte Zugriffskontrolle (RBAC)
- Rollen: SUPER_ADMIN, ORGANIZATION_ADMIN, MANAGER, CREATOR, VIEWER
- Gehört zu genau einer Organization
- Kann mehrere Posts erstellen

#### Post
- Zentrale Content-Entity
- Status-Workflow: Draft → Pending → Approved → Published
- Unterstützt verschiedene Plattformen
- Hat Approval Workflow

#### Asset
- Medien-Dateien (Bilder, Videos, Audio, Text)
- Gespeichert in MinIO (S3)
- Metadaten in PostgreSQL
- Optional: Lizenzinformationen

#### ApprovalWorkflow
- Multi-Step Approval Process
- Jeder Step hat einen Approver
- Status-Tracking

#### AuditLog
- Unveränderlich (Append-Only)
- Jede wichtige Aktion wird geloggt
- Für Compliance und Debugging

## Sicherheitskonzept

### Authentication & Authorization

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/login
     │ { email, password }
     ▼
┌────────────────┐
│  Auth Service  │
│  - Validate    │
│  - Hash Check  │
└────┬───────────┘
     │ Generate JWT
     │ { userId, organizationId, role }
     ▼
┌──────────┐
│  Client  │ Stores token in localStorage
└────┬─────┘
     │ Subsequent Requests
     │ Authorization: Bearer <token>
     ▼
┌─────────────┐
│ JWT Guard   │ Validates & Decodes Token
└────┬────────┘
     │
     ▼
┌─────────────┐
│ Roles Guard │ Checks User Role
└────┬────────┘
     │
     ▼
┌─────────────┐
│  Controller │ Processes Request
└─────────────┘
```

**Security Features:**
- Bcrypt Password Hashing (12 rounds)
- JWT with short expiration (15 min)
- Refresh Tokens (7 days)
- Rate Limiting (Nginx + Throttler)
- CORS Configuration
- Security Headers (Helmet)
- Input Validation (Class Validator)
- SQL Injection Prevention (TypeORM)
- XSS Prevention (React automatic escaping)

### Multi-Tenant Security

Jede Anfrage wird durch mehrere Sicherheitsschichten gefiltert:

1. **JWT Guard**: Validiert Token, extrahiert organizationId
2. **Tenant Interceptor**: Fügt automatisch `WHERE organizationId = ?` zu Queries hinzu
3. **Service Layer**: Validiert explizit Tenant-Zugriff
4. **Controller Guards**: Rollenbasierte Zugriffskontrolle

```typescript
// Beispiel: Tenant-sichere Query
async findAllPosts(userId: string, organizationId: string) {
  return this.postRepository.find({
    where: {
      organizationId, // Automatische Isolation
      createdById: userId,
    },
  });
}
```

## Datenfluss

### Post-Erstellung mit Assets

```
┌────────────┐
│  Frontend  │
└──────┬─────┘
       │ 1. Upload Assets
       ▼
┌─────────────────────┐
│  POST /api/assets   │
│  - Validate File    │
│  - Upload to MinIO  │
│  - Save Metadata    │
└──────┬──────────────┘
       │ Returns assetIds
       │
       │ 2. Create Post
       ▼
┌─────────────────────┐
│  POST /api/posts    │
│  - Validate Data    │
│  - Link Assets      │
│  - Create Post      │
└──────┬──────────────┘
       │
       │ 3. Create Approval Workflow
       ▼
┌─────────────────────────────┐
│  POST /api/approvals        │
│  - Create Workflow          │
│  - Create Approval Steps    │
│  - Assign Approvers         │
└──────┬──────────────────────┘
       │
       │ 4. Notify Approvers (Future)
       ▼
┌─────────────────────┐
│  Email/Push Service │
└─────────────────────┘
```

### Approval Process

```
Post Status: DRAFT
      │
      │ Submit for Approval
      ▼
Status: PENDING_APPROVAL
Workflow: Step 1 (Manager)
      │
      │ Manager Approves
      ▼
Workflow: Step 2 (Admin)
      │
      │ Admin Approves
      ▼
Status: APPROVED
      │
      │ Publish
      ▼
Status: PUBLISHED
```

## Storage-Strategie

### File Storage (MinIO)

```
MinIO Bucket: social-media-assets
│
├── {organizationId}/
│   ├── posts/
│   │   └── {postId}/
│   │       ├── image-uuid-1.jpg
│   │       ├── video-uuid-2.mp4
│   │       └── audio-uuid-3.mp3
│   │
│   ├── assets/
│   │   ├── image-uuid-4.jpg
│   │   └── document-uuid-5.pdf
│   │
│   └── temp/
│       └── upload-uuid-6.tmp
```

**Vorteile von MinIO:**
- S3-kompatible API
- Self-hosted (keine Cloud-Kosten)
- Horizontal skalierbar
- Versioning möglich
- Encryption at rest

### Metadaten-Storage (PostgreSQL)

Datei-Metadaten werden in PostgreSQL gespeichert:
- File Path (für MinIO)
- File URL (Presigned URL)
- Checksum (SHA256)
- MIME Type
- File Size
- Upload Date
- Organization ID

## Skalierbarkeit

### Horizontal Scaling

```
Load Balancer (Nginx)
        │
        ├─> Backend Instance 1
        ├─> Backend Instance 2
        └─> Backend Instance 3
              │
              ├─> PostgreSQL (Primary/Replica)
              ├─> Redis (Cluster)
              └─> MinIO (Distributed)
```

**Skalierungs-Optionen:**

1. **Backend**: Stateless, kann beliebig skaliert werden
2. **Frontend**: Über CDN ausliefern
3. **PostgreSQL**: Read Replicas für Lesezugriffe
4. **Redis**: Redis Cluster für Caching
5. **MinIO**: Distributed Mode für Objektspeicher

### Caching-Strategie

**Aktuelle Implementierung:**
- Redis für Session-Storage
- Browser-Caching für statische Assets

**Zukünftige Optimierungen:**
- Query-Result Caching in Redis
- CDN für Asset-Auslieferung
- Service Worker für Offline-Fähigkeit

## Monitoring & Observability

### Logging

**Structured Logging:**
```typescript
logger.log({
  level: 'info',
  timestamp: new Date(),
  service: 'posts-service',
  action: 'create-post',
  userId: user.id,
  organizationId: user.organizationId,
  metadata: { postId: post.id },
});
```

**Log-Levels:**
- ERROR: Fehler, die sofortige Aufmerksamkeit erfordern
- WARN: Potenzielle Probleme
- INFO: Wichtige Events (Logins, Post-Erstellung)
- DEBUG: Detaillierte Informationen (nur Development)

### Audit Trail

Jede wichtige Aktion wird in `audit_logs` gespeichert:
- Wer (userId)
- Was (action)
- Wann (timestamp)
- Wo (IP, User-Agent)
- Vorher/Nachher (oldValues, newValues)

**DSGVO-Konform:**
- Automatische Löschung nach X Tagen (konfigurierbar)
- Anonymisierung möglich
- Export-Funktion

## Performance-Optimierungen

### Datenbank

**Indizes:**
```sql
CREATE INDEX idx_posts_organization ON posts(organizationId);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organizationId, createdAt);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assets_post ON assets(postId);
```

**Query-Optimierung:**
- Lazy Loading für Relations
- Pagination für alle Listen
- Connection Pooling
- Query Result Caching (geplant)

### Frontend

**Code Splitting:**
```typescript
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PostsPage = lazy(() => import('./pages/PostsPage'));
```

**Optimierungen:**
- React.memo für teure Komponenten
- useMemo für berechnete Werte
- Virtual Scrolling für lange Listen
- Image Lazy Loading
- Webpack Bundle Analyzer

## Erweiterbarkeit

### Plugin-System (Geplant)

```typescript
interface Plugin {
  name: string;
  version: string;
  hooks: {
    beforePostCreate?: (post: Post) => Post;
    afterPostPublish?: (post: Post) => void;
  };
}
```

### Webhook-System (Geplant)

```typescript
interface Webhook {
  url: string;
  events: WebhookEvent[];
  secret: string;
}

enum WebhookEvent {
  POST_CREATED = 'post.created',
  POST_PUBLISHED = 'post.published',
  APPROVAL_REQUIRED = 'approval.required',
}
```

### Social Media Integration (Roadmap)

```typescript
interface SocialMediaProvider {
  name: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
  authenticate(credentials: Credentials): Promise<Token>;
  publish(post: Post, token: Token): Promise<PublishResult>;
  getAnalytics(postId: string): Promise<Analytics>;
}
```

## Testing-Strategie

### Backend Tests

```
tests/
├── unit/          # Service/Controller Tests
├── integration/   # API Integration Tests
└── e2e/          # End-to-End Tests
```

**Coverage-Ziel:** 80%+

### Frontend Tests

```
tests/
├── components/    # Component Tests (React Testing Library)
├── hooks/        # Custom Hook Tests
└── e2e/          # Cypress/Playwright Tests
```

## Deployment-Strategien

### Blue-Green Deployment

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌──▼──┐
│Green│  │Blue │
│(Old)│  │(New)│
└─────┘  └─────┘

1. Deploy New Version → Blue
2. Test Blue
3. Switch Traffic → Blue
4. Keep Green for Rollback
```

### Rolling Updates (Docker Swarm/Kubernetes)

```yaml
update_config:
  parallelism: 2
  delay: 10s
  failure_action: rollback
  monitor: 60s
```

## Compliance & DSGVO

### Datenschutz-Features

1. **Recht auf Auskunft**: Export-Funktion für User-Daten
2. **Recht auf Löschung**: Anonymisierung oder komplette Löschung
3. **Recht auf Datenübertragbarkeit**: JSON/CSV Export
4. **Datenminimierung**: Nur notwendige Daten speichern
5. **Datensicherheit**: Verschlüsselung, Zugriffskontrollen

### Audit & Compliance

- Vollständiger Audit Trail
- Unveränderliche Logs
- Rechtssichere Archivierung
- Compliance-Export-Funktion
- DSGVO-konforme Datenaufbewahrung

## Zukunfts-Roadmap

### Phase 2 (Q2 2025)
- [ ] Social Media Platform Integrationen
- [ ] AI-basierte Content Suggestions
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)

### Phase 3 (Q3 2025)
- [ ] White-Label Options
- [ ] SSO/SAML Integration
- [ ] Multi-Language Support
- [ ] Advanced Reporting

### Phase 4 (Q4 2025)
- [ ] Microservices Migration
- [ ] GraphQL API
- [ ] Real-time Collaboration
- [ ] Video Processing Pipeline

## Lizenz

MIT License
