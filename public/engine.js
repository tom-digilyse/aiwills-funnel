/* AI Wills funnel engine - hosted. GHL block only needs:
   <div id="aiwills-funnel" data-loc="{ {location.id} }"></div>
   <script src="https://aiwills.digilyse.co/engine.js"></script>
   This file injects the funnel, reads the sub-account id, fetches its brand, and renders. */
(function(){
  var API='https://aiwills.digilyse.co'; try{ if(document.currentScript&&document.currentScript.src){ API=new URL(document.currentScript.src, location.href).origin; } }catch(e){}
  var FONTS="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap";
  var CSS="\n:root{--primary:#444950;--primary-dark:#2f3338;--heading:#1B1D1F;--hdr-ink:#1B1D1F;--nav-ink:#1B1D1F;--body:#303133;--header-bg:#ffffff;--page-bg:#ffffff;--line:#e6e6e6;--muted:#6b6e72;--hf:Georgia,'Times New Roman',serif;--bf:Arial,sans-serif;--site-max:1200px;--nav-size:18px;--nav-weight:500;--logo-h:50px;--body-size:18px;--h-size:40px;--h-weight:900;--btn-weight:600;--footer-max:1140px;--btn-bg:var(--primary);--btn-hover:var(--primary-dark);--btn-ink:#fff;--btn-font:var(--bf);--btn-radius:180px;--ftr-bg:var(--heading);--ftr-ink:#fff}\n*{box-sizing:border-box}html,body{margin:0;padding:0;overflow-x:hidden}\n#aiwills-funnel{opacity:0}#aiwills-funnel.aw-ready{opacity:1;transition:opacity .12s}\nbody{background:var(--page-bg);color:var(--body);font-family:var(--bf);font-size:var(--body-size);line-height:1.7;-webkit-font-smoothing:antialiased}\nh1{font-family:var(--hf);font-weight:var(--h-weight);font-size:var(--h-size);line-height:1.2;color:var(--heading);margin:0 0 14px}\nh3{font-family:var(--hf);font-weight:900;color:var(--heading);margin:0 0 8px}\np{margin:0 0 1em}\n.hdr{background:var(--header-bg);border-bottom:1px solid var(--line);margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}\n.hwrap{max-width:var(--site-max);margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}\n.logo img{height:var(--logo-h);width:auto;display:block}.logo .wordmark{font-family:var(--hf);font-weight:900;font-size:22px;color:var(--hdr-ink)}\n.hdr nav{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;flex:1}\n.hdr nav a{font-family:var(--hf);font-weight:var(--nav-weight);font-size:var(--nav-size);color:var(--nav-ink);text-decoration:none;white-space:nowrap}\n.hdr nav a:hover{color:var(--primary)}\n.phone{font-weight:600;color:var(--hdr-ink);white-space:nowrap}\n@media(max-width:760px){.hdr nav{display:none}}@media(max-width:640px){.hwrap{padding:12px 16px;gap:10px;flex-wrap:wrap;justify-content:center}.mwrap{padding-left:16px;padding-right:16px}.prog{padding:16px 0 4px}.main{padding:10px 0 40px}h1{font-size:26px}.row{flex-direction:column;gap:12px}.choices{flex-direction:column}.choice{min-width:0;width:100%}input,select,textarea{font-size:16px}.btn{padding:15px 22px;font-size:16px}.navbtns{gap:10px}.fgrid{flex-direction:column;gap:22px}.fwrap{padding:26px 16px 32px}}\n.banner{background:#fff4f3;border-bottom:1px solid #f3c9c6;color:#7a1411;font-size:13px}\n.bwrap{max-width:760px;margin:0 auto;padding:8px 24px}\n.pwrap,.main .mwrap{max-width:760px;margin:0 auto;padding-left:24px;padding-right:24px}\n.prog{padding:26px 0 4px}\n.pmeta{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:8px}.pmeta strong{color:var(--heading);font-weight:600}\n.track{height:8px;border-radius:99px;background:#ececec;overflow:hidden}.track span{display:block;height:100%;background:var(--primary);width:0;transition:width .35s ease}\n.stepmenu{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.stepmenu:empty{display:none}.stepmenu button{font-family:var(--bf);font-size:12px;line-height:1;padding:6px 11px;border-radius:99px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:default;white-space:nowrap}.stepmenu button.done{color:var(--heading);cursor:pointer}.stepmenu button.done:hover{border-color:var(--primary);color:var(--primary)}.stepmenu button.on{background:var(--primary);border-color:var(--primary);color:var(--btn-ink);font-weight:600}@media(max-width:640px){.stepmenu{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}}\n.main{padding:14px 0 50px}\n.lead{color:var(--muted);margin:-.2em 0 1.4em;font-size:16px}\n.field{margin-bottom:18px}.field>label{display:block;font-weight:600;color:var(--heading);margin-bottom:6px;font-size:15px;font-family:var(--bf)}\n.opt{color:var(--muted);font-weight:400}\ninput,select,textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;font-family:var(--bf);font-size:15px;color:var(--body);outline:none}\ninput:focus,select:focus,textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent)}\ntextarea{min-height:96px;resize:vertical}\n.invalid input,.invalid select,.invalid textarea{border-color:var(--primary)}\n.err{color:var(--primary);font-size:13px;margin-top:5px;display:none}.invalid .err{display:block}\n.row{display:flex;gap:14px;flex-wrap:wrap}.row>.field{flex:1;min-width:180px}\n.choices{display:flex;gap:10px;flex-wrap:wrap}\n.choice{flex:1;min-width:120px;border:1px solid var(--line);border-radius:12px;padding:13px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;font-weight:500;background:#fff;font-family:var(--bf)}\n.choice.on{border-color:var(--primary);background:#f4f4f4;background:color-mix(in srgb,var(--primary) 8%,#fff)}.choice input{accent-color:var(--primary);width:18px;height:18px}\n.repitem{border:1px solid var(--line);border-radius:12px;padding:14px 14px 2px;margin-bottom:12px;background:#fff}\n.rephead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}\n.rm{background:none;border:none;color:var(--primary);font-weight:600;cursor:pointer;font-size:13px;font-family:var(--bf)}\n.add{background:#fff;border:1.5px dashed var(--primary);color:var(--primary);padding:12px 18px;border-radius:12px;font-weight:600;cursor:pointer;font-family:var(--bf);font-size:15px;width:100%}\n.empty{color:var(--muted);font-size:14px;padding:6px 0 12px}\n.tot{margin:8px 0 4px;font-size:14px;font-weight:600}.tot.ok{color:#157a3f}.tot.bad{color:var(--primary)}\n.sum{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px;background:#fff}\n.sum h3{display:flex;justify-content:space-between;align-items:center;font-size:18px}\n.edit{font-size:13px;font-weight:600;color:var(--primary);background:none;border:none;cursor:pointer;font-family:var(--bf)}\n.srow{display:flex;justify-content:space-between;gap:16px;padding:5px 0;border-top:1px solid #f0ece6;font-size:14px}.srow:first-of-type{border-top:none}\n.srow .k{color:var(--muted)}.srow .v{font-weight:500;text-align:right;color:var(--heading)}\n.navbtns{display:flex;justify-content:space-between;gap:12px;margin-top:30px}\n.btn{font-family:var(--btn-font);font-weight:var(--btn-weight);font-size:18px;border:none;cursor:pointer;border-radius:var(--btn-radius);padding:18px 44px;background:var(--btn-bg);color:var(--btn-ink)}\n.btn:hover{background:var(--btn-hover)}.btn.wide{width:100%}\n.btn.ghost{background:#fff;color:var(--heading);border:1px solid var(--line)}.btn.ghost:hover{border-color:#bbb}\n.mock{border:1px dashed var(--line);border-radius:14px;padding:24px;background:#fff;text-align:center}\n.price{font-family:var(--hf);font-weight:900;font-size:42px;color:var(--heading);margin:6px 0}\n.note{font-size:13px;color:var(--muted);margin-top:10px}\n.tick{width:64px;height:64px;border-radius:50%;background:#157a3f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 14px}\n.spin{width:46px;height:46px;border:4px solid #eee;border-top-color:var(--primary);border-radius:50%;margin:6px auto 14px;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}\n.ftr{background:var(--ftr-bg);border-top:3px solid var(--primary);margin-top:44px;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}\n.fwrap{max-width:var(--footer-max);margin:0 auto;padding:34px 24px 42px}\n.fgrid{display:flex;gap:40px;flex-wrap:wrap;justify-content:space-between;align-items:flex-start}.fgrid>div{flex:1;min-width:220px}\n.fh{font-family:var(--hf);font-weight:900;color:var(--ftr-ink);font-size:24px;margin:0 0 14px}\n.flinks{list-style:none;margin:0;padding:0}.flinks li{margin:0 0 9px}\n.flinks a{color:var(--ftr-ink);opacity:.88;font-size:15px;text-decoration:none}.flinks a:before{content:\"\\203A\";color:var(--primary);font-weight:700;margin-right:8px}\n.flinks a:hover{color:#fff}\n.fcta{font-family:var(--hf);font-weight:900;color:var(--ftr-ink);font-size:30px;line-height:1.18;margin:0 0 18px}\n.frule{border:none;border-top:1px solid #33363a;margin:28px 0 16px}\n.fsoc{margin:0 0 10px}.fsoc a{color:var(--ftr-ink);font-weight:600;font-size:13px;margin-right:14px;text-decoration:none}\n.fleg{font-size:11.5px;color:#8d9094;line-height:1.5;margin:0 0 6px}\n";
  var MARKUP="<header id=\"hdr\" class=\"hdr\"></header>\n<div class=\"pwrap\"><div class=\"prog\"><div class=\"pmeta\"><span id=\"stepName\"></span><strong id=\"stepCount\"></strong></div><div class=\"track\"><span id=\"bar\"></span></div><div class=\"stepmenu\" id=\"stepmenu\"></div></div></div>\n<main class=\"main\"><div class=\"mwrap\"><div id=\"step\"></div><div class=\"navbtns\"><button class=\"btn ghost\" id=\"back\" type=\"button\">Back</button><button class=\"btn\" id=\"next\" type=\"button\">Continue</button></div></div></main>\n<footer id=\"ftr\" class=\"ftr\"></footer>";
  try{h
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=FONTS; document.head.appendChild(l);
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    setTimeout(function(){ try{ var _mt=document.getElementById('aiwills-funnel'); if(_mt) _mt.classList.add('aw-ready'); }catch(e){} },900);
  }catch(e){}
  var mount=document.getElementById('aiwills-funnel') || document.body;
  mount.innerHTML=(String((window.AIWILLS_CONFIG||{}).funnel||'').toLowerCase()==='hub')?'':MARKUP;
  function scrapeLoc(){ try{ var h=document.documentElement.innerHTML; var fid=(location.pathname.match(/([A-Za-z0-9]{20})/)||[])[1]; if(fid){ var m=h.match(new RegExp('"'+fid+'","[^"]*","([A-Za-z0-9]{15,30})"')); if(m) return m[1]; } var m2=h.match(/"locationId":"([A-Za-z0-9]{15,30})"/); if(m2) return m2[1]; return ''; }catch(e){ return ''; } }
  function qp(n){ try{ var v=new URLSearchParams(location.search).get(n)||''; return (/[{}]/.test(v))?'':v; }catch(e){ return ''; } }
  var rootEl=document.getElementById('aiwills-funnel');
  var _dl=(rootEl&&rootEl.getAttribute('data-loc'))||''; if(/[{}]/.test(_dl))_dl='';
  var _dlw=!!(rootEl&&rootEl.getAttribute('data-loc-weak'));
  var _sc=''; try{_sc=scrapeLoc();}catch(e){}
  var _ll=''; try{ _ll=(document.cookie.match(/(?:^|; *)aw_last_loc=([A-Za-z0-9]{15,30})/)||[])[1]||''; }catch(e){}
  var _strong=_sc||qp('aw_loc')||((!_dlw)?_dl:'');
  var loc=_strong||_ll||_dl;
  try{ if(_strong) document.cookie='aw_last_loc='+_strong+';domain=.aiwills.co.uk;path=/;max-age=31536000;SameSite=Lax'; }catch(e){} try{ if(_sc&&_dl&&_sc!==_dl) console.warn('[aiwills] hard-coded data-loc '+_dl+' overridden by real funnel location '+_sc+'; set the loader to {{location.id}}'); }catch(e){}
  function run(){

var CFG = window.AIWILLS_CONFIG || {}; (function(){ var _m='{'+'{'; for(var _k in CFG){ if(typeof CFG[_k]==='string' && CFG[_k].indexOf(_m)>=0) CFG[_k]=''; } })();
  if(String((window.AIWILLS_CONFIG||{}).funnel||'').toLowerCase()==='hub'){ renderHub(); return; }
  try{ var _psf=String(CFG.plan_services||'').toLowerCase().split(',').map(function(x){return x.trim();}).filter(Boolean); var _fk=(function(){var f=String((CFG.funnel)||window.AIWILLS_FUNNEL||'').toLowerCase();return (f==='etb'||f==='lpa')?f:((f==='probate'||f==='referral')?'probate':'wills');})(); if(_psf.length && _psf.indexOf(_fk)<0){ mount.innerHTML='<div class="aw-ready" style="max-width:640px;margin:60px auto;padding:32px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:center;font-family:var(--bf)"><h3 style="font-family:var(--hf);color:var(--heading)">This service is not part of your plan</h3><p style="color:var(--muted)">Please speak to your adviser about adding it, or go back to your services page.</p></div>'; try{ mount.classList.add('aw-ready'); }catch(e){} return; } }catch(e){}
  function renderHub(){
    var enc=encodeURIComponent;
    try{ var hs=document.createElement('style'); hs.textContent='.hubwrap{max-width:var(--site-max);margin:0 auto;padding:34px 24px 60px}.hubh1{margin-bottom:6px}.hubgrid{display:flex;flex-wrap:wrap;gap:20px;margin-top:24px}.hubcard{flex:1 1 280px;min-width:260px;max-width:360px;border:1px solid var(--line);border-radius:16px;background:#fff;padding:24px;display:flex;flex-direction:column;gap:12px}.hubic{width:54px;height:54px;border-radius:12px;background:#f4f4f4;background:color-mix(in srgb,var(--icon,var(--primary)) 10%,#fff);color:var(--icon,var(--primary));display:flex;align-items:center;justify-content:center}.hubic svg{width:30px;height:30px}.hubcard h3{font-size:20px;margin:0;font-family:var(--hf)}.hubcard .hubdesc{color:var(--muted);font-size:14px;flex:1;margin:0}.hubcard .hubstatus{font-size:12px;font-weight:700;color:#157a3f}.hubcard .btn{width:100%;text-align:center;text-decoration:none;display:block;padding:13px}@media(max-width:640px){.hubgrid{flex-direction:column}.hubcard{max-width:none}}'; document.head.appendChild(hs); }catch(e){}
    var SVC=[
      {key:'wills',title:(CFG.wills_title||'Your Will'),blurb:(CFG.wills_blurb||'Create a clear, properly structured will and keep it up to date.'),url:(CFG.wills_url||'https://engine.aiwills.co.uk/wills-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 16h4"/></svg>'},
      {key:'lpa',title:(CFG.lpa_title||'Lasting Power of Attorney'),blurb:(CFG.lpa_blurb||'Appoint people you trust to make decisions for you if you ever cannot.'),url:(CFG.lpa_url||'https://engine.aiwills.co.uk/lpa-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5"/></svg>'},
      {key:'etb',title:(CFG.etb_title||'Executor Toolbox'),blurb:(CFG.etb_blurb||'A secure place for everything your executors will need to find.'),url:(CFG.etb_url||'https://engine.aiwills.co.uk/etb-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A3.5 3.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/></svg>'},
      {key:'probate',title:(CFG.probate_title||'Probate'),blurb:(CFG.probate_blurb||'Get a free, no-obligation fixed fee probate quote.'),url:(CFG.probate_url||'https://engine.aiwills.co.uk/probate-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-2 5a3.5 3.5 0 0 0 7 0L8 7"/><path d="M16 7l-2 5a3.5 3.5 0 0 0 7 0l-2-5"/></svg>'}
    ];
    try{ var _ps=String(CFG.plan_services||'').toLowerCase().split(',').map(function(x){return x.trim();}).filter(Boolean); if(_ps.length){ SVC=SVC.filter(function(s){ return _ps.indexOf(s.key)>=0; }); } else { SVC=SVC.filter(function(s){ return s.key!=='probate' || !!CFG.probate_url; }); } }catch(e){}
    mount.innerHTML='<header id="hdr" class="hdr"></header><main class="main"><div class="hubwrap"><h1 class="hubh1">Your documents</h1><p class="lead">Choose a service to get started, or open one you have already begun.</p><div class="hubgrid" id="hubgrid"></div></div></main><footer id="ftr" class="ftr"></footer>';
    try{ applyBrand(); }catch(e){} try{var _sm=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--site-max'))||1200; if(_sm<1120) document.documentElement.style.setProperty('--site-max','1120px');}catch(e){} try{ closeGaps(); }catch(e){} try{ window.addEventListener('load',function(){try{closeGaps();}catch(e){}}); setTimeout(function(){try{closeGaps();}catch(e){}},300); setTimeout(function(){try{closeGaps();}catch(e){}},1000); }catch(e){}
    var contact=(rootEl&&rootEl.getAttribute('data-contact'))||''; if(!contact||contact.indexOf('{'+'{')>=0) contact=qp('aw_c')||window.AIWILLS_CONTACT_ID||''; function withId(u){ if(!u) return u; var q=[]; if(loc)q.push('aw_loc='+enc(loc)); if(contact)q.push('aw_c='+enc(contact)); var _tk=qp('aw_t')||window.AIWILLS_TOKEN||''; if(_tk)q.push('aw_t='+enc(_tk)); if(!q.length) return u; return u+(u.indexOf('?')>=0?'&':'?')+q.join('&'); }
    function card(s,st){
      var done=st&&(st.paid||st.started);
      var btn;
      if(!s.url){ btn='<button class="btn ghost" type="button" disabled>Coming soon</button>'; }
      else if(st&&st.paid){ btn='<a class="btn ghost" target="_top" href="'+esc(withId(s.url))+'">Open / edit</a>'; }
      else if(done){ btn='<a class="btn" target="_top" href="'+esc(withId(s.url))+'">Continue</a>'; }
      else { btn='<a class="btn" target="_top" href="'+esc(withId(s.url))+'">Get started</a>'; }
      var badge=done?('<div class="hubstatus">'+(st.paid?'Purchased':'In progress')+'</div>'):'';
      return '<div class="hubcard"><div class="hubic">'+s.icon+'</div><h3>'+esc(s.title)+'</h3><p class="hubdesc">'+esc(s.blurb)+'</p>'+badge+btn+'</div>';
    }
    function localSt(){ var o={}; if(!loc) return o; ['wills','lpa','etb','probate'].forEach(function(k){ try{ if(localStorage.getItem('aw_draft_'+k+'_'+loc) || document.cookie.indexOf('aw_s_'+k+'_'+loc+'=1')>=0) o[k]={started:true,paid:false}; }catch(e){} }); return o; }
    function mergeSt(a,b){ var o={}; ['wills','lpa','etb','probate'].forEach(function(k){ var x=a[k]||{}, y=b[k]||{}; o[k]={ started:!!(x.started||y.started), paid:!!(x.paid||y.paid) }; }); return o; }
    function paint(st){ var g=el('hubgrid'); if(g) g.innerHTML=SVC.map(function(s){return card(s, st[s.key]);}).join(''); }
    paint(localSt());
    if(loc && contact){ fetch(API+'/api/hub-status?locationId='+enc(loc)+'&contactId='+enc(contact)).then(function(r){return r.json();}).then(function(j){ paint(mergeSt(localSt(),(j&&j.services)||{})); }).catch(function(){}); }
  }

/* Closest free Google font for a commercial/Adobe font, so the funnel falls to a near-match (not a generic serif) if the real font can't load (Typekit domain-lock, self-hosted). */
function closestFont(n){n=(n||'').split(',')[0].replace(/["']/g,'').trim().toLowerCase();var M={'proxima nova':['Montserrat',1],'proxima-nova':['Montserrat',1],'omnes':['Nunito Sans',1],'omnes-pro':['Nunito Sans',1],'gotham':['Montserrat',1],'gotham rounded':['Nunito',1],'avenir':['Nunito Sans',1],'avenir next':['Nunito Sans',1],'futura':['Jost',1],'futura pt':['Jost',1],'circular':['Mulish',1],'circular std':['Mulish',1],'brandon grotesque':['Montserrat',1],'sofia pro':['Mulish',1],'din':['Archivo',1],'din next':['Archivo',1],'helvetica':['Inter',1],'helvetica neue':['Inter',1],'neue haas grotesk':['Inter',1],'arial':['Arimo',1],'frutiger':['Inter',1],'univers':['Inter',1],'gill sans':['Lato',1],'trade gothic':['Archivo',1],'museo sans':['Mulish',1],'effra':['Mulish',1],'graphik':['Inter',1],'founders grotesk':['Inter',1],'apercu':['Inter',1],'maison neue':['Inter',1],'garamond':['EB Garamond',0],'adobe garamond':['EB Garamond',0],'caslon':['Libre Caslon Text',0],'adobe caslon':['Libre Caslon Text',0],'sabon':['PT Serif',0],'minion':['Source Serif 4',0],'minion pro':['Source Serif 4',0],'baskerville':['Libre Baskerville',0],'didot':['Playfair Display',0],'bodoni':['Playfair Display',0],'times':['PT Serif',0],'times new roman':['PT Serif',0],'georgia':['Gelasio',0],'freight text':['Lora',0],'chronicle':['Lora',0],'mercury':['Lora',0]};if(M[n])return {g:M[n][0],gen:M[n][1]?'sans-serif':'serif'};var s=/serif|garamond|caslon|times|georgia|baskerville|minion|sabon|didot|bodoni|playfair|merriweather|lora|roman|palatino|cambria|chronicle|freight|mercury|tiempos|canela|noe|cormorant|spectral|cardo|crimson|source serif|pt serif|noto serif|domine|bitter|prata|marcellus|forum|eb garamond|libre caslon/.test(n);return {g:'',gen:s?'serif':'sans-serif'};}
function estack(name,def){var nm=name||def||'';if(!nm)return '';var s=closestFont(nm);var sub=(s.g&&s.g.toLowerCase()!==nm.toLowerCase())?(',"'+s.g+'"'):'';return '"'+nm+'"'+sub+','+s.gen;}
function wt(s){return {Light:'300',Normal:'400',Medium:'500',Semibold:'600',Bold:'700',Black:'900'}[s]||'';}
/* Load the client's fonts: captured stylesheet links (Adobe Typekit, Google, etc.) + a Google css2 request per named family AND its closest free match (each isolated). */
(function(){ try{ var _seen={}, _add=function(u){ if(u&&!_seen[u]){ _seen[u]=1; var l=document.createElement('link'); l.rel='stylesheet'; l.href=u; document.head.appendChild(l); } }; var _caps=[]; try{ _caps=JSON.parse(CFG.font_css_links||'[]'); }catch(e){ _caps=[]; } _caps.forEach(_add); var _addFam=function(g){ g=(g||'').split(',')[0].replace(/["']/g,'').trim(); if(!g||/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|-apple-system|blinkmacsystemfont|segoe ui|georgia|arial|helvetica|times new roman|times|verdana|tahoma)$/i.test(g)) return; _add('https://fonts.googleapis.com/css2?family='+g.replace(/ /g,'+')+':wght@400;500;600;700;900&display=swap'); }; [CFG.heading_font,CFG.body_font,CFG.button_font].forEach(function(f){ _addFam(f); _addFam(closestFont(f).g); }); }catch(e){} })();
function el(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function awSafeHtml(html){ try{ var d=document.createElement('div'); d.innerHTML=String(html||''); var AL={A:1,B:1,STRONG:1,I:1,EM:1,U:1,SPAN:1,P:1,BR:1,DIV:1,UL:1,OL:1,LI:1}, RM={SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1,LINK:1,META:1,SVG:1,NOSCRIPT:1}, AT={href:1,target:1,rel:1}; (function w(node){ [].slice.call(node.children).forEach(function(n){ if(RM[n.tagName]){ n.parentNode.removeChild(n); return; } w(n); if(!AL[n.tagName]){ var f=document.createDocumentFragment(); while(n.firstChild) f.appendChild(n.firstChild); n.parentNode.replaceChild(f,n); return; } [].slice.call(n.attributes).forEach(function(a){ var nm=a.name.toLowerCase(); if(!AT[nm]){ n.removeAttribute(a.name); return; } if(nm==='href'&&/^\s*javascript:/i.test(a.value)) n.removeAttribute('href'); }); if(n.tagName==='A'&&n.getAttribute('href')){ n.setAttribute('target','_blank'); n.setAttribute('rel','noopener'); } }); })(d); return d.innerHTML; }catch(e){ return ''; } }
function fmtPrice(p){ p=String(p==null?'':p).trim(); if(!p) return p; return /^[0-9]+([.][0-9]{1,2})?$/.test(p)?('\u00a3'+p):p; }
function age(d){ if(!d) return null; var t=new Date(d); if(isNaN(t)) return null; var n=new Date(), a=n.getFullYear()-t.getFullYear(), m=n.getMonth()-t.getMonth(); if(m<0||(m===0&&n.getDate()<t.getDate())) a--; return a; }
function saveToGhl(state, opts){ var _pdf=!!(opts&&opts.pdf); try{ if(FUNNEL===REFERRAL_FUNNEL){ if(!loc) return; try{ fetch(API+'/api/referral-save',{method:'POST',body:JSON.stringify({locationId:loc,contactId:(window.AIWILLS_CONTACT_ID||''),state:state,key:FUNNEL_KEY,status:((opts&&opts.submitted)?'submitted':'started')})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_CONTACT_ID=j.contactId; }).catch(function(){}); }catch(e){} return; } }catch(e){} try{ if(FUNNEL===ETB_FUNNEL){ if(!loc) return; var st=(state.payment&&state.payment.paid)?'paid':'started'; try{ fetch(API+'/api/etb-save',{method:'POST',body:JSON.stringify({locationId:loc,state:state,status:st,contactId:(window.AIWILLS_ETB_CID||''),pdf:_pdf})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_ETB_CID=j.contactId; }).catch(function(){}); }catch(e){} return; } }catch(e){} try{ if(FUNNEL===LPA_FUNNEL){ if(!loc) return; try{ fetch(API+'/api/lpa-save',{method:'POST',body:JSON.stringify({locationId:loc,contactId:(window.AIWILLS_CONTACT_ID||''),state:state,pdf:_pdf})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_CONTACT_ID=j.contactId; }).catch(function(){}); }catch(e){} return; } }catch(e){} var p=state.personal||{}; if(loc){ try{ fetch(API+'/api/will-save',{method:'POST',body:JSON.stringify({locationId:loc,contactId:(window.AIWILLS_CONTACT_ID||''),state:state,pdf:_pdf})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_CONTACT_ID=j.contactId; }).catch(function(){}); }catch(e){} } var url=CFG.will_save_webhook_url; if(url){ try{ fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:(window.AIWILLS_CONTACT_ID||''),email:p.email||'',firstName:p.firstName||'',lastName:p.lastName||'',phone:p.phone||'',status:(state.payment&&state.payment.paid)?'paid':'started',willJson:JSON.stringify(state)})}); }catch(e){} } }

var REL_DEFAULT=['Spouse','Civil Partner','Partner','Son','Daughter','Stepchild','Grandchild','Parent','Grandparent','Brother','Sister','Aunt','Uncle','Niece','Nephew','Cousin','Friend'];
function relOpts(){ try{ var c=JSON.parse((window.AIWILLS_CONFIG||{}).relationship_options_json||'null'); if(Array.isArray(c)&&c.length) return c; }catch(e){} return REL_DEFAULT; }
var GIFT_FIELDS = [
  { key:'items', type:'repeater', itemLabel:'Item gift', max:20, fields:[
    { key:'description', type:'text', label:'What is the item?', required:true },
    { key:'recipientRelationship', type:'select', options:relOpts, label:'Their relationship to you', required:true },
    { type:'row', fields:[ {key:'recipientName',type:'text',label:'Recipient name',required:true}, {key:'recipientAddress',type:'text',label:'Recipient address (line 1)',required:true} ] },
    { type:'row', fields:[ {key:'recipientCity',type:'text',label:'Town / city',required:true}, {key:'recipientPostcode',type:'text',label:'Postcode',required:true} ] }
  ]},
  { key:'cash', type:'repeater', itemLabel:'Cash gift', max:20, fields:[
    { type:'row', fields:[ {key:'amount',type:'number',label:'Amount (£)',required:true}, {key:'beneficiaryRelationship',type:'select',options:relOpts,label:'Their relationship to you',required:true} ] },
    { type:'row', fields:[ {key:'beneficiaryName',type:'text',label:'Beneficiary name',required:true}, {key:'beneficiaryAddress',type:'text',label:'Beneficiary address (line 1)',required:true} ] },
    { type:'row', fields:[ {key:'beneficiaryCity',type:'text',label:'Town / city',required:true}, {key:'beneficiaryPostcode',type:'text',label:'Postcode',required:true} ] }
  ]},
  { key:'charities', type:'repeater', itemLabel:'Charitable donation', max:20, fields:[
    { type:'row', fields:[ {key:'name',type:'text',label:'Charity name',required:true}, {key:'number',type:'text',label:'Charity number'} ] },
    { key:'amount', type:'number', label:'Amount (£)', required:true }
  ]},
  { key:'pets', type:'repeater', itemLabel:'Gift for pets', max:20, fields:[
    { type:'row', fields:[ {key:'description',type:'text',label:'Pet(s) name / description',required:true}, {key:'amount',type:'number',label:'Amount (£)',required:true} ] },
    { key:'guardian', type:'text', label:'Who will care for them?', required:true }
  ]}
];
function pYes(s){ return s.partner.hasPartner==='Yes'; }
function cYes(s){ return s.children.hasChildren==='Yes'; }
function mirrorOn(s){ return s.partner.hasPartner==='Yes' && s.partner.mirrorWill==='Yes'; }
function giftItems(showIf){ return GIFT_FIELDS.map(function(g){ var c={}; for(var k in g) c[k]=g[k]; if(showIf) c.showIf=showIf; return c; }); }

var WILLS_FUNNEL = [
  { id:'personal', name:'Your details', title:'Your personal details', lead:'We start with you, the person making the will.', fields:[
    { key:'title', type:'select', label:'Title', required:true, options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
    { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'middleName',type:'text',label:'Middle name(s)'} ] },
    { key:'lastName', type:'text', label:'Last name', required:true },
    { key:'akaHas', type:'radio', label:'Do you go by any other names?', required:true, reflow:true, options:['Yes','No'] },
    { type:'row', showIf:function(s){return s.personal.akaHas==='Yes';}, fields:[ {key:'akaFirstName',type:'text',label:'Other first name',required:true}, {key:'akaLastName',type:'text',label:'Other last name',required:true} ] },
    { key:'address', type:'text', label:'Home address', required:true },
    { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'county',type:'text',label:'County'} ] },
    { key:'postcode', type:'text', label:'Postcode', required:true },
    { type:'row', fields:[ {key:'email',type:'email',label:'Email',required:true}, {key:'phone',type:'tel',label:'Phone',required:true} ] },
    { key:'dob', type:'date', label:'Date of birth', required:true }
  ]},
  { id:'partner', name:'Partner', title:'Your spouse or partner', lead:'Add a spouse, partner or civil partner if you want to include them.', fields:[
    { key:'hasPartner', type:'radio', label:'Do you have a spouse, partner or civil partner?', required:true, reflow:true, options:['Yes','No'] },
    { type:'row', showIf:pYes, fields:[ {key:'firstName',type:'text',label:'Their first name',required:true}, {key:'lastName',type:'text',label:'Their last name',required:true} ] },
    { key:'status', type:'select', label:'Your status together', required:true, options:['Married','Civil partnership','Partner'], showIf:pYes },
    { key:'dob', type:'date', label:'Their date of birth', required:true, showIf:pYes },
    { key:'address', type:'text', label:'Their address (line 1)', required:true, showIf:pYes },
    { type:'row', showIf:pYes, fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] },
    { key:'phone', type:'tel', label:'Their contact number', required:true, showIf:pYes },
    { key:'akaHas', type:'radio', label:'Do they go by any other names?', required:true, reflow:true, options:['Yes','No'], showIf:pYes },
    { type:'row', showIf:function(s){return s.partner.hasPartner==='Yes'&&s.partner.akaHas==='Yes';}, fields:[ {key:'akaFirstName',type:'text',label:'Their other first name',required:true}, {key:'akaLastName',type:'text',label:'Their other last name',required:true} ] },
    { key:'mirrorWill', type:'radio', label:'Prepare a mirror will for them alongside yours?', required:true, options:['Yes','No'], showIf:pYes }
  ]},
  { id:'situation', name:'Circumstances', title:'Your circumstances', lead:'A few questions that affect how your will is written.', fields:[
    { key:'domicileElsewhere', type:'radio', label:'Do you consider anywhere other than England or Wales your permanent home?', required:true, reflow:true, options:['Yes','No'] },
    { key:'domicileCountry', type:'text', label:'Which country do you consider your permanent home?', required:true, showIf:function(s){return s.situation.domicileElsewhere==='Yes';} },
    { key:'propertyAbroad', type:'radio', label:'Do you own any property abroad?', required:true, reflow:true, options:['Yes','No'] },
    { key:'propertyAbroadCountry', type:'text', label:'Which country is the property in?', required:true, showIf:function(s){return s.situation.propertyAbroad==='Yes';} },
    { key:'previousWillHas', type:'radio', label:'Do you have a previous will?', required:true, reflow:true, options:['Yes','No'] },
    { key:'previousWillFirm', type:'text', label:'Which law firm or company drafted it?', required:true, showIf:function(s){return s.situation.previousWillHas==='Yes';} }
  ]},
  { id:'children', name:'Children', title:'Your children', lead:'This decides guardianship and how your children share in your estate.', fields:[
    { key:'hasChildren', type:'radio', label:'Do you have children?', required:true, reflow:true, options:['Yes','No'] },
    { key:'count', type:'select', label:'How many children do you have?', required:true, options:['1','2','3','4','5','6 or more'], showIf:cYes },
    { key:'anyUnder18', type:'radio', label:'Are any of your children under 18?', required:true, options:['Yes','No'], showIf:cYes },
    { key:'appointGuardians', type:'radio', label:'Do you wish to appoint guardians for your children?', required:true, reflow:true, options:['Yes','No'], showIf:cYes }
  ]},
  { id:'guardian', name:'Guardians', title:'Guardianship', lead:'Name who would care for your children, and an optional substitute.',
    showIf:function(s){ return s.children.hasChildren==='Yes' && s.children.appointGuardians==='Yes'; },
    fields:[
      { type:'row', fields:[ {key:'firstName',type:'text',label:'Guardian first name',required:true}, {key:'lastName',type:'text',label:'Guardian last name',required:true} ] },
      { key:'relationship', type:'select', options:relOpts, label:'Relationship to your children', required:true },
      { key:'address', type:'text', label:'Guardian address (line 1)', required:true },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] },
      { key:'subHas', type:'radio', label:'Add a substitute guardian?', required:true, reflow:true, options:['Yes','No'] },
      { type:'row', showIf:function(s){return s.guardian.subHas==='Yes';}, fields:[ {key:'subFirstName',type:'text',label:'Substitute first name',required:true}, {key:'subLastName',type:'text',label:'Substitute last name',required:true} ] },
      { key:'subRelationship', type:'select', options:relOpts, label:'Substitute relationship', required:true, showIf:function(s){return s.guardian.subHas==='Yes';} },
      { key:'subAddress', type:'text', label:'Substitute address (line 1)', required:true, showIf:function(s){return s.guardian.subHas==='Yes';} },
      { type:'row', showIf:function(s){return s.guardian.subHas==='Yes';}, fields:[ {key:'subCity',type:'text',label:'Town / city',required:true}, {key:'subPostcode',type:'text',label:'Postcode',required:true} ] }
    ] },
  { id:'executors', name:'Executors', title:'Your executors', lead:'Executors carry out your wishes. You can name up to four.', fields:[
    { key:'list', type:'repeater', itemLabel:'Executor', required:true, max:4, emptyMsg:'Add at least one executor.', fields:[
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'relationship', type:'select', options:relOpts, label:'Relationship to you', required:true },
      { key:'address', type:'text', label:'Address (line 1)', required:true },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] }
    ]}
  ]},
  { id:'gifts', name:'Gifts', title:'Gifts and legacies', lead:'Leave specific items, cash sums, charity donations or gifts for pets. All optional.',
    fields:[ { key:'has', type:'radio', label:'Do you want to leave any specific gifts or donations?', required:true, reflow:true, options:['Yes','No'] } ].concat(giftItems(function(s){return s.gifts.has==='Yes';})) },
  { id:'mirrorGifts', name:'Their gifts', title:'Gifts in their mirror will', lead:'Specific gifts and donations for your partner’s will. All optional.',
    showIf:mirrorOn, fields:giftItems(null) },
  { id:'residual', name:'Residual estate', title:'The rest of your estate', lead:'Everything left after gifts, debts and taxes.', fields:[
    { key:'distribution', type:'select', label:'How should the rest of your estate be distributed?', required:true, reflow:true, options:function(s){
        var hp=s.partner.hasPartner==='Yes', hc=s.children.hasChildren==='Yes';
        var all=[
          ['All to my spouse/partner, then equally between my children', hp&&hc],
          ['To be shared equally between my children only', hc],
          ['All to my spouse/partner', hp],
          ['To my spouse/partner then to those who I have listed below', hp],
          ['Between other persons who are listed below', true]
        ];
        return all.filter(function(o){return o[1];}).map(function(o){return o[0];});
      } },
    { key:'includeStepChildren', type:'radio', label:'Should “my children” include your stepchildren?', required:true, options:['Yes','No'],
      showIf:function(s){ var d=s.residual.distribution; return s.children.hasChildren==='Yes' && (d==='All to my spouse/partner, then equally between my children'||d==='To be shared equally between my children only'); } },
    { key:'beneficiaries', type:'repeater', itemLabel:'Beneficiary', required:true, max:20, total:{ key:'share', equals:100, suffix:'%', label:'Total allocated' },
      showIf:function(s){ var d=s.residual.distribution; return d==='To my spouse/partner then to those who I have listed below'||d==='Between other persons who are listed below'; },
      fields:[
        { type:'row', fields:[ {key:'name',type:'text',label:'Full name',required:true}, {key:'share',type:'number',label:'Share %',required:true,reflow:true} ] },
        { key:'relationship', type:'select', options:relOpts, label:'Relationship to you', required:true },
        { key:'address', type:'text', label:'Address (line 1)', required:true },
        { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] }
      ] },
    { key:'ageOfBenefit', type:'select', label:'At what age should beneficiaries inherit?', required:false, options:['18','21','25'], showIf:function(){return false;} }
  ]},
  { id:'funeral', name:'Funeral', title:'Funeral wishes', lead:'Your wishes, to guide your executors and family.', fields:[
    { key:'arrangements', type:'select', label:'Would you prefer to be buried or cremated?', required:true, options:['Buried','Cremated','No preference'] },
    { key:'music', type:'text', label:'Any specific music?' },
    { key:'additional', type:'textarea', label:'Any readings or additional requirements?' },
    { key:'planHas', type:'radio', label:'Do you have a funeral plan?', required:true, reflow:true, options:['Yes','No'] },
    { key:'planDetails', type:'text', label:'Funeral plan details', required:true, showIf:function(s){return s.funeral.planHas==='Yes';} },
    { key:'organDonation', type:'radio', label:'Do you wish to donate your organs?', required:true, options:['Yes','No'] }
  ]},
  { id:'mirrorFuneral', name:'Their funeral', title:'Their funeral wishes', lead:'Funeral wishes for your partner’s mirror will.',
    showIf:mirrorOn, fields:[
    { key:'arrangements', type:'select', label:'Buried or cremated?', required:true, options:['Buried','Cremated','No preference'] },
    { key:'location', type:'text', label:'Where would they like the funeral to take place?' },
    { key:'music', type:'text', label:'Any specific music?' },
    { key:'readings', type:'text', label:'Any specific readings?' },
    { key:'planHas', type:'radio', label:'Do they have a funeral plan?', required:true, options:['Yes','No'] },
    { key:'organDonation', type:'radio', label:'Do they wish to donate their organs?', required:true, options:['Yes','No'] }
  ]},
  { id:'review', name:'Review', title:'Review your will', lead:'Check everything below. You can jump back to any section to edit, then continue to payment.', kind:'review' },
  { id:'payment', name:'Payment', title:'Payment', lead:'Secure card payment to generate your will.', kind:'payment' },
  { id:'generate', name:'Generate', title:'Your will', kind:'generate' }
];

/* Executor Toolbox funnel: a paid digital vault. Replaces the 51-page GHL funnel.
   Per-category "do you have any X?" radios gate a repeater; "add another" is the repeater itself. */
var ETB_FUNNEL = [
  { id:'your_details', name:'Your details', title:'Your details', lead:'We start with you. This toolbox belongs to you.', fields:[
    { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
    { type:'row', fields:[ {key:'email',type:'email',label:'Email',required:true}, {key:'phone',type:'tel',label:'Phone',required:true} ] },
    { key:'address', type:'text', label:'Home address', required:true },
    { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] }
  ]},
  { id:'executors', name:'Executors', title:'Your executors', lead:'The people who will carry out your wishes. Add up to four.', fields:[
    { key:'list', type:'repeater', itemLabel:'Executor', required:true, max:4, emptyMsg:'Add at least one executor.', fields:[
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { type:'row', fields:[ {key:'phone',type:'tel',label:'Phone'}, {key:'email',type:'email',label:'Email'} ] },
      { key:'relationship', type:'select', options:relOpts, label:'Relationship to you' }
    ]}
  ]},
  { id:'will', name:'Will', title:'Your will', lead:'Where your will is and how to find it.', fields:[
    { key:'has', type:'radio', label:'Do you have a will?', required:true, reflow:true, options:['Yes','No'] },
    { key:'locationType', type:'select', label:'Where is it kept?', options:['At home','With my solicitor','At the bank','With a will-storage service','Other'], showIf:function(s){return s.will.has==='Yes';} },
    { key:'locationText', type:'text', label:'Where exactly is it located?', showIf:function(s){return s.will.has==='Yes';} },
    { key:'document', type:'file', label:'Upload a copy of your will (optional)', field:'ETB Will Document', accept:'.pdf,.doc,.docx,.jpg,.jpeg,.png', showIf:function(s){return s.will.has==='Yes';} }
  ]},
  { id:'codicil', name:'Codicil', title:'Codicil', lead:'A codicil is an amendment to a will.', fields:[
    { key:'has', type:'radio', label:'Do you have a codicil?', required:true, reflow:true, options:['Yes','No'] },
    { key:'locationType', type:'select', label:'Where is it kept?', options:['At home','With my solicitor','At the bank','With a will-storage service','Other'], showIf:function(s){return s.codicil.has==='Yes';} },
    { key:'locationText', type:'text', label:'Where exactly is it located?', showIf:function(s){return s.codicil.has==='Yes';} },
    { key:'document', type:'file', label:'Upload a copy of the codicil (optional)', field:'ETB Codicil Document', accept:'.pdf,.doc,.docx,.jpg,.jpeg,.png', showIf:function(s){return s.codicil.has==='Yes';} }
  ]},
  { id:'lpa', name:'LPA', title:'Lasting Power of Attorney', lead:'Any LPA you have in place.', fields:[
    { key:'has', type:'radio', label:'Do you have a Lasting Power of Attorney?', required:true, reflow:true, options:['Yes','No'] },
    { key:'type', type:'select', label:'Which type?', options:['Health & Welfare','Property & Financial Affairs','Both'], showIf:function(s){return s.lpa.has==='Yes';} },
    { key:'locationText', type:'text', label:'Where is it located?', showIf:function(s){return s.lpa.has==='Yes';} },
    { key:'document', type:'file', label:'Upload a copy of the LPA (optional)', field:'ETB LPA Document', accept:'.pdf,.doc,.docx,.jpg,.jpeg,.png', showIf:function(s){return s.lpa.has==='Yes';} }
  ]},
  { id:'property', name:'Property', title:'Property', lead:'The properties you own, and where the deeds are kept.', fields:[
    { key:'has', type:'radio', label:'Do you own any property?', required:true, reflow:true, options:['Yes','No'] },
    { key:'deedsLocation', type:'text', label:'Where are your property deeds kept?', showIf:function(s){return s.property.has==='Yes';} },
    { key:'deedsNotes', type:'textarea', label:'Any notes about the deeds?', showIf:function(s){return s.property.has==='Yes';} },
    { key:'list', type:'repeater', itemLabel:'Property', max:5, showIf:function(s){return s.property.has==='Yes';}, fields:[
      { key:'address', type:'text', label:'Property address', required:true },
      { key:'ownership', type:'select', label:'Ownership type', required:true, options:['Sole','Joint Tenants','Tenants in Common'] },
      { key:'hasMortgage', type:'radio', label:'Is there a mortgage?', required:true, reflow:true, options:['Yes','No'] },
      { key:'mortgageProvider', type:'text', label:'Mortgage provider', showIf:function(s,b){return getP(b+'.hasMortgage')==='Yes';} }
    ]}
  ]},
  { id:'insurance', name:'Insurance', title:'Insurance policies', lead:'Life insurance and other policies your executors should know about.', fields:[
    { key:'has', type:'radio', label:'Do you have any insurance policies?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Policy', max:5, showIf:function(s){return s.insurance.has==='Yes';}, fields:[
      { key:'type', type:'text', label:'Type of policy', required:true },
      { type:'row', fields:[ {key:'provider',type:'text',label:'Provider',required:true}, {key:'policyNumber',type:'text',label:'Policy number'} ] },
      { key:'location', type:'text', label:'Where are the policy documents kept?' }
    ]}
  ]},
  { id:'pensions', name:'Pensions', title:'Pensions', lead:'Your pensions, the documents and providers.', fields:[
    { key:'has', type:'radio', label:'Do you have any pensions?', required:true, reflow:true, options:['Yes','No'] },
    { key:'docsLocation', type:'text', label:'Where are your pension documents kept?', showIf:function(s){return s.pensions.has==='Yes';} },
    { key:'docsNotes', type:'textarea', label:'Any notes about your pensions?', showIf:function(s){return s.pensions.has==='Yes';} },
    { key:'documents', type:'file', label:'Upload pension documents (optional)', field:'ETB Pension Documents', accept:'.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.csv', showIf:function(s){return s.pensions.has==='Yes';} },
    { key:'list', type:'repeater', itemLabel:'Pension', max:5, showIf:function(s){return s.pensions.has==='Yes';}, fields:[
      { type:'row', fields:[ {key:'type',type:'text',label:'Pension type',required:true}, {key:'provider',type:'text',label:'Provider',required:true} ] },
      { type:'row', fields:[ {key:'policyNumber',type:'text',label:'Policy number'}, {key:'value',type:'number',label:'Approx value (£)'} ] },
      { key:'access', type:'text', label:'Where can this be accessed, or who manages it?' }
    ]}
  ]},
  { id:'bank_accounts', name:'Bank accounts', title:'Bank accounts & savings', lead:'Accounts and savings your executors will need to deal with.', fields:[
    { key:'has', type:'radio', label:'Do you have bank accounts or savings?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Account', max:5, showIf:function(s){return s.bank_accounts.has==='Yes';}, fields:[
      { type:'row', fields:[ {key:'type',type:'text',label:'Account type',required:true}, {key:'bankName',type:'text',label:'Bank name',required:true} ] },
      { type:'row', fields:[ {key:'accountNumber',type:'text',label:'Account number'}, {key:'holder',type:'text',label:'Account holder name'} ] },
      { key:'stored', type:'text', label:'Where are the banking details stored?' }
    ]}
  ]},
  { id:'investments', name:'Investments', title:'Investments', lead:'Shares, funds and other investments.', fields:[
    { key:'has', type:'radio', label:'Do you have any investments?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Investment', max:5, showIf:function(s){return s.investments.has==='Yes';}, fields:[
      { type:'row', fields:[ {key:'type',type:'text',label:'Type',required:true}, {key:'provider',type:'text',label:'Provider / platform',required:true} ] },
      { type:'row', fields:[ {key:'value',type:'number',label:'Approx value (£)'}, {key:'reference',type:'text',label:'Reference / account number'} ] },
      { key:'location', type:'text', label:'Where are the details kept?' }
    ]}
  ]},
  { id:'business', name:'Business', title:'Business interests', lead:'Any business you own or hold shares in.', fields:[
    { key:'has', type:'radio', label:'Do you own or have shares in a business?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Business', max:3, showIf:function(s){return s.business.has==='Yes';}, fields:[
      { type:'row', fields:[ {key:'name',type:'text',label:'Business name',required:true}, {key:'role',type:'text',label:'Your role',required:true} ] },
      { key:'keyContact', type:'text', label:'Key contact person' }
    ]}
  ]},
  { id:'debts', name:'Debts', title:'Debts', lead:'Debts your executors should know about.', fields:[
    { key:'has', type:'radio', label:'Do you have any debts your executors should know about?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Debt', max:5, showIf:function(s){return s.debts.has==='Yes';}, fields:[
      { type:'row', fields:[ {key:'creditor',type:'text',label:'Creditor name',required:true}, {key:'creditorType',type:'text',label:'Creditor type'} ] },
      { type:'row', fields:[ {key:'balance',type:'number',label:'Approx balance (£)'}, {key:'location',type:'text',label:'Where are the account details?'} ] }
    ]}
  ]},
  { id:'digital_assets', name:'Digital assets', title:'Digital assets', lead:'Online accounts your executors may need to access.', fields:[
    { key:'has', type:'radio', label:'Do you have digital accounts your executors should access?', required:true, reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Digital asset', max:5, showIf:function(s){return s.digital_assets.has==='Yes';}, fields:[
      { key:'platform', type:'text', label:'Platform or account name', required:true },
      { key:'access', type:'text', label:'Access method' },
      { key:'location', type:'text', label:'Where are the access details kept?' }
    ]}
  ]},
  { id:'wishes', name:'Wishes', title:'Funeral wishes', lead:'Your funeral wishes, to guide your executors and family.', fields:[
    { key:'record', type:'radio', label:'Would you like to record funeral wishes?', required:true, reflow:true, options:['Yes','No'] },
    { key:'arrangements', type:'select', label:'Burial or cremation?', options:['Buried','Cremated','No preference'], showIf:function(s){return s.wishes.record==='Yes';} },
    { key:'preferences', type:'textarea', label:'Preferences', showIf:function(s){return s.wishes.record==='Yes';} },
    { key:'planProvider', type:'text', label:'Funeral plan provider', showIf:function(s){return s.wishes.record==='Yes';} },
    { key:'docsLocation', type:'text', label:'Where are the funeral documents kept?', showIf:function(s){return s.wishes.record==='Yes';} }
  ]},
  { id:'review', name:'Review', title:'Review your toolbox', lead:'Check everything below. You can jump back to any section to edit, then continue to activate your Toolbox.', kind:'review' },
  { id:'payment', name:'Activate', title:'Activate your Toolbox', lead:'Subscribe to keep your Executor Toolbox secure and available to your executors.', kind:'payment' },
  { id:'done', name:'Done', title:'Your Toolbox is active', kind:'done' }
];

var LPA_FUNNEL = [
  { id:'your_details', name:'Your details', title:'Your details (the donor)', lead:'The LPA is made by you, the donor. We start with your details.', fields:[
    { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
    { type:'row', fields:[ {key:'email',type:'email',label:'Email',required:true}, {key:'phone',type:'tel',label:'Phone',required:true} ] },
    { key:'address', type:'text', label:'Home address', required:true },
    { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] },
    { key:'dob', type:'date', label:'Date of birth', required:true }
  ]},
  { id:'attorneys', name:'Attorneys', title:'Your attorneys', lead:'The people you appoint to make decisions. Add up to four, each with an optional replacement.', fields:[
    { key:'list', type:'repeater', itemLabel:'Attorney', required:true, max:4, emptyMsg:'Add at least one attorney.', fields:[
      { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'dob', type:'date', label:'Date of birth', required:true },
      { key:'address', type:'text', label:'Address line 1', required:true },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] },
      { type:'row', fields:[ {key:'phone',type:'tel',label:'Phone'}, {key:'email',type:'email',label:'Email'} ] },
      { key:'relationship', type:'select', options:relOpts, label:'Relationship to donor', required:true },
      { key:'isTrustCorp', type:'radio', label:'Is this attorney a trust corporation? (rare - usually No)', reflow:true, options:['No','Yes'] },
      { key:'companyRegNumber', type:'text', label:'Company registration number', showIf:function(s,b){return getP(b+'.isTrustCorp')==='Yes';} },
      { key:'hasReplacement', type:'radio', label:'Add a replacement attorney for this person?', reflow:true, options:['Yes','No'] },
      { key:'repTitle', type:'select', label:'Replacement title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'], showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repFirstName', type:'text', label:'Replacement first name', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repLastName', type:'text', label:'Replacement last name', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repAddress', type:'text', label:'Replacement address line 1', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repCity', type:'text', label:'Replacement town / city', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repPostcode', type:'text', label:'Replacement postcode', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repDob', type:'date', label:'Replacement date of birth', showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} }
    ]}
  ]},
  { id:'lpa_type', name:'LPA type', title:'Which LPA would you like?', lead:'You can make one or both types.', fields:[
    { key:'type', type:'radio', label:'LPA type', required:true, reflow:true, options:['Property & Financial Affairs','Health & Welfare','Both'] }
  ]},
  { id:'decisions', name:'Decisions', title:'How should attorneys make decisions?', fields:[
    { key:'mode', type:'radio', label:'How should attorneys act?', required:true, reflow:true, options:['Jointly (all must agree)','Jointly and severally (together or independently)','Jointly for some, severally for others'] },
    { key:'mixedDetail', type:'textarea', label:'Which decisions must be made jointly?', showIf:function(s){return s.decisions.mode==='Jointly for some, severally for others';} }
  ]},
  { id:'treatment', name:'Treatment', title:'Life-sustaining treatment', lead:'Health & Welfare only.', showIf:function(s){var t=s.lpa_type.type; return t==='Health & Welfare'||t==='Both';}, fields:[
    { key:'lifeSustaining', type:'radio', label:'Do you want your attorneys to be able to make decisions about life-sustaining treatment?', required:true, options:['Yes','No'] }
  ]},
  { id:'preferences', name:'Preferences', title:'Preferences & instructions', fields:[
    { key:'hasPreferences', type:'radio', label:'Do you want to include any preferences?', reflow:true, options:['Yes','No'] },
    { key:'preferences', type:'textarea', label:'Your preferences', showIf:function(s){return s.preferences.hasPreferences==='Yes';} },
    { key:'hasInstructions', type:'radio', label:'Do you want to include legally binding instructions?', reflow:true, options:['Yes','No'] },
    { key:'instructions', type:'textarea', label:'Your instructions', showIf:function(s){return s.preferences.hasInstructions==='Yes';} }
  ]},
  { id:'usage', name:'Usage', title:'When can the LPA be used?', lead:'Property & Financial only.', showIf:function(s){var t=s.lpa_type.type; return t==='Property & Financial Affairs'||t==='Both';}, fields:[
    { key:'when', type:'radio', label:'When can attorneys start using the Property & Financial LPA?', required:true, options:['As soon as it is registered','Only if I lose mental capacity'] }
  ]},
  { id:'notify', name:'Notify', title:'People to notify', lead:'Optional. People told when the LPA is registered.', fields:[
    { key:'has', type:'radio', label:'Do you want to notify anyone when the LPA is registered?', reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Person to notify', max:5, showIf:function(s){return s.notify.has==='Yes';}, fields:[
      { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'address', type:'text', label:'Address line 1' },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city'}, {key:'postcode',type:'text',label:'Postcode'} ] }
    ]}
  ]},
  { id:'provider', name:'Provider', title:'Certificate provider', lead:'An independent person who confirms you understand the LPA.', fields:[
    { key:'kind', type:'radio', label:'Who will be your certificate provider?', required:true, options:['Someone who has known me 2+ years','A professional (doctor, solicitor, etc.)'] },
    { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'address', type:'text', label:'Address line 1' },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city'}, {key:'postcode',type:'text',label:'Postcode'} ] },
      { type:'row', fields:[ {key:'phone',type:'tel',label:'Phone'}, {key:'occupation',type:'text',label:'Occupation'} ] }
  ]},
  { id:'registration', name:'Registration', title:'Who will register the LPA?', fields:[
    { key:'who', type:'radio', label:'Who registers the LPA?', required:true, options:['Donor','Attorney(s)'] }
  ]},
  { id:'exemption', name:'Fee', title:'Registration fee', lead:'The OPG charges £92 per LPA to register. You may qualify for a reduction.', fields:[
    { key:'status', type:'radio', label:'Do you qualify for a fee reduction or exemption?', required:true, options:['No','Yes - low income','Yes - certain benefits'] }
  ]},
  { id:'declaration', name:'Declaration', title:'Declaration', lead:'Confirm the following. You sign the official form by hand later.', fields:[
    { key:'over18', type:'radio', label:'I confirm I am over 18', required:true, options:['Yes'] },
    { key:'capacity', type:'radio', label:'I confirm I have mental capacity to make this LPA', required:true, options:['Yes'] },
    { key:'understand', type:'radio', label:'I understand the LPA must be signed and witnessed in person to be valid', required:true, options:['Yes'] },
      { key:'canSign', type:'radio', label:'Will you (the donor) sign the LPA form yourself?', required:true, reflow:true, options:['Yes','No'] },
      { key:'signerName', type:'text', label:'Name of the person who will sign on your behalf', required:true, showIf:function(s){return s.declaration.canSign==='No';} },
    { key:'signature', type:'text', label:'Type your full name to confirm', required:true }
  ]},
  { id:'review', name:'Review', title:'Review your LPA details', lead:'Check everything below. You can jump back to any section to edit, then continue to payment.', kind:'review' },
  { id:'payment', name:'Payment', title:'Payment', lead:'Secure card payment to generate your LPA.', kind:'payment' },
  { id:'generate', name:'Generate', title:'Your LPA', kind:'generate' }
];

var REFERRAL_FUNNEL = [
  { id:'about', name:'About you', title:(window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.referral_title)||'Get your fixed fee probate quote', lead:'A few quick questions so we can give you an accurate quote. It takes about two minutes.', fields:[
    { key:'over18', type:'radio', label:'Are you over 18 years old?', required:true, options:['Yes','No'] },
    { key:'hasPartner', type:'radio', label:'Do you have a spouse or partner?', required:true, reflow:true, options:['Yes','No'] },
    { key:'mirrorWill', type:'radio', label:'Would you both like a mirror will? (Two separate but almost identical wills for a couple.)', required:true, options:['Yes','No'], showIf:function(s){return s.about.hasPartner==='Yes';} },
    { key:'hasChildren', type:'radio', label:'Do you have any children?', required:true, options:['Yes','No'] }
  ]},
  { id:'estate', name:'Your estate', title:'About the estate', lead:'These questions shape the quote.', fields:[
    { key:'liveEW', type:'radio', label:'Do you live in England or Wales?', required:true, options:['Yes','No'] },
    { key:'assetsEW', type:'radio', label:'Is everything you own in England & Wales?', required:true, options:['Yes','No'] },
    { key:'ownHome', type:'radio', label:'Do you own your home?', required:true, options:['Yes','No'] },
    { key:'ownBusiness', type:'radio', label:'Do you own a business?', required:true, options:['Yes','No'] },
    { key:'estateBand', type:'radio', label:function(s){ var married=(s.about&&s.about.hasPartner==='Yes'); return 'Is the estate worth more or less than \u00a3'+(married?'650,000':'325,000')+'? (This just tells us whether inheritance tax is likely, which affects the work involved.)'; }, required:true, options:['Above','Below'] },
    { key:'value', type:'number', label:'Roughly what is the estate worth? An estimate is fine (\u00a3).', required:true }
  ]},
  { id:'concerns', name:'Your concerns', title:'What matters most to you?', lead:'Tick everything that applies. This helps us advise you properly.', fields:[
    { key:'mentalCapacity', type:'checkbox', label:'Losing mental capacity' },
    { key:'careFees', type:'checkbox', label:'Losing your home to cover care home fees' },
    { key:'divorceBankruptcy', type:'checkbox', label:'Protecting your estate against divorce or bankruptcy' },
    { key:'remarriage', type:'checkbox', label:'Protecting your wealth should your partner remarry' },
    { key:'iht', type:'checkbox', label:'Paying inheritance tax' },
    { key:'other', type:'textarea', label:'Anything else on your mind?' }
  ]},
  { id:'contact_details', name:'Your details', title:'Where should we send your quote?', lead:'We will be in touch with your fixed fee quote and next steps.', fields:[
    { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
    { type:'row', fields:[ {key:'email',type:'email',label:'Email',required:true}, {key:'phone',type:'tel',label:'Phone',required:true} ] },
    { key:'declaration', type:'checkbox', label:'I confirm that I am aged 18 or over and that the information I have given is accurate.', required:true }
  ]},
  { id:'referral_done', name:'Your quote', kind:'quote', title:'', fields:[] }
];
var FUNNEL = (function(){ var f=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||window.AIWILLS_FUNNEL||'').toString().toLowerCase(); return f==='etb'?ETB_FUNNEL:(f==='lpa'?LPA_FUNNEL:((f==='probate'||f==='referral')?REFERRAL_FUNNEL:WILLS_FUNNEL)); })();
var FUNNEL_KEY = (function(){ var f=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||window.AIWILLS_FUNNEL||'').toString().toLowerCase(); if(f==='etb'||f==='lpa'||f==='hub') return f; if(f==='probate'||f==='referral') return 'probate'; return 'wills'; })();

var state, cur=0, maxCur=0;
function flat(fields){ var r=[]; (fields||[]).forEach(function(f){ if(f.type==='row') r=r.concat(flat(f.fields)); else r.push(f); }); return r; }
function initState(){ state={}; FUNNEL.forEach(function(s){ if(s.kind==='payment'){ state[s.id]={paid:false}; return; } state[s.id]={}; flat(s.fields).forEach(function(f){ state[s.id][f.key]= f.type==='repeater'?[]:''; }); }); if(window.AIWILLS_PREFILL){ var pf=window.AIWILLS_PREFILL; for(var k in pf){ if(state[k]&&pf[k]&&typeof pf[k]==='object'){ for(var kk in pf[k]){ var _v=pf[k][kk]; if(typeof _v==='string'&&_v.indexOf('{'+'{')>=0) continue; state[k][kk]=_v; } } } } }
function getP(p){ var a=p.split('.'),o=state,i; for(i=0;i<a.length;i++){ if(o==null) return ''; o=o[a[i]]; } return o==null?'':o; }
function setP(p,v){ var a=p.split('.'),o=state,i; for(i=0;i<a.length-1;i++){ var k=a[i]; if(o[k]==null||typeof o[k]!=='object'){ o[k]=/^[0-9]+$/.test(a[i+1])?[]:{}; } o=o[k]; } o[a[a.length-1]]=v; }
function blankItem(f){ var o={}; flat(f.fields).forEach(function(x){ o[x.key]= x.type==='repeater'?[]:''; }); return o; }
function total(lp,key){ return (getP(lp)||[]).reduce(function(s,it){ return s+(parseFloat(it[key])||0); },0); }
function visible(){ var ed=(window.AIWILLS_EDIT===true); return FUNNEL.filter(function(s){ if(ed && (s.kind==='payment'||s.kind==='generate'||s.kind==='done')) return false; return !s.showIf || s.showIf(state); }); }

function fld(base,f){
  if(f.showIf && !f.showIf(state, base)) return '';
  if(f.type==='row') return '<div class="row">'+f.fields.map(function(c){ return fld(base,c); }).join('')+'</div>';
  if(f.type==='repeater') return repeater(base,f);
  var p=base+'.'+f.key, v=getP(p);
  var rf = f.reflow?' data-reflow="1"':'';
  var _flab=(typeof f.label==='function')?f.label(state):f.label;
  var lab='<label>'+esc(_flab)+(f.required?'':' <span class="opt">(optional)</span>')+'</label>';
  var err='<div class="err">This field is required</div>';
  if(f.type==='select'){
    var sopts=(typeof f.options==='function')?(f.options(state)||[]):(f.options||[]);
    var o='<option value="">Please select...</option>';
    sopts.forEach(function(x){ o+='<option'+(v===x?' selected':'')+'>'+esc(x)+'</option>'; });
    return '<div class="field" data-f="'+p+'">'+lab+'<select data-b="'+p+'"'+rf+'>'+o+'</select>'+err+'</div>';
  }
  if(f.type==='radio'){
    var ropts=(typeof f.options==='function')?(f.options(state)||[]):(f.options||[]);
    var c='<div class="choices">';
    ropts.forEach(function(x){ c+='<label class="choice'+(v===x?' on':'')+'"><input type="radio" name="'+p+'" value="'+esc(x)+'" data-b="'+p+'"'+rf+(v===x?' checked':'')+'><span>'+esc(x)+'</span></label>'; });
    return '<div class="field" data-f="'+p+'">'+lab+c+'</div>'+err+'</div>';
  }
  if(f.type==='file'){ var fn=getP(p)||''; var _furl=getP(p+'_url')||''; var _cur=(fn||_furl)?('<div style="font-size:14px;margin:2px 0 6px">Current: '+esc(fn||'document')+(_furl?(' &middot; <a href="'+esc(_furl)+'" target="_blank" rel="noopener">View</a>'):'')+' &middot; <a href="#" class="frm" data-frm="'+esc(f.field||'')+'" data-namekey="'+p+'">Remove</a></div>'):''; return '<div class="field" data-f="'+p+'">'+lab+_cur+'<input type="file" data-upload="'+esc(f.field||'')+'" data-namekey="'+p+'"'+(f.accept?(' accept="'+esc(f.accept)+'"'):'')+'><div class="uplstat" style="font-size:14px;color:var(--muted);margin-top:6px">'+(fn?('Replace: '+esc(fn)):'')+'</div></div>'; }
  if(f.type==='checkbox'){ return '<div class="field" data-f="'+p+'"><label class="choice'+(v==='Yes'?' on':'')+'" style="width:100%"><input type="checkbox" data-b="'+p+'"'+rf+(v==='Yes'?' checked':'')+'><span>'+esc(f.label)+'</span></label>'+err+'</div>'; }
  if(f.type==='textarea') return '<div class="field" data-f="'+p+'">'+lab+'<textarea data-b="'+p+'">'+esc(v)+'</textarea>'+err+'</div>';
  return '<div class="field" data-f="'+p+'">'+lab+'<input type="'+f.type+'" value="'+esc(v)+'" data-b="'+p+'"'+rf+'>'+err+'</div>';
}
function repeater(base,f){
  var lp=base+'.'+f.key, list=getP(lp)||[];
  var h='<div class="field"><label>'+esc(f.label||'')+'</label>';
  if(!list.length) h+='<div class="empty">No '+esc((f.itemLabel||'item').toLowerCase())+'s added yet.</div>';
  list.forEach(function(it,i){ h+='<div class="repitem"><div class="rephead"><strong>'+esc(f.itemLabel||'Item')+' '+(i+1)+'</strong><button type="button" class="rm" data-rm="'+lp+'" data-i="'+i+'">Remove</button></div>'; f.fields.forEach(function(sf){ h+=fld(lp+'.'+i, sf); }); h+='</div>'; });
  if(!f.max || list.length<f.max) h+='<button type="button" class="add" data-add="'+lp+'">+ Add '+esc((f.itemLabel||'item').toLowerCase())+'</button>';
  if(f.total){ var t=total(lp,f.total.key), ok=t===f.total.equals; h+='<div class="tot '+(ok?'ok':'bad')+'">'+esc(f.total.label||'Total')+': '+t+(f.total.suffix||'')+(ok?' ✓':'')+'</div>'; }
  return h+'</div>';
}
function findRepeater(lp){ var found=null; FUNNEL.forEach(function(s){ if(!s.fields) return; flat(s.fields).forEach(function(f){ if(f.type==='repeater' && s.id+'.'+f.key===lp) found=f; }); }); return found; }
function addItem(lp){ var f=findRepeater(lp); if(!f) return; var list=getP(lp); if(f.max && list.length>=f.max) return; list.push(blankItem(f)); render(); }
function itemEmpty(f,it){ return flat(f.fields).every(function(sf){ var v=it&&it[sf.key]; return v==null||v===''||(Array.isArray(v)&&v.length===0); }); }
function stripEmptyRepeaters(){ FUNNEL.forEach(function(s){ if(!s.fields) return; flat(s.fields).forEach(function(f){ if(f.type!=='repeater') return; var lp=s.id+'.'+f.key; var l=getP(lp); if(!Array.isArray(l)) return; var kept=l.filter(function(it){ return !itemEmpty(f,it); }); if(kept.length!==l.length) setP(lp,kept); }); }); }

function applyBrand(){
  try{ var _mt=document.getElementById('aiwills-funnel'); if(_mt) _mt.classList.add('aw-ready'); }catch(e){}
  var r=document.documentElement.style;
  if(CFG.icon_color) r.setProperty('--icon',CFG.icon_color);
  function lum(hex){ try{ var m=String(hex).match(/[0-9a-f]{2}/gi); if(!m||m.length<3) return null; return (0.299*parseInt(m[0],16)+0.587*parseInt(m[1],16)+0.114*parseInt(m[2],16))/255; }catch(e){ return null; } }
  function darken(hex,amt){ try{ var m=String(hex).match(/[0-9a-f]{2}/gi); if(!m||m.length<3) return hex; return '#'+m.slice(0,3).map(function(h){ var n=Math.max(0,Math.round(parseInt(h,16)*(1-amt))); return ('0'+n.toString(16)).slice(-2); }).join(''); }catch(e){ return hex; } }
  if(CFG.primary_color) r.setProperty('--primary',CFG.primary_color);
  if(CFG.heading_color) r.setProperty('--heading',CFG.heading_color);
  if(CFG.body_color) r.setProperty('--body',CFG.body_color);
  if(CFG.header_bg_color){ r.setProperty('--header-bg',CFG.header_bg_color); var _hl=lum(CFG.header_bg_color); if(_hl!=null){ r.setProperty('--hdr-ink', _hl<0.5?'#ffffff':(CFG.heading_color||'#1B1D1F')); r.setProperty('--nav-ink', _hl<0.5?'#ffffff':'#1d1d1f'); } }
  if(CFG.nav_text_color) r.setProperty('--nav-ink',CFG.nav_text_color);
  if(CFG.page_bg_color) r.setProperty('--page-bg',CFG.page_bg_color);
  if(CFG.heading_font) r.setProperty('--hf',estack(CFG.heading_font,'Playfair Display'));
  if(CFG.body_font) r.setProperty('--bf',estack(CFG.body_font,'DM Sans'));
  if(CFG.site_max_width){ var _smw=parseInt(CFG.site_max_width)||1200; if(_smw<1120)_smw=1120; r.setProperty('--site-max',_smw+'px'); }
  if(CFG.nav_font_size) r.setProperty('--nav-size',CFG.nav_font_size);
  if(CFG.body_font_size) r.setProperty('--body-size',CFG.body_font_size);
  if(CFG.logo_height){ var _lh=parseInt(CFG.logo_height,10)||0; if(_lh) r.setProperty('--logo-h', Math.max(28,Math.min(60,_lh))+'px'); } // clamp to a header-sane range so a large captured value can't blow the logo out
  if(CFG.footer_max_width) r.setProperty('--footer-max',CFG.footer_max_width);
  var bbg=CFG.button_color||CFG.primary_color; if(bbg) r.setProperty('--btn-bg',bbg);
  if(CFG.button_hover_color) r.setProperty('--btn-hover',CFG.button_hover_color); else if(bbg) r.setProperty('--btn-hover',darken(bbg,0.14));
  if(CFG.button_text_color){ r.setProperty('--btn-ink',CFG.button_text_color); } else if(bbg){ var _bl=lum(bbg); r.setProperty('--btn-ink',(_bl!=null&&_bl>0.6)?(CFG.heading_color||'#1B1D1F'):'#ffffff'); }
  var _b2=CFG.button_secondary_color||'#ffffff'; r.setProperty('--btn2-bg',_b2); var _b2i=CFG.button_secondary_text_color; if(!_b2i){ var _b2l=lum(_b2); if(_b2l!=null&&_b2l<0.5){_b2i='#ffffff';} else { var _pc=CFG.primary_color||'#1B1D1F'; var _pl=lum(_pc); _b2i=(_pl!=null&&_pl>0.6)?(CFG.heading_color||'#1B1D1F'):_pc; } } r.setProperty('--btn2-ink',_b2i);
  if(CFG.button_font) r.setProperty('--btn-font',estack(CFG.button_font,''));
  if(CFG.button_radius) r.setProperty('--btn-radius',CFG.button_radius);
  if(CFG.heading_font_size) r.setProperty('--h-size',CFG.heading_font_size);
  if(CFG.heading_weight) r.setProperty('--h-weight',wt(CFG.heading_weight)||'900');
  if(CFG.nav_weight) r.setProperty('--nav-weight',wt(CFG.nav_weight)||'500');
  if(CFG.button_weight) r.setProperty('--btn-weight',wt(CFG.button_weight)||'600');
  if(CFG.footer_bg_color){ r.setProperty('--ftr-bg',CFG.footer_bg_color); var _fl=lum(CFG.footer_bg_color); if(_fl!=null) r.setProperty('--ftr-ink', _fl<0.5?'#ffffff':'#1B1D1F'); }
  if(CFG.footer_text_color) r.setProperty('--ftr-ink',CFG.footer_text_color);
  function _okLbl(m){ return m && m.label && String(m.label).indexOf('{')<0 && String(m.label).indexOf('}')<0 && !/^\s*\.[a-z0-9_-]/i.test(String(m.label)); }
  var nav=[]; try{ nav=JSON.parse(CFG.nav_menu_json||'[]').filter(_okLbl); }catch(e){ nav=[]; }
  var fmenu=[]; try{ fmenu=JSON.parse(CFG.footer_menu_json||'[]').filter(_okLbl); }catch(e){ fmenu=[]; } if(!fmenu.length) fmenu=nav;
  function lnk(u,t){ var real=u&&/^https?:/i.test(u); return '<a href="'+(real?esc(u):'#')+'"'+(real?' target="_blank" rel="noopener"':' onclick="return false"')+'>'+esc(t)+'</a>'; }
  var navHtml=nav.map(function(n){ return lnk(n.url,n.label); }).join('');
  var logo = CFG.logo_url ? '<img src="'+esc(CFG.logo_url)+'" alt="'+esc(CFG.company_name)+'" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\'"><span class="wordmark" style="display:none">'+esc(CFG.company_name)+'</span>' : '<span class="wordmark">'+esc(CFG.company_name||'Company')+'</span>';
  el('hdr').innerHTML='<div class="hwrap"><div class="logo">'+logo+'</div><nav>'+navHtml+'</nav><div class="phone">'+esc(CFG.phone||'')+'</div></div>';
  var links=fmenu.map(function(n){ return '<li>'+lnk(n.url,n.label)+'</li>'; }).join('');
  if(CFG.privacy_url) links+='<li>'+lnk(CFG.privacy_url,'Privacy policy')+'</li>';
  var SOC=[['facebook_url','Facebook'],['instagram_url','Instagram'],['linkedin_url','LinkedIn'],['twitter_url','X'],['youtube_url','YouTube'],['tiktok_url','TikTok']];
  var soc=SOC.map(function(s){ return CFG[s[0]]?lnk(CFG[s[0]],s[1]):''; }).join('');
  el('ftr').innerHTML='<div class="fwrap"><div class="fgrid"><div><div class="fh">Explore</div><ul class="flinks">'+links+'</ul></div><div><div class="fcta">Ready to protect your family’s future?</div><button class="btn" style="background:var(--btn2-bg);color:var(--btn2-ink);border:2px solid var(--btn2-ink)" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">'+((FUNNEL===ETB_FUNNEL)?'Get started':'Start your will')+'</button></div></div><hr class="frule">'+(soc?'<div class="fsoc">'+soc+'</div>':'')+'<div class="fleg">'+awSafeHtml(CFG.legal_footer||'')+'</div>'+(CFG.address?'<p class="fleg">Registered office: '+esc(CFG.address)+'</p>':'')+'</div>';
}

function fmtDate(v){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||'')); return m?(m[3]+'/'+m[2]+'/'+m[1]):v; } function fmtVal(f,v){ return (f&&f.type==='date')?fmtDate(v):v; }
function sumRow(k,v){ return v?('<div class="srow"><span class="k">'+esc(k)+'</span><span class="v">'+esc(v)+'</span></div>'):''; }
function summary(base,fields){
  var out='';
  (fields||[]).forEach(function(f){
    if(f.showIf && !f.showIf(state)) return;
    if(f.type==='row'){ out+=summary(base,f.fields); return; }
    if(f.type==='repeater'){ (getP(base+'.'+f.key)||[]).forEach(function(it,i){ out+='<div class="srow"><span class="k" style="font-weight:700">'+esc((f.itemLabel||'Item')+' '+(i+1))+'</span><span class="v"></span></div>'; flat(f.fields).forEach(function(sf){ var vv=it[sf.key]; if(vv) out+=sumRow(' '+(sf.label||sf.key), fmtVal(sf,vv)); }); }); return; }
    var v=getP(base+'.'+f.key); if(v) out+=sumRow(f.label||f.key, fmtVal(f,v));
  });
  return out;
}
function review(){
  var html=''; var ed=(window.AIWILLS_EDIT===true);
  visible().forEach(function(s){ if(!(s.fields&&s.fields.length)) return; var rows=summary(s.id,s.fields); if(!rows && !ed) return; var body=rows||'<div style="padding:2px 0 8px;color:#8a8a8a;font-size:14px">Nothing added yet.</div>'; html+='<div class="sum"><h3>'+esc(s.name)+'<button type="button" class="edit" data-goto="'+s.id+'">'+(rows?'Edit':'Add')+'</button></h3>'+body+'</div>'; });
  if(window.AIWILLS_EDIT===true){ var _tok=window.AIWILLS_TOKEN||''; var _isE=(FUNNEL===ETB_FUNNEL); var _dl='<a class="btn wide" href="'+API+(_isE?'/api/etb-pdf?t=':'/api/will-pdf?t=')+encodeURIComponent(_tok)+'" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:8px">'+(_isE?'Download summary (PDF)':'Download your will (PDF)')+'</a>'; var _docs=[]; visible().forEach(function(s){ if(!s.fields) return; flat(s.fields).forEach(function(f){ if(f.type!=='file') return; var fp=s.id+'.'+f.key; var u=getP(fp+'_url'); if(u) _docs.push({name:(getP(fp)||f.label||'Document'), url:u}); }); }); var _fh=_docs.length?('<div class="sum" style="margin-top:12px"><h3>Your documents</h3>'+_docs.map(function(d){return '<div style="padding:4px 0"><a href="'+esc(d.url)+'" target="_blank" rel="noopener">'+esc(d.name)+'</a></div>';}).join('')+'</div>'):''; return html+_dl+_fh; }
  return html+((FUNNEL===WILLS_FUNNEL)?'<button type="button" class="btn wide" id="dl" style="margin-top:8px">Download will (PDF)</button>':'');
}

function render(){
  var vis=visible(); if(cur>vis.length-1) cur=vis.length-1; var s=vis[cur];
  if(s.fields){ s.fields.forEach(function(f){ if(f.type!=='repeater') return; var active=f.showIf?f.showIf(state):false; if(!(f.required||active)) return; var lp=s.id+'.'+f.key; var l=getP(lp); if(Array.isArray(l) && l.length===0){ l.push(blankItem(f)); } }); } // auto-open a card only for required or gated-active repeaters; optional lists (e.g. gifts) can be emptied via Remove
  var html='<h1>'+esc(s.title)+'</h1>'+(s.lead?'<p class="lead">'+esc(s.lead)+'</p>':'');
  if(s.kind==='payment'){
    var _isEtb=(FUNNEL===ETB_FUNNEL);
    if(getP('payment.paid')===true){
      html += '<div class="mock"><div class="tick">✓</div><h3>'+(_isEtb?'Subscription active':'Payment received')+'</h3><p class="note">'+(_isEtb?'Your Executor Toolbox is now active.':'Continue to download your will.')+'</p></div>';
    } else if(_isEtb){
      var _ep=esc(fmtPrice(CFG.etb_price)||'£19.99 / year');
      html += '<div class="mock"><p>Executor Toolbox</p><div class="price">'+_ep+'</div><button class="btn wide" id="pay" type="button">Subscribe</button><p class="note">Secure card payment. Your subscription keeps your Toolbox stored and available to your executors. You can cancel any time.</p></div>';
    } else {
      var _svcp=(FUNNEL===LPA_FUNNEL)?(CFG.lpa_price||CFG.will_price):CFG.will_price;
      html += '<div class="mock"><p>'+esc(FUNNEL===LPA_FUNNEL?'Your LPA document':(FUNNEL===ETB_FUNNEL?'Your Executor Toolbox':'Your will document'))+'</p><div class="price">'+esc(fmtPrice(_svcp))+'</div><button class="btn wide" id="pay" type="button">Pay '+esc(fmtPrice(_svcp))+'</button><p class="note">Secure card payment. You will be returned here to download your will.</p></div>';
    }
  } else if(s.kind==='done'){
    html += '<div class="mock"><div class="tick">✓</div><h3>Your Executor Toolbox is active</h3><p class="note">Your details and any documents you uploaded are securely stored. Your executors will be able to access what they need, when the time comes.</p><div style="text-align:left;margin-top:22px;padding-top:18px;border-top:1px solid #e7e7e7"><p style="font-weight:600;margin:0 0 8px">What happens next</p><ol style="margin:0;padding-left:20px;line-height:1.7"><li>Tell your executors that your Toolbox exists.</li><li>You can come back any time to add or update documents.</li><li>Keep your contact details current so we can reach you.</li></ol></div></div>';
  } else if(s.kind==='quote'){
    try{ saveToGhl(state, { submitted:true }); }catch(e){}
    var _q=computeQuote(state);
    if(_q){
      var _cta = (CFG.quote_cta_url) ? ('<a class="btn wide" href="'+esc(CFG.quote_cta_url)+'" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:14px">'+esc(CFG.quote_cta_label||'Book a call to proceed')+'</a>') : '';
      html += '<div class="mock"><div class="tick">\u2713</div><h3>'+esc(CFG.quote_title||'Your probate quote estimate')+'</h3><div class="price">'+esc(_q.display)+'</div><p class="note">'+esc(CFG.quote_note||'This is an estimate based on what you have told us. We will confirm the exact figure and the next steps with you before any work begins.')+'</p>'+_cta+'</div>';
    } else {
      html += '<div class="mock"><div class="tick">\u2713</div><h3>'+esc(CFG.referral_thanks_title||'Thank you - your quote is on its way')+'</h3><p class="note">'+esc(CFG.referral_thanks_text||'We have everything we need. One of the team will be in touch shortly with your fixed fee quote and next steps.')+'</p></div>';
    }
  } else if(s.kind==='generate' && FUNNEL===LPA_FUNNEL){
    var _lcid=(rootEl&&rootEl.getAttribute('data-contact'))||qp('aw_c')||window.AIWILLS_CONTACT_ID||'';
    setTimeout(function(){ try{ fetch(API+'/api/lpa-save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,contactId:_lcid,state:state,pdf:true})}).then(function(r){return r.json();}).then(function(j){ var w=el('lpapdfwrap'); if(!w) return; if(j&&j.token){ var u=API+'/api/lpa-pdf?t='+encodeURIComponent(j.token); w.innerHTML='<iframe src="'+u+'" style="width:100%;height:560px;border:1px solid #e0e0e0;border-radius:10px;margin-top:16px;background:#fff" title="Your LPA"></iframe><div style="margin-top:12px"><a class="btn wide" href="'+u+'" target="_blank" rel="noopener">Download your LPA (PDF)</a></div>'; } else { w.innerHTML='<p class="note">Could not generate the LPA document'+((j&&j.error)?(': '+esc(j.error)):'')+'.</p>'; } }).catch(function(){ var w=el('lpapdfwrap'); if(w) w.innerHTML='<p class="note">Could not generate the LPA document.</p>'; }); }catch(e){} },60);
    html += '<div class="mock"><div class="tick">\u2713</div><h3>Your LPA is ready</h3><p class="note">Payment received. Your LPA is shown below.</p><div id="lpapdfwrap"><p class="note">Preparing your LPA document\u2026</p></div></div>';
  } else if(s.kind==='generate'){
    var _p0=(state.personal||{});
    if(!_p0.firstName || !_p0.lastName){
      html += '<div class="mock"><h3>Let’s finish your will first</h3><p class="note">It looks like your answers haven’t all come through. Please go back and complete your will so we can produce your document.</p><button class="btn wide" type="button" data-goto="personal">Go back to your will</button></div>';
    } else {
    var _wcid=(rootEl&&rootEl.getAttribute('data-contact'))||qp('aw_c')||window.AIWILLS_CONTACT_ID||'';
    setTimeout(function(){ try{
      fetch(API+'/api/will-preview',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,state:state})}).then(function(r){ if(!r.ok) throw new Error('pdf'); return r.blob(); }).then(function(bl){ if(bl.type&&bl.type.indexOf('pdf')<0) throw new Error('notpdf'); var u=URL.createObjectURL(bl); var w=el('willpdfwrap'); if(w) w.innerHTML='<iframe src="'+u+'" style="width:100%;height:560px;border:1px solid #e0e0e0;border-radius:10px;margin-top:16px;background:#fff" title="Your will"></iframe><div style="margin-top:12px"><a class="btn wide" href="'+u+'" download="your-will.pdf">Download your will (PDF)</a></div>'; }).catch(function(){ var w=el('willpdfwrap'); if(w) w.innerHTML='<p class="note">Could not generate the will document.</p>'; });
      try{ fetch(API+'/api/will-save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,contactId:_wcid,state:state,pdf:false})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_CONTACT_ID=j.contactId; }).catch(function(){}); }catch(e){}
    }catch(e){} },60);
    html += '<div class="mock"><div class="tick">✓</div><h3>Your will is ready</h3><p class="note">Payment received. Your will is shown below.</p><div id="willpdfwrap"><p class="note">Preparing your will document…</p></div><div style="text-align:left;margin-top:22px;padding-top:18px;border-top:1px solid #e7e7e7"><p style="font-weight:600;margin:0 0 8px">To make your will legally valid</p><ol style="margin:0;padding-left:20px;line-height:1.7"><li>Print the document.</li><li>Sign it in front of two independent adult witnesses (not your beneficiaries, or their husbands or wives).</li><li>Have both witnesses sign while you are watching.</li><li>Store it safely and tell your executors where it is.</li></ol></div></div>';
    }
  } else if(s.kind==='review'){
    html += review();
  } else {
    s.fields.forEach(function(f){ html += fld(s.id,f); });
  }
  el('step').innerHTML=html;
  el('stepName').textContent=s.name;
  el('stepCount').textContent='Step '+(cur+1)+' of '+vis.length;
  el('bar').style.width=Math.round(((cur+1)/vis.length)*100)+'%';
  if(cur>maxCur) maxCur=cur; if(maxCur>vis.length-1) maxCur=vis.length-1;
  try{ var _smenu=el('stepmenu'); if(_smenu){ if(window.AIWILLS_EDIT===true){ _smenu.innerHTML=''; } else { _smenu.innerHTML=vis.map(function(v,i){ var _free=(FUNNEL===ETB_FUNNEL&&v.kind!=='payment'&&v.kind!=='done'); var ok=(i<=maxCur)||_free; var cls=(i===cur)?'on':(ok?'done':''); return '<button type="button" data-sj="'+i+'"'+(cls?(' class="'+cls+'"'):'')+(ok?'':' disabled')+'>'+esc(v.name)+'</button>'; }).join(''); _smenu.querySelectorAll('[data-sj]').forEach(function(b){ b.addEventListener('click',function(){ jumpIdx(parseInt(b.getAttribute('data-sj'),10)); }); }); } } }catch(e){}
  var _ed=(window.AIWILLS_EDIT===true);
  el('back').textContent=_ed?'Back to summary':'Back';
  el('back').style.visibility=_ed?(s.kind==='review'?'hidden':'visible'):(cur===0?'hidden':'visible');
  var next=el('next'); if(_ed){ next.style.display=(s.kind==='review')?'none':''; next.textContent='Save'; } else { next.style.display=(s.kind==='generate'||s.kind==='done'||s.kind==='quote')?'none':''; next.textContent=(s.kind==='review')?((FUNNEL===ETB_FUNNEL)?'Continue to activate':'Continue to payment'):((FUNNEL===REFERRAL_FUNNEL&&vis[cur+1]&&vis[cur+1].kind==='quote')?(CFG.referral_submit_label||'Get my quote'):'Continue'); }
  var pay=el('pay'); if(pay) pay.addEventListener('click',function(){ try{ collectVisible(); }catch(e){} if(FUNNEL===LPA_FUNNEL){ var _lv=visible(); for(var _lg=0;_lg<_lv.length;_lg++){ if(_lv[_lg].kind==='generate'){ cur=_lg; render(); try{scrollTop();}catch(e){} return; } } } var _isEtb=(FUNNEL===ETB_FUNNEL); var _lbl=_isEtb?'Subscribe':('Pay '+esc(fmtPrice(CFG.will_price))); pay.disabled=true; pay.textContent='Redirecting to secure payment...'; var _url=_isEtb?(API+'/api/etb-checkout'):(API+'/api/checkout'); var _body=_isEtb?{locationId:loc,contactId:(window.AIWILLS_ETB_CID||''),contact:(state.your_details||{}),returnUrl:_retUrl()}:{locationId:loc,willJson:state,returnUrl:_retUrl()}; fetch(_url,{method:'POST',body:JSON.stringify(_body)}).then(function(r){return r.json();}).then(function(j){ if(j&&j.url){ window.location.href=j.url; } else { pay.disabled=false; pay.textContent=_lbl; alert('Could not start payment: '+((j&&j.error)||'unknown')); } }).catch(function(e){ pay.disabled=false; pay.textContent=_lbl; alert('Payment error: '+e.message); }); });
  var _dlp=el('dlp'); if(_dlp) _dlp.addEventListener('click',function(){ try{ window.print(); }catch(e){} });
  // payment redirects out to Stripe and returns to the generate step (see aw_paid handling on load); no auto-advance, no demo download.
  el('step').querySelectorAll('[data-goto]').forEach(function(b){ b.addEventListener('click',function(){ jumpTo(b.getAttribute('data-goto')); }); });
}
/* scroll to top only on real step changes, never on in-step reflow re-renders (which were yanking the page to the top on every radio click). */
function scrollTop(){ try{ window.scrollTo(0,0); }catch(e){} var m=document.getElementById('aiwills-funnel'); if(m&&m.scrollIntoView){ try{ m.scrollIntoView({block:'start'}); }catch(e){} } }
function computeQuote(state){
  var raw=(window.AIWILLS_CONFIG||{}).probate_quote_rules_json; if(!raw) return null;
  var rules; try{ rules=(typeof raw==='string')?JSON.parse(raw):raw; }catch(e){ return null; }
  if(!rules||typeof rules!=='object') return null;
  var cur=rules.currency||'\u00a3';
  var flat={}; try{ Object.keys(state||{}).forEach(function(sec){ var o=state[sec]; if(o&&typeof o==='object'&&!Array.isArray(o)){ Object.keys(o).forEach(function(k){ flat[sec+'.'+k]=o[k]; flat[k]=o[k]; }); } }); }catch(e){}
  var mode=String(rules.mode||'fixed').toLowerCase();
  var fee, approx=false;
  if(mode==='percent'){
    var val=parseFloat(flat[rules.of||'estate.value']!=null?flat[rules.of||'estate.value']:flat['value']);
    if(!(val>0)) return null; // a percentage quote needs an estate value
    fee=val*(parseFloat(rules.percent)||0)/100; approx=true;
  } else {
    fee=parseFloat(rules.base)||0;
    var add=rules.add||{};
    Object.keys(add).forEach(function(cond){ var p=cond.split(':'); var key=p[0], want=p.slice(1).join(':'); var have=flat[key]; if(have!=null && String(have)===String(want)){ fee+=(parseFloat(add[cond])||0); } });
  }
  if(rules.min!=null) fee=Math.max(fee, parseFloat(rules.min)||0);
  if(rules.max!=null) fee=Math.min(fee, parseFloat(rules.max)||fee);
  fee=Math.round(fee*100)/100;
  var num=(Math.round(fee)===fee)?String(fee):fee.toFixed(2);
  var disp=(approx?'Approx. ':'')+cur+num;
  return { fee:fee, display:disp, approx:approx };
}
function _retUrl(){ var r=location.href.split('#')[0].split('?')[0]; var q=[]; if(loc) q.push('aw_loc='+encodeURIComponent(loc)); var c=qp('aw_c')||window.AIWILLS_CONTACT_ID||window.AIWILLS_ETB_CID||''; if(c) q.push('aw_c='+encodeURIComponent(c)); return q.length? (r+'?'+q.join('&')) : r; }
function jumpIdx(i){ var vis=visible(); if(isNaN(i)||i<0||i>vis.length-1||i===cur) return; try{ collectVisible(); stripEmptyRepeaters(); saveLocal(); }catch(e){}
  var _tfree=(FUNNEL===ETB_FUNNEL && vis[i].kind!=='payment' && vis[i].kind!=='done');
  if(i>cur && !_tfree){ for(var k=cur;k<i;k++){ var bad=validateStep(vis[k]); if(bad.length){ if(k!==cur){ cur=k; render(); scrollTop(); } alert('Please complete this step before moving on.'); return; } } }
  cur=i; render(); scrollTop(); try{ saveLocal(); }catch(e){} }
function jumpTo(id){ var vis=visible(); for(var i=0;i<vis.length;i++){ if(vis[i].id===id){ cur=i; render(); scrollTop(); try{ saveLocal(); }catch(e){} return; } } }

function collectVisible(){
  el('step').querySelectorAll('[data-b]').forEach(function(node){
    if(node.type==='radio'){ if(node.checked) setP(node.getAttribute('data-b'), node.value); }
    else if(node.type==='checkbox'){ setP(node.getAttribute('data-b'), node.checked?'Yes':''); }
    else setP(node.getAttribute('data-b'), node.value);
  });
}
function need(base,fields,bad){
  (fields||[]).forEach(function(f){
    if(f.showIf && !f.showIf(state)) return;
    if(f.type==='row'){ need(base,f.fields,bad); return; }
    if(f.type==='repeater'){
      var lp=base+'.'+f.key, list=getP(lp)||[];
      if(f.required && list.length<1) bad.push('MSG:Add at least one '+(f.itemLabel||'item').toLowerCase()+'.');
      list.forEach(function(it,i){ need(lp+'.'+i, f.fields, bad); });
      if(f.total && total(lp,f.total.key)!==f.total.equals) bad.push('MSG:'+(f.total.label||'Total')+' must equal '+f.total.equals+(f.total.suffix||'')+'.');
      return;
    }
    if(f.required){ var v=getP(base+'.'+f.key); if(v==='' || v==null){ bad.push(base+'.'+f.key); } } var _vv=getP(base+'.'+f.key); if(_vv){ if(f.type==='email'){ if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(_vv)) bad.push(base+'.'+f.key); } else if(f.type==='tel'){ if(String(_vv).replace(/\D/g,'').length<10) bad.push(base+'.'+f.key); } else if(/postcode/i.test(f.key)){ if(!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(String(_vv).trim())) bad.push(base+'.'+f.key); } }
  });
}
function validateStep(s){
  if(s.kind==='payment') return getP('payment.paid')===true?[]:['MSG:Please complete the simulated payment.'];
  if(s.kind) return [];
  var bad=[]; need(s.id,s.fields,bad); return bad;
}
function go(dir){
  var vis=visible(), s=vis[cur];
  if(dir>0){
    collectVisible();
    stripEmptyRepeaters(); // drop blank add-cards so empty items never reach the review/summary
    var bad=validateStep(s);
    if(bad.length){ var msg=null; bad.forEach(function(b){ if(b.indexOf('MSG:')===0 && !msg) msg=b.slice(4); }); var first=null; bad.forEach(function(b){ if(b.indexOf('MSG:')!==0){ var fl=document.querySelector('[data-f="'+b+'"]'); if(fl){ fl.classList.add('invalid'); if(!first) first=fl; } } }); if(first && first.scrollIntoView){ try{ first.scrollIntoView({block:'center'}); }catch(e){} } alert(msg || 'Please complete the required fields highlighted in red.'); return; }
    saveToGhl(state, { pdf: (s.kind==='review' || s.kind==='payment' || window.AIWILLS_EDIT===true) });
    if(window.AIWILLS_EDIT===true){ try{ jumpTo('review'); }catch(e){} return; } // edit hub: save this section, back to summary
  }
  cur+=dir; if(cur<0)cur=0; if(cur>vis.length-1){ alert('Demo complete. In production the contact is tagged and the will is issued.'); cur=vis.length-1; }
  render(); scrollTop(); try{ saveLocal(); }catch(e){}
}

function lsKey(){ try{ var fn=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||'wills'); return 'aw_draft_'+fn+'_'+(loc||''); }catch(e){ return ''; } }
function saveLocal(){ try{ if(window.AIWILLS_EDIT===true) return; var k=lsKey(); if(k){ localStorage.setItem(k, JSON.stringify(state)); try{ localStorage.setItem(k+'_pos', JSON.stringify({c:cur,m:maxCur})); }catch(e2){} try{ document.cookie=k.replace('aw_draft_','aw_s_')+'=1;domain=.aiwills.co.uk;path=/;max-age=31536000;SameSite=Lax'; }catch(e3){} } }catch(e){} }
function restoreLocal(){ try{ if(window.AIWILLS_EDIT===true||window.AIWILLS_PREFILL) return; var k=lsKey(); if(!k) return; var raw=localStorage.getItem(k); if(!raw) return; var saved=JSON.parse(raw); for(var s in saved){ if(state[s]&&saved[s]&&typeof saved[s]==='object'){ for(var kk in saved[s]) state[s][kk]=saved[s][kk]; } } try{ var _pos=JSON.parse(localStorage.getItem(k+'_pos')||'null'); if(_pos){ var _L=visible().length; maxCur=Math.max(0,Math.min(_pos.m||0,_L-1)); cur=Math.max(0,Math.min(_pos.c||0,maxCur)); } }catch(e3){} }catch(e){} }
function clearLocal(){ try{ var k=lsKey(); if(k){ localStorage.removeItem(k); localStorage.removeItem(k+'_pos'); try{ document.cookie=k.replace('aw_draft_','aw_s_')+'=;domain=.aiwills.co.uk;path=/;max-age=0'; }catch(e2){} } }catch(e){} }
var _autoT; function autosave(){ try{ collectVisible(); saveLocal(); }catch(e){} if(!loc){ return; } clearTimeout(_autoT); _autoT=setTimeout(function(){ try{ saveToGhl(state); }catch(e){} }, 1000); } // local draft on every change (survives refresh) + debounced GHL save // persist on every change, not just Continue
document.addEventListener('input', function(e){ var n=e.target.closest('[data-b]'); if(n){ var fl=n.closest('.field'); if(fl) fl.classList.remove('invalid'); autosave(); } });
document.addEventListener('change', function(e){ var n=e.target.closest('[data-b]'); if(!n) return; try{ if(n.tagName==='INPUT' && (n.type==='text'||n.type==='')){ var _ck=(n.getAttribute('data-b')||'').split('.').pop(); if(/postcode/i.test(_ck)){ n.value=n.value.toUpperCase().replace(/\s+/g,' ').trim(); } else if(/name|address|city|county|town/i.test(_ck)){ n.value=n.value.replace(/\b([a-z])/g,function(m,c){return c.toUpperCase();}); } } }catch(_e){} if(n.type==='radio'){ var grp=n.closest('.choices'); if(grp){ [].forEach.call(grp.querySelectorAll('.choice'),function(l){ l.classList.toggle('on', !!l.querySelector('input:checked')); }); } } if(n.type==='checkbox'){ var lb=n.closest('.choice'); if(lb) lb.classList.toggle('on', n.checked); } if(n.getAttribute('data-reflow')==='1'){ collectVisible(); render(); } autosave(); });
document.addEventListener('change', function(e){ var n=e.target.closest('[data-b]'); if(!n) return; var db=n.getAttribute('data-b')||''; var key=db.split('.').pop(); if(!/postcode/i.test(key)) return; var pc=(n.value||'').toUpperCase().replace(/\s+/g,' ').trim(); if(!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(pc)) return; var base=db.slice(0,db.lastIndexOf('.')); try{ fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pc.replace(/\s+/g,''))).then(function(r){return r.json();}).then(function(j){ if(!j||j.status!==200||!j.result) return; var res=j.result; var town=res.admin_district||res.parish||res.admin_ward||''; var county=res.admin_county||res.region||''; var cityEl=document.querySelector('[data-b="'+base+'.city"]'); if(cityEl && !cityEl.value){ cityEl.value=town; setP(base+'.city',town); } var cEl=document.querySelector('[data-b="'+base+'.county"]'); if(cEl && !cEl.value){ cEl.value=county; setP(base+'.county',county); } try{autosave();}catch(_){} }).catch(function(){}); }catch(_){} });
document.addEventListener('click', function(e){ try{ var a=e.target.closest('[data-add]'); if(a){ collectVisible(); addItem(a.getAttribute('data-add')); autosave(); return; } var rm=e.target.closest('[data-rm]'); if(rm){ collectVisible(); getP(rm.getAttribute('data-rm')).splice(+rm.getAttribute('data-i'),1); render(); autosave(); } }catch(err){ alert('Action error: '+err.message); } });
document.addEventListener('change', function(e){ var u=e.target.closest&&e.target.closest('[data-upload]'); if(!u||!u.files||!u.files[0]) return; var file=u.files[0]; var fieldName=u.getAttribute('data-upload'); var nameKey=u.getAttribute('data-namekey'); var stat=u.parentElement.querySelector('.uplstat')||{}; if(file.size>10*1024*1024){ stat.textContent='File too large (max 10MB)'; return; } stat.textContent='Uploading...'; var rd=new FileReader(); rd.onload=function(){ var b64=String(rd.result).split(',')[1]||''; fetch(API+'/api/etb-save',{method:'POST',body:JSON.stringify({locationId:loc,state:state,status:'started',contactId:(window.AIWILLS_ETB_CID||'')})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_ETB_CID=j.contactId; return fetch(API+'/api/etb-upload',{method:'POST',body:JSON.stringify({locationId:loc,contactId:(window.AIWILLS_ETB_CID||''),fieldName:fieldName,filename:file.name,mimeType:file.type,dataBase64:b64})}); }).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ stat.textContent='Uploaded: '+file.name; if(nameKey){ setP(nameKey,file.name); if(j.url) setP(nameKey+'_url',j.url); } try{ autosave(); }catch(e){} } else { stat.textContent='Upload failed: '+((j&&j.error)||'error'); } }).catch(function(){ stat.textContent='Upload failed'; }); }; rd.readAsDataURL(file); });
document.addEventListener('click', function(e){ var rm=e.target.closest&&e.target.closest('.frm'); if(!rm) return; e.preventDefault(); var field=rm.getAttribute('data-frm'), nameKey=rm.getAttribute('data-namekey'); if(nameKey){ setP(nameKey,''); setP(nameKey+'_url',''); } var tok=window.AIWILLS_TOKEN||''; if(tok){ try{ fetch(API+'/api/etb-file-remove',{method:'POST',body:JSON.stringify({t:tok,field:field})}).catch(function(){}); }catch(e2){} } try{ autosave(); }catch(e3){} render(); });
el('next').addEventListener('click', function(){ try{ go(1); }catch(err){ alert('Continue error: '+err.message); } });
el('back').addEventListener('click', function(){ try{ if(window.AIWILLS_EDIT===true){ stripEmptyRepeaters(); try{autosave();}catch(e){} jumpTo('review'); return; } go(-1); }catch(err){ alert('Back error: '+err.message); } });
window.addEventListener('error', function(ev){ alert('Engine error: '+((ev&&ev.message)||'unknown')); });
function closeGaps(){
  try{
    var h=el('hdr'), f=el('ftr');
    var sec=(h&&h.closest)?h.closest('.fullSection,.c-section'):null;
    if(!sec) return;
    var g1=h.getBoundingClientRect().top - sec.getBoundingClientRect().top;
    if(g1>1 && g1<200) h.style.marginTop=(-g1)+'px';
    var g2=sec.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom;
    if(g2>1 && g2<200) f.style.marginBottom=(-g2)+'px';
  }catch(e){}
}
initState(); restoreLocal(); applyBrand();
try{ var _qp=new URLSearchParams(location.search); if(_qp.get('aw_paid')==='1' && _qp.get('aw_id')){ window.AIWILLS_WILL_ID=_qp.get('aw_id'); if(state.payment) state.payment.paid=true; var _vv=visible(); for(var _i=0;_i<_vv.length;_i++){ if(_vv[_i].id==='generate'){ cur=_i; break; } } } if(_qp.get('aw_etb_paid')==='1' && FUNNEL===ETB_FUNNEL){ if(state.payment) state.payment.paid=true; var _ev=visible(); for(var _j=0;_j<_ev.length;_j++){ if(_ev[_j].id==='done'){ cur=_j; break; } } } if(window.AIWILLS_EDIT===true){ var _rv=visible(); for(var _k=0;_k<_rv.length;_k++){ if(_rv[_k].kind==='review'){ cur=_k; break; } } } }catch(e){}
render(); closeGaps();
window.addEventListener('load', closeGaps);
setTimeout(closeGaps,400); setTimeout(closeGaps,1200);

  }
  try{ if(rootEl){ var _KEYS=['company_name','logo_url','primary_color','heading_color','body_color','header_bg_color','page_bg_color','nav_text_color','heading_font','body_font','site_max_width','footer_max_width','nav_font_size','nav_weight','body_font_size','logo_height','heading_font_size','heading_weight','button_weight','phone','email','address','privacy_url','legal_footer','nav_menu_json','footer_menu_json','font_css_links','wills_url','lpa_url','etb_url','wills_title','wills_blurb','lpa_title','lpa_blurb','etb_title','etb_blurb','will_price','button_color','button_hover_color','button_text_color','button_secondary_color','button_secondary_text_color','button_font','button_radius','footer_bg_color','footer_text_color','facebook_url','instagram_url','linkedin_url','twitter_url','youtube_url','tiktok_url']; var _pc={}, _mm='{'+'{'; _KEYS.forEach(function(k){ var v=rootEl.getAttribute('data-'+k); if(v!=null && v!=='' && v.indexOf(_mm)<0) _pc[k]=v; }); if(Object.keys(_pc).length) window.AIWILLS_CONFIG=Object.assign({}, window.AIWILLS_CONFIG||{}, _pc); } }catch(e){}
  (function(){
    var _pcfg = window.AIWILLS_CONFIG || {};
    var _brandKeys = Object.keys(_pcfg).filter(function(k){ return k!=='funnel'; });
    function _runBranded(){
      if(loc){ fetch(API+'/api/brand?locationId='+encodeURIComponent(loc)).then(function(r){return r.json();}).then(function(c){ window.AIWILLS_CONFIG=Object.assign({}, (c&&!c._err)?c:{}, _pcfg); run(); }).catch(function(){ run(); }); } // always fill brand from GHL so a blank/partial page loader never falls back to default; loader data-* still overrides
      else { run(); }
    }
    var _tok=null; try{ _tok=new URLSearchParams(location.search).get('aw_t'); }catch(e){}
    if(_tok){ // edit mode: load this contact's saved answers (token-gated), prefill, then render
      window.AIWILLS_TOKEN=_tok;
      fetch(API+'/api/state-load?t='+encodeURIComponent(_tok)+'&funnel='+encodeURIComponent(String((window.AIWILLS_CONFIG||{}).funnel||''))).then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok){ window.AIWILLS_EDIT=true; window.AIWILLS_FILES=j.files||[]; if(j.state) window.AIWILLS_PREFILL=j.state; if(j.funnel==='wills'||j.funnel==='lpa'){ window.AIWILLS_CONTACT_ID=j.contactId; } else { window.AIWILLS_ETB_CID=j.contactId; } }
      }).catch(function(){}).then(_runBranded);
    } else { _runBranded(); }
  })();
})();
