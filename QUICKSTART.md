# Quick Start Guide 🚀

Get the Kiyoh AI Widget running in 5 minutes!

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Wait for services to be ready (10 seconds)
sleep 10

# Run database migrations
cd backend && npm install && node src/utils/migrate.js && cd ..
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Widget:**
```bash
cd widget
npm install
npm run dev
```

### 5. Test the Widget

Open `docs/demo.html` in your browser or run:

```bash
# Simple HTTP server
python3 -m http.server 8080
# Then visit: http://localhost:8080/docs/demo.html
```

## Production Build

### Build Everything

```bash
# Build backend (prepares for deployment)
cd backend && npm install --production

# Build widget (creates minified dist files)
cd widget && npm install && npm run build
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway up

# Set environment variables
railway variables set GEMINI_API_KEY=your_key_here

# Run migrations
railway run npm run migrate --workspace=backend
```

Your API will be live at: `https://your-app.railway.app`

## Using the Widget

Add to any HTML page:

```html
<!-- 1. Load the script -->
<script src="https://your-cdn.com/widget.min.js"></script>

<!-- 2. Add the widget -->
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-kiyoh-api-token"
  data-auto-detect="true">
</kiyoh-ai-widget>
```

## Troubleshooting

### Backend won't start?

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check environment variables:
   ```bash
   cat .env
   ```

3. Check logs:
   ```bash
   docker-compose logs -f
   ```

### Widget not detecting GTIN?

1. Add manual GTIN:
   ```html
   data-product-code="8710103974833"
   ```

2. Check browser console for detection attempts

3. Add Schema.org markup to your page:
   ```html
   <script type="application/ld+json">
   {
     "@type": "Product",
     "gtin13": "8710103974833"
   }
   </script>
   ```

### CORS errors?

Update `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8080,https://your-domain.com
```

## API Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Ask a Question

```bash
curl -X POST http://localhost:3000/api/v1/qa \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "1051093",
    "productCode": "8710103974833",
    "question": "Is this product good?",
    "apiToken": "your-kiyoh-api-token"
  }'
```

## Next Steps

- 📖 Read [Installation Guide](docs/installation.md)
- 🔧 Read [API Documentation](docs/api.md)
- 🚂 Read [Railway Deployment Guide](docs/RAILWAY_DEPLOY.md)
- 🎨 Customize the liquid glass UI
- 📊 Set up analytics tracking

## Getting Help

- 📧 Email: support@your-domain.com
- 📖 Documentation: See `/docs` folder
- 🐛 Issues: GitHub Issues

Happy coding! 🎉
