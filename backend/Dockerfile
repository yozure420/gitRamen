FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && apt-get install -y --no-install-recommends gosu && \
    rm -rf /var/lib/apt/lists/*
COPY . .
RUN mkdir -p /app/db && \
    useradd -m myuser && chown -R myuser:myuser /app
EXPOSE 8000
CMD ["sh", "-c", "chown -R myuser:myuser /app/db && exec gosu myuser gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"]