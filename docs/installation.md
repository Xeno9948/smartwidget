# Installation Guide

## For Customers (Website Integration)

### Basic Installation

The simplest way to add the Kiyoh AI Widget to your website:

```html
<!-- Add before closing </body> tag -->
<script src="https://your-cdn.com/widget.min.js"></script>

<kiyoh-ai-widget
  data-location-id="YOUR_LOCATION_ID"
  data-api-token="YOUR_KIYOH_API_TOKEN">
</kiyoh-ai-widget>
```

### Step-by-Step Guide

#### 1. Get Your Credentials

You need two pieces of information from your Kiyoh dashboard:

- **Location ID**: Your unique Kiyoh location identifier (e.g., `1051093`)
- **API Token**: Your Kiyoh Product Reviews API token

#### 2. Add the Script Tag

Add this script tag to your HTML, preferably before the closing `</body>` tag:

```html
<script src="https://your-cdn.com/widget.min.js"></script>
```

#### 3. Add the Widget Element

Place the widget where you want it to appear on your product pages:

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-api-token-here">
</kiyoh-ai-widget>
```

#### 4. (Optional) Manual Product Code

If the widget can't auto-detect your product GTIN, add it manually:

```html
<kiyoh-ai-widget
  data-location-id="1051093"
  data-api-token="your-api-token-here"
  data-product-code="8710103974833">
</kiyoh-ai-widget>
```

## Auto-Detection Setup

The widget automatically detects product GTINs from your page using these methods (in order):

### 1. Schema.org JSON-LD (Recommended)

Add structured data to your product pages:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "gtin13": "8710103974833"
}
</script>
```

### 2. Meta Tags

```html
<meta property="product:gtin" content="8710103974833">
<!-- or -->
<meta property="og:product:gtin" content="8710103974833">
```

### 3. Microdata

```html
<span itemprop="gtin13">8710103974833</span>
```

### 4. Data Attributes

```html
<div data-gtin="8710103974833"></div>
<!-- or -->
<div data-product-code="8710103974833"></div>
```

## Platform-Specific Integration

### WooCommerce

The widget automatically detects GTINs if you use them as SKUs:

```php
// In your product template
<div class="product_meta">
  <span class="sku"><?php echo $product->get_sku(); ?></span>
</div>
```

Then add the widget to your `single-product.php`:

```php
<?php
// After product details
echo '<kiyoh-ai-widget
        data-location-id="' . esc_attr( YOUR_LOCATION_ID ) . '"
        data-api-token="' . esc_attr( YOUR_API_TOKEN ) . '">
      </kiyoh-ai-widget>';
?>
```

### Shopify

Add to your product template (`product.liquid`):

```liquid
{% if product.selected_or_first_available_variant.sku %}
  <script>
    window.ShopifyAnalytics = {
      meta: {
        product: {
          variants: [{ sku: "{{ product.selected_or_first_available_variant.sku }}" }]
        }
      }
    };
  </script>
{% endif %}

<kiyoh-ai-widget
  data-location-id="{{ settings.kiyoh_location_id }}"
  data-api-token="{{ settings.kiyoh_api_token }}">
</kiyoh-ai-widget>
```

### Magento

Add to your product view template:

```php
<script>
window.dlv_dataLayer = {
  product: {
    sku: '<?php echo $product->getSku(); ?>'
  }
};
</script>

<kiyoh-ai-widget
  data-location-id="<?php echo $this->getKiyohLocationId(); ?>"
  data-api-token="<?php echo $this->getKiyohApiToken(); ?>">
</kiyoh-ai-widget>
```

## Configuration Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-location-id` | Yes | - | Your Kiyoh location ID |
| `data-api-token` | Yes | - | Your Kiyoh API token |
| `data-product-code` | No | Auto-detect | Manual GTIN override |
| `data-auto-detect` | No | `true` | Enable auto GTIN detection |
| `data-language` | No | `nl` | Widget language (`nl`, `en`, `de`, `fr`) |
| `data-primary-color` | No | `#00a0dc` | Custom brand color |
| `data-show-product-info` | No | `true` | Show product header |
| `data-api-base-url` | No | Production URL | Custom API URL |

## Troubleshooting

### Widget not appearing?

1. Check browser console for errors
2. Verify script tag is loading correctly
3. Ensure `data-location-id` and `data-api-token` are set

### GTIN not detected?

1. Check if your page has GTIN in Schema.org, meta tags, or data attributes
2. Use browser console to debug: it will log which detection method worked
3. Add `data-product-code` manually as fallback

### Questions not loading?

1. Verify your Kiyoh API token is correct
2. Check if product has reviews in Kiyoh
3. Check network tab for API errors

## Advanced Usage

### Dynamic Product Pages (SPA)

For single-page applications, reinitialize the widget when product changes:

```javascript
// When product changes
const widget = document.querySelector('kiyoh-ai-widget');
widget.setAttribute('data-product-code', newProductCode);
widget.connectedCallback(); // Reinitialize
```

### Multiple Widgets

You can have multiple widgets on one page:

```html
<kiyoh-ai-widget data-location-id="1051093" data-product-code="111111"></kiyoh-ai-widget>
<kiyoh-ai-widget data-location-id="1051093" data-product-code="222222"></kiyoh-ai-widget>
```

### Custom Styling

Override CSS variables in your stylesheet:

```css
kiyoh-ai-widget {
  --kiyoh-primary: #ff6600;
  --border-radius: 12px;
}
```

## Security Best Practices

1. **Never expose sensitive tokens in frontend code** - The API token in the widget should be a read-only token
2. **Use HTTPS** - Always serve your site over HTTPS
3. **Content Security Policy** - Add the widget domain to your CSP

```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' https://your-cdn.com">
```

## Support

For installation help:
- 📧 Email: support@your-domain.com
- 📖 Docs: https://docs.your-domain.com
- 🐛 Issues: GitHub Issues
