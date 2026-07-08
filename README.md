# FAF-Newsfeed

A retro RTS terminal dashboard for Forged Alliance Forever news and tournament schedules. Built to run purely client-side inside the FAF desktop client.

## Features

- **Live News Feed**: Pulls posts directly from the FAF WordPress API on load.
- **Faction Themes**: Color-codes cards dynamically (UEF Blue, Cybran Red, Aeon Gold, Seraphim Teal).
- **Tournament Calendar**: Timeline layout to track upcoming community events.
- **Performance Optimized**: Pauses off-screen animations while scrolling to lower CPU usage.

## Setup & Testing

Test locally using the included JBang script to match the desktop client's rendering engine.

1. Install JBang (PowerShell):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   iex "& { $(iwr -useb [https://ps.jbang.dev](https://ps.jbang.dev)) } app setup"
   ```

2. Run the test window:
3. ```bash
jbang WebViewTestHarness.java
```

*Note: Use relative asset paths (e.g., assets/css/core.css) so the local file loader resolves correctly.*

## Deployment
Deploy directly to GitHub Pages by pushing to the main branch. No build steps or server configurations required.
