# API Documentation

Base URL: `https://your-api-domain.com/api/v1`

## Authentication

All endpoints require authentication via API token in one of two ways:

1. **Request body** (recommended):
   ```json
   {
     "apiToken": "your-kiyoh-api-token"
   }
   ```

2. **HTTP header**:
   ```
   X-Api-Token: your-kiyoh-api-token
   ```

## Endpoints

### POST /api/v1/qa

Ask a question about a product and get an AI-generated answer based on customer reviews.

**Request:**

```http
POST /api/v1/qa
Content-Type: application/json
X-Api-Token: your-kiyoh-api-token

{
  "locationId": "1051093",
  "productCode": "8710103974833",
  "question": "Is dit apparaat stil?",
  "language": "nl",
  "apiToken": "your-kiyoh-api-token"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationId` | string | Yes | Kiyoh location ID |
| `productCode` | string | No* | Product GTIN/EAN |
| `question` | string | Yes | Customer's question (max 500 chars) |
| `language` | string | No | Response language (default: `nl`) |
| `apiToken` | string | Yes | Kiyoh API token |

*If not provided, will use all products for the location

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "question": "Is dit apparaat stil?",
    "answer": "Uit de 156 reviews blijkt dat het geluidsniveau over het algemeen als acceptabel wordt ervaren. De meeste klanten vinden het 'stiller dan verwacht', hoewel enkele reviewers melden dat het op de hoogste stand wel hoorbaar is. Specifiek noemen 15 van de 156 reviews het geluidsniveau, waarvan de meerderheid positief.",
    "confidence": "high",
    "product": {
      "name": "Rowenta X-Clean 2-in-1 Stofzuiger",
      "gtin": "8710103974833",
      "rating": 8.4,
      "reviewCount": 156,
      "imageUrl": "https://example.com/image.jpg"
    },
    "relevantReviews": [
      {
        "rating": 9,
        "excerpt": "Super stofzuiger! Zuigt heel goed en is stiller dan mijn vorige...",
        "author": "Maria",
        "date": "2026-01-15T10:30:00Z"
      }
    ],
    "metadata": {
      "answeredAt": "2026-01-22T10:30:00Z",
      "cached": false,
      "tokensUsed": 450,
      "responseTime": 1847
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing required fields
{
  "success": false,
  "error": "question is required"
}

// 404 Not Found - Product not found or no reviews
{
  "success": false,
  "error": "Product not found or no reviews available"
}

// 401 Unauthorized - Invalid API token
{
  "success": false,
  "error": "Invalid or missing API token"
}

// 429 Too Many Requests - Rate limit exceeded
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}

// 503 Service Unavailable - Quota exceeded
{
  "success": false,
  "error": "Service temporarily unavailable due to quota limits"
}
```

### GET /api/v1/qa/popular/:locationId

Get frequently asked questions for a location.

**Request:**

```http
GET /api/v1/qa/popular/1051093?limit=10
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationId` | string | Yes | Kiyoh location ID (in URL) |
| `limit` | number | No | Max questions to return (default: 10) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "Is dit apparaat stil?",
        "count": 45,
        "productCode": "8710103974833"
      },
      {
        "question": "Hoe lang gaat de batterij mee?",
        "count": 32,
        "productCode": "8710103974833"
      }
    ]
  }
}
```

### GET /api/v1/qa/history/:productCode

Get Q&A history for a specific product.

**Request:**

```http
GET /api/v1/qa/history/8710103974833?limit=20
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productCode` | string | Yes | Product GTIN (in URL) |
| `limit` | number | No | Max questions to return (default: 20) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "productCode": "8710103974833",
    "qaHistory": [
      {
        "id": 1,
        "question": "Is dit apparaat stil?",
        "answer": "Uit de reviews blijkt...",
        "confidence": "high",
        "language": "nl",
        "created_at": "2026-01-22T10:30:00Z"
      }
    ]
  }
}
```

### GET /api/v1/analytics/:locationId

Get widget usage analytics for a location (requires authentication).

**Request:**

```http
GET /api/v1/analytics/1051093?days=30
X-Api-Token: your-kiyoh-api-token
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationId` | string | Yes | Kiyoh location ID (in URL) |
| `days` | number | No | Time period in days (default: 30) |

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "totalQuestions": 1247,
    "questionsToday": 45,
    "averageResponseTime": 1823,
    "cacheHitRate": 64.5,
    "errorCount": 12,
    "popularProducts": [
      {
        "productCode": "8710103974833",
        "questionCount": 234
      }
    ],
    "period": "Last 30 days"
  }
}
```

### GET /api/health

Health check endpoint (no authentication required).

**Request:**

```http
GET /api/health
```

**Response (Success - 200):**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 86400,
  "timestamp": "2026-01-22T10:30:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "gemini": "configured"
  }
}
```

## Rate Limiting

Rate limits are applied per IP address and per location:

- **Per IP**: 20 requests per hour
- **Per Location**: 1000 requests per day

When rate limited, you'll receive a `429 Too Many Requests` response with a `Retry-After` header indicating when you can retry.

## Caching

Responses are cached to improve performance and reduce costs:

- **Product data**: 24 hours
- **Q&A pairs**: 7 days (same question for same product)
- **Popular questions**: 1 hour

Cached responses include `"cached": true` in the metadata.

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API token |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Temporary issue |

## Best Practices

1. **Cache responses** - Implement client-side caching for better UX
2. **Handle errors gracefully** - Always check the `success` field
3. **Respect rate limits** - Implement exponential backoff
4. **Use webhooks** - For real-time updates (if available)
5. **Monitor usage** - Use the analytics endpoint to track usage

## Example Implementations

### JavaScript (Fetch API)

```javascript
async function askQuestion(locationId, apiToken, productCode, question) {
  const response = await fetch('https://your-api.com/api/v1/qa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Token': apiToken
    },
    body: JSON.stringify({
      locationId,
      productCode,
      question,
      language: 'nl',
      apiToken
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.data;
}
```

### cURL

```bash
curl -X POST https://your-api.com/api/v1/qa \
  -H "Content-Type: application/json" \
  -H "X-Api-Token: your-kiyoh-api-token" \
  -d '{
    "locationId": "1051093",
    "productCode": "8710103974833",
    "question": "Is dit apparaat stil?",
    "language": "nl",
    "apiToken": "your-kiyoh-api-token"
  }'
```

### Python (requests)

```python
import requests

def ask_question(location_id, api_token, product_code, question):
    url = 'https://your-api.com/api/v1/qa'
    headers = {
        'Content-Type': 'application/json',
        'X-Api-Token': api_token
    }
    data = {
        'locationId': location_id,
        'productCode': product_code,
        'question': question,
        'language': 'nl',
        'apiToken': api_token
    }

    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()

    return response.json()['data']
```

## Support

For API support:
- 📧 Email: api-support@your-domain.com
- 📖 Docs: https://docs.your-domain.com/api
- 🐛 Issues: GitHub Issues
