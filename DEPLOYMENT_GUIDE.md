# IELTS Backend - Deployment Guide

## 🚀 Production Deployment Options

### Option 1: Heroku Deployment

#### 1. Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Others: https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Login to Heroku
```bash
heroku login
```

#### 3. Create Heroku App
```bash
heroku create your-ielts-app
```

#### 4. Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 5. Set Environment Variables
```bash
heroku config:set FLASK_ENV=production
heroku config:set JWT_SECRET_KEY=your_strong_secret_key
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
```

#### 6. Create Procfile
```bash
cat > Procfile << EOF
web: gunicorn -w 4 -b 0.0.0.0:\$PORT app:create_app()
EOF
```

#### 7. Create runtime.txt
```bash
echo "python-3.11.5" > runtime.txt
```

#### 8. Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### 9. View Logs
```bash
heroku logs --tail
```

---

### Option 2: AWS Deployment

#### Using Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p python-3.11 ielts-app --region us-east-1

# 3. Create environment
eb create ielts-env

# 4. Set environment variables
eb setenv FLASK_ENV=production JWT_SECRET_KEY=your_secret...

# 5. Deploy
eb deploy

# 6. Open app
eb open
```

---

### Option 3: Docker + Any Cloud

#### 1. Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Set environment
ENV FLASK_ENV=production

# Run
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

#### 2. Build Image
```bash
docker build -t ielts-api:latest .
```

#### 3. Run Container Locally
```bash
docker run -p 5000:5000 \
  -e FLASK_ENV=production \
  -e JWT_SECRET_KEY=your_secret \
  -e DATABASE_URL=postgresql://... \
  ielts-api:latest
```

#### 4. Push to Docker Hub
```bash
docker tag ielts-api:latest your-username/ielts-api:latest
docker push your-username/ielts-api:latest
```

#### 5. Deploy to any platform:
- **Google Cloud Run**: https://cloud.google.com/run/docs/quickstarts/build-and-deploy
- **Azure Container Instances**: https://learn.microsoft.com/en-us/azure/container-instances/
- **DigitalOcean**: https://docs.digitalocean.com/products/app-platform/
- **Railway.app**: Connect GitHub repo, auto-deploys

---

### Option 4: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. SSH into server
```bash
ssh root@your_server_ip
```

#### 2. Install dependencies
```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx supervisor
```

#### 3. Clone repository
```bash
cd /home/app
git clone https://github.com/your-repo/IELTS.git
cd IELTS
```

#### 4. Setup Python environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 5. Setup PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE ielts_db;
CREATE USER ielts_user WITH PASSWORD 'strong_password';
ALTER ROLE ielts_user SET client_encoding TO 'utf8';
ALTER ROLE ielts_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ielts_user SET default_transaction_deferrable TO on;
ALTER ROLE ielts_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ielts_db TO ielts_user;
\q
```

#### 6. Create .env
```bash
cat > .env << EOF
FLASK_ENV=production
DATABASE_URL=postgresql://ielts_user:strong_password@localhost/ielts_db
JWT_SECRET_KEY=your_strong_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF
```

#### 7. Create Supervisor config
```bash
sudo cat > /etc/supervisor/conf.d/ielts.conf << EOF
[program:ielts]
directory=/home/app/IELTS
command=/home/app/IELTS/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:create_app()
user=app
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ielts.log
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ielts
```

#### 8. Configure Nginx
```nginx
sudo cat > /etc/nginx/sites-available/ielts << 'EOF'
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_read_timeout 60s;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/ielts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

## 📊 Performance Optimization

### 1. Database Indexing
```python
# Add to models (if needed)
class Submission(db.Model):
    __table_args__ = (
        db.Index('idx_student_task', 'student_id', 'task_id'),
        db.Index('idx_status', 'status'),
    )
```

### 2. Caching
```bash
pip install flask-caching redis
```

### 3. Load Balancing
- Use AWS ALB / GCP Load Balancer
- Run multiple gunicorn workers
- Scale horizontally across instances

### 4. CDN for Audio
- CloudFront (AWS)
- Cloudflare
- Bunny CDN

---

## 🔐 Security Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Use strong `JWT_SECRET_KEY`
- [ ] Enable HTTPS/SSL
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set database password
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Keep dependencies updated

---

## 📈 Monitoring & Logging

### Application Monitoring
```bash
pip install sentry-sdk
```

In `app.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your_sentry_dsn",
    integrations=[FlaskIntegration()]
)
```

### Log Aggregation
- **Heroku**: Built-in logging
- **AWS**: CloudWatch
- **GCP**: Cloud Logging
- **Self-hosted**: ELK Stack, Datadog, New Relic

---

## 🚨 Troubleshooting Deployment

### Problem: "ModuleNotFoundError"
```bash
# Solution: Ensure requirements.txt is in root
pip freeze > requirements.txt
```

### Problem: Database connection fails
```bash
# Check DATABASE_URL format
# PostgreSQL: postgresql://user:password@host:port/db
# MySQL: mysql://user:password@host:port/db
```

### Problem: Cloudinary upload fails
```bash
# Verify credentials in .env
heroku config  # or eb printenv
```

### Problem: Cold start takes too long
```bash
# Solution: Use warm-up requests
# Add to your deployment:
curl -X GET https://your-app.com/api/health
```

---

## 💰 Cost Estimation (Monthly)

| Platform | Cost | Storage | Bandwidth |
|----------|------|---------|-----------|
| **Heroku** | $7-50+ | 1TB | Included |
| **AWS** | $10-100+ | Scalable | Included |
| **Heroku + Cloudinary Free** | $7 | 25GB | 25GB |
| **DigitalOcean VPS** | $5-40 | Scalable | 1-4TB |
| **Railway.app** | $5-50+ | Included | Included |

---

## 🔄 CI/CD Pipeline Example (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Heroku

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

---

## 📞 Post-Deployment

1. **Test endpoints**: Use Postman / Thunder Client
2. **Monitor logs**: Check for errors
3. **Performance test**: Load testing with wrk/Apache Bench
4. **Security audit**: Run bandit / safety checks
5. **Backup database**: Schedule daily backups
6. **Update dependencies**: Monthly security updates

---

## ✅ Deployment Checklist

- [ ] Backend code committed to git
- [ ] `.env.example` created
- [ ] Dependencies in `requirements.txt`
- [ ] `Procfile` for Heroku (if using)
- [ ] Database URI configured
- [ ] Cloudinary credentials set
- [ ] JWT secret key strong
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for frontend
- [ ] Health check endpoint working
- [ ] Logs accessible
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Frontend API URL updated

---

Ready to deploy? Choose your platform and follow the steps above! 🚀
