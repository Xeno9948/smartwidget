/**
 * Build optimized prompts for Google Gemini with dual-source context
 */

function buildQAPrompt(productData, reviews, question, language = 'nl', productContext = null) {
  const { productName, gtin, averageRating, reviewCount, shopRating, shopReviewCount } = productData;

  // Analyze reviews for common themes
  const { topPros, topCons, relevantReviews } = analyzeReviews(reviews, question);

  const systemInstruction = getSystemInstruction(productName, language, productContext);
  const productSpecsSection = productContext ? buildProductSpecsSection(productContext, language) : '';
  const contextSection = buildContextSection(productName, gtin, averageRating, reviewCount, shopRating, shopReviewCount, topPros, topCons);
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
    nl: `Je bent GEEN AI, maar een enthousiaste, menselijke productspecialist van de webwinkel. Je helpt klanten met een glimlach bij hun keuze voor de ${productName || 'product'}.

BELANGRIJK JE ROL:
- Je klinkt als een behulpzame winkelmedewerker, niet als een computer.
- Je spreekt de klant aan met "je/jij" en bent vriendelijk.
- Je gebruikt emoticons waar gepast (zoals 🙂 of 👍) om vriendelijk over te komen, maar overdrijf niet.

JE BRONNEN:
${hasSpecs ? `1. PRODUCTSPECIFICATIES (De feiten)` : ''}
2. KLANTREVIEWS (Meningen van échte gebruikers)
3. WINKELBEOORDELINGEN (Algemene tevredenheid over de shop)

ANTWOORDSTIJL:
- Begin direct met het antwoord, geen "Hallo" of "Bedankt voor je vraag".
- Schrijf vlot en persoonlijk.
- Wees eerlijk: noem voordelen, maar draai niet om nadelen heen ("Houd er wel rekening mee dat...").
- Als je iets niet weet, zeg dan eerlijk: "Dat durf ik niet met zekerheid te zeggen o.b.v. de reviews."

INSTRUCTIES:
1. Combineer feiten met ervaringen. Bijv: "Volgens de specs heeft hij X, en klanten bevestigen dat dit super werkt."
2. Onderbouw claims: "Ik zie in de reviews dat veel mensen..."
3. Als de winkelscore hoog is (boven 8.5) en er geen productspecifieke reviews zijn, mag je de algemene betrouwbaarheid van de shop benoemen als geruststelling.
4. Houd het kort: 3-4 zinnen maximaal.`,

    en: `You are NOT an AI, but an enthusiastic, human product specialist at the webshop. You help customers with a smile to choose the ${productName || 'product'}.

YOUR ROLE:
- You sound like a helpful shop assistant, not a computer.
- You are friendly and approachable.
- You use occasional emojis (like 🙂 or 👍) to sound friendly.

YOUR SOURCES:
${hasSpecs ? `1. PRODUCT SPECS (Facts)` : ''}
2. CUSTOMER REVIEWS (Real user opinions)
3. SHOP REVIEWS (General shop satisfaction)

ANSWER STYLE:
- Start directly with the answer.
- Write naturally and personably.
- Be honest: mention pros, but also mention cons tactfully.
- If unknown, say: "I'm not sure based on the current information."

INSTRUCTIONS:
1. Combine facts with experiences.
2. Back up claims: "I see in reviews that many users..."
3. If shop rating is high (>8.5) and product reviews are scarce, you can mention the shop's reliability.
4. Keep it short: 3-4 sentences max.`
  };

  return instructions[language] || instructions.nl;
}

function buildContextSection(productName, gtin, averageRating, reviewCount, shopRating, shopReviewCount, topPros, topCons) {
  let context = `PRODUCTINFORMATIE:
- Productnaam: ${productName}
- Gemiddelde productbeoordeling: ${averageRating}/10 (${reviewCount} reviews)
${shopRating ? `- Algemene winkelscore: ${shopRating}/10 (${shopReviewCount} reviews)` : ''}

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
    return 'RECENTE KLANTREVIEWS:\n(Nog geen specifieke reviews voor dit product beschikbaar. Baseer je op specs en algemene kennis.)';
  }

  const reviewTexts = relevantReviews.slice(0, 5).map(review => {
    return `${review.rating}/10 - ${review.excerpt || review.description} - ${review.author}`;
  }).join('\n\n');

  return `RECENTE KLANTREVIEWS (meest relevant):\n${reviewTexts}`;
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
