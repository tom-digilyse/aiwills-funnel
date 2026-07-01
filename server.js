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
const GHL_SCOPES = 'locations/customValues.readonly locations/customValues.write locations/customFields.readonly locations/customFields.write contacts.readonly contacts.write medias.readonly medias.write workflows.readonly opportunities.readonly opportunities.write conversations.readonly conversations.write conversations/message.readonly conversations/message.write conversations/reports.readonly conversations/livechat.write emails/builder.readonly emails/builder.write emails/schedule.readonly emails/schedule.write emails/templates.readonly emails/templates.write emails/campaigns.readonly emails/campaigns.write emails/stats.readonly';
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
async function getStoredLocationToken(locationId){
  const s = loadStore(); let rec = s.locations[locationId];
  if (!rec || !rec.refresh_token) throw new Error('Sub-account ' + locationId + ' has not authorised the app yet. Open /oauth/start, pick this sub-account and approve.');
  if (rec.expires_at && rec.expires_at > Date.now() + 60000) return rec.access_token;
  const j = await oauthToken({ client_id: process.env.GHL_CLIENT_ID, client_secret: process.env.GHL_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: rec.refresh_token, user_type: 'Location' });
  rec = { access_token: j.access_token, refresh_token: j.refresh_token || rec.refresh_token, locationId: locationId, companyId: j.companyId || rec.companyId, expires_at: Date.now() + ((j.expires_in || 86399) * 1000) };
  s.locations[locationId] = rec; saveStore(s);
  return rec.access_token;
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

async function fetchText(url){
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 AiWillsOnboarding' }, redirect: 'follow' });
  if (!r.ok) throw new Error('Fetch ' + url + ' returned ' + r.status);
  return await r.text();
}

async function handleScrape(url){
  const html = await fetchText(url);
  const origin = new URL(url).origin;
  const hrefs = [];
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi; let m;
  while ((m = linkRe.exec(html)) && hrefs.length < 3){ if (!/googleapis|gstatic/.test(m[1])) hrefs.push(abs(m[1], origin)); }
  let css = '';
  for (const h of hrefs){ try { css += '\n' + await fetchText(h); } catch(e){} }
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

async function handleWrite(locationId, values){
  if (!locationId) throw new Error('locationId is required.');
  const token = await getWriteToken(locationId);
  const existing = await ghl('GET', '/locations/' + locationId + '/customValues', token);
  const list = existing.customValues || existing.customValue || [];
  const byName = {};
  list.forEach(cv => { byName[(cv.name || '').toLowerCase()] = cv.id; });
  const results = [];
  for (const name of Object.keys(values)){
    const value = values[name];
    if (value === '' || value == null){ results.push({ name: name, skipped: true }); continue; }
    try {
      const id = byName[name.toLowerCase()];
      if (id){ await ghl('PUT', '/locations/' + locationId + '/customValues/' + id, token, { name: name, value: value }); results.push({ name: name, action: 'updated' }); }
      else { await ghl('POST', '/locations/' + locationId + '/customValues', token, { name: name, value: value }); results.push({ name: name, action: 'created' }); }
    } catch(e){ results.push({ name: name, error: e.message }); }
  }
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
  var base = { firstName: pd.firstName||'', lastName: pd.lastName||'', email: pd.email||'', phone: pd.phone||'', address1: pd.address||'', city: pd.city||'', postalCode: pd.postcode||'', customFields: cf };
  var up = await upsertOrUpdateContact(token, loc, contactId, base);
  var cid = (up.contact && up.contact.id) || up.id || contactId || '';
  var readback = null;
  if (cid){ try { var got = await ghl('GET', '/contacts/' + cid, token); var c = got.contact || got; var byId={}; (c.customFields||c.customField||[]).forEach(function(f){ byId[f.id]=(f.value!=null?f.value:f.fieldValue); }); readback = { id: cid, fieldCount: Object.keys(byId).length }; } catch(e){ readback = { id: cid, err: e.message }; } }
  var pdfRes; if (opts && opts.pdf && cid) pdfRes = await storeGeneratedPdf(loc, cid, 'etb'); // keep the summary PDF on the contact
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
  return { ok: true, field: fieldName, contactId: contactId, bytes: buf.length, url: fileUrl };
}

/* ---------- payment (Stripe), will store, PDF helpers ---------- */
const crypto = require('crypto');
const WILL_DIR = path.join(__dirname, 'will_data');
function willStorePut(id, obj){ try { fs.mkdirSync(WILL_DIR, { recursive: true }); fs.writeFileSync(path.join(WILL_DIR, id.replace(/[^a-f0-9]/gi,'') + '.json'), JSON.stringify(obj)); } catch(e){ console.error('willStorePut', e.message); } }
function willStoreGet(id){ try { return JSON.parse(fs.readFileSync(path.join(WILL_DIR, id.replace(/[^a-f0-9]/gi,'') + '.json'), 'utf8')); } catch(e){ return null; } }

function formEncode(obj){ const out = []; for (const k in obj){ const v = obj[k]; if (v === undefined || v === null || v === '') continue; out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); } return out.join('&'); }
async function stripeReq(method, pathname, params, key){
  const opts = { method: method, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' } };
  if (params) opts.body = formEncode(params);
  const r = await fetch('https://api.stripe.com' + pathname, opts);
  const text = await r.text(); let j; try { j = JSON.parse(text); } catch(e){ j = { raw: text }; }
  if (!r.ok) throw new Error('Stripe ' + pathname + ' -> ' + r.status + ' ' + text.slice(0,300));
  return j;
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
function editSecret(){ return process.env.EDIT_SECRET || (String(process.env.STRIPE_SECRET_KEY||'').indexOf('sk_test')===0 ? 'aiwills-dev-edit-secret' : ''); }
function b64u(s){ return Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64ud(s){ s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return Buffer.from(s,'base64').toString('utf8'); }
function signEdit(payload){ var sec=editSecret(); if(!sec) return ''; var p=b64u(JSON.stringify(payload)); var h=crypto.createHmac('sha256',sec).update(p).digest('hex').slice(0,32); return p+'.'+h; }
function verifyEdit(token){ try{ var sec=editSecret(); if(!sec||!token) return null; var parts=String(token).split('.'); if(parts.length!==2) return null; var exp=crypto.createHmac('sha256',sec).update(parts[0]).digest('hex').slice(0,32); var a=Buffer.from(exp),b=Buffer.from(parts[1]); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return null; var obj=JSON.parse(b64ud(parts[0])); if(obj.exp && Date.now()>obj.exp) return null; return obj; }catch(e){ return null; } }
/* Read a saved funnel state JSON off a contact. funnel = 'etb' | 'wills'. */
async function loadState(loc, contactId, funnel){
  var token = await getWriteToken(loc);
  var fieldName = (funnel==='wills') ? 'Will State Json' : 'ETB State Json';
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
async function willSave(loc, state, contactId, opts){
  if(!loc) throw new Error('locationId required');
  var token = await getWriteToken(loc);
  var map = await etbFieldMap(token, loc);
  var fieldName='Will State Json'; var fid=map[fieldName.toLowerCase()];
  if(!fid){ try{ var c=await ghl('POST','/locations/'+loc+'/customFields',token,{name:fieldName,dataType:'LARGE_TEXT',model:'contact'}); var nf=c.customField||c; if(nf&&nf.id) fid=nf.id; }catch(e){ console.error('will field create', e.message); } }
  var p=(state&&state.personal)||{};
  var base={ firstName:p.firstName||'', lastName:p.lastName||'', email:p.email||'', phone:p.phone||'' };
  if(fid){ try{ base.customFields=[{ id:fid, value: JSON.stringify(state||{}) }]; }catch(e){} }
  var up=await upsertOrUpdateContact(token, loc, contactId, base);
  var cid=(up.contact&&up.contact.id)||up.id||contactId||'';
  var pdfRes; if (opts && opts.pdf && cid) pdfRes = await storeGeneratedPdf(loc, cid, 'wills');
  return { contactId: cid, saved: !!fid, pdf: pdfRes };
}
// Generate the funnel's PDF (will or toolbox summary) from the contact's saved state and store it onto a FILE_UPLOAD field so the advisor sees it in GHL.
async function storeGeneratedPdf(loc, contactId, funnel){
  try {
    if (!loc || !contactId) return { skip:'no id' };
    var token = await getWriteToken(loc);
    var out = await loadState(loc, contactId, funnel);
    if (!out.state) return { skip:'no state' };
    var company=''; try { var cv = await getCustomValuesMap(loc, token); company = cv['company_name'] || ''; } catch(e){}
    var wp = require('./will-pdf');
    var buf, fieldName, fname;
    if (funnel==='wills'){ buf = await wp.buildWillPdf(wp.normalizeWill(out.state), { company_name: company }); fieldName='Will PDF'; fname='will.pdf'; }
    else { buf = await wp.buildEtbPdf(out.state, { company_name: company }); fieldName='ETB Summary PDF'; fname='toolbox-summary.pdf'; }
    var map = await etbFieldMap(token, loc);
    var fid = map[fieldName.toLowerCase()];
    if (!fid){ var cf = await ghl('POST','/locations/'+loc+'/customFields',token,{ name:fieldName, dataType:'FILE_UPLOAD', model:'contact' }); var nf=cf.customField||cf; if(nf&&nf.id) fid=nf.id; }
    if (!fid) return { ok:false, err:'no field id for '+fieldName };
    var fileId = crypto.randomBytes(8).toString('hex');
    var form = new FormData();
    form.append('id', contactId); form.append('maxFiles','1');
    form.append(fid + '_' + fileId, new Blob([buf], { type:'application/pdf' }), fname);
    var r = await fetch(GHL_BASE + '/locations/' + loc + '/customFields/upload', { method:'POST', headers:{ Authorization:'Bearer '+token, Version:GHL_VERSION, Accept:'application/json' }, body:form });
    var t = await r.text();
    if (!r.ok) return { ok:false, err:'upload '+r.status+' '+t.slice(0,200) };
    return { ok:true, field:fieldName, bytes:buf.length };
  } catch(e){ return { ok:false, err:String(e&&e.message||e) }; }
}
// GHL /contacts/upsert rejects an `id` (422 "property id should not exist"). Update a KNOWN contact with PUT /contacts/{id}; only upsert (match by email) when creating.
async function upsertOrUpdateContact(token, loc, contactId, base){
  if (contactId){ return await ghl('PUT', '/contacts/' + contactId, token, base); }
  return await ghl('POST', '/contacts/upsert', token, Object.assign({ locationId: loc }, base));
}
async function findContactByEmail(loc, email){
  try {
    const token = await getWriteToken(loc);
    const r = await ghl('GET', '/contacts/search/duplicate?locationId='+loc+'&email='+encodeURIComponent(email), token);
    return r.contact || (r.contacts && r.contacts[0]) || null;
  } catch(e){ return null; }
}
async function getCustomValuesMap(locationId, token){
  const ex = await ghl('GET', '/locations/' + locationId + '/customValues', token);
  const list = ex.customValues || ex.customValue || []; const byName = {};
  list.forEach(function(cv){ byName[(cv.name || '').toLowerCase()] = cv.value; });
  return byName;
}

/* ---------- server ---------- */
function send(res, code, obj){ if (res.headersSent) { try { res.end(); } catch(_){} return; } res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function readBody(req){ return new Promise(resolve => { let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); }); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer(async (req, res) => {
  try {
    const pathOnly = req.url.split('?')[0];
    if (req.method === 'GET' && pathOnly === '/oauth/start'){
      if (!process.env.GHL_CLIENT_ID) return send(res, 400, { error: 'GHL_CLIENT_ID not set' });
      const u = 'https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=' + encodeURIComponent(REDIRECT_URI) + '&client_id=' + encodeURIComponent(process.env.GHL_CLIENT_ID) + '&scope=' + encodeURIComponent(GHL_SCOPES);
      res.writeHead(302, { Location: u }); return res.end();
    }
    if (req.method === 'GET' && pathOnly === '/oauth/callback'){
      const code = (new URL(req.url, 'http://x')).searchParams.get('code');
      if (!code){ res.writeHead(400, { 'Content-Type': 'text/html' }); return res.end('Missing code'); }
      try { const t = await exchangeCode(code); res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<h2>Sub-account connected.</h2><p>locationId ' + (t.locationId || '') + '. You can close this tab. Repeat /oauth/start for each sub-account you want to brand.</p>'); }
      catch(e){ res.writeHead(500, { 'Content-Type': 'text/html' }); return res.end('OAuth failed: ' + e.message); }
    }
    if (req.method === 'GET' && (pathOnly === '/engine.js' || pathOnly === '/api/engine')){
      // /api/engine is the cross-origin-safe path: the host blocks cross-domain .js requests (503),
      // but non-.js paths under /api/ pass (same as /api/brand). The GHL loader uses /api/engine.
      res.setHeader('Access-Control-Allow-Origin','*');
      try { const ejs = fs.readFileSync(path.join(__dirname,'public','engine.js')); res.writeHead(200, { 'Content-Type':'text/javascript', 'Cache-Control':'public, max-age=300' }); return res.end(ejs); }
      catch(e){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('engine not found'); }
    }
    if (req.method === 'GET' && pathOnly === '/api/brand'){
      res.setHeader('Access-Control-Allow-Origin','*');
      const locId = ((new URL(req.url,'http://x')).searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
      if (!locId){ res.writeHead(400, { 'Content-Type':'application/json' }); return res.end('{}'); }
      try {
        const btoken = await getWriteToken(locId);
        const ex = await ghl('GET','/locations/'+locId+'/customValues', btoken);
        const cvs = ex.customValues || ex.customValue || [];
        const byName = {}; cvs.forEach(function(cv){ byName[(cv.name||'').toLowerCase()] = cv.value; });
        const MAP = {company_name:'company_name',logo_url:'client_logo_url',primary_color:'client_primary_color',heading_color:'client_heading_color',body_color:'client_body_color',header_bg_color:'header_bg_color',page_bg_color:'page_bg_color',heading_font:'client_heading_font',body_font:'client_body_font',site_max_width:'site_max_width',footer_max_width:'footer_max_width',nav_font_size:'nav_font_size',body_font_size:'body_font_size',logo_height:'logo_height',phone:'footer_phone',email:'company_email',address:'company_address',facebook_url:'facebook_link',instagram_url:'instagram_link',privacy_url:'privacy_url',will_price:'will_price',legal_footer:'legal_footer',nav_menu_json:'nav_menu_json',footer_menu_json:'footer_menu_json',nav_text_color:'nav_text_color',heading_font_size:'heading_font_size',heading_weight:'heading_weight',nav_weight:'nav_weight',button_weight:'button_weight',button_color:'button_color',button_hover_color:'button_hover_color',button_text_color:'button_text_color',button_secondary_color:'button_secondary_color',button_secondary_text_color:'button_secondary_text_color',button_font:'button_font',button_radius:'button_radius',footer_bg_color:'footer_bg_color',footer_text_color:'footer_text_color',linkedin_url:'linkedin_link',twitter_url:'twitter_link',youtube_url:'youtube_link',tiktok_url:'tiktok_link',font_css_links:'font_css_links'};
        const brand = {}; Object.keys(MAP).forEach(function(k){ const v = byName[MAP[k].toLowerCase()]; if (v != null) brand[k] = v; });
        res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'public, max-age=60' }); return res.end(JSON.stringify(brand));
      } catch(e){ res.writeHead(200, { 'Content-Type':'application/json' }); const dbg=(new URL(req.url,'http://x')).searchParams.get('debug'); return res.end(dbg ? JSON.stringify({_err:String((e&&e.message)||e)}) : '{}'); }
    }
    // ----- payment: create a Stripe Checkout session (central AI Wills Stripe) -----
    if (req.method === 'POST' && pathOnly === '/api/checkout'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        if (!process.env.STRIPE_SECRET_KEY) return send(res, 500, { error: 'Stripe is not configured on the server.' });
        const cbody = JSON.parse((await readBody(req)) || '{}');
        const loc = (cbody.locationId || '').replace(/[^A-Za-z0-9]/g,'');
        if (!loc) return send(res, 400, { error: 'locationId is required' });
        const token = await getWriteToken(loc);
        const cv = await getCustomValuesMap(loc, token);
        const amount = Math.round(parseFloat(String(cv['will_price'] || '').replace(/[^0-9.]/g,'')) * 100);
        if (!amount || amount < 100) return send(res, 400, { error: 'will_price is not set for this location' });
        const company = cv['company_name'] || 'AI Wills';
        const person = (cbody.willJson && cbody.willJson.personal) || cbody.contact || {};
        let contactId = cbody.contactId || '';
        try {
          const up = await ghl('POST', '/contacts/upsert', token, { locationId: loc, firstName: person.firstName || '', lastName: person.lastName || '', email: person.email || '', phone: person.phone || '' });
          contactId = (up.contact && up.contact.id) || up.id || contactId;
        } catch(e){ console.error('lead upsert', e.message); }
        const id = crypto.randomBytes(16).toString('hex');
        willStorePut(id, { willJson: cbody.willJson || {}, paid: false, locationId: loc, contactId: contactId, company: company, createdAt: Date.now() });
        const ret = cbody.returnUrl || ('https://' + (req.headers.host || 'aiwills.digilyse.co'));
        const sep = ret.indexOf('?') >= 0 ? '&' : '?';
        const sess = await stripeReq('POST', '/v1/checkout/sessions', {
          'mode': 'payment',
          'success_url': ret + sep + 'aw_paid=1&aw_id=' + id,
          'cancel_url': ret + sep + 'aw_paid=0',
          'line_items[0][quantity]': 1,
          'line_items[0][price_data][currency]': 'gbp',
          'line_items[0][price_data][unit_amount]': amount,
          'line_items[0][price_data][product_data][name]': 'Will document (' + company + ')',
          'metadata[aw_id]': id,
          'metadata[locationId]': loc,
          'metadata[contactId]': contactId,
          'customer_email': person.email || ''
        }, process.env.STRIPE_SECRET_KEY);
        return send(res, 200, { url: sess.url, id: id });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- payment: ETB subscription checkout (central AI Wills Stripe, subscription mode) -----
    if (req.method === 'POST' && pathOnly === '/api/etb-checkout'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        if (!process.env.STRIPE_SECRET_KEY) return send(res, 500, { error: 'Stripe is not configured on the server.' });
        const cbody = JSON.parse((await readBody(req)) || '{}');
        const loc = (cbody.locationId || '').replace(/[^A-Za-z0-9]/g,'');
        if (!loc) return send(res, 400, { error: 'locationId is required' });
        const token = await getWriteToken(loc);
        const cv = await getCustomValuesMap(loc, token);
        // price resolution is config-not-code: per-location custom value, then server env, then a test-only default.
        // GO-LIVE: set the custom value `etb_price_id` (or ETB_PRICE_ID env) to the LIVE Stripe price before switching to a live key.
        const isTestKey = String(process.env.STRIPE_SECRET_KEY||'').indexOf('sk_test')===0;
        const price = cv['etb_price_id'] || process.env.ETB_PRICE_ID || (isTestKey ? 'price_1Thoi4BixkcdGFjdX5gxYQZC' : '');
        if (!price) return send(res, 400, { error: 'etb_price_id is not set for this location' });
        const person = cbody.contact || {};
        let contactId = cbody.contactId || '';
        try {
          const up = await ghl('POST', '/contacts/upsert', token, { locationId: loc, firstName: person.firstName || '', lastName: person.lastName || '', email: person.email || '', phone: person.phone || '' });
          contactId = (up.contact && up.contact.id) || up.id || contactId;
        } catch(e){ console.error('etb lead upsert', e.message); }
        const ret = cbody.returnUrl || ('https://' + (req.headers.host || 'aiwills.digilyse.co'));
        const sep = ret.indexOf('?') >= 0 ? '&' : '?';
        const sess = await stripeReq('POST', '/v1/checkout/sessions', {
          'mode': 'subscription',
          'success_url': ret + sep + 'aw_etb_paid=1',
          'cancel_url': ret + sep + 'aw_etb_paid=0',
          'line_items[0][price]': price,
          'line_items[0][quantity]': 1,
          'metadata[kind]': 'etb',
          'metadata[locationId]': loc,
          'metadata[contactId]': contactId,
          'subscription_data[metadata][kind]': 'etb',
          'subscription_data[metadata][locationId]': loc,
          'subscription_data[metadata][contactId]': contactId,
          'customer_email': person.email || ''
        }, process.env.STRIPE_SECRET_KEY);
        return send(res, 200, { url: sess.url, contactId: contactId });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // ----- payment: Stripe webhook (marks the will paid, tags the GHL contact) -----
    if (req.method === 'POST' && pathOnly === '/api/stripe-webhook'){
      const raw = await readBody(req);
      if (!process.env.STRIPE_WEBHOOK_SECRET || !verifyStripeSig(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)){
        res.writeHead(400, { 'Content-Type':'text/plain' }); return res.end('signature check failed');
      }
      let evt; try { evt = JSON.parse(raw); } catch(e){ res.writeHead(400); return res.end('bad json'); }
      if (evt.type === 'checkout.session.completed'){
        const md = (evt.data && evt.data.object && evt.data.object.metadata) || {};
        if (md.aw_id){ const rec = willStoreGet(md.aw_id); if (rec){ rec.paid = true; rec.paidAt = Date.now(); willStorePut(md.aw_id, rec); } }
        if (md.locationId && md.contactId){
          const tagName = (md.kind === 'etb') ? 'etb-active' : 'ai-will-paid';
          (async function(){
            try { const t = await getWriteToken(md.locationId); await ghl('POST', '/contacts/' + md.contactId + '/tags', t, { tags: [tagName] }); }
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
      const cmd = "cd " + repo
        + " && GIT_SSH_COMMAND='ssh -i " + key + " -o StrictHostKeyChecking=no' git pull --ff-only"
        + " && /bin/cp -R public/. " + dest + "/public/"
        + " && /bin/cp -f server.js will-pdf.js package.json " + dest + "/ 2>/dev/null"
        + " ; /bin/mkdir -p " + dest + "/tmp && /bin/touch " + dest + "/tmp/restart.txt";
      require('child_process').exec(cmd, { timeout: 90000 }, function(err, stdout, stderr){
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
    if (req.method === 'GET' && (pathOnly === '/api/will-pdf' || pathOnly === '/api/etb-pdf')){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const tok=(new URL(req.url,'http://x')).searchParams.get('t')||'';
        const cl=verifyEdit(tok);
        if(!cl||!cl.loc||!cl.cid) return send(res, 403, { error: 'invalid or expired link' });
        const isWill = (pathOnly === '/api/will-pdf');
        const out = await loadState(cl.loc, cl.cid, isWill?'wills':'etb');
        if(!out.state) return send(res, 404, { error: 'nothing saved yet' });
        let company=''; try { const cv=await getCustomValuesMap(cl.loc, await getWriteToken(cl.loc)); company=cv['company_name']||''; } catch(e){}
        const wp = require('./will-pdf');
        let buf, fname;
        if (isWill){ const wd = wp.normalizeWill(out.state); buf = await wp.buildWillPdf(wd, { company_name: company }); fname='your-will.pdf'; }
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
    if (req.method === 'POST' && pathOnly === '/api/etb-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        return send(res, 200, await etbSave(loc, b.state||{}, b.contactId||'', b.status||'started', { pdf: !!b.pdf }));
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
    if (req.method === 'POST' && pathOnly === '/api/will-save'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        return send(res, 200, await willSave(loc, b.state||{}, b.contactId||'', { pdf: !!b.pdf }));
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Load a saved funnel state for editing. Token-gated so a bare contactId can't read someone's data.
    if (req.method === 'GET' && pathOnly === '/api/state-load'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const tok=(new URL(req.url,'http://x')).searchParams.get('t')||'';
        const claims=verifyEdit(tok);
        if(!claims||!claims.loc||!claims.cid) return send(res,403,{error:'invalid or expired link'});
        const out=await loadState(claims.loc, claims.cid, claims.funnel||'etb');
        return send(res,200,{ ok:true, funnel:(claims.funnel||'etb'), contactId:claims.cid, state:out.state, contact:out.contact, found:out.found, files:out.files||[], filesRaw:out.filesRaw||[] });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // DEV ONLY: mint an edit token to test the edit flow. Disabled the moment EDIT_SECRET is set (production).
    if (req.method === 'GET' && pathOnly === '/api/_edit-token'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        if(process.env.EDIT_SECRET) return send(res,403,{error:'disabled in production'});
        const u=new URL(req.url,'http://x');
        const loc=(u.searchParams.get('locationId')||'').replace(/[^A-Za-z0-9]/g,'');
        const cid=(u.searchParams.get('contactId')||'').replace(/[^A-Za-z0-9]/g,'');
        const funnel=(u.searchParams.get('funnel')||'etb');
        if(!loc||!cid) return send(res,400,{error:'locationId and contactId required'});
        return send(res,200,{ token: signEdit({ loc:loc, cid:cid, funnel:funnel, exp: Date.now()+1000*60*60 }) });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    // Production mint: secret-gated (only Chris's login / a GHL workflow can call it). Returns a per-contact edit link.
    if (req.method === 'POST' && pathOnly === '/api/edit-link'){
      res.setHeader('Access-Control-Allow-Origin','*');
      try {
        const b = JSON.parse((await readBody(req)) || '{}');
        const secret = b.secret || req.headers['x-edit-secret'] || '';
        const need = process.env.EDIT_LINK_SECRET || (String(process.env.STRIPE_SECRET_KEY||'').indexOf('sk_test')===0 ? 'aiwills-dev-link-secret' : '');
        if (!need || secret !== need) return send(res, 403, { error: 'forbidden' });
        const loc = (b.locationId||'').replace(/[^A-Za-z0-9]/g,'');
        const cid = (b.contactId||'').replace(/[^A-Za-z0-9]/g,'');
        const funnel = (b.funnel==='wills')?'wills':'etb';
        if (!loc || !cid) return send(res, 400, { error: 'locationId and contactId required' });
        const ttl = Math.min(parseInt(b.ttlDays||30,10)||30, 90);
        const token = signEdit({ loc:loc, cid:cid, funnel:funnel, exp: Date.now()+ttl*24*3600*1000 });
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
        const funnel = (b.funnel==='wills')?'wills':'etb';
        const base = b.returnBase || '';
        if (!loc || !email) return send(res, 400, { error: 'locationId and email required' });
        (async function(){
          try {
            const c = await findContactByEmail(loc, email);
            if (!c || !c.id) return;
            const token = signEdit({ loc:loc, cid:c.id, funnel:funnel, exp: Date.now()+30*24*3600*1000 });
            if (!token) return;
            const url = base ? (base + (base.indexOf('?')>=0?'&':'?') + 'aw_t=' + encodeURIComponent(token)) : '';
            const wtoken = await getWriteToken(loc);
            const map = await etbFieldMap(wtoken, loc);
            let fid = map['edit link'];
            if (!fid){ try { const cf = await ghl('POST','/locations/'+loc+'/customFields',wtoken,{name:'Edit Link',dataType:'TEXT',model:'contact'}); const nf=cf.customField||cf; if(nf&&nf.id) fid=nf.id; }catch(e){} }
            if (fid) await ghl('PUT','/contacts/'+c.id, wtoken, { customFields: [{ id: fid, value: url }] });
            try { await ghl('POST','/contacts/'+c.id+'/tags', wtoken, { tags: ['send-edit-link'] }); }catch(e){}
          } catch(e){ console.error('edit-request', e.message); }
        })();
        return send(res, 200, { ok:true, message:'If that email is on file, a secure edit link is on its way.' });
      } catch(e){ return send(res, 200, { error: e.message }); }
    }
    if (!authed(req)){
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="AI Wills onboarding"' });
      return res.end('Authentication required.');
    }
    if (req.method === 'POST' && req.url === '/api/scrape'){
      const parsed = JSON.parse((await readBody(req)) || '{}');
      if (!parsed.url) return send(res, 400, { error: 'url required' });
      return send(res, 200, { values: await handleScrape(parsed.url) });
    }
    if (req.method === 'POST' && req.url === '/api/write'){
      const parsed = JSON.parse((await readBody(req)) || '{}');
      return send(res, 200, { results: await handleWrite(parsed.locationId, parsed.values) });
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
