const fs = require('fs');

// Public feed-to-json converter that bypasses the strict Cloudflare firewall
const CONVERTER_URL = "https://api.rss2json.com/v1/api.json?rss_url=https://www.faforever.com/feed/";

async function cacheFeed() {
  try {
    console.log("Establishing connection to secure FAF intel stream...");
    const response = await fetch(CONVERTER_URL);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    // Ensure the output directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    
    // Check if we received items from the feed pipeline
    const items = data.items || [];
    console.log(`Successfully parsed ${items.length} articles from transmission line.`);
    
    // Save the data locally as a clean JSON file inside our build folder
    fs.writeFileSync('dist/feed.json', JSON.stringify(items, null, 2));
    console.log("Intel database successfully cached locally to dist/feed.json!");

  } catch (error) {
    console.error("Cache process failed, deploying emergency fallback structure:", error);
    
    // Safety Net: Write an empty array so the frontend template doesn't crash if the source server is offline
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    fs.writeFileSync('dist/feed.json', JSON.stringify([]));
  }
}

cacheFeed();