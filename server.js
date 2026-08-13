/* AI Wills - onboarding tool
   Scrape a client website for brand tokens, review them in the UI, then write
   them to a GHL sub-account's custom values.
   Node 18+ (uses built-in fetch). No npm install needed.

   Local:   GHL_PIT=pit-xxxx node server.js   then open http://localhost:4321
   Hosted:  set GHL_PIT, APP_USER and APP_PASS as the host's secrets (see DEPLOY.md).
   The token and login are read from the environment, never hard-coded. */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Safety net: never let a stray error crash the process (which makes the host return 503).
process.on('uncaughtException', function(e){ try { console.error('uncaughtException:', e && e.stack || e); } catch(_){} });
process.on('unhandledRejection', function(e){ try { console.error('unhandledRejection:', e && e.stack || e); } catch(_){} });

const PORT = process.env.PORT || 4321;
const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = process.env.GHL_API_VERSION || '2021-07-28';

/* ---------- agency OAuth ----------
   One Marketplace app installed on the agency. Its agency token mints a
   short-lived per-sub-account (location) token on demand, so the tool can
   write to ANY client sub-account with no per-client token. See
   AiWills_ghl-agency-oauth-spec_v1.md. */
const REDIRECT_URI = process.env.GHL_REDIRECT_URI || 'https://aiwills.digilyse.co/oauth/callback';
/* Two scope sets on purpose, learned the hard way on 11 Aug.
   Opportunities are Sub-Account scopes. Put them on the AGENCY consent and the company token can no
   longer do the /oauth/locationToken exchange at all - every account stops minting, which is far
   worse than not having pipelines. So the agency install keeps the six that mint reliably, and a
   per-location install carries the wider set. getStoredLocationToken already prefers a stored
   per-location token over minting, so installing a location directly simply upgrades that account. */
const GHL_SCOPES_CORE = 'locations/customValues.readonly locations/customValues.write locations/customFields.readonly locations/customFields.write contacts.readonly contacts.write';
const GHL_SCOPES = GHL_SCOPES_CORE;                                              // agency install: mint-safe
const GHL_SCOPES_LOCATION = GHL_SCOPES_CORE + ' opportunities.readonly opportunities.write';   // per-location install: adds pipelines
const TOKENS_FILE = path.join(__dirname, 'ghl_tokens.json');
/* Sub-Account app model: each sub-account authorises the app once and we store ITS
   own Location token, keyed by locationId. Custom values are sub-account data, so a
   sub-account-scoped token is required per location (GHL has no agency token for this). */
function loadStore(){ try { const s = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')); if (!s.locations) s.locations = {}; return s; } catch(e){ return { locations: {} }; } }
function saveStore(s){ try { fs.writeFileSync(TOKENS_FILE, JSON.stringify(s)); } catch(e){ console.error('saveStore:', e.message); } }
async function oauthToken(params){
  const r = await fetch(GHL_BASE + '/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams(params).toString() });
  const text = await r.text(); let j; try { j = JSON.parse(text); } catch(e){ j = { raw: text }; }
  if (!r.ok) throw new Error('OAuth token -> ' + r.status + ' ' + text.slice(0,300));
  return j;
}
async function exchangeCode(code){
  const j = await oauthToken({ client_id: process.env.GHL_CLIENT_ID, client_secret: process.env.GHL_CLIENT_SECRET, grant_type: 'authorization_code', code: code, user_type: 'Location', redirect_uri: REDIRECT_URI });
  const locId = j.locationId || '';
  const rec = { access_token: j.access_token, refresh_token: j.refresh_token, locationId: locId, companyId: j.companyId || '', expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
  const s = loadStore(); if (locId) s.locations[locId] = rec; saveStore(s);
  return rec;
}
/* ---------- Agency-level model ----------
   Install the app ONCE at the agency (/oauth/start-agency). We store a Company
   (agency) token, then mint a per-location token on demand via GHL's
   /oauth/locationToken. New sub-accounts need zero per-account authorising. */
async function exchangeCodeAgency(code){
  const j = await oauthToken({ client_id: process.env.GHL_CLIENT_ID, client_secret: process.env.GHL_CLIENT_SECRET, grant_type: 'authorization_code', code: code, user_type: 'Company', redirect_uri: REDIRECT_URI });
  const rec = { access_token: j.access_token, refresh_token: j.refresh_token, companyId: j.companyId || '', expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
  const s = loadStore(); s.company = rec; saveStore(s);
  return rec;
}
async function getCompanyToken(){
  const s = loadStore(); let rec = s.company;
  if (!rec || !rec.refresh_token) throw new Error('Agency app not installed. Open /oauth/start-agency and approve at the agency level.');
  if (rec.expires_at && rec.expires_at > Date.now() + 60000) return rec;
  const j = await oauthToken({ client_id: process.env.GHL_CLIENT_ID, client_secret: process.env.GHL_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: rec.refresh_token, user_type: 'Company' });
  rec = { access_token: j.access_token, refresh_token: j.refresh_token || rec.refresh_token, companyId: j.companyId || rec.companyId || '', expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
  const s2 = loadStore(); s2.company = rec; saveStore(s2);
  return rec;
}
async function mintLocationToken(locationId){
  const comp = await getCompanyToken();
  const companyId = comp.companyId;
  if (!companyId) throw new Error('No companyId on stored agency token; re-run /oauth/start-agency.');
  const r = await fetch(GHL_BASE + '/oauth/locationToken', { method: 'POST', headers: { Authorization: 'Bearer ' + comp.access_token, Version: GHL_VERSION, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ companyId: companyId, locationId: locationId }).toString() });
  const text = await r.text(); let j; try { j = JSON.parse(text); } catch(e){ j = {}; }
  if (!r.ok || !j.access_token) throw new Error('locationToken -> ' + r.status + ' ' + text.slice(0,300));
  const rec = { access_token: j.access_token, locationId: locationId, companyId: companyId, viaAgency: true, expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
  const s = loadStore(); s.locations[locationId] = rec; saveStore(s);
  return rec.access_token;
}
async function getStoredLocationToken(locationId){
  const s = loadStore(); let rec = s.locations[locationId];
  if (rec && rec.access_token && rec.expires_at && rec.expires_at > Date.now() + 60000) return rec.access_token;
  if (rec && rec.refresh_token){
    const j = await oauthToken({ client_id: process.env.GHL_CLIENT_ID, client_secret: process.env.GHL_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: rec.refresh_token, user_type: 'Location' });
    rec = { access_token: j.access_token, refresh_token: j.refresh_token || rec.refresh_token, locationId: locationId, companyId: j.companyId || rec.companyId, expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
    s.locations[locationId] = rec; saveStore(s);
    return rec.access_token;
  }
  if (s.company && s.company.refresh_token) return await mintLocationToken(locationId);
  throw new Error('Sub-account ' + locationId + ' not authorised. Install the app at agency level (/oauth/start-agency) so location tokens mint automatically, or authorise this sub-account via /oauth/start.');
}
async function getWriteToken(locationId){
  if (process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET) return await getStoredLocationToken(locationId);
  if (process.env.GHL_PIT) return process.env.GHL_PIT;
  throw new Error('No GHL credentials. Set GHL_CLIENT_ID and GHL_CLIENT_SECRET and authorise each sub-account via /oauth/start, or set GHL_PIT.');
}

/* ---------- access control ----------
   If APP_USER and APP_PASS are set, every request needs that login (browser
   prompt). If they are not set (local use), the tool is open. Always set them
   when hosted, because this tool can write to GHL. */
function authed(req){
  if (!process.env.APP_USER || !process.env.APP_PASS) return true;
  const h = req.headers['authorization'] || '';
  const m = /^Basic (.+)$/.exec(h);
  if (!m) return false;
  const decoded = Buffer.from(m[1], 'base64').toString();
  const i = decoded.indexOf(':');
  const u = decoded.slice(0, i), p = decoded.slice(i + 1);
  return u === process.env.APP_USER && p === process.env.APP_PASS;
}

/* ---------- scraper ---------- */
function abs(href, base){ try { return new URL(href, base).href; } catch(e){ return href || ''; } }
function firstMatch(re, s){ const m = re.exec(s); return m ? m[1].trim() : ''; }

function pickColors(html, css){
  const blob = html + '\n' + css;
  const hexes = blob.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const counts = {};
  hexes.forEach(h => { h = h.toLowerCase(); counts[h] = (counts[h] || 0) + 1; });
  function rgb(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
  function sat(h){ const c = rgb(h); const mx = Math.max.apply(null,c), mn = Math.min.apply(null,c); return mx === 0 ? 0 : (mx-mn)/mx; }
  function lum(h){ const c = rgb(h); return (0.299*c[0] + 0.587*c[1] + 0.114*c[2]) / 255; }
  const brand = Object.keys(counts)
    .filter(h => sat(h) > 0.35 && lum(h) > 0.12 && lum(h) < 0.85)
    .sort((a,b) => counts[b] - counts[a]);
  const theme = firstMatch(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i, html);
  const primary = (theme && /^#[0-9a-fA-F]{6}$/.test(theme)) ? theme.toLowerCase() : (brand[0] || '');
  const darks = Object.keys(counts).filter(h => lum(h) < 0.25).sort((a,b) => counts[b] - counts[a]);
  return { primary: primary, headingColor: darks[0] || '', bodyColor: darks[1] || darks[0] || '' };
}

function pickFonts(html, css){
  const blob = html + '\n' + css;
  function clean(s){ return (s || '').replace(/!important/ig,'').split(',')[0].replace(/["']/g,'').trim(); }
  // Body font: the main Google Font the site loads.
  const loaded = []; let m;
  const linkRe = /fonts\.googleapis\.com\/css2?\?([^"']+)/gi;
  while ((m = linkRe.exec(blob))){ const fr = /family=([^&:]+)/g; let f; while ((f = fr.exec(m[1]))) loaded.push(decodeURIComponent(f[1].replace(/\+/g,' ')).split(':')[0]); }
  let body = loaded[0] || '';
  if (!body){ const ff = (css.match(/font-family\s*:\s*([^;}{]+)/i) || [])[1]; if (ff){ const n = clean(ff); if (typeof realFont === 'function' ? realFont(n) : (n && !/inherit|sans-serif|serif|monospace/i.test(n))) body = n; } }
  // Heading font: prefer a font-family set on heading-style selectors, else a known serif/display font.
  function realFont(n){ return n && n.indexOf('var(') !== 0 && !/^(-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica( neue)?|arial|tahoma|verdana|system-ui|ui-sans-serif|sans-serif|serif|monospace|inherit|initial|unset)$/i.test(n); }
  let heading = '';
  const blocks = css.split('}');
  for (let i = 0; i < blocks.length; i++){
    const b = blocks[i];
    if (/(^|[\s,>])h[1-6]\b|heading|headline|title|\.has-[a-z-]*-font-family/i.test(b)){
      const fm = b.match(/font-family\s*:\s*([^;{]+)/i);
      if (fm){ const n = clean(fm[1]); if (realFont(n)){ heading = n; break; } }
    }
  }
  if (!heading){
    const serif = (blob.match(/['"]?(Playfair Display|Merriweather|Lora|Cormorant[^'",;:}]*|Libre Baskerville|EB Garamond|Crimson[^'",;:}]*|DM Serif[^'",;:}]*|Source Serif[^'",;:}]*)['"]?/i) || [])[1];
    if (serif) heading = serif.trim();
  }
  if (!heading) heading = body;
  if (!body) body = heading;
  return { heading: heading, body: body };
}

// Capture the client's primary navigation links (label + url) so the engine can
// rebuild a clean, branded header. We do NOT import their markup, only the items.
function scrapeNav(html, origin){
  function items(scope){
    const out = []; const re = /<a\b[^>]*href=["']([^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
    while ((m = re.exec(scope)) && out.length < 14){
      const href = m[1].trim();
      if (/^(tel:|mailto:|javascript:|#)/i.test(href)) continue;
      let label = m[2].replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim();
      if (!label || label.length > 28) continue;
      out.push({ label: label, url: abs(href, origin) });
    }
    return out;
  }
  let scope = (/<nav[\s\S]*?<\/nav>/i.exec(html) || [])[0] || '';
  if (!scope) scope = (/<header[\s\S]*?<\/header>/i.exec(html) || [])[0] || '';
  let list = items(scope);
  const seen = {}; list = list.filter(it => { const k = it.label.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
  return list.slice(0, 7);
}

function scrapeBrand(html, css, baseUrl){
  let origin = baseUrl; try { origin = new URL(baseUrl).origin; } catch(e){}
  const colors = pickColors(html, css);
  const fonts = pickFonts(html, css);
  const nav = scrapeNav(html, origin);

  const ogImage = firstMatch(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);
  const apple = firstMatch(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i, html);
  const icon = firstMatch(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i, html);
  let logo = '';
  const logoImg = /<img[^>]+(?:src|class|alt)=["'][^"']*logo[^"']*["'][^>]*>/i.exec(html);
  if (logoImg){ logo = firstMatch(/src=["']([^"']+)["']/i, logoImg[0]); }
  logo = abs(logo || ogImage || apple || icon, origin);
  // Best-effort logo height from the logo <img> (height attr or inline style), clamped to a header-sane range.
  // Prevents the "way too big" logo and gives the tool a value to write instead of leaving a stale one in GHL.
  let logoHeight = '';
  if (logoImg){
    const hStyle = firstMatch(/height\s*:\s*(\d{2,3})px/i, logoImg[0]);
    const hAttr = firstMatch(/\bheight=["']?(\d{2,3})/i, logoImg[0]);
    const raw = parseInt(hStyle || hAttr || '', 10);
    if (raw){ logoHeight = Math.max(28, Math.min(60, raw)) + 'px'; }
  }
  if (!logoHeight) logoHeight = '44px';

  const title = firstMatch(/<title[^>]*>([^<]+)<\/title>/i, html);
  const ogSite = firstMatch(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i, html);
  const company = (ogSite || title).split(/[|:]/)[0].split(' - ')[0].trim();

  const tel = firstMatch(/href=["']tel:([^"']+)["']/i, html);
  let phone = (tel || '').trim();
  if (!phone){
    const cand = (html.replace(/<[^>]+>/g,' ').match(/(\+44\s?\d[\d\s()-]{7,}\d|0\d[\d\s()-]{7,}\d)/) || [])[1];
    if (cand){ const digits = cand.replace(/\D/g,''); if (digits.length >= 10 && digits.length <= 13) phone = cand.trim(); }
  }
  const email = firstMatch(/href=["']mailto:([^"'?]+)["']/i, html);

  const facebook = abs(firstMatch(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/i, html), origin);
  const instagram = abs(firstMatch(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i, html), origin);
  let privacyHref = '';
  const pr = /href=["']([^"']*privacy[^"']*)["']/gi; let pm;
  while ((pm = pr.exec(html))){ if (!/\.(css|js|png|jpe?g|svg|gif|woff2?|ico)(\?|#|$)/i.test(pm[1])){ privacyHref = pm[1]; break; } }
  const privacy = abs(privacyHref, origin);

  return {
    company_name: company,
    client_logo_url: logo,
    logo_height: logoHeight,
    client_primary_color: colors.primary,
    client_heading_color: colors.headingColor,
    client_body_color: colors.bodyColor,
    client_heading_font: fonts.heading,
    client_body_font: fonts.body,
    footer_phone: phone,
    company_email: email,
    company_website: origin,
    facebook_link: facebook,
    instagram_link: instagram,
    privacy_url: privacy,
    nav_menu_json: JSON.stringify(nav),
    company_address: '',
    will_price: '',
    legal_footer: ''
  };
}

async function fetchText(url, ms){
  // Abort slow/blocking sites so the scrape can't hang the tool on "Scraping..." forever.
  const ctrl = new AbortController();
  const t = setTimeout(function(){ ctrl.abort(); }, ms || 10000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 AiWillsOnboarding' }, redirect: 'follow', signal: ctrl.signal });
    if (!r.ok) throw new Error('Fetch ' + url + ' returned ' + r.status);
    return await r.text();
  } catch(e){
    var ab = e && (e.name === 'AbortError' || (e.cause && (e.cause.name === 'AbortError' || /abort/i.test(e.cause.message||''))) || /abort|timed?\s*out/i.test(e.message||''));
    if (ab) throw new Error('Timed out fetching ' + url + ' - the site is slow or blocking automated requests. Use the Measure bookmarklet or enter the brand manually.');
    throw e;
  } finally { clearTimeout(t); }
}

async function handleScrape(url){
  const html = await fetchText(url, 12000); // main page: hard 12s cap
  const origin = new URL(url).origin;
  const hrefs = [];
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi; let m;
  while ((m = linkRe.exec(html)) && hrefs.length < 3){ if (!/googleapis|gstatic/.test(m[1])) hrefs.push(abs(m[1], origin)); }
  let css = '';
  for (const h of hrefs){ try { css += '\n' + await fetchText(h, 6000); } catch(e){} } // stylesheets: 6s each, failures ignored
  return scrapeBrand(html, css, url);
}

/* ---------- GHL write ---------- */
async function ghl(method, pathname, token, body){
  const r = await fetch(GHL_BASE + pathname, {
    method: method,
    headers: { Authorization: 'Bearer ' + token, Version: GHL_VERSION, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch(e){ json = { raw: text }; }
  if (!r.ok) throw new Error('GHL ' + method + ' ' + pathname + ' -> ' + r.status + ' ' + text.slice(0,300));
  return json;
}

/* A service URL is shared by every customer of that firm, so it must be the firm's own page and
   must not carry anyone's identifiers. Pasting a link straight out of the address bar is the
   obvious thing to do and picks up aw_loc/aw_c, which would pin every visitor to one contact. */
var AW_SERVICE_URL_KEYS = ['wills_url','lpa_url','etb_url','probate_url'];
function cleanServiceUrl(v){
  var raw = String(v == null ? '' : v).trim();
  if (!raw) return { value: '' };
  var u; try { u = new URL(raw); } catch(e){ return { value:'', error:'that does not look like a full web address' }; }
  if (u.protocol !== 'https:') return { value:'', error:'it needs to start with https' };
  var host = u.hostname.toLowerCase();
  if (host === 'engine.aiwills.co.uk' || host === 'aiwills.digilyse.co') return { value:'', error:'that is one of our own pages, not the firm\'s. Use the funnel page on their domain' };
  if (/-test\.html$/i.test(u.pathname)) return { value:'', error:'that is a test page, not a live funnel page' };
  if (/\/(preview|page-builder|funnel-builder)\//i.test(u.pathname)) return { value:'', error:'that is a builder or preview link, not the live page' };
  ['aw_loc','aw_c','aw_t','aw_paid','aw_id'].forEach(function(k){ u.searchParams.delete(k); });
  return { value: u.origin + u.pathname + (u.searchParams.toString() ? ('?' + u.searchParams.toString()) : '') };
}
/* An empty box used to mean "delete this setting". The tool posts all 56 fields on every save,
   so opening it fresh, typing a location id and one phone number wiped everything else on that
   account. Blank now means "leave it alone". Deleting a setting is a deliberate act: the caller
   has to have loaded the account first (allowClear), and wiping several at once needs confirming
   on top of that. Losing a firm's brand to a mistyped save is far worse than an extra click. */
const AW_CLEAR_WARN_AT = 5;
async function handleWrite(locationId, values, opts){
  if (!locationId) throw new Error('locationId is required.');
  const allowClear = !!(opts && opts.allowClear);
  const confirmClear = !!(opts && opts.confirmClear);
  // Brand/config now lives in OUR per-location store, NOT GHL custom values, so a snapshot push
  // from Demo can never overwrite a paying client's bespoke brand. Features push via the snapshot; brand does not.
  const cur = brandStoreGet(locationId) || {};
  const results = [];
  const urlProblems = [];
  const wouldClear = [];
  for (const name of Object.keys(values)){
    let value = values[name];
    if (AW_SERVICE_URL_KEYS.indexOf(name) >= 0 && String(value||'').trim()){
      const chk = cleanServiceUrl(value);
      if (chk.error){ urlProblems.push(name.replace(/_/g,' ') + ': ' + chk.error); continue; }
      value = chk.value;
      values[name] = value;
    }
    if (value === '' || value == null){
      if (!(name in cur)){ results.push({ name: name, skipped: true }); continue; }
      if (!allowClear){ results.push({ name: name, action: 'left as it was' }); continue; }
      wouldClear.push(name);
      continue;
    }
    cur[name] = value; results.push({ name: name, action: 'saved' });
  }
  // Clearing a handful is normal editing. Clearing a pile of them is almost always a blank form.
  if (wouldClear.length > AW_CLEAR_WARN_AT && !confirmClear){
    results.push({ name: 'Nothing was deleted', error: 'This would have removed ' + wouldClear.length + ' existing settings (' + wouldClear.slice(0, 6).join(', ') + (wouldClear.length > 6 ? ', ...' : '') + '). Load the client first so the boxes are filled in, or confirm if you really did mean to clear them.' });
    wouldClear.length = 0;
  }
  wouldClear.forEach(function(name){ delete cur[name]; results.push({ name: name, action: 'cleared' }); });
  brandStorePut(locationId, cur);
  if (urlProblems.length) results.push({ name: 'Service page links', error: urlProblems.join('; ') });
  return results;
}

/* ---------- Executor Toolbox (ETB): write the vault into the client's GHL ----------
   GHL is the system of record. We hold nothing. Structured answers -> the contact's
   custom fields. Field mapping lives here (one place), derived from a compact spec. */
function gp(state, p){ var a=p.split('.'), o=state, i; for (i=0;i<a.length;i++){ if (o==null) return ''; o=o[a[i]]; } return (o==null)?'':o; }
// [GHL field name, dataType, state path]
var ETB_SINGLE = [
  ['ETB Will Has','TEXT','will.has'], ['ETB Will Location Type','TEXT','will.locationType'], ['ETB Will Location','TEXT','will.locationText'],
  ['ETB Codicil Has','TEXT','codicil.has'], ['ETB Codicil Location Type','TEXT','codicil.locationType'], ['ETB Codicil Location','TEXT','codicil.locationText'],
  ['ETB LPA Has','TEXT','lpa.has'], ['ETB LPA Type','TEXT','lpa.type'], ['ETB LPA Location','TEXT','lpa.locationText'],
  ['ETB Property Deeds Location','TEXT','property.deedsLocation'], ['ETB Property Deeds Notes','LARGE_TEXT','property.deedsNotes'], ['ETB Property Has','TEXT','property.has'],
  ['ETB Insurance Has','TEXT','insurance.has'],
  ['ETB Pension Docs Location','TEXT','pensions.docsLocation'], ['ETB Pension Docs Notes','LARGE_TEXT','pensions.docsNotes'], ['ETB Pension Has','TEXT','pensions.has'],
  ['ETB Bank Has','TEXT','bank_accounts.has'], ['ETB Investment Has','TEXT','investments.has'], ['ETB Business Has','TEXT','business.has'],
  ['ETB Debt Has','TEXT','debts.has'], ['ETB Digital Has','TEXT','digital_assets.has'],
  ['ETB Wishes Record','TEXT','wishes.record'], ['ETB Wishes Arrangements','TEXT','wishes.arrangements'], ['ETB Wishes Preferences','LARGE_TEXT','wishes.preferences'], ['ETB Wishes Plan Provider','TEXT','wishes.planProvider'], ['ETB Wishes Docs Location','TEXT','wishes.docsLocation']
];
// Atomic repeater: only executors (they drive the future notify-on-death step).
// [GHL name prefix, state list path, cap, [[name suffix, dataType, item key]...]]
var ETB_REPEAT = [
  ['ETB Executor','executors.list',4,[['First Name','TEXT','firstName'],['Last Name','TEXT','lastName'],['Phone','TEXT','phone'],['Email','TEXT','email'],['Relationship','TEXT','relationship']]]
];
// Consolidated: one readable LARGE_TEXT field per asset category, listing all entries.
// [GHL field name, state list path, [[label, item key]...]]
var ETB_CONSOLIDATED = [
  ['ETB Properties','property.list',[['Address','address'],['Ownership','ownership'],['Mortgage','hasMortgage'],['Mortgage Provider','mortgageProvider']]],
  ['ETB Insurance Policies','insurance.list',[['Type','type'],['Provider','provider'],['Policy Number','policyNumber'],['Docs Location','location']]],
  ['ETB Pensions','pensions.list',[['Type','type'],['Provider','provider'],['Policy Number','policyNumber'],['Value','value'],['Access','access']]],
  ['ETB Bank Accounts','bank_accounts.list',[['Type','type'],['Bank','bankName'],['Account Number','accountNumber'],['Holder','holder'],['Details Stored','stored']]],
  ['ETB Investments','investments.list',[['Type','type'],['Provider','provider'],['Value','value'],['Reference','reference'],['Location','location']]],
  ['ETB Businesses','business.list',[['Name','name'],['Role','role'],['Key Contact','keyContact']]],
  ['ETB Debts','debts.list',[['Creditor','creditor'],['Type','creditorType'],['Balance','balance'],['Details','location']]],
  ['ETB Digital Assets','digital_assets.list',[['Platform','platform'],['Access','access'],['Location','location']]]
];
var ETB_COUNTS = [ ['ETB Executor Count','executors.list'], ['ETB Property Count','property.list'], ['ETB Insurance Count','insurance.list'], ['ETB Pension Count','pensions.list'], ['ETB Bank Count','bank_accounts.list'], ['ETB Investment Count','investments.list'], ['ETB Business Count','business.list'], ['ETB Debt Count','debts.list'], ['ETB Digital Count','digital_assets.list'] ];
var ETB_FILES = ['ETB Will Document','ETB Codicil Document','ETB LPA Document','ETB Pension Documents']; // created now, written in iteration 3
function etbFieldDefs(){
  var defs = [ { name:'ETB Status', dataType:'TEXT' }, { name:'ETB Completed At', dataType:'TEXT' }, { name:'ETB State Json', dataType:'LARGE_TEXT' } ];
  ETB_SINGLE.forEach(function(s){ defs.push({ name:s[0], dataType:s[1] }); });
  ETB_COUNTS.forEach(function(c){ defs.push({ name:c[0], dataType:'NUMERICAL' }); });
  ETB_REPEAT.forEach(function(r){ for (var n=1;n<=r[2];n++){ r[3].forEach(function(sub){ defs.push({ name:r[0]+' '+n+' '+sub[0], dataType:sub[1] }); }); } });
  ETB_CONSOLIDATED.forEach(function(c){ defs.push({ name:c[0], dataType:'LARGE_TEXT' }); });
  ETB_FILES.forEach(function(f){ defs.push({ name:f, dataType:'FILE_UPLOAD' }); });
  return defs;
}
function etbExtract(state, status){
  var out = {};
  if (status) out['ETB Status'] = status;
  try { out['ETB State Json'] = JSON.stringify(state||{}); } catch(e){}
  ETB_SINGLE.forEach(function(s){ var v=gp(state,s[2]); if (v!=='' && v!=null) out[s[0]]=v; });
  ETB_COUNTS.forEach(function(c){ var l=gp(state,c[1]); if (Array.isArray(l) && l.length) out[c[0]]=l.length; });
  ETB_REPEAT.forEach(function(r){ var list=gp(state,r[1]); if (!Array.isArray(list)) return; for (var i=0;i<list.length && i<r[2];i++){ var it=list[i]||{}; r[3].forEach(function(sub){ var v=it[sub[2]]; if (v!=='' && v!=null) out[r[0]+' '+(i+1)+' '+sub[0]]=v; }); } });
  ETB_CONSOLIDATED.forEach(function(c){ var list=gp(state,c[1]); if (!Array.isArray(list)||!list.length) return; var lines=[]; for (var i=0;i<list.length;i++){ var it=list[i]||{}; var parts=[]; c[2].forEach(function(p){ var v=it[p[1]]; if (v!=='' && v!=null) parts.push(p[0]+': '+v); }); if (parts.length) lines.push((i+1)+'. '+parts.join(', ')); } if (lines.length) out[c[0]]=lines.join('\n'); });
  return out;
}
async function ghlContactFields(token, loc){ var r = await ghl('GET', '/locations/' + loc + '/customFields?model=contact', token); return r.customFields || r.customField || []; }
async function etbFieldMap(token, loc){ var list = await ghlContactFields(token, loc); var m = {}; list.forEach(function(f){ m[(f.name||'').toLowerCase()] = f.id; }); return m; }
async function ensureEtbFields(token, loc){
  var map = await etbFieldMap(token, loc); var defs = etbFieldDefs(); var created = 0;
  for (var i=0;i<defs.length;i++){ var d=defs[i]; var k=d.name.toLowerCase(); if (map[k]) continue;
    try { var c = await ghl('POST', '/locations/' + loc + '/customFields', token, { name:d.name, dataType:d.dataType, model:'contact' }); var nf=c.customField||c; if (nf && nf.id){ map[k]=nf.id; created++; } }
    catch(e){ console.error('etb field create', d.name, e.message); }
  }
  return { map: map, created: created, total: defs.length };
}
async function etbStatus(loc){
  var token = await getWriteToken(loc); // throws if not authorised
  var map = await etbFieldMap(token, loc); var defs = etbFieldDefs();
  var present = [], missing = [];
  defs.forEach(function(d){ (map[d.name.toLowerCase()] ? present : missing).push(d.name); });
  return { authorised: true, totalDefined: defs.length, present: present.length, missing: missing.length, missingNames: missing.slice(0,20) };
}
async function etbSave(loc, state, contactId, status, opts){
  if (!loc) throw new Error('locationId required');
  var token = await getWriteToken(loc);
  var map = await etbFieldMap(token, loc);
  var pd = (state && state.your_details) || {};
  var values = etbExtract(state, status || 'started');
  var cf = []; var written = [], noField = [];
  Object.keys(values).forEach(function(name){ var id = map[name.toLowerCase()]; if (id){ cf.push({ id: id, value: String(values[name]) }); written.push(name); } else { noField.push(name); } });
  try{ var _csf=await awCurrentStepCF(token, loc, map, 'ETB', 'etb', opts&&opts.step); if(_csf.length) cf=cf.concat(_csf); }catch(e){}
  try{ var _esid=await awEnsureField(token, loc, map, 'ETB Summary'); if(_esid) cf=cf.concat([{ id:_esid, value: awSummarise(state||{}) }]); }catch(e){}
  try{ var _edf=await awDetailCF(token, loc, map, opts&&opts.detail); if(_edf.length) cf=cf.concat(_edf); }catch(e){}
  var base = { customFields: cf }; // GHL PUT rejects empty email, so only send personal fields that actually have a value
  var pmap = { firstName: pd.firstName, lastName: pd.lastName, email: pd.email, phone: pd.phone, address1: pd.address, city: pd.city, postalCode: pd.postcode };
  Object.keys(pmap).forEach(function(k){ if (pmap[k]!=null && String(pmap[k]).trim()!=='') base[k]=pmap[k]; });
  var up = await upsertOrUpdateContact(token, loc, contactId, base);
  var cid = (up.contact && up.contact.id) || up.id || contactId || '';
  var readback = null;
  if (cid){ try { var got = await ghl('GET', '/contacts/' + cid, token); var c = got.contact || got; var byId={}; (c.customFields||c.customField||[]).forEach(function(f){ byId[f.id]=(f.value!=null?f.value:f.fieldValue); }); readback = { id: cid, fieldCount: Object.keys(byId).length }; } catch(e){ readback = { id: cid, err: e.message }; } }
  var pdfRes; if (opts && opts.pdf && cid) pdfRes = await storeGeneratedPdf(loc, cid, 'etb'); // keep the summary PDF on the contact
  await applyTags(token, loc, cid, 'etb', state);
  await awSyncOpportunity(token, loc, cid, 'etb', (opts && opts.step) || '', state);
  return { contactId: cid, writtenCount: written.length, noFieldCount: noField.length, noFieldSample: noField.slice(0,10), readback: readback, pdf: pdfRes };
}
// Stream an uploaded document straight into a GHL FILE_UPLOAD custom field on the contact.
// Browser sends base64 (JSON) -> we build multipart to GHL -> we keep nothing.
async function etbUpload(loc, contactId, fieldName, filename, mimeType, dataBase64){
  if (!loc) throw new Error('locationId required');
  if (!contactId) throw new Error('contactId required (save the contact first)');
  if (!dataBase64) throw new Error('file data required');
  const token = await getWriteToken(loc);
  const map = await etbFieldMap(token, loc);
  const fid = map[(fieldName||'').toLowerCase()];
  if (!fid) throw new Error('Custom field not found: ' + fieldName);
  const buf = Buffer.from(dataBase64, 'base64');
  if (buf.length > 50*1024*1024) throw new Error('file too large (max 50MB)');
  const fileId = crypto.randomBytes(8).toString('hex');
  const form = new FormData();
  form.append('id', contactId);
  form.append('maxFiles', '1');
  form.append(fid + '_' + fileId, new Blob([buf], { type: mimeType || 'application/octet-stream' }), filename || 'document');
  const r = await fetch(GHL_BASE + '/locations/' + loc + '/customFields/upload', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, Version: GHL_VERSION, Accept: 'application/json' }, body: form
  });
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch(e){ json = { raw: text.slice(0,300) }; }
  if (!r.ok) throw new Error('GHL upload -> ' + r.status + ' ' + text.slice(0,400));
  var fileUrl=''; try { if (json && json.uploadedFiles){ fileUrl = json.uploadedFiles[filename] || (Object.keys(json.uploadedFiles).map(function(k){return json.uploadedFiles[k];})[0]) || ''; } if (!fileUrl && json && Array.isArray(json.meta) && json.meta[0]) fileUrl = json.meta[0].url || ''; } catch(e){}
  // GHL's contact UI doesn't render FILE_UPLOAD values, so mirror the storage URL into a TEXT link field the advisor can see + open.
  await mirrorFileLink(token, loc, map, contactId, fieldName, fileUrl);
  return { ok: true, field: fieldName, contactId: contactId, bytes: buf.length, url: fileUrl };
}
// GHL's contact UI + GET API don't surface FILE_UPLOAD values. Write the storage URL into a companion "<field> Link" TEXT field so it's visible + clickable on the contact.
async function mirrorFileLink(token, loc, map, contactId, fieldName, fileUrl){
  if (!fileUrl || !contactId) return false;
  var linkName = fieldName + ' Link';
  var lfid = map && map[linkName.toLowerCase()];
  if (!lfid){ try { var lcf = await ghl('POST','/locations/'+loc+'/customFields',token,{ name:linkName, dataType:'TEXT', model:'contact' }); var lnf=lcf.customField||lcf; if(lnf&&lnf.id){ lfid=lnf.id; if(map) map[linkName.toLowerCase()]=lfid; } } catch(e){} }
  if (lfid){ try { await ghl('PUT','/contacts/'+contactId, token, { customFields:[{ id:lfid, value:fileUrl }] }); return true; } catch(e){} }
  return false;
}

/* ---------- payment (Stripe), will store, PDF helpers ---------- */
const crypto = require('crypto');
const WILL_DIR = path.join(__dirname, 'will_data');
function willStorePut(id, obj){ try { fs.mkdirSync(WILL_DIR, { recursive: true }); fs.writeFileSync(path.join(WILL_DIR, id.replace(/[^a-f0-9]/gi,'') + '.json'), JSON.stringify(obj)); } catch(e){ console.error('willStorePut', e.message); } }
function willStoreGet(id){ try { return JSON.parse(fs.readFileSync(path.join(WILL_DIR, id.replace(/[^a-f0-9]/gi,'') + '.json'), 'utf8')); } catch(e){ return null; } }
const BRAND_DIR = path.join(__dirname, 'brand_data');
function brandStorePut(loc, obj){ try { fs.mkdirSync(BRAND_DIR, { recursive: true }); fs.writeFileSync(path.join(BRAND_DIR, String(loc).replace(/[^A-Za-z0-9]/g,'') + '.json'), JSON.stringify(obj)); } catch(e){ console.error('brandStorePut', e.message); } }
function brandStoreGet(loc){ try { return JSON.parse(fs.readFileSync(path.join(BRAND_DIR, String(loc).replace(/[^A-Za-z0-9]/g,'') + '.json'), 'utf8')); } catch(e){ return null; } }

function formEncode(obj){ const out = []; for (const k in obj){ const v = obj[k]; if (v === undefined || v === null || v === '') continue; out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); } return out.join('&'); }
/* Prices come from whatever a firm typed, or a scrape, or a GHL custom value. A blank or a
   "£99 per will" parses to NaN, and NaN survives arithmetic silently - multiply it by a zero
   quantity and the whole total is still NaN. Every price goes through here instead. */
function pence(v){
  // Strip only what people legitimately type around a number. Anything else - words, a minus
  // sign, a stray note like "99 per will" - is not a price and must not become one.
  var raw = String(v == null ? '' : v).trim().replace(/[\u00a3$\u20ac,\s]/g, '');
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(raw)) return 0;
  var n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
function num(v){
  var raw = String(v == null ? '' : v).trim().replace(/[%\u00a3$\u20ac,\s]/g, '');
  if (!/^[0-9]+(\.[0-9]+)?$/.test(raw)) return 0;
  var n = parseFloat(raw);
  return isFinite(n) ? n : 0;
}
/* One switch for the whole platform meant Demo could not be exercised without taking real money
   off whoever was testing. Each firm now carries its own mode, so a new client can rehearse the
   entire journey with test cards and be flipped to live on the day they launch.
   Default is LIVE on purpose: a firm left accidentally in test would believe it was taking payments
   while customers were never charged and no money ever arrived, which is far worse than the reverse. */
function awStripeMode(cv){
  return (String((cv && cv.stripe_mode) || '').trim().toLowerCase() === 'test') ? 'test' : 'live';
}
function awStripeKey(cv){
  if (awStripeMode(cv) === 'test') return process.env.STRIPE_SECRET_KEY_TEST || '';
  return process.env.STRIPE_SECRET_KEY || '';
}
/* Stripe signs test and live webhooks with different secrets and we may be receiving both, so try
   each configured one. Never trust the body's own livemode flag before a signature has passed. */
function awVerifyStripeHook(raw, sig){
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_TEST].filter(Boolean);
  for (let i = 0; i < secrets.length; i++){
    try { if (verifyStripeSig(raw, sig, secrets[i])) return true; } catch(e){}
  }
  return false;
}
async function stripeReq(method, pathname, params, key){
  const opts = { method: method, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' } };
  if (params) opts.body = formEncode(params);
  const r = await fetch('https://api.stripe.com' + pathname, opts);
  const text = await r.text(); let j; try { j = JSON.parse(text); } catch(e){ j = { raw: text }; }
  if (!r.ok) throw new Error('Stripe ' + pathname + ' -> ' + r.status + ' ' + text.slice(0,300));
  return j;
}
/* ---- Connect: which firms can actually be paid ----
   A firm only receives money once its own Stripe onboarding is finished. Saving an
   unfinished account against a location would make every checkout there fail with
   insufficient_capabilities_for_transfer, so the tool lists accounts from Stripe and
   the save refuses anything that is not ready. */
function connectAcctName(a){
  const bp = a.business_profile || {}, st = a.settings || {}, dash = st.dashboard || {}, ind = a.individual || {};
  const person = [ind.first_name, ind.last_name].filter(Boolean).join(' ');
  return String(bp.name || dash.display_name || person || a.email || a.id).trim();
}
function connectAcctReady(a){
  const caps = a.capabilities || {};
  return a.charges_enabled === true && caps.transfers === 'active';
}
async function connectAcctProblem(acct){
  if (!/^acct_[A-Za-z0-9]+$/.test(acct)) return 'Stripe account not saved: it should look like acct_1A2b3C...';
  if (!process.env.STRIPE_SECRET_KEY) return 'Stripe account not saved: Stripe is not configured on this server.';
  try {
    const a = await stripeReq('GET', '/v1/accounts/' + encodeURIComponent(acct), null, process.env.STRIPE_SECRET_KEY);
    if (connectAcctReady(a)) return '';
    return 'Stripe account not saved: ' + connectAcctName(a) + ' has not finished their Stripe onboarding, so payments to them would fail. Finish their Stripe setup first, then set this.';
  } catch(e){ return 'Stripe account not saved: could not check it with Stripe (' + String(e.message).slice(0,120) + ')'; }
}
function verifyStripeSig(raw, sigHeader, secret){
  try {
    const parts = {}; (sigHeader || '').split(',').forEach(function(p){ const i = p.indexOf('='); if (i > 0) parts[p.slice(0,i)] = p.slice(i+1); });
    if (!parts.t || !parts.v1) return false;
    const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw, 'utf8').digest('hex');
    const a = Buffer.from(expected), b = Buffer.from(parts.v1);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch(e){ return false; }
}
/* ---- edit-link tokens: gate the load-by-contact endpoints so a contactId alone can't read someone's data ---- */
function editSecret(){ return process.env.EDIT_SECRET || ''; } // no fallback: empty secret means signEdit/verifyEdit refuse to mint or accept tokens
function b64u(s){ return Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64ud(s){ s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return Buffer.from(s,'base64').toString('utf8'); }
function signEdit(payload){ var sec=editSecret(); if(!sec) return ''; var p=b64u(JSON.stringify(payload)); var h=crypto.createHmac('sha256',sec).update(p).digest('hex').slice(0,32); return p+'.'+h; }
function verifyEdit(token){ try{ var sec=editSecret(); if(!sec||!token) return null; var parts=String(token).split('.'); if(parts.length!==2) return null; var exp=crypto.createHmac('sha256',sec).update(parts[0]).digest('hex').slice(0,32); var a=Buffer.from(exp),b=Buffer.from(parts[1]); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return null; var obj=JSON.parse(b64ud(parts[0])); if(obj.exp && Date.now()>obj.exp) return null; return obj; }catch(e){ return null; } }
/* A link that sits in an inbox for thirty days is a password anyone with the inbox can reuse,
   and there was no way to take it back. An emailed link now lasts an hour and works once. It is
   traded for a session that lives in the tab, so closing the tab or signing out really does end it. */
const AUTH_DIR = path.join(__dirname, 'auth_data');
const AUTH_USED = path.join(AUTH_DIR, 'used.json');
const AW_LINK_TTL_MS = 60 * 60 * 1000;
const AW_SESSION_TTL_MS = 60 * 60 * 1000;
function authUsedAll(){ try { return JSON.parse(fs.readFileSync(AUTH_USED, 'utf8')) || {}; } catch(e){ return {}; } }
function authUsedPut(map){ try { fs.mkdirSync(AUTH_DIR, { recursive: true }); fs.writeFileSync(AUTH_USED, JSON.stringify(map)); } catch(e){ console.error('authUsedPut', e.message); } }
/* One list covers both jobs: a link that has been spent, and a session that has been signed out.
   Entries are dropped once the token they refer to would have expired anyway, so it stays small. */
function authSpend(jti, exp){
  if (!jti) return false;
  const now = Date.now(), map = authUsedAll(), fresh = {};
  Object.keys(map).forEach(function(k){ if (map[k] > now) fresh[k] = map[k]; });
  if (fresh[jti]) return false;
  fresh[jti] = exp || (now + AW_LINK_TTL_MS);
  authUsedPut(fresh);
  return true;
}
function authIsSpent(jti){ if (!jti) return false; const m = authUsedAll(); return !!(m[jti] && m[jti] > Date.now()); }
function awJti(){ return crypto.randomBytes(12).toString('hex'); }
function signLink(loc, cid, funnel){ return signEdit({ loc: loc, cid: cid, funnel: funnel, kind: 'link', jti: awJti(), exp: Date.now() + AW_LINK_TTL_MS }); }
function signSession(loc, cid, funnel){ return signEdit({ loc: loc, cid: cid, funnel: funnel, kind: 'session', jti: awJti(), exp: Date.now() + AW_SESSION_TTL_MS }); }
/* Read a saved funnel state JSON off a contact. funnel = 'etb' | 'wills'. */
async function loadState(loc, contactId, funnel){
  var token = await getWriteToken(loc);
  var fieldName = (funnel==='wills') ? 'Will State Json' : (funnel==='lpa' ? 'LPA State Json' : 'ETB State Json');
  var map = await etbFieldMap(token, loc); // generic contact-field name -> id
  var fid = map[fieldName.toLowerCase()];
  var got = await ghl('GET', '/contacts/' + contactId, token); var c = got.contact || got;
  var state=null, contact={ firstName:c.firstName||'', lastName:c.lastName||'', email:c.email||'', phone:c.phone||'' };
  var byId={}; (c.customFields||c.customField||[]).forEach(function(f){ byId[f.id]=(f.value!=null?f.value:f.fieldValue); });
  if (fid && byId[fid]!=null){ try{ state=JSON.parse(byId[fid]); }catch(e){} }
  // Uploaded documents: read the FILE_UPLOAD fields' URLs so the client can view/download them.
  var files=[], filesRaw=[]; ETB_FILES.forEach(function(name){ var id=map[name.toLowerCase()]; if(!id) return; var raw=byId[id]; if(raw!=null&&raw!=='') filesRaw.push({ field:name, t:(typeof raw), sample:(typeof raw==='object'?JSON.stringify(raw):String(raw)).slice(0,240) }); var u=extractFileUrl(raw); if(u.url) files.push({ field:name, url:u.url, name:u.name||'' }); });
  return { state: state, contact: contact, found: !!state, files: files, filesRaw: filesRaw };
}
// GHL FILE_UPLOAD values vary (plain URL, object/array {url}, JSON string, or a documents wrapper). Pull a usable URL out.
function extractFileUrl(v){
  if (v==null || v==='') return { url:'' };
  if (typeof v==='object'){ try{ v=JSON.stringify(v); }catch(e){ v=String(v); } }
  var s=String(v).trim();
  if (/^https?:\/\//i.test(s)) return { url:s };
  try { var j=JSON.parse(s); var o=Array.isArray(j)?j[0]:j; if(o&&typeof o==='object'){ var url=o.url||o.fileUrl||o.link||o.documentUrl||o.publicUrl||''; if(url) return { url:url, name:o.name||o.fileName||'' }; } } catch(e){}
  var m=s.match(/https?:\/\/[^\s"'\\\]]+/i); return { url: m?m[0]:'' };
}
/* Persist the Wills funnel state JSON onto the contact (so it can be loaded back for editing). */
function awHumanise(k){
  var m={ akaHas:'Also known as', dob:'Date of birth', iht:'Inheritance tax', ownHome:'Owns home', ownBusiness:'Owns business', liveEW:'Lives in England or Wales', assetsEW:'All assets in England & Wales', estateBand:'Estate value', hasPartner:'Has partner', hasChildren:'Has children', mirrorWill:'Mirror will', over18:'Over 18' };
  if(m[k]) return m[k];
  return String(k).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
}
var AW_SECTION={ personal:'Personal details', partner:'Spouse / partner', situation:'Circumstances', children:'Children', guardian:'Guardians', executors:'Executors', gifts:'Gifts & legacies', mirrorGifts:'Gifts (their mirror will)', residual:'Residual estate', funeral:'Funeral wishes', about:'About you', estate:'Estate', concerns:'Concerns', contact_details:'Contact details', your_details:'Your details' };
function awMoney(k,v){ if(/share/i.test(k)) return v+'%'; if(/amount|price/i.test(k)) return '£'+v; return v; }
function awLines(obj, indent){
  var pad=''; for(var i=0;i<indent;i++) pad+='  '; var out=[];
  Object.keys(obj||{}).forEach(function(k){
    if(k==='payment'||/^_/.test(k)) return;
    var v=obj[k];
    if(v==null||v===''||(Array.isArray(v)&&!v.length)) return;
    var label=(indent===0 && AW_SECTION[k])?AW_SECTION[k]:awHumanise(k);
    if(Array.isArray(v)){
      out.push(pad+label+':');
      v.forEach(function(it,idx){
        if(it&&typeof it==='object'){ var parts=[]; Object.keys(it).forEach(function(ik){ var iv=it[ik]; if(iv==null||iv==='') return; parts.push(awHumanise(ik)+': '+awMoney(ik,iv)); }); out.push(pad+'  '+(idx+1)+'. '+parts.join(', ')); }
        else out.push(pad+'  - '+v);
      });
    } else if(typeof v==='object'){ var sub=awLines(v,indent+1); if(sub){ out.push(pad+label+':'); out.push(sub); } }
    else { out.push(pad+label+': '+awMoney(k,v)); }
  });
  return out.join('\n');
}
function awSummarise(state){ try{ var s=awLines(state,0); return s||'(no details captured yet)'; }catch(e){ return '(summary unavailable)'; } }
async function awEnsureField(token, loc, map, name, dataType){
  dataType=dataType||'LARGE_TEXT';
  var fid=map[name.toLowerCase()];
  if(!fid){ try{ var c=await ghl('POST','/locations/'+loc+'/customFields',token,{name:name,dataType:dataType,model:'contact'}); var nf=c.customField||c; if(nf&&nf.id){ fid=nf.id; map[name.toLowerCase()]=fid; } }catch(e){ console.error('field create '+name, e.message); } }
  return fid;
}

// Map an engine funnel step (section id) to the matching GHL pipeline stage name (Chris's workflows trigger on the "<Service> Current Step" field). Probate = lead pipeline, engine only sets New Lead.
var AW_STAGE_MAP = {
  wills: { personal:'Your Details', partner:'Spouse/Partner', situation:'Spouse/Partner', children:'Your Children', guardian:'Guardians', executors:'Executors', gifts:'Gifts', mirrorGifts:'Gifts', residual:'Residual Estate', funeral:'Funeral Arrangements', mirrorFuneral:'Funeral Arrangements', review:'Pay Bill', payment:'Pay Bill', generate:'Pay Bill' },
  lpa: { your_details:'Donor Details', attorneys:'Attorneys', lpa_type:'LPA Type', decisions:'Decisions', treatment:'Treatment', preferences:'Preferences', usage:'Usage', notify:'Notification', provider:'Provider', registration:'Registration', exemption:'Fee', declaration:'Declaration', review:'Review', payment:'Pay Bill LPA', generate:'Pay Bill LPA' },
  probate: { about:'New Probate Lead', grant:'New Probate Lead', will:'New Probate Lead', estate:'Contacted', beneficiaries:'Contacted', contact_details:'Contacted', referral_done:'Proposal Sent' },
  etb: { your_details:'Your Details', executors:'Executors', will:'Will', codicil:'Codicil', lpa:'LPA', property:'Property', insurance:'Insurance', bank_accounts:'Banks', pensions:'Pensions', investments:'Investments', business:'Business', debts:'Debts', digital_assets:'Digital', wishes:'Wishes & memories', review:'Review', payment:'Payment', done:'Complete' }
};
/* ---------- Opportunities ----------
   Chris built the pipelines but nothing ever put anything on them, because the funnels only touch
   contacts. So the engine does it: create the opportunity when someone starts, move it as they go.
   Rules that matter here:
   - It must NEVER break a save. A will is worth more than a sales board, so every failure is caught
     and logged, and the customer's answers are already written by the time we get here.
   - Only Demo currently holds the opportunities scope. Client accounts mint from the agency token
     and will 401, so a failure per location is remembered for a while rather than retried on every
     keystroke.
   - Stages only ever move forward. Someone going back to edit step one should not drag their
     opportunity back to the start of the board. */
/* Matching a stage by its NAME means a firm renaming "Gifts" to "Gifts & legacies" silently stops
   their cards moving. So the first time we work a stage out by name we write the id down, and from
   then on we use the id. Renaming, reordering and re-wording all become harmless. The saved map also
   gives the onboarding tool something a human can see and correct without a developer. */
function awMapGet(loc){
  try { var b = brandStoreGet(loc) || {}; var m = b.pipeline_map; if (typeof m === 'string') m = JSON.parse(m); return m || {}; }
  catch(e){ return {}; }
}
function awMapPut(loc, map){
  try { var cur = brandStoreGet(loc) || {}; cur.pipeline_map = map; brandStorePut(loc, cur); }
  catch(e){ console.error('awMapPut', e.message); }
}
/* Every distinct stage a service can ask for, in the order the customer meets them. */
function awStepsFor(service){
  var m = AW_STAGE_MAP[service] || {};
  return Object.keys(m).map(function(step){ return { step: step, stage: m[step] }; });
}
var AW_PIPELINE_NAMES = { wills:'Online Wills', lpa:'Online LPAs', etb:'Executor Toolbox', probate:'Probate Quotes & Referrals' };
var _awPipeCache = {};      // locationId -> { at, pipelines }
var _awPipeFail  = {};      // locationId -> retry-after timestamp
var AW_PIPE_TTL_MS   = 10 * 60 * 1000;
var AW_PIPE_QUIET_MS = 15 * 60 * 1000;

async function awPipelines(token, loc){
  var now = Date.now();
  var hit = _awPipeCache[loc];
  if (hit && (now - hit.at) < AW_PIPE_TTL_MS) return hit.pipelines;
  if (_awPipeFail[loc] && now < _awPipeFail[loc]) return null;   // known to be unavailable, stay quiet
  try {
    var r = await ghl('GET', '/opportunities/pipelines?locationId=' + loc, token);
    var list = r.pipelines || r.data || [];
    _awPipeCache[loc] = { at: now, pipelines: list };
    delete _awPipeFail[loc];
    return list;
  } catch(e){
    _awPipeFail[loc] = now + AW_PIPE_QUIET_MS;
    console.error('opportunities: no pipeline access for ' + loc + ' (' + String(e && e.message || '').slice(0, 90) + ')');
    return null;
  }
}
function awPickPipeline(pipelines, service, cv){
  if (!pipelines || !pipelines.length) return null;
  var want = String((cv && (cv[service + '_pipeline'] || '')) || AW_PIPELINE_NAMES[service] || '').trim().toLowerCase();
  var byId = pipelines.filter(function(p){ return String(p.id) === String((cv && cv[service + '_pipeline']) || ''); })[0];
  if (byId) return byId;
  var exact = pipelines.filter(function(p){ return String(p.name || '').trim().toLowerCase() === want; })[0];
  if (exact) return exact;
  // A firm may have renamed the board. Fall back to the obvious word rather than giving up.
  var hint = { wills:'will', lpa:'lpa', etb:'toolbox', probate:'probate' }[service] || '';
  return hint ? (pipelines.filter(function(p){ return String(p.name || '').toLowerCase().indexOf(hint) >= 0; })[0] || null) : null;
}
function awStageIndex(pipeline, stageName){
  var want = String(stageName || '').trim().toLowerCase();
  var stages = (pipeline && pipeline.stages) || [];
  for (var i = 0; i < stages.length; i++){ if (String(stages[i].name || '').trim().toLowerCase() === want) return i; }
  return -1;
}
function awOppName(service, state){
  var p = (state && (state.personal || state.your_details || state.contact_details)) || {};
  var who = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  var label = { wills:'Will', lpa:'LPA', etb:'Executor Toolbox', probate:'Probate' }[service] || 'Enquiry';
  return (who ? who + ' - ' : '') + label;
}
/* Work out the board and the stage for one funnel step, preferring what has been saved.
   Returns how it got there so the tool can show it honestly rather than just "ok". */
function awResolve(pipelines, saved, service, step, cv){
  var out = { pipeline:null, stageId:'', stageName:'', via:'', problem:'' };
  var wantName = awStageFor(service, step);
  if (!wantName){ out.problem = 'this step is not tracked on the board'; return out; }
  out.stageName = wantName;

  var byId = saved && saved.pipelineId ? pipelines.filter(function(p){ return String(p.id) === String(saved.pipelineId); })[0] : null;
  out.pipeline = byId || awPickPipeline(pipelines, service, cv);
  out.via = byId ? 'saved' : 'name';
  if (!out.pipeline){ out.problem = 'no matching pipeline on this account'; return out; }

  var savedStage = saved && saved.stages ? saved.stages[step] : '';
  if (savedStage){
    var still = (out.pipeline.stages || []).filter(function(st){ return String(st.id) === String(savedStage); })[0];
    if (still){ out.stageId = still.id; out.stageName = still.name; out.via = 'saved'; return out; }
    out.via = 'name';   // the saved stage was deleted; fall back and re-learn
  }
  var idx = awStageIndex(out.pipeline, wantName);
  if (idx < 0){ out.problem = 'no stage called "' + wantName + '" on ' + out.pipeline.name; return out; }
  out.stageId = out.pipeline.stages[idx].id;
  out.stageName = out.pipeline.stages[idx].name;
  return out;
}
/* Put this person on the right board at the right stage. Returns quietly on any problem. */
async function awSyncOpportunity(token, loc, contactId, service, step, state){
  try {
    if (!loc || !contactId) return;
    var stageName = awStageFor(service, step);
    if (!stageName) return;                       // a step we deliberately do not track
    var pipelines = await awPipelines(token, loc);
    if (!pipelines) return;
    var cv = {}; try { cv = await getCustomValuesMap(loc, token); } catch(_){}
    var wholeMap = awMapGet(loc);
    var r = awResolve(pipelines, wholeMap[service], service, step, cv);
    if (r.problem){ console.error('opportunities: ' + loc + ' ' + service + '/' + step + ': ' + r.problem); return; }
    var pipeline = r.pipeline, wantStageId = r.stageId;
    // Learn it once so a later rename cannot break this step.
    if (r.via === 'name'){
      var entry = wholeMap[service] || { pipelineId:'', stages:{} };
      entry.pipelineId = pipeline.id; entry.stages = entry.stages || {}; entry.stages[step] = wantStageId;
      wholeMap[service] = entry; awMapPut(loc, wholeMap);
    }
    var wantIdx = awStageIndex(pipeline, r.stageName);

    var existing = null;
    try {
      var found = await ghl('GET', '/opportunities/search?location_id=' + loc + '&contact_id=' + contactId, token);
      var opps = found.opportunities || found.data || [];
      existing = opps.filter(function(o){ return String(o.pipelineId) === String(pipeline.id); })[0] || null;
    } catch(e){ /* treat as none and let the create decide */ }

    if (!existing){
      await ghl('POST', '/opportunities/', token, {
        pipelineId: pipeline.id, locationId: loc, contactId: contactId,
        pipelineStageId: wantStageId, name: awOppName(service, state), status: 'open'
      });
      return;
    }
    // Forward only. Going back to change an answer should not undo their progress on the board.
    var haveIdx = -1;
    for (var i = 0; i < pipeline.stages.length; i++){ if (String(pipeline.stages[i].id) === String(existing.pipelineStageId)) { haveIdx = i; break; } }
    if (haveIdx >= wantIdx) return;
    await ghl('PUT', '/opportunities/' + existing.id, token, { pipelineStageId: wantStageId });
  } catch(e){
    console.error('awSyncOpportunity ' + service + ' ' + loc + ': ' + String(e && e.message || '').slice(0, 140));
  }
}
function awStageFor(service, step){
  if(service==='probate'||service==='referral') return AW_STAGE_MAP.probate[step] || 'New Probate Lead';
  var m=AW_STAGE_MAP[service]; if(!m||!step) return '';
  return m[step]||'';
}
async function awCurrentStepCF(token, loc, map, label, service, step){
  var stage=awStageFor(service, step); if(!stage) return [];
  var fid=await awEnsureField(token, loc, map, label+' Current Step', 'TEXT');
  return fid ? [{ id:fid, value:stage }] : [];
}

// Break key single-value answers into tidy named fields (readable in GHL, usable as workflow conditions). Lists stay in the Summary.
function _len(list){ try{ return (list||[]).filter(function(x){ return x && (x.firstName||x.lastName||x.name||x.description||x.amount); }).length; }catch(e){ return 0; } }
function _v(x){ return (x!=null && String(x).trim()!=='') ? String(x).trim() : ''; }
function awNamedFields(service, state){
  var s=state||{}, o=[];
  function add(n,v){ if(_v(v)!=='') o.push({ name:n, value:String(v) }); }
  if(service==='wills'){
    var pt=s.partner||{}, si=s.situation||{}, ch=s.children||{}, re=s.residual||{}, fu=s.funeral||{};
    if(pt.hasPartner==='Yes') add('Will Marital Status', pt.status||'Has partner');
    else if(pt.hasPartner==='No') add('Will Marital Status','Single');
    if(pt.hasPartner==='Yes') add('Will Mirror Will', pt.mirrorWill);
    add('Will Has Children', ch.hasChildren);
    if(ch.hasChildren==='Yes'){ add('Will Number of Children', ch.count); add('Will Children Under 18', ch.anyUnder18); add('Will Guardians Appointed', ch.appointGuardians); }
    var ne=_len(s.executors&&s.executors.list); if(ne) add('Will Number of Executors', ne);
    add('Will Estate Distribution', re.distribution);
    add('Will Property Abroad', si.propertyAbroad);
    add('Will Domicile Elsewhere', si.domicileElsewhere);
    add('Will Has Previous Will', si.previousWillHas);
    add('Will Funeral Preference', fu.arrangements);
    var al=s.addlpa||{}; if(al.want && !/^no/i.test(String(al.want))) add('Will LPA Add-on', al.want);
  } else if(service==='lpa'){
    add('LPA Type', (s.lpa_type||{}).type);
    var na=_len(s.attorneys&&s.attorneys.list); if(na) add('LPA Number of Attorneys', na);
    add('LPA Attorney Decisions', (s.decisions||{}).mode);
    add('LPA Registered By', (s.registration||{}).who);
    add('LPA Fee Status', (s.exemption||{}).status);
  } else if(service==='probate'||service==='referral'){
    var ab=s.about||{}, gr=s.grant||{}, wl=s.will||{}, es=s.estate||{}, bn=s.beneficiaries||{}, cd=s.contact_details||{};
    add('Probate Lives In England Or Wales', ab.liveEW);
    add('Probate Has Grant', ab.hasGrant);
    add('Probate Named On Grant', gr.namedOnGrant);
    add('Probate Has Will', wl.hasWill);
    add('Probate Is Executor', wl.isExecutor);
    add('Probate Executors Died Or Refused', wl.executorsGone || gr.executorsGone);
    add('Probate Is Beneficiary', wl.isBeneficiary);
    add('Probate Next Of Kin', wl.nextOfKin);
    if(_v(es.value)!=='') add('Probate Estate Value', '\u00a3'+es.value);
    add('Probate Has Property', es.hasProperty);
    add('Probate Property Outside England Or Wales', es.propertyOutsideEW);
    add('Probate Property Occupied', es.propertyOccupied);
    add('Probate Number Of Beneficiaries', bn.count);
    add('Probate Beneficiary Under 18', bn.anyUnder18);
    add('Probate Contested', bn.contested);
    add('Probate Postcode', cd.postcode);
  }
  return o;
}
/* Fields the engine derived from the questions themselves. Capped per save so the very first
   submission on a new account cannot spend minutes creating fields; the rest are created on the
   next save, and saves happen on every step. */
async function awDetailCF(token, loc, map, detail){
  var out=[], made=0;
  if(!Array.isArray(detail)) return out;
  for(var i=0;i<detail.length && i<300;i++){
    var d=detail[i]||{};
    var nm=String(d.name||'').replace(/[^A-Za-z0-9 £%&'(),.\/-]/g,' ').replace(/\s+/g,' ').trim().slice(0,100);
    var vl=(d.value==null)?'':String(d.value).slice(0,2000);
    if(!nm || vl==='') continue;
    var known=!!map[nm.toLowerCase()];
    if(!known && made>=25) continue;                 // create the rest next time round
    try{ var fid=await awEnsureField(token, loc, map, nm, 'TEXT'); if(fid){ if(!known) made++; out.push({ id:fid, value:vl }); } }catch(e){}
  }
  return out;
}
async function awNamedFieldsCF(token, loc, map, service, state){
  var list=awNamedFields(service, state); var out=[];
  for(var i=0;i<list.length;i++){ try{ var fid=await awEnsureField(token, loc, map, list[i].name, 'TEXT'); if(fid) out.push({ id:fid, value:list[i].value }); }catch(e){} }
  return out;
}
async function awStateAndSummaryCF(token, loc, map, label, state){
  var out=[];
  var jid=await awEnsureField(token, loc, map, label+' State Json');
  if(jid){ try{ out.push({ id:jid, value: JSON.stringify(state||{}) }); }catch(e){} }
  var sid=await awEnsureField(token, loc, map, label+' Summary');
  if(sid){ try{ out.push({ id:sid, value: awSummarise(state||{}) }); }catch(e){} }
  return out;
}
function _yes(v){ return String(v).toLowerCase()==='yes'; }
// Derive the full tag set from a funnel's answers. Lifecycle + segmentation + concerns.
// Chris builds all automations off these; we just emit them.
function deriveTags(service, state){
  var s=state||{}, tags=[];
  var svc=(service==='referral'||service==='probate')?'probate':service; // wills|lpa|etb|probate
  tags.push('aiw-'+svc+'-started');
  // Wills answers
  var p=s.partner||{}, sit=s.situation||{}, ch=s.children||{};
  // Probate/referral answers
  var ab=s.about||{}, est=s.estate||{}, con=s.concerns||{};
  var hasPartner = (p.hasPartner!=null?p.hasPartner:ab.hasPartner);
  if(hasPartner!=null && hasPartner!==''){ tags.push(_yes(hasPartner)?'aiw-married':'aiw-single'); }
  var hasChildren = (ch.hasChildren!=null?ch.hasChildren:ab.hasChildren);
  if(_yes(hasChildren)) tags.push('aiw-has-children');
  var mirror = (p.mirrorWill!=null?p.mirrorWill:ab.mirrorWill);
  if(_yes(mirror)) tags.push('aiw-wants-mirror-will');
  if(s.addlpa && s.addlpa.want && !/^no/i.test(String(s.addlpa.want))) tags.push('aiw-lpa-addon');
  if(_yes(sit.propertyAbroad)) tags.push('aiw-property-abroad');
  if(_yes(sit.domicileElsewhere)) tags.push('aiw-domicile-elsewhere');
  if(_yes(sit.previousWillHas)) tags.push('aiw-has-existing-will');
  if(_yes(est.ownBusiness)) tags.push('aiw-owns-business');
  if(_yes(est.ownHome)) tags.push('aiw-owns-property');
  if(est.assetsEW!=null && est.assetsEW!=='' && !_yes(est.assetsEW)) tags.push('aiw-property-abroad');
  if(String(est.estateBand||'').toLowerCase()==='above') tags.push('aiw-estate-over-iht');
  else if(String(est.estateBand||'').toLowerCase()==='below') tags.push('aiw-estate-under-iht');
  // Probate (real question set): route the lead by what it actually is
  if(svc==='probate'){
    var pab=s.about||{}, pgr=s.grant||{}, pwl=s.will||{}, pes=s.estate||{}, pbn=s.beneficiaries||{};
    if(pab.liveEW==='No') tags.push('aiw-probate-outside-ew');
    if(pab.hasGrant==='Yes') tags.push('aiw-probate-has-grant');       // admin only, the grant is done
    if(pab.hasGrant==='No') tags.push('aiw-probate-needs-grant');      // the full job
    if(pwl.hasWill==='No') tags.push('aiw-probate-intestate');
    if(pwl.isExecutor==='Yes' || pgr.namedOnGrant==='Yes') tags.push('aiw-probate-can-apply');
    if(pwl.executorsGone==='Yes' || pgr.executorsGone==='Yes') tags.push('aiw-probate-executors-renounced');
    if(pes.hasProperty==='Yes') tags.push('aiw-probate-property');
    if(pes.propertyOutsideEW==='Yes') tags.push('aiw-property-abroad');
    if(pes.propertyOccupied==='Yes') tags.push('aiw-probate-property-occupied');
    if(pbn.anyUnder18==='Yes') tags.push('aiw-probate-minor-beneficiary');
    if(pbn.contested==='Yes') tags.push('aiw-probate-dispute-risk');
    var pv=parseFloat(String(pes.value||'').replace(/[^0-9.]/g,''));
    if(pv>0) tags.push(pv>325000?'aiw-estate-over-iht':'aiw-estate-under-iht');
  }
  // Probate concern checkboxes (Yes = ticked)
  if(_yes(con.careFees)) tags.push('aiw-concern-care-fees');
  if(_yes(con.iht)) tags.push('aiw-concern-iht');
  if(_yes(con.divorceBankruptcy)) tags.push('aiw-concern-divorce');
  if(_yes(con.remarriage)) tags.push('aiw-concern-remarriage');
  if(_yes(con.mentalCapacity)) tags.push('aiw-concern-capacity');
  // ETB: whether they already have a will (cross-sell)
  if(s.will && s.will.has!=null && s.will.has!==''){ tags.push(_yes(s.will.has)?'aiw-has-existing-will':'aiw-no-will'); }
  // de-dupe
  var seen={}, out=[]; tags.forEach(function(x){ if(x && !seen[x]){ seen[x]=1; out.push(x); } });
  return out;
}
async function applyTags(token, loc, cid, service, state){
  if(!cid) return;
  try{ var tags=deriveTags(service, state); if(tags.length) await ghl('POST','/contacts/'+cid+'/tags', token, { tags: tags }); }
  catch(e){ console.error('applyTags', e.message); }
}
async function willSave(loc, state, contactId, opts){
  if(!loc) throw new Error('locationId required');
  var token = await getWriteToken(loc);
  var map = await etbFieldMap(token, loc);
  var p=(state&&state.personal)||{};
  var base={}; var pmap={ firstName:p.firstName, lastName:p.lastName, email:p.email, phone:p.phone }; // GHL PUT rejects empty email
  Object.keys(pmap).forEach(function(k){ if(pmap[k]!=null && String(pmap[k]).trim()!=='') base[k]=pmap[k]; });
  var _cf=await awStateAndSummaryCF(token, loc, map, 'Will', state); if(_cf.length) base.customFields=_cf;
  try{ var _csf=await awCurrentStepCF(token, loc, map, 'Will', 'wills', opts&&opts.step); if(_csf.length) base.customFields=(base.customFields||[]).concat(_csf); }catch(e){}
  try{ var _nf=await awNamedFieldsCF(token, loc, map, 'wills', state); if(_nf.length) base.customFields=(base.customFields||[]).concat(_nf); }catch(e){}
  try{ var _df=await awDetailCF(token, loc, map, (opts&&opts.detail)); if(_df.length) base.customFields=(base.customFields||[]).concat(_df); }catch(e){}
  var up=await upsertOrUpdateContact(token, loc, contactId, base);
  var cid=(up.contact&&up.contact.id)||up.id||contactId||'';
  var pdfRes; if (opts && opts.pdf && cid) pdfRes = await storeGeneratedPdf(loc, cid, 'wills');
  await applyTags(token, loc, cid, 'wills', state);
  await awSyncOpportunity(token, loc, cid, 'wills', (opts && opts.step) || '', state);
  return { contactId: cid, saved: _cf.length>0, pdf: pdfRes };
}
/* Persist a referral-funnel state JSON onto the contact and tag the lead on submit (probate etc). */
async function referralSave(loc, state, contactId, key, status, step, detail){
  if(!loc) throw new Error('locationId required');
  var k=String(key||'probate').replace(/[^a-z]/gi,'').toLowerCase()||'probate';
  var label=k.charAt(0).toUpperCase()+k.slice(1);
  var token = await getWriteToken(loc);
  var map = await etbFieldMap(token, loc);
  var p=(state&&state.contact_details)||{};
  var base={}; var pmap={ firstName:p.firstName, lastName:p.lastName, email:p.email, phone:p.phone };
  Object.keys(pmap).forEach(function(x){ if(pmap[x]!=null && String(pmap[x]).trim()!=='') base[x]=pmap[x]; });
  var _rcf=await awStateAndSummaryCF(token, loc, map, label, state); if(_rcf.length) base.customFields=_rcf;
  try{ var _csf=await awCurrentStepCF(token, loc, map, label, k, step); if(_csf.length) base.customFields=(base.customFields||[]).concat(_csf); }catch(e){}
  try{ var _nf=await awNamedFieldsCF(token, loc, map, k, state); if(_nf.length) base.customFields=(base.customFields||[]).concat(_nf); }catch(e){}
  try{ var _df=await awDetailCF(token, loc, map, detail); if(_df.length) base.customFields=(base.customFields||[]).concat(_df); }catch(e){}
  var up=await upsertOrUpdateContact(token, loc, contactId, base);
  var cid=(up.contact&&up.contact.id)||up.id||contactId||'';
  if(status==='submitted' && cid){
    var tag=k+'-lead';
    try{ var cv=await getCustomValuesMap(loc, token); if(cv['referral_lead_tag']) tag=cv['referral_lead_tag']; }catch(e){}
    try{ await ghl('POST','/contacts/'+cid+'/tags', token, { tags:[tag] }); }catch(e){ console.error('referral tag', e.message); }
  }
  await applyTags(token, loc, cid, k, state);
  await awSyncOpportunity(token, loc, cid, k, step || '', state);
  return { contactId: cid, saved: _rcf.length>0 };
}
/* Persist the LPA funnel state JSON onto the contact (capture flow; PDF fill added later). */
async function lpaSave(loc, state, contactId, opts){
  if(!loc) throw new Error('locationId required');
  var token = await getWriteToken(loc);
  var map = await etbFieldMap(token, loc);
  var p=(state&&state.your_details)||{};
  var base={}; var pmap={ firstName:p.firstName, lastName:p.lastName, email:p.email, phone:p.phone };
  Object.keys(pmap).forEach(function(k){ if(pmap[k]!=null && String(pmap[k]).trim()!=='') base[k]=pmap[k]; });
  var _lcf=await awStateAndSummaryCF(token, loc, map, 'LPA', state);
  if(_lcf.length){ base.customFields=_lcf; }
  try{ var _csf=await awCurrentStepCF(token, loc, map, 'LPA', 'lpa', opts&&opts.step); if(_csf.length) base.customFields=(base.customFields||[]).concat(_csf); }catch(e){}
  try{ var _nf=await awNamedFieldsCF(token, loc, map, 'lpa', state); if(_nf.length) base.customFields=(base.customFields||[]).concat(_nf); }catch(e){}
  try{ var _df=await awDetailCF(token, loc, map, (opts&&opts.detail)); if(_df.length) base.customFields=(base.customFields||[]).concat(_df); }catch(e){}
  var up=await upsertOrUpdateContact(token, loc, contactId, base);
  var cid=(up.contact&&up.contact.id)||up.id||contactId||'';
  var pdfRes; if (opts && opts.pdf && cid) pdfRes = await storeGeneratedPdf(loc, cid, 'lpa');
  await applyTags(token, loc, cid, 'lpa', state);
  await awSyncOpportunity(token, loc, cid, 'lpa', (opts && opts.step) || '', state);
  return { contactId: cid, saved: _lcf.length>0, pdf: pdfRes };
}
// Generate the funnel's PDF (will or toolbox summary) from the contact's saved state and store it onto a FILE_UPLOAD field so the advisor sees it in GHL.
async function uploadPdfToContact(token, loc, map, contactId, fieldName, fname, buf){
  var fid = map[fieldName.toLowerCase()];
  if (!fid){ var cf = await ghl('POST','/locations/'+loc+'/customFields',token,{ name:fieldName, dataType:'FILE_UPLOAD', model:'contact' }); var nf=cf.customField||cf; if(nf&&nf.id){ fid=nf.id; map[fieldName.toLowerCase()]=fid; } }
  if (!fid) return { ok:false, err:'no field id for '+fieldName };
  var fileId = crypto.randomBytes(8).toString('hex');
  var form = new FormData();
  form.append('id', contactId); form.append('maxFiles','1');
  form.append(fid + '_' + fileId, new Blob([buf], { type:'application/pdf' }), fname);
  var r = await fetch(GHL_BASE + '/locations/' + loc + '/customFields/upload', { method:'POST', headers:{ Authorization:'Bearer '+token, Version:GHL_VERSION, Accept:'application/json' }, body:form });
  var t = await r.text();
  if (!r.ok) return { ok:false, err:'upload '+r.status+' '+t.slice(0,200) };
  var json; try { json = JSON.parse(t); } catch(e){ json = null; }
  var fileUrl=''; try { if (json && json.uploadedFiles){ fileUrl = json.uploadedFiles[fname] || (Object.keys(json.uploadedFiles).map(function(k){return json.uploadedFiles[k];})[0]) || ''; } if (!fileUrl && json && Array.isArray(json.meta) && json.meta[0]) fileUrl = json.meta[0].url || ''; } catch(e){}
  var linked = await mirrorFileLink(token, loc, map, contactId, fieldName, fileUrl);
  return { ok:true, field:fieldName, bytes:buf.length, url:fileUrl, link:!!linked };
}
async function storeGeneratedPdf(loc, contactId, funnel){
  try {
    if (!loc || !contactId) return { skip:'no id' };
    var token = await getWriteToken(loc);
    var out = await loadState(loc, contactId, funnel);
    if (!out.state) return { skip:'no state' };
    var company=''; try { var cv = await getCustomValuesMap(loc, token); company = cv['company_name'] || ''; } catch(e){}
    var wp = require('./will-pdf');
    var brand = { company_name: company };
    var map = await etbFieldMap(token, loc);
    if (funnel==='lpa'){
      try {
        var outs = await wp.buildLpaOfficial(out.state, brand); // guide + LP1F/LP1H (throws if pdf-lib/blank forms missing)
        var res=[]; for (var i=0;i<outs.length;i++){ res.push(await uploadPdfToContact(token, loc, map, contactId, outs[i].field, outs[i].fname, outs[i].bytes)); }
        return { ok:true, official:true, docs:res };
      } catch(e){
        var gbuf = await wp.buildLpaPdf(out.state, brand); // fallback summary pack until pdf-lib + blanks are live
        var one = await uploadPdfToContact(token, loc, map, contactId, 'LPA Application PDF', 'lpa-application.pdf', gbuf);
        one.fallback = String(e&&e.message||e).slice(0,90);
        return one;
      }
    }
    var buf, fieldName, fname;
    if (funnel==='wills'){ buf = await wp.buildWillPdf(wp.normalizeWill(out.state), brand); fieldName='Will PDF'; fname='will.pdf'; }
    else { buf = await wp.buildEtbPdf(out.state, brand); fieldName='ETB Summary PDF'; fname='toolbox-summary.pdf'; }
    return await uploadPdfToContact(token, loc, map, contactId, fieldName, fname, buf);
  } catch(e){ return { ok:false, err:String(e&&e.message||e) }; }
}
// GHL /contacts/upsert rejects an `id` (422 "property id should not exist"). Update a KNOWN contact with PUT /contacts/{id}; only upsert (match by email) when creating.
async function upsertOrUpdateContact(token, loc, contactId, base){
  if (contactId){
    try {
      return await ghl('PUT', '/contacts/' + contactId, token, base);
    } catch(e){
      // Sub-accounts can be set to refuse duplicate contacts. Someone who starts anonymously gets a
      // contact of their own, then types an email that already belongs to an older record, and GHL
      // rejects the update outright - which lost the whole save, including the document. The email is
      // the person, so adopt the record it points at and carry on with that one.
      const msg = String(e && e.message || '');
      if (!/duplicat/i.test(msg)) throw e;
      let existing = '';
      try { const m = msg.match(/"contactId"\s*:\s*"([A-Za-z0-9]+)"/); if (m) existing = m[1]; } catch(_){}
      if (!existing || existing === contactId) throw e;
      console.error('upsert: ' + contactId + ' clashed on a duplicate, continuing on ' + existing);
      const merged = Object.assign({}, base);
      // Do not try to move identity fields onto the record we are adopting; they are already its own.
      delete merged.email; delete merged.phone;
      const r = await ghl('PUT', '/contacts/' + existing, token, merged);
      return (r && (r.contact || r.id)) ? r : { contact: { id: existing } };
    }
  }
  const email = String(base.email || '').trim();
  if (!email){
    // No email means no way to tell this person from anyone else, so do not try to match.
    return await ghl('POST', '/contacts/upsert', token, Object.assign({ locationId: loc }, base));
  }
  const ident = Object.assign({ locationId: loc }, base);
  delete ident.phone;
  const created = await ghl('POST', '/contacts/upsert', token, ident);
  const newId = (created && created.contact && created.contact.id) || (created && created.id) || '';
  const phone = String(base.phone || '').trim();
  if (newId && phone){
    try { await ghl('PUT', '/contacts/' + newId, token, { phone: phone }); }
    catch(err){
      // The phone is already someone else's. Their record is not ours to take, so the
      // answers stay on this contact and the number simply is not copied across.
      console.error('contact ' + newId + ': kept the phone off, it belongs to another contact (' + String(err && err.message || '').slice(0, 120) + ')');
    }
  }
  return created;
}
async function findContactByEmail(loc, email){
  try {
    const token = await getWriteToken(loc);
    const r = await ghl('GET', '/contacts/search/duplicate?locationId='+loc+'&email='+encodeURIComponent(email), token);
    return r.contact || (r.contacts && r.contacts[0]) || null;
  } catch(e){ return null; }
}
async function findContactByPhone(loc, phone){
  try {
    const token = await getWriteToken(loc);
    const num = String(phone||'').replace(/[^0-9+]/g,'');
    const r = await ghl('GET', '/contacts/search/duplicate?locationId='+loc+'&number='+encodeURIComponent(num), token);
    return r.contact || (r.contacts && r.contacts[0]) || null;
  } catch(e){ return null; }
}
async function getCustomValuesMap(locationId, token){
  const byName = {};
  // GHL first (legacy accounts still hold config there), but never fatal.
  try {
    const ex = await ghl('GET', '/locations/' + locationId + '/customValues', token);
    const list = ex.customValues || ex.customValue || [];
    list.forEach(function(cv){ byName[(cv.name || '').toLowerCase()] = cv.value; });
  } catch(e){ console.error('getCustomValuesMap ghl', e.message); }
  // Our per-location store WINS. This is where the onboarding/scraper tool writes and where
  // /api/brand reads, so checkout must agree with the price the customer was shown.
  try {
    const stored = brandStoreGet(locationId);
    if (stored) Object.keys(stored).forEach(function(k){
      const v = stored[k];
      if (v != null && v !== '') byName[String(k).toLowerCase()] = v;
    });
  } catch(e){ console.error('getCustomValuesMap store', e.message); }
  return byName;
}

/* ---------- server ---------- */
function send(res, code, obj){ if (res.headersSent) { try { res.end(); } catch(_){} return; } res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function readBody(req){ return new Promise(resolve => { let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); }); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.pdf': 'application/pdf' };

const server = http.createServer(async (req, res) => {
  try {
    const pathOnly = req.url.split('?')[0];
    if (req.method === 'GET' && pathOnly === '/oauth/start'){
      if (!process.env.GHL_CLIENT_ID) return send(res, 400, { error: 'GHL_CLIENT_ID not set' });
      const u = 'https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=' + encodeURIComponent(REDIRECT_URI) + '&client_id=' + encodeURIComponent(process.env.GHL_CLIENT_ID) + '&scope=' + encodeURIComponent(GHL_SCOPES_LOCATION);
      res.writeHead(302, { Location: u }); return res.end();
    }
    if (req.method === 'GET' && pathOnly === '/oauth/start-agency'){
      if (!process.env.GHL_CLIENT_ID) return send(res, 400, { error: 'GHL_CLIENT_ID not set' });
      const u = 'https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=' + encodeURIComponent(REDIRECT_URI) + '&client_id=' + encodeURIComponent(process.env.GHL_CLIENT_ID) + '&scope=' + encodeURIComponent(GHL_SCOPES) + '&state=agency';
      res.writeHead(302, { Location: u }); return res.end();
    }
    if (req.method === 'GET' && pathOnly === '/oauth/agency-status'){
      const s = loadStore(); const c = s.company || null;
      return send(res, 200, { agencyInstalled: !!(c && c.refresh_token), companyId: (c && c.companyId) || '', agencyExpiresAt: (c && c.expires_at) || 0, mintedLocations: Object.keys(s.locations || {}) });
    }
    if (req.method === 'GET' && pathOnly === '/oauth/mint-test'){
      const locId = (new URL(req.url, 'http://x')).searchParams.get('locationId') || '';
      if (!locId) return send(res, 400, { error: 'pass ?locationId=' });
      try { await mintLocationToken(locId); const s = loadStore(); const rec = s.locations[locId] || {}; return send(res, 200, { ok: true, locationId: locId, viaAgency: !!rec.viaAgency, expiresAt: rec.expires_at || 0 }); }
      catch(e){ return send(res, 500, { ok: false, locationId: locId, error: e.message }); }
    }
    if (req.method === 'GET' && pathOnly === '/oauth/callback'){
      const _cbu = new URL(req.url, 'http://x');
      const code = _cbu.searchParams.get('code');
      const _state = _cbu.searchParams.get('state') || '';
      if (!code){ res.writeHead(400, { 'Content-Type': 'text/html' }); return res.end('Missing code'); }
      try {
        if (_state === 'agency'){ const c = await exchangeCodeAgency(code); res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<h2>Agency connected.</h2><p>companyId ' + (c.companyId || '') + '. Location tokens now mint automatically for every sub-account, no per-account authorising. You can close this tab.</p>'); }
        const t = await exchangeCode(code); res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<h2>Sub-account connected.</h2><p>locationId ' + (t.locationId || '') + '. You can close this tab.</p>');
      }
      catch(e){ res.writeHead(500, { 'Content-Type': 'text/html' }); return res.end('OAuth failed: ' + e.message); }
    }
    if (req.method === 'GET' && (pathOnly === '/engine.js' || pathOnly === '/api/engine')){
      // /api/engine is the cross-origin-safe path: the host blocks cross-domain .js requests (503),
      // but non-.js paths under /api/ pass (same as /api/brand). The GHL loader uses /api/engine.
      res.setHeader('Access-Control-Allow-Origin','*');
      try { const ejs = fs.readFileSync(path.join(__dirname,'public','engine.js')); res.writeHead(200, { 'Content-Type':'text/javascript', 'Cache-Control':'public, max-age=300' }); return res.end(ejs); }
      catch(e){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('engine not found'); }
    }
    if (req.method === 'GET' && pathOnly === '/api/engine-dev'){
      try { const ejs = fs.readFileSync(path.join(__dirname,'public','engine-dev.js')); res.writeHead(200, { 'Content-Type':'text/javascript', 'Cache-Control':'no-store' }); return res.end(ejs); }
      catch(e){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('engine-dev not found'); }
    }
    if (req.method === 'GET' && pathOnly === '/api/locations'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const q=(new URL(req.url,'http://x')).searchParams.get('q')||'';
        const comp=await getCompanyToken();
        const r=await fetch(GHL_BASE+'/locations/search?companyId='+encodeURIComponent(comp.companyId)+'&limit=200'+(q?('&query='+encodeURIComponent(q)):''), { headers:{ Authorization:'Bearer '+comp.access_token, Version:GHL_VERSION, Accept:'application/json' } });
        const t=await r.text(); let j; try{ j=JSON.parse(t); }catch(e){ j={}; }
        if(!r.ok) return send(res,200,{error:'GHL '+r.status,body:t.slice(0,200)});
        const locs=(j.locations||[]).map(function(l){ return { id:l.id||l._id, name:l.name }; });
        return send(res,200,{ count:locs.length, locations:locs });
      } catch(e){ return send(res,500,{error:e.message}); }
    }
    if (req.method === 'GET' && pathOnly === '/api/brand'){
      res.setHeader('Access-Control-Allow-Origin','*');
      const locId = ((new URL(req.url,'http://x')).searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
      if (!locId){ res.writeHead(400, { 'Content-Type':'application/json' }); return res.end('{}'); }
      try {
        const byName = {};
        const stored = brandStoreGet(locId);
        if (stored && Object.keys(stored).length){
          // Brand lives in OUR store, not GHL - snapshot pushes can't touch it.
          Object.keys(stored).forEach(function(k){ byName[k.toLowerCase()] = stored[k]; });
        } else {
          // Not migrated yet: read GHL once and seed the store so future pushes can't overwrite it.
          const btoken = await getWriteToken(locId);
          const ex = await ghl('GET','/locations/'+locId+'/customValues', btoken);
          const cvs = ex.customValues || ex.customValue || [];
          const seed = {};
          cvs.forEach(function(cv){ byName[(cv.name||'').toLowerCase()] = cv.value; if(cv.name) seed[cv.name]=cv.value; });
          try{ if(Object.keys(seed).length) brandStorePut(locId, seed); }catch(e){}
        }
        const MAP = {company_name:'company_name',logo_url:'client_logo_url',primary_color:'client_primary_color',heading_color:'client_heading_color',body_color:'client_body_color',icon_color:'client_icon_color',header_bg_color:'header_bg_color',page_bg_color:'page_bg_color',heading_font:'client_heading_font',body_font:'client_body_font',site_max_width:'site_max_width',footer_max_width:'footer_max_width',nav_font_size:'nav_font_size',body_font_size:'body_font_size',logo_height:'logo_height',phone:'footer_phone',email:'company_email',address:'company_address',facebook_url:'facebook_link',instagram_url:'instagram_link',privacy_url:'privacy_url',terms_url:'terms_url',consent_label:'consent_label',marketing_label:'marketing_label',will_price:'will_price',lpa_price:'lpa_price',etb_price:'etb_price',stripe_account_id:'stripe_account_id',commission_flat:'commission_flat',commission_percent:'commission_percent',legal_footer:'legal_footer',nav_menu_json:'nav_menu_json',footer_menu_json:'footer_menu_json',nav_text_color:'nav_text_color',heading_font_size:'heading_font_size',heading_weight:'heading_weight',nav_weight:'nav_weight',button_weight:'button_weight',button_color:'button_color',button_hover_color:'button_hover_color',button_text_color:'button_text_color',button_secondary_color:'button_secondary_color',button_secondary_text_color:'button_secondary_text_color',button_font:'button_font',button_radius:'button_radius',footer_bg_color:'footer_bg_color',footer_text_color:'footer_text_color',linkedin_url:'linkedin_link',twitter_url:'twitter_link',youtube_url:'youtube_link',tiktok_url:'tiktok_link',font_css_links:'font_css_links',wills_url:'wills_url',lpa_url:'lpa_url',etb_url:'etb_url',wills_title:'wills_title',wills_blurb:'wills_blurb',lpa_title:'lpa_title',lpa_blurb:'lpa_blurb',etb_title:'etb_title',etb_blurb:'etb_blurb',probate_url:'probate_url',probate_title:'probate_title',probate_blurb:'probate_blurb',plan_services:'plan_services',referral_lead_tag:'referral_lead_tag',referral_title:'referral_title',referral_thanks_title:'referral_thanks_title',referral_thanks_text:'referral_thanks_text',referral_submit_label:'referral_submit_label',probate_quote_rules_json:'probate_quote_rules_json',quote_title:'quote_title',quote_note:'quote_note',quote_cta_label:'quote_cta_label',quote_cta_url:'quote_cta_url'};
        const brand = {}; Object.keys(MAP).forEach(function(k){ const v = byName[MAP[k].toLowerCase()]; if (v != null) brand[k] = v; });
        res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'public, max-age=60' }); return res.end(JSON.stringify(brand));
      } catch(e){ res.writeHead(200, { 'Content-Type':'application/json' }); const dbg=(new URL(req.url,'http://x')).searchParams.get('debug'); return res.end(dbg ? JSON.stringify({_err:String((e&&e.message)||e)}) : '{}'); }
    }
    // ----- payment: create a Stripe Checkout session (central AI Wills Stripe) -----
    // ----- service URLs self-register from the real funnel page (needs no extra GHL permission) -----
    if (req.method === 'POST' && pathOnly === '/api/register-url'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const rb = JSON.parse((await readBody(req)) || '{}');
        const rloc = String(rb.locationId || '').replace(/[^A-Za-z0-9]/g,'');
        const rkey = String(rb.key || '').toLowerCase();
        if (!rloc || ['wills','lpa','etb','probate'].indexOf(rkey) < 0) return send(res, 400, { error: 'bad request' });
        let ru; try { ru = new URL(String(rb.url || '')); } catch(e){ return send(res, 400, { error: 'bad url' }); }
        if (ru.protocol !== 'https:') return send(res, 200, { ok:true, stored:false, reason:'not https' });
        const rhost = ru.hostname.toLowerCase();
        // Never record our own test harness, and only trust hosts we recognise as funnel hosts.
        if (rhost === 'engine.aiwills.co.uk' || rhost === 'aiwills.digilyse.co') return send(res, 200, { ok:true, stored:false, reason:'own domain' });
        // Firms publish on their own domain as often as on a subdomain of ours, so the host is no
        // longer restricted to aiwills.co.uk - that refused a live client's own pages. The control
        // that matters is below: this only ever fills a gap and can never overwrite a real URL.
        if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(rhost) || rhost.indexOf('.') < 0) return send(res, 200, { ok:true, stored:false, reason:'not a public host' });
        if (/\/(preview|page-builder|funnel-builder)\//i.test(ru.pathname)) return send(res, 200, { ok:true, stored:false, reason:'builder or preview url' });
        if (/-test\.html$/i.test(ru.pathname)) return send(res, 200, { ok:true, stored:false, reason:'test harness page' });
        // Only ever fill a gap, and never create a partial store: /api/brand treats a non-empty store as
        // the whole config, so writing one stray key would wipe that account's branding.
        const rcur = brandStoreGet(rloc);
        if (!rcur || !Object.keys(rcur).length) return send(res, 200, { ok:true, stored:false, reason:'no config yet' });
        const rfield = rkey + '_url';
        const rexisting = String(rcur[rfield] || '').trim();
        // A placeholder is anything still pointing at our own shared test harness, on EITHER of our
        // domains, or any *-test.html page. Those must be healed; a real client URL must never be.
        let rexHost = '', rexPath = '';
        try { const rx = new URL(rexisting); rexHost = rx.hostname.toLowerCase(); rexPath = rx.pathname || ''; } catch(e){}
        const rOurs = (rexHost === 'engine.aiwills.co.uk' || rexHost === 'aiwills.digilyse.co');
        const rIsPlaceholder = !rexisting || rOurs || /-test\.html$/i.test(rexPath);
        if (!rIsPlaceholder) return send(res, 200, { ok:true, stored:false, reason:'already set' });
        const rclean = ru.origin + ru.pathname;
        if (rexisting === rclean) return send(res, 200, { ok:true, stored:false, reason:'unchanged' });
        rcur[rfield] = rclean;
        rcur[rfield + '_source'] = rhost + ' @ ' + new Date().toISOString();
        brandStorePut(rloc, rcur);
        console.error('register-url: stored ' + rfield + '=' + rclean + ' for ' + rloc + ' from ' + rhost);
        return send(res, 200, { ok:true, stored:true, url:rclean });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'GET' && pathOnly === '/api/faq'){
      // Shared FAQ content (same for every client) - served once, cached by the browser.
      try {
        const fp = path.join(__dirname, 'public', 'faq.json');
        const body = fs.readFileSync(fp);
        res.writeHead(200, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'public, max-age=3600', 'Access-Control-Allow-Origin':'*' });
        return res.end(body);
      } catch(e){ return send(res, 200, { faq:{}, glossary:[] }); }
    }
    if (req.method === 'GET' && pathOnly === '/api/hub-status'){
      res.setHeader('Access-Control-Allow-Origin','*');
      const hu=new URL(req.url,'http://x'); const hloc=(hu.searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,''); const hcid=(hu.searchParams.get('contactId')||'').replace(/[^A-Za-z0-9]/g,'');
      if(!hloc||!hcid) return send(res,400,{error:'locationId and contactId required'});
      /* This used to answer for any contact id at all, so an old hub link kept greeting someone by
         name months later and looked exactly like never being logged out. Someone's progress is
         their business: prove it is them. */
      const hclaims = verifyEdit(hu.searchParams.get('t') || '');
      if (!hclaims || hclaims.kind !== 'session' || authIsSpent(hclaims.jti) || String(hclaims.cid) !== String(hcid) || String(hclaims.loc) !== String(hloc)){
        return send(res, 403, { error: 'no session', message: 'Sign in to see your progress.' });
      }
      try{
        const ht=await getWriteToken(hloc);
        const got=await ghl('GET','/contacts/'+hcid, ht); const c=got.contact||got;
        const byId={}; (c.customFields||c.customField||[]).forEach(function(f){ byId[f.id]=(f.value!=null?f.value:f.fieldValue); });
        const defs=await ghlContactFields(ht, hloc); const byName={}; defs.forEach(function(d){ byName[(d.name||'').toLowerCase()]=d.id; });
        const has=function(n){ var id=byName[n.toLowerCase()]; var v=id?byId[id]:''; return !!(v&&String(v).trim()); };
        const tags=(c.tags||[]).map(function(t){return String(t).toLowerCase();});
        const services={ wills:{ started:has('Will State Json'), paid: tags.indexOf('ai-will-paid')>=0 }, lpa:{ started:has('LPA State Json'), paid:false }, etb:{ started:has('ETB State Json'), paid: tags.indexOf('etb-active')>=0 }, probate:{ started:has('Probate State Json'), paid:false } };
        return send(res,200,{ ok:true, services });
      }catch(e){ return send(res,500,{error:e.message}); }
    }
    if (req.method === 'POST' && pathOnly === '/api/checkout'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        // the per-firm key is checked once its config is loaded, a few lines down
        const cbody = JSON.parse((await readBody(req)) || '{}');
        const loc = (cbody.locationId || '').replace(/[^A-Za-z0-9]/g,'');
        if (!loc) return send(res, 400, { error: 'locationId is required' });
        const token = await getWriteToken(loc);
        const cv = await getCustomValuesMap(loc, token);
        if (!awStripeKey(cv)) return send(res, 500, { error: awStripeMode(cv) === 'test' ? 'This client is set to test mode but no Stripe test key is configured on the server.' : 'Stripe is not configured on the server.' });
        // The LPA funnel sells LPAs on their own, so it is priced off lpa_price and never needs a will price.
        const kind = String(cbody.kind || 'wills').toLowerCase();
        const isLpaOnly = (kind === 'lpa');
        const wpP = pence(cv['will_price']);
        const lpP = pence(cv['lpa_price']);
        if (isLpaOnly){ if (!lpP || lpP < 100) return send(res, 400, { error: 'lpa_price is not set for this location' }); }
        else if (!wpP || wpP < 100) return send(res, 400, { error: 'will_price is not set for this location' });
        // Bundle pricing only when the funnel opts in (pricingV>=2). Legacy engines get single-will pricing, so stable clients are unaffected until promoted.
        const wj = cbody.willJson || {};
        const pt = wj.partner || {}, al = wj.addlpa || {};
        const bundleOn = Number(cbody.pricingV || 0) >= 2;
        const willQty = isLpaOnly ? 0 : ((bundleOn && pt.hasPartner === 'Yes' && pt.mirrorWill === 'Yes') ? 2 : 1);
        let lpaTypes = 0; if (bundleOn) { const want = String(al.want || ''); lpaTypes = /both/i.test(want) ? 2 : (/financial|property|welfare|health/i.test(want) ? 1 : 0); }
        const lpaQty = isLpaOnly
          ? (/both/i.test(String((wj.lpa_type || {}).type || '')) ? 2 : 1)
          : ((bundleOn && lpP > 0) ? (lpaTypes * willQty) : 0);
        const amount = wpP * willQty + lpP * lpaQty;
        // Last gate before money: refuse anything that is not a positive whole number of pence,
        // and say which firm and which setting, rather than sending Stripe a nonsense figure.
        if (!Number.isInteger(amount) || amount < 100){
          console.error('checkout: bad amount for ' + loc + ' (will_price=' + JSON.stringify(cv['will_price']) + ', lpa_price=' + JSON.stringify(cv['lpa_price']) + ', willQty=' + willQty + ', lpaQty=' + lpaQty + ')');
          return send(res, 400, { error: 'The prices for this firm are not set correctly, so payment cannot start. Please check the will and LPA prices.' });
        }
        const company = cv['company_name'] || 'AI Wills';
        const person = (cbody.willJson && (isLpaOnly ? cbody.willJson.your_details : cbody.willJson.personal)) || cbody.contact || {};
        let contactId = cbody.contactId || '';
        try {
          const up = await ghl('POST', '/contacts/upsert', token, { locationId: loc, firstName: person.firstName || '', lastName: person.lastName || '', email: person.email || '', phone: person.phone || '' });
          contactId = (up.contact && up.contact.id) || up.id || contactId;
        } catch(e){ console.error('lead upsert', e.message); }
        const id = crypto.randomBytes(16).toString('hex');
        willStorePut(id, { willJson: cbody.willJson || {}, paid: false, locationId: loc, contactId: contactId, company: company, willQty: willQty, lpaQty: lpaQty, createdAt: Date.now() });
        const ret = cbody.returnUrl || ('https://' + (req.headers.host || 'aiwills.digilyse.co'));
        const sep = ret.indexOf('?') >= 0 ? '&' : '?';
        const sparams = {
          'mode': 'payment',
          'success_url': ret + sep + 'aw_paid=1&aw_id=' + id,
          'cancel_url': ret + sep + 'aw_paid=0',
          'line_items[0][quantity]': isLpaOnly ? lpaQty : willQty,
          'line_items[0][price_data][currency]': 'gbp',
          'line_items[0][price_data][unit_amount]': isLpaOnly ? lpP : wpP,
          'line_items[0][price_data][product_data][name]': (isLpaOnly ? 'Lasting Power of Attorney' : (willQty > 1 ? 'Mirror wills' : 'Will document')) + ' (' + company + ')',
          'metadata[aw_id]': id,
          'metadata[locationId]': loc,
          'metadata[contactId]': contactId,
          'metadata[will_qty]': String(willQty),
          'metadata[lpa_qty]': String(lpaQty),
          'customer_email': person.email || ''
        };
        if (lpaQty > 0 && !isLpaOnly) {
          sparams['line_items[1][quantity]'] = lpaQty;
          sparams['line_items[1][price_data][currency]'] = 'gbp';
          sparams['line_items[1][price_data][unit_amount]'] = lpP;
          sparams['line_items[1][price_data][product_data][name]'] = 'Lasting Power of Attorney (' + company + ')';
        }
        // Connect payout split: when this firm has a connected Stripe account, the payment is made
        // ON the firm's account (their name on the statement, money lands with them) and the
        // Ai-Wills commission is taken automatically as a flat fee per document sold.
        const cxAcct = String(cv['stripe_account_id'] || '').trim();
        let cxRouted = false;
        if (awStripeMode(cv) === 'live' && /^acct_[A-Za-z0-9]+$/.test(cxAcct)) {
          // test mode: rehearse the journey, do not attempt a payout to a live account
          const feePerDoc = pence(cv['commission_flat']);
          let fee = feePerDoc * (willQty + lpaQty);
          if (fee >= amount) fee = 0; // never let the fee eat the whole payment; misconfig = no fee, log it
          if (feePerDoc > 0 && fee === 0) console.error('checkout: commission_flat >= amount for ' + loc + ', fee skipped');
          sparams['payment_intent_data[transfer_data][destination]'] = cxAcct;
          sparams['payment_intent_data[on_behalf_of]'] = cxAcct;
          if (fee > 0) sparams['payment_intent_data[application_fee_amount]'] = fee;
          cxRouted = true;
        }
        const sess = await stripeReq('POST', '/v1/checkout/sessions', sparams, awStripeKey(cv));
        return send(res, 200, { url: sess.url, id: id, routed: cxRouted });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- payment: ETB subscription checkout (central AI Wills Stripe, subscription mode) -----
    if (req.method === 'POST' && pathOnly === '/api/etb-checkout'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        // the per-firm key is checked once its config is loaded, a few lines down
        const cbody = JSON.parse((await readBody(req)) || '{}');
        const loc = (cbody.locationId || '').replace(/[^A-Za-z0-9]/g,'');
        if (!loc) return send(res, 400, { error: 'locationId is required' });
        const token = await getWriteToken(loc);
        const cv = await getCustomValuesMap(loc, token);
        if (!awStripeKey(cv)) return send(res, 500, { error: awStripeMode(cv) === 'test' ? 'This client is set to test mode but no Stripe test key is configured on the server.' : 'Stripe is not configured on the server.' });
        // Price is config-not-code: etb_price_id (a real Stripe price) wins if set; otherwise the
        // yearly subscription is built on the fly from the etb_price value (e.g. "19.99"), the same
        // pattern as will_price. No hardcoded account-specific fallbacks.
        const price = cv['etb_price_id'] || process.env.ETB_PRICE_ID || '';
        const etbAmt = pence(cv['etb_price']);
        if (!Number.isInteger(etbAmt) || etbAmt < 100){
          console.error('etb-checkout: bad amount for ' + loc + ' (etb_price=' + JSON.stringify(cv['etb_price']) + ')');
          return send(res, 400, { error: 'The Executor Toolbox price for this firm is not set correctly, so payment cannot start.' });
        }
        if (!price && !(etbAmt >= 100)) return send(res, 400, { error: 'Set an Executor Toolbox price (etb_price) or etb_price_id for this location' });
        const person = cbody.contact || {};
        let contactId = cbody.contactId || '';
        try {
          const up = await ghl('POST', '/contacts/upsert', token, { locationId: loc, firstName: person.firstName || '', lastName: person.lastName || '', email: person.email || '', phone: person.phone || '' });
          contactId = (up.contact && up.contact.id) || up.id || contactId;
        } catch(e){ console.error('etb lead upsert', e.message); }
        const ret = cbody.returnUrl || ('https://' + (req.headers.host || 'aiwills.digilyse.co'));
        const sep = ret.indexOf('?') >= 0 ? '&' : '?';
        const eparams = {
          'mode': 'subscription',
          'success_url': ret + sep + 'aw_etb_paid=1',
          'cancel_url': ret + sep + 'aw_etb_paid=0',
          'line_items[0][quantity]': 1,
          'metadata[kind]': 'etb',
          'metadata[locationId]': loc,
          'metadata[contactId]': contactId,
          'subscription_data[metadata][kind]': 'etb',
          'subscription_data[metadata][locationId]': loc,
          'subscription_data[metadata][contactId]': contactId,
          'customer_email': person.email || ''
        };
        if (price) { eparams['line_items[0][price]'] = price; }
        else {
          eparams['line_items[0][price_data][currency]'] = 'gbp';
          eparams['line_items[0][price_data][unit_amount]'] = etbAmt;
          eparams['line_items[0][price_data][recurring][interval]'] = 'year';
          eparams['line_items[0][price_data][product_data][name]'] = 'Executor Toolbox (' + (cv['company_name'] || 'AI Wills') + ')';
        }
        // Connect payout split: subscription revenue lands with the firm, the Ai-Wills commission
        // is taken as a percentage of every renewal automatically.
        const eAcct = String(cv['stripe_account_id'] || '').trim();
        let eRouted = false;
        if (awStripeMode(cv) === 'live' && /^acct_[A-Za-z0-9]+$/.test(eAcct)) {
          // test mode: rehearse the journey, do not attempt a payout to a live account
          const pct = num(cv['commission_percent']);
          eparams['subscription_data[transfer_data][destination]'] = eAcct;
          eparams['subscription_data[on_behalf_of]'] = eAcct;
          if (pct > 0 && pct < 100) eparams['subscription_data[application_fee_percent]'] = pct;
          eRouted = true;
        }
        const sess = await stripeReq('POST', '/v1/checkout/sessions', eparams, awStripeKey(cv));
        return send(res, 200, { url: sess.url, contactId: contactId, routed: eRouted });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- payment: Stripe webhook (marks the will paid, tags the GHL contact) -----
    if (req.method === 'POST' && pathOnly === '/api/stripe-webhook'){
      const raw = await readBody(req);
      if (!awVerifyStripeHook(raw, req.headers['stripe-signature'])){
        res.writeHead(400, { 'Content-Type':'text/plain' }); return res.end('signature check failed');
      }
      let evt; try { evt = JSON.parse(raw); } catch(e){ res.writeHead(400); return res.end('bad json'); }
      if (evt.type === 'checkout.session.completed'){
        const md = (evt.data && evt.data.object && evt.data.object.metadata) || {};
        if (md.aw_id){ const rec = willStoreGet(md.aw_id); if (rec){ rec.paid = true; rec.paidAt = Date.now(); willStorePut(md.aw_id, rec); } }
        if (md.locationId && md.contactId){
          // Tag what they actually bought. A will and an LPA can be in the same basket, so one
          // shared "paid" tag would leave the firm unable to tell the two jobs apart.
          const tags = [];
          if (md.kind === 'etb') tags.push('etb-active');
          else {
            const wq = parseInt(md.will_qty, 10), lq = parseInt(md.lpa_qty, 10);
            if (wq > 0) tags.push('ai-will-paid');
            if (lq > 0) tags.push('ai-lpa-paid');
            if (!tags.length) tags.push('ai-will-paid');   // older sessions carry no quantities
          }
          (async function(){
            try { const t = await getWriteToken(md.locationId); await ghl('POST', '/contacts/' + md.contactId + '/tags', t, { tags: tags }); }
            catch(e){ console.error('paid tag', e.message); }
          })();
        }
      }
      res.writeHead(200, { 'Content-Type':'application/json' }); return res.end('{"received":true}');
    }
    // ----- auto-deploy: GitHub push webhook -> pull the repo + redeploy this app -----
    if (req.method === 'POST' && pathOnly === '/api/git-deploy'){
      const raw = await readBody(req);
      const secret = process.env.GIT_DEPLOY_SECRET || '';
      const sig = String(req.headers['x-hub-signature-256'] || '');
      let good = false;
      if (secret && sig){
        try {
          const want = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
          const a = Buffer.from(want), b = Buffer.from(sig);
          good = (a.length === b.length) && crypto.timingSafeEqual(a, b);
        } catch(_){ good = false; }
      }
      if (!good){ res.writeHead(401, { 'Content-Type':'text/plain' }); return res.end('bad signature'); }
      let ref = ''; try { ref = (JSON.parse(raw) || {}).ref || ''; } catch(_){}
      if (ref && ref !== 'refs/heads/main'){ res.writeHead(200, { 'Content-Type':'application/json' }); return res.end('{"skipped":"non-main"}'); }
      const repo = process.env.GIT_REPO_DIR || '/home/digiiics/repositories/aiwills-funnel';
      const key = process.env.GIT_SSH_KEY || '/home/digiiics/.ssh/id_rsa';
      const dest = __dirname;
      // Hard-sync the clone (ff-only silently aborts the whole chain if the clone ever diverges),
      // copy static + server files, then restart. Write a status file we can read to confirm.
      const cmd = "cd " + repo
        + " && GIT_SSH_COMMAND='ssh -i " + key + " -o StrictHostKeyChecking=no' git fetch --all --prune"
        + " && git reset --hard origin/main"
        + " && node --check server.js && node --check will-pdf.js && node --check public/engine.js && node --check public/engine-dev.js"
        + " && /bin/mkdir -p " + dest + "/_prev"
        + " && ( /bin/cp -f " + dest + "/server.js " + dest + "/_prev/server.js || true )"
        + " && ( /bin/cp -f " + dest + "/will-pdf.js " + dest + "/_prev/will-pdf.js || true )"
        + " && ( /bin/cp -f " + dest + "/public/engine.js " + dest + "/_prev/engine.js || true )"
        + " && /bin/cp -R public/. " + dest + "/public/"
        + " && /bin/cp -f server.js will-pdf.js package.json " + dest + "/"
        + " && /bin/mkdir -p " + dest + "/tmp && /bin/touch " + dest + "/tmp/restart.txt"
        + " && git rev-parse --short HEAD";
      const statusFile = dest + '/public/_deploy_status.txt';
      require('child_process').exec(cmd, { timeout: 90000 }, function(err, stdout, stderr){
        var when = new Date().toISOString();
        var line = err ? ('FAIL ' + when + ' ' + String(err.message||'').slice(0,140) + ' | ' + String(stderr||'').slice(-200))
                       : ('OK ' + when + ' head=' + String(stdout||'').trim().split('\n').pop());
        try { require('fs').writeFileSync(statusFile, line + '\n'); } catch(_){}
        if (err) console.error('git-deploy FAILED:', err.message, String(stderr||'').slice(-300));
        else console.log('git-deploy ok:', String(stdout||'').slice(-200));
      });
      res.writeHead(202, { 'Content-Type':'application/json' }); return res.end('{"deploying":true}');
    }
    // ----- PDF: render the will from the stored data (paid only) -----
    if (req.method === 'GET' && pathOnly === '/api/pdf'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const pu = new URL(req.url, 'http://x');
        const pid = (pu.searchParams.get('id') || '').replace(/[^a-f0-9]/gi,'');
        const rec = pid ? willStoreGet(pid) : null;
        if (!rec) return send(res, 404, { error: 'not found' });
        if (!rec.paid && process.env.DEV_PDF_OPEN !== '1') return send(res, 402, { error: 'payment required' });
        const wp = require('./will-pdf');
        const willData = wp.normalizeWill ? wp.normalizeWill(rec.willJson || {}) : (rec.willJson || {});
        const buf = await wp.buildWillPdf(willData, { company_name: rec.company || '' });
        res.writeHead(200, { 'Content-Type':'application/pdf', 'Content-Disposition':'inline; filename="last-will.pdf"', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*' });
        return res.end(buf);
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- edit-mode downloads: real documents, token-gated (load state from GHL, generate) -----
    if (req.method === 'GET' && (pathOnly === '/api/will-pdf' || pathOnly === '/api/etb-pdf' || pathOnly === '/api/lpa-pdf')){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const tok=(new URL(req.url,'http://x')).searchParams.get('t')||'';
        const cl=verifyEdit(tok);
        if(!cl||!cl.loc||!cl.cid) return send(res, 403, { error: 'invalid or expired link' });
        const fn = (pathOnly === '/api/will-pdf') ? 'wills' : (pathOnly === '/api/lpa-pdf' ? 'lpa' : 'etb');
        const out = await loadState(cl.loc, cl.cid, fn);
        if(!out.state) return send(res, 404, { error: 'nothing saved yet' });
        let company=''; try { const cv=await getCustomValuesMap(cl.loc, await getWriteToken(cl.loc)); company=cv['company_name']||''; } catch(e){}
        const wp = require('./will-pdf');
        let buf, fname;
        if (fn==='wills'){ const wd = wp.normalizeWill(out.state); buf = await wp.buildWillPdf(wd, { company_name: company }); fname='your-will.pdf'; }
        else if (fn==='lpa'){ try { const lo=await wp.buildLpaOfficial(out.state,{ company_name: company }); const pick=lo.filter(function(o){return o.field!=='LPA Guide PDF';})[0]||lo[0]; buf=pick.bytes; fname=pick.fname; } catch(e){ buf = await wp.buildLpaPdf(out.state, { company_name: company }); fname='lpa-application.pdf'; } }
        else { buf = await wp.buildEtbPdf(out.state, { company_name: company }); fname='executor-toolbox-summary.pdf'; }
        res.writeHead(200, { 'Content-Type':'application/pdf', 'Content-Disposition':'inline; filename="'+fname+'"', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*' });
        return res.end(buf);
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- edit-mode: remove an uploaded document from a contact's file field, token-gated -----
    if (req.method === 'POST' && pathOnly === '/api/etb-file-remove'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const cl=verifyEdit(b.t||'');
        if(!cl||!cl.loc||!cl.cid) return send(res, 403, { error: 'invalid or expired link' });
        const fieldName=(b.field||'');
        const token=await getWriteToken(cl.loc);
        const map=await etbFieldMap(token, cl.loc);
        const fid=map[fieldName.toLowerCase()];
        if(!fid) return send(res, 400, { error: 'unknown field' });
        await ghl('PUT','/contacts/'+cl.cid,token,{ customFields:[{ id:fid, value:'' }] });
        return send(res, 200, { ok:true });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- Executor Toolbox: status / field-creation / save (public, called by the funnel) -----
    if (req.method === 'GET' && pathOnly === '/api/etb-status'){
      res.setHeader('Access-Control-Allow-Origin','*');
      const locId = ((new URL(req.url,'http://x')).searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
      try { return send(res, 200, await etbStatus(locId)); }
      catch(e){ return send(res, 200, { authorised:false, error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/etb-ensure-fields'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const token = await getWriteToken(loc); // throws if not authorised
        (async function(){ try { const r = await ensureEtbFields(token, loc); console.log('etb ensure', loc, 'created', r.created, 'of', r.total); } catch(e){ console.error('etb ensure', e.message); } })();
        return send(res, 202, { ensuring: true, locationId: loc });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/referral-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        return send(res, 200, await referralSave(loc, b.state||{}, b.contactId||'', b.key||'probate', b.status||'started', b.step||'', b.detail));
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/etb-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        return send(res, 200, await etbSave(loc, b.state||{}, b.contactId||'', b.status||'started', { pdf: !!b.pdf, step: b.step||'', detail: b.detail }));
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/etb-upload'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        return send(res, 200, await etbUpload(loc, b.contactId||'', b.fieldName||'', b.filename||'', b.mimeType||'', b.dataBase64||''));
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/will-preview'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        let company=''; try { if(loc){ const cv=await getCustomValuesMap(loc, await getWriteToken(loc)); company=cv['company_name']||''; } } catch(e){}
        const wp = require('./will-pdf');
        const buf = await wp.buildWillPdf(wp.normalizeWill(b.state||{}), { company_name: company });
        res.writeHead(200, { 'Content-Type':'application/pdf', 'Content-Disposition':'inline; filename="your-will.pdf"', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*' });
        return res.end(buf);
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/will-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const _wr = await willSave(loc, b.state||{}, b.contactId||'', { pdf: !!b.pdf, step: b.step||'', detail: b.detail });
        if(_wr && _wr.contactId){ try{ _wr.token = signEdit({ loc:loc, cid:_wr.contactId, exp:Date.now()+1000*60*60*24*30 }); }catch(e){} }
        return send(res, 200, _wr);
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'POST' && pathOnly === '/api/lpa-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const _lr = await lpaSave(loc, b.state||{}, b.contactId||'', { pdf: !!b.pdf, step: b.step||'', detail: b.detail });
        if(_lr && _lr.contactId){ try{ _lr.token = signEdit({ loc:loc, cid:_lr.contactId, exp:Date.now()+1000*60*60*24*30 }); }catch(e){} }
        return send(res, 200, _lr);
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Mint a per-contact hub magic-link (for a GHL workflow to store on the contact + email). key-gated in production.
    if (req.method === 'GET' && pathOnly === '/api/hub-link'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const u=new URL(req.url,'http://x');
        const loc=u.searchParams.get('locationId')||''; const cid=u.searchParams.get('contactId')||''; const key=u.searchParams.get('key')||'';
        const need=process.env.HUBLINK_SECRET||'';
        if(!need || key!==need) return send(res,403,{error:'bad key'});
        if(!loc||!cid) return send(res,400,{error:'locationId and contactId required'});
        const tok=signLink(loc, cid, '');
        if(!tok) return send(res,500,{error:'signing unavailable'});
        const base=(process.env.PUBLIC_BASE||'https://aiwills.digilyse.co');
        const link=base+'/hub.html?aw_loc='+encodeURIComponent(loc)+'&aw_c='+encodeURIComponent(cid)+'&aw_t='+encodeURIComponent(tok);
        return send(res,200,{ ok:true, link:link, token:tok });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Trade a one-time emailed link for a session. The link dies here whether or not the rest works,
    // so a forwarded or shoulder-surfed link is worth nothing the second time it is opened.
    if (req.method === 'POST' && pathOnly === '/api/session-start'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const claims = verifyEdit(b.t || '');
        if (!claims || !claims.loc || !claims.cid) return send(res, 403, { error: 'expired', message: 'That link has expired. Sign-in links last an hour for your security.' });
        if (claims.kind === 'session') return send(res, 403, { error: 'expired', message: 'That is not a sign-in link.' });
        if (!claims.jti || !authSpend(claims.jti, claims.exp)) return send(res, 403, { error: 'used', message: 'That link has already been used. Sign-in links work once, so please request a new one.' });
        const session = signSession(claims.loc, claims.cid, claims.funnel || '');
        if (!session) return send(res, 500, { error: 'signing unavailable' });
        return send(res, 200, { ok: true, session: session, contactId: claims.cid, funnel: claims.funnel || '', expiresInMs: AW_SESSION_TTL_MS });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Signing out has to mean something on the server, not just in the browser.
    if (req.method === 'POST' && pathOnly === '/api/session-end'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const claims = verifyEdit(b.s || '');
        if (claims && claims.jti) authSpend(claims.jti, claims.exp);
        return send(res, 200, { ok: true });   // an unreadable or already dead session is still signed out
      } catch(e){ return send(res, 200, { ok: true }); }
    }
    // Load a saved funnel state for editing. Token-gated so a bare contactId can't read someone's data.
    if (req.method === 'GET' && pathOnly === '/api/state-load'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const tok=(new URL(req.url,'http://x')).searchParams.get('t')||'';
        const claims=verifyEdit(tok);
        if(!claims||!claims.loc||!claims.cid) return send(res,403,{error:'invalid or expired link'});
        // Only a live session may read someone's answers. A raw link has to be exchanged first,
        // which is what makes signing out and single use actually bite.
        if(claims.kind!=='session') return send(res,403,{error:'no session',message:'Please open your sign-in link again.'});
        if(authIsSpent(claims.jti)) return send(res,403,{error:'signed out',message:'You have been signed out. Please request a new link.'});
        const _qf=(new URL(req.url,'http://x')).searchParams.get('funnel'); const _uf=_qf||claims.funnel||'etb'; const out=await loadState(claims.loc, claims.cid, _uf);
        return send(res,200,{ ok:true, funnel:_uf, contactId:claims.cid, state:out.state, contact:out.contact, found:out.found, files:out.files||[], filesRaw:out.filesRaw||[] });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // DEV ONLY: mint an edit token to test the edit flow. Disabled the moment EDIT_SECRET is set (production).
    // Production mint: secret-gated (only Chris's login / a GHL workflow can call it). Returns a per-contact edit link.
    if (req.method === 'POST' && pathOnly === '/api/edit-link'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const secret = b.secret || req.headers['x-edit-secret'] || '';
        const need = process.env.EDIT_LINK_SECRET || '';
        if (!need || secret !== need) return send(res, 403, { error: 'forbidden' });
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const cid = (b.contactId||'').replace(/[^A-Za-z0-9]/g,'');
        const funnel = (['wills','lpa','etb'].indexOf(b.funnel)>=0)?b.funnel:'etb';
        if (!loc || !cid) return send(res, 400, { error: 'locationId and contactId required' });
        const ttl = Math.min(parseInt(b.ttlDays||30,10)||30, 90);
        const token = signLink(loc, cid, funnel);
        if (!token) return send(res, 500, { error: 'EDIT_SECRET not set on server' });
        const base = b.returnBase || '';
        const url = base ? (base + (base.indexOf('?')>=0?'&':'?') + 'aw_t=' + encodeURIComponent(token)) : '';
        return send(res, 200, { ok:true, token: token, url: url });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Self-serve: a client enters their email; if it matches a contact we stamp their edit link + a tag, and a GHL workflow emails it. Always returns a generic message.
    if (req.method === 'POST' && pathOnly === '/api/edit-request'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const email = (b.email||'').trim();
        const phone = (b.phone||'').trim();
        const channel = (String(b.channel||'').toLowerCase()==='sms') ? 'sms' : (email ? 'email' : 'sms');
        const funnel = (['wills','lpa','etb'].indexOf(b.funnel)>=0)?b.funnel:'etb';
        const base = b.returnBase || '';
        if (!loc || (!email && !phone)) return send(res, 400, { error: 'locationId and an email or phone required' });
        (async function(){
          try {
            const c = email ? await findContactByEmail(loc, email) : await findContactByPhone(loc, phone);
            if (!c || !c.id) return;
            const token = signLink(loc, c.id, funnel);
            if (!token) return;
            const url = base ? (base + (base.indexOf('?')>=0?'&':'?') + 'aw_t=' + encodeURIComponent(token)) : '';
            const wtoken = await getWriteToken(loc);
            const map = await etbFieldMap(wtoken, loc);
            let fid = map['edit link'];
            if (!fid){ try { const cf = await ghl('POST','/locations/'+loc+'/customFields',wtoken,{name:'Edit Link',dataType:'TEXT',model:'contact'}); const nf=cf.customField||cf; if(nf&&nf.id) fid=nf.id; }catch(e){} }
            if (fid) await ghl('PUT','/contacts/'+c.id, wtoken, { customFields: [{ id: fid, value: url }] });
            // Base tag drives the send workflow; the channel tag lets it branch text vs email if wanted.
            try { await ghl('POST','/contacts/'+c.id+'/tags', wtoken, { tags: ['send-edit-link', (channel==='sms'?'aiw-login-sms':'aiw-login-email')] }); }catch(e){}
          } catch(e){ console.error('edit-request', e.message); }
        })();
        return send(res, 200, { ok:true, message:'If we have your details, your secure link is on its way.' });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Public client-facing pages (login, hub, funnels): served BEFORE the tool's auth gate.
    // Safe because all personal data behind them is token-gated server-side (aw_t / state-load).
    {
      const _pf = req.url.split('?')[0];
      const PUBLIC_PAGES = ['/hub.html','/wills-test.html','/lpa-test.html','/etb-test.html','/qa.html','/engine-dev.html'];
      if (req.method === 'GET' && PUBLIC_PAGES.indexOf(_pf) >= 0){
        const _fp = path.join(__dirname, 'public', _pf);
        if (_fp.indexOf(path.join(__dirname, 'public')) === 0 && fs.existsSync(_fp) && fs.statSync(_fp).isFile()){
          const _d = fs.readFileSync(_fp);
          res.writeHead(200, { 'Content-Type': MIME[path.extname(_fp)] || 'text/plain' });
          return res.end(_d);
        }
      }
    }
    // Public shareable docs (Word files for Chris, linked from Trello). No secrets, so served before the auth gate.
    {
      const _dp = req.url.split('?')[0];
      if (req.method === 'GET' && /^\/docs\/[A-Za-z0-9._-]+\.(docx|pdf)$/.test(_dp)){
        const _dfp = path.join(__dirname, 'public', _dp);
        if (_dfp.indexOf(path.join(__dirname, 'public', 'docs')) === 0 && fs.existsSync(_dfp) && fs.statSync(_dfp).isFile()){
          const _dd = fs.readFileSync(_dfp);
          res.writeHead(200, { 'Content-Type': MIME[path.extname(_dfp)] || 'application/octet-stream', 'Content-Disposition': 'attachment; filename="'+path.basename(_dfp)+'"' });
          return res.end(_dd);
        }
      }
    }
    if (!authed(req)){
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="AI Wills onboarding"', 'Content-Type':'text/plain; charset=utf-8' });
      return res.end('Authentication required.');
    }
    if (req.method === 'GET' && pathOnly === '/api/connect-accounts'){
      // The firms connected to the Ai-Wills Stripe platform, so the tool can offer them
      // by name instead of asking anyone to paste an acct_ id.
      if (!process.env.STRIPE_SECRET_KEY) return send(res, 200, { accounts: [], error: 'Stripe is not configured on this server.' });
      try {
        const list = await stripeReq('GET', '/v1/accounts?limit=100', null, process.env.STRIPE_SECRET_KEY);
        const accounts = (list.data || []).map(function(a){
          const ready = connectAcctReady(a);
          return { id: a.id, name: connectAcctName(a), ready: ready, reason: ready ? '' : 'Stripe onboarding not finished' };
        });
        accounts.sort(function(x, y){ return (y.ready - x.ready) || x.name.localeCompare(y.name); });
        return send(res, 200, { accounts: accounts });
      } catch(e){ return send(res, 200, { accounts: [], error: e.message }); }
    }
    if (req.method === 'POST' && req.url === '/api/scrape'){
      const parsed = JSON.parse((await readBody(req)) || '{}');
      if (!parsed.url) return send(res, 400, { error: 'url required' });
      return send(res, 200, { values: await handleScrape(parsed.url) });
    }
    if (req.method === 'POST' && req.url === '/api/write'){
      const parsed = JSON.parse((await readBody(req)) || '{}');
      const vals = parsed.values || {};
      const warnings = [];
      const acct = String(vals.stripe_account_id || '').trim();
      if (acct){
        const problem = await connectAcctProblem(acct);
        if (problem){ delete vals.stripe_account_id; warnings.push(problem); }
      }
      return send(res, 200, { results: await handleWrite(parsed.locationId, vals, { allowClear: !!parsed.allowClear, confirmClear: !!parsed.confirmClear }), warnings: warnings });
    }
    /* One call powers both the health check and the mapping editor, so what the tool shows is
       exactly what the engine would do rather than a second opinion. */
    if (req.method === 'GET' && pathOnly === '/api/pipeline-map'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const mu = new URL(req.url,'http://x');
        const mloc = (mu.searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
        if(!mloc) return send(res,400,{error:'locationId required'});
        if (mu.searchParams.get('refresh')){ delete _awPipeCache[mloc]; delete _awPipeFail[mloc]; }
        const mtok = await getWriteToken(mloc);
        const pls = await awPipelines(mtok, mloc);
        if (!pls) return send(res,200,{ ok:false, reason:'no-access', message:'This account has not given us permission to see its pipelines yet.' });
        let mcv = {}; try { mcv = await getCustomValuesMap(mloc, mtok); } catch(_){}
        const saved = awMapGet(mloc);
        const services = {};
        Object.keys(AW_STAGE_MAP).forEach(function(svc){
          const rows = awStepsFor(svc).map(function(row){
            const rr = awResolve(pls, saved[svc], svc, row.step, mcv);
            return { step: row.step, wants: row.stage, stageId: rr.stageId, stageName: rr.stageName, via: rr.via, problem: rr.problem };
          });
          const pl = awResolve(pls, saved[svc], svc, (awStepsFor(svc)[0]||{}).step, mcv).pipeline;
          services[svc] = {
            pipelineId: pl ? pl.id : '', pipelineName: pl ? pl.name : '',
            stages: pl ? (pl.stages||[]).map(function(st){ return { id: st.id, name: st.name }; }) : [],
            rows: rows,
            broken: rows.filter(function(x){ return !!x.problem; }).length
          };
        });
        return send(res,200,{ ok:true, services: services, pipelines: pls.map(function(p){ return { id:p.id, name:p.name, stages:(p.stages||[]).map(function(st){ return { id:st.id, name:st.name }; }) }; }) });
      } catch(e){ return send(res, 200, { ok:false, error: e.message }); }
    }
    /* Save a human's choices. Stored as ids, so renaming a stage afterwards changes nothing. */
    if (req.method === 'POST' && pathOnly === '/api/pipeline-map'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const bloc = String(b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        if(!bloc) return send(res,400,{error:'locationId required'});
        const incoming = b.map || {};
        const clean = {};
        Object.keys(incoming).forEach(function(svc){
          if (!AW_STAGE_MAP[svc]) return;
          const e = incoming[svc] || {};
          const stages = {};
          Object.keys(e.stages || {}).forEach(function(step){
            if (AW_STAGE_MAP[svc][step] && e.stages[step]) stages[step] = String(e.stages[step]);
          });
          clean[svc] = { pipelineId: String(e.pipelineId || ''), stages: stages };
        });
        awMapPut(bloc, clean);
        return send(res,200,{ ok:true, saved: Object.keys(clean).length });
      } catch(e){ return send(res, 200, { ok:false, error: e.message }); }
    }
    if (req.method === 'GET' && pathOnly === '/api/pipelines-debug'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const pu = new URL(req.url,'http://x');
        const ploc = (pu.searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
        if(!ploc) return send(res,400,{error:'locationId required'});
        const ptok = await getWriteToken(ploc);
        const pl = await ghl('GET','/opportunities/pipelines?locationId='+ploc, ptok);
        const pipelines = (pl.pipelines || pl.data || []).map(function(p){
          return { id: p.id, name: p.name, stages: (p.stages||[]).map(function(st){ return { id: st.id, name: st.name, position: st.position }; }) };
        });
        // What the engine would need to match, next to what is actually on the board.
        const wanted = { wills: 'Online Wills', lpa: 'Online LPAs', etb: 'Executor Toolbox', probate: 'Probate Quotes & Referrals' };
        const expected = {};
        Object.keys(AW_STAGE_MAP).forEach(function(k){
          const seen = {}; const out = [];
          Object.keys(AW_STAGE_MAP[k]).forEach(function(step){ const v = AW_STAGE_MAP[k][step]; if(!seen[v]){ seen[v]=1; out.push(v); } });
          expected[k] = out;
        });
        const check = {};
        Object.keys(wanted).forEach(function(svc){
          const p = pipelines.filter(function(x){ return String(x.name||'').toLowerCase() === wanted[svc].toLowerCase(); })[0];
          if(!p){ check[svc] = { pipeline: wanted[svc], found: false }; return; }
          const names = p.stages.map(function(st){ return String(st.name||'').toLowerCase(); });
          check[svc] = {
            pipeline: p.name, found: true, pipelineId: p.id,
            missingStages: expected[svc].filter(function(n){ return names.indexOf(String(n).toLowerCase()) < 0; }),
            unusedStages: p.stages.map(function(st){ return st.name; }).filter(function(n){ return expected[svc].map(function(x){ return String(x).toLowerCase(); }).indexOf(String(n).toLowerCase()) < 0; })
          };
        });
        return send(res,200,{ ok:true, count: pipelines.length, pipelines: pipelines, check: check });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (req.method === 'GET' && pathOnly === '/api/funnels-debug'){
      try {
        const du = new URL(req.url,'http://x');
        const dloc = (du.searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
        if(!dloc) return send(res,400,{error:'locationId required'});
        const dtok = await getWriteToken(dloc);
        const fl = await ghl('GET','/funnels/funnel/list?locationId='+dloc+'&limit=100', dtok);
        const funnels = fl.funnels || fl.data || [];
        const out = { count: funnels.length, funnels: funnels };
        if(funnels[0] && funnels[0]._id){ try { out.firstFunnelPages = await ghl('GET','/funnels/page?locationId='+dloc+'&funnelId='+funnels[0]._id+'&limit=100', dtok); } catch(e){ out.firstFunnelPagesError = e.message; } }
        return send(res,200,out);
      } catch(e){ return send(res,500,{error:e.message}); }
    }
    let f = req.url.split('?')[0];
    if (f === '/' || f === '') f = '/index.html';
    const fp = path.join(__dirname, 'public', f);
    if (fp.indexOf(path.join(__dirname, 'public')) === 0 && fs.existsSync(fp) && fs.statSync(fp).isFile()){
      const data = fs.readFileSync(fp);               // read BEFORE sending headers
      const ext = path.extname(fp);
      const type = MIME[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': type });
      return res.end(data);
    }
    send(res, 404, { error: 'not found' });
  } catch(e){ if (!res.headersSent){ send(res, 500, { error: e.message }); } else { try { res.end(); } catch(_){} } }
});

/* Listen unless explicitly told not to (tests set AIWILLS_NO_LISTEN=1).
   On cPanel/Passenger the file is loaded via require, not as the main module,
   so we must NOT gate listen() on require.main. Passenger sets process.env.PORT. */
if (!process.env.AIWILLS_NO_LISTEN){
  const note = process.env.GHL_PIT ? '' : '  (GHL_PIT not set: scraping works, writing to GHL will not)';
  server.listen(PORT, () => console.log('AI Wills onboarding tool listening on port ' + PORT + note));
}

module.exports = { scrapeBrand: scrapeBrand, pickColors: pickColors, pickFonts: pickFonts, scrapeNav: scrapeNav, authed: authed };
