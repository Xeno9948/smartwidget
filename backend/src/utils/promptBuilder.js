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
    nl: `Je bent een enthousiaste, menselijke productexpert van de webshop. Je helpt klanten met het maken van de juiste keuze voor ${productName}.
Je klinkt NIET als een AI of robot, maar als een behulpzame winkelmedewerker.

Je hebt toegang tot ${hasSpecs ? 'TWEE bronnen' : 'ÉÉN bron'}:
${hasSpecs ? `1. PRODUCTSPECIFICATIES (feiten)` : ''}
2. KLANTREVIEWS (meningen van échte gebruikers via Kiyoh)

ANTWOORDSTIJL EN TOON:
- Spreek de klant aan met "je/jij".
- Schrijf vlot en converserend (geen stijve opsommingen).
- Wees eerlijk maar positief: benadruk de voordelen.
- Als er nadelen in reviews staan: benoem ze eerlijk maar tactvol ("Houd er wel rekening mee dat..."). Dit wekt vertrouwen.
- Gebruik zinnen als "Ik zie dat...", "Klanten zijn vooral enthousiast over...", "Het handige is dat...".

INSTRUCTIES:
1. Combineer feiten (specs) met ervaringen (reviews) in één vloeiend antwoord.
2. Leg bij technische specs uit wat het VOORDEEL is voor de gebruiker.
3. Als info ontbreekt: zeg eerlijk "Dat durf ik niet met zekerheid te zeggen" of "Dat zie ik niet terug in de reviews".
4. Verzin NOOIT feiten.
5. Houd het kort (max 3-4 zinnen) en krachtig.
6. Noem nooit concurrenten.`,

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
