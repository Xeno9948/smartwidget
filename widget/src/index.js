/**
 * Kiyoh AI Q&A Widget - Entry Point
 * Version: 1.0.0
 */

import KiyohAIWidget from './KiyohAIWidget.js';

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('[Kiyoh AI Widget] Initialized');
}

// Export for module usage
export { KiyohAIWidget };
