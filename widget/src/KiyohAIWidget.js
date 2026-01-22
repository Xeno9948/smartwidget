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
      const scraper = new ProductInfoScraper();
      this.state.productContext = scraper.scrape();
      console.log('[KiyohAIWidget] Product context:', this.state.productContext);

      // Auto-detect product identifier if enabled
      if (this.state.autoDetect && !this.state.productCode) {
        console.log('[KiyohAIWidget] Auto-detecting product...');
        this.state.productIdentifier = await ProductDetector.detect();

        if (this.state.productIdentifier) {
          console.log('[KiyohAIWidget] Detected:', this.state.productIdentifier);
          // Use GTIN if available, otherwise use identifier value
          if (this.state.productIdentifier.type === 'gtin') {
            this.state.productCode = this.state.productIdentifier.value;
          }
        } else {
          console.warn('[KiyohAIWidget] Could not detect product identifier');
        }
      }

      // Load popular questions
      await this.loadPopularQuestions();

      this.render();
    } catch (error) {
      console.error('[KiyohAIWidget] Initialization error:', error);
      this.setState({ error: error.message });
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
        this.state.language
      );

      if (response.success) {
        this.setState({
          loading: false,
          answer: response.data
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
    const { answer, loading, error, popularQuestions } = this.state;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="widget-container">
        ${error ? `
          <div class="error-message">
            ⚠️ ${error}
          </div>
        ` : ''}

        ${answer && answer.product && this.state.showProductInfo ? `
          <div class="product-header">
            ${answer.product.imageUrl ? `
              <img src="${answer.product.imageUrl}" alt="${answer.product.name}" class="product-image">
            ` : ''}
            <div class="product-info">
              <div class="product-name">${answer.product.name}</div>
              <div class="product-rating">
                <span class="stars">${this.renderStars(answer.product.rating)}</span>
                <span>${answer.product.rating}/10</span>
                <span>•</span>
                <span>${answer.product.reviewCount} reviews</span>
              </div>
            </div>
          </div>
        ` : ''}

        <form>
          <div class="question-input-container">
            <label class="input-label">Stel je vraag over dit product</label>
            <textarea
              class="question-input"
              placeholder="Bijvoorbeeld: Hoe stil is dit apparaat?"
              maxlength="500"
              rows="3"
            ></textarea>
            <div class="char-counter">0/500</div>
          </div>

          <button type="submit" class="ask-button" ${loading ? 'disabled' : ''}>
            ${loading ? 'Even geduld...' : 'Stel vraag'}
          </button>
        </form>

        ${loading ? `
          <div class="loading">
            <div class="spinner"></div>
            <span>AI analyseert reviews...</span>
          </div>
        ` : ''}

        ${answer ? `
          <div class="answer-container">
            <div class="answer-header">
              <div class="ai-icon">AI</div>
              <span class="answer-title">Antwoord gebaseerd op ${answer.product.reviewCount} reviews</span>
              <span class="confidence-badge confidence-${answer.confidence}">${answer.confidence}</span>
            </div>
            <div class="answer-text">${answer.answer}</div>

            ${answer.relevantReviews && answer.relevantReviews.length > 0 ? `
              <div class="review-snippets">
                <div class="snippets-title">Relevante klantreviews</div>
                ${answer.relevantReviews.map(review => `
                  <div class="review-snippet">
                    <div class="review-rating">${this.renderStars(review.rating)} ${review.rating}/10</div>
                    <div class="review-text">"${review.excerpt}"</div>
                    <div class="review-author">— ${review.author}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${!answer && !loading && popularQuestions.length > 0 ? `
          <div class="popular-questions">
            <div class="popular-title">💡 Veelgestelde vragen</div>
            <div class="question-buttons">
              ${popularQuestions.map((q, i) => `
                <button type="button" class="question-button" data-question="${q.question}" data-index="${i}">
                  ${q.question}
                </button>
              `).join('')}
            </div>
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

    const questionButtons = this.shadowRoot.querySelectorAll('.question-button');
    questionButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
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
