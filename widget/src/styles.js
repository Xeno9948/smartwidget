/**
 * Kiyoh Wrapper UI Styles
 * Refined, compact, and brand-aligned
 */

export const styles = `
  :host {
    --primary-color: #FF6600;
    --primary-gradient: linear-gradient(135deg, #FF6600 0%, #FF8533 100%);
    --bg-color: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #666;
    --border-radius: 16px;
    --transition: all 0.2s ease;

    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .widget-container {
    background: var(--bg-color);
    border: 1px solid #e5e7eb;
    border-radius: var(--border-radius);
    padding: 1rem;
    max-width: 420px; /* Reduced from 560px */
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  /* Shop Header */
  .shop-header {
    background: #fff; /* Clean white */
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: center;
  }
  
  .shop-rating-container {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    background: #fff7ed; /* Light orange tint */
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    border: 1px solid #ffedd5;
  }
  
  .shop-stars { color: #FF6600; letter-spacing: 1px; }
  .shop-score { font-weight: 700; color: #1a1a1a; }
  .shop-reviews { color: #6b7280; font-size: 0.8rem; }
  .kiyoh-check { color: #FF6600; font-weight: bold; }

  /* Product Header */
  .product-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 12px;
  }

  .product-image {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #e5e7eb;
  }

  .product-name {
    font-weight: 600;
    font-size: 0.95rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Input Section */
  .question-input-container { margin-bottom: 1rem; }
  
  .input-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .question-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 0.95rem;
    font-family: inherit;
    transition: var(--transition);
    resize: none;
    height: 80px;
  }

  .question-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
  }

  .char-counter {
    text-align: right;
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  .ask-button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 10px;
    background: var(--primary-color);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }

  .ask-button:hover {
    background: #e65c00;
    transform: translateY(-1px);
  }

  .ask-button:active { transform: translateY(0); }
  .ask-button:disabled { opacity: 0.6; cursor: not-allowed; }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #ffedd5;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Answer Section */
  .answer-container {
    margin-top: 1.5rem;
    background: #fff;
    border-top: 1px solid #f3f4f6;
    padding-top: 1.5rem;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .answer-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .ai-icon {
    width: 24px;
    height: 24px;
    background: var(--primary-color);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .answer-title { font-weight: 600; font-size: 0.95rem; }

  .answer-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #374151;
  }

  .review-snippets {
    margin-top: 1.5rem;
    border-top: 1px dotted #e5e7eb;
    padding-top: 1rem;
  }

  .snippets-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
  }

  .review-snippet {
    background: #f9fafb;
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }

  .review-rating { color: #f59e0b; font-weight: 600; margin-bottom: 0.25rem; }
  .review-text { font-style: italic; color: #4b5563; margin-bottom: 0.25rem; }
  .review-author { text-align: right; color: #9ca3af; font-size: 0.75rem; }

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 8px;
    font-size: 0.9rem;
    text-align: center;
  }

  /* Popular Questions */
  .popular-questions { margin-top: 1.5rem; }
  .popular-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }
  
  .question-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .question-button {
    padding: 0.4rem 0.8rem;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: #fff;
    color: var(--text-secondary);
    font-size: 0.85rem;
    cursor: pointer;
    transition: var(--transition);
  }

  .question-button:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: #fff7ed;
  }
`;
