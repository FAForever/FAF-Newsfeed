# FAF-Newsfeed

Upgraded version of the News Hub that doesn't rely on the website — a simple GitHub Pages site for static news, with a retro RTS/military-terminal look pulled from Forged Alliance Forever's own factions.

## Overview

The original newshub lived as a page inside the [FAForever/website](https://github.com/FAForever/website) Node/Express monolith, styled with a fairly generic column grid. This project pulls it out entirely: a standalone static site, hosted on GitHub Pages, that fetches its content straight from FAF's WordPress CMS at load time — no build step tied to the main website's deploy pipeline.

## Features

- **Live WordPress feed** — pulls published posts directly from the WordPress REST API (`/wp-json/wp/v2/posts`), filtered to the Newshub category and respecting FAF's custom sort/exclusion rules.
- **Featured lead story** — the top-sorted post renders full-width with a larger excerpt and its own image panel, so the most important news item is always the most visible.
- **Faction-coded briefings** — each card is tagged and color-coded by faction (UEF blue, Cybran red, Aeon gold, Seraphim teal) based on its title/slug, echoing the in-game HUD rather than a flat single-color theme.
- **Terminal HUD styling** — scanline overlay, radar sweep, HUD corner brackets, sector clock, and a scrolling tournament ticker.
- **No backend required** — everything runs client-side; the page is just static HTML/CSS/JS served from Pages.

## Tech stack

- Plain HTML, CSS, and vanilla JS (no build tooling, no framework)
- WordPress REST API as the content source
- GitHub Pages for hosting

## How it works

1. On page load, `fetchFafNewsFeed()` requests the latest posts from the WordPress API, filtered to the Newshub category.
2. Posts are sorted by FAF's custom `newshub_sortIndex` field and filtered against a secondary exclusion category.
3. Each post's title/slug is pattern-matched against faction keywords to pick a color and tag.
4. The top post in the sorted list renders through the **featured** template (full-width, larger excerpt, image panel); the rest render through the standard card template.
5. WordPress HTML content is stripped down to plain text for the excerpt to avoid fighting the block editor's inline styles.

## File structure

```
├── index.html      # Page markup + fetch/render logic
├── style.css        # All styling — terminal theme, faction colors, grid layout
└── README.md
```

## Local development

Since this is a static site with no build step, just serve the folder locally, e.g.:

```bash
npx serve .
```

or open `index.html` directly in a browser (note: some browsers restrict `fetch` on `file://` URLs, so a local server is safer for testing the live feed).

## Deployment

This is designed to be served as-is via GitHub Pages:

1. Push to the repo's default branch (or a `gh-pages` branch, depending on your Pages settings).
2. Enable GitHub Pages in the repo settings, pointing at the branch/folder containing `index.html`.
3. No build step is required — the site fetches content live from WordPress on each page load.

## Roadmap

- [ ] Editorial override for "featured" post (independent of sort index, for breaking news)
- [ ] Pagination / "load more" for older briefings
- [ ] Category-driven faction tagging instead of keyword matching, once a WordPress taxonomy is in place
