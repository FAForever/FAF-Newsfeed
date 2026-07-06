const fs = require('fs');

// We use the RSS Feed which firewalls typically leave open to public aggregators
const RSS_FEED_URL = "https://www.faforever.com/feed/";

// Helper to escape or decode standard HTML entities safely
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Strip CDATA tags used in XML
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8230;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Regex helper to extract content between custom XML tags safely
function extractTagContent(itemString, tagName) {
  const match = itemString.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`));
  return match ? match[1].trim() : '';
}

async function buildSite() {
  try {
    console.log("Establishing connection to public FAF RSS stream...");
    
    const response = await fetch(RSS_FEED_URL, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/xml, application/rss+xml'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const xmlText = await response.text();

    // Split XML payload into standalone item array blocks (Limit to latest 6 items)
    const items = xmlText.split('<item>').slice(1, 7);
    let cardsHtml = '';

    if (items.length === 0) {
      throw new Error("No data chunks found in the feed payload.");
    }

    items.forEach(item => {
      const rawTitle = extractTagContent(item, 'title');
      const cleanTitle = decodeHtmlEntities(rawTitle);
      const postLink = extractTagContent(item, 'link');
      
      // Parse dates out from RSS standardized RFC822 format (e.g. "Tue, 30 Jun 2026 12:00:00 +0000")
      const pubDateText = extractTagContent(item, 'pubDate');
      const postDate = pubDateText ? new Date(pubDateText) : new Date();
      const day = String(postDate.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[postDate.getMonth()];
      const year = postDate.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;

      // Extract content or descriptions to scan for fallback thumbnail configurations
      const description = extractTagContent(item, 'description');
      const contentEncoded = extractTagContent(item, 'content:encoded');
      const searchBody = (description + ' ' + contentEncoded).toLowerCase();

      // 1. Precise Image fallback parsing from RSS text chunks
      let thumbnailUrl = 'https://picsum.photos/400/220'; // Base asset template
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
      const imageMatch = (contentEncoded || description).match(imgRegex);
      if (imageMatch && imageMatch[1]) {
        thumbnailUrl = imageMatch[1];
      }

      // 2. Tactical Faction Mappings
      let factionClass = 'uef';
      let tagLabel = 'FAF // INTEL';
      const signatureText = (cleanTitle + ' ' + searchBody).toLowerCase();

      if (signatureText.includes('cybran')) {
        factionClass = 'cybran';
        tagLabel = 'CYBRAN // DISPATCH';
      } else if (signatureText.includes('aeon') || signatureText.includes('tournament')) {
        factionClass = 'aeon';
        tagLabel = 'AEON // TRANSMISSION';
      } else if (signatureText.includes('seraphim')) {
        factionClass = 'seraphim';
        tagLabel = 'SERAPHIM // ANOMALY';
      } else if (signatureText.includes('patch') || signatureText.includes('balance')) {
        factionClass = 'uef';
        tagLabel = 'UEF // BALANCE';
      }

      // 3. Text sanitization
      let cleanExcerpt = description
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]*>/g, '') // strip HTML strings
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanExcerpt.length > 130) {
        cleanExcerpt = cleanExcerpt.substring(0, 125) + '...';
      }
      cleanExcerpt = decodeHtmlEntities(cleanExcerpt);

      // Assemble card elements cleanly
      cardsHtml += `
      <article class="card ${factionClass}">
        <div class="corner tl"></div><div class="corner br"></div>
        <div class="card-thumb">
          <img src="${thumbnailUrl}" alt="${cleanTitle}" loading="lazy">
        </div>
        <span class="tag">${tagLabel}</span>
        <div class="meta">${formattedDate} — LIVE UPDATES</div>
        <h3>${cleanTitle}</h3>
        <p>${cleanExcerpt}</p>
        <a class="readmore" href="${postLink}" target="_blank" rel="noopener noreferrer">READ FULL REPORT</a>
      </article>\n`;
    });

    // Splice records back into base index tracking arrays
    let template = fs.readFileSync('index.html', 'utf8');
    const startMarker = '<div class="feed">';
    const endMarker = '</div>\n\n    <div class="ticker-wrap">'; 
    
    const startIndex = template.indexOf(startMarker) + startMarker.length;
    const endIndex = template.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Target injection strings missing from index.html structure.");
    }

    const updatedHtml = template.substring(0, startIndex) + "\n" + cardsHtml + "    " + template.substring(endIndex);

    if (!fs.existsSync('dist')) fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', updatedHtml);
    fs.copyFileSync('style.css', 'dist/style.css');
    
    console.log("Synchronized successfully via RSS Stream! Production build ready in /dist.");

  } catch (error) {
    console.error("Critical Synchronization Error:", error);
    process.exit(1);
  }
}

buildSite();