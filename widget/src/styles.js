/**
 * Liquid Glass UI Styles
 * Modern glassmorphism design with smooth animations
 */

export const styles = `
  :host {
    --primary-color: var(--kiyoh-primary, #00a0dc);
    --primary-rgb: 0, 160, 220;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.3);
    --glass-shadow: rgba(0, 0, 0, 0.1);
    --text-primary: #1a1a1a;
    --text-secondary: #666;
    --border-radius: 20px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .widget-container {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--glass-border);
    border-radius: var(--border-radius);
    padding: 1.25rem;
    max-width: 560px;
    margin: 0 auto;
    box-shadow:
      0 8px 32px var(--glass-shadow),
      0 2px 8px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    position: relative;
    overflow: hidden;
  }

  .widget-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent,
      var(--primary-color),
      transparent
    );
    opacity: 0.5;
  }

  .product-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--primary-rgb), 0.02) 100%);
    border-radius: 16px;
    border: 1px solid rgba(var(--primary-rgb), 0.1);
    margin-bottom: 2rem;
    transition: var(--transition);
  }

  .product-header:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.15);
  }

  .product-image {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .product-info {
    flex: 1;
  }

  .product-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .stars {
    color: #fbbf24;
    font-size: 1.1rem;
  }

  .question-input-container {
    margin-bottom: 2rem;
  }

  .input-label {
    display: block;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .question-input {
    width: 100%;
    padding: 1rem 1.25rem;
    border: 2px solid transparent;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    font-size: 1rem;
    font-family: inherit;
    color: var(--text-primary);
    transition: var(--transition);
    resize: vertical;
    min-height: 100px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .question-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow:
      0 4px 16px rgba(var(--primary-rgb), 0.2),
      0 0 0 4px rgba(var(--primary-rgb), 0.1);
    background: rgba(255, 255, 255, 1);
  }

  .question-input::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .char-counter {
    text-align: right;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .ask-button {
    width: 100%;
    padding: 1rem 2rem;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-rgb), 0.8) 100%);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    box-shadow:
      0 4px 16px rgba(var(--primary-rgb), 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
  }

  .ask-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .ask-button:hover::before {
    width: 300px;
    height: 300px;
  }

  .ask-button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px rgba(var(--primary-rgb), 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .ask-button:active {
    transform: translateY(0);
  }

  .ask-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(var(--primary-rgb), 0.2);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .answer-container {
    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.03) 0%, rgba(255, 255, 255, 0.5) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(var(--primary-rgb), 0.15);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    animation: slideIn 0.5s ease-out;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .answer-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .ai-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-rgb), 0.7) 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
  }

  .answer-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .confidence-badge {
    margin-left: auto;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .confidence-high {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .confidence-medium {
    background: rgba(251, 191, 36, 0.15);
    color: #d97706;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }

  .confidence-low {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .answer-text {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-primary);
  }

  .review-snippets {
    margin-top: 2rem;
  }

  .snippets-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .review-snippet {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    transition: var(--transition);
  }

  .review-snippet:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .review-rating {
    color: #fbbf24;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .review-text {
    font-size: 0.95rem;
    color: var(--text-primary);
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }

  .review-author {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .popular-questions {
    margin-top: 2rem;
  }

  .popular-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .question-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .question-button {
    padding: 0.6rem 1.2rem;
    border: 1px solid rgba(var(--primary-rgb), 0.2);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    color: var(--text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .question-button:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
  }

  .error-message {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 1.25rem;
    color: #dc2626;
    margin-bottom: 1.5rem;
    animation: shake 0.5s;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  .hidden {
    display: none;
  }

  @media (max-width: 768px) {
    .widget-container {
      padding: 1.5rem;
      border-radius: 16px;
    }

    .product-header {
      flex-direction: column;
      text-align: center;
    }

    .product-image {
      width: 100px;
      height: 100px;
    }

    .question-input {
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
`;
