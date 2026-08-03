#!/bin/sh
set -e

# Wait for PostgreSQL to actually accept connections before running
# migrations -- docker-compose's healthcheck (below) already gates
# container start order, but this is a defensive extra wait loop in case
# Postgres is "up" but not yet ready to accept connections.
echo "Waiting for PostgreSQL..."
until python -c "
import os, sys, time
import psycopg2
try:
    psycopg2.connect(os.environ['DATABASE_URL'])
except Exception as e:
    sys.exit(1)
"; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Applying database migrations..."
flask --app app.py db upgrade

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app