#!/bin/sh
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting F-Flow Hub..."

# Wait for database to be ready if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
    log "Waiting for database to be ready..."
    
    # Extract database type from URL
    if echo "$DATABASE_URL" | grep -q "postgresql://"; then
        # PostgreSQL
        until pg_isready -h $(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/') 2>/dev/null; do
            log "Waiting for PostgreSQL..."
            sleep 2
        done
    elif echo "$DATABASE_URL" | grep -q "mysql://"; then
        # MySQL
        MYSQL_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
        until mysqladmin ping -h"$MYSQL_HOST" --silent 2>/dev/null; do
            log "Waiting for MySQL..."
            sleep 2
        done
    fi
    
    log "Database is ready!"
fi

# Run database migrations
log "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case of schema changes)
log "Generating Prisma client..."
npx prisma generate

# Seed database if SEED_DATABASE is set to true
if [ "$SEED_DATABASE" = "true" ]; then
    log "Seeding database..."
    npm run seed || log "Warning: Database seeding failed"
fi

# Start the application
log "Starting NestJS application..."
exec node dist/main.js