# Deploying the onboarding tool to aiwills.digilyse.co (Namecheap cPanel)

Goal: a shared URL `https://aiwills.digilyse.co` that you and Chris log into, no terminal. Namecheap cPanel runs Node apps through its built-in "Setup Node.js App" tool (Phusion Passenger), so no separate server is needed.

## The three secrets (you set these in cPanel, never in the code)

- `GHL_PIT` - your GHL Private Integration token (custom values + contacts scope).
- `APP_USER` - the shared login username for the tool.
- `APP_PASS` - the shared login password for the tool.

With `APP_USER` and `APP_PASS` set, the tool shows a browser login prompt and blocks everyone else. The app already reads `process.env.PORT`, which Passenger sets automatically, so no port config is needed.

## Step 1 - create the subdomain

In cPanel, Domains (or Subdomains), create `aiwills` on `digilyse.co` so the subdomain is `aiwills.digilyse.co`.

- If digilyse.co is hosted on this cPanel, that is all that is needed.
- If digilyse.co's DNS is managed elsewhere, also add a DNS record for `aiwills` pointing at this server (cPanel shows the server IP; add an A record, or a CNAME to the server hostname).

## Step 2 - upload the app

1. Zip this `AiWills_onboarding-tool_v1` folder (it has no node_modules, so nothing to exclude).
2. cPanel, File Manager. Create a folder in your home directory, not inside public_html, for example `aiwills-onboard`.
3. Upload the zip into that folder and Extract it. You should see `server.js`, `package.json` and the `public` folder inside `aiwills-onboard`.

## Step 3 - create the Node.js app

In cPanel, Setup Node.js App, Create Application:

- Node.js version: 18 or newer.
- Application mode: Production.
- Application root: `aiwills-onboard` (the folder from step 2).
- Application URL: `aiwills.digilyse.co`.
- Application startup file: `server.js`.

Create it.

## Step 4 - add the secrets

In the same app screen, under Environment variables, Add Variable for each:

- `GHL_PIT` = your token
- `APP_USER` = a username you choose
- `APP_PASS` = a password you choose

Save.

## Step 5 - install and start

1. Under Detected configuration files, click Run NPM Install (quick, there are no dependencies, it just registers package.json).
2. Click Start App (or Restart if it is already running).

## Step 6 - use it

Open `https://aiwills.digilyse.co`. Enter the username and password you set. Paste a client URL, Scrape, review the brand, enter the client's GHL location ID, and Write values to GHL.

Test it on the Digilyse sandbox sub-account first, before any live client.

## If something is off

- Blank page or 502: check Start App ran without error, and that the startup file is `server.js` and the app root points at the folder containing it.
- Login prompt loops: re-check `APP_USER` and `APP_PASS`, then Restart the app so new variables load.
- Scrape works but Write fails with 401: the `GHL_PIT` is wrong, expired, or lacks custom-values scope.
- Change any secret, then Restart the app for it to take effect.

## Other hosts (only if you move off cPanel later)

Any Node host works the same way: `npm start` runs the app, set the three environment variables as secrets, point the subdomain at it over HTTPS.
