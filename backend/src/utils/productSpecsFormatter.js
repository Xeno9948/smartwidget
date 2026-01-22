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
        sections.push(`${descTitle}: ${description}`);
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

module.exports = { buildQAPrompt, buildProductSpecsSection };
