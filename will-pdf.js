/* will-pdf.js - server-side Will PDF generator for AI Wills (pdfkit, built-in Times).
 * Wording ported verbatim from the live APITemplate will template (id 19a77b23ea0ffd2c).
 * Consumes the clean internal data contract documented in AiWills_will-data-contract_v1.md.
 * Renders the primary will, plus a mirror will for the spouse/partner when requested.
 */
var PDFDocument = require('pdfkit');

/* ---------- helpers ---------- */
function esc(v){ return (v == null ? '' : String(v)).trim(); }
function NA(v){ var s = esc(v); return s ? s : 'Not Available'; }
function tc(v){ // title-case, mirrors Jinja | title
  var s = esc(v); if(!s) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, function(m,c){ return c.toUpperCase(); });
}
function tcNA(v){ var s = esc(v); return s ? tc(s) : 'Not Available'; }
function arr(a){ return Array.isArray(a) ? a : []; }
function yes(v){ return esc(v).toLowerCase() === 'yes' || v === true; }

/* build a person's full display name with optional title/middle */
function personName(p){
  p = p || {};
  var parts = [];
  if (esc(p.title)) parts.push(tc(p.title));
  parts.push(esc(p.firstName) ? tc(p.firstName) : 'Not Available');
  if (esc(p.middleName)) parts.push(tc(p.middleName));
  parts.push(esc(p.lastName) ? tc(p.lastName) : 'Not Available');
  return parts.join(' ');
}
function partnerName(p){
  p = p || {};
  return (esc(p.firstName) ? tc(p.firstName) : 'Not Available') + ' ' +
         (esc(p.lastName) ? tc(p.lastName) : 'Not Available');
}
function personalAddress(p){
  p = p || {};
  var s = esc(p.address) ? tc(p.address) : 'Not Available';
  if (esc(p.city)) s += ', ' + tc(p.city);
  if (esc(p.county)) s += ', ' + tc(p.county);
  if (esc(p.postcode)) s += ', ' + esc(p.postcode);
  return s;
}

/* ---------- document plumbing ---------- */
function buildWillPdf(data, brand){
  data = data || {}; brand = brand || {};
  return new Promise(function(resolve, reject){
    try {
      var doc = new PDFDocument({ size:'A4', margins:{ top:64, bottom:72, left:70, right:70 }, bufferPages:true });
      var chunks=[];
      doc.on('data', function(c){ chunks.push(c); });
      doc.on('end', function(){ resolve(Buffer.concat(chunks)); });
      doc.on('error', reject);

      renderWill(doc, data, false);
      if (yes((data.personal||{}).mirrorWill)){
        doc.addPage();
        renderWill(doc, data, true);
      }
      finishPages(doc, brand);
      doc.end();
    } catch(e){ reject(e); }
  });
}

/* ---------- typographic primitives ---------- */
function willTitle(doc, name){
  doc.font('Times-Bold').fontSize(22).fillColor('black').text('Last Will', { align:'center' });
  doc.text('and Testament', { align:'center' });
  doc.font('Times-Italic').fontSize(12).text('- of -', { align:'center' });
  doc.moveDown(0.3);
  doc.font('Times-Bold').fontSize(15).text(name, { align:'center' });
  doc.moveDown(1.1);
}
function H(doc, t){ doc.moveDown(0.7); doc.font('Times-Bold').fontSize(12.5).fillColor('black').text(t); doc.moveDown(0.25); }
function P(doc, t){ doc.font('Times-Roman').fontSize(11).fillColor('black').text(t, { align:'justify', lineGap:2.5 }); doc.moveDown(0.45); }

/* ---------- shared clause builders ---------- */
function execClause(doc, d){
  var execs = arr(d.executors).filter(function(e){ return esc(e.firstName)||esc(e.lastName)||esc(e.relationship); });
  if (!execs.length) execs = [{}]; // template always names at least a first executor
  var count = execs.length;
  var s = 'I appoint my ';
  execs.forEach(function(e, i){
    if (i > 0) s += ', my ';
    s += NA(tc(e.relationship)) + ', ' + tcNA(e.firstName) + ' ' + tcNA(e.lastName) + ', of ' + tcNA(e.address);
  });
  s += ' to be ' + (count === 1 ? 'executor and trustee' : 'joint executors and trustees') + '.';
  H(doc, 'Appointment of Executors and Trustees');
  P(doc, s);
  return count;
}

function guardianClause(doc, d){
  var ch = d.children || {};
  if (!yes(ch.appointGuardians)) return;
  var g = d.guardian || {};
  var s = 'If at my death any of my children are under 18, I appoint my ' + NA(tc(g.relationship)) +
          ', ' + tcNA(g.firstName) + ' ' + tcNA(g.lastName) + ', of ' + tcNA(g.address) + ' as guardian of such children';
  var sub = g.substitute || {};
  if (yes(sub.has)){
    s += ', with ' + NA(tc(sub.relationship)) + ', ' + tcNA(sub.firstName) + ' ' + tcNA(sub.lastName) +
         ', of ' + tcNA(sub.address) + ' as substitute guardian';
  }
  s += '.';
  H(doc, 'Appointment of Guardians');
  P(doc, s);
}

function giftsClauses(doc, gifts){
  gifts = gifts || {};
  var items = arr(gifts.items), cash = arr(gifts.cash), char = arr(gifts.charities), pets = arr(gifts.pets);

  if (items.length){
    H(doc, 'Gifts and Legacies (Items)');
    items.forEach(function(x){
      P(doc, 'I give my ' + tcNA(x.description) + ', to my ' + tcNA(x.recipientRelationship) + ', ' +
              tcNA(x.recipientName) + ', of ' + tcNA(x.recipientAddress) + ', free of inheritance tax.');
    });
    P(doc, 'If any gift or legacy in this Will fails for any reason and is not otherwise disposed of by this Will or any codicil to it, then (subject to any specific provision to the contrary) that gift or legacy shall form part of my residuary estate and shall be distributed in accordance with the terms relating to the residue of my estate.');
  }

  if (cash.length){
    H(doc, 'Cash Gifts');
    cash.forEach(function(x){
      P(doc, 'I give the sum of £' + esc(x.amount) + ' to my ' + tcNA(x.beneficiaryRelationship) + ', ' +
              tcNA(x.beneficiaryName) + ', of ' + tcNA(x.beneficiaryAddress) + ', free of inheritance tax.');
    });
  }

  if (char.length){
    H(doc, 'Charitable Donations');
    char.forEach(function(x){
      var s = 'I give the sum of £' + esc(x.amount) + ' to ' + tcNA(x.name);
      if (esc(x.number)) s += ', Registered Charity Number ' + esc(x.number);
      s += ' (a registered charity in England and Wales) or, if that charity shall have ceased to exist or amalgamated with another charity, to such charitable organisation as my executors shall in their absolute discretion determine whose objects most closely resemble those of that charity, and a receipt from the proper officer of such charity shall be a full discharge to my executors.';
      P(doc, s);
    });
  }

  if (pets.length){
    H(doc, 'Pets');
    pets.forEach(function(x){
      P(doc, 'I give the sum of £' + esc(x.amount) + ' to ' + tcNA(x.guardian) +
              ' on the condition that they take possession of and care for my pet(s) known as ' + tcNA(x.description) +
              ' and if they shall fail or be unwilling to do so, this gift shall lapse and fall into my residuary estate.');
    });
  }
}

/* residuary estate; spouseName is who fills the "spouse/partner" slot for this will */
function residuaryClause(doc, d, spouseName){
  var r = d.residual || {};
  var distrib = esc(r.distribution);
  if (!distrib) return;
  var step = yes(r.includeStepChildren) ? ' (which expression shall include my stepchildren)' : '';
  H(doc, 'The Residuary Estate');

  if (distrib === 'All to my spouse/partner, then equally between my children'){
    P(doc, 'I give the whole of my residuary estate to my spouse/partner, ' + spouseName + ', if they survive me by 28 days.');
    P(doc, 'If my said spouse/partner does not survive me by 28 days, then I give the whole of my residuary estate equally between such of my children' + step + ' as shall survive me, and if more than one, in equal shares.');
    P(doc, 'If any of my children predecease me leaving issue who survive me, such issue shall take (in equal shares between them) the share their parent would have taken had they survived me.');
    P(doc, 'If any of my children predecease me leaving no issue who survive me, their share shall accrue to the surviving children in equal shares.');
    P(doc, 'If the foregoing provisions fail to dispose of the whole or any part of my residuary estate, I give such residuary estate (or such part thereof) to such persons as would be entitled under the intestacy rules in force in England and Wales at my death.');

  } else if (distrib === 'To be shared equally between my children only'){
    P(doc, 'I give the whole of my residuary estate to such of my children' + step + ' as shall survive me, and if more than one, in equal shares.');
    P(doc, 'If any of my children shall predecease me leaving issue who survive me, such issue shall take (in equal shares between them) the share their parent would have taken had they survived me.');
    P(doc, 'If any of my children shall predecease me leaving no issue who survive me, their share shall accrue to the surviving children in equal shares.');
    P(doc, 'If the foregoing provisions fail to dispose of the whole or any part of my residuary estate, I give such residuary estate (or such part thereof) to such persons as would be entitled under the intestacy rules in force in England and Wales at my death.');

  } else if (distrib === 'All to my spouse/partner'){
    P(doc, 'I give the whole of my residuary estate (being all my real and personal property whatsoever and wheresoever not otherwise effectively disposed of by this my Will) to my spouse/partner, ' + spouseName + ' absolutely, provided that he/she survives me by a period of 28 days.');

  } else if (distrib === 'To my spouse/partner then to those who I have listed below'){
    P(doc, 'I give all my residuary estate (being all my real and personal property whatsoever and wheresoever not otherwise effectively disposed of by this my Will) to my spouse/partner, ' + spouseName + ' absolutely, provided that he/she survives me by a period of 28 days.');
    P(doc, 'But if my said spouse/partner shall fail to survive me by such period, then I give my residuary estate to the following beneficiaries in the proportions specified below:');
    arr(r.beneficiaries).forEach(function(b){
      P(doc, tcNA(b.name) + ' of ' + tcNA(b.address) + ' — ' + esc(b.share) + '%');
    });
    P(doc, 'And if any such beneficiary shall fail to survive me by a period of 28 days leaving issue who survive me, such issue shall take (in equal shares between them) the share their parent would have taken had they survived me.');
    P(doc, 'And if any such beneficiary shall fail to survive me by a period of 28 days leaving no issue who survive me, their share shall pass to the surviving beneficiaries in proportion to their respective shares.');
    P(doc, 'And if the foregoing provisions fail to dispose of the whole or any part of my residuary estate, I give such residuary estate (or such part thereof) to such persons as would be entitled under the intestacy rules in force in England and Wales at my death.');

  } else if (distrib === 'Between other persons who are listed below'){
    P(doc, 'I give the whole of my residuary estate to the following individuals, in the shares specified:');
    arr(r.beneficiaries).forEach(function(b){
      P(doc, '- ' + esc(b.share) + '% to my ' + tcNA(b.relationship) + ', ' + tcNA(b.name) + ', of ' + tcNA(b.address) + ';');
    });
    P(doc, 'If any such beneficiary dies before me, that share shall pass to their issue in equal shares per stirpes.');
    P(doc, 'If any such beneficiary shall predecease me leaving no issue who survive me, their share shall accrue to the surviving beneficiaries in proportion to their respective shares.');
    P(doc, 'If the foregoing provisions fail to dispose of the whole or any part of my residuary estate, I give such residuary estate (or such part thereof) to such persons as would be entitled under the intestacy rules in force in England and Wales at my death.');
  }

  var age = parseInt(esc(r.ageOfBenefit), 10);
  if (!isNaN(age) && age > 18){
    P(doc, 'If any beneficiary named above is under the age of 18 at my death, I direct that their share be held on trust by my trustees until they reach the age of 18. My trustees may use trust capital or income for the beneficiary’s education, maintenance, or welfare.');
  }
  P(doc, 'If the foregoing provisions of this Will shall fail to dispose of the whole or any part of my estate, I give such estate (or such part thereof) absolutely to such persons as would be entitled to it under the intestacy rules in force in England and Wales at the date of my death.');
}

function funeralPrimary(doc, f){
  f = f || {};
  H(doc, 'Funeral Wishes');
  var s = 'I express my wish to be: ';
  if (esc(f.arrangements)) s += esc(f.arrangements);
  if (esc(f.music)) s += '; with music ' + esc(f.music);
  if (yes((f.plan||{}).has) && esc((f.plan||{}).details)) s += '; with funeral plan details ' + esc(f.plan.details);
  if (esc(f.additional)) s += '; with readings from: ' + esc(f.additional);
  s += '.';
  P(doc, s);
  organClause(doc, f.organDonation);
}

function funeralMirror(doc, f){
  f = f || {};
  H(doc, 'Funeral Wishes');
  var s = 'I express my wish to be: ';
  if (esc(f.arrangements)) s += esc(f.arrangements);
  if (esc(f.location)) s += '; at ' + esc(f.location);
  if (esc(f.music)) s += '; with music ' + esc(f.music);
  if (yes((f.plan||{}).has)) s += '; with a funeral plan in place';
  if (esc(f.readings)) s += '; with readings from: ' + esc(f.readings);
  s += '.';
  P(doc, s);
  organClause(doc, f.organDonation);
}

function organClause(doc, v){
  if (yes(v)){
    P(doc, 'I express my wish that, upon my death, any of my organs and/or tissue may be used for transplantation, therapy, medical education, or research purposes. I request that my Executors and family members give effect to this wish so far as is practicable.');
  } else {
    P(doc, 'I express my wish that none of my organs or tissue be used for transplantation, therapy, medical education, or research purposes after my death. I request that my Executors and family members respect this wish.');
  }
}

function signatureBlock(doc){
  doc.moveDown(0.8);
  P(doc, 'Signed by me in the presence of the undersigned witnesses, who both attest and witness my signature in my presence, and in the presence of each other.');
  doc.moveDown(0.3);
  doc.font('Times-Roman').fontSize(11).fillColor('black');
  doc.text('Date: ___________________________');
  doc.moveDown(0.4);
  doc.text('Signature: ___________________________');
  doc.moveDown(0.8);
  [['Witness 1'],['Witness 2']].forEach(function(w){
    doc.font('Times-Bold').fontSize(11).text(w[0]);
    doc.moveDown(0.2);
    doc.font('Times-Roman').fontSize(10.5).fillColor('#222')
       .text('Name: ______________________________________________')
       .text('Address: ____________________________________________')
       .text('Profession: _________________________________________')
       .text('Signature: __________________________________________');
    doc.fillColor('black').moveDown(0.7);
  });
}

/* ---------- one complete will (primary or mirror) ---------- */
function renderWill(doc, d, isMirror){
  var personal = d.personal || {};
  var partner = d.partner || {};

  /* who is the testator of THIS will, and who is their spouse slot */
  var testatorName, testatorAddr, spouseSlotName, akaIntro;
  if (!isMirror){
    testatorName = personName(personal);
    testatorAddr = personalAddress(personal);
    spouseSlotName = spouseDisplay(partner, partner.aka); // partner is the spouse in the primary will
    if (yes(personal.aka && personal.aka.has)){
      akaIntro = 'previously known as ' + tcNA((personal.aka||{}).firstName) + ' ' + tcNA((personal.aka||{}).lastName);
    }
  } else {
    testatorName = partnerName(partner);
    testatorAddr = esc(partner.address) ? tc(partner.address) : 'Not Available';
    spouseSlotName = spouseDisplay(personal, personal.aka); // primary person is the spouse in the mirror will
    akaIntro = null; // mirror intro has no AKA in the source template
  }

  /* title + intro */
  willTitle(doc, testatorName);

  H(doc, 'Introduction and Revocation');
  var intro = 'This is the last Will and Testament of me, ' + testatorName + ' of ' + testatorAddr;
  if (akaIntro) intro += ', ' + akaIntro;
  intro += '. I hereby revoke all previous Wills and codicils made by me and declare this to be my last Will.';
  P(doc, intro);

  /* domicile + IHT */
  H(doc, 'Domicile Declaration');
  P(doc, 'I declare that at the date of this Will I am domiciled and habitually resident in England and Wales. If I later cease to be so domiciled, this clause is without prejudice to the validity of this Will as regards property in England & Wales.');
  P(doc, 'All inheritance tax (and any other duties or taxes payable on my death) arising in respect of my estate or any gift made by this Will shall be paid out of my residuary estate without apportionment, and my executors shall not be required to recover any part of such tax from any beneficiary.');

  /* executors (same appointees in both wills) */
  execClause(doc, d);

  /* guardians */
  guardianClause(doc, d);

  /* gifts: primary uses d.gifts, mirror uses d.mirrorGifts */
  giftsClauses(doc, isMirror ? d.mirrorGifts : d.gifts);

  /* simultaneous death: always in mirror; in primary only when a mirror will is being made */
  if (isMirror || yes(personal.mirrorWill)){
    H(doc, 'Simultaneous Death Provision');
    P(doc, 'If my spouse/partner and I die in circumstances where it is uncertain which of us survived the other, my spouse/partner shall be deemed to have predeceased me for the purposes of this Will.');
  }

  /* residuary */
  residuaryClause(doc, d, spouseSlotName);

  /* funeral */
  if (!isMirror) funeralPrimary(doc, d.funeral);
  else funeralMirror(doc, d.mirrorFuneral);

  /* signature */
  signatureBlock(doc);
}

function spouseDisplay(p, aka){
  p = p || {};
  var s = (esc(p.firstName) ? tc(p.firstName) : 'Not Available') + ' ' + (esc(p.lastName) ? tc(p.lastName) : 'Not Available');
  if (yes(aka && aka.has)){
    s += ', also known as ' + tcNA((aka||{}).firstName) + ' ' + tcNA((aka||{}).lastName);
  }
  return s;
}

/* ---------- footer ---------- */
function finishPages(doc, brand){
  var range = doc.bufferedPageRange();
  var credit = (brand && brand.company_name) ? ('Prepared via ' + brand.company_name) : 'Prepared via AI Wills';
  for (var i = range.start; i < range.start + range.count; i++){
    doc.switchToPage(i);
    var keep = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font('Times-Italic').fontSize(8).fillColor('#888')
       .text(credit + '    •    Page ' + (i - range.start + 1) + ' of ' + range.count,
             doc.page.margins.left, doc.page.height - 34,
             { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align:'center', lineBreak:false });
    doc.fillColor('black');
    doc.page.margins.bottom = keep;
  }
}

/* ---------- normalize: engine funnel state -> PDF data contract ----------
 * The funnel engine emits state keyed by step id with flat field keys and
 * repeaters keyed `list`. This maps that to the clean contract will-pdf consumes.
 * Safe to run on an already-normalized object (missing keys just stay blank). */
function _o(x){ return (x && typeof x === 'object') ? x : {}; }
function _gifts(g){ g = _o(g); return { items:Array.isArray(g.items)?g.items:[], cash:Array.isArray(g.cash)?g.cash:[], charities:Array.isArray(g.charities)?g.charities:[], pets:Array.isArray(g.pets)?g.pets:[] }; }

function normalizeWill(s){
  s = _o(s);
  var P=_o(s.personal), SI=_o(s.situation), PT=_o(s.partner), CH=_o(s.children),
      G=_o(s.guardian), EX=_o(s.executors), R=_o(s.residual), F=_o(s.funeral), MF=_o(s.mirrorFuneral);
  return {
    personal: {
      title:P.title, firstName:P.firstName, middleName:P.middleName, lastName:P.lastName,
      aka:{ has:P.akaHas, firstName:P.akaFirstName, lastName:P.akaLastName },
      address:P.address, city:P.city, county:P.county, postcode:P.postcode,
      domicileElsewhere:SI.domicileElsewhere, propertyAbroad:SI.propertyAbroad,
      previousWill:{ has:SI.previousWillHas, firm:SI.previousWillFirm },
      hasPartner:PT.hasPartner, mirrorWill:PT.mirrorWill, hasChildren:CH.hasChildren,
      email:P.email, phone:P.phone
    },
    partner: {
      firstName:PT.firstName, lastName:PT.lastName,
      aka:{ has:PT.akaHas, firstName:PT.akaFirstName, lastName:PT.akaLastName },
      dob:PT.dob, status:PT.status, address:PT.address, phone:PT.phone
    },
    children: { anyUnder18:CH.anyUnder18, appointGuardians:CH.appointGuardians, count:CH.count },
    guardian: {
      firstName:G.firstName, lastName:G.lastName, address:G.address, relationship:G.relationship,
      substitute:{ has:G.subHas, firstName:G.subFirstName, lastName:G.subLastName, address:G.subAddress, relationship:G.subRelationship }
    },
    executors: Array.isArray(EX.list) ? EX.list : (Array.isArray(s.executors) ? s.executors : []),
    gifts: _gifts(s.gifts),
    mirrorGifts: _gifts(s.mirrorGifts),
    residual: { distribution:R.distribution, includeStepChildren:R.includeStepChildren, ageOfBenefit:R.ageOfBenefit, beneficiaries:Array.isArray(R.beneficiaries)?R.beneficiaries:[] },
    funeral: { arrangements:F.arrangements, music:F.music, additional:F.additional, organDonation:F.organDonation, plan:{ has:F.planHas, details:F.planDetails } },
    mirrorFuneral: { arrangements:MF.arrangements, location:MF.location, music:MF.music, readings:MF.readings, organDonation:MF.organDonation, plan:{ has:MF.planHas } }
  };
}

/* ---------- Executor Toolbox summary PDF ---------- */
function etbH(doc, t){ doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(13).fillColor('#0B3D2E').text(t); doc.moveDown(0.15); }
function etbLine(doc, label, val){ if(val==null||String(val).trim()==='') return; doc.font('Helvetica-Bold').fontSize(10).fillColor('#555').text(label+': ', {continued:true}); doc.font('Helvetica').fillColor('#111').text(String(val)); }
function buildEtbPdf(state, brand){
  state = state || {}; brand = brand || {};
  return new Promise(function(resolve, reject){
    try {
      var doc = new PDFDocument({ size:'A4', margins:{ top:60, bottom:64, left:60, right:60 }, bufferPages:true });
      var chunks=[]; doc.on('data', function(c){ chunks.push(c); }); doc.on('end', function(){ resolve(Buffer.concat(chunks)); }); doc.on('error', reject);
      var company = brand.company_name || 'Executor Toolbox';
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#0B3D2E').text(company);
      doc.font('Helvetica').fontSize(12).fillColor('#555').text('Executor Toolbox summary');
      doc.moveDown(0.2); doc.font('Helvetica').fontSize(9).fillColor('#888').text('Generated ' + new Date().toLocaleDateString('en-GB') + '. Keep this with your important papers so your executors can find everything.');
      var yd = state.your_details || {};
      etbH(doc,'Your details');
      etbLine(doc,'Name',[yd.firstName,yd.lastName].filter(Boolean).join(' '));
      etbLine(doc,'Email',yd.email); etbLine(doc,'Phone',yd.phone);
      etbLine(doc,'Address',[yd.address,yd.city,yd.postcode].filter(Boolean).join(', '));
      var ex = (state.executors && state.executors.list) || [];
      if (arr(ex).length){ etbH(doc,'Executors'); arr(ex).forEach(function(e,i){ etbLine(doc,'Executor '+(i+1), [ [e.firstName,e.lastName].filter(Boolean).join(' '), (e.relationship||''), (e.phone||''), (e.email||'') ].filter(Boolean).join(' · ')); }); }
      function docSec(key,label){ var s=state[key]||{}; if(!s.has) return; etbH(doc,label); etbLine(doc,'Have one?',s.has); etbLine(doc,'Kept',s.locationType); etbLine(doc,'Location',s.locationText); etbLine(doc,'Type',s.type); etbLine(doc,'Uploaded file',s.document); }
      docSec('will','Will'); docSec('codicil','Codicil'); docSec('lpa','Lasting Power of Attorney');
      var pr = state.property || {};
      if (pr.has){ etbH(doc,'Property'); etbLine(doc,'Deeds kept',pr.deedsLocation); etbLine(doc,'Deeds notes',pr.deedsNotes); arr(pr.list).forEach(function(p,i){ etbLine(doc,'Property '+(i+1), [p.address,p.ownership,(String(p.hasMortgage).toLowerCase()==='yes'?('Mortgage: '+(p.mortgageProvider||'yes')):'')].filter(Boolean).join(' · ')); }); }
      var pn = state.pensions || {};
      if (pn.has){ etbH(doc,'Pensions'); etbLine(doc,'Documents kept',pn.docsLocation); etbLine(doc,'Notes',pn.docsNotes); arr(pn.list).forEach(function(p,i){ etbLine(doc,'Pension '+(i+1), [p.type,p.provider,p.policyNumber,(p.value?('£'+p.value):''),p.access].filter(Boolean).join(' · ')); }); }
      function assetSec(key,label,fields){ var s=state[key]||{}; var list=arr(s.list); if(!list.length) return; etbH(doc,label); list.forEach(function(it,i){ var parts=fields.map(function(f){ return it[f[1]]?(f[0]+': '+it[f[1]]):''; }).filter(Boolean); etbLine(doc,label.replace(/s$/,'')+' '+(i+1), parts.join(' · ')); }); }
      assetSec('insurance','Insurance policies',[['Type','type'],['Provider','provider'],['Policy','policyNumber'],['Docs','location']]);
      assetSec('bank_accounts','Bank accounts',[['Type','type'],['Bank','bankName'],['Number','accountNumber'],['Holder','holder'],['Stored','stored']]);
      assetSec('investments','Investments',[['Type','type'],['Provider','provider'],['Value','value'],['Ref','reference'],['Location','location']]);
      assetSec('business','Business interests',[['Name','name'],['Role','role'],['Contact','keyContact']]);
      assetSec('debts','Debts',[['Creditor','creditor'],['Type','creditorType'],['Balance','balance'],['Details','location']]);
      assetSec('digital_assets','Digital assets',[['Platform','platform'],['Access','access'],['Location','location']]);
      var w = state.wishes || {};
      if (String(w.record).toLowerCase()==='yes'){ etbH(doc,'Funeral wishes'); etbLine(doc,'Arrangements',w.arrangements); etbLine(doc,'Preferences',w.preferences); etbLine(doc,'Plan provider',w.planProvider); etbLine(doc,'Documents kept',w.docsLocation); }
      doc.end();
    } catch(e){ reject(e); }
  });
}

function buildLpaPdf(state, brand){
  state=state||{}; brand=brand||{};
  return new Promise(function(resolve,reject){
    try{
      var doc=new PDFDocument({size:'A4',margins:{top:60,bottom:64,left:60,right:60},bufferPages:true});
      var chunks=[]; doc.on('data',function(c){chunks.push(c);}); doc.on('end',function(){resolve(Buffer.concat(chunks));}); doc.on('error',reject);
      var company=brand.company_name||'AI Wills';
      var yd=state.your_details||{}, type=(state.lpa_type&&state.lpa_type.type)||'';
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#0B3D2E').text(company);
      doc.font('Helvetica').fontSize(12).fillColor('#555').text('Lasting Power of Attorney - application details');
      doc.moveDown(0.2); doc.font('Helvetica').fontSize(9).fillColor('#888').text('Generated '+new Date().toLocaleDateString('en-GB'));
      doc.moveDown(0.5); doc.font('Helvetica-Bold').fontSize(10).fillColor('#8a1f11').text('Important: this is a draft summary of your answers to help complete the official forms. It is not a registered LPA.');
      doc.font('Helvetica').fontSize(9).fillColor('#555').text('An LPA is only valid on the official Office of the Public Guardian forms LP1F (Property & Financial Affairs) and/or LP1H (Health & Welfare), signed by each person in the correct order, witnessed in person, then registered with the OPG (currently 92 pounds per LPA). Digital signatures and video witnessing are not accepted.');
      etbH(doc,'Donor (you)');
      etbLine(doc,'Name',[yd.firstName,yd.lastName].filter(Boolean).join(' '));
      etbLine(doc,'Date of birth',yd.dob); etbLine(doc,'Email',yd.email); etbLine(doc,'Phone',yd.phone);
      etbLine(doc,'Address',[yd.address,yd.city,yd.postcode].filter(Boolean).join(', '));
      etbH(doc,'LPA type'); etbLine(doc,'Type',type||'Not chosen');
      var at=arr(state.attorneys&&state.attorneys.list);
      if(at.length){ etbH(doc,'Attorneys'); at.forEach(function(a,i){ etbLine(doc,'Attorney '+(i+1),[[a.firstName,a.lastName].filter(Boolean).join(' '),a.relationship,a.address,a.phone,a.email].filter(Boolean).join(' - ')); if(String(a.hasReplacement).toLowerCase()==='yes'){ etbLine(doc,'  Replacement',[[a.repFirstName,a.repLastName].filter(Boolean).join(' '),a.repAddress].filter(Boolean).join(' - ')); } }); }
      var dec=state.decisions||{}; etbH(doc,'How attorneys decide'); etbLine(doc,'Mode',dec.mode); etbLine(doc,'Joint decisions',dec.mixedDetail);
      var tr=state.treatment||{}; if(tr.lifeSustaining){ etbH(doc,'Life-sustaining treatment'); etbLine(doc,'Attorneys can decide',tr.lifeSustaining); }
      var pf=state.preferences||{}; if(String(pf.hasPreferences).toLowerCase()==='yes'||String(pf.hasInstructions).toLowerCase()==='yes'){ etbH(doc,'Preferences & instructions'); etbLine(doc,'Preferences',pf.preferences); etbLine(doc,'Instructions',pf.instructions); }
      var us=state.usage||{}; if(us.when){ etbH(doc,'When usable (Property & Financial)'); etbLine(doc,'When',us.when); }
      var nt=state.notify||{}; if(String(nt.has).toLowerCase()==='yes'){ etbH(doc,'People to notify'); arr(nt.list).forEach(function(p,i){ etbLine(doc,'Person '+(i+1),[[p.firstName,p.lastName].filter(Boolean).join(' '),p.contact].filter(Boolean).join(' - ')); }); }
      var pv=state.provider||{}; etbH(doc,'Certificate provider'); etbLine(doc,'Type',pv.kind); etbLine(doc,'Name',[pv.firstName,pv.lastName].filter(Boolean).join(' ')); etbLine(doc,'Address',pv.address); etbLine(doc,'Phone',pv.phone); etbLine(doc,'Occupation',pv.occupation);
      var rg=state.registration||{}; etbH(doc,'Registration'); etbLine(doc,'Registered by',rg.who);
      var ex=state.exemption||{}; etbLine(doc,'Fee reduction/exemption',ex.status);
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#0B3D2E').text('Signing & witnessing guide');
      doc.moveDown(0.3);
      var stps=['Print the official LP1F and/or LP1H form(s) from GOV.UK, completed with the details above.',
        'Sign in the correct order: (1) the donor signs the statement, (2) the certificate provider signs, (3) each attorney and any replacement signs. Each signature must be witnessed in person by someone aged 18 or over who is not an attorney.',
        'Signing out of order is the most common reason the OPG rejects an LPA - follow the order exactly.',
        'Send the completed, signed forms to the OPG to register, with the fee per LPA (or the LP120 reduced-fee form if eligible).',
        'The LPA can only be used once the OPG has registered it.'];
      stps.forEach(function(t,i){ doc.font('Helvetica-Bold').fontSize(10).fillColor('#111').text((i+1)+'. ',{continued:true}).font('Helvetica').text(t); doc.moveDown(0.2); });
      doc.moveDown(0.4); doc.font('Helvetica').fontSize(9).fillColor('#888').text('Declaration confirmed by: '+((state.declaration&&state.declaration.signature)||'-'));
      doc.end();
    }catch(e){ reject(e); }
  });
}

function dparts(iso){var m=/(\d{4})-(\d{2})-(\d{2})/.exec(iso||"");return m?{d:m[3],mo:m[2],y:m[1]}:{d:"",mo:"",y:""};}
function ukPost(s){if(!s)return"";var m=/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\s*$/i.exec(String(s).trim());return m?m[1].toUpperCase().replace(/\s+/," "):"";}
function stripPost(s,pc){if(!s)return s;s=String(s);if(pc){s=s.replace(new RegExp(pc.replace(/\s/g,"\\s*")+"\\s*$","i"),"");}return s.replace(/[,\s]+$/,"");}
function ukPost(s){if(!s)return"";var m=/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\s*$/i.exec(String(s).trim());return m?m[1].toUpperCase().replace(/\s+/," "):"";}
function stripPost(s,pc){if(!s)return s;s=String(s);if(pc){s=s.replace(new RegExp(pc.replace(/\s/g,"\\s*")+"\\s*$","i"),"");}return s.replace(/[,\s]+$/,"");}
function addrParts(p){p=p||{};var pc=String(p.postcode||"").trim();var l1=String(p.address||"");var l2=String(p.city||"");if(!pc){pc=ukPost(l1);if(pc)l1=stripPost(l1,pc);}return {l1:l1,l2:l2,pc:pc};}
function fullName(p){p=p||{};return [p.title,p.firstName,p.lastName].filter(function(x){return x&&String(x).trim();}).join(" ");}
function dparts(iso){var m=/(\d{4})-(\d{2})-(\d{2})/.exec(iso||"");return m?{d:m[3],mo:m[2],y:m[1]}:{d:"",mo:"",y:""};}
function ukPost(s){if(!s)return"";var m=/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\s*$/i.exec(String(s).trim());return m?m[1].toUpperCase().replace(/\s+/," "):"";}
function stripPost(s,pc){if(!s)return s;s=String(s);if(pc){s=s.replace(new RegExp(pc.replace(/\s/g,"\\s*")+"\\s*$","i"),"");}return s.replace(/[,\s]+$/,"");}
function addrParts(p){p=p||{};var pc=String(p.postcode||"").trim();var l1=String(p.address||"");var l2=String(p.city||"");if(!pc){pc=ukPost(l1);if(pc)l1=stripPost(l1,pc);}return {l1:l1,l2:l2,pc:pc};}
function fullName(p){p=p||{};return [p.title,p.firstName,p.lastName].filter(function(x){return x&&String(x).trim();}).join(" ");}
function dparts(iso){var m=/(\d{4})-(\d{2})-(\d{2})/.exec(iso||"");return m?{d:m[3],mo:m[2],y:m[1]}:{d:"",mo:"",y:""};}
async function fillLpaForm(PL, bytes, state, ftype){
  var pdf=await PL.PDFDocument.load(bytes); var ctx=pdf.context; var form=pdf.getForm();
  var set=function(n,v){try{if(v!=null&&String(v).trim()!=='')form.getTextField(n).setText(String(v));}catch(e){}};
  var check=function(n){try{form.getCheckBox(n).check();}catch(e){}};
  var setAddr=function(la,lb,pcf,p){var ap=addrParts(p);set(la,ap.l1);set(lb,ap.l2);set(pcf,ap.pc);};
  var atts=(state.attorneys&&state.attorneys.list)||[];
  // ---- Donor (p03) ----
  var yd=state.your_details||{}, db=dparts(yd.dob);
  set('Title',yd.title);set('First names',yd.firstName);set('Last name',yd.lastName);
  set('Day',db.d);set('Month',db.mo);set('Year',db.y);
  set('Address 1a',addrParts(yd).l1);set('Address 1b',addrParts(yd).l2);set('Postcode',addrParts(yd).pc);
  set('Email address optional',yd.email);
  // ---- Attorneys (p04-05) ----
  var A=[
    {t:'_2',d:'_3',a:'Address 1_2',b:'Address 1_2b',pc:'undefined_2'},
    {t:'_3',d:'_4',a:'Address 1_3',b:'Address 1_3b',pc:'undefined_3'},
    {t:'_4',d:'_5',a:'Address 1_4a',b:'Address 1_4b',pc:'undefined_4'},
    {t:'_5',d:'_6',a:'Address 1_5a',b:'Address 1_5b',pc:'undefined_5'}
  ];
  atts.slice(0,4).forEach(function(a,i){var s=A[i];var d=dparts(a.dob);
    set('Title'+s.t,a.title);set('First names'+s.t,a.firstName);set('Last name'+s.t,a.lastName);
    set('Day'+s.d,d.d);set('Month'+s.d,d.mo);set('Year'+s.d,d.y);
    setAddr(s.a,s.b,s.pc,a);set('Email address optional'+s.t,a.email);
  });
  if(atts[0]&&String(atts[0].isTrustCorp).toLowerCase()==='yes') check('This attorney is a trust corporation');
  // ---- Replacement attorneys (p07) ----
  var reps=[];atts.forEach(function(a){if(String(a.hasReplacement).toLowerCase()==='yes'&&(a.repFirstName||a.repLastName))reps.push({title:a.repTitle,firstName:a.repFirstName,lastName:a.repLastName,address:a.repAddress,city:a.repCity,postcode:a.repPostcode,dob:a.repDob});});
  var R=[{t:'_6',d:'_7',a:'Address 1_6a',b:'Address 1_6b',pc:'undefined_6'},{t:'_7',d:'_8',a:'Address 1_7a',b:'Address 1_7b',pc:'undefined_7'}];
  reps.slice(0,2).forEach(function(r,i){var s=R[i];var d=dparts(r.dob);
    set('Title'+s.t,r.title);set('First names'+s.t,r.firstName);set('Last name'+s.t,r.lastName);
    set('Day'+s.d,d.d);set('Month'+s.d,d.mo);set('Year'+s.d,d.y);
    setAddr(s.a,s.b,s.pc,r);
  });
  // ---- Preferences / Instructions (p10) + continuation ----
  var pf=state.preferences||{};
  var prefTxt=(String(pf.hasPreferences).toLowerCase()==='yes')?String(pf.preferences||''):'';
  var instrTxt=(String(pf.hasInstructions).toLowerCase()==='yes')?String(pf.instructions||''):'';
  var LIM=210;
  if(prefTxt){ set('Preferences  use words like prefer and would like', prefTxt.length>LIM?(prefTxt.slice(0,LIM-24).replace(/\s+\S*$/,'')+'  (continued on sheet 2)'):prefTxt); if(prefTxt.length>LIM) check('I need more space  use Continuation sheet 2'); }
  if(instrTxt){ set('Instructions  use words like must and have to', instrTxt.length>LIM?(instrTxt.slice(0,LIM-24).replace(/\s+\S*$/,'')+'  (continued on sheet 2)'):instrTxt); if(instrTxt.length>LIM) check('I need more space  use Continuation sheet 2_2'); }
  // ---- People to notify (p09) ----
  var N=[{t:'_8',a:'Address 1_8a',b:'Address 1_8b',pc:'undefined_8'},{t:'_9',a:'Address 1_9a',b:'Address 1_9b',pc:'undefined_9'},{t:'_10',a:'Address 1_10a',b:'Address 1_10b',pc:'undefined_10'},{t:'_11',a:'Address 1_11a',b:'Address 1_11b',pc:'undefined_11'}];
  var nl=(state.notify&&String(state.notify.has).toLowerCase()==='yes')?(state.notify.list||[]):[];
  nl.slice(0,4).forEach(function(p,i){var s=N[i];set('Title'+s.t,p.title);set('First names'+s.t,p.firstName);set('Last name'+s.t,p.lastName);
    // back-compat: old data stored a single 'contact' (address or email); use only if it is not an email
    var pp=p; if(!p.address && p.contact && String(p.contact).indexOf('@')<0) pp={address:p.contact,city:p.city,postcode:p.postcode};
    setAddr(s.a,s.b,s.pc,pp);
  });
  // ---- Certificate provider (p13) ----
  var pv=state.provider||{};set('Title_12',pv.title);set('First names_12',pv.firstName);set('Last name_12',pv.lastName);
  setAddr('Address 1_13a','Address 1_13b','undefined_15',pv);
  // ---- Reduced fee (p21) ----
  if(/^Yes/i.test((state.exemption&&state.exemption.status)||'')) check('I want to apply to pay a reduced fee');
  // ---- Page 2 overview (names to refer back) ----
  var pn=function(names,list,mk){ names.forEach(function(fld,i){ if(list[i]) set(fld, mk(list[i])); }); };
  pn(['Text4','Text4a','Text4b','Text4c'], atts.slice(0,4), fullName);
  pn(['Text6','Text6b','Text6c','Text6d'], reps.slice(0,4), fullName);
  pn(['Text7','Text7b','Text7c','Text7d'], nl.slice(0,4), fullName);
  // ---- generate text appearances for filled text fields ----
  try{form.updateFieldAppearances();}catch(e){}
  // ---- grouped tick controls via raw page-annotation walk (widget /AS), preserved by updateFieldAppearances:false on save ----
  var mode=(state.decisions&&state.decisions.mode)||'';
  var decV=atts.length<=1?'section 4':(/^Jointly and severally/i.test(mode)?'1':(/^Jointly \(all/i.test(mode)?'2':(/some/i.test(mode)?'3':null)));
  var targets={};
  if(decV)targets['Jointly and severally']=decV;
  if(ftype==='F'){var when=(state.usage&&state.usage.when)||'';if(/registered/i.test(when))targets['As soon as my LPA has been registered']='On';else if(/capacity/i.test(when))targets['As soon as my LPA has been registered']='off';}
  targets['receive the lpa']='1';targets['receive lpa']='1';
  var T=PL.PDFName.of('T'),AS=PL.PDFName.of('AS'),AP=PL.PDFName.of('AP'),Nn=PL.PDFName.of('N'),P=PL.PDFName.of('Parent');
  var txt=function(o){if(!o)return null;o=o.decodeText?o:ctx.lookup(o);return o&&o.decodeText?o.decodeText():null;};
  var fname=function(w){var cur=w,parts=[],g=0;while(cur&&g++<6){var t=txt(cur.get(T));if(t)parts.unshift(t);var pr=cur.get(P);cur=pr?ctx.lookup(pr,PL.PDFDict):null;}return parts.join('.');};
  var onKey=function(w){try{var n=ctx.lookup(w.get(AP),PL.PDFDict);var nn=ctx.lookup(n.get(Nn),PL.PDFDict);return nn.keys().map(function(x){return x.asString();}).find(function(x){return x!=='/Off';});}catch(e){return null;}};
  pdf.getPages().forEach(function(pg){var an=pg.node.Annots&&pg.node.Annots();if(!an)return;for(var i=0;i<an.size();i++){var w=ctx.lookup(an.get(i),PL.PDFDict);if(!w||!w.get)continue;var nm=fname(w);if(!(nm in targets))continue;var want=PL.PDFName.of(targets[nm]).asString();if(onKey(w)===want)w.set(AS,PL.PDFName.of(targets[nm]));else w.set(AS,PL.PDFName.of('Off'));}});
  // (Long preferences/instructions overflow is carried on the official LPC Continuation sheet 2,
  //  generated separately by buildLpaContinuation and appended as its own document.)
  try{form.acroForm.dict.set(PL.PDFName.of('NeedAppearances'),PL.PDFBool.True);}catch(e){}
  return Buffer.from(await pdf.save({updateFieldAppearances:false}));
}
// Fill the official OPG forms from the captured LPA state. Returns [{field,fname,bytes}] (signing guide + LP1F/LP1H).
// Throws if pdf-lib or the blank forms are missing so the caller can fall back to the pdfkit summary pack.
async function buildLpaContinuation(PL, lpcBytes, state){
  var pf=state.preferences||{};
  var prefTxt=(String(pf.hasPreferences).toLowerCase()==='yes')?String(pf.preferences||''):'';
  var instrTxt=(String(pf.hasInstructions).toLowerCase()==='yes')?String(pf.instructions||''):'';
  var LIM=210; var needP=prefTxt.length>LIM, needI=instrTxt.length>LIM;
  if(!needP&&!needI) return null;
  var lpc=await PL.PDFDocument.load(lpcBytes); var form=lpc.getForm(); var ctx=lpc.context;
  var donor=fullName(state.your_details||{});
  var set=function(n,v){try{if(v!=null&&String(v).trim()!=='')form.getTextField(n).setText(String(v));}catch(e){}};
  var pages=[]; var cbTargets={};
  if(needP){ set('Instructions LPA section 7', prefTxt); set('Full name_3', donor); cbTargets['Decisions attorneys should make jointly LPA section 3']='3'; pages.push(4); }
  if(needI){
    if(needP){ set('Instructions LPA section 7_2', instrTxt); set('Full name_4', donor); cbTargets['Decisions attorneys should make jointly LPA section 3_2']='4'; pages.push(5); }
    else { set('Instructions LPA section 7', instrTxt); set('Full name_3', donor); cbTargets['Decisions attorneys should make jointly LPA section 3']='4'; pages.push(4); }
  }
  try{form.updateFieldAppearances();}catch(e){}
  var T=PL.PDFName.of('T'),AS=PL.PDFName.of('AS'),AP=PL.PDFName.of('AP'),Nn=PL.PDFName.of('N'),P=PL.PDFName.of('Parent');
  var txt=function(o){if(!o)return null;o=o.decodeText?o:ctx.lookup(o);return o&&o.decodeText?o.decodeText():null;};
  var fnm=function(w){var cur=w,parts=[],g=0;while(cur&&g++<6){var t=txt(cur.get(T));if(t)parts.unshift(t);var pr=cur.get(P);cur=pr?ctx.lookup(pr,PL.PDFDict):null;}return parts.join('.');};
  var onKey=function(w){try{var n=ctx.lookup(w.get(AP),PL.PDFDict);var nn=ctx.lookup(n.get(Nn),PL.PDFDict);return nn.keys().map(function(x){return x.asString();}).find(function(x){return x!=='/Off';});}catch(e){return null;}};
  lpc.getPages().forEach(function(pg){var an=pg.node.Annots&&pg.node.Annots();if(!an)return;for(var i=0;i<an.size();i++){var w=ctx.lookup(an.get(i),PL.PDFDict);if(!w||!w.get)continue;var nm=fnm(w);if(!(nm in cbTargets))continue;var want=PL.PDFName.of(cbTargets[nm]).asString();if(onKey(w)===want)w.set(AS,PL.PDFName.of(cbTargets[nm]));else w.set(AS,PL.PDFName.of('Off'));}});
  var out=await PL.PDFDocument.create();
  var copied=await out.copyPages(lpc, pages);
  copied.forEach(function(pg){ out.addPage(pg); });
  return Buffer.from(await out.save());
}
async function buildLpaOfficial(state, brand){
  var PL=require('pdf-lib'); var fsx=require('fs'), pathx=require('path');
  var dir=pathx.join(__dirname,'public','forms');
  var readBlank=function(names){ for(var i=0;i<names.length;i++){ var p=pathx.join(dir,names[i]); try{ if(fsx.existsSync(p)) return fsx.readFileSync(p); }catch(e){} } throw new Error('blank form not found: '+names.join(' / ')); };
  var out=[];
  try { var g=await buildLpaPdf(state, brand); out.push({field:'LPA Guide PDF', fname:'lpa-signing-guide.pdf', bytes:g}); } catch(e){}
  var type=(state.lpa_type&&state.lpa_type.type)||'';
  if(/Property|Both/i.test(type)) out.push({field:'LPA LP1F PDF', fname:'LP1F-property-financial.pdf', bytes: await fillLpaForm(PL, readBlank(['LP1F.pdf','LP1F-Create-and-register-your-lasting-power-of-attorney.pdf']), state, 'F')});
  if(/Health|Both/i.test(type)) out.push({field:'LPA LP1H PDF', fname:'LP1H-health-welfare.pdf', bytes: await fillLpaForm(PL, readBlank(['LP1H.pdf','LP1H-Create-and-register-your-lasting-power-of-attorney.pdf']), state, 'H')});
  try{ var _cont=await buildLpaContinuation(PL, readBlank(['LPC.pdf','LPC-Continuation-sheets.pdf']), state); if(_cont) out.push({field:'LPA Continuation PDF', fname:'lpa-continuation-sheet2.pdf', bytes:_cont}); }catch(e){}
  if(out.length<2) throw new Error('LPA official forms not generated (type='+type+')');
  return out;
}
module.exports = { buildWillPdf: buildWillPdf, normalizeWill: normalizeWill, buildEtbPdf: buildEtbPdf, buildLpaPdf: buildLpaPdf, buildLpaOfficial: buildLpaOfficial };
