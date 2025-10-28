# Social Media Compliance Platform

Eine professionelle Multi-Tenant Plattform für Unternehmen zur rechtssicheren Verwaltung und Dokumentation von Social Media Posts und deren Assets.

## Features

### Kern-Funktionalität
- 🏢 **Multi-Tenant Architecture** - Zentrale Hosting-Lösung mit vollständiger Datenisolation
- 📁 **Asset Management** - Upload und Verwaltung von Texten, Bildern, Audio und Video
- ✅ **Approval Workflow** - Mehrstufige Freigabeprozesse für Posts
- 📋 **Compliance & Audit** - Lückenlose Dokumentation aller Aktivitäten
- ⚖️ **Lizenz-Tracking** - Dokumentation von Nutzungsrechten und Lizenzen
- 🔒 **Rechtssichere Archivierung** - Export für rechtliche Nachweise
- 👥 **Role-Based Access Control** - Feingliedrige Berechtigungsverwaltung

### Technische Features
- 🚀 Moderne Microservice-Architektur
- 🔐 JWT-basierte Authentifizierung
- 📊 RESTful API
- 🐳 Docker-basiertes Deployment
- 📦 S3-kompatibles Storage (MinIO)
- 🔍 Volltextsuche
- 📈 Analytics & Reporting

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (Reverse Proxy)                │
│                      SSL/TLS, Rate Limiting                  │
└───────────────────┬─────────────────────┬───────────────────┘
                    │                     │
        ┌───────────▼──────────┐  ┌──────▼────────────┐
        │   Frontend (React)    │  │  Backend (NestJS) │
        │   - TypeScript        │  │  - REST API       │
        │   - Vite              │  │  - Multi-Tenant   │
        │   - Tailwind CSS      │  │  - Auth & RBAC    │
        └───────────────────────┘  └──────┬────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
            ┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
            │  PostgreSQL    │   │     MinIO      │   │     Redis      │
            │  - User Data   │   │  - File Storage│   │  - Cache       │
            │  - Metadata    │   │  - S3 API      │   │  - Sessions    │
            │  - Audit Logs  │   │                │   │                │
            └────────────────┘   └────────────────┘   └────────────────┘
```

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js Framework
- **TypeORM** - ORM für PostgreSQL
- **Passport.js** - Authentication
- **Class Validator** - Request Validation
- **Multer** - File Upload
- **Bull** - Job Queue für async Tasks

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TanStack Query** - Data Fetching
- **Zustand** - State Management
- **Tailwind CSS** - Styling
- **React Hook Form** - Form Management

### Infrastructure
- **PostgreSQL 16** - Relational Database
- **MinIO** - S3-compatible Object Storage
- **Redis** - Caching & Session Store
- **Nginx** - Reverse Proxy
- **Docker & Docker Compose** - Containerization

## Schnellstart

### Voraussetzungen
- Docker & Docker Compose
- Node.js 20+ (für lokale Entwicklung)
- Git

### Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd Social-Media-Prof
```

2. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Einstellungen
```

3. Mit Docker starten:
```bash
docker-compose up -d
```

4. Datenbank initialisieren:
```bash
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed
```

5. Anwendung öffnen:
- Frontend: http://localhost
- Backend API: http://localhost/api
- API Dokumentation: http://localhost/api/docs

### Entwicklung

Backend:
```bash
cd backend
npm install
npm run start:dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Datenmodell

### Hauptentitäten

- **Organization** - Unternehmen (Mandant)
- **User** - Benutzer mit Rollen
- **Post** - Social Media Post (Entwurf/Veröffentlicht)
- **Asset** - Medien-Datei (Bild, Audio, Video, Text)
- **License** - Lizenzinformation für Assets
- **ApprovalWorkflow** - Freigabeprozess
- **ApprovalStep** - Einzelner Freigabeschritt
- **AuditLog** - Unveränderliche Aktivitätsprotokolle

## Benutzerrollen

1. **Super Admin** - Platform-Administrator
2. **Organization Admin** - Unternehmens-Administrator
3. **Manager** - Genehmiger von Posts
4. **Creator** - Ersteller von Posts
5. **Viewer** - Nur Lesezugriff

## Sicherheit

- 🔐 JWT-basierte Authentifizierung mit Refresh Tokens
- 🛡️ Row-Level Security in PostgreSQL
- 🔒 Verschlüsselte Passwörter (bcrypt)
- 🚫 Rate Limiting
- 📝 Comprehensive Audit Logging
- 🔑 API Key Management für Integrationen
- 🌐 CORS Configuration
- 🔍 Input Validation & Sanitization

## API Dokumentation

Die vollständige API-Dokumentation ist über Swagger/OpenAPI verfügbar unter `/api/docs` nach dem Start der Anwendung.

### Wichtige Endpoints

```
POST   /api/auth/login              - Login
POST   /api/auth/register           - Registrierung
GET    /api/posts                   - Posts abrufen
POST   /api/posts                   - Post erstellen
POST   /api/assets/upload           - Asset hochladen
POST   /api/approvals/:id/approve   - Post genehmigen
GET    /api/audit-logs              - Audit Logs abrufen
GET    /api/organizations/export    - Compliance Export
```

## Deployment

### Produktion mit Docker Compose

1. SSL-Zertifikate erstellen (Let's Encrypt empfohlen)
2. Produktions `.env` konfigurieren
3. Deployment durchführen:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Backup-Strategie

1. **Datenbank**: Automatische PostgreSQL Backups
```bash
docker-compose exec postgres pg_dump -U postgres socialmedia > backup.sql
```

2. **Assets**: MinIO Bucket Sync
```bash
mc mirror minio/assets /backup/assets
```

## Lizenz

MIT License - siehe LICENSE Datei

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.

## Roadmap

- [ ] Mobile App (React Native)
- [ ] Social Media Platform Integrationen (Facebook, Instagram, LinkedIn, etc.)
- [ ] AI-basierte Content Suggestions
- [ ] Advanced Analytics Dashboard
- [ ] White-Label Options
- [ ] SSO/SAML Integration
- [ ] Multi-Language Support
