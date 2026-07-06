const fs = require('fs');

// Production endpoint with embedded media payloads
const WP_API_URL = "https://www.faforever.com/wp-json/wp/v2/posts?_embed&per_page=6";

// Helper function to decode standard WordPress HTML entities safely without dependencies
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8230;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function buildSite() {
  try {
    console.log("Establishing connection to FAF WordPress API...");
    
// We pass browser headers so the FAF WordPress server doesn't block the GitHub Runner
    const response = await fetch(WP_API_URL, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const posts = await response.json();

    let cardsHtml = '';

    posts.forEach(post => {
      // 1. Production Image Extraction (Matches FAF's nested media payload structure)
      let thumbnailUrl = 'https://picsum.photos/400/220'; // Fallback
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
      
      if (featuredMedia) {
        // Use medium_large or large sizes if available to save bandwidth, fallback to source
        thumbnailUrl = featuredMedia.media_details?.sizes?.medium_large?.source_url 
                       || featuredMedia.source_url 
                       || thumbnailUrl;
      }

      // 2. Production Category & Faction Mapping
      let factionClass = 'uef'; // Default fallback
      let tagLabel = 'FAF // INTEL';
      
      const categories = post._embedded?.['wp:term']?.[0] || [];
      const catNames = categories.map(c => c.name.toLowerCase());
      const slugAndTitle = (post.slug + ' ' + post.title.rendered).toLowerCase();

      // Check categories first, then check string signatures
      if (catNames.includes('cybran') || slugAndTitle.includes('cybran')) {
        factionClass = 'cybran';
        tagLabel = 'CYBRAN // DISPATCH';
      } else if (catNames.includes('aeon') || slugAndTitle.includes('aeon')) {
        factionClass = 'aeon';
        tagLabel = 'AEON // ILLUMINATE';
      } else if (catNames.includes('seraphim') || slugAndTitle.includes('seraphim')) {
        factionClass = 'seraphim';
        tagLabel = 'SERAPHIM // XENO';
      } else if (catNames.includes('tournament') || slugAndTitle.includes('tournament')) {
        factionClass = 'aeon'; 
        tagLabel = 'FAF // TOURNAMENT';
      } else if (catNames.includes('patch') || slugAndTitle.includes('balance')) {
        factionClass = 'uef';
        tagLabel = 'UEF // BALANCE';
      }

      // 3. Title Processing & Entity Fixes
      const cleanTitle = decodeHtmlEntities(post.title.rendered);

      // 4. Clean & Trim Excerpt Text (Strips HTML tags & Gutenberg block wrappers)
      let rawExcerpt = post.excerpt?.rendered || post.content?.rendered || '';
      let cleanExcerpt = rawExcerpt
        .replace(/<[^>]*>/g, '') // Strip HTML tags completely
        .replace(/\s+/g, ' ')   // Normalize white spaces
        .trim();
      
      // Escape or truncate safely to fit your card container limitations
      if (cleanExcerpt.length > 130) {
        cleanExcerpt = cleanExcerpt.substring(0, 125) + '...';
      }
      cleanExcerpt = decodeHtmlEntities(cleanExcerpt);

      // 5. Military Tactical Date Formatting (DD.MMM.YYYY)
      const postDate = new Date(post.date);
      const day = String(postDate.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[postDate.getMonth()];
      const year = postDate.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;

      // Assemble the crisp card layout
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
        <a class="readmore" href="${post.link}" target="_blank" rel="noopener noreferrer">READ FULL REPORT</a>
      </article>\n`;
    });

    // Read the static workspace layout template
    let template = fs.readFileSync('index.html', 'utf8');

    const startMarker = '<div class="feed">';
    const endMarker = '</div>\n\n    <div class="ticker-wrap">'; 
    
    const startIndex = template.indexOf(startMarker) + startMarker.length;
    const endIndex = template.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Target injection strings missing from index.html structure.");
    }

    // Splice the generated news blocks directly into the DOM space
    const updatedHtml = template.substring(0, startIndex) + "\n" + cardsHtml + "    " + template.substring(endIndex);

    // Save to compilation distribution target folder
    if (!fs.existsSync('dist')) fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', updatedHtml);
    fs.copyFileSync('style.css', 'dist/style.css');
    
    console.log("Synchronized successfully! Production build outputted cleanly to /dist.");

  } catch (error) {
    console.error("Critical Synchronization Error:", error);
    process.exit(1);
  }
}

buildSite();