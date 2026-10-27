import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/';
const out=process.env.NAV_EVIDENCE_DIR||'docs/evidence/navigation-segmented';
await fs.mkdir(out,{recursive:true});
const manifestBytes=await fs.readFile('_preview/publication.json');
const manifest=JSON.parse(manifestBytes);
const evidence={base,sourceCommit:manifest.sourceCommit,contentRevision:manifest.revision,manifestSHA256:createHash('sha256').update(manifestBytes).digest('hex'),variant:'compact-segmented-header',checks:[],errors:[]};
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
 for(const width of [320,359,360,375,768,1023,1024,1440])for(const lang of ['en','zh']) {
  await page.setViewportSize({width,height:900});
  await page.goto(base+(lang==='zh'?'zh/':''));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.language-switch').count(),2);
  assert.equal(await page.locator('#drawer a[data-locale]').count(),0);
  for(const scope of ['header','footer']) {
   assert.equal(await page.locator(`${scope} .language-switch a`).count(),2);
   assert.equal(await page.locator(`${scope} .language-switch a[aria-current="page"]`).count(),1);
   assert.equal(await page.locator(`${scope} .language-switch a[aria-current="page"]`).getAttribute('data-locale'),lang);
   for(const locale of ['en','zh']){
    const link=page.locator(`${scope} a[data-locale="${locale}"]`);
    assert.match(await link.getAttribute('href'),/index\.html$/);
    assert.equal(await link.getAttribute('hreflang'),locale==='en'?'en':'zh-CN');
   }
  }
  const desktop=width>=1024,next=lang==='en'?'zh':'en';
  const control=page.locator('header .language-switch');
  assert(await control.isVisible());
  assert.deepEqual(await control.locator('a').allTextContents(),['EN','中文']);
  assert.equal(await control.locator('span').count(),0);
  assert.equal(await page.locator('.burger').isVisible(),!desktop);
  assert.equal(await control.locator('a[aria-current]').isVisible(),desktop);
  assert.equal(await control.locator('a:visible').count(),desktop?2:1);
  const target=control.locator(`a[data-locale="${next}"]`);
  await target.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  assert(await target.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')));
  const measurements=await page.evaluate(()=>{
   const rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const header=document.querySelector('header'),nav=header.querySelector('nav'),control=header.querySelector('.language-switch');
   const current=control.querySelector('[aria-current]'),inactive=control.querySelector('a:not([aria-current])');
   return{overflow:document.documentElement.scrollWidth>innerWidth,nav:rect(nav),left:rect(nav.querySelector('.navl')),right:rect(nav.querySelector('.navr')),cta:rect(nav.querySelector('.try')),burger:rect(nav.querySelector('.burger')),switch:rect(control),border:getComputedStyle(control).borderTopWidth,borderShadow:getComputedStyle(control).boxShadow,radius:getComputedStyle(control).borderTopLeftRadius,current:{background:getComputedStyle(current).backgroundColor,color:getComputedStyle(current).color,decoration:getComputedStyle(current).textDecorationLine},inactiveColor:getComputedStyle(inactive).color,links:[...control.querySelectorAll('a')].filter(el=>el.getClientRects().length).map(rect)};
  });
  assert.equal(measurements.overflow,false,`${lang}/${width} overflow`);
  assert(measurements.left.right<=measurements.right.x,`${lang}/${width} nav overlap`);
  assert(measurements.right.right<=width-12,`${lang}/${width} nav clipped`);
  assert.equal(measurements.switch.height,desktop?32:44);
  if(!desktop){assert(measurements.burger.width>=44&&measurements.burger.height>=44);assert(measurements.cta.right<=measurements.burger.x);}
  assert.equal(measurements.border,desktop?'1px':'0px');if(!desktop)assert(measurements.borderShadow.includes('1px'));assert.equal(measurements.radius,'8px');
  assert.equal(measurements.current.decoration,'none');
  assert.notEqual(measurements.current.background,'rgba(0, 0, 0, 0)');
  assert.notEqual(measurements.current.color,measurements.inactiveColor);
  for(const link of measurements.links){assert(link.width>=44&&link.height>=(desktop?30:44));assert(link.x>=0&&link.right<=width);}
  assert(measurements.switch.right<=measurements.cta.x);
  assert(measurements.cta.x-measurements.switch.right<=16);
  if(width===1440&&lang==='en')await page.locator('header').screenshot({path:`${out}/en-1440-keyboard-header.png`});
  await target.evaluate(el=>el.blur());
  await page.locator('header').screenshot({path:`${out}/${lang}-${width}-header.png`});
  if(!desktop){
   await page.locator('.burger').click();assert.equal(await page.locator('#drawer').evaluate(el=>el.inert),false);
   assert(await target.isVisible());
   // The target language must remain reachable inside the open menu's keyboard cycle.
   await page.locator('.burger').focus();await page.keyboard.press('Shift+Tab');
   assert(await page.locator('header .try').evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Shift+Tab');assert(await target.evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Shift+Tab');assert(await page.locator('header .clogo').evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Shift+Tab');assert(await page.locator('#drawer a').last().evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Tab');assert(await page.locator('header .clogo').evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Tab');assert(await target.evaluate(el=>el===document.activeElement));
   if(width===375)await page.screenshot({path:`${out}/${lang}-375-open-menu.png`});
   await page.keyboard.press('Escape');assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator('#drawer').evaluate(el=>el.inert),true);assert(await page.locator('.burger').evaluate(el=>el===document.activeElement));
  }
  evidence.checks.push({width,lang,desktop,...measurements});
 }
 // Use the keyboard to follow native links with query/hash, including from an open mobile menu.
 for(const width of [320,375,1024,1440])for(const lang of ['en','zh']) {
  await page.setViewportSize({width,height:900});
  await page.goto(base+(lang==='zh'?'zh/':'')+'?sample=1&sample=2#projects');
  if(width===375)await page.locator('.burger').click();
  const next=lang==='en'?'zh':'en';
  await page.locator(`header a[data-locale="${next}"]`).focus();
  await Promise.all([page.waitForURL(url=>url.pathname.endsWith(next==='zh'?'/zh/index.html':'/chronoai-site/index.html')),page.keyboard.press('Enter')]);
  assert.equal(await page.locator('html').getAttribute('lang'),next==='zh'?'zh-CN':'en');
  assert.equal(new URL(page.url()).search,'?sample=1&sample=2');assert.equal(new URL(page.url()).hash,'#projects');
  assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
 }
 // No explicit hash: retain the current reading section using the existing enhancement.
 await page.setViewportSize({width:375,height:900});await page.goto(base);
 await page.locator('#projects').evaluate(el=>el.scrollIntoView({block:'start'}));
 await page.locator('header a[data-locale="zh"]').click();
 await page.waitForURL('**/zh/index.html#projects');evidence.readingSectionPreserved=true;
 // Resize recovery and current-state visibility must agree on both sides of the breakpoint.
 await page.setViewportSize({width:768,height:900});await page.goto(base);await page.locator('.burger').click();
 await page.setViewportSize({width:1024,height:900});
 await page.waitForFunction(()=>document.querySelector('.burger').getAttribute('aria-expanded')==='false');
 assert.equal(await page.locator('body').evaluate(el=>el.style.overflow),'');
 assert.equal(await page.locator('header .language-switch a:visible').count(),2);
 await page.setViewportSize({width:1023,height:900});assert.equal(await page.locator('header .language-switch a:visible').count(),1);
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,reducedMotion:'reduce'});
 for(const width of [320,375,1440])for(const lang of ['en','zh']){
  const p=await nojs.newPage();await p.setViewportSize({width,height:900});await p.goto(base+(lang==='zh'?'zh/':''));const next=lang==='en'?'zh':'en';
  assert(await p.locator(`header a[data-locale="${next}"]`).isVisible());
  await p.locator(`header a[data-locale="${next}"]`).click();assert.equal(await p.locator('html').getAttribute('lang'),next==='zh'?'zh-CN':'en');await p.close();
 }
 await nojs.close();
 assert.deepEqual(evidence.errors,[]);evidence.nativeLinksWithoutJs={widths:[320,375,1440],languageCases:6};evidence.keyboardQueryHashCases=8;evidence.menuResizeCleanup=true;evidence.status='pass';
} finally {await fs.writeFile(`${out}/navigation.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log('PASS: compact segmented header, 16 viewport cases, keyboard/query/hash, mobile and desktop no-JS links, menu lifecycle');
