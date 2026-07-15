// Loads calendar event data from events.json and exposes it as `fafEventsData`,
// so the Issue-Form -> Action -> PR pipeline only ever has to touch a plain
// JSON file instead of hand-edited JS.
//
// Fetching is async, so calendar.html must not build the calendar on
// DOMContentLoaded alone anymore — it needs to wait for the `fafEventsReady`
// event dispatched below (see the accompanying calendar.html patch).

let fafEventsData = [];

fetch('assets/data/events.json')
  .then(function (response) {
    if (!response.ok) {
      throw new Error('Failed to load events.json: HTTP ' + response.status);
    }
    return response.json();
  })
  .then(function (data) {
    fafEventsData = data;
  })
  .catch(function (err) {
    console.error('[events.js] Could not load events.json:', err);
    fafEventsData = [];
  })
  .finally(function () {
    window.dispatchEvent(new Event('fafEventsReady'));
  });