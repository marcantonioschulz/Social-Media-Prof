#!/bin/bash

# Social Media Compliance Platform - Setup Script
# This script initializes the application for first-time use

set -e

echo "🚀 Social Media Compliance Platform - Setup"
echo "==========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env

    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 16)
    REDIS_PASSWORD=$(openssl rand -base64 16)
    MINIO_SECRET=$(openssl rand -base64 16)

    # Update .env with secure values
    sed -i "s/changeme_jwt_secret_minimum_32_characters_long_please/$JWT_SECRET/g" .env
    sed -i "s/changeme_refresh_secret_also_very_long_and_secure/$JWT_REFRESH_SECRET/g" .env
    sed -i "s/changeme_secure_password/$POSTGRES_PASSWORD/g" .env
    sed -i "s/changeme_redis_password/$REDIS_PASSWORD/g" .env
    sed -i "s/changeme_minio_password/$MINIO_SECRET/g" .env

    echo "✅ .env file created with secure random secrets"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔨 Building Docker containers..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d postgres redis minio

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📦 Installing backend dependencies..."
docker-compose run --rm backend npm install

echo ""
echo "📦 Installing frontend dependencies..."
docker-compose run --rm frontend npm install

echo ""
echo "🗄️  Running database migrations..."
docker-compose run --rm backend npm run migration:run

echo ""
echo "🌱 Seeding database with initial data..."
docker-compose run --rm backend npm run seed

echo ""
echo "🎉 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend:       http://localhost"
echo "   - Backend API:    http://localhost/api"
echo "   - API Docs:       http://localhost/api/docs"
echo "   - MinIO Console:  http://localhost:9001"
echo ""
echo "👤 Default Login Credentials:"
echo "   Email:    admin@example.com"
echo "   Password: Admin123!"
echo ""
echo "📚 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop the application:"
echo "   docker-compose down"
echo ""
echo "Happy posting! 🎉"
