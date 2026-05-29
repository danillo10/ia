FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libjpeg62-turbo-dev zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . ./

# Railway injeta PORT; local usa 8001
ENV API_PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "alembic upgrade head || true && uvicorn app.main:api --host 0.0.0.0 --port ${PORT:-8001}"]
