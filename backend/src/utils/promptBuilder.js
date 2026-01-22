/**
 * Build optimized prompts for Google Gemini
 */

function buildQAPrompt(productData, reviews, question, language = 'nl') {
  const { productName, gtin, averageRating, reviewCount } = productData;

  // Analyze reviews for common themes
  const { topPros, topCons, relevantReviews } = analyzeReviews(reviews, question);

  const systemInstruction = getSystemInstruction(productName, language);
  const contextSection = buildContextSection(productName, gtin, averageRating, reviewCount, topPros, topCons);
  const reviewsSection = buildReviewsSection(relevantReviews);
  const questionSection = `Vraag van klant: ${question}`;

  return {
    systemInstruction,
    prompt: `${contextSection}\n\n${reviewsSection}\n\n${questionSection}`
  };
}

function getSystemInstruction(productName, language) {
  const instructions = {
    nl: `Je bent een objectieve productexpert assistent voor ${productName}.

Je taak is om vragen te beantwoorden op basis van ALLEEN de echte klantbeoordelingen die je hebt ontvangen. Je verzint geen informatie en bent eerlijk over wat je wel en niet weet.

ANTWOORD RICHTLIJNEN:
1. Baseer antwoorden UITSLUITEND op de gegeven review data
2. Verwijs naar echte klanten: 'Uit reviews blijkt...', 'Klanten melden...'
3. Quote specifieke reviews wanneer relevant (gebruik aanhalingstekens)
4. Geef een gebalanceerd beeld (positief EN negatief als beide in reviews staan)
5. Als informatie ontbreekt: 'In de reviews wordt dit niet specifiek genoemd'
6. Houd antwoorden kort: maximaal 3-4 zinnen
7. Gebruik vriendelijke, behulpzame toon
8. Antwoord in het Nederlands
9. Noem NOOIT concurrenten of alternatieve producten
10. Voor technische vragen: gebruik exacte specs als beschikbaar
11. Voor ervaringsvragen: verwijs naar ratings en review content`,

    en: `You are an objective product expert assistant for ${productName}.

Your task is to answer questions based ONLY on the real customer reviews provided. You don't make up information and are honest about what you know and don't know.

ANSWER GUIDELINES:
1. Base answers EXCLUSIVELY on the given review data
2. Reference real customers: 'Reviews show...', 'Customers report...'
3. Quote specific reviews when relevant (use quotation marks)
4. Provide a balanced view (positive AND negative if both in reviews)
5. If information is missing: 'This is not specifically mentioned in the reviews'
6. Keep answers concise: maximum 3-4 sentences
7. Use friendly, helpful tone
8. Answer in English
9. NEVER mention competitors or alternative products
10. For technical questions: use exact specs if available
11. For experience questions: reference ratings and review content`
  };

  return instructions[language] || instructions.nl;
}

function buildContextSection(productName, gtin, averageRating, reviewCount, topPros, topCons) {
  let context = `PRODUCTINFORMATIE:
- GTIN/EAN: ${gtin}
- Productnaam: ${productName}
- Gemiddelde beoordeling: ${averageRating}/10 sterren
- Aantal beoordelingen: ${reviewCount}

REVIEW ANALYSE:`;

  if (topPros.length > 0) {
    context += `\nPositieve aspecten (vaak genoemd):\n${topPros.map(p => `- ${p}`).join('\n')}`;
  }

  if (topCons.length > 0) {
    context += `\n\nAandachtspunten (soms genoemd):\n${topCons.map(c => `- ${c}`).join('\n')}`;
  }

  return context;
}

function buildReviewsSection(relevantReviews) {
  if (relevantReviews.length === 0) {
    return 'RECENTE KLANTREVIEWS:\n(Geen reviews beschikbaar)';
  }

  const reviewTexts = relevantReviews.slice(0, 10).map(review => {
    return `${review.rating}/10 - ${formatDate(review.dateSince)}
'${review.description || review.oneliner}'
- ${review.reviewAuthor}${review.city ? ` uit ${review.city}` : ''}`;
  }).join('\n\n');

  return `RECENTE KLANTREVIEWS (meest relevant voor deze vraag):\n${reviewTexts}`;
}

function analyzeReviews(reviews, question) {
  // Simple keyword extraction and sentiment analysis
  const topPros = [];
  const topCons = [];
  const relevantReviews = [];

  if (!reviews || reviews.length === 0) {
    return { topPros, topCons, relevantReviews };
  }

  // Sort by relevance to question and rating
  const sorted = [...reviews].sort((a, b) => {
    const aRelevance = calculateRelevance(a, question);
    const bRelevance = calculateRelevance(b, question);
    if (aRelevance !== bRelevance) return bRelevance - aRelevance;
    return new Date(b.dateSince) - new Date(a.dateSince);
  });

  // Extract top pros and cons
  const positiveReviews = reviews.filter(r => r.rating >= 7);
  const negativeReviews = reviews.filter(r => r.rating < 7);

  if (positiveReviews.length > 0) {
    topPros.push(`Hoge klanttevredenheid (${positiveReviews.length} van ${reviews.length} reviews met 7+ sterren)`);
  }

  if (negativeReviews.length > 0) {
    topCons.push(`Enkele kritische punten (${negativeReviews.length} reviews onder 7 sterren)`);
  }

  return {
    topPros,
    topCons,
    relevantReviews: sorted.slice(0, 15)
  };
}

function calculateRelevance(review, question) {
  const text = `${review.oneliner} ${review.description}`.toLowerCase();
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  let relevance = 0;
  questionWords.forEach(word => {
    if (text.includes(word)) {
      relevance += 2;
    }
  });

  // Boost recent reviews
  const daysSince = (Date.now() - new Date(review.dateSince)) / (1000 * 60 * 60 * 24);
  if (daysSince < 30) relevance += 1;

  // Boost reviews with descriptions
  if (review.description && review.description.length > 50) {
    relevance += 1;
  }

  return relevance;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

module.exports = { buildQAPrompt };
