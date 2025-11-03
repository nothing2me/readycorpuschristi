# Quick Start Guide

**Get ReadyCorpusChristi deployed in 5 minutes!**

---

## Step-by-Step Deployment

### 1️⃣ Clone & Setup

```bash
git clone https://github.com/yourusername/readycorpuschristi.git
cd readycorpuschristi
```

### 2️⃣ Push to Your GitHub

```bash
# Create new repo on GitHub, then:
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select your repository
5. Vercel will auto-detect Flask ✅

### 4️⃣ Set Environment Variables

In Vercel dashboard, add:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `GROQ_API_KEY` | Your API key | [console.groq.com](https://console.groq.com/) |
| `ADMIN_PASSWORD` | Your password | Choose any secure password |
| `SECRET_KEY` | Random key | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FLASK_ENV` | `production` | Always set to `production` |

### 5️⃣ Deploy!

Click **"Deploy"** and wait ~2 minutes. Your app is live! 🎉

---

## That's It!

Visit your Vercel deployment URL and start using ReadyCorpusChristi!

**Need help?** See [SETUP.md](SETUP.md) for detailed instructions or check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for a deployment checklist.

---

**Troubleshooting?** See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for common issues and solutions.

