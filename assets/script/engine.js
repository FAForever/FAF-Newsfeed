// ===== FAF TERMINAL ENGINE // assets/js/engine.js =====

// 1. SECTOR DUAL-CLOCK ENGINE
function initSectorClock() {
  function updateClock(){
    var el = document.getElementById('clock');
    if(!el) return;
    const now = new Date();
    const utcTime = now.toUTCString().split(' ')[4];
    const localHours = String(now.getHours()).padStart(2, '0');
    const localMinutes = String(now.getMinutes()).padStart(2, '0');
    const localSeconds = String(now.getSeconds()).padStart(2, '0');
    el.innerHTML = 'SECTOR TIME — ' + utcTime + ' UTC &nbsp;//&nbsp; LOCAL — ' + localHours + ':' + localMinutes + ':' + localSeconds;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// 2. UTILITY FUNCTIONS
function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatTacticalDate(dateString) {
  var postDate = new Date(dateString);
  var day = String(postDate.getDate()).padStart(2, '0');
  var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return day + ' ' + months[postDate.getMonth()] + ' ' + postDate.getFullYear();
}

function getFactionData(titleString, slugString) {
  var matchTarget = (titleString + ' ' + (slugString || '')).toLowerCase();
  if (matchTarget.indexOf('cybran') !== -1) { 
    return { class: 'cybran', color: 'var(--cybran)', label: 'CYBRAN // INTEL' };
  } else if (matchTarget.indexOf('aeon') !== -1 || matchTarget.indexOf('tournament') !== -1) { 
    return { class: 'aeon', color: 'var(--aeon)', label: 'AEON // PROTOCOL' };
  } else if (matchTarget.indexOf('seraphim') !== -1) { 
    return { class: 'seraphim', color: 'var(--seraphim)', label: 'SERAPHIM // SIGNAL' };
  }
  return { class: 'uef', color: 'var(--uef)', label: 'FAF // NEWS' };
}

// 3. UPGRADED UNIQUE SEGMENTATION SESSION CACHE ENGINE
var CACHE_TIME_KEY_PREFIX = "faf_news_cache_time_";
var CACHE_TTL = 1000 * 60 * 5; // 5 minute lifespan

function getCachedPosts(customKey) {
  try {
    var cached = sessionStorage.getItem(customKey);
    var stamp = sessionStorage.getItem(CACHE_TIME_KEY_PREFIX + customKey);
    if (cached && stamp && (Date.now() - parseInt(stamp)) < CACHE_TTL) {
      console.log("CACHE HIT [" + customKey + "]: Loading from Quantum Storage.");
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("CACHE BLOCKED: JavaFX security sandbox active.");
  }
  return null;
}

function saveToCache(customKey, postsArray) {
  try {
    sessionStorage.setItem(customKey, JSON.stringify(postsArray));
    sessionStorage.setItem(CACHE_TIME_KEY_PREFIX + customKey, Date.now().toString());
  } catch (e) {
    // Silently handle sandbox restrictions
  }
}

// 4. STATIC JSON FETCH ENGINE
function fetchFAFData(apiUrl, cacheKey, successCallback, errorCallback) {
  var cachedData = getCachedPosts(cacheKey);
  if (cachedData) {
     successCallback(cachedData);
     return;
  }

  // Fetch the static JSON file directly without pagination loops
  fetch(apiUrl)
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Databank Offline");
      }
      return response.json();
    })
    .then(function(posts) {
      // Save to session cache and pass data to the renderer
      saveToCache(cacheKey, posts);
      successCallback(posts);
    })
    .catch(function(err) {
      console.error("Comms Error: Failed to load static databank.", err);
      if (errorCallback) errorCallback(err);
    });
}

// Global baseline triggers
document.addEventListener('DOMContentLoaded', function() {
  initSectorClock();
});

// ===== HUD TACTICAL RESOLUTION ZOOM CONTROLLER =====
let currentHudScale = parseInt(localStorage.getItem('faf_hud_scale')) || 100;

function applyHudScale() {
  // Bound limits securely between 80% and 150% to safeguard grid parsing parameters
  if (currentHudScale < 80) currentHudScale = 80;
  if (currentHudScale > 150) currentHudScale = 150;

  document.documentElement.style.setProperty('--font-scale', currentHudScale + '%');
  
  const indicator = document.getElementById('scale-indicator');
  if (indicator) {
    indicator.innerText = `SCALE: ${currentHudScale}%`;
  }
  localStorage.setItem('faf_hud_scale', currentHudScale);
}

function adjustHudScale(amount) {
  currentHudScale += amount;
  applyHudScale();
}

function resetHudScale() {
  currentHudScale = 100;
  applyHudScale();
}

// Intercept loading chains to apply user settings immediately 
window.addEventListener('DOMContentLoaded', applyHudScale);


// Check if FAFLive is live on Twitch
function checkTwitchStatus() {
  fetch('https://decapi.me/twitch/uptime/faflive')
    .then(response => response.text())
    .then(data => {
      // If the response doesn't contain "offline" or an error, they are live!
      if (!data.includes('offline') && !data.includes('not found')) {
        const liveBtn = document.getElementById('faflive-btn');
        if (liveBtn) {
          liveBtn.style.display = 'inline-block';
          // Optional: Add a CSS pulse animation to the red dot if you want to get fancy
        }
      }
    })
    .catch(err => console.log("Comms interference checking Twitch status.", err));
}

// Fire the check when the page loads
window.addEventListener('load', checkTwitchStatus);