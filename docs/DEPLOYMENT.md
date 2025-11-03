# Deployment Guide

Complete guide for deploying ReadyCorpusChristi.

---

## Vercel Deployment (Recommended)

### Automatic Deployment

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your repository

2. **Configure Project**
   - Vercel will automatically detect Flask
   - Framework preset: Python
   - Build command: (auto-detected)
   - Output directory: (auto-detected)

3. **Environment Variables**
   Set in Vercel dashboard:
   ```
   GROQ_API_KEY=your-groq-api-key
   ADMIN_PASSWORD=your-secure-password
   SECRET_KEY=your-secret-key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

---

## Local Development

### Prerequisites

- Python 3.12+
- pip
- Virtual environment (recommended)

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/readycorpuschristi.git
cd readycorpuschristi

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run application
python app.py
```

---

## Production Checklist

- [ ] Set all environment variables
- [ ] Use secure admin password
- [ ] Set SECRET_KEY for sessions
- [ ] Configure CORS if needed
- [ ] Set up monitoring/logging
- [ ] Configure error tracking
- [ ] Set up backups for data
- [ ] Enable HTTPS
- [ ] Review security settings

---

## Troubleshooting

### Read-only Filesystem Error

The application automatically detects serverless environments and uses `/tmp` directory or in-memory storage. If you see read-only filesystem errors, ensure environment variables are set correctly.

### Flask Not Detected

Ensure:
- `app.py` is at project root
- `vercel.json` is configured correctly
- `requirements.txt` includes Flask
- Flask is imported and app instance created at module level

### Environment Variables Not Working

- Check variable names match exactly
- Ensure variables are set in Vercel dashboard
- Restart deployment after adding variables

---

For more help, see [README.md](../README.md) or open an issue on GitHub.

