FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . /app

ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Use Gunicorn to serve the app
CMD ["gunicorn", "wsgi:app", "-b", "0.0.0.0:5000", "-w", "4", "--log-file", "-"]
