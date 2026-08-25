/* AI Wills funnel engine - hosted. GHL block only needs:
   <div id="aiwills-funnel" data-loc="{ {location.id} }"></div>
   <script src="https://engine.aiwills.co.uk/api/engine"></script>
   This file injects the funnel, reads the sub-account id, fetches its brand, and renders. */
(function(){
  var API='https://engine.aiwills.co.uk'; try{ if(document.currentScript&&document.currentScript.src){ API=new URL(document.currentScript.src, location.href).origin; } }catch(e){}
  var FONTS="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap";
  var CSS="\n:root{--primary:#444950;--primary-dark:#2f3338;--heading:#1B1D1F;--hdr-ink:#1B1D1F;--nav-ink:#1B1D1F;--body:#303133;--header-bg:#ffffff;--page-bg:#ffffff;--line:#e6e6e6;--muted:#6b6e72;--hf:Georgia,'Times New Roman',serif;--bf:Arial,sans-serif;--site-max:1200px;--nav-size:18px;--nav-weight:500;--logo-h:50px;--body-size:18px;--h-size:40px;--h-weight:900;--btn-weight:600;--footer-max:1140px;--btn-bg:var(--primary);--btn-hover:var(--primary-dark);--btn-ink:#fff;--btn-font:var(--bf);--btn-radius:180px;--ftr-bg:var(--heading);--ftr-ink:#fff}\n*{box-sizing:border-box}html,body{margin:0;padding:0;overflow-x:hidden}\n#aiwills-funnel{opacity:0}#aiwills-funnel.aw-ready{opacity:1;transition:opacity .12s}\nbody{background:var(--page-bg);}\n#aiwills-app,.main,.hubwrap{background:var(--page-bg);color:var(--body);font-family:var(--bf);font-size:var(--body-size);line-height:1.7;-webkit-font-smoothing:antialiased}\nh1{font-family:var(--hf);font-weight:var(--h-weight);font-size:var(--h-size);line-height:1.2;color:var(--heading);margin:0 0 14px}\nh3{font-family:var(--hf);font-weight:900;color:var(--heading);margin:0 0 8px}\np{margin:0 0 1em}\n.hdr{background:var(--header-bg);border-bottom:1px solid var(--line);margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}\n.hwrap{max-width:var(--site-max);margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}\n.logo img{height:var(--logo-h);width:auto;display:block}.logo .wordmark{font-family:var(--hf);font-weight:900;font-size:22px;color:var(--hdr-ink)}\n.hdr nav{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;flex:1}\n.hdr nav a{font-family:var(--hf);font-weight:var(--nav-weight);font-size:var(--nav-size);color:var(--nav-ink);text-decoration:none;white-space:nowrap}\n.hdr nav a:hover{color:var(--primary)}\n.phone{font-weight:600;color:var(--hdr-ink);white-space:nowrap}\n@media(max-width:760px){.hdr nav{display:none}}@media(max-width:640px){.hwrap{padding:12px 16px;gap:10px;flex-wrap:wrap;justify-content:center}.mwrap{padding-left:16px;padding-right:16px}.prog{padding:16px 0 4px}.main{padding:10px 0 40px}h1{font-size:26px}.row{flex-direction:column;gap:12px}.choices{flex-direction:column}.choice{min-width:0;width:100%}input,select,textarea{font-size:16px}.btn{padding:15px 22px;font-size:16px}.navbtns{gap:10px}.fgrid{flex-direction:column;gap:22px}.fwrap{padding:26px 16px 32px}}\n.banner{background:#fff4f3;border-bottom:1px solid #f3c9c6;color:#7a1411;font-size:13px}\n.bwrap{max-width:760px;margin:0 auto;padding:8px 24px}\n.pwrap,.main .mwrap{max-width:760px;margin:0 auto;padding-left:24px;padding-right:24px}\n.prog{padding:26px 0 4px}\n.pmeta{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:8px}.pmeta strong{color:var(--heading);font-weight:600}\n.track{height:8px;border-radius:99px;background:#ececec;overflow:hidden}.track span{display:block;height:100%;background:var(--primary);width:0;transition:width .35s ease}\n.stepmenu{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.stepmenu:empty{display:none}.stepmenu button{font-family:var(--bf);font-size:12px;line-height:1;padding:6px 11px;border-radius:99px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:default;white-space:nowrap}.stepmenu button.done{color:var(--heading);cursor:pointer}.stepmenu button.done:hover{border-color:var(--primary);color:var(--primary)}.stepmenu button.on{background:var(--primary);border-color:var(--primary);color:var(--btn-ink);font-weight:600}@media(max-width:640px){.stepmenu{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}}\n.main{padding:14px 0 50px}\n.lead{color:var(--muted);margin:-.2em 0 1.4em;font-size:16px}\n.field{margin-bottom:18px}.field>label{display:block;font-weight:600;color:var(--heading);margin-bottom:6px;font-size:15px;font-family:var(--bf)}\n.opt{color:var(--muted);font-weight:400}\ninput,select,textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;font-family:var(--bf);font-size:15px;color:var(--body);outline:none}\ninput:focus,select:focus,textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent)}\ntextarea{min-height:96px;resize:vertical}\n.invalid input,.invalid select,.invalid textarea{border-color:#D93025;box-shadow:0 0 0 3px rgba(217,48,37,.12)}\n.err{color:#D93025;font-size:13px;margin-top:5px;display:none}.req{color:#D93025;font-weight:700;margin-left:2px}.invalid .err{display:block}\n.row{display:flex;gap:14px;flex-wrap:wrap}.row>.field{flex:1;min-width:180px}\n.choices{display:flex;gap:10px;flex-wrap:wrap}\n.choice{flex:1;min-width:120px;border:1px solid var(--line);border-radius:12px;padding:13px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;font-weight:500;background:#fff;font-family:var(--bf)}\n.choice.on{border-color:var(--primary);background:#f4f4f4;background:color-mix(in srgb,var(--primary) 8%,#fff)}.choice input{accent-color:var(--primary);width:18px;height:18px}\n.repitem{border:1px solid var(--line);border-radius:12px;padding:14px 14px 2px;margin-bottom:12px;background:#fff}\n.rephead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}\n.rm{background:none;border:none;color:var(--primary);font-weight:600;cursor:pointer;font-size:13px;font-family:var(--bf)}\n.add{background:#fff;border:1.5px dashed var(--primary);color:var(--primary);padding:12px 18px;border-radius:12px;font-weight:600;cursor:pointer;font-family:var(--bf);font-size:15px;width:100%}\n.empty{color:var(--muted);font-size:14px;padding:6px 0 12px}\n.tot{margin:8px 0 4px;font-size:14px;font-weight:600}.tot.ok{color:#157a3f}.tot.bad{color:var(--primary)}\n.sum{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px;background:#fff;scroll-margin-top:14px}\n.sum.justsaved{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 14%,transparent)}\n.sum h3{display:flex;justify-content:space-between;align-items:center;font-size:18px}\n.edit{font-size:13px;font-weight:600;color:var(--primary);background:none;border:none;cursor:pointer;font-family:var(--bf)}\n.srow{display:flex;justify-content:space-between;gap:16px;padding:5px 0;border-top:1px solid #f0ece6;font-size:14px}.srow:first-of-type{border-top:none}\n.srow .k{color:var(--muted)}.srow .v{font-weight:500;text-align:right;color:var(--heading)}\n.navbtns{display:flex;justify-content:space-between;gap:12px;margin-top:30px}\n.btn{font-family:var(--btn-font);font-weight:var(--btn-weight);font-size:18px;border:none;cursor:pointer;border-radius:var(--btn-radius);padding:18px 44px;background:var(--btn-bg);color:var(--btn-ink)}\n.btn:hover{background:var(--btn-hover)}.btn.wide{width:100%}\n.btn.ghost{background:#fff;color:var(--heading);border:1px solid var(--line)}.btn.ghost:hover{border-color:#bbb}\n.mock{border:1px dashed var(--line);border-radius:14px;padding:24px;background:#fff;text-align:center}\n.price{font-family:var(--hf);font-weight:900;font-size:42px;color:var(--heading);margin:6px 0}\n.note{font-size:13px;color:var(--muted);margin-top:10px}\n.tick{width:64px;height:64px;border-radius:50%;background:#157a3f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 14px}\n.spin{width:46px;height:46px;border:4px solid #eee;border-top-color:var(--primary);border-radius:50%;margin:6px auto 14px;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}\n.ftr{background:var(--ftr-bg);border-top:3px solid var(--primary);margin-top:44px;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}\n.fwrap{max-width:var(--footer-max);margin:0 auto;padding:34px 24px 42px}\n.fgrid{display:flex;gap:40px;flex-wrap:wrap;justify-content:space-between;align-items:flex-start}.fgrid>div{flex:1;min-width:220px}\n.fh{font-family:var(--hf);font-weight:900;color:var(--ftr-ink);font-size:24px;margin:0 0 14px}\n.flinks{list-style:none;margin:0;padding:0}.flinks li{margin:0 0 9px}\n.flinks a{color:var(--ftr-ink);opacity:.88;font-size:15px;text-decoration:none}.flinks a:before{content:\"\\203A\";color:var(--primary);font-weight:700;margin-right:8px}\n.flinks a:hover{color:#fff}\n.fcta{font-family:var(--hf);font-weight:900;color:var(--ftr-ink);font-size:30px;line-height:1.18;margin:0 0 18px}\n.frule{border:none;border-top:1px solid #33363a;margin:28px 0 16px}\n.fsoc{margin:0 0 10px}.fsoc a{color:var(--ftr-ink);font-weight:600;font-size:13px;margin-right:14px;text-decoration:none}\n.fleg{font-size:11.5px;color:#8d9094;line-height:1.5;margin:0 0 6px}\n";
  var MARKUP="<header id=\"hdr\" class=\"hdr\"></header>\n<div class=\"pwrap\"><div class=\"prog\"><div class=\"pmeta\"><span id=\"stepName\"></span><strong id=\"stepCount\"></strong></div><div class=\"track\"><span id=\"bar\"></span></div><div class=\"stepmenu\" id=\"stepmenu\"></div></div></div>\n<main class=\"main\"><div class=\"mwrap\"><div id=\"step\"></div><div class=\"navbtns\"><button class=\"btn ghost\" id=\"back\" type=\"button\">Back</button><button class=\"btn\" id=\"next\" type=\"button\">Continue</button></div></div></main>\n<footer id=\"ftr\" class=\"ftr\"></footer>";
  try{
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=FONTS; document.head.appendChild(l);
    var st=document.createElement('style'); st.textContent=CSS+"\n.awfaq{margin:34px auto 0;max-width:var(--wrap,720px);border-top:1px solid var(--line);padding-top:22px}.awfaq h4{font-family:var(--hf);color:var(--heading);font-size:17px;margin:0 0 10px}.awfaq details{border:1px solid var(--line);border-radius:10px;margin:8px 0;background:#fff}.awfaq summary{cursor:pointer;padding:12px 14px;font-weight:600;color:var(--heading);font-family:var(--bf);list-style:none}.awfaq summary::-webkit-details-marker{display:none}.awfaq summary::after{content:'+';float:right;color:var(--muted);font-weight:700}.awfaq details[open] summary::after{content:'\u2013'}.awfaq p{margin:0;padding:0 14px 14px;color:var(--body);font-size:15px;line-height:1.55}"; document.head.appendChild(st);
    setTimeout(function(){ try{ var _mt=document.getElementById('aiwills-funnel'); if(_mt) _mt.classList.add('aw-ready'); }catch(e){} },900);
  }catch(e){}
  /* Falling back to document.body meant innerHTML deleted every node GoHighLevel had put on the
     page: its chat widget, any embedded survey or form, its own scripts. Those things were never
     "failing to load", we were removing them. Build our own mount instead, and hide what was already
     there rather than destroying it, so their scripts keep the elements they are holding on to and
     anything injected after us is left alone entirely. */
  var mount=document.getElementById('aiwills-funnel');
  if(!mount){
    mount=document.createElement('div');
    mount.id='aiwills-funnel';
    try{
      var _kids=[].slice.call(document.body.children);
      for(var _ki=0;_ki<_kids.length;_ki++){
        var _kn=_kids[_ki];
        var _tag=String(_kn.tagName||'').toUpperCase();
        if(_tag==='SCRIPT'||_tag==='STYLE'||_tag==='LINK'||_tag==='NOSCRIPT') continue;
        /* Anything that looks like a live widget stays visible. Hiding the chat bubble would be the
           same bug in a politer form. */
        var _sig=(_kn.id||'')+' '+(_kn.getAttribute&&_kn.getAttribute('class')||'');
        if(/chat|widget|lc_|leadconnector|messenger|intercom|drift/i.test(_sig)) continue;
        try{ _kn.setAttribute('data-aw-hidden','1'); _kn.style.display='none'; }catch(_ke){}
      }
    }catch(_ke2){}
    document.body.appendChild(mount);
  }
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
  try{ if(window.AIWILLS_EDIT===true || !!(window.AIWILLS_TOKEN)){ awStartAutoLogout(); awSignedInBar(); awKeepSessionAlive(); } }catch(e){}
  if(String((window.AIWILLS_CONFIG||{}).funnel||'').toLowerCase()==='hub'){ renderHub(); return; }
  try{ awServicesBar(); }catch(e){}
  try{ var _psf=String(CFG.plan_services||'').toLowerCase().split(',').map(function(x){return x.trim();}).filter(Boolean); var _fk=(function(){var f=String((CFG.funnel)||window.AIWILLS_FUNNEL||'').toLowerCase();return (f==='etb'||f==='lpa')?f:((f==='probate'||f==='referral')?'probate':'wills');})(); if(_psf.length && _psf.indexOf(_fk)<0){ mount.innerHTML='<div class="aw-ready" style="max-width:640px;margin:60px auto;padding:32px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:center;font-family:var(--bf)"><h3 style="font-family:var(--hf);color:var(--heading)">This service is not part of your plan</h3><p style="color:var(--muted)">Please speak to your adviser about adding it, or go back to your services page.</p></div>'; try{ mount.classList.add('aw-ready'); }catch(e){} return; } }catch(e){}
  function renderHub(){
    var enc=encodeURIComponent;
    /* So a service can offer a way back without anyone having to configure the address by hand. */
    try{
      if(loc){
        var _hubHref=location.href.split('#')[0];
        try{ localStorage.setItem('aw_hub_'+loc, _hubHref); }catch(e1){}
        var _hp=String(location.hostname||'').split('.');
        var _hroot=_hp.length>2 ? _hp.slice(-(_hp.length>=3 && _hp[_hp.length-2].length<=3 ? 3 : 2)).join('.') : location.hostname;
        try{ document.cookie='aw_hub_'+loc+'='+encodeURIComponent(_hubHref)+';domain=.'+_hroot+';path=/;max-age=2592000;SameSite=Lax'; }catch(e2){}
      }
    }catch(e){}
    try{ var hs=document.createElement('style'); hs.textContent='.hubwrap{max-width:var(--site-max);margin:0 auto;padding:34px 24px 60px}.hubh1{margin-bottom:6px}.hubgrid{display:flex;flex-wrap:wrap;gap:20px;margin-top:24px}.hubcard{flex:1 1 280px;min-width:260px;max-width:360px;border:1px solid var(--line);border-radius:16px;background:#fff;padding:24px;display:flex;flex-direction:column;gap:12px}.hubic{width:54px;height:54px;border-radius:12px;background:#f4f4f4;background:color-mix(in srgb,var(--icon,var(--primary)) 10%,#fff);color:var(--icon,var(--primary));display:flex;align-items:center;justify-content:center}.hubic svg{width:30px;height:30px}.hubcard h3{font-size:20px;margin:0;font-family:var(--hf)}.hubcard .hubdesc{color:var(--muted);font-size:14px;flex:1;margin:0}.hubcard .hubstatus{font-size:12px;font-weight:700;color:#157a3f}.hubcard .btn{width:100%;text-align:center;text-decoration:none;display:block;padding:13px}@media(max-width:640px){.hubgrid{flex-direction:column}.hubcard{max-width:none}}'; document.head.appendChild(hs); }catch(e){}
    var SVC=[
      {key:'wills',title:(CFG.wills_title||'Your Will'),blurb:(CFG.wills_blurb||'Create a clear, properly structured will and keep it up to date.'),url:(CFG.wills_url||'https://engine.aiwills.co.uk/wills-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 16h4"/></svg>'},
      {key:'lpa',title:(CFG.lpa_title||'Lasting Power of Attorney'),blurb:(CFG.lpa_blurb||'Appoint people you trust to make decisions for you if you ever cannot.'),url:(CFG.lpa_url||'https://engine.aiwills.co.uk/lpa-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5"/></svg>'},
      {key:'etb',title:(CFG.etb_title||'Executor Toolbox'),blurb:(CFG.etb_blurb||'A secure place for everything your executors will need to find.'),url:(CFG.etb_url||'https://engine.aiwills.co.uk/etb-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A3.5 3.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/></svg>'},
      {key:'probate',title:(CFG.probate_title||'Probate'),blurb:(CFG.probate_blurb||'Get a free, no-obligation fixed fee probate quote.'),url:(CFG.probate_url||'https://engine.aiwills.co.uk/probate-test.html'),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-2 5a3.5 3.5 0 0 0 7 0L8 7"/><path d="M16 7l-2 5a3.5 3.5 0 0 0 7 0l-2-5"/></svg>'}
    ];
    try{ var _ps=String(CFG.plan_services||'').toLowerCase().split(',').map(function(x){return x.trim();}).filter(Boolean); if(_ps.length){ SVC=SVC.filter(function(s){ return _ps.indexOf(s.key)>=0; }); } else { SVC=SVC.filter(function(s){ return s.key!=='probate' || !!CFG.probate_url; }); } }catch(e){}
    mount.innerHTML='<header id="hdr" class="hdr"></header><main class="main"><div class="hubwrap"><h1 class="hubh1">Your documents</h1><p class="lead">Choose a service to get started, or open one you have already begun.</p><div id="awlogin" style="margin:2px 0 4px;font-size:14px"></div><div class="hubgrid" id="hubgrid"></div></div></main><footer id="ftr" class="ftr"></footer>';
    try{ applyBrand(); }catch(e){} try{var _sm=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--site-max'))||1200; if(_sm<1120) document.documentElement.style.setProperty('--site-max','1120px');}catch(e){} try{ closeGaps(); }catch(e){} try{ window.addEventListener('load',function(){try{closeGaps();}catch(e){}}); setTimeout(function(){try{closeGaps();}catch(e){}},300); setTimeout(function(){try{closeGaps();}catch(e){}},1000); }catch(e){}
    var contact=(rootEl&&rootEl.getAttribute('data-contact'))||''; if(!contact||contact.indexOf('{'+'{')>=0) contact=qp('aw_c')||window.AIWILLS_CONTACT_ID||''; function awSetParams(u, p){
      // Set rather than append. A stored URL can already carry aw_loc or aw_c, and blindly
      // sticking another copy on the end gave links with the location and contact twice.
      if(!u) return u;
      try{
        var _u = new URL(u, location.href);
        Object.keys(p).forEach(function(k){ var v=p[k]; if(v) _u.searchParams.set(k, v); else _u.searchParams.delete(k); });
        return _u.href;
      }catch(err){
        var q=[]; Object.keys(p).forEach(function(k){ if(p[k]) q.push(k+'='+enc(p[k])); });
        return q.length ? (u+(u.indexOf('?')>=0?'&':'?')+q.join('&')) : u;
      }
    }
    function awSessKey(){ return 'aw_sess_' + (loc || ''); }
    function awSessGet(){ try{ return sessionStorage.getItem(awSessKey()) || ''; }catch(err){ return ''; } }
    function awSessSet(t){ try{ sessionStorage.setItem(awSessKey(), t); }catch(err){} window.AIWILLS_TOKEN = t; }
    function awSessClear(){ try{ sessionStorage.removeItem(awSessKey()); }catch(err){} window.AIWILLS_TOKEN = ''; }
    // The session never travels in a URL. Putting it in a link would write it into browser history
    // and into any page the customer is sent on to, which is the hole we are closing.
    function withId(u){ if(!u) return u; return awSetParams(u, { aw_loc: loc }); }
    function card(s,st){
      /* A probate quote that has been sent is neither "in progress" nor "purchased": there is
         nothing left for the customer to do and telling them to Continue reads as unfinished work. */
      var sent=!!(st&&st.submitted&&!st.paid);
      var done=st&&(st.paid||st.started||st.submitted);
      var btn;
      if(!s.url){ btn='<button class="btn ghost" type="button" disabled>Coming soon</button>'; }
      else if(st&&st.paid){ btn='<a class="btn ghost" target="_top" data-k="'+esc(s.key)+'" href="'+esc(withId(s.url))+'">Open / edit</a>'; }
      else if(sent){ btn='<a class="btn ghost" target="_top" data-k="'+esc(s.key)+'" href="'+esc(withId(s.url))+'">View</a>'; }
      else if(done){ btn='<a class="btn" target="_top" data-k="'+esc(s.key)+'" href="'+esc(withId(s.url))+'">Continue</a>'; }
      else { btn='<a class="btn" target="_top" data-k="'+esc(s.key)+'" href="'+esc(withId(s.url))+'">Get started</a>'; }
      var badge=done?('<div class="hubstatus">'+(st.paid?(s.key==='etb'?'Active':'Purchased'):(sent?(s.key==='probate'?'Quote being prepared':(s.key==='etb'?'Active':'Purchased')):'In progress'))+'</div>'):'';
      return '<div class="hubcard"><div class="hubic">'+s.icon+'</div><h3>'+esc(s.title)+'</h3><p class="hubdesc">'+esc(s.blurb)+'</p>'+badge+btn+'</div>';
    }
    function _awSignedIn(){ return window.AIWILLS_EDIT===true || !!(window.AIWILLS_TOKEN); }
    function _awHasLocal(){ try{ var n=0; ['wills','lpa','etb','probate'].forEach(function(k){ if(localStorage.getItem('aw_draft_'+k+'_'+loc) || document.cookie.indexOf('aw_s_'+k+'_'+loc+'=1')>=0) n++; }); return n>0; }catch(e){ return false; } }
    function _awForgetDevice(){
      try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('aw_draft_')===0 || k.indexOf('aw_ident_')===0 || k.indexOf('aw_sent_')===0) localStorage.removeItem(k); }); }catch(e){}
      try{
        var _ck=String(document.cookie||'').split(';');
        var _dead='=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        var _p=String(location.hostname||'').split('.');
        var _root=_p.length>2 ? _p.slice(-2).join('.') : location.hostname;
        for(var _i=0;_i<_ck.length;_i++){
          var _n=String(_ck[_i].split('=')[0]||'').replace(/^\s+/,'');
          if(_n.indexOf('aw_s_')!==0) continue;
          try{ document.cookie=_n+_dead; }catch(e1){}
          try{ document.cookie=_n+_dead+';domain=.aiwills.co.uk'; }catch(e2){}
          try{ document.cookie=_n+_dead+';domain=.'+_root; }catch(e3){}
        }
      }catch(e){}
      try{ location.reload(); }catch(e){}
    }
    function localSt(){ var o={}; if(!loc) return o; ['wills','lpa','etb','probate'].forEach(function(k){ try{ if(localStorage.getItem('aw_draft_'+k+'_'+loc) || document.cookie.indexOf('aw_s_'+k+'_'+loc+'=1')>=0) o[k]={started:true,paid:false}; }catch(e){}
      /* The services page can only ask the server about somebody who is signed in, so a customer who
         sent a probate quote without signing in was shown that card as though they had never finished.
         The device remembers it was sent, which is enough to stop the page telling them otherwise. */
      try{ if(localStorage.getItem('aw_sent_'+k+'_'+loc)==='1'){ o[k]=o[k]||{started:true,paid:false}; o[k].started=true; o[k].submitted=true; } }catch(e){} }); return o; }
    function mergeSt(a,b){ var o={}; ['wills','lpa','etb','probate'].forEach(function(k){ var x=a[k]||{}, y=b[k]||{}; o[k]={ started:!!(x.started||y.started), paid:!!(x.paid||y.paid), submitted:!!(x.submitted||y.submitted) }; }); return o; }
    function paint(st){ var g=el('hubgrid'); if(!g) return; g.innerHTML=SVC.map(function(s){return card(s, st[s.key]);}).join('');
      // Gate: a visitor who is not logged in gets asked "new or returning?" before entering any service.
      g.querySelectorAll('a.btn').forEach(function(a){ a.addEventListener('click', function(ev){
        if(window.AIWILLS_EDIT===true) return; // logged in: straight through
        var known=null; try{ known=JSON.parse(localStorage.getItem('aw_ident_'+loc)||'null'); }catch(e){}
        if(known && (known.email||known.phone)){ ev.preventDefault(); awKnownGo(a.getAttribute('href'), a.getAttribute('data-k')||'wills', known); return; } // already gave details on this device: no gate
        ev.preventDefault(); awGate(a.getAttribute('href'), a.getAttribute('data-k')||'wills');
      }); });
    }
    function awKnownGo(url,svcKey,known){
      try{ var section=(svcKey==='wills')?'personal':((svcKey==='probate')?'contact_details':'your_details');
        var ex=null; try{ ex=JSON.parse(localStorage.getItem('aw_draft_'+svcKey+'_'+loc)||'null'); }catch(e){}
        /* Somebody who finished this service while signed in has no local draft, because drafts are
           deliberately not written for a signed-in session. Fabricating a blank one dropped them on
           question one of something they had already sent, which reads as if their work was lost.
           Send them through the returning customer route instead, which fetches their real answers. */
        var _sent=false; try{ _sent=(localStorage.getItem('aw_sent_'+svcKey+'_'+loc)==='1'); }catch(e){}
        if(!ex && _sent){ awGate(url, svcKey); return; }
        if(!ex){ var d={}; d[section]={ firstName:known.firstName||'', email:known.email||'', phone:known.phone||'' }; localStorage.setItem('aw_draft_'+svcKey+'_'+loc, JSON.stringify(d)); try{ localStorage.setItem('aw_draft_'+svcKey+'_'+loc+'_ts', String(Date.now())); }catch(e9){} }
      }catch(e){}
      var u=url||''; if(u && known.cid && u.indexOf('aw_c=')<0) u+=(u.indexOf('?')>=0?'&':'?')+'aw_c='+enc(known.cid);
      if(u) window.top.location.href=u;
    }
    function awGate(url,svcKey){
      var m=document.getElementById('awgatemodal'); if(!m){ m=document.createElement('div'); m.id='awgatemodal'; document.body.appendChild(m); }
      m.style.cssText='position:fixed;inset:0;background:rgba(20,20,20,.45);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--bf,Arial,sans-serif)';
      m.innerHTML='<div style="background:#fff;max-width:420px;width:100%;border-radius:16px;padding:26px 24px;box-shadow:0 10px 40px rgba(0,0,0,.2)"><h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading);margin:0 0 6px;font-size:21px">Have you used us before?</h2><p style="color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 18px">If you have already started or bought a service, log in and we will bring up your saved details. If you are new, carry straight on.</p><button type="button" id="awgatenew" style="width:100%;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">I\'m new - get started</button><button type="button" id="awgatelogin" style="width:100%;margin-top:8px;background:#fff;color:var(--heading);border:1px solid var(--line);border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">I\'ve been here before - log in</button><button type="button" id="awgateclose" style="width:100%;margin-top:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px">Cancel</button></div>';
      document.getElementById('awgatenew').onclick=function(){ awGateNew(m,url,svcKey||'wills'); };
      document.getElementById('awgatelogin').onclick=function(){ try{ m.parentNode.removeChild(m); }catch(e){} awOpenLogin(); };
      document.getElementById('awgateclose').onclick=function(){ try{ m.parentNode.removeChild(m); }catch(e){} };
      m.onclick=function(ev){ if(ev.target===m){ try{ m.parentNode.removeChild(m); }catch(e){} } };
    }
    function awGateConsentText(){
      var C=window.AIWILLS_CONFIG||{};
      if(C.gate_consent_label) return esc(C.gate_consent_label);
      var firm=esc(C.company_name||'this firm');
      var lnk=function(u,t){ return u ? ('<a href="'+esc(u)+'" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline">'+esc(t)+'</a>') : esc(t); };
      return 'I am happy for '+firm+' to contact me about my enquiry, and I accept their '+lnk(C.privacy_url,'privacy notice')+'.';
    }
    function awGateNew(m,url,svcKey){
      // Capture name + contact details up front so the firm can stay in touch even if the visitor
      // does not finish the form, then carry the details into the service pre-filled.
      m.innerHTML='<div style="background:#fff;max-width:460px;width:100%;border-radius:16px;padding:28px 26px;box-shadow:0 10px 40px rgba(0,0,0,.2);max-height:88vh;overflow:auto"><h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading);margin:0 0 6px;font-size:21px">First, a few details</h2><p style="color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 16px">So we can save your progress and keep in touch as you go.</p><input id="awgfn" placeholder="First name" autocomplete="given-name" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font-size:15px;font-family:var(--bf);margin-bottom:10px"><input id="awgem" type="email" placeholder="Email" autocomplete="email" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font-size:15px;font-family:var(--bf);margin-bottom:10px"><input id="awgph" type="tel" placeholder="Mobile number" autocomplete="tel" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font-size:15px;font-family:var(--bf)"><div style="margin:18px 0 6px;text-align:left"><label style="display:flex;gap:11px;align-items:flex-start;cursor:pointer;font-size:14px;line-height:1.6;color:var(--body);font-family:var(--bf,inherit);margin:0 0 12px"><input type="checkbox" id="awgc1" style="margin:3px 0 0;width:17px;height:17px;flex:0 0 17px"><span style="flex:1 1 auto;min-width:0">'+awGateConsentText()+'</span></label><label style="display:flex;gap:11px;align-items:flex-start;cursor:pointer;font-size:14px;line-height:1.6;color:var(--muted);font-family:var(--bf,inherit);margin:0"><input type="checkbox" id="awgc2" style="margin:3px 0 0;width:17px;height:17px;flex:0 0 17px"><span style="flex:1 1 auto;min-width:0">'+esc((window.AIWILLS_CONFIG||{}).marketing_label||'I would also like helpful updates and offers by email or text.')+'</span></label></div><div id="awgmsg" style="font-size:13px;margin:4px 0 2px;min-height:18px;color:#c8100d"></div><button type="button" id="awgo" style="width:100%;margin-top:6px;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">Continue</button><button type="button" id="awgback" style="width:100%;margin-top:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px">Back</button></div>';
      document.getElementById('awgback').onclick=function(){ awGate(url,svcKey); };
      document.getElementById('awgo').onclick=function(){
        var fn=(document.getElementById('awgfn').value||'').trim();
        var em=(document.getElementById('awgem').value||'').trim();
        var ph=(document.getElementById('awgph').value||'').trim();
        var msg=document.getElementById('awgmsg');
        if(!fn){ msg.textContent='Please enter your first name.'; return; }
        if(!/.+@.+\..+/.test(em)){ msg.textContent='Please enter a valid email.'; return; }
        if(ph.replace(/[^0-9]/g,'').length<7){ msg.textContent='Please enter a valid mobile number.'; return; }
        var c1=document.getElementById('awgc1'), c2=document.getElementById('awgc2');
        if(c1 && !c1.checked){ msg.style.color='#c8100d'; msg.textContent='Please tick the box so we know we can contact you.'; return; }
        var btn=document.getElementById('awgo'); btn.disabled=true; msg.style.color='var(--muted)'; msg.textContent='One moment...';
        var section=(svcKey==='wills')?'personal':((svcKey==='probate')?'contact_details':'your_details');
        var details={ firstName:fn, email:em, phone:ph };
        var _cAt=new Date().toISOString(), _cMkt=(c2&&c2.checked)?'Yes':'No';
        var consent={ contact:'Yes', at:_cAt, marketing:_cMkt, firm:((window.AIWILLS_CONFIG||{}).company_name||'') };
        var consentDetail=[
          { name:'Consent - Happy to be contacted', value:'Yes' },
          { name:'Consent - Given at', value:_cAt },
          { name:'Consent - Marketing opt-in', value:_cMkt }
        ];
        // Pre-fill the first step of the service on this device.
        try{ var d={}; d[section]=details; localStorage.setItem('aw_draft_'+svcKey+'_'+loc, JSON.stringify(d)); }catch(e){}
        // Create the contact now so the firm can follow up even if they stop here.
        var ep, body;
        var st={}; st[section]=details; st.consent=consent;
        if(svcKey==='lpa'){ ep='/api/lpa-save'; body={locationId:loc,contactId:_awCid(),state:st,detail:consentDetail,step:'gate'}; }
        else if(svcKey==='etb'){ ep='/api/etb-save'; body={locationId:loc,contactId:_awCidEtb(),state:st,detail:consentDetail,status:'started',step:'gate'}; }
        else if(svcKey==='probate'){ ep='/api/referral-save'; body={locationId:loc,contactId:_awCid(),state:st,detail:consentDetail,key:'probate',step:'gate',status:'started'}; }
        else { ep='/api/will-save'; body={locationId:loc,contactId:_awCid(),state:st,detail:consentDetail,step:'gate'}; }
        var goNext=function(cid){ try{ localStorage.setItem('aw_ident_'+loc, JSON.stringify({ firstName:fn, email:em, phone:ph, cid:cid||'', consent:consent })); }catch(e){} var u=url||''; /* the contact they just created stays in this browser, it does not travel in the link */ try{ m.parentNode.removeChild(m); }catch(e){} if(u) window.top.location.href=u; };
        fetch(API+ep,{method:'POST',body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){ goNext((j&&j.contactId)||''); }).catch(function(){ goNext(''); });
      };
    }
    paint(localSt());
    var _hubTok=(window.AIWILLS_TOKEN||''); if(loc && _hubTok){ fetch(API+'/api/hub-status?locationId='+enc(loc)+(contact?('&contactId='+enc(contact)):'')+'&t='+enc(_hubTok)).then(function(r){return r.json();}).then(function(j){ if(j&&j.services){ paint(mergeSt(localSt(),j.services)); } else if(j&&j.error){ try{ awSessClear(); }catch(e){} try{ window.AIWILLS_EDIT=false; }catch(e){} try{ paint(localSt()); awHubLoginUI(); awOpenLogin(); }catch(e){} } }).catch(function(){}); }
    awHubLoginUI();
    try{
      var _alq=new URLSearchParams(location.search);
      if((_alq.get('aw_login')==='1' || window.__awSessDead===true) && window.AIWILLS_EDIT!==true){ awOpenLogin(); }
    }catch(e){}
    function awHubLoginUI(){
      var box=document.getElementById('awlogin'); if(!box) return;
      /* This was two runs of small grey text stacked on each other, which read as fine print rather
         than as the two controls on the page. One bar, the sentence on the left, the action on the
         right as something that looks pressable. The device note only appears when there is
         actually something saved to clear. */
      var BAR='display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;'
            + 'border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:4px 0 22px;background:rgba(255,255,255,.55)';
      var LINK='display:inline-block;padding:8px 16px;border:1px solid var(--primary);border-radius:var(--btn-radius,10px);'
            + 'color:var(--primary);font-weight:600;text-decoration:none;font-size:14px;white-space:nowrap;cursor:pointer;background:transparent';
      if(window.AIWILLS_EDIT===true){
        box.innerHTML='<div style="'+BAR+'">'
          + '<span style="color:var(--body);font-size:15px">You are signed in. Your answers are saved to your account.</span>'
          + '<a href="#" id="awlogout" style="'+LINK+'">Log out</a>'
          + '</div>';
        var lo=document.getElementById('awlogout'); if(lo) lo.addEventListener('click',function(ev){ ev.preventDefault(); awLogout('manual'); });
      } else {
        box.innerHTML='<div style="'+BAR+'">'
          + '<span style="color:var(--body);font-size:15px">New here? Choose a service below, no account needed.</span>'
          + '<a href="#" id="awloginlink" style="'+LINK+'">Already started? Log in</a>'
          + '</div>'
          + (_awHasLocal()
              ? '<p style="margin:-14px 0 20px;font-size:13px;color:var(--muted)">There is saved progress on this device. <a href="#" id="awforget" style="color:var(--primary);font-weight:600;text-decoration:none">Not you? Remove it</a></p>'
              : '');
        var fg=document.getElementById('awforget'); if(fg) fg.addEventListener('click',function(ev){ ev.preventDefault(); _awForgetDevice(); });
        var ll=document.getElementById('awloginlink'); if(ll) ll.addEventListener('click',function(ev){ ev.preventDefault(); awOpenLogin(); });
      }
    }
    function awOpenLogin(){
      var m=document.getElementById('awloginmodal'); if(!m){ m=document.createElement('div'); m.id='awloginmodal'; document.body.appendChild(m); }
      m.style.cssText='position:fixed;inset:0;background:rgba(20,20,20,.45);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--bf,Arial,sans-serif)';
      m.innerHTML='<div style="background:#fff;max-width:420px;width:100%;border-radius:16px;padding:26px 24px;box-shadow:0 10px 40px rgba(0,0,0,.2)"><h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading);margin:0 0 6px;font-size:21px">Log in to your account</h2><p style="color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 16px">We will send you a secure one-tap link. No password needed.</p><div style="display:flex;gap:8px;margin-bottom:14px"><button type="button" id="awtabsms" style="flex:1;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;font-family:var(--bf)">Text me</button><button type="button" id="awtabemail" style="flex:1;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;font-family:var(--bf)">Email me</button></div><input id="awlogininput" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font-size:15px;font-family:var(--bf)"><div id="awloginmsg" style="font-size:13px;margin-top:10px;min-height:18px;color:var(--muted)"></div><button type="button" id="awloginsend" style="width:100%;margin-top:8px;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">Send my link</button><button type="button" id="awloginclose" style="width:100%;margin-top:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px">Cancel</button><p style="color:var(--muted);font-size:12.5px;line-height:1.5;margin:14px 0 0;padding-top:12px;border-top:1px solid var(--line)">Not started with us yet? You do not need an account. Close this and choose a service, we will set one up as you go.</p></div>';
      var chan='sms';
      function setTab(c){ chan=c; var inp=document.getElementById('awlogininput'); if(c==='sms'){ inp.type='tel'; inp.placeholder='Your mobile number'; } else { inp.type='email'; inp.placeholder='you@example.com'; } inp.value=''; try{ inp.focus(); }catch(e){} var _tm=document.getElementById('awloginmsg'); if(_tm) _tm.textContent=''; document.getElementById('awtabsms').style.fontWeight=(c==='sms')?'700':'400'; document.getElementById('awtabsms').style.borderColor=(c==='sms')?'var(--primary)':'var(--line)'; document.getElementById('awtabemail').style.fontWeight=(c==='email')?'700':'400'; document.getElementById('awtabemail').style.borderColor=(c==='email')?'var(--primary)':'var(--line)'; }
      document.getElementById('awtabsms').onclick=function(){ setTab('sms'); };
      document.getElementById('awtabemail').onclick=function(){ setTab('email'); };
      document.getElementById('awloginclose').onclick=function(){ m.parentNode&&m.parentNode.removeChild(m); };
      m.onclick=function(ev){ if(ev.target===m){ m.parentNode&&m.parentNode.removeChild(m); } };
      setTab('sms');
      document.getElementById('awloginsend').onclick=function(){
        var v=(document.getElementById('awlogininput').value||'').trim(); var msg=document.getElementById('awloginmsg');
        if(chan==='email' && !/.+@.+\..+/.test(v)){ msg.style.color='#c8100d'; msg.textContent='Please enter a valid email.'; return; }
        if(chan==='sms' && v.replace(/[^0-9]/g,'').length<7){ msg.style.color='#c8100d'; msg.textContent='Please enter a valid mobile number.'; return; }
        var btn=document.getElementById('awloginsend'); btn.disabled=true; msg.style.color='var(--muted)'; msg.textContent='Sending...';
        var base=location.origin+location.pathname+'?aw_loc='+enc(loc);
        var body={ locationId:loc, funnel:'wills', channel:chan, returnBase:base }; if(chan==='email') body.email=v; else body.phone=v;
        fetch(API+'/api/edit-request',{method:'POST',body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
          var how=(chan==='sms'?'text message':'email');
          m.innerHTML='<div style="background:#fff;max-width:420px;width:100%;border-radius:16px;padding:26px 24px;box-shadow:0 10px 40px rgba(0,0,0,.2);text-align:center">'
            + '<h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading);margin:0 0 8px;font-size:21px">Check your '+how+'</h2>'
            + '<p style="color:var(--muted);font-size:14px;line-height:1.55;margin:0 0 4px">If we have your details, a secure link is on its way to <strong>'+esc(v)+'</strong>. It opens your saved answers and expires after an hour.</p>'
            + '<p style="color:var(--muted);font-size:13px;line-height:1.55;margin:12px 0 18px">Nothing arrives? You may not have started with us on those details yet. Close this and choose a service, no account needed.</p>'
            + '<button type="button" id="awloginok" style="width:100%;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">Close</button>'
            + '</div>';
          var okb=document.getElementById('awloginok'); if(okb) okb.onclick=function(){ m.parentNode&&m.parentNode.removeChild(m); };
        }).catch(function(){ btn.disabled=false; msg.style.color='#c8100d'; msg.textContent='Something went wrong, please try again.'; });
      };
    }
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
/* ---- Acceptance ----
   Two ticks, straight above the button that commits them. The wording links out to the firm's
   own terms and privacy notice, so we never host or author legal text. Marketing is a separate
   optional tick because bundling it with the terms would invalidate it. The moment they tick is
   stamped on the contact, which is the part that is any use if it is ever questioned. */
function awLink(url, label){ return url ? ('<a href="'+esc(url)+'" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline">'+esc(label)+'</a>') : esc(label); }
function lpaQtyFor(st){ var t=String(((st||state).lpa_type||{}).type||''); return /both/i.test(t) ? 2 : 1; }
function lpaTotal(){ var p=parseFloat(String(CFG.lpa_price||CFG.will_price||'').replace(/[^0-9.]/g,''))||0; return Math.round(p*lpaQtyFor(state)*100)/100; }
function awConsentHtml(){
  var firm=esc(CFG.company_name||'the firm');
  var terms=awLink(CFG.terms_url,'terms of business'), priv=awLink(CFG.privacy_url,'privacy notice');
  var privLine='<div style="font-size:13px;color:var(--muted);margin-top:8px">See our '+priv+'.</div>';
  var accepted=(getP('consent.accepted')==='Yes'), mkt=(getP('consent.marketing')==='Yes');
  var custom=CFG.consent_label ? esc(CFG.consent_label) : ('I accept '+firm+"'s "+terms+'.');
  return '<div class="awconsent" style="text-align:left;margin:20px 0 6px;line-height:1.6">'
    + '<label style="display:flex;gap:11px;align-items:flex-start;cursor:pointer;font-size:14px;line-height:1.6;color:var(--body);font-family:var(--bf,inherit)">'
    +   '<input type="checkbox" id="awcterms"'+(accepted?' checked':'')+' style="margin:3px 0 0;width:17px;height:17px;flex:0 0 17px"><span style="flex:1 1 auto;min-width:0">'+custom+'</span></label>'
    + privLine
    + '<div id="awcerr" style="color:#c8100d;font-size:13px;margin-top:8px;display:none">Please accept the terms to continue.</div></div>';
}
function awConsentOk(){
  var box=el('awcterms'); if(!box) return true;                     // no tick shown = nothing to enforce
  var mk=el('awcmkt');
  if(mk) setP('consent.marketing', mk.checked?'Yes':'No');
  if(!box.checked){ var er=el('awcerr'); if(er) er.style.display='block'; try{ box.focus(); }catch(e){} return false; }
  if(getP('consent.accepted')!=='Yes'){
    setP('consent.accepted','Yes');
    setP('consent.at', new Date().toISOString());
    setP('consent.terms', CFG.terms_url||'');
    setP('consent.privacy', CFG.privacy_url||'');
    setP('consent.firm', CFG.company_name||'');
  }
  try{ saveLocal(); }catch(e){}
  return true;
}
function fmtPrice(p){ p=String(p==null?'':p).trim(); if(!p) return p; return /^[0-9]+([.][0-9]{1,2})?$/.test(p)?('\u00a3'+p):p; }
var AWFAQ=null, _awfaqTried=false;
function loadFaq(){ if(_awfaqTried) return; _awfaqTried=true; try{ fetch(API+'/api/faq').then(function(r){return r.json();}).then(function(j){ AWFAQ=(j&&j.faq)?j.faq:{}; try{ paintFaq(); }catch(e){} }).catch(function(){}); }catch(e){} }
function faqFor(stepId){ try{ if(!AWFAQ) return []; var svc=AWFAQ[FUNNEL_KEY]; if(!svc) return []; return svc[stepId]||[]; }catch(e){ return []; } }
function paintFaq(){
  try{
    var host=el('awfaq'); if(!host) return;
    var vis=visible(), s=vis[cur]; if(!s){ host.innerHTML=''; return; }
    var list=faqFor(s.id);
    if(!list.length){ host.innerHTML=''; return; }
    host.innerHTML='<h4>Common questions</h4>'+list.map(function(x){
      return '<details><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>';
    }).join('');
  }catch(e){}
}
function age(d){ if(!d) return null; var t=new Date(d); if(isNaN(t)) return null; var n=new Date(), a=n.getFullYear()-t.getFullYear(), m=n.getMonth()-t.getMonth(); if(m<0||(m===0&&n.getDate()<t.getDate())) a--; return a; }
function saveToGhl(state, opts){ var _pdf=!!(opts&&opts.pdf); var _sid=''; try{ var _vv=visible(); _sid=(_vv[cur]&&_vv[cur].id)||''; }catch(e){} try{ if(FUNNEL===REFERRAL_FUNNEL){ if(!loc) return; try{ fetch(API+'/api/referral-save',{method:'POST',body:JSON.stringify({locationId:loc,detail:awDetailFields(),contactId:(window.AIWILLS_CONTACT_ID||''),state:state,key:FUNNEL_KEY,step:_sid,status:((opts&&opts.submitted)?'submitted':'started')})}).then(function(r){return r.json();}).then(awAdopt('AIWILLS_CONTACT_ID')).catch(function(){}); }catch(e){} return; } }catch(e){} try{ if(FUNNEL===ETB_FUNNEL){ if(!loc) return; var st=(state.payment&&state.payment.paid)?'paid':'started'; try{ fetch(API+'/api/etb-save',{method:'POST',body:JSON.stringify({locationId:loc,state:state,status:st,detail:awDetailFields(),contactId:(window.AIWILLS_ETB_CID||''),step:_sid,pdf:_pdf})}).then(function(r){return r.json();}).then(awAdopt('AIWILLS_ETB_CID')).catch(function(){}); }catch(e){} return; } }catch(e){} try{ if(FUNNEL===LPA_FUNNEL){ if(!loc) return; try{ fetch(API+'/api/lpa-save',{method:'POST',body:JSON.stringify({locationId:loc,detail:awDetailFields(),contactId:(window.AIWILLS_CONTACT_ID||''),state:state,step:_sid,pdf:_pdf})}).then(function(r){return r.json();}).then(awAdopt('AIWILLS_CONTACT_ID')).catch(function(){}); }catch(e){} return; } }catch(e){} var p=state.personal||{}; if(loc){ try{ fetch(API+'/api/will-save',{method:'POST',body:JSON.stringify({locationId:loc,detail:awDetailFields(),contactId:(window.AIWILLS_CONTACT_ID||''),state:state,step:_sid,pdf:_pdf})}).then(function(r){return r.json();}).then(awAdopt('AIWILLS_CONTACT_ID')).catch(function(){}); }catch(e){} } var url=CFG.will_save_webhook_url; if(url){ try{ fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:(window.AIWILLS_CONTACT_ID||''),email:p.email||'',firstName:p.firstName||'',lastName:p.lastName||'',phone:p.phone||'',status:(state.payment&&state.payment.paid)?'paid':'started',willJson:JSON.stringify(state)})}); }catch(e){} } }

var REL_DEFAULT=['Spouse','Civil Partner','Partner','Son','Daughter','Stepchild','Grandchild','Parent','Grandparent','Brother','Sister','Aunt','Uncle','Niece','Nephew','Cousin','Friend'];
function relOpts(){ try{ var c=JSON.parse((window.AIWILLS_CONFIG||{}).relationship_options_json||'null'); if(Array.isArray(c)&&c.length) return c; }catch(e){} return REL_DEFAULT; }
var ATTORNEY_REL=['Spouse','Civil partner','Partner','Son','Daughter','Parent','Brother','Sister','Other relative','Friend','Neighbour','Colleague','Solicitor','Accountant','Other professional','Other'];
function attorneyRelOpts(){ try{ var c=JSON.parse((window.AIWILLS_CONFIG||{}).attorney_relationship_options_json||'null'); if(Array.isArray(c)&&c.length) return c; }catch(e){} return ATTORNEY_REL; }
var GIFT_FIELDS = [
  { key:'items', type:'repeater', itemLabel:'Item gift', max:20, fields:[
    { key:'description', type:'text', label:'What is the item?', required:true },
    { type:'row', fields:[ {key:'recipientFirstName',type:'text',label:'Recipient first name',required:true}, {key:'recipientLastName',type:'text',label:'Recipient last name',required:true} ] },
    { key:'recipientRelationship', type:'select', options:relOpts, label:'Their relationship to you', required:true },
    { key:'recipientAddress', type:'text', label:'Recipient address (line 1)', required:true },
    { type:'row', fields:[ {key:'recipientCity',type:'text',label:'Town / city',required:true}, {key:'recipientPostcode',type:'text',label:'Postcode',required:true} ] }
  ]},
  { key:'cash', type:'repeater', itemLabel:'Cash gift', max:20, fields:[
    { key:'amount', type:'number', label:'Amount (£)', required:true },
    { type:'row', fields:[ {key:'beneficiaryFirstName',type:'text',label:'Beneficiary first name',required:true}, {key:'beneficiaryLastName',type:'text',label:'Beneficiary last name',required:true} ] },
    { key:'beneficiaryRelationship', type:'select', options:relOpts, label:'Their relationship to you', required:true },
    { key:'beneficiaryAddress', type:'text', label:'Beneficiary address (line 1)', required:true },
    { type:'row', fields:[ {key:'beneficiaryCity',type:'text',label:'Town / city',required:true}, {key:'beneficiaryPostcode',type:'text',label:'Postcode',required:true} ] }
  ]},
  { key:'charities', type:'repeater', itemLabel:'Charitable donation', max:20, fields:[
    { type:'row', fields:[ {key:'name',type:'text',label:'Charity name',required:true}, {key:'number',type:'text',label:'Charity number',required:true} ] },
    { key:'amount', type:'number', label:'Amount (£)', required:true }
  ]},
  { key:'pets', type:'repeater', itemLabel:'Gift for pets', max:20, fields:[
    { type:'row', fields:[ {key:'description',type:'text',label:'Pet(s) name / description',required:true}, {key:'amount',type:'number',label:'Amount (£)',required:true} ] },
    { type:'note', label:'Who will care for them?' },
    { type:'row', fields:[ {key:'guardianFirstName',type:'text',label:'Their first name',required:true}, {key:'guardianLastName',type:'text',label:'Their last name',required:true} ] }
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
    { key:'title', type:'select', label:'Their title', required:true, options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'], showIf:pYes },
    { type:'row', showIf:pYes, fields:[ {key:'firstName',type:'text',label:'Their first name',required:true}, {key:'middleName',type:'text',label:'Their middle name(s)'} ] },
    { key:'lastName', type:'text', label:'Their last name', required:true, showIf:pYes },
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
  { id:'addlpa', name:'Add LPA', title:'Add a Lasting Power of Attorney?', lead:'A will decides who inherits. A Lasting Power of Attorney lets people you trust make decisions for you if you ever cannot. You can add one to your order now. If you are preparing mirror wills your choice applies to both of you, and we will collect the attorney details after payment.', showIf:function(s){ return !!(CFG.lpa_price && String(CFG.lpa_price).replace(/[^0-9.]/g,'')); }, fields:[
    { key:'want', type:'radio', label:'Would you like to add an LPA?', required:true, reflow:true, options:['No, just my will','Property & Financial Affairs','Health & Welfare','Both types'] }
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
      { key:'relationship', type:'select', options:attorneyRelOpts, label:'How do you know them?' },
      { key:'isTrustCorp', type:'radio', label:'Is this attorney a trust corporation? (rare - usually No)', reflow:true, options:['No','Yes'] },
      { key:'companyRegNumber', type:'text', label:'Company registration number', required:true, showIf:function(s,b){return getP(b+'.isTrustCorp')==='Yes';} },
      { key:'hasReplacement', type:'radio', label:'Add a replacement attorney for this person?', reflow:true, options:['Yes','No'] },
      { key:'repTitle', type:'select', label:'Replacement title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'], showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repFirstName', type:'text', label:'Replacement first name', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repLastName', type:'text', label:'Replacement last name', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repAddress', type:'text', label:'Replacement address line 1', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repCity', type:'text', label:'Replacement town / city', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repPostcode', type:'text', label:'Replacement postcode', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} },
      { key:'repDob', type:'date', label:'Replacement date of birth', required:true, showIf:function(s,b){return getP(b+'.hasReplacement')==='Yes';} }
    ]}
  ]},
  { id:'lpa_type', name:'LPA type', title:'Which LPA would you like?', lead:'You can make one or both types.', fields:[
    { key:'type', type:'radio', label:'LPA type', required:true, reflow:true, options:['Property & Financial Affairs','Health & Welfare','Both'] }
  ]},
  { id:'decisions', name:'Decisions', title:'How should attorneys make decisions?', fields:[
    { key:'mode', type:'radio', label:'How should attorneys act?', required:true, reflow:true, options:['Jointly (all must agree)','Jointly and severally (together or independently)','Jointly for some, severally for others'] },
    { key:'mixedDetail', type:'textarea', label:'Which decisions must be made jointly?', required:true, showIf:function(s){return s.decisions.mode==='Jointly for some, severally for others';} }
  ]},
  { id:'treatment', name:'Treatment', title:'Life-sustaining treatment', lead:'Health & Welfare only.', showIf:function(s){var t=s.lpa_type.type; return t==='Health & Welfare'||t==='Both';}, fields:[
    { key:'lifeSustaining', type:'radio', label:'Do you want your attorneys to be able to make decisions about life-sustaining treatment?', required:true, options:['Yes','No'] }
  ]},
  { id:'preferences', name:'Preferences', title:'Preferences & instructions', fields:[
    { key:'hasPreferences', type:'radio', label:'Do you want to include any preferences?', reflow:true, options:['Yes','No'] },
    { key:'preferences', type:'textarea', label:'Your preferences', required:true, showIf:function(s){return s.preferences.hasPreferences==='Yes';} },
    { key:'hasInstructions', type:'radio', label:'Do you want to include legally binding instructions?', reflow:true, options:['Yes','No'] },
    { key:'instructions', type:'textarea', label:'Your instructions', required:true, showIf:function(s){return s.preferences.hasInstructions==='Yes';} }
  ]},
  { id:'usage', name:'Usage', title:'When can the LPA be used?', lead:'Property & Financial only.', showIf:function(s){var t=s.lpa_type.type; return t==='Property & Financial Affairs'||t==='Both';}, fields:[
    { key:'when', type:'radio', label:'When can attorneys start using the Property & Financial LPA?', required:true, options:['As soon as it is registered','Only if I lose mental capacity'] }
  ]},
  { id:'notify', name:'Notify', title:'People to notify', lead:'Optional. People told when the LPA is registered.', fields:[
    { key:'has', type:'radio', label:'Do you want to notify anyone when the LPA is registered?', reflow:true, options:['Yes','No'] },
    { key:'list', type:'repeater', itemLabel:'Person to notify', max:5, showIf:function(s){return s.notify.has==='Yes';}, fields:[
      { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'address', type:'text', label:'Address line 1', required:true },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] }
    ]}
  ]},
  { id:'provider', name:'Provider', title:'Certificate provider', lead:'An independent person who confirms you understand the LPA.', fields:[
    { key:'kind', type:'radio', label:'Who will be your certificate provider?', required:true, options:['Someone who has known me 2+ years','A professional (doctor, solicitor, etc.)'] },
    { key:'title', type:'select', label:'Title', options:['Mr','Mrs','Miss','Ms','Mx','Dr','Prof','Other'] },
      { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
      { key:'address', type:'text', label:'Address line 1', required:true },
      { type:'row', fields:[ {key:'city',type:'text',label:'Town / city',required:true}, {key:'postcode',type:'text',label:'Postcode',required:true} ] },
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
  // Probate quote. Mirrors the probatecompare.co.uk/survey flow: it establishes whether this
  // person can actually apply, then sizes the job. Short on purpose - it is a quote request,
  // not a client interview.
  { id:'about', name:'Getting started', title:(window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.referral_title)||'Compare probate quotes in minutes', lead:'A few quick questions and we will come back with a fixed fee quote. It takes about two minutes.', fields:[
    { key:'liveEW', type:'radio', label:'Did the deceased usually live in England or Wales?', required:true, reflow:true, options:['Yes','No'] },
    { key:'outsideNote', type:'note', text:'Estates outside England and Wales follow a different process. Leave your details and we will tell you how we can help.', showIf:function(s){ return s.about.liveEW==='No'; } },
    { key:'hasGrant', type:'radio', label:'Do you already have a Grant allowing you to deal with the Estate?', required:true, reflow:true, options:['Yes','No'] }
  ]},

  // Grant already in hand: the only thing that matters is whether they are named on it.
  { id:'grant', name:'Your authority', title:'About the Grant', lead:'This tells us who is able to deal with the estate.', showIf:function(s){ return s.about.hasGrant==='Yes'; }, fields:[
    { key:'namedOnGrant', type:'radio', label:'Are you named as an administrator or executor on the Grant?', required:true, reflow:true, options:['Yes','No'] },
    { key:'executorsGone', type:'radio', label:'Have all of the named Executors either died or refused to act?', required:true, options:['Yes','No'], showIf:function(s){ return s.grant.namedOnGrant==='No'; } }
  ]},

  // No grant yet: will or intestacy, and whether this person can apply.
  { id:'will', name:'The will', title:'Has the deceased left a Will?', lead:'This decides who is entitled to deal with the estate.', showIf:function(s){ return s.about.hasGrant==='No'; }, fields:[
    { key:'hasWill', type:'radio', label:'Has the deceased left a Will?', required:true, reflow:true, options:['Yes','No'] },
    { key:'isExecutor', type:'radio', label:'Are you named as an Executor in the Will?', required:true, reflow:true, options:['Yes','No'], showIf:function(s){ return s.will.hasWill==='Yes'; } },
    { key:'executorsGone', type:'radio', label:'Have all of the named Executors either died or refused to act?', required:true, options:['Yes','No'], showIf:function(s){ return s.will.hasWill==='Yes' && s.will.isExecutor==='No'; } },
    { key:'isBeneficiary', type:'radio', label:'Are you named in the Will as a beneficiary?', required:true, options:['Yes','No'], showIf:function(s){ return s.will.hasWill==='Yes' && s.will.isExecutor==='No'; } },
    { key:'nextOfKin', type:'radio', label:'Are you, or do you represent, the immediate next of kin of the deceased?', required:true, options:['Yes','No'], showIf:function(s){ return s.will.hasWill==='No'; } },
    { key:'intestateNote', type:'note', text:'Without a will the estate is shared out under the intestacy rules and only certain relatives can apply. We will talk you through where you stand.', showIf:function(s){ return s.will.hasWill==='No'; } }
  ]},

  { id:'estate', name:'The estate', title:'What is in the estate?', lead:'Estimates are fine. This is what sets the fee.', fields:[
    { key:'value', type:'number', label:'What is the estimated value of the Estate? (£)', required:true },
    { key:'hasProperty', type:'radio', label:'Is there land or property in the Estate?', required:true, reflow:true, options:['Yes','No'] },
    { key:'propertyOutsideEW', type:'radio', label:'Is any of the property outside England and Wales?', required:true, options:['Yes','No'], showIf:function(s){ return s.estate.hasProperty==='Yes'; } },
    { key:'propertyOccupied', type:'radio', label:'Is any of the property occupied?', required:true, options:['Yes','No'], showIf:function(s){ return s.estate.hasProperty==='Yes'; } }
  ]},

  { id:'beneficiaries', name:'Who inherits', title:'Who inherits from the estate?', lead:'Almost done.', fields:[
    { key:'count', type:'number', label:'How many people are likely to inherit from the Estate?', required:true },
    { key:'anyUnder18', type:'radio', label:'Is anyone who is likely to inherit from the Estate under 18 years old?', required:true, options:['Yes','No'] },
    { key:'contested', type:'radio', label:'Is there anyone contesting the distribution of the Estate?', required:true, options:['Yes','No'] }
  ]},

  { id:'contact_details', name:'Your details', title:'Where should we send your quote?', lead:'We will come back to you with a fixed fee quote and what happens next.', fields:[
    { key:'postcode', type:'text', label:'What is your postcode?', required:true },
    { type:'row', fields:[ {key:'firstName',type:'text',label:'First name',required:true}, {key:'lastName',type:'text',label:'Last name',required:true} ] },
    { type:'row', fields:[ {key:'email',type:'email',label:'Email',required:true}, {key:'phone',type:'tel',label:'Phone',required:true} ] },
    { key:'consentBlock', type:'consent' }
  ]},

  { id:'referral_done', name:'Your quote', kind:'quote', title:'', fields:[] }
];
var FUNNEL = (function(){ var f=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||window.AIWILLS_FUNNEL||'').toString().toLowerCase(); return f==='etb'?ETB_FUNNEL:(f==='lpa'?LPA_FUNNEL:((f==='probate'||f==='referral')?REFERRAL_FUNNEL:WILLS_FUNNEL)); })();
var FUNNEL_KEY = (function(){ var f=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||window.AIWILLS_FUNNEL||'').toString().toLowerCase(); if(f==='etb'||f==='lpa'||f==='hub') return f; if(f==='probate'||f==='referral') return 'probate'; return 'wills'; })();

var state, cur=0, maxCur=0;
function flat(fields){ var r=[]; (fields||[]).forEach(function(f){ if(f.type==='row') r=r.concat(flat(f.fields)); else r.push(f); }); return r; }
/* ---- One custom field per answered question ----
   The funnel definition already holds every question and its wording, so the engine derives
   the field list rather than duplicating it on the server. A firm then reads the answers in
   GHL exactly as the customer was asked them, and each one can drive a workflow or an AI step.
   Names are "<Service> <Section> - <Question>" so they group and sort sensibly. */
var AWD_PREFIX={ wills:'Will', lpa:'LPA', etb:'ETB', probate:'Probate', referral:'Probate' };
function awdLabel(f){ try{ var l=(typeof f.label==='function')?f.label(state):f.label; return String(l||'').replace(/\s+/g,' ').replace(/[*:]\s*$/,'').trim(); }catch(e){ return ''; } }
function awdClean(n){ return String(n||'').replace(/[^A-Za-z0-9 £%&'(),.\/-]/g,' ').replace(/\s+/g,' ').trim().slice(0,100); }
function awdVal(v){
  if(v===true) return 'Yes'; if(v===false) return 'No';
  if(v==null) return '';
  if(Array.isArray(v)) return '';
  return String(v).trim();
}
var _awSeq=0, _awApplied=0;
    function awAdopt(key){
      var mine = ++_awSeq;
      return function(j){
        if(!(j && j.contactId)) return;
        if(mine < _awApplied) return;   // a slower, older save answering after a newer one
        _awApplied = mine;
        window[key] = j.contactId;
        /* Only the hub's own gate ever wrote aw_ident_, so somebody who started on a service page
           and then clicked "My services" was met by the new-or-returning modal as though we had
           never seen them. Any save that knows who they are is good enough. */
        try{ awRememberIdent(j.contactId); }catch(e){}
      };
    }
    function awRememberIdent(cid){
      if(!loc) return;
      var sec=(FUNNEL===WILLS_FUNNEL)?'personal':((FUNNEL===REFERRAL_FUNNEL)?'contact_details':'your_details');
      var d=(state&&state[sec])||{};
      var em=String(d.email||'').trim(), ph=String(d.phone||'').trim(), fn=String(d.firstName||'').trim();
      if(!em && !ph) return;                    // nothing identifying yet: do not claim the device
      var prev=null; try{ prev=JSON.parse(localStorage.getItem('aw_ident_'+loc)||'null'); }catch(e){}
      var rec={ firstName:fn, email:em, phone:ph, cid:cid||((prev&&prev.cid)||'') };
      if(prev&&prev.consent) rec.consent=prev.consent;   // consent is the gate's to record, not ours
      try{ localStorage.setItem('aw_ident_'+loc, JSON.stringify(rec)); }catch(e){}
    }
    function _awCid(){ return window.AIWILLS_CONTACT_ID || ''; }
    function _awCidEtb(){ return window.AIWILLS_ETB_CID || ''; }
    function awDetailFields(){
  var out=[], pfx=AWD_PREFIX[String(FUNNEL_KEY||'').toLowerCase()]||'Form';
  try{
    if(getP('consent.accepted')==='Yes'){
      out.push({ name: awdClean(pfx+' Acceptance - Terms and privacy accepted'), value:'Yes' });
      out.push({ name: awdClean(pfx+' Acceptance - Accepted at'), value: String(getP('consent.at')||'') });
      out.push({ name: awdClean(pfx+' Acceptance - Marketing opt-in'), value: String(getP('consent.marketing')||'No') });
    }
    FUNNEL.forEach(function(st){
      if(!st || !st.fields || !st.fields.length) return;
      if(st.kind==='review'||st.kind==='payment'||st.kind==='generate'||st.kind==='done'||st.kind==='quote') return;
      if(st.showIf && !st.showIf(state)) return;                   // a branch they never saw
      var sec=st.name||st.id;
      flat(st.fields).forEach(function(f){
        if(f.type==='consent'){
          if(getP('consent.accepted')==='Yes'){
            out.push({ name: awdClean(pfx+' Acceptance - Terms and privacy accepted'), value:'Yes' });
            out.push({ name: awdClean(pfx+' Acceptance - Accepted at'), value: String(getP('consent.at')||'') });
            out.push({ name: awdClean(pfx+' Acceptance - Marketing opt-in'), value: String(getP('consent.marketing')||'No') });
          }
          return;
        }
        if(!f.key || f.type==='note') return;
        if(f.type==='repeater'){
          var list=getP(st.id+'.'+f.key); if(!Array.isArray(list)) return;
          var cap=Math.min(list.length, 6);                        // enough for real cases, not runaway
          for(var i=0;i<cap;i++){
            var item=list[i]||{};
            flat(f.fields).forEach(function(sf){
              if(!sf.key || sf.type==='note') return;
              var sv=awdVal(item[sf.key]); if(sv==='') return;
              out.push({ name: awdClean(pfx+' '+(f.itemLabel||sec)+' '+(i+1)+' - '+(sf.label||sf.key)), value: sv });
            });
          }
          return;
        }
        if(f.showIf && !f.showIf(state)) return;                   // question they were never shown
        var v=awdVal(getP(st.id+'.'+f.key)); if(v==='') return;
        var lab=awdLabel(f); if(!lab) return;
        out.push({ name: awdClean(pfx+' '+sec+' - '+lab), value: v });
      });
    });
  }catch(e){}
  return out;
}
function initState(){ state={}; FUNNEL.forEach(function(s){ if(s.kind==='payment'){ state[s.id]={paid:false}; return; } state[s.id]={}; flat(s.fields).forEach(function(f){ if(!f.key) return; state[s.id][f.key]= f.type==='repeater'?[]:''; }); }); if(window.AIWILLS_PREFILL){ var pf=window.AIWILLS_PREFILL; for(var k in pf){ if(state[k]&&pf[k]&&typeof pf[k]==='object'){ for(var kk in pf[k]){ var _v=pf[k][kk]; if(typeof _v==='string'&&_v.indexOf('{'+'{')>=0) continue; state[k][kk]=_v; } } } } }
function getP(p){ var a=p.split('.'),o=state,i; for(i=0;i<a.length;i++){ if(o==null) return ''; o=o[a[i]]; } return o==null?'':o; }
function setP(p,v){ var a=p.split('.'),o=state,i; for(i=0;i<a.length-1;i++){ var k=a[i]; if(o[k]==null||typeof o[k]!=='object'){ o[k]=/^[0-9]+$/.test(a[i+1])?[]:{}; } o=o[k]; } o[a[a.length-1]]=v; }
function blankItem(f){ var o={}; flat(f.fields).forEach(function(x){ o[x.key]= x.type==='repeater'?[]:''; }); return o; }
function total(lp,key){ return (getP(lp)||[]).reduce(function(s,it){ return s+(parseFloat(it[key])||0); },0); }
/* Edit mode hides the payment and download steps so somebody who has already paid cannot be charged
   twice for correcting an answer. Somebody who has NOT paid needs those steps: the edit link is how
   they come back to finish, and stripping payment left them on the summary with no way to buy at
   all. So only hide them once the money is actually in. */
function awPaidNow(){ try{ return !!(state && state.payment && state.payment.paid===true); }catch(e){ return false; } }
function visible(){ var ed=(window.AIWILLS_EDIT===true) && awPaidNow(); return FUNNEL.filter(function(s){ if(ed && (s.kind==='payment'||s.kind==='generate'||s.kind==='done')) return false; return !s.showIf || s.showIf(state); }); }

function fld(base,f){
  if(f.showIf && !f.showIf(state, base)) return '';
  if(f.type==='row') return '<div class="row">'+f.fields.map(function(c){ return fld(base,c); }).join('')+'</div>';
  if(f.type==='repeater') return repeater(base,f);
  if(f.type==='note') return '<p class="note" style="margin:6px 0 14px">'+esc(f.text||'')+'</p>';
  if(f.type==='consent') return awConsentHtml();
  var p=base+'.'+f.key, v=getP(p);
  var rf = f.reflow?' data-reflow="1"':'';
  var _flab=(typeof f.label==='function')?f.label(state):f.label;
  var lab='<label>'+esc(_flab)+(f.required?' <span class="req" aria-hidden="true">*</span>':' <span class="opt">(optional)</span>')+'</label>';
  var err='<div class="err">This field is required</div>';
  if(f.type==='select'){
    var sopts=(typeof f.options==='function')?(f.options(state)||[]):(f.options||[]);
    var o='<option value="">Please select...</option>';
    sopts.forEach(function(x){ o+='<option'+(v===x?' selected':'')+'>'+esc(x)+'</option>'; });
    return '<div class="field" data-f="'+p+'">'+lab+'<select data-b="'+p+'"'+rf+(f.required?' required aria-required="true"':'')+'>'+o+'</select>'+err+'</div>';
  }
  if(f.type==='radio'){
    var ropts=(typeof f.options==='function')?(f.options(state)||[]):(f.options||[]);
    var c='<div class="choices">';
    ropts.forEach(function(x){ c+='<label class="choice'+(v===x?' on':'')+'"><input type="radio" name="'+p+'" value="'+esc(x)+'" data-b="'+p+'"'+rf+(f.required?' required':'')+(v===x?' checked':'')+'><span>'+esc(x)+'</span></label>'; });
    return '<div class="field" data-f="'+p+'">'+lab+c+'</div>'+err+'</div>';
  }
  if(f.type==='file'){ var fn=getP(p)||''; var _furl=getP(p+'_url')||''; var _cur=(fn||_furl)?('<div style="font-size:14px;margin:2px 0 6px">Current: '+esc(fn||'document')+(_furl?(' &middot; <a href="'+esc(_furl)+'" target="_blank" rel="noopener">View</a>'):'')+' &middot; <a href="#" class="frm" data-frm="'+esc(f.field||'')+'" data-namekey="'+p+'">Remove</a></div>'):''; return '<div class="field" data-f="'+p+'">'+lab+_cur+'<input type="file" data-upload="'+esc(f.field||'')+'" data-namekey="'+p+'"'+(f.accept?(' accept="'+esc(f.accept)+'"'):'')+'><div class="uplstat" style="font-size:14px;color:var(--muted);margin-top:6px">'+(fn?('Replace: '+esc(fn)):'')+'</div></div>'; }
  if(f.type==='checkbox'){ return '<div class="field" data-f="'+p+'"><label class="choice'+(v==='Yes'?' on':'')+'" style="width:100%"><input type="checkbox" data-b="'+p+'"'+rf+(v==='Yes'?' checked':'')+'><span>'+esc(f.label)+'</span></label>'+err+'</div>'; }
  if(f.type==='textarea') return '<div class="field" data-f="'+p+'">'+lab+'<textarea data-b="'+p+'"'+(f.required?' required aria-required="true"':'')+'>'+esc(v)+'</textarea>'+err+'</div>';
  return '<div class="field" data-f="'+p+'">'+lab+'<input type="'+f.type+'" value="'+esc(v)+'" data-b="'+p+'"'+rf+(f.required?' required aria-required="true"':'')+'>'+err+'</div>';
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
  el('ftr').innerHTML='<div class="fwrap"><div class="fgrid"><div><div class="fh">Explore</div><ul class="flinks">'+links+'</ul></div><div><div class="fcta">Ready to protect your family’s future?</div><button class="btn" style="background:var(--btn2-bg);color:var(--btn2-ink);border:2px solid var(--btn2-ink)" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">'+'Start here'+'</button></div></div><hr class="frule">'+(soc?'<div class="fsoc">'+soc+'</div>':'')+'<div class="fleg">'+awSafeHtml(CFG.legal_footer||'')+'</div>'+(CFG.address?'<p class="fleg">Registered office: '+esc(CFG.address)+'</p>':'')+'</div>';
}

function fmtDate(v){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||'')); return m?(m[3]+'/'+m[2]+'/'+m[1]):v; } function fmtVal(f,v){ return (f&&f.type==='date')?fmtDate(v):v; }
function sumRow(k,v){ return v?('<div class="srow"><span class="k">'+esc(k)+'</span><span class="v">'+esc(v)+'</span></div>'):''; }
function summary(base,fields){
  var out='';
  (fields||[]).forEach(function(f){
    if(f.showIf && !f.showIf(state, base)) return;
    if(f.type==='row'){ out+=summary(base,f.fields); return; }
    if(f.type==='repeater'){ (getP(base+'.'+f.key)||[]).forEach(function(it,i){ out+='<div class="srow"><span class="k" style="font-weight:700">'+esc((f.itemLabel||'Item')+' '+(i+1))+'</span><span class="v"></span></div>'; flat(f.fields).forEach(function(sf){ var vv=it[sf.key]; if(vv) out+=sumRow(' '+(sf.label||sf.key), fmtVal(sf,vv)); }); }); return; }
    var v=getP(base+'.'+f.key); if(v) out+=sumRow(f.label||f.key, fmtVal(f,v));
  });
  return out;
}
/* What a returning customer needs the summary to tell them: what this page is, how to change an
   answer, what happens when they do, and which sections are still empty. */
function awEditLead(){
  var what=(FUNNEL===LPA_FUNNEL)?'Lasting Power of Attorney':((FUNNEL===ETB_FUNNEL)?'Executor Toolbox':'will');
  return '<p class="lead">Everything you have told us is below, section by section. To change an answer, open a section, edit it, then press <strong>Save</strong>. You come straight back here, at the next section. Any section marked <strong>Add</strong> still needs your answers. We prepare your '+what+' from exactly what is on this page, so it is worth checking each section before you leave.</p>';
}
var AW_EDIT_AT='';
/* Coming out of a section, put the person back on the summary at the section they are up to.
   The top of a long summary tells them nothing about where they had got to. Saving moves them on
   one; backing out leaves them where they were. */
function awEditReturnTo(fromId, ahead){
  AW_EDIT_AT='';
  try{
    var secs=visible().filter(function(v){ return v.fields&&v.fields.length; });
    for(var i=0;i<secs.length;i++){
      if(secs[i].id!==fromId) continue;
      AW_EDIT_AT=(ahead&&secs[i+1])?secs[i+1].id:secs[i].id;
      return;
    }
  }catch(e){}
}
/* Probate is a short quote form with no review step. "Save" called jumpTo('review'), found nothing
   and did nothing at all, so the button was dead and so was Back. Ask before assuming a summary. */
function awHasReview(){ try{ var v=visible(); for(var i=0;i<v.length;i++){ if(v[i].kind==='review') return true; } }catch(e){} return false; }
function awEditScroll(s){
  if(window.AIWILLS_EDIT!==true || !s || s.kind!=='review' || !AW_EDIT_AT) return;
  var id=AW_EDIT_AT; AW_EDIT_AT='';
  setTimeout(function(){ try{
    var n=document.getElementById('awsec-'+id); if(!n) return;
    if(n.scrollIntoView) n.scrollIntoView({block:'start'});
    n.classList.add('justsaved');
    setTimeout(function(){ try{ n.classList.remove('justsaved'); }catch(e){} }, 2400);
  }catch(e){} }, 40);
}
function review(){
  var html=''; var ed=(window.AIWILLS_EDIT===true);
  visible().forEach(function(s){ if(!(s.fields&&s.fields.length)) return; var rows=summary(s.id,s.fields); if(!rows && !ed) return; var body=rows||'<div style="padding:2px 0 8px;color:#8a8a8a;font-size:14px">Nothing added yet.</div>'; html+='<div class="sum" id="awsec-'+esc(s.id)+'"><h3>'+esc(s.name)+'<button type="button" class="edit" data-goto="'+s.id+'">'+(rows?'Edit':'Add')+'</button></h3>'+body+'</div>'; });
  if(window.AIWILLS_EDIT===true){ var _tok=window.AIWILLS_TOKEN||''; /* This offered "Download your will" on every funnel that was not the Toolbox, and pointed it at
     /api/will-pdf. So finishing a Lasting Power of Attorney handed you a will: the wrong legal
     document entirely, under a label saying it was the right one. Only the two funnels whose
     document this endpoint actually builds get a link here. The LPA's own PDF is minted on the
     Generate step, where it is built from the LPA answers with its own token, and probate is a
     quote with nothing to download at all. */
    var _isE=(FUNNEL===ETB_FUNNEL), _isW=(FUNNEL===WILLS_FUNNEL);
    /* This offered the finished document to anyone who could open the summary, paid or not, so a
       half-finished will could be downloaded for free. That is a lost sale and, worse, a legal
       document leaving the building that nobody has checked. */
    var _paid = (getP('payment.paid')===true);
    var _dl = !(_isE || _isW) ? ''
      : (_paid
        ? ('<a class="btn wide" href="'+API+(_isE?'/api/etb-pdf?t=':'/api/will-pdf?t=')+encodeURIComponent(_tok)+'" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:8px">'+(_isE?'Download summary (PDF)':'Download your will (PDF)')+'</a>')
        : '<p class="note" style="text-align:center;margin-top:12px">You can download your '+(_isE?'summary':'will')+' here once payment is complete.</p>'); var _docs=[]; visible().forEach(function(s){ if(!s.fields) return; flat(s.fields).forEach(function(f){ if(f.type!=='file') return; var fp=s.id+'.'+f.key; var u=getP(fp+'_url'); if(u) _docs.push({name:(getP(fp)||f.label||'Document'), url:u}); }); }); var _fh=_docs.length?('<div class="sum" style="margin-top:12px"><h3>Your documents</h3>'+_docs.map(function(d){return '<div style="padding:4px 0"><a href="'+esc(d.url)+'" target="_blank" rel="noopener">'+esc(d.name)+'</a></div>';}).join('')+'</div>'):''; return awEditLead()+html+_dl+_fh; }
  var _lpaNote=''; try{ if(FUNNEL===WILLS_FUNNEL){ var _gb=willBundle(state); if(_gb.lpas>0){ _lpaNote='<div class="mock" style="margin-top:12px;text-align:left"><p style="font-weight:600;margin:0 0 6px">Your Lasting Power of Attorney'+(_gb.lpas>1?'s':'')+'</p><p class="note" style="margin:0">You added '+_gb.lpas+' LPA'+(_gb.lpas>1?'s':'')+' to your order. We will be in touch shortly to collect the attorney details and prepare '+(_gb.lpas>1?'them':'it')+'. There is nothing more you need to do right now.</p></div>'; } } }catch(e){}
  return html+((FUNNEL===WILLS_FUNNEL)?'<p class="note" style="margin-top:12px;text-align:center;color:var(--muted)">Your will is ready. You can download it on the next step, once payment is complete.</p>':'')+_lpaNote;
}

function render(){
  var vis=visible(); if(cur>vis.length-1) cur=vis.length-1; var s=vis[cur];
  if(s.fields){ s.fields.forEach(function(f){ if(f.type!=='repeater') return; var active=f.showIf?f.showIf(state):false; if(!(f.required||active)) return; var lp=s.id+'.'+f.key; var l=getP(lp); if(Array.isArray(l) && l.length===0){ l.push(blankItem(f)); } }); } // auto-open a card only for required or gated-active repeaters; optional lists (e.g. gifts) can be emptied via Remove
  /* In the edit hub the review step is not a checkpoint on the way to paying, it IS the product:
     the page a paid customer comes back to. Its own title and lead still said "review ... then
     continue to payment", which is meaningless to someone who paid weeks ago. */
  var _edh=(window.AIWILLS_EDIT===true && s.kind==='review');
  var _title=_edh ? ((FUNNEL===LPA_FUNNEL)?'Your Lasting Power of Attorney':((FUNNEL===ETB_FUNNEL)?'Your Executor Toolbox':((FUNNEL===REFERRAL_FUNNEL)?'Your probate enquiry':'Your will'))) : s.title;
  var _lead=_edh ? '' : s.lead;   // the summary writes its own, see awEditLead()
  var html='<h1>'+esc(_title)+'</h1>'+(_lead?'<p class="lead">'+esc(_lead)+'</p>':'');
  if(_edh && FUNNEL===REFERRAL_FUNNEL && window.AIWILLS_SUBMITTED===true){ html += '<div class="mock" style="margin-bottom:18px"><div class="tick">\u2713</div><h3>Your quote is being prepared</h3><p class="note">We have your enquiry and the team are preparing your fixed fee quote. Your answers are below if you want to check or update anything.</p></div>'; }
  if(s.kind==='payment'){
    var _isEtb=(FUNNEL===ETB_FUNNEL);
    if(getP('payment.paid')===true){
      html += '<div class="mock"><div class="tick">✓</div><h3>'+(_isEtb?'Subscription active':'Payment received')+'</h3><p class="note">'+(_isEtb?'Your Executor Toolbox is now active.':'Continue to download your will.')+'</p></div>';
    } else if(_isEtb){
      var _plans=[];
      if(CFG.etb_price_monthly) _plans.push({k:'monthly',lbl:'Monthly',price:fmtPrice(CFG.etb_price_monthly)+' / month'});
      if(CFG.etb_price) _plans.push({k:'annual',lbl:'Annual',price:fmtPrice(CFG.etb_price)+' / year'});
      if(CFG.etb_price_oneoff) _plans.push({k:'lifetime',lbl:'One-off',price:fmtPrice(CFG.etb_price_oneoff)+' once - lifetime access'});
      if(!_plans.length) _plans.push({k:'annual',lbl:'Annual',price:'£19.99 / year'});
      var _pick='';
      if(_plans.length>1){
        var _di=0; _plans.forEach(function(pl,ii){ if(pl.k==='annual') _di=ii; });
        _pick='<div class="choices" id="awetbplans" style="flex-direction:column;margin:0 0 14px">'+_plans.map(function(pl,ix){ return '<label class="choice'+(ix===_di?' on':'')+'" style="display:flex;justify-content:space-between;align-items:center;text-align:left;gap:10px"><span style="display:flex;align-items:center;gap:8px"><input type="radio" name="awetbplan" value="'+pl.k+'"'+(ix===_di?' checked':'')+'><span>'+esc(pl.lbl)+'</span></span><span style="font-weight:700">'+esc(pl.price)+'</span></label>'; }).join('')+'</div>';
      } else {
        _pick='<div class="price">'+esc(_plans[0].price)+'</div>';
      }
      html += '<div class="mock"><p>Executor Toolbox</p>'+_pick+awConsentHtml()+'<button class="btn wide" id="pay" type="button">'+(_plans.length>1?'Continue to secure payment':(_plans[0].k==='lifetime'?'Pay once':'Subscribe'))+'</button><p class="note">Secure card payment. '+(_plans.length>1?'Subscriptions can be cancelled any time. The one-off option is a single payment for lifetime access.':'Your subscription keeps your Toolbox stored and available to your executors. You can cancel any time.')+'</p></div>';
    } else if(FUNNEL===WILLS_FUNNEL){
      var _b=willBundle(state); var _m=function(n){ return fmtPrice(String(Math.round(n*100)/100)); }; var _rows='';
      _rows+='<div class="srow"><span class="k">'+(_b.wills>1?'Mirror wills (x'+_b.wills+')':'Will')+'</span><span class="v">'+esc(_m(_b.wills*_b.wp))+'</span></div>';
      if(_b.lpas>0){ _rows+='<div class="srow"><span class="k">Lasting Power of Attorney (x'+_b.lpas+')</span><span class="v">'+esc(_m(_b.lpas*_b.lp))+'</span></div>'; }
      html += '<div class="mock"><p>Your order</p><div class="sum" style="text-align:left;margin:0 0 14px">'+_rows+'<div class="srow" style="border-top:2px solid var(--line);font-weight:700"><span class="k" style="color:var(--heading)">Total</span><span class="v">'+esc(_m(_b.total))+'</span></div></div>'+awConsentHtml()+'<button class="btn wide" id="pay" type="button">Pay '+esc(_m(_b.total))+'</button><p class="note">Secure card payment. You will be returned here to download your will'+(_b.lpas>0?'. Your LPA'+(_b.lpas>1?'s':'')+' will be prepared separately and we will be in touch to complete '+(_b.lpas>1?'them':'it')+'.':'.')+'</p></div>';
    } else {
      var _svcp=(FUNNEL===LPA_FUNNEL)?String(lpaTotal()):CFG.will_price;
      html += '<div class="mock"><p>'+esc(FUNNEL===LPA_FUNNEL?'Your LPA document':(FUNNEL===ETB_FUNNEL?'Your Executor Toolbox':'Your will document'))+'</p><div class="price">'+esc(fmtPrice(_svcp))+'</div>'+awConsentHtml()+'<button class="btn wide" id="pay" type="button">Pay '+esc(fmtPrice(_svcp))+'</button><p class="note">Secure card payment. You will be returned here to download your '+(FUNNEL===LPA_FUNNEL?'LPA':'will')+'.'+((FUNNEL===LPA_FUNNEL&&lpaQtyFor(state)>1)?' This covers both LPA types.':'')+'</p></div>';
    }
  } else if(s.kind==='done'){
    html += '<div class="mock"><div class="tick">✓</div><h3>Your Executor Toolbox is active</h3><p class="note">Your details and any documents you uploaded are securely stored. Your executors will be able to access what they need, when the time comes.</p><div style="text-align:left;margin-top:22px;padding-top:18px;border-top:1px solid #e7e7e7"><p style="font-weight:600;margin:0 0 8px">What happens next</p><ol style="margin:0;padding-left:20px;line-height:1.7"><li>Tell your executors that your Toolbox exists.</li><li>You can come back any time to add or update documents.</li><li>Keep your contact details current so we can reach you.</li></ol></div></div>';
  } else if(s.kind==='quote'){
    try{ if(state[s.id] && typeof state[s.id]==='object') state[s.id].submitted='Yes'; saveToGhl(state, { submitted:true }); }catch(e){}
    try{ if(loc) localStorage.setItem('aw_sent_'+FUNNEL_KEY+'_'+loc,'1'); }catch(e){}   // recorded so a return visit lands here, not on question one
    var _q=computeQuote(state);
    if(_q){
      var _cta = (CFG.quote_cta_url) ? ('<a class="btn wide" href="'+esc(CFG.quote_cta_url)+'" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:14px">'+esc(CFG.quote_cta_label||'Book a call to proceed')+'</a>') : '';
      html += '<div class="mock"><div class="tick">\u2713</div><h3>'+esc(CFG.quote_title||'Your probate quote estimate')+'</h3><div class="price">'+esc(_q.display)+'</div><p class="note">'+esc(CFG.quote_note||'This is an estimate based on what you have told us. We will confirm the exact figure and the next steps with you before any work begins.')+'</p>'+_cta+'</div>';
    } else {
      html += '<div class="mock"><div class="tick">\u2713</div><h3>'+esc(CFG.referral_thanks_title||'Thank you - your quote is on its way')+'</h3><p class="note">'+esc(CFG.referral_thanks_text||'We have everything we need. One of the team will be in touch shortly with your fixed fee quote and next steps.')+'</p></div>';
    }
  } else if(s.kind==='generate' && FUNNEL===LPA_FUNNEL){
    var _lcid=(rootEl&&rootEl.getAttribute('data-contact'))||qp('aw_c')||window.AIWILLS_CONTACT_ID||'';
    setTimeout(function(){ try{ fetch(API+'/api/lpa-save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,contactId:_lcid,state:state,pdf:true})}).then(function(r){return r.json();}).then(function(j){ var w=el('lpapdfwrap'); if(!w) return; if(j&&j.token){
        /* Both LPA types means two separate official forms, and only one of them was ever offered.
           Name each one so the customer can see they have both, and which is which. */
        var _ty=String(((state||{}).lpa_type||{}).type||'');
        var _forms=[];
        if(/Property|Both/i.test(_ty)) _forms.push({ k:'LP1F', label:'Download your Property & Financial Affairs LPA (LP1F)' });
        if(/Health|Both/i.test(_ty)) _forms.push({ k:'LP1H', label:'Download your Health & Welfare LPA (LP1H)' });
        if(!_forms.length) _forms.push({ k:'', label:'Download your LPA (PDF)' });
        var _lu=function(f){ return API+'/api/lpa-pdf?t='+encodeURIComponent(j.token)+(f.k?('&form='+f.k):''); };
        var _links=_forms.map(function(f){ return '<a class="btn wide" href="'+_lu(f)+'" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;margin-top:10px">'+esc(f.label)+'</a>'; }).join('');
        w.innerHTML='<iframe src="'+_lu(_forms[0])+'" style="width:100%;height:560px;border:1px solid #e0e0e0;border-radius:10px;margin-top:16px;background:#fff" title="Your LPA"></iframe><div style="margin-top:12px">'+_links+'</div>'+((_forms.length>1)?'<p class="note">These are two separate applications. Each one has to be signed and registered with the Office of the Public Guardian on its own.</p>':'');
      } else { w.innerHTML='<p class="note">Could not generate the LPA document'+((j&&j.error)?(': '+esc(j.error)):'')+'.</p>'; } }).catch(function(){ var w=el('lpapdfwrap'); if(w) w.innerHTML='<p class="note">Could not generate the LPA document.</p>'; }); }catch(e){} },60);
    html += '<div class="mock"><div class="tick">\u2713</div><h3>Your LPA is ready</h3><p class="note">Payment received. Your LPA is shown below.</p><div id="lpapdfwrap"><p class="note">Preparing your LPA document\u2026</p></div></div>';
  } else if(s.kind==='generate'){
    var _p0=(state.personal||{});
    if(!_p0.firstName || !_p0.lastName){
      html += '<div class="mock"><h3>Let’s finish your will first</h3><p class="note">It looks like your answers haven’t all come through. Please go back and complete your will so we can produce your document.</p><button class="btn wide" type="button" data-goto="personal">Go back to your will</button></div>';
    } else {
    var _wcid=(rootEl&&rootEl.getAttribute('data-contact'))||qp('aw_c')||window.AIWILLS_CONTACT_ID||'';
    setTimeout(function(){ try{
      fetch(API+'/api/will-preview',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,state:state})}).then(function(r){ if(!r.ok) throw new Error('pdf'); return r.blob(); }).then(function(bl){ if(bl.type&&bl.type.indexOf('pdf')<0) throw new Error('notpdf'); var u=URL.createObjectURL(bl); var w=el('willpdfwrap'); if(w) w.innerHTML='<iframe src="'+u+'" style="width:100%;height:560px;border:1px solid #e0e0e0;border-radius:10px;margin-top:16px;background:#fff" title="Your will"></iframe><div style="margin-top:12px"><a class="btn wide" href="'+u+'" download="your-will.pdf">Download your will (PDF)</a></div>'; }).catch(function(){ var w=el('willpdfwrap'); if(w) w.innerHTML='<p class="note">Could not generate the will document.</p>'; });
      try{ fetch(API+'/api/will-save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({locationId:loc,contactId:_wcid,state:state,pdf:false})}).then(function(r){return r.json();}).then(awAdopt('AIWILLS_CONTACT_ID')).catch(function(){}); }catch(e){}
    }catch(e){} },60);
    html += '<div class="mock"><div class="tick">✓</div><h3>Your will is ready</h3><p class="note">Payment received. Your will is shown below.</p><div id="willpdfwrap"><p class="note">Preparing your will document…</p></div><div style="text-align:left;margin-top:22px;padding-top:18px;border-top:1px solid #e7e7e7"><p style="font-weight:600;margin:0 0 8px">To make your will legally valid</p><ol style="margin:0;padding-left:20px;line-height:1.7"><li>Print the document.</li><li>Sign it in front of two independent adult witnesses (not your beneficiaries, or their husbands or wives).</li><li>Have both witnesses sign while you are watching.</li><li>Store it safely and tell your executors where it is.</li></ol></div></div>';
    }
  } else if(s.kind==='review'){
    html += review();
  } else {
    s.fields.forEach(function(f){ html += fld(s.id,f); });
  }
  /* Every journey that ends here should offer the way back, not just the chip in the corner. */
  if(s.kind==='quote'||s.kind==='generate'||s.kind==='done'){ try{ html += awHubButtonHtml(); }catch(e){} }
  el('step').innerHTML=html;
  try{ if(!el('awfaq')){ var _fq=document.createElement('div'); _fq.id='awfaq'; _fq.className='awfaq'; el('step').parentNode.appendChild(_fq); } else { el('awfaq').parentNode.appendChild(el('awfaq')); } loadFaq(); paintFaq(); }catch(e){}
  el('stepName').textContent=s.name;
  /* There is no journey to count in the edit hub: the step menu is hidden and the only moves are
     open a section and save it. "Step 1 of 12" was counting screens the person cannot walk
     through, on a screen with two buttons. Count sections, and say nothing on the summary. */
  if(window.AIWILLS_EDIT===true){
    var _secs=vis.filter(function(v){ return v.fields&&v.fields.length; }), _si=-1;
    for(var _q=0;_q<_secs.length;_q++){ if(_secs[_q].id===s.id){ _si=_q; break; } }
    el('stepCount').textContent=(_si>=0)?('Section '+(_si+1)+' of '+_secs.length):'';
    el('bar').style.width=(_si>=0)?(Math.round(((_si+1)/_secs.length)*100)+'%'):'100%';
  } else {
    el('stepCount').textContent='Step '+(cur+1)+' of '+vis.length;
    el('bar').style.width=Math.round(((cur+1)/vis.length)*100)+'%';
  }
  if(cur>maxCur) maxCur=cur; if(maxCur>vis.length-1) maxCur=vis.length-1;
  try{ var _smenu=el('stepmenu'); if(_smenu){ if(window.AIWILLS_EDIT===true){ _smenu.innerHTML=''; } else { _smenu.innerHTML=vis.map(function(v,i){ var _free=(FUNNEL===ETB_FUNNEL&&v.kind!=='payment'&&v.kind!=='done'); var ok=(i<=maxCur)||_free; var cls=(i===cur)?'on':(ok?'done':''); return '<button type="button" data-sj="'+i+'"'+(cls?(' class="'+cls+'"'):'')+(ok?'':' disabled')+'>'+esc(v.name)+'</button>'; }).join(''); _smenu.querySelectorAll('[data-sj]').forEach(function(b){ b.addEventListener('click',function(){ jumpIdx(parseInt(b.getAttribute('data-sj'),10)); }); }); } } }catch(e){}
  var _ed=(window.AIWILLS_EDIT===true && awHasReview());   // no summary to go back to, no "Back to summary"
  el('back').textContent=_ed?'Back to summary':'Back';
  el('back').style.visibility=_ed?(s.kind==='review'?'hidden':'visible'):(cur===0?'hidden':'visible');
  var next=el('next'); if(_ed){ var _epaid=awPaidNow(); next.style.display=(((s.kind==='review')&&_epaid)||s.kind==='payment'||s.kind==='generate'||s.kind==='done'||s.kind==='quote')?'none':''; next.textContent=(s.kind==='review'&&!_epaid)?((FUNNEL===ETB_FUNNEL)?'Continue to activate':'Continue to payment'):'Save'; } else { next.style.display=(s.kind==='generate'||s.kind==='done'||s.kind==='quote')?'none':''; next.textContent=(s.kind==='review')?((FUNNEL===ETB_FUNNEL)?'Continue to activate':'Continue to payment'):((FUNNEL===REFERRAL_FUNNEL&&vis[cur+1]&&vis[cur+1].kind==='quote')?(CFG.referral_submit_label||'Get my quote'):'Continue'); }
  var pay=el('pay'); if(pay) pay.addEventListener('click',function(){ try{ collectVisible(); }catch(e){} if(!awConsentOk()) return; var _isEtb=(FUNNEL===ETB_FUNNEL); var _wb=(FUNNEL===WILLS_FUNNEL)?willBundle(state):null; var _isLpa=(FUNNEL===LPA_FUNNEL); var _lbl=_isEtb?'Subscribe':('Pay '+esc(fmtPrice(String(_isLpa?lpaTotal():(_wb?(Math.round(_wb.total*100)/100):CFG.will_price))))); pay.disabled=true; pay.textContent='Redirecting to secure payment...'; var _url=_isEtb?(API+'/api/etb-checkout'):(API+'/api/checkout'); var _body=_isEtb?{locationId:loc,contactId:(window.AIWILLS_ETB_CID||''),contact:(state.your_details||{}),returnUrl:_retUrl(),plan:(function(){ var r=document.querySelector('input[name=awetbplan]:checked'); return (r&&r.value)||'annual'; })()}:{locationId:loc,willJson:state,returnUrl:_retUrl(),pricingV:2,kind:(_isLpa?'lpa':'wills'),contactId:(window.AIWILLS_CONTACT_ID||'')}; fetch(_url,{method:'POST',body:JSON.stringify(_body)}).then(function(r){return r.json();}).then(function(j){ if(j&&j.url){ window.location.href=j.url; } else { pay.disabled=false; pay.textContent=_lbl; alert('Could not start payment: '+((j&&j.error)||'unknown')); } }).catch(function(e){ pay.disabled=false; pay.textContent=_lbl; alert('Payment error: '+e.message); }); });
  var _dlp=el('dlp'); if(_dlp) _dlp.addEventListener('click',function(){ try{ window.print(); }catch(e){} });
  // payment redirects out to Stripe and returns to the generate step (see aw_paid handling on load); no auto-advance, no demo download.
  /* Save returns to the summary only for somebody who came FROM the summary to change one answer.
     A customer filling a will in for the first time is walking forward, and was being thrown onto a
     page of empty sections the moment they finished question one. */
  el('step').querySelectorAll('[data-goto]').forEach(function(b){ b.addEventListener('click',function(){ window.__awFromSummary=true; jumpTo(b.getAttribute('data-goto')); }); });
  awEditScroll(s);
}
/* scroll to top only on real step changes, never on in-step reflow re-renders (which were yanking the page to the top on every radio click). */
function scrollTop(){ try{ window.scrollTo(0,0); }catch(e){} var m=document.getElementById('aiwills-funnel'); if(m&&m.scrollIntoView){ try{ m.scrollIntoView({block:'start'}); }catch(e){} } }
function willBundle(state){
  var st=state||{}, pt=st.partner||{}, al=st.addlpa||{};
  var wills=(pt.hasPartner==='Yes'&&pt.mirrorWill==='Yes')?2:1;
  var want=String(al.want||'');
  var types=/both/i.test(want)?2:(/financial|property|welfare|health/i.test(want)?1:0);
  var lpas=types*wills;
  var wp=parseFloat(String(CFG.will_price||'').replace(/[^0-9.]/g,''))||0;
  var lp=parseFloat(String(CFG.lpa_price||'').replace(/[^0-9.]/g,''))||0;
  return { wills:wills, types:types, lpas:lpas, wp:wp, lp:lp, total:(wills*wp)+(lpas*lp) };
}
function computeQuote(state){
  var raw=(window.AIWILLS_CONFIG||{}).probate_quote_rules_json; if(!raw) return null;
  var rules; try{ rules=(typeof raw==='string')?JSON.parse(raw):raw; }catch(e){ return null; }
  if(!rules||typeof rules!=='object') return null;
  var cur=rules.currency||'\u00a3';
  var flat={}; try{ Object.keys(state||{}).forEach(function(sec){ var o=state[sec]; if(o&&typeof o==='object'&&!Array.isArray(o)){ Object.keys(o).forEach(function(k){ flat[sec+'.'+k]=o[k]; flat[k]=o[k]; }); } }); }catch(e){}
  // A firm can price the two probate routes differently: { grantOnly:{...}, fullAdmin:{...} }
  var _hasGrant=String((state&&state.about&&state.about.hasGrant)||'');
  if(rules.grantOnly || rules.fullAdmin){
    // Already holding the Grant = estate administration only. No Grant yet = the full job.
    var pick = /^No/i.test(_hasGrant) ? rules.grantOnly : (/^Yes/i.test(_hasGrant) ? rules.fullAdmin : null);
    if(!pick) return null;                       // unanswered = no automatic price, the firm quotes
    pick=Object.assign({}, rules, pick); delete pick.grantOnly; delete pick.fullAdmin;
    rules=pick;
  }
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
  if(i>cur && !_tfree){ for(var k=cur;k<i;k++){ var bad=validateStep(vis[k]); if(bad.length){ if(k!==cur){ cur=k; render(); scrollTop(); } awShowVal('Please complete this step before moving on.'); return; } } }
  cur=i; render(); scrollTop(); try{ saveLocal(); }catch(e){} }
function jumpTo(id){ var vis=visible(); for(var i=0;i<vis.length;i++){ if(vis[i].id===id){ cur=i; render(); scrollTop(); try{ saveLocal(); }catch(e){} return; } } }

function collectVisible(){
  el('step').querySelectorAll('[data-b]').forEach(function(node){
    if(node.type==='radio'){ if(node.checked) setP(node.getAttribute('data-b'), node.value); }
    else if(node.type==='checkbox'){ setP(node.getAttribute('data-b'), node.checked?'Yes':''); }
    else setP(node.getAttribute('data-b'), node.value);
  });
}
function awShowVal(msg){ try{ var h=document.querySelector('#aiwills-funnel h1'); if(!h){ alert(msg); return; } var b=document.getElementById('awvalbar'); if(!b){ b=document.createElement('div'); b.id='awvalbar'; b.setAttribute('role','alert'); h.parentNode.insertBefore(b, h.nextSibling); } b.style.cssText='background:#FDECEA;border:1px solid #F5C6C2;color:#B3261E;border-radius:10px;padding:12px 14px;margin:10px 0 16px;font-size:14.5px;line-height:1.5'; b.textContent=msg; }catch(e){ try{ alert(msg); }catch(e2){} } }
function need(base,fields,bad){
  (fields||[]).forEach(function(f){
    if(f.showIf && !f.showIf(state, base)) return;
    if(f.type==='consent'){ if(!awConsentOk()) bad.push('MSG:Please accept the terms to continue.'); return; }
    if(f.type==='note' || !f.key) return;
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
    if(bad.length){ var msg=null; bad.forEach(function(b){ if(b.indexOf('MSG:')===0 && !msg) msg=b.slice(4); }); var first=null; bad.forEach(function(b){ if(b.indexOf('MSG:')!==0){ var fl=document.querySelector('[data-f="'+b+'"]'); if(fl){ fl.classList.add('invalid'); if(!first) first=fl; } } }); if(first && first.scrollIntoView){ try{ first.scrollIntoView({block:'center'}); }catch(e){} } awShowVal(msg || 'Please complete the required fields highlighted in red.'); return; }
    /* Nothing had ever validated the questions for a customer who arrived straight at the summary
       from an edit link: validateStep returns early for any step with a kind, and the summary has
       one. A will was paid for and generated carrying no surname and no address. Nothing leaves this
       page for payment until every section is answered, checked with the same validator the
       individual steps use, against the same answers. */
    if(s.kind==='review'){
      var _miss=[], _vv2=visible();
      for(var _mi=0;_mi<_vv2.length;_mi++){
        var _ms=_vv2[_mi]; if(!(_ms.fields&&_ms.fields.length)) continue;
        var _mb=[]; try{ need(_ms.id,_ms.fields,_mb); }catch(e){}
        if(_mb.length) _miss.push({ id:_ms.id, label:(_ms.name||_ms.title||_ms.id) });
      }
      if(_miss.length){
        awShowVal('Before you can pay, these sections still need answers: ' + _miss.map(function(m){return m.label;}).join(', ') + '. Opening the first one now - complete it, then press Save.');
        try{ jumpTo(_miss[0].id); }catch(e){}
        return;
      }
    }
    saveToGhl(state, { pdf: (s.kind==='review' || s.kind==='payment' || window.AIWILLS_EDIT===true) });
    /* ...but NOT from the summary itself. Pressing Continue there was saving and re-rendering the
   summary, so the button looked dead and the customer could never reach payment. From the
   summary, Continue must behave like a normal Continue and move on to the payment step. */
    if(window.AIWILLS_EDIT===true && awHasReview() && s.kind!=='review' && window.__awFromSummary===true){ window.__awFromSummary=false; try{ awEditReturnTo(s.id, 1); jumpTo('review'); }catch(e){} return; } // edit hub: save this section, back to the summary at the NEXT one. No summary (probate) means carry on like a normal Continue.
  }
  cur+=dir; if(cur<0)cur=0; if(cur>vis.length-1){ alert('Demo complete. In production the contact is tagged and the will is issued.'); cur=vis.length-1; }
  render(); scrollTop(); try{ saveLocal(); }catch(e){}
}

function lsKey(){ try{ var fn=((window.AIWILLS_CONFIG&&window.AIWILLS_CONFIG.funnel)||'wills'); return 'aw_draft_'+fn+'_'+(loc||''); }catch(e){ return ''; } }
/* The session used to die exactly one hour after sign-in, so somebody still filling in a will was
   signed out mid-question. While the page is open and the customer is signed in, ask the server for
   a fresh token well before the old one runs out. Close the tab and the session still expires. */
function awKeepSessionAlive(){
  try{
    if (window.__awKeepAlive) return; window.__awKeepAlive = 1;
    setInterval(function(){
      try{
        var t = window.AIWILLS_TOKEN || '';
        if (!t) return;
        if (document.hidden) return;              // nobody is working, let it expire
        fetch(API + '/api/session-touch', { method:'POST', headers:{'Content-Type':'text/plain'}, body: JSON.stringify({ s: t }) })
          .then(function(r){ return r.json(); })
          .then(function(j){ if (j && j.ok && j.session){ try{ awSessSet(j.session); }catch(e){ window.AIWILLS_TOKEN = j.session; } } })
          .catch(function(){});
      }catch(e){}
    }, 15 * 60 * 1000);
  }catch(e){}
}
function saveLocal(){ try{ if(window.AIWILLS_EDIT===true) return; var k=lsKey(); if(k){ localStorage.setItem(k, JSON.stringify(state)); try{ localStorage.setItem(k+'_ts', String(Date.now())); }catch(e4){} try{ localStorage.setItem(k+'_pos', JSON.stringify({c:cur,m:maxCur})); }catch(e2){} try{ document.cookie=k.replace('aw_draft_','aw_s_')+'=1;domain=.aiwills.co.uk;path=/;max-age=31536000;SameSite=Lax'; }catch(e3){} } }catch(e){} }
function awLogout(reason){
  try{ var _b=document.getElementById('awsignedin'); if(_b&&_b.parentNode) _b.parentNode.removeChild(_b); }catch(e){}
  // Tell the server first, so the session is dead even if this browser keeps a copy of the page.
  try{
    var _s=(window.AIWILLS_TOKEN||'');
    try{ var _k='aw_sess_'+((window.AIWILLS_LOC)||''); if(!_s) _s=sessionStorage.getItem(_k)||''; sessionStorage.removeItem(_k); }catch(e2){}
    if(_s) fetch(API+'/api/session-end',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({s:_s})}).catch(function(){});
  }catch(e){}
  // Drafts are per browser, so on a shared computer they would show the next person the answers.
  try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('aw_draft_')===0 || k.indexOf('aw_ident_')===0 || k.indexOf('aw_sent_')===0) localStorage.removeItem(k); }); }catch(e){}
  /* The drafts went, the cookie stayed. localSt() counts aw_s_<kind>_<loc>=1 as "started" and that
     cookie was written with a one year max-age, so after signing out the services page still showed
     every card as In progress. From the customer's side that is indistinguishable from never having
     been logged out at all, which is exactly what Chris was seeing. Expire them here, on each domain
     the cookie could have been written for. */
  try{
    var _ck=String(document.cookie||'').split(';');
    var _dead='=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    var _parts=String(location.hostname||'').split('.');
    var _root=_parts.length>2 ? _parts.slice(-2).join('.') : location.hostname;
    for(var _ci=0;_ci<_ck.length;_ci++){
      var _cn=String(_ck[_ci].split('=')[0]||'').replace(/^\s+/,'');
      if(_cn.indexOf('aw_s_')!==0) continue;
      try{ document.cookie=_cn+_dead; }catch(_e1){}
      try{ document.cookie=_cn+_dead+';domain=.aiwills.co.uk'; }catch(_e2){}
      try{ document.cookie=_cn+_dead+';domain=.'+_root; }catch(_e3){}
    }
  }catch(e){}
  try{ window.AIWILLS_EDIT=false; window.AIWILLS_TOKEN=''; window.AIWILLS_PREFILL=null; }catch(e){}
  try{ var u=new URL(location.href); u.searchParams.delete('aw_t'); history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||'')); }catch(e){}
  try{ var ov=document.getElementById('aw-logout'); if(!ov){ ov=document.createElement('div'); ov.id='aw-logout'; document.body.appendChild(ov); }
    ov.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,.97);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;font-family:var(--bf,Arial,sans-serif)';
    /* Reloading was wrong twice over: on a service page it handed a signed-out visitor a fresh
       blank form of the thing they had just finished, and the wording blamed inactivity even when
       they had pressed Log out themselves. */
    var _idle=(reason==='idle');
    var _hub=''; try{ _hub=awHubUrl(); }catch(e2){}
    var _btnCss='display:inline-block;background:var(--btn-bg,var(--primary,#0B3D2E));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px 26px;font-weight:600;cursor:pointer;font-family:var(--bf);text-decoration:none';
    var _action = _hub
      ? ('<a href="'+esc(_hub)+'" target="_top" style="'+_btnCss+'">Back to my services</a>')
      : ('<button type="button" onclick="location.reload()" style="'+_btnCss+'">Continue</button>');
    ov.innerHTML='<div style="max-width:420px;text-align:center;border:1px solid var(--line,#e6e6e6);border-radius:16px;padding:34px 28px;background:#fff;box-shadow:0 6px 30px rgba(0,0,0,.08)"><h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading,#1B1D1F);margin:0 0 10px;font-size:22px">'+(_idle?'You have been logged out':'You are signed out')+'</h2><p style="color:var(--muted,#6b6e72);line-height:1.55;margin:0 0 18px">'+(_idle?'For your security we log you out after a period of inactivity. Open your secure link again, or request a new one, to carry on.':'Your answers are saved to your account. Sign in again whenever you like from the services page.')+'</p>'+_action+'</div>';
  }catch(e){}
}
/* There was only ever a Log out link on the services hub. Someone signed in and working through a
   funnel had no way out at all, which is exactly the shared-computer problem the whole thing was
   meant to solve. This shows on every page while a session is live. */
function awSignedInBar(){
  try{
    if (document.getElementById('awsignedin')) return;
    var bar = document.createElement('div');
    bar.id = 'awsignedin';
    bar.style.cssText = 'position:fixed;top:0;right:0;z-index:99998;display:flex;align-items:center;gap:10px;padding:7px 14px;background:rgba(255,255,255,.96);border:1px solid var(--line,#e6e6e6);border-top:0;border-right:0;border-radius:0 0 0 10px;font:14px/1.2 var(--bf,Arial,Helvetica,sans-serif);box-shadow:0 2px 10px rgba(0,0,0,.06)';
    bar.innerHTML = '<span style="color:var(--muted,#6b6e72)">Signed in</span>'
      + '<button type="button" id="awsignout" style="background:none;border:0;padding:0;color:var(--primary,#0B3D2E);font:inherit;font-weight:600;text-decoration:underline;cursor:pointer">Sign out</button>';
    document.body.appendChild(bar);
    document.getElementById('awsignout').addEventListener('click', function(){ awLogout('manual'); });
  }catch(e){}
}
/* The hub asked "new or returning?" before letting anyone into a service, but that gate only ever
   existed on the hub's own cards. A bookmark, an emailed link or the browser's address bar went
   straight in, and the engine silently filled the form with whatever draft it found on the machine.
   Nothing had left the server, but on a shared computer the next person opened a will already
   carrying somebody else's name, address and date of birth. Ask at the door instead. */
function awDoorGate(){
  try{
    if(window.AIWILLS_EDIT===true || window.AIWILLS_PREFILL) return false;   // a real session already proved who this is
    /* Never interrupt somebody coming back from Stripe. The return carries aw_paid and aw_id, the
       engine sets payment.paid from them, and the panel then held the restore back until the person
       pressed Continue, at which point restoreLocal overwrote the state from a draft saved before
       they paid. The paid flag vanished and they were sent back to the payment step, having already
       been charged. They also do not need asking who they are: they just came off their own card. */
    try{
      var _rq = new URLSearchParams(location.search);
      if(_rq.get('aw_paid') || _rq.get('aw_id') || _rq.get('aw_etb_paid') || _rq.get('aw_t')) return false;
    }catch(e){}
    var k=(typeof lsKey==='function') ? lsKey() : ''; if(!k) return false;
    var raw=localStorage.getItem(k); if(!raw) return false;
    var saved=null; try{ saved=JSON.parse(raw); }catch(e){ return false; }
    if(!saved || typeof saved!=='object') return false;
    var nm='';
    ['personal','your_details','contact_details','donor'].forEach(function(sec){
      if(!nm && saved[sec] && saved[sec].firstName) nm=String(saved[sec].firstName).trim();
    });
    if(!nm) return false;   // nothing identifying saved, no point interrupting
    var _fresh=false;
    try{ var _dts=+(localStorage.getItem(k+'_ts')||0); _fresh=(_dts>0 && (Date.now()-_dts) < 10*60*1000); }catch(e){}
    if(_fresh) return false;   // they were here minutes ago: carry straight on, no modal
    var _hubL=''; try{ _hubL=awHubUrl(); }catch(e){}
    if(_hubL) _hubL += (_hubL.indexOf('?')>=0?'&':'?')+'aw_login=1';
    var _hubA=String(_hubL).replace(/"/g,'&quot;');

    var m=document.createElement('div');
    m.id='awdoor';
    m.style.cssText='position:fixed;inset:0;background:rgba(20,20,20,.45);z-index:99997;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--bf,Arial,sans-serif)';
    m.innerHTML='<div style="background:#fff;max-width:440px;width:100%;border-radius:16px;padding:26px 24px;box-shadow:0 10px 40px rgba(0,0,0,.2)">'
      + '<h2 style="font-family:var(--hf,Georgia,serif);color:var(--heading);margin:0 0 8px;font-size:21px">Welcome back, '+esc(nm)+'</h2>'
      + (_hubL
          ? ('<p style="color:var(--muted);font-size:14px;line-height:1.55;margin:0 0 18px">There are saved answers on this device. To keep them safe, log in and we will pick up exactly where you left off.</p>'
             + '<a id="awdoorlogin" href="'+_hubA+'" target="_top" style="display:block;text-align:center;text-decoration:none;width:100%;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf);box-sizing:border-box">Log in to continue</a>')
          : ('<p style="color:var(--muted);font-size:14px;line-height:1.55;margin:0 0 18px">There are unfinished answers saved on this device. Pick up where you left off, or clear them and start again.</p>'
             + '<button type="button" id="awdoorgo" style="width:100%;background:var(--btn-bg,var(--primary));color:#fff;border:none;border-radius:var(--btn-radius,10px);padding:13px;font-weight:600;cursor:pointer;font-family:var(--bf)">Continue where I left off</button>'))
      + '<button type="button" id="awdoornew" style="width:100%;margin-top:8px;background:#fff;color:var(--primary);border:1px solid var(--primary);border-radius:var(--btn-radius,10px);padding:12px;font-weight:600;cursor:pointer;font-family:var(--bf)">This is not me, start fresh</button>'
      + '<p style="color:var(--muted);font-size:12.5px;line-height:1.5;margin:14px 0 0">Starting fresh removes those answers from this device for good.</p>'
      + '</div>';
    document.body.appendChild(m);
    var _dgo=document.getElementById('awdoorgo'); if(_dgo){ _dgo.onclick=function(){
      try{ m.parentNode&&m.parentNode.removeChild(m); }catch(e){}
      try{ restoreLocal(); }catch(e){}
      try{ render(); }catch(e){}
    }; }
    document.getElementById('awdoornew').onclick=function(){
      try{ clearLocal(); }catch(e){}
      try{ Object.keys(localStorage).forEach(function(kk){ if(kk.indexOf('aw_draft_')===0 || kk.indexOf('aw_ident_')===0) localStorage.removeItem(kk); }); }catch(e){}
      try{
        var ck=String(document.cookie||'').split(';');
        var dead='=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        var p=String(location.hostname||'').split('.');
        var root=p.length>2 ? p.slice(-2).join('.') : location.hostname;
        for(var i=0;i<ck.length;i++){
          var n=String(ck[i].split('=')[0]||'').replace(/^\s+/,'');
          if(n.indexOf('aw_s_')!==0) continue;
          try{ document.cookie=n+dead; }catch(e1){}
          try{ document.cookie=n+dead+';domain=.aiwills.co.uk'; }catch(e2){}
          try{ document.cookie=n+dead+';domain=.'+root; }catch(e3){}
        }
      }catch(e){}
      try{ location.reload(); }catch(e){}
    };
    return true;   // caller must not restore behind the panel
  }catch(e){ return false; }
}
/* Someone half way through a will had no way back to their own services page. The only route was the
   browser's back button, and the header nav is the firm's marketing menu, which sends them off to the
   website instead. Mirrors the Sign out control on the opposite corner so the two read as a pair. */
function awHubUrl(){
  try{
    var CFGx = window.AIWILLS_CONFIG || {};
    var url = String(CFGx.hub_url || '').trim();
    if(!url){ try{ url = localStorage.getItem('aw_hub_' + (loc || '')) || ''; }catch(e){} }
    if(!url){
      try{
        var _m=String(document.cookie||'').match(new RegExp('(?:^|;\\s*)aw_hub_' + (loc || '') + '=([^;]*)'));
        if(_m) url = decodeURIComponent(_m[1]);
      }catch(e){}
    }
    /* Only ever point at somewhere we recognise. A cookie is not a safe place to take a link from
       without checking it. */
    if(url && !/^https?:\/\//i.test(url)) url='';
    return url;
  }catch(e){ return ''; }
}
/* A journey that ends on a completion screen used to leave the only way onwards as a Back button
   or the little chip in the corner. Where we know the services page, offer it properly. */
function awHubButtonHtml(label){
  var u=awHubUrl(); if(!u) return '';
  return '<a class="btn wide ghost" href="'+esc(u)+'" target="_top" style="display:block;text-align:center;text-decoration:none;margin-top:14px">'+esc(label||'Back to my services')+'</a>';
}
function awServicesBar(){
  try{
    if (document.getElementById('awservices')) return;
    var url = awHubUrl();
    if(!url) return;   // nothing to point at, say nothing
    var bar = document.createElement('div');
    bar.id = 'awservices';
    bar.style.cssText = 'position:fixed;top:0;left:0;z-index:99998;display:flex;align-items:center;gap:10px;padding:7px 14px;background:rgba(255,255,255,.96);border:1px solid var(--line,#e6e6e6);border-top:0;border-left:0;border-radius:0 0 10px 0;font:14px/1.2 var(--bf,Arial,Helvetica,sans-serif);box-shadow:0 2px 10px rgba(0,0,0,.06)';
    bar.innerHTML = '<a href="' + esc(url) + '" target="_top" style="color:var(--primary,#0B3D2E);font-weight:600;text-decoration:none">\u2190 My services</a>';
    document.body.appendChild(bar);
  }catch(e){}
}
function awStartAutoLogout(){
  if(window.AIWILLS_EDIT!==true) return;
  var MINS=10;
  function reset(){ if(window._awLogoutTimer) clearTimeout(window._awLogoutTimer); window._awLogoutTimer=setTimeout(function(){ awLogout('idle'); }, MINS*60*1000); }
  ['mousemove','keydown','click','scroll','touchstart'].forEach(function(ev){ try{ document.addEventListener(ev, reset, {passive:true}); }catch(e){ try{ document.addEventListener(ev, reset); }catch(e2){} } });
  reset();
}
function restoreLocal(){ try{ if(window.AIWILLS_EDIT===true||window.AIWILLS_PREFILL) return; var k=lsKey(); if(!k) return; var raw=localStorage.getItem(k); if(!raw) return; var saved=JSON.parse(raw); for(var s in saved){ if(state[s]&&saved[s]&&typeof saved[s]==='object'){ for(var kk in saved[s]) state[s][kk]=saved[s][kk]; } } try{ var _pos=JSON.parse(localStorage.getItem(k+'_pos')||'null'); if(_pos){ var _L=visible().length; maxCur=Math.max(0,Math.min(_pos.m||0,_L-1)); cur=Math.max(0,Math.min(_pos.c||0,maxCur)); } }catch(e3){} }catch(e){} }
function clearLocal(){ try{ var k=lsKey(); if(k){ localStorage.removeItem(k); localStorage.removeItem(k+'_pos'); try{ document.cookie=k.replace('aw_draft_','aw_s_')+'=;domain=.aiwills.co.uk;path=/;max-age=0'; }catch(e2){} } }catch(e){} }
var _autoT; function autosave(){ try{ collectVisible(); saveLocal(); }catch(e){} if(!loc){ return; } clearTimeout(_autoT); _autoT=setTimeout(function(){ try{ saveToGhl(state); }catch(e){} }, 1000); } // local draft on every change (survives refresh) + debounced GHL save // persist on every change, not just Continue
document.addEventListener('input', function(e){ var n=e.target.closest('[data-b]'); if(n){ var fl=n.closest('.field'); if(fl) fl.classList.remove('invalid'); autosave(); } });
document.addEventListener('change', function(e){ var n=e.target.closest('[data-b]'); if(!n) return; try{ if(n.tagName==='INPUT' && (n.type==='text'||n.type==='')){ var _ck=(n.getAttribute('data-b')||'').split('.').pop(); if(/postcode/i.test(_ck)){ n.value=n.value.toUpperCase().replace(/\s+/g,' ').trim(); } else if(/name|address|city|county|town/i.test(_ck)){ n.value=n.value.replace(/\b([a-z])/g,function(m,c){return c.toUpperCase();}); } } }catch(_e){} if(n.type==='radio'){ var grp=n.closest('.choices'); if(grp){ [].forEach.call(grp.querySelectorAll('.choice'),function(l){ l.classList.toggle('on', !!l.querySelector('input:checked')); }); } } if(n.type==='checkbox'){ var lb=n.closest('.choice'); if(lb) lb.classList.toggle('on', n.checked); } if(n.getAttribute('data-reflow')==='1'){ collectVisible(); render(); } autosave(); });
document.addEventListener('change', function(e){ var n=e.target.closest('[data-b]'); if(!n) return; var db=n.getAttribute('data-b')||''; var key=db.split('.').pop(); if(!/postcode/i.test(key)) return; var pc=(n.value||'').toUpperCase().replace(/\s+/g,' ').trim(); if(!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(pc)) return; var base=db.slice(0,db.lastIndexOf('.')); try{ fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pc.replace(/\s+/g,''))).then(function(r){return r.json();}).then(function(j){ if(!j||j.status!==200||!j.result) return; var res=j.result; var town=res.admin_district||res.parish||res.admin_ward||''; var county=res.admin_county||res.region||''; var cityEl=document.querySelector('[data-b="'+base+'.city"]'); if(cityEl && !cityEl.value){ cityEl.value=town; setP(base+'.city',town); } var cEl=document.querySelector('[data-b="'+base+'.county"]'); if(cEl && !cEl.value){ cEl.value=county; setP(base+'.county',county); } try{autosave();}catch(_){} }).catch(function(){}); }catch(_){} });
document.addEventListener('click', function(e){ try{ var a=e.target.closest('[data-add]'); if(a){ collectVisible(); addItem(a.getAttribute('data-add')); autosave(); return; } var rm=e.target.closest('[data-rm]'); if(rm){ collectVisible(); getP(rm.getAttribute('data-rm')).splice(+rm.getAttribute('data-i'),1); render(); autosave(); } }catch(err){ alert('Action error: '+err.message); } });
document.addEventListener('input', function(e){ try{ var f=e.target && e.target.closest && e.target.closest('.field.invalid'); if(f) f.classList.remove('invalid'); }catch(err){} }, true);
document.addEventListener('change', function(e){ try{ var t=e.target; if(t && t.name==='awetbplan'){ var wrap=document.getElementById('awetbplans'); if(wrap){ wrap.querySelectorAll('label.choice').forEach(function(l){ l.classList.remove('on'); }); var pl=t.closest('label'); if(pl) pl.classList.add('on'); } } var f=t && t.closest && t.closest('.field.invalid'); if(f) f.classList.remove('invalid'); }catch(err){} }, true);
document.addEventListener('change', function(e){ var u=e.target.closest&&e.target.closest('[data-upload]'); if(!u||!u.files||!u.files[0]) return; var file=u.files[0]; var fieldName=u.getAttribute('data-upload'); var nameKey=u.getAttribute('data-namekey'); var stat=u.parentElement.querySelector('.uplstat')||{}; if(file.size>10*1024*1024){ stat.textContent='File too large (max 10MB)'; return; } stat.textContent='Uploading...'; var rd=new FileReader(); rd.onload=function(){ var b64=String(rd.result).split(',')[1]||''; fetch(API+'/api/etb-save',{method:'POST',body:JSON.stringify({locationId:loc,state:state,status:'started',contactId:(window.AIWILLS_ETB_CID||'')})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.contactId) window.AIWILLS_ETB_CID=j.contactId; return fetch(API+'/api/etb-upload',{method:'POST',body:JSON.stringify({locationId:loc,contactId:(window.AIWILLS_ETB_CID||''),fieldName:fieldName,filename:file.name,mimeType:file.type,dataBase64:b64})}); }).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ stat.textContent='Uploaded: '+file.name; if(nameKey){ setP(nameKey,file.name); if(j.url) setP(nameKey+'_url',j.url); } try{ autosave(); }catch(e){} } else { stat.textContent='Upload failed: '+((j&&j.error)||'error'); } }).catch(function(){ stat.textContent='Upload failed'; }); }; rd.readAsDataURL(file); });
document.addEventListener('click', function(e){ var rm=e.target.closest&&e.target.closest('.frm'); if(!rm) return; e.preventDefault(); var field=rm.getAttribute('data-frm'), nameKey=rm.getAttribute('data-namekey'); if(nameKey){ setP(nameKey,''); setP(nameKey+'_url',''); } var tok=window.AIWILLS_TOKEN||''; if(tok){ try{ fetch(API+'/api/etb-file-remove',{method:'POST',body:JSON.stringify({t:tok,field:field})}).catch(function(){}); }catch(e2){} } try{ autosave(); }catch(e3){} render(); });
el('next').addEventListener('click', function(){ try{ go(1); }catch(err){ alert('Continue error: '+err.message); } });
el('back').addEventListener('click', function(){ try{ if(window.AIWILLS_EDIT===true && awHasReview() && window.__awFromSummary===true){ window.__awFromSummary=false; stripEmptyRepeaters(); try{autosave();}catch(e){} try{ var _vb=visible()[cur]; awEditReturnTo(_vb&&_vb.id, 0); }catch(e2){} jumpTo('review'); return; } go(-1); }catch(err){ alert('Back error: '+err.message); } });
window.addEventListener('error', function(ev){ try{ console.error('Engine error:', (ev&&ev.message)||'unknown'); }catch(e){} });
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
initState(); if(!awDoorGate()){ restoreLocal(); } applyBrand();
try{ var _qp=new URLSearchParams(location.search); if(_qp.get('aw_paid')==='1' && _qp.get('aw_id')){ window.AIWILLS_WILL_ID=_qp.get('aw_id'); if(state.payment) state.payment.paid=true; try{ if(loc) localStorage.setItem('aw_sent_'+FUNNEL_KEY+'_'+loc,'1'); }catch(e){}   /* finished on this device: stop the services page offering them a blank form later */ var _vv=visible(); for(var _i=0;_i<_vv.length;_i++){ if(_vv[_i].id==='generate'){ cur=_i; break; } } } if(_qp.get('aw_etb_paid')==='1' && FUNNEL===ETB_FUNNEL){ if(state.payment) state.payment.paid=true; try{ if(loc) localStorage.setItem('aw_sent_'+FUNNEL_KEY+'_'+loc,'1'); }catch(e){}   /* finished on this device: stop the services page offering them a blank form later */ var _ev=visible(); for(var _j=0;_j<_ev.length;_j++){ if(_ev[_j].id==='done'){ cur=_j; break; } } } /* Only land on the summary if there is something to summarise. Someone opening a service for the
   first time from their services page arrives in edit mode too, and was being dropped on a page
   of empty sections instead of question one. */
function awAnyAnswers(){ try{ var _v=visible(); for(var _i=0;_i<_v.length;_i++){ var _s2=_v[_i]; if(!(_s2.fields&&_s2.fields.length)) continue; var _o=state[_s2.id]||{}; for(var _k2 in _o){ var _v2=_o[_k2]; if(_v2!=null && _v2!=='' && !(Array.isArray(_v2)&&!_v2.length)) return true; } } }catch(e){} return false; }
if(window.AIWILLS_EDIT===true && awAnyAnswers()){ var _rv=visible(), _t=-1;
  for(var _k=0;_k<_rv.length;_k++){ if(_rv[_k].kind==='review'){ _t=_k; break; } }
  /* Probate has no summary, so signing back in dropped the customer on question one of a quote they
     had already sent. Where the quote is in, land on the outcome they already have. */
  if(_t<0){
    /* Anyone who sent a quote before we started stamping the step has no flag on their record, and
       they were still being dropped on question one. Falling back to "the last question step has
       answers in it" catches them, and costs nothing for someone genuinely part way through. */
    var _lastIn=-1; for(var _li=0;_li<_rv.length;_li++){ if(_rv[_li].fields&&_rv[_li].fields.length) _lastIn=_li; }
    var _anyIn=false;
    try{ var _lo=(_lastIn>=0)?(state[_rv[_lastIn].id]||{}):{}; for(var _lk in _lo){ var _lv=_lo[_lk]; if(_lv!=null && _lv!=='' && !(Array.isArray(_lv)&&!_lv.length)){ _anyIn=true; break; } } }catch(e){}
    for(var _q2=0;_q2<_rv.length;_q2++){ var _qs=_rv[_q2];
      if((_qs.kind==='quote'||_qs.kind==='done') && ((state[_qs.id]&&state[_qs.id].submitted)||_anyIn)){ _t=_q2; break; }
    }
  }
  if(_t>=0) cur=_t;
} }catch(e){}

/* Service URLs register themselves. When this engine runs on a real funnel page it already knows its
   own address, so it tells the server once. The services hub can then link to the client's own page
   instead of a shared test page, with nothing for anyone to set by hand. */
try{ (function(){
  if(!loc) return;
  var _rk=FUNNEL_KEY; if(['wills','lpa','etb','probate'].indexOf(_rk)<0) return;
  var _rh=(location.hostname||'').toLowerCase();
  if(_rh==='engine.aiwills.co.uk'||_rh==='aiwills.digilyse.co'||_rh==='localhost'||_rh==='127.0.0.1') return;
  if(location.protocol!=='https:') return;
  var _rp=location.pathname||'';
  if(/\/(preview|page-builder|funnel-builder)\//i.test(_rp)) return;
  var _ru=location.origin+location.pathname;
  var _rck='aw_regurl_'+_rk+'_'+loc;
  try{ if(localStorage.getItem(_rck)===_ru) return; }catch(e){}
  fetch(API+'/api/register-url',{method:'POST',body:JSON.stringify({locationId:loc,key:_rk,url:_ru})})
    .then(function(r){return r.json();})
    .then(function(){ try{ localStorage.setItem(_rck,_ru); }catch(e){} })
    .catch(function(){});
})(); }catch(e){}
render(); closeGaps();
window.addEventListener('load', closeGaps);
setTimeout(closeGaps,400); setTimeout(closeGaps,1200);

  }
  try{ if(rootEl){ var _KEYS=['company_name','logo_url','primary_color','heading_color','body_color','header_bg_color','page_bg_color','nav_text_color','heading_font','body_font','site_max_width','footer_max_width','nav_font_size','nav_weight','body_font_size','logo_height','heading_font_size','heading_weight','button_weight','phone','email','address','privacy_url','terms_url','consent_label','marketing_label','legal_footer','nav_menu_json','footer_menu_json','font_css_links','wills_url','lpa_url','etb_url','wills_title','wills_blurb','lpa_title','lpa_blurb','etb_title','etb_blurb','will_price','button_color','button_hover_color','button_text_color','button_secondary_color','button_secondary_text_color','button_font','button_radius','footer_bg_color','footer_text_color','facebook_url','instagram_url','linkedin_url','twitter_url','youtube_url','tiktok_url']; var _pc={}, _mm='{'+'{'; _KEYS.forEach(function(k){ var v=rootEl.getAttribute('data-'+k); if(v!=null && v!=='' && v.indexOf(_mm)<0) _pc[k]=v; }); if(Object.keys(_pc).length) window.AIWILLS_CONFIG=Object.assign({}, window.AIWILLS_CONFIG||{}, _pc); } }catch(e){}
  (function(){
    var _pcfg = window.AIWILLS_CONFIG || {};
    var _brandKeys = Object.keys(_pcfg).filter(function(k){ return k!=='funnel'; });
    function _runBranded(){
      if(loc){ fetch(API+'/api/brand?locationId='+encodeURIComponent(loc)).then(function(r){return r.json();}).then(function(c){ window.AIWILLS_CONFIG=Object.assign({}, (c&&!c._err)?c:{}, _pcfg); run(); }).catch(function(){ run(); }); } // always fill brand from GHL so a blank/partial page loader never falls back to default; loader data-* still overrides
      else { run(); }
    }
    var _tok=null, _qloc='';
    try{ var _q=new URLSearchParams(location.search); _tok=_q.get('aw_t'); _qloc=_q.get('aw_loc')||''; }catch(e){}
    if(!_qloc){ try{ var _dle=document.getElementById('aiwills-funnel'); if(_dle) _qloc=String(_dle.getAttribute('data-loc')||'').replace(/[^A-Za-z0-9]/g,''); }catch(e){} }
    try{ window.AIWILLS_LOC=_qloc; }catch(e){}
    var _sk='aw_sess_'+_qloc;
    function _awStripToken(){ try{ var u=new URL(location.href); u.searchParams.delete('aw_t'); history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||'')); }catch(e){} }
    function _awLinkDead(msg){
      try{
        var host=document.getElementById('aiwills-funnel')||document.body;
        var d=document.createElement('div');
        d.style.cssText='max-width:460px;margin:48px auto;padding:30px 26px;border:1px solid #e6e6e6;border-radius:16px;text-align:center;font-family:Arial,Helvetica,sans-serif;background:#fff';
        d.innerHTML='<h2 style="margin:0 0 10px;font-size:21px">This link has expired</h2><p style="color:#6b6e72;line-height:1.55;margin:0">'+(msg||'Sign-in links last one hour and can only be used once, to keep your details safe. Please request a new one.')+'</p>';
        host.innerHTML=''; host.appendChild(d);
      }catch(e){}
    }
    function _awSessDeadNotice(){
      try{
        if(document.getElementById('aw-sessdead')) return;
        var hub=''; try{ hub=awHubUrl(); }catch(e){}
        var dest=hub?(hub+(hub.indexOf('?')>=0?'&':'?')+'aw_login=1'):'';
        dest=String(dest).replace(/"/g,'&quot;');
        var ov=document.createElement('div');
        ov.id='aw-sessdead';
        ov.style.cssText='position:fixed;inset:0;background:rgba(255,255,255,.97);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,Helvetica,sans-serif';
        ov.innerHTML='<div style="max-width:430px;text-align:center;border:1px solid #e6e6e6;border-radius:16px;padding:34px 28px;background:#fff;box-shadow:0 6px 30px rgba(0,0,0,.08)">'
          +'<h2 style="margin:0 0 10px;font-size:22px">You have been signed out</h2>'
          +'<p style="color:#6b6e72;line-height:1.6;margin:0 0 20px">To keep your details safe you are signed out after 10 minutes of inactivity. Log back in and we will bring up your saved information.</p>'
          +(dest?('<a href="'+dest+'" target="_top" style="display:inline-block;background:#1B1D1F;color:#fff;border-radius:10px;padding:13px 26px;font-weight:600;text-decoration:none">Log back in</a>'):'<p style="font-weight:600;margin:0">Open the services page and choose Log in.</p>')
          +'</div>';
        document.body.appendChild(ov);
      }catch(e){}
    }
    function _awLoadState(sess){
      return fetch(API+'/api/state-load?t='+encodeURIComponent(sess)+'&funnel='+encodeURIComponent(String((window.AIWILLS_CONFIG||{}).funnel||'')))
        .then(function(r){return r.json();}).then(function(j){
          if(j&&j.ok){ window.AIWILLS_EDIT=true; window.AIWILLS_SUBMITTED=(j.submitted===true); window.AIWILLS_FILES=j.files||[]; if(j.state) window.AIWILLS_PREFILL=j.state; if(j.funnel==='wills'||j.funnel==='lpa'){ window.AIWILLS_CONTACT_ID=j.contactId; } else { window.AIWILLS_ETB_CID=j.contactId; } }
          else { window.__awSessDead=true; try{ sessionStorage.removeItem(_sk); }catch(e){} }
        }).catch(function(){ window.__awSessDead=true; });
    }
    var _sess=''; try{ _sess=sessionStorage.getItem(_sk)||''; }catch(e){}
    /* A page that ran the previous engine stored the session under 'aw_sess_' with no location.
       Adopt it so signing in on a stale services tab still carries into the funnels. */
    if(!_sess && _qloc){
      try{ var _legacy=sessionStorage.getItem('aw_sess_')||''; if(_legacy){ _sess=_legacy; sessionStorage.setItem(_sk,_legacy); sessionStorage.removeItem('aw_sess_'); } }catch(e){}
    }
    if(_tok){
      // Swap the emailed link for a session, then take it out of the address bar so the back
      // button and the browser history cannot sign the next person in.
      fetch(API+'/api/session-start',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({t:_tok})})
        .then(function(r){return r.json();}).then(function(j){
          _awStripToken();
          if(j&&j.ok&&j.session){ try{ sessionStorage.setItem(_sk,j.session); }catch(e){} window.AIWILLS_TOKEN=j.session; return _awLoadState(j.session).then(_runBranded); }
          _runBranded(); _awLinkDead(j&&j.message);
        }).catch(function(){ _awStripToken(); _runBranded(); });
    } else if(_sess){
      window.AIWILLS_TOKEN=_sess;
      _awLoadState(_sess).then(function(){
        _runBranded();
        try{ if(window.__awSessDead && String((window.AIWILLS_CONFIG||{}).funnel||'')!=='hub') _awSessDeadNotice(); }catch(e){}
      });
    } else { _runBranded(); }
  })();
})();