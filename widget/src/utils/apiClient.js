/**
 * API Client for backend communication
 */

class APIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:3000/api/v1';
  }

  /**
   * Ask a question
   */
  async askQuestion(locationId, apiToken, question, productCode, language = 'nl') {
    const response = await fetch(`${this.baseUrl}/qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Token': apiToken
      },
      body: JSON.stringify({
        locationId,
        productCode,
        question,
        language,
        apiToken
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get popular questions
   */
  async getPopularQuestions(locationId, limit = 5) {
    const response = await fetch(
      `${this.baseUrl}/qa/popular/${locationId}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get Q&A history
   */
  async getQAHistory(productCode, limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/qa/history/${productCode}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export default APIClient;
