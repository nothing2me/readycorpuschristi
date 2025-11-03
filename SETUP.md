# Quick Setup Guide

Follow these steps to clone, configure, and deploy ReadyCorpusChristi on Vercel.

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/readycorpuschristi.git
cd readycorpuschristi
```

## Step 2: Add to Your GitHub Repository

1. **Create a new repository on GitHub**
   - Go to GitHub and create a new repository
   - Don't initialize with README (you already have one)

2. **Push to your repository**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main  # or master
   git push -u origin main
   ```

## Step 3: Set Up Environment Variables

### For Local Development (Optional)

If you want to test locally before deploying:

1. **Create `.env` file**:
   ```bash
   # Create .env file manually (see .env.example for template)
   ```

2. **Add your API keys** to `.env`:
   ```env
   GROQ_API_KEY=your-groq-api-key-here
   ADMIN_PASSWORD=your-secure-admin-password
   SECRET_KEY=your-secret-key-here
   ```

   - Get Groq API key at: https://console.groq.com/
   - Choose a secure admin password
   - Generate a random secret key: `python -c "import secrets; print(secrets.token_hex(32))"`

**Note:** For Vercel deployment, you'll add these in the Vercel dashboard instead.

## Step 4: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
   - Sign in with your GitHub account

2. **Click "New Project"**
   - Select your GitHub repository
   - Vercel will auto-detect Flask

3. **Configure Environment Variables**
   - Click "Environment Variables"
   - Add these variables:
     - `GROQ_API_KEY` - Your Groq API key from [console.groq.com](https://console.groq.com/)
     - `ADMIN_PASSWORD` - Choose a secure password for admin endpoints
     - `SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
     - `FLASK_ENV` - Set to `production`
     - `GROQ_MODEL` - Set to `llama-3.1-8b-instant` (optional, has default)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2 minutes)
   - Your app is live! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Step 5: Test Your Deployment

1. Visit your Vercel deployment URL
2. Test the chatbot functionality
3. Check admin panel at `/admin`

## Troubleshooting

### Flask Not Detected

- Ensure `app.py` is in root directory
- Check `vercel.json` configuration
- Verify `requirements.txt` includes Flask

### Read-only Filesystem Error

- Normal on Vercel - app automatically uses in-memory storage
- No action needed - handled automatically

### API Errors

- Verify environment variables are set in Vercel dashboard
- Check API key is valid
- Review Vercel function logs

## Next Steps

- Customize the application for your needs
- Review [README.md](README.md) for full documentation
- Check [docs/API.md](docs/API.md) for API endpoints
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

---

**That's it! Your app should be live on Vercel.** 🚀

