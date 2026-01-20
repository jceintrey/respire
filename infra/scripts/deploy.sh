#!/bin/bash
set -e

# Configuration
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}
VPS_HOST=${VPS_HOST:-"user@your-vps.com"}
DEPLOY_PATH=${DEPLOY_PATH:-"/opt/respire"}

echo "=========================================="
echo "  Respire - Deployment Script"
echo "  Version: $VERSION"
echo "=========================================="

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Build images
echo ""
echo "1. Building Docker images..."
echo "-------------------------------------------"

echo "Building frontend..."
docker build -t $DOCKER_USERNAME/respire-frontend:$VERSION -t $DOCKER_USERNAME/respire-frontend:latest ./frontend

echo "Building backend..."
docker build -t $DOCKER_USERNAME/respire-backend:$VERSION -t $DOCKER_USERNAME/respire-backend:latest ./backend

# Push to Docker Hub
echo ""
echo "2. Pushing to Docker Hub..."
echo "-------------------------------------------"

docker push $DOCKER_USERNAME/respire-frontend:$VERSION
docker push $DOCKER_USERNAME/respire-frontend:latest

docker push $DOCKER_USERNAME/respire-backend:$VERSION
docker push $DOCKER_USERNAME/respire-backend:latest

# Deploy to VPS
echo ""
echo "3. Deploying to VPS..."
echo "-------------------------------------------"

ssh $VPS_HOST << EOF
    cd $DEPLOY_PATH

    # Pull new images
    docker compose -f docker-compose.prod.yml pull

    # Restart services
    docker compose -f docker-compose.prod.yml up -d

    # Wait for database to be ready
    echo "Waiting for database..."
    sleep 10

    # Run migrations
    echo "Running migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend npm run migrate

    # Seed data (only runs if tables are empty)
    echo "Seeding data..."
    docker compose -f docker-compose.prod.yml exec -T backend npm run seed || true

    # Clean up old images
    docker image prune -f

    # Show status
    docker compose -f docker-compose.prod.yml ps
EOF

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  Version: $VERSION"
echo "=========================================="
