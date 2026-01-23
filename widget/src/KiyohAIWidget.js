import ProductDetector from './utils/productDetector.js';
import ProductInfoScraper from './utils/productInfoScraper.js';
import APIClient from './utils/apiClient.js';
import { styles } from './styles.js';

/**
 * Kiyoh AI Q&A Widget - Web Component
 * Liquid Glass UI Design
 */
class KiyohAIWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this.state = {
      locationId: null,
      productCode: null,
      productIdentifier: null, // {type, value} from detector
      productContext: null, // Scraped page info
      autoDetect: true,
      language: 'nl',
      primaryColor: '#00a0dc',
      showProductInfo: true,
      apiBaseUrl: null,
      loading: false,
      error: null,
      answer: null,
      shopRating: null,
      shopReviewCount: null,
      popularQuestions: []
    };

    this.apiClient = null;
  }

  static get observedAttributes() {
    return [
      'data-location-id',
      'data-product-code',
      'data-auto-detect',
      'data-language',
      'data-primary-color',
      'data-show-product-info',
      'data-api-base-url'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const mapping = {
      'data-location-id': 'locationId',
      'data-product-code': 'productCode',
      'data-auto-detect': 'autoDetect',
      'data-language': 'language',
      'data-primary-color': 'primaryColor',
      'data-show-product-info': 'showProductInfo',
      'data-api-base-url': 'apiBaseUrl'
    };

    const stateKey = mapping[name];
    if (stateKey) {
      if (stateKey === 'autoDetect' || stateKey === 'showProductInfo') {
        this.state[stateKey] = newValue !== 'false';
      } else {
        this.state[stateKey] = newValue;
      }
    }
  }

  async connectedCallback() {
    this.render();
    await this.initialize();
  }

  async initialize() {
    try {
      // Validate required attributes
      if (!this.state.locationId) {
        throw new Error('data-location-id is required');
      }

      // Initialize API client
      this.apiClient = new APIClient(
        this.state.apiBaseUrl || 'https://your-api-domain.com/api/v1'
      );

      // Scrape product information from page
      this.state.productContext = ProductInfoScraper.scrape();
      console.log('[KiyohAIWidget] Product context:', this.state.productContext);

      // Auto-detect product identifier if enabled
      if (this.state.autoDetect && !this.state.productCode) {
        console.log('[KiyohAIWidget] Auto-detecting product...');
        this.state.productIdentifier = await ProductDetector.detect();

        if (this.state.productIdentifier) {
          console.log('[KiyohAIWidget] Detected:', this.state.productIdentifier);
          if (this.state.productIdentifier.type === 'gtin') {
            this.state.productCode = this.state.productIdentifier.value;
          }
        }
      }

      // Load shop rating immediately (before any question)
      await this.loadShopRating();

      // Load popular questions
      await this.loadPopularQuestions();

      this.render();
    } catch (error) {
      console.error('[KiyohAIWidget] Initialization error:', error);
      this.setState({ error: error.message });
    }
  }

  async loadShopRating() {
    try {
      const response = await this.apiClient.getShopRating(this.state.locationId);
      if (response.success && response.data) {
        this.setState({
          shopRating: response.data.rating,
          shopReviewCount: response.data.reviewCount
        });
        console.log('[KiyohAIWidget] Shop rating loaded:', response.data.rating);
      }
    } catch (error) {
      console.warn('[KiyohAIWidget] Could not load shop rating:', error);
    }
  }

  async loadPopularQuestions() {
    try {
      const response = await this.apiClient.getPopularQuestions(
        this.state.locationId,
        5
      );

      if (response.success && response.data.questions.length > 0) {
        this.setState({
          popularQuestions: response.data.questions.slice(0, 5)
        });
      } else {
        // Fallback: Use default questions if none found
        this.setState({
          popularQuestions: [
            { question: "Wat zijn de belangrijkste plus- en minpunten?" },
            { question: "Wat zeggen klanten over de kwaliteit?" },
            { question: "Zou je dit product aanraden?" }
          ]
        });
      }
    } catch (error) {
      console.warn('[KiyohAIWidget] Could not load popular questions:', error);
    }
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();

    const textarea = this.shadowRoot.querySelector('.question-input');
    const question = textarea.value.trim();

    if (!question) return;

    // Allow questions even without product code (will use product context/identifier)
    this.setState({ loading: true, error: null, answer: null });

    try {
      const response = await this.apiClient.askQuestion(
        this.state.locationId,
        question,
        {
          productCode: this.state.productCode,
          productIdentifier: this.state.productIdentifier,
          productContext: this.state.productContext
        },
        this.state.language,
        window.location.href // Send Source URL for backend scraper fallback
      );

      if (response.success) {
        // Extract shop data from new structure: response.data.shop.rating
        const shopData = response.data.shop || {};

        this.setState({
          loading: false,
          answer: response.data,
          shopRating: shopData.rating || response.data.product?.rating || null,
          shopReviewCount: shopData.reviewCount || response.data.product?.reviewCount || null
        });

        // Scroll to answer
        setTimeout(() => {
          const answerEl = this.shadowRoot.querySelector('.answer-section');
          if (answerEl) {
            answerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('[KiyohAIWidget] Error asking question:', error);
      this.setState({
        loading: false,
        error: error.message || 'Failed to get answer. Please try again.'
      });
    } finally {
      textarea.value = '';
    }
  }

  handlePopularQuestionClick(question) {
    const textarea = this.shadowRoot.querySelector('.question-input');
    textarea.value = question;
    textarea.focus();

    // Trigger submit
    const form = this.shadowRoot.querySelector('form');
    form.dispatchEvent(new Event('submit'));
  }

  handleInputChange(e) {
    const charCounter = this.shadowRoot.querySelector('.char-counter');
    if (charCounter) {
      charCounter.textContent = `${e.target.value.length}/500`;
    }
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating / 2) % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    return stars.padEnd(5, '☆');
  }

  render() {
    const { answer, loading, error, popularQuestions, shopRating, shopReviewCount } = this.state;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="widget-container">
        
        <!-- Header Bar: Title left, Score right -->
        <div class="header-bar">
          <span class="widget-title">Vraag het aan klanten</span>
          ${shopRating ? `
            <div class="score-badge">
              <span class="stars">${this.renderStars(shopRating)}</span>
              <span class="score">${shopRating}/10</span>
              <span class="count">(${shopReviewCount || 0})</span>
              <span class="kiyoh-logo">✓</span>
            </div>
          ` : ''}
        </div>

        ${error ? `<div class="error-message">⚠️ ${error}</div>` : ''}

        <!-- Suggested Questions -->
        ${!answer && !loading && popularQuestions.length > 0 ? `
          <div class="suggestions">
            ${popularQuestions.slice(0, 3).map((q, i) => `
              <button type="button" class="suggestion-chip" data-index="${i}">
                ${q.question.length > 35 ? q.question.substring(0, 35) + '...' : q.question}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- Input Row: Input + Ask Button -->
        <form>
          <div class="input-row">
            <input
              type="text"
              class="question-input"
              placeholder="Stel je vraag over dit product..."
              maxlength="200"
              ${loading ? 'disabled' : ''}
            />
            <button type="submit" class="ask-button" ${loading ? 'disabled' : ''}>
              ${loading ? '...' : 'Vraag'}
            </button>
          </div>
        </form>

        <!-- Loading -->
        ${loading ? `
          <div class="loading-container">
            <div class="spinner"></div>
            <span>Analyseren...</span>
          </div>
        ` : ''}

        <!-- Answer -->
        ${answer ? `
          <div class="answer-section">
            <div class="answer-header">
              <span class="ai-badge">AI</span>
              <span class="answer-label">Gebaseerd op ${answer.reviewsUsed || 'klant'} reviews</span>
            </div>
            <div class="answer-text">${answer.answer}</div>

            ${answer.relevantReviews && answer.relevantReviews.length > 0 ? `
              <div class="snippets">
                <div class="snippets-title">Klantreviews</div>
                ${answer.relevantReviews.slice(0, 2).map(review => `
                  <div class="snippet">
                    <span class="snippet-rating">${this.renderStars(review.rating)}</span>
                    <span class="snippet-text">"${review.excerpt}"</span>
                    <div class="snippet-author">— ${review.author}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    // Attach event listeners
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const textarea = this.shadowRoot.querySelector('.question-input');
    if (textarea) {
      textarea.addEventListener('input', (e) => this.handleInputChange(e));
    }

    const suggestionChips = this.shadowRoot.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach((chip, index) => {
      chip.addEventListener('click', () => {
        const question = popularQuestions[index]?.question;
        if (question) {
          this.handlePopularQuestionClick(question);
        }
      });
    });
  }
}

// Register the custom element
customElements.define('kiyoh-ai-widget', KiyohAIWidget);

export default KiyohAIWidget;
