# AutoMLOps AI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Platform
```bash
docker-compose up -d
```

### Step 2: Wait for Services (2-3 minutes)
```bash
docker-compose logs -f backend
# Wait until you see: "Application startup complete"
```

### Step 3: Access the Platform
Open your browser to:
- **API Docs**: http://localhost:8000/api/v1/docs
- **Frontend**: http://localhost:5173

---

## 📝 First API Test

### 1. Create Account
```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "securepass123",
    "full_name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=securepass123"
```

**Save the access_token** from the response!

### 3. Create Project
```bash
TOKEN="your-access-token-here"

curl -X POST "http://localhost:8000/api/v1/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First ML Project",
    "description": "Testing the platform",
    "user_prompt": "Train a classification model to predict customer churn"
  }'
```

### 4. Upload Dataset
```bash
curl -X POST "http://localhost:8000/api/v1/projects/1/upload-dataset" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/dataset.csv"
```

### 5. Execute Pipeline
```bash
curl -X POST "http://localhost:8000/api/v1/projects/1/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_select_target": true,
    "train_models": true,
    "enable_hyperparameter_tuning": true
  }'
```

### 6. Check Progress
```bash
curl -X GET "http://localhost:8000/api/v1/projects/1/progress" \
  -H "Authorization: Bearer $TOKEN"
```

### 7. View Leaderboard
```bash
curl -X GET "http://localhost:8000/api/v1/projects/1/leaderboard" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Using the Web Interface

### 1. Open Browser
Navigate to: http://localhost:5173

### 2. Sign Up
- Click "Sign Up"
- Enter your details
- Create account

### 3. Create Project
- Click "New Project"
- Enter project name
- Write natural language prompt:
  - "Train a customer churn classifier"
  - "Build a house price prediction model"
  - "Create a fraud detection system"

### 4. Upload Dataset
- Click "Upload Dataset"
- Select your CSV file
- Wait for upload confirmation

### 5. Execute
- Click "Execute Pipeline"
- Watch the progress bar
- View results when complete

---

## 📊 Example Prompts

### Classification Tasks
```
"Train a binary classification model to predict customer churn and deploy the best one"

"Build a multi-class classifier for product categorization"

"Create a fraud detection model with high recall"

"Develop a spam detection classifier"
```

### Regression Tasks
```
"Train a regression model to predict house prices"

"Build a model to forecast monthly sales"

"Create a price prediction model for used cars"

"Develop a model to estimate customer lifetime value"
```

---

## 🔍 Monitoring Services

### Check All Services
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart a Service
```bash
docker-compose restart backend
```

### Stop All Services
```bash
docker-compose down
```

---

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if running
docker-compose ps backend

# View logs
docker-compose logs backend

# Restart
docker-compose restart backend
```

### Database Connection Error
```bash
# Check PostgreSQL
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Wait 10 seconds then restart backend
docker-compose restart backend
```

### Frontend Not Loading
```bash
# Check if running
docker-compose ps frontend

# Restart
docker-compose restart frontend

# If still failing, rebuild
docker-compose up -d --build frontend
```

---

## 🎓 Using Different Models

The platform automatically trains these models:

### Classification
- Logistic Regression
- Decision Tree
- Random Forest
- Extra Trees
- XGBoost ⭐
- LightGBM ⭐
- CatBoost ⭐
- AdaBoost
- Gradient Boosting
- SVM
- Naive Bayes
- MLP Neural Network

### Regression  
- Ridge Regression
- Lasso Regression
- Decision Tree
- Random Forest
- Extra Trees
- XGBoost ⭐
- LightGBM ⭐
- CatBoost ⭐
- AdaBoost
- Gradient Boosting
- SVR
- MLP Neural Network

⭐ = Usually best performers

---

## 📈 Understanding Results

### Metrics Explained

**Classification**:
- **Accuracy**: Overall correctness (higher is better)
- **Precision**: Correct positive predictions (higher is better)
- **Recall**: Found all positives (higher is better)
- **F1-Score**: Balance of precision and recall (higher is better)
- **ROC-AUC**: Model discrimination ability (higher is better)

**Regression**:
- **MSE**: Mean Squared Error (lower is better)
- **RMSE**: Root Mean Squared Error (lower is better)
- **MAE**: Mean Absolute Error (lower is better)
- **R² Score**: Variance explained (higher is better, max 1.0)

---

## 🔧 Configuration

### Change Backend Port
Edit `docker-compose.yml`:
```yaml
backend:
  ports:
    - "9000:8000"  # Change 8000 to 9000
```

### Change Frontend Port
Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "3000:5173"  # Change 5173 to 3000
```

### Increase Memory for Training
Edit `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 8G  # Increase memory
```

---

## 📦 Dataset Requirements

### Supported Formats
- CSV (recommended)
- Excel (.xlsx, .xls)
- JSON
- Parquet

### Best Practices
- Include column headers
- Clean column names (no special characters)
- Handle missing values or let platform handle them
- Binary/numeric target for classification
- Numeric target for regression
- Minimum 100 rows recommended

### Example CSV Structure
```csv
customer_id,age,tenure,monthly_charges,total_charges,churn
1,45,12,75.50,905.25,No
2,32,48,89.99,4319.52,No
3,28,6,45.00,270.00,Yes
...
```

---

## 🚨 Common Issues

### "Database connection failed"
**Solution**: Wait for PostgreSQL to fully start (30 seconds), then restart backend
```bash
docker-compose restart backend
```

### "Token expired"
**Solution**: Login again to get new token
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=youruser&password=yourpass"
```

### "Out of memory during training"
**Solution**: Increase Docker memory limit or reduce dataset size
```bash
# Check Docker memory settings
docker stats
```

---

## 📚 Additional Resources

- **Full Documentation**: `README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Technical Details**: `PROJECT_SUMMARY.md`
- **API Documentation**: http://localhost:8000/api/v1/docs

---

## 💡 Tips

1. **Start Small**: Test with a small dataset first (< 10,000 rows)
2. **Use Clear Prompts**: Be specific about your ML task
3. **Check Logs**: Use `docker-compose logs -f` to see what's happening
4. **Be Patient**: Training 12 models takes 30-60 seconds
5. **Save Your Token**: You'll need it for all API calls

---

## ✅ Success Checklist

- [ ] Docker services running (`docker-compose ps` shows all running)
- [ ] Backend accessible (http://localhost:8000/health returns 200)
- [ ] Created account successfully
- [ ] Got authentication token
- [ ] Created first project
- [ ] Uploaded dataset
- [ ] Executed pipeline
- [ ] Viewed results

---

**Need Help?**
- Check logs: `docker-compose logs -f backend`
- Read documentation: `README.md`
- Review API docs: http://localhost:8000/api/v1/docs

**Ready to build ML models without coding!** 🎉
