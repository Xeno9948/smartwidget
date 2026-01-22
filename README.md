# Kiyoh AI Q&A Widget 🤖✨

An embeddable AI-powered product Q&A widget that automatically detects GTINs from webpages, fetches Kiyoh product reviews, and uses Google Gemini to answer customer questions based on real review data.

![Liquid Glass UI Design](https://img.shields.io/badge/UI-Liquid%20Glass-00a0dc?style=for-the-badge)
![Railway Ready](https://img.shields.io/badge/Deploy-Railway-blueviolet?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge)

## ✨ Features

- 🔍 **Auto GTIN Detection** - Automatically finds product GTINs from Schema.org, meta tags, and e-commerce platforms
- 🤖 **AI-Powered Answers** - Uses Google Gemini to generate intelligent responses based on real customer reviews
- 💎 **Liquid Glass UI** - Modern glassmorphism design with smooth animations
- ⚡ **Lightning Fast** - Redis caching for sub-second response times
- 📊 **Analytics** - Track widget usage and popular questions
- 🎨 **Customizable** - Easy theming with CSS variables
- 🚀 **One-Line Install** - Just add a script tag and widget element

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Widget    │─────▶│  Backend API │─────▶│  Kiyoh API  │
│  (Browser)  │      │   (Node.js)  │      │   (Reviews) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─────▶ Google Gemini (AI)
                            ├─────▶ PostgreSQL (Storage)
                            └─────▶ Redis (Cache)
```

## 🚀 Quick Start

### Installation (For Customers)

Add the widget to your product pages:

```html
<!-- 1. Add the script -->
<script src="https://your-cdn.com/widget.min.js"></script>

<!-- 2. Add the widget element -->
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-kiyoh-api-token"
  data-auto-detect="true">
</kiyoh-ai-widget>
```

That's it! The widget will automatically detect the product GTIN and start answering questions.

### Manual GTIN (Optional)

If auto-detection fails, specify the GTIN manually:

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-kiyoh-api-token"
  data-product-code="8710103974833">
</kiyoh-ai-widget>
```

## 💻 Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Google Gemini API key
- Kiyoh API credentials

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kiyoh-ai-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run migrate --workspace=backend
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run dev:backend

   # Terminal 2: Widget
   npm run dev:widget
   ```

7. **Open demo page**
   Open `docs/demo.html` in your browser

## 🚂 Railway Deployment

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-repo/kiyoh-ai-widget)

### Manual Deploy

1. **Create Railway project**
   ```bash
   railway init
   ```

2. **Add services**
   - PostgreSQL database
   - Redis cache
   - Backend API

3. **Set environment variables**
   ```bash
   railway variables set GEMINI_API_KEY=your_key_here
   railway variables set NODE_ENV=production
   # ... add all required variables
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Run migrations**
   ```bash
   railway run npm run migrate --workspace=backend
   ```

### Required Environment Variables

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key
KIYOH_BASE_URL=https://www.kiyoh.com

# Database (Railway provides these automatically)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Configuration
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_PER_HOUR=20
RATE_LIMIT_PER_DAY=1000

# Cache TTL (seconds)
CACHE_TTL_PRODUCT=86400
CACHE_TTL_QA=604800
```

## 📖 API Documentation

### POST /api/v1/qa

Ask a question about a product.

**Request:**
```json
{
  "locationId": "1051093",
  "productCode": "8710103974833",
  "question": "Is dit apparaat stil?",
  "language": "nl",
  "apiToken": "your-kiyoh-api-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "Is dit apparaat stil?",
    "answer": "Uit de 156 reviews blijkt dat het geluidsniveau acceptabel is...",
    "confidence": "high",
    "product": {
      "name": "Rowenta X-Clean 2-in-1",
      "gtin": "8710103974833",
      "rating": 8.4,
      "reviewCount": 156,
      "imageUrl": "https://..."
    },
    "relevantReviews": [...],
    "metadata": {
      "answeredAt": "2026-01-22T10:30:00Z",
      "cached": false,
      "tokensUsed": 450
    }
  }
}
```

### GET /api/v1/qa/popular/:locationId

Get popular questions for a location.

### GET /api/v1/analytics/:locationId

Get analytics (requires authentication).

## 🎨 Customization

### Custom Colors

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-token"
  data-primary-color="#ff6600">
</kiyoh-ai-widget>
```

### Hide Product Info

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-token"
  data-show-product-info="false">
</kiyoh-ai-widget>
```

### Custom API URL (Self-Hosted)

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-token"
  data-api-base-url="https://your-api.com/api/v1">
</kiyoh-ai-widget>
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm test --workspace=backend

# Widget tests only
npm test --workspace=widget

# With coverage
npm test -- --coverage
```

## 📊 Performance

- **API Response Time**: < 2 seconds (95th percentile)
- **Widget Load Time**: < 1 second
- **Cache Hit Rate**: > 60% after 1 week
- **GTIN Detection**: > 80% success on major e-commerce platforms

## 💰 Cost Estimates

Monthly costs for moderate traffic (5,000 questions):

- **Gemini API**: $5-10
- **Railway Hosting**: $5 (Hobby plan)
- **PostgreSQL**: Included in Railway
- **Redis**: Included in Railway
- **Total**: ~$10-15/month

## 🔒 Security

- ✅ Input sanitization (XSS protection)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting (per IP and per location)
- ✅ API token validation
- ✅ CORS configuration
- ✅ Helmet.js security headers

## 📚 Documentation

- [Installation Guide](docs/installation.md)
- [API Documentation](docs/api.md)
- [Customization Options](docs/customization.md)
- [Architecture Overview](docs/architecture.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [Kiyoh](https://www.kiyoh.com) for the product reviews API
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- Railway for easy deployment

## 📞 Support

For issues and questions:
- 📧 Email: support@your-domain.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: https://docs.your-domain.com

---

Made with ❤️ and AI
