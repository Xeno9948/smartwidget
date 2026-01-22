# Railway Deployment Guide 🚂

Complete guide to deploying the Kiyoh AI Widget to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Google Gemini API key
- Kiyoh API credentials
- Git repository with your code

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Click the button above
2. Connect your GitHub account
3. Select the repository
4. Railway will automatically detect the configuration
5. Set environment variables (see below)
6. Deploy!

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your project
railway link

# Deploy
railway up
```

## Step-by-Step Deployment

### 1. Create Railway Project

```bash
# Login
railway login

# Create new project
railway init

# This will create a new project and link your local directory
```

### 2. Add PostgreSQL Database

In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically provision a PostgreSQL database
3. Note the connection string (automatically set as `DATABASE_URL`)

### 3. Add Redis

In Railway dashboard:
1. Click "New" → "Database" → "Redis"
2. Railway will automatically provision Redis
3. Note the connection string (automatically set as `REDIS_URL`)

### 4. Configure Environment Variables

In Railway dashboard, go to your service and add these variables:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=3000

# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Optional Configuration
KIYOH_BASE_URL=https://www.kiyoh.com
ALLOWED_ORIGINS=*
RATE_LIMIT_PER_HOUR=20
RATE_LIMIT_PER_DAY=1000
CACHE_TTL_PRODUCT=86400
CACHE_TTL_QA=604800
CACHE_TTL_POPULAR=3600
LOG_LEVEL=info
```

### 5. Deploy the Backend

Railway will automatically:
- Detect the `Dockerfile` in `backend/`
- Build the Docker image
- Run database migrations
- Start the server

Monitor deployment:
```bash
railway logs
```

### 6. Get Your Deployment URL

After deployment, Railway provides a URL like:
```
https://your-app.railway.app
```

Update your widget to use this URL:
```html
<kiyoh-ai-widget
  data-api-base-url="https://your-app.railway.app/api/v1"
  ...>
</kiyoh-ai-widget>
```

## Railway Configuration Files

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "node src/server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### railway.toml (Alternative)

```toml
[build]
builder = "dockerfile"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "node src/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

## Environment Variable Reference

Railway automatically injects database URLs. Reference them using:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Custom Domain Setup

1. Go to your service settings
2. Click "Settings" → "Domains"
3. Click "Generate Domain" or "Custom Domain"
4. For custom domains:
   - Add your domain
   - Update DNS records as shown
   - Wait for SSL certificate provisioning

### SSL/HTTPS

Railway automatically provides SSL certificates for all deployments.

## Database Migrations

Migrations run automatically on deployment via the Dockerfile:

```dockerfile
CMD ["sh", "-c", "node src/utils/migrate.js && node src/server.js"]
```

To run migrations manually:

```bash
railway run npm run migrate --workspace=backend
```

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
railway logs

# Follow logs
railway logs -f
```

### Health Checks

Railway monitors your `/health` endpoint:

```bash
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

## Scaling

### Vertical Scaling

Railway automatically scales resources based on usage. You can also:

1. Go to service settings
2. Adjust resource limits
3. Select appropriate plan

### Horizontal Scaling

For high traffic, consider:
1. Multiple Railway services behind a load balancer
2. Enable Redis persistence
3. Use connection pooling (already configured)

## Cost Optimization

### Estimated Costs

With Railway's usage-based pricing:

- **Hobby Plan**: $5/month
  - Includes: 500 hours, $5 credit
  - Good for: Low-moderate traffic (< 10,000 questions/month)

- **Pro Plan**: Usage-based
  - ~$10-20/month for moderate traffic
  - Includes: Unlimited hours, pay per resource usage

### Cost Reduction Tips

1. **Aggressive caching** (already implemented)
   - 7-day cache for Q&A pairs
   - 24-hour cache for product data

2. **Rate limiting** (already implemented)
   - Prevents abuse
   - Controls costs

3. **Monitor usage**
   ```bash
   railway status
   ```

4. **Optimize Gemini calls**
   - Use `gemini-1.5-flash` (cheaper, faster)
   - Cache aggressively

## Troubleshooting

### Deployment Fails

Check build logs:
```bash
railway logs --build
```

Common issues:
- Missing environment variables
- Database connection errors
- Docker build failures

### Database Connection Issues

Verify DATABASE_URL:
```bash
railway variables
```

Test connection:
```bash
railway run npm run migrate --workspace=backend
```

### Redis Connection Issues

Verify REDIS_URL:
```bash
railway run node -e "const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => console.log('Connected!')).catch(console.error);"
```

### High Memory Usage

Check memory metrics in Railway dashboard and:
1. Reduce cache TTL
2. Limit concurrent connections
3. Optimize database queries

## CI/CD Setup

Railway automatically deploys on push to main branch.

### GitHub Integration

1. Connect GitHub in Railway dashboard
2. Select repository and branch
3. Enable automatic deployments
4. Configure deployment triggers

### Deploy on Push

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Check deployment status
railway status
```

## Backup & Recovery

### Database Backups

Railway provides automatic backups for PostgreSQL. To create manual backup:

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
railway run psql $DATABASE_URL < backup.sql
```

## Security Best Practices

1. **Never commit secrets**
   - Use Railway environment variables
   - Add `.env` to `.gitignore`

2. **Enable Railway's secrets encryption**
   - Secrets are encrypted at rest

3. **Use HTTPS only**
   - Railway enforces HTTPS automatically

4. **Rate limiting**
   - Already configured in the application

5. **Monitor access logs**
   ```bash
   railway logs | grep "POST /api/v1/qa"
   ```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations successful
- [ ] Health endpoint responding
- [ ] Rate limiting working
- [ ] Caching enabled
- [ ] Logs accessible
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Support

For Railway-specific issues:
- 📖 Railway Docs: https://docs.railway.app
- 💬 Railway Discord: https://discord.gg/railway
- 🐛 Railway GitHub: https://github.com/railwayapp/railway

For application issues:
- 📧 Email: support@your-domain.com
- 🐛 Issues: GitHub Issues

## Next Steps

After successful deployment:

1. **Test the API**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Update widget configuration**
   ```html
   <kiyoh-ai-widget
     data-api-base-url="https://your-app.railway.app/api/v1"
     ...>
   </kiyoh-ai-widget>
   ```

3. **Monitor performance**
   - Check Railway metrics dashboard
   - Monitor logs for errors
   - Track API response times

4. **Set up analytics**
   - Use analytics endpoint to track usage
   - Monitor question patterns
   - Optimize based on data

Congratulations! Your Kiyoh AI Widget is now live on Railway! 🎉
