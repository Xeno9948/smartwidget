/**
 * Build optimized prompts for Google Gemini with dual-source context
 */

function buildQAPrompt(productData, reviews, question, language = 'nl', productContext = null) {
  const { productName, gtin, averageRating, reviewCount } = productData;

  // Analyze reviews for common themes
  const { topPros, topCons, relevantReviews } = analyzeReviews(reviews, question);

  const systemInstruction = getSystemInstruction(productName, language, productContext);
  const productSpecsSection = productContext ? buildProductSpecsSection(productContext, language) : '';
  const contextSection = buildContextSection(productName, gtin, averageRating, reviewCount, topPros, topCons);
  const reviewsSection = buildReviewsSection(relevantReviews);
  const questionSection = language === 'nl' ? `Vraag van klant: ${question}` : `Customer question: ${question}`;

  const prompt = [
    productSpecsSection,
    contextSection,
    reviewsSection,
    questionSection
  ].filter(Boolean).join('\n\n');

  return {
    systemInstruction,
    prompt
  };
}

function getSystemInstruction(productName, language, productContext) {
  const hasSpecs = productContext && (Object.keys(productContext.specs || {}).length > 0 || productContext.description);

  const instructions = {
    nl: `Je bent een objectieve productexpert assistent voor ${productName}.

Je hebt toegang tot ${hasSpecs ? 'TWEE informatiebronnen' : 'ÉÉN informatiebron'}:

${hasSpecs ? `BRON 1: PRODUCTSPECIFICATIES (van fabrikant/verkoper)
- Officiële specificaties, afmetingen, kenmerken
- Productbeschrijving
- Technische details

BRON 2: KLANTBEOORDELINGEN (echte kopers via Kiyoh)` : 'BRON: KLANTBEOORDELINGEN (echte kopers via Kiyoh)'}
- Ervaringen van echte gebruikers
- Ratings en meningen
- Praktische inzichten

ANTWOORD RICHTLIJNEN:
1. Voor FEITELIJKE vragen (afmetingen, specs, kenmerken):
   ${hasSpecs ? '→ Gebruik BRON 1 (Productspecificaties)' : '→ Zoek in reviewteksten of zeg "Niet vermeld in reviews"'}
   → Verwijs: "Volgens de productspecificaties..."

2. Voor ERVARINGSVRAGEN (kwaliteit, gebruiksgemak, geluid):
   → Gebruik ${hasSpecs ? 'BRON 2' : 'reviews'} (Klantbeoordelingen)
   → Verwijs: "Op basis van X klantreviews..."

3. Voor GEMENGDE vragen:
   → Combineer beide bronnen
   → Geef duidelijk aan waar elk stukje info vandaan komt

4. Als informatie NIET in bronnen staat:
   → Zeg eerlijk "Deze informatie is niet beschikbaar"
   → VERZIN NOOIT informatie

5. Houd antwoorden kort: 3-4 zinnen
6. Gebruik vriendelijke, behulpzame toon
7. Noem NOOIT concurrenten`,

    en: `You are an objective product expert assistant for ${productName}.

You have access to ${hasSpecs ? 'TWO information sources' : 'ONE information source'}:

${hasSpecs ? `SOURCE 1: PRODUCT SPECIFICATIONS (from manufacturer/seller)
- Official specifications, dimensions, features
- Product description
- Technical details

SOURCE 2: CUSTOMER REVIEWS (real buyers via Kiyoh)` : 'SOURCE: CUSTOMER REVIEWS (real buyers via Kiyoh)'}
- Real user experiences
- Ratings and opinions
- Practical insights

ANSWER GUIDELINES:
1. For FACTUAL questions (dimensions, specs, features):
   ${hasSpecs ? '→ Use SOURCE 1 (Product Specifications)' : '→ Search review text or say "Not mentioned in reviews"'}
   → Reference: "According to product specifications..."

2. For EXPERIENCE questions (quality, ease of use, noise):
   → Use ${hasSpecs ? 'SOURCE 2' : 'reviews'} (Customer Reviews)
   → Reference: "Based on X customer reviews..."

3. For MIXED questions:
   → Combine both sources
   → Clearly indicate where each piece of info comes from

4. If information NOT in sources:
   → Honestly say "This information is not available"
   → NEVER make up information

5. Keep answers concise: 3-4 sentences
6. Use friendly, helpful tone
7. NEVER mention competitors`
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

/**
 * Build product specifications section from scraped context
 */
function buildProductSpecsSection(productContext, language = 'nl') {
  if (!productContext) return '';

  const { name, description, specs, attributes } = productContext;

  const title = language === 'nl' ? 'PRODUCTSPECIFICATIES' : 'PRODUCT SPECIFICATIONS';
  const sections = [];

  // Product name
  if (name) {
    sections.push(`Product: ${name}`);
  }

  // Description
  if (description && description.length > 10) {
    const descTitle = language === 'nl' ? 'Beschrijving' : 'Description';
    sections.push(`${descTitle}: ${description.slice(0, 300)}`); // Limit to 300 chars
  }

  // Specifications
  if (specs && Object.keys(specs).length > 0) {
    const specsTitle = language === 'nl' ? 'Technische specificaties' : 'Technical specifications';
    sections.push(specsTitle + ':');
    for (const [key, value] of Object.entries(specs)) {
      const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      sections.push(`- ${readableKey}: ${value}`);
    }
  }

  // Attributes
  if (attributes && Object.keys(attributes).length > 0) {
    const attrsTitle = language === 'nl' ? 'Kenmerken' : 'Attributes';
    sections.push(attrsTitle + ':');
    for (const [key, value] of Object.entries(attributes)) {
      const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      sections.push(`- ${readableKey}: ${value}`);
    }
  }

  if (sections.length === 0) return '';

  return `${title}:\n${sections.join('\n')}`;
}

module.exports = { buildQAPrompt };
