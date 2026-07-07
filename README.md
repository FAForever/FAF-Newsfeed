# FAF-Newsfeed

Upgraded version of the News Hub that doesn't rely on the website — a simple GitHub Pages site for static news, with a retro RTS/military-terminal look pulled from Forged Alliance Forever's own factions.

## Overview

The original newshub lived as a page inside the [FAForever/website](https://github.com/FAForever/website) Node/Express monolith, styled with a fairly generic column grid. This project pulls it out entirely: a standalone static site, hosted on GitHub Pages, that fetches its content straight from FAF's WordPress CMS at load time — no build step tied to the main website's deploy pipeline.

## Features

- **Live WordPress feed** — pulls published posts directly from the WordPress REST API (`/wp-json/wp/v2/posts`), filtered to the Newshub category and respecting FAF's custom sort/exclusion rules.
- **Featured lead story** — the top-sorted post renders full-width with a larger excerpt and its own image panel, so the most important news item is always the most visible.
- **Faction-coded briefings** — each card is tagged and color-coded by faction (UEF blue, Cybran red, Aeon gold, Seraphim teal) based on its title/slug, echoing the in-game HUD rather than a flat single-color theme.
- **Terminal HUD styling** — scanline overlay, static radar matrix, HUD corner brackets, sector clock, and a scrolling tournament ticker.
- **On-Screen Performance Freeze Engine** — Features a lightweight window scroll listener that dynamically injects a `.freeze-frame` utility onto elements moving out of view. This completely stops off-screen CSS transitions and animations, lowering rendering strain on the client.
- **No backend required** — everything runs client-side; the page is just static HTML/CSS/JS served from Pages.

## Tech stack

- Plain HTML, CSS, and vanilla JS (no build tooling, no framework)
- WordPress REST API as the content source
- GitHub Pages for hosting
- **JBang & JavaFX WebView** for localized client environment simulation

## How it works

1. On page load, `fetchFafNewsFeed()` requests the latest posts from the WordPress API, filtered to the Newshub category.
2. Posts are sorted by FAF's custom `newshub_sortIndex` field and filtered against a secondary exclusion category.
3. Each post's title/slug is pattern-matched against faction keywords to pick a color and tag.
4. The top post in the sorted list renders through the **featured** template (full-width, larger excerpt, image panel); the rest render through the standard card template.
5. WordPress HTML content is stripped down to plain text for the excerpt to avoid fighting the block editor's inline styles.
6. As the player scrolls, any animated elements exiting the viewport are assigned `.freeze-frame` to preserve UI rendering threads.

## File structure

```
├── index.html            # Page markup + fetch/render logic
├── style.css             # All styling — terminal theme, performance overrides
├── WebViewTestHarness.java # JBang testing tool matching the FAF client engine
└── README.md
```

## Local development & FAF Client Testing

Since this page renders directly inside the desktop FAF Client's internal `WebView`, testing purely in a modern browser like Chrome or Edge won't accurately reflect its actual appearance or performance.

A standalone testing tool (`WebViewTestHarness.java`) is included to let you simulate the real client's rendering pipeline instantly, with zero gradle configuration.

### 1. Install JBang (Windows Setup)
Open your PowerShell terminal and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iex "& { $(iwr -useb [https://ps.jbang.dev](https://ps.jbang.dev)) } app setup"
```
*Restart your terminal or VS Code window after installation for the PATH configurations to take effect.*

### 2. Run the Test Harness
Because Windows network configurations often block local loops (http://127.0.0.1), the test harness is explicitly wired to load index.html straight from your hard drive via secure file pointers.

To spin up the simulated client window, execute:

```
jbang WebViewTestHarness.java
```

On first boot, JBang automatically fetches an isolated Java 17 environment and the Windows-specific JavaFX libraries.

⚠️ PATH IMPORTANT NOTE: Because the test harness runs over local `file://` structures, all resource links inside your HTML (images, styles) must remain relative (e.g., `href="style.css"`). Using absolute roots like `href="/style.css"` will break file resolution.

## Deployment
This is designed to be served as-is via GitHub Pages:
1. Push to the repo's default branch (or a gh-pages branch, depending on your Pages settings).
2. Enable GitHub Pages in the repo settings, pointing at the branch/folder containing index.html.
3. No build step is required — the site fetches content live from WordPress on each page load.
