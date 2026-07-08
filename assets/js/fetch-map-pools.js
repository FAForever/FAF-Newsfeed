#!/usr/bin/env node
/**
 * fetch-map-pools.js
 *
 * Pulls matchmaker queue + map pool data from the public FAF JSON:API
 * (api.faforever.com/data/*) and writes a flattened, front-end-friendly
 * JSON file to data/map-pools.json.
 *
 * This runs server-side (Node, inside GitHub Actions) specifically to
 * avoid the browser CORS wall that blocks calling api.faforever.com
 * directly from a static page. No OAuth token is required for these
 * GET requests - they are public JSON:API resources.
 *
 * Usage:
 *   node scripts/fetch-map-pools.js
 *   node scripts/fetch-map-pools.js --debug   (dumps one raw queue response for schema-checking)
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.faforever.com/data";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "map-pools.json");
const DEBUG = process.argv.includes("--debug");

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.api+json" },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status} ${res.statusText}) for ${url}`);
  }
  return res.json();
}

// JSON:API responses split "attributes" from relationship links and stash
// included resources in a flat top-level `included` array. This builds a
// quick id -> resource lookup so we can resolve relationships by hand
// without pulling in a full JSON:API client library.
function indexIncluded(included = []) {
  const index = {};
  for (const item of included) {
    index[`${item.type}:${item.id}`] = item;
  }
  return index;
}

function resolveRelationship(rel, includedIndex) {
  if (!rel || !rel.data) return null;
  if (Array.isArray(rel.data)) {
    return rel.data
      .map((ref) => includedIndex[`${ref.type}:${ref.id}`])
      .filter(Boolean);
  }
  return includedIndex[`${rel.data.type}:${rel.data.id}`] || null;
}

async function getQueues() {
  const json = await fetchJson(
    `${API_BASE}/matchmakerQueue?filter=enabled==true&sort=id&page[size]=100`
  );
  return json.data.map((q) => ({
    id: q.id,
    technicalName: q.attributes.technicalName,
    enabled: q.attributes.enabled,
  }));
}

async function getPoolsForQueue(queueId) {
  const url =
    `${API_BASE}/matchmakerQueueMapPool` +
    `?filter=matchmakerQueue.id=="${queueId}"` +
    `&include=mapPool,mapPool.mapPoolAssignments,mapPool.mapPoolAssignments.mapVersion,mapPool.mapPoolAssignments.mapVersion.map` +
    `&page[size]=200`;

  const json = await fetchJson(url);

  if (DEBUG) {
    console.log(`\n--- RAW RESPONSE for queue ${queueId} ---`);
    console.log(JSON.stringify(json, null, 2));
  }

  const includedIndex = indexIncluded(json.included);

  return json.data.map((bracket) => {
    // NOTE: verify these attribute names against a live --debug response.
    // They're expected to be the min/max rating bounds for this pool
    // within this queue, but casing/naming can drift between API versions.
    const attrs = bracket.attributes || {};
    const minRating = attrs.minRating ?? attrs.min_rating ?? null;
    const maxRating = attrs.maxRating ?? attrs.max_rating ?? null;

    const mapPool = resolveRelationship(bracket.relationships?.mapPool, includedIndex);
    const assignments = mapPool
      ? resolveRelationship(mapPool.relationships?.mapPoolAssignments, includedIndex) || []
      : [];

    const maps = assignments
      .map((assignment) => {
        const mapVersion = resolveRelationship(assignment.relationships?.mapVersion, includedIndex);
        const map = mapVersion
          ? resolveRelationship(mapVersion.relationships?.map, includedIndex)
          : null;
        if (!map) return null;
        return {
          id: map.id,
          name: map.attributes?.displayName || map.attributes?.folderName || "Unknown map",
          folderName: mapVersion?.attributes?.folderName || null,
          maxPlayers: mapVersion?.attributes?.maxPlayers ?? null,
        };
      })
      .filter(Boolean);

    return {
      poolId: mapPool?.id || null,
      poolName: mapPool?.attributes?.name || null,
      minRating,
      maxRating,
      maps,
    };
  });
}

async function main() {
  console.log("Fetching matchmaker queues...");
  const queues = await getQueues();
  console.log(`Found ${queues.length} enabled queue(s).`);

  const result = [];
  for (const queue of queues) {
    console.log(`Fetching map pools for queue: ${queue.technicalName} (id ${queue.id})...`);
    const pools = await getPoolsForQueue(queue.id);
    result.push({ ...queue, pools });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        queues: result,
      },
      null,
      2
    )
  );

  console.log(`\nWrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Failed to fetch map pool data:", err);
  process.exit(1);
});
