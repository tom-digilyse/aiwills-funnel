# AI Wills - onboarding tool (v1)

A small local tool to brand a new client. It scrapes the client's website for brand tokens, lets you review and correct them, then writes them to that client's GHL sub-account as custom values. The funnels read those values, so the client is branded with no code edits.

This is deliverable 8 on Trello card #40.

## What it does

1. Scrape: fetches the client site and pulls logo, colours, fonts, phone, email, website, social links and a privacy link.
2. Review: shows everything in an editable form with colour pickers and a live preview. Colours are a best guess, so this step matters.
3. Write: pushes the values to the GHL sub-account's custom values via the API.

## Requirements

- Node 18 or newer (uses the built-in fetch). No `npm install` needed.
- Your GHL Private Integration token, with custom values and contacts scope. You enter it as an environment variable, never in the code.

## Run it

Mac or Linux:

```
GHL_PIT=pit-your-token node server.js
```

Windows PowerShell:

```
$env:GHL_PIT="pit-your-token"; node server.js
```

Then open http://localhost:4321

Paste a client URL, click Scrape, check the colours and logo, enter the client's GHL location ID, and click Write values to GHL.

## Shared hosted version (recommended)

To give Tom and Chris a shared URL like `https://onboard.digilyse.co` with no terminal, host it and point a Digilyse subdomain at it. Full steps in DEPLOY.md. Set `APP_USER` and `APP_PASS` so it is login-protected, because it can write to GHL.

Note: opening `index.html` on its own does not work. The page needs the server behind it both to scrape sites and to write to GHL.

## Notes and limits

- The token is read from the environment only. It is never sent to the browser and never stored in these files. Keep it out of any commit (see .env.example).
- Colour and font detection is a heuristic read of the site's HTML and CSS, not a full browser render, so always eyeball the colours before writing. The logo is the best candidate found (og:image, a logo image, or the favicon); swap the URL if it picked the wrong one.
- It writes the browser-facing brand values. It does not touch the server-side secrets (the GHL token, the APITemplate key), which stay yours.
- The list of values written matches AiWills_custom-values-list_v1.md.

## What is tested vs what you should test

- The scraper parsing is unit-tested against a sample page.
- The GHL write path is built to the GHL custom-values API but needs your token to run for real. Test it first against the Digilyse sandbox sub-account, not a live client.

## Roadmap

- v1: run locally, both Tom and Chris can use it.
- Later: host it so it is a shared link with no local setup, and add the address scrape (currently left blank for you to fill).
