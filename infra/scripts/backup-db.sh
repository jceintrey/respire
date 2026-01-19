#!/bin/bash
set -e

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
DB_CONTAINER=${DB_CONTAINER:-"respire-db-1"}
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/respire_backup_$TIMESTAMP.sql"

echo "Creating database backup..."

# Create backup
docker compose -f $COMPOSE_FILE exec -T db pg_dump -U respire respire > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE
echo "Backup created: ${BACKUP_FILE}.gz"

# Clean old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "respire_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup complete!"
