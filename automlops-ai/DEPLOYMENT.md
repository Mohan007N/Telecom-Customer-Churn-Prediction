# AutoMLOps AI - Deployment Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- 8GB+ RAM available
- 10GB+ disk space

### One-Command Deployment
```bash
git clone <repository-url>
cd automlops-ai
docker-compose up -d
```

**Wait 2-3 minutes for all services to start**, then access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **MLflow**: http://localhost:5000
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

### First Steps
1. Open http://localhost:5173
2. Click "Sign Up" and create an account
3. Log in with your credentials
4. Create your first project
5. Upload a CSV dataset
6. Write a natural language prompt (e.g., "Train a classification model to predict churn")
7. Click "Execute" and watch the magic happen!

---

## Development Setup

### Backend Development

#### 1. System Requirements
- Python 3.12+
- PostgreSQL 14+
- Redis 7+

#### 2. Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations (make sure PostgreSQL is running)
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Database Setup
```bash
# Install PostgreSQL if needed
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE automlops;
CREATE USER automlops WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE automlops TO automlops;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql+asyncpg://automlops:password@localhost:5432/automlops
DATABASE_URL_SYNC=postgresql://automlops:password@localhost:5432/automlops
```

#### 4. Redis Setup
```bash
# Install Redis
# Ubuntu/Debian:
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

#### 5. MLflow Setup (Optional but recommended)
```bash
# In a separate terminal
pip install mlflow
mlflow server --host 0.0.0.0 --port 5000
```

### Frontend Development

#### 1. System Requirements
- Node.js 18+
- npm or yarn

#### 2. Setup
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173

#### 3. Build for Production
```bash
npm run build
# Output will be in 'dist/' directory
```

---

## Production Deployment

### Docker Compose (Recommended)

#### 1. Update Environment Variables
```bash
# Create production .env file
cp .env.example .env

# IMPORTANT: Change these in production
SECRET_KEY=<generate-strong-secret-key>
DATABASE_URL=postgresql+asyncpg://postgres:<strong-password>@postgres:5432/automlops
```

#### 2. Generate Secret Key
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. Start Services
```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

#### 4. Health Check
```bash
# Check all services are running
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:5173
```

### Kubernetes Deployment

#### 1. Build Images
```bash
# Build backend
cd backend
docker build -t automlops-backend:latest .

# Build frontend
cd ../frontend
docker build -t automlops-frontend:latest .
```

#### 2. Push to Registry
```bash
docker tag automlops-backend:latest <your-registry>/automlops-backend:latest
docker push <your-registry>/automlops-backend:latest

docker tag automlops-frontend:latest <your-registry>/automlops-frontend:latest
docker push <your-registry>/automlops-frontend:latest
```

#### 3. Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace automlops

# Deploy services (you'll need to create k8s manifests)
kubectl apply -f k8s/ -n automlops

# Check status
kubectl get pods -n automlops
```

### Cloud Deployment

#### AWS
```bash
# Use ECS with Fargate
aws ecs create-cluster --cluster-name automlops

# Or use EKS
eksctl create cluster --name automlops --region us-east-1
```

#### GCP
```bash
# Use Cloud Run
gcloud run deploy automlops-backend --source ./backend
gcloud run deploy automlops-frontend --source ./frontend
```

#### Azure
```bash
# Use Container Instances
az container create --resource-group automlops --name backend --image <registry>/automlops-backend
```

---

## Configuration

### Backend Configuration

**Environment Variables** (`.env`):
```env
# Application
APP_NAME=AutoMLOps AI
APP_VERSION=1.0.0
DEBUG=False
SECRET_KEY=<your-secret-key>

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
DATABASE_URL_SYNC=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/0

# Celery
CELERY_BROKER_URL=redis://host:6379/0
CELERY_RESULT_BACKEND=redis://host:6379/0

# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5000

# File Storage
UPLOAD_DIR=./datasets
MODEL_DIR=./models
REPORT_DIR=./reports

# LLM (if using)
LLM_MODEL_NAME=Qwen/Qwen2.5-7B-Instruct-AWQ
LLM_DEVICE=cuda

# CORS (update for production)
CORS_ORIGINS=["http://localhost:5173","https://your-domain.com"]
```

### Frontend Configuration

**Environment Variables** (`.env`):
```env
VITE_API_URL=http://localhost:8000/api/v1
```

For production:
```env
VITE_API_URL=https://api.your-domain.com/api/v1
```

### Database Migrations

#### Create Migration
```bash
cd backend
alembic revision --autogenerate -m "Description of change"
```

#### Run Migrations
```bash
alembic upgrade head
```

#### Rollback Migration
```bash
alembic downgrade -1
```

---

## Monitoring

### Prometheus
Access: http://localhost:9090

**Key Metrics**:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `model_predictions_total` - Total predictions made

### Grafana
Access: http://localhost:3000
Default credentials: admin/admin

**Dashboards**:
- System Health
- API Performance
- Model Metrics
- Database Performance

### MLflow
Access: http://localhost:5000

**Features**:
- Experiment tracking
- Model registry
- Artifact storage
- Metric visualization

---

## Backup & Restore

### Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres automlops > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres automlops < backup.sql
```

### Models & Data Backup
```bash
# Backup models and datasets
tar -czf backup-data.tar.gz datasets/ models/ reports/

# Restore
tar -xzf backup-data.tar.gz
```

---

## Scaling

### Horizontal Scaling

#### Backend
```bash
# Scale backend replicas
docker-compose up -d --scale backend=3

# With load balancer
# Add nginx configuration for load balancing
```

#### Celery Workers
```bash
# Scale workers
docker-compose up -d --scale celery-worker=5
```

### Vertical Scaling

Update `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

---

## Security Checklist

### Production Security
- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up VPN for internal services
- [ ] Enable database encryption
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable audit logging

### Environment Security
```bash
# Restrict .env file permissions
chmod 600 .env

# Don't commit .env to git
echo ".env" >> .gitignore
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

#### 2. Redis Connection Failed
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

#### 3. Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - Database not ready
# - Port already in use
```

#### 4. Frontend Not Loading
```bash
# Check logs
docker-compose logs frontend

# Check API connectivity
curl http://localhost:8000/health

# Rebuild if needed
docker-compose up -d --build frontend
```

#### 5. Slow Model Training
```bash
# Check system resources
docker stats

# Allocate more resources to backend
# Edit docker-compose.yml and increase limits
```

### Debug Mode

Enable debug logging:
```env
DEBUG=True
LOG_LEVEL=DEBUG
```

View detailed logs:
```bash
docker-compose logs -f --tail=100 backend
```

---

## Performance Optimization

### Database
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_experiments_project ON experiments(project_id);
CREATE INDEX idx_predictions_deployment ON predictions(deployment_id);
```

### Redis Caching
```python
# Cache expensive operations
# Example in your code:
from redis import Redis
redis_client = Redis.from_url(settings.REDIS_URL)

# Cache dataset analysis
cache_key = f"dataset_analysis:{project_id}"
cached = redis_client.get(cache_key)
if cached:
    return json.loads(cached)
```

### Frontend
```bash
# Enable production build optimizations
npm run build

# Use CDN for static assets
# Configure in vite.config.ts
```

---

## Maintenance

### Regular Tasks
- **Daily**: Check error logs
- **Weekly**: Database backup, security updates
- **Monthly**: Review metrics, cleanup old data
- **Quarterly**: Security audit, dependency updates

### Cleanup Old Data
```sql
-- Delete old predictions (older than 90 days)
DELETE FROM predictions WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old monitoring logs
DELETE FROM monitoring_logs WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: README.md
- Email: support@automlops.ai

---

**Last Updated**: 2024
**Version**: 1.0.0
