FROM python:3.12-slim AS base

# Prevents Python from writing .pyc files and buffering stdout/stderr,
# which matters for seeing logs promptly in `docker compose logs`.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps needed to build psycopg2 and other C-extension packages.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (separate layer) so `docker build` can reuse
# the cached layer whenever only application code changes, not requirements.
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt \
    && pip install --no-cache-dir --break-system-packages gunicorn

COPY . .

# Matches the existing upload directory created at runtime by app.py's
# os.makedirs(...) call -- pre-creating it here just avoids a first-write
# permission surprise depending on how the volume is mounted.
RUN mkdir -p /app/uploads/documents

EXPOSE 5000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]