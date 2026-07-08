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

// 4. MULTI-PAGE CRAWLER FETCH ENGINE
function fetchFAFData(apiUrl, cacheKey, successCallback, errorCallback) {
  var cachedData = getCachedPosts(cacheKey);
  if (cachedData) {
     successCallback(cachedData);
     return;
  }

  var fullDataset = [];
  fetchPage(1);

  function fetchPage(pageNumber) {
    var paginatedUrl = apiUrl + "&page=" + pageNumber;

    fetch(paginatedUrl)
      .then(function(response) {
        if (!response.ok) {
          if (pageNumber === 1) throw new Error("Databank Offline");
          return [];
        }
        return response.json();
      })
      .then(function(posts) {
        if (posts.length === 0) {
          saveToCache(cacheKey, fullDataset);
          return;
        }

        fullDataset = fullDataset.concat(posts);
        successCallback(fullDataset);

        // Continue background crawling if a full page was retrieved
        if (posts.length === 100 && pageNumber < 5) {
          fetchPage(pageNumber + 1);
        } else {
          saveToCache(cacheKey, fullDataset);
        }
      })
      .catch(function(err) {
        console.error("Crawler Error on page " + pageNumber, err);
        if (pageNumber === 1 && errorCallback) errorCallback(err);
      });
  }
}

// Global baseline triggers
document.addEventListener('DOMContentLoaded', function() {
  initSectorClock();
});