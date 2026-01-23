/**
 * Kiyoh Widget Styles - Compact Bar Design
 */

export const styles = `
  :host {
    --kiyoh-orange: #FF6600;
    --kiyoh-orange-light: #fff7ed;
    --bg: #ffffff;
    --text: #1a1a1a;
    --text-muted: #6b7280;
    --border: #e5e7eb;
    --radius: 12px;

    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: var(--text);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .widget-container {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    max-width: 480px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  /* Header Bar: Score on right, title on left */
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .widget-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text);
  }

  .score-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--kiyoh-orange-light);
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px solid #ffedd5;
    font-size: 0.85rem;
  }

  .score-badge .stars { color: var(--kiyoh-orange); }
  .score-badge .score { font-weight: 700; }
  .score-badge .count { color: var(--text-muted); font-size: 0.75rem; }
  .score-badge .kiyoh-logo { color: var(--kiyoh-orange); font-weight: bold; margin-left: 2px; }

  /* Suggested Questions */
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .suggestion-chip {
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: #fff;
    color: var(--text-muted);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .suggestion-chip:hover {
    border-color: var(--kiyoh-orange);
    color: var(--kiyoh-orange);
    background: var(--kiyoh-orange-light);
  }

  /* Input Row: Input + Ask Button inline */
  .input-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .question-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    resize: none;
    transition: border-color 0.15s;
  }

  .question-input:focus {
    outline: none;
    border-color: var(--kiyoh-orange);
  }

  .question-input::placeholder {
    color: #9ca3af;
  }

  .ask-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: var(--kiyoh-orange);
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .ask-button:hover {
    background: #e65c00;
  }

  .ask-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Loading */
  .loading-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #ffedd5;
    border-top-color: var(--kiyoh-orange);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Answer Section */
  .answer-section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .answer-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .ai-badge {
    background: var(--kiyoh-orange);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .answer-label {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .answer-text {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text);
  }

  /* Review Snippets */
  .snippets {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dotted #e5e7eb;
  }

  .snippets-title {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .snippet {
    background: #f9fafb;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 6px;
    font-size: 0.8rem;
  }

  .snippet-rating { color: #f59e0b; font-weight: 600; }
  .snippet-text { color: #4b5563; font-style: italic; }
  .snippet-author { color: #9ca3af; font-size: 0.75rem; text-align: right; }

  /* Error */
  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-bottom: 10px;
  }

  /* Hidden */
  .hidden { display: none; }
`;
