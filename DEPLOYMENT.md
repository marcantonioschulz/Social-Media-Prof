# Deployment Guide - Social Media Compliance Platform

Komplette Anleitung zur Installation und Bereitstellung der Social Media Compliance Platform.

## Voraussetzungen

### Systemanforderungen
- **Betriebssystem**: Linux (Ubuntu 20.04+ empfohlen), macOS, oder Windows mit WSL2
- **RAM**: Mindestens 4GB (8GB empfohlen)
- **Festplatte**: Mindestens 20GB freier Speicherplatz
- **Netzwerk**: Offene Ports 80, 443 (optional: 3000, 5173, 5432, 6379, 9000, 9001 für Entwicklung)

### Software-Voraussetzungen
- Docker Engine 24.0+
- Docker Compose 2.0+
- Git
- OpenSSL (für Secret-Generierung)

### Installation der Voraussetzungen

#### Ubuntu/Debian
```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Neustart erforderlich für Docker-Gruppe
sudo reboot
```

#### macOS
```bash
# Docker Desktop installieren
brew install --cask docker

# Docker Desktop starten
open -a Docker
```

## Schnellstart (Entwicklung)

### 1. Repository klonen
```bash
git clone <repository-url>
cd Social-Media-Prof
```

### 2. Setup-Script ausführen
```bash
chmod +x setup.sh
./setup.sh
```

Das Script führt automatisch aus:
- Erstellt `.env` mit sicheren Secrets
- Baut Docker-Container
- Installiert Dependencies
- Führt Datenbank-Migrationen aus
- Erstellt Test-Benutzer

### 3. Anwendung aufrufen
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Dokumentation**: http://localhost/api/docs
- **MinIO Console**: http://localhost:9001

### 4. Login
Verwenden Sie einen der Test-Accounts:
- **Admin**: admin@example.com / Admin123!
- **Manager**: manager@example.com / Manager123!
- **Creator**: creator@example.com / Creator123!

## Produktions-Deployment

### 1. Server vorbereiten

#### Firewall konfigurieren
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

#### Swap-Speicher erstellen (falls wenig RAM)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei für Produktion:

```bash
cp .env.example .env
nano .env
```

**Wichtige Produktions-Einstellungen**:
```env
NODE_ENV=production

# Starke, einzigartige Secrets verwenden!
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
MINIO_SECRET_KEY=<strong-password>

# Ihre Domain
APP_URL=https://ihr-domain.de
CORS_ORIGIN=https://ihr-domain.de

# Email-Konfiguration (optional)
SMTP_HOST=smtp.ihre-email.de
SMTP_PORT=587
SMTP_USER=noreply@ihr-domain.de
SMTP_PASSWORD=<smtp-password>
```

**Secrets generieren**:
```bash
# Zufällige Secrets generieren
openssl rand -base64 64
```

### 3. SSL-Zertifikate einrichten

#### Option A: Let's Encrypt (Empfohlen)
```bash
# Certbot installieren
sudo apt-get update
sudo apt-get install certbot

# Zertifikat erstellen
sudo certbot certonly --standalone -d ihr-domain.de -d www.ihr-domain.de

# Zertifikate kopieren
sudo cp /etc/letsencrypt/live/ihr-domain.de/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/ihr-domain.de/privkey.pem nginx/ssl/key.pem
```

#### Option B: Selbstsigniertes Zertifikat (nur für Tests)
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 4. Nginx-Konfiguration anpassen

Bearbeiten Sie `nginx/conf.d/default.conf`:

```nginx
# Kommentieren Sie HTTP-Redirect ein und HTTPS-Server ein
server {
    listen 80;
    server_name ihr-domain.de www.ihr-domain.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ihr-domain.de www.ihr-domain.de;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest der Konfiguration...
}
```

### 5. Produktions-Docker-Compose

Erstellen Sie `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      target: production
    restart: always
    environment:
      NODE_ENV: production

  frontend:
    build:
      target: production
    restart: always

  postgres:
    restart: always
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data

  redis:
    restart: always
    volumes:
      - /var/lib/redis/data:/data

  minio:
    restart: always
    volumes:
      - /var/lib/minio/data:/data

  nginx:
    restart: always
```

### 6. Anwendung starten

```bash
# Container bauen und starten
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Logs überprüfen
docker-compose logs -f

# Status prüfen
docker-compose ps
```

### 7. Datenbank initialisieren

```bash
# Migrationen ausführen
docker-compose exec backend npm run migration:run

# Seed-Daten erstellen (Optional)
docker-compose exec backend npm run seed
```

## Backup und Wartung

### Datenbank-Backup

#### Automatisches tägliches Backup
```bash
# Backup-Script erstellen
cat > /usr/local/bin/backup-socialmedia.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/socialmedia"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL Backup
docker-compose exec -T postgres pg_dump -U socialmedia socialmedia > \
  $BACKUP_DIR/db_$DATE.sql

# MinIO Backup (optional)
docker-compose exec -T minio mc mirror minio/social-media-assets \
  $BACKUP_DIR/assets_$DATE

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "assets_*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-socialmedia.sh

# Cron-Job einrichten (täglich um 2 Uhr)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-socialmedia.sh") | crontab -
```

#### Manuelles Backup
```bash
# Datenbank sichern
docker-compose exec postgres pg_dump -U socialmedia socialmedia > backup.sql

# Datenbank wiederherstellen
cat backup.sql | docker-compose exec -T postgres psql -U socialmedia socialmedia
```

### Log-Rotation

```bash
# Logrotate konfigurieren
sudo tee /etc/logrotate.d/socialmedia <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF
```

### Updates durchführen

```bash
# Code aktualisieren
git pull origin main

# Container neu bauen und starten
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Migrationen ausführen
docker-compose exec backend npm run migration:run
```

## Monitoring

### Docker-Container überwachen

```bash
# Container-Status
docker-compose ps

# CPU und RAM Nutzung
docker stats

# Logs anzeigen
docker-compose logs -f [service-name]

# Letzte 100 Zeilen
docker-compose logs --tail=100 backend
```

### Gesundheits-Check

```bash
# API Health Check
curl http://localhost/health

# Backend API
curl http://localhost/api

# Datenbank-Verbindung
docker-compose exec postgres pg_isready -U socialmedia
```

## Troubleshooting

### Problem: Container startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Container neu starten
docker-compose restart backend

# Container neu bauen
docker-compose up -d --build backend
```

### Problem: Datenbank-Verbindungsfehler

```bash
# Datenbank-Status prüfen
docker-compose exec postgres pg_isready

# Verbindung testen
docker-compose exec postgres psql -U socialmedia -c "SELECT 1"

# Datenbank neu starten
docker-compose restart postgres
```

### Problem: Speicherplatz voll

```bash
# Docker Cleanup
docker system prune -a --volumes

# Alte Images löschen
docker image prune -a

# Logs löschen
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

### Problem: MinIO-Verbindungsfehler

```bash
# MinIO-Status prüfen
docker-compose logs minio

# MinIO neu starten
docker-compose restart minio

# Bucket manuell erstellen
docker-compose exec minio mc mb minio/social-media-assets
```

## Sicherheit

### Best Practices

1. **Starke Passwörter verwenden**
   - Mindestens 32 Zeichen für JWT Secrets
   - Zufällige Passwörter für alle Services

2. **Firewall konfigurieren**
   - Nur notwendige Ports öffnen
   - SSH-Zugriff beschränken

3. **SSL/TLS aktivieren**
   - Let's Encrypt verwenden
   - HTTPS erzwingen

4. **Regelmäßige Updates**
   - Docker Images aktualisieren
   - Sicherheits-Patches einspielen

5. **Backups**
   - Automatische tägliche Backups
   - Off-site Backup-Kopien

6. **Monitoring**
   - Logs überwachen
   - Alerts einrichten

### Security Headers

In `nginx/nginx.conf` sind bereits wichtige Security-Headers konfiguriert:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Rate Limiting

Nginx ist bereits mit Rate Limiting konfiguriert:
- API: 10 Anfragen/Sekunde
- Allgemein: 30 Anfragen/Sekunde

## Performance-Optimierung

### PostgreSQL Tuning

```bash
# postgresql.conf anpassen
docker-compose exec postgres bash -c "cat >> /var/lib/postgresql/data/postgresql.conf <<EOF
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
EOF"

# PostgreSQL neu starten
docker-compose restart postgres
```

### Redis Caching

Redis ist bereits für Session-Speicherung konfiguriert. Für zusätzliches Caching siehe Backend-Dokumentation.

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs -f`
2. GitHub Issues: [Repository-URL]/issues
3. Dokumentation: README.md

## Lizenz

MIT License - siehe LICENSE Datei
