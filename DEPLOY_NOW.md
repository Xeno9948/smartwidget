# 🚀 Deploy to Railway NOW - Quick Guide

Your Gemini API key is set up locally. Follow these steps to deploy:

## Step 1: Create Pull Request (Optional)

If you want to review the code first:

```bash
# Push is already done, just create PR on GitHub
# Go to: https://github.com/Xeno9948/smartwidget/pulls
# Click "New Pull Request"
# Select branch: claude/liquid-glass-ui-design-iM3uh
```

**OR skip to Step 2 to deploy directly!**

## Step 2: Deploy to Railway

### A. Install Railway CLI

```bash
npm install -g @railway/cli
```

### B. Login to Railway

```bash
railway login
```

This will open your browser. Sign in with GitHub.

### C. Initialize Railway Project

```bash
railway init
```

Choose:
- Create new project: **Yes**
- Project name: **kiyoh-ai-widget**

### D. Add PostgreSQL Database

```bash
railway add --database postgresql
```

### E. Add Redis

```bash
railway add --database redis
```

### F. Set Your Gemini API Key

```bash
railway variables set GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**⚠️ IMPORTANT**: Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key.
Get it from: https://makersuite.google.com/app/apikey

### G. Set Additional Variables

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set ALLOWED_ORIGINS="*"
railway variables set KIYOH_BASE_URL=https://www.kiyoh.com
```

### H. Deploy!

```bash
railway up
```

This will:
- Build your Docker container
- Deploy to Railway
- Automatically connect to PostgreSQL and Redis
- Run database migrations

### I. Check Deployment Status

```bash
railway status
```

### J. Get Your API URL

```bash
railway domain
```

You'll get a URL like: `https://kiyoh-ai-widget-production.up.railway.app`

### K. Run Migrations (First Time Only)

```bash
railway run npm run migrate --workspace=backend
```

## Step 3: Test Your Deployment

```bash
# Replace with your Railway URL
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "redis": "ok",
    "gemini": "configured"
  }
}
```

## Step 4: Update Widget Configuration

Once deployed, update your widget to use the Railway API:

```html
<script src="widget.min.js"></script>

<kiyoh-ai-widget
  data-location-id="YOUR_KIYOH_LOCATION_ID"
  data-api-token="YOUR_KIYOH_API_TOKEN"
  data-api-base-url="https://your-app.railway.app/api/v1"
  data-auto-detect="true">
</kiyoh-ai-widget>
```

## 🎉 You're Live!

Your API is now running on Railway with:
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ Google Gemini AI
- ✅ Auto GTIN detection
- ✅ Liquid glass UI widget

## 📊 Monitor Your Deployment

```bash
# View logs
railway logs

# Check service status
railway status

# View environment variables
railway variables
```

## 💰 Cost Estimate

Railway Hobby Plan: **$5/month**
- Includes $5 credit
- Good for < 10,000 questions/month

Plus Gemini API: **~$0.0004 per question**

## 🔧 Troubleshooting

### If deployment fails:

1. **Check logs:**
   ```bash
   railway logs
   ```

2. **Verify environment variables:**
   ```bash
   railway variables
   ```

3. **Ensure databases are running:**
   ```bash
   railway status
   ```

### If migrations fail:

```bash
# Run manually
railway run npm run migrate --workspace=backend
```

### If health check fails:

```bash
# Check if services are up
curl https://your-app.railway.app/health

# Check logs for errors
railway logs -f
```

## 🎯 Next Steps

1. Get your Kiyoh credentials:
   - Location ID
   - API Token

2. Test the widget on a product page

3. Monitor usage in Railway dashboard

4. Set up custom domain (optional):
   ```bash
   railway domain add yourdomain.com
   ```

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check `docs/RAILWAY_DEPLOY.md` for detailed guide

---

**Your Gemini API key is already configured locally in `.env` (not in git).**
**Just follow steps above to deploy to Railway!** 🚀
