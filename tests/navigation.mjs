import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/';
const out=process.env.NAV_EVIDENCE_DIR||'docs/evidence/navigation';
await fs.mkdir(out,{recursive:true});
const manifestBytes=await fs.readFile('_preview/publication.json');
const manifest=JSON.parse(manifestBytes);
const evidence={base,sourceCommit:manifest.sourceCommit,contentRevision:manifest.revision,manifestSHA256:createHash('sha256').update(manifestBytes).digest('hex'),checks:[],errors:[]};
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
 for(const width of [320,375,767,768,1023,1024,1100,1440])for(const lang of ['en','zh']) {
  await page.setViewportSize({width,height:900});
  await page.goto(base+(lang==='zh'?'zh/':''));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.language-switch').count(),3);
  for(const scope of ['header','#drawer','footer']) {
   assert.equal(await page.locator(`${scope} .language-switch a`).count(),2);
   assert.equal(await page.locator(`${scope} .language-switch a[aria-current="page"]`).count(),1);
   assert.equal(await page.locator(`${scope} .language-switch a[aria-current="page"]`).getAttribute('data-locale'),lang);
   const style=await page.locator(`${scope} .language-switch a[aria-current="page"]`).evaluate(el=>({color:getComputedStyle(el).color,decoration:getComputedStyle(el).textDecorationLine}));
   assert.equal(style.color,'rgb(255, 255, 255)');assert(style.decoration.includes('underline'));
   for(const locale of ['en','zh'])assert.match(await page.locator(`${scope} a[data-locale="${locale}"]`).getAttribute('href'),/index\.html$/);
  }
  const desktop=width>=1024;
  assert.equal(await page.locator('header .language-switch').isVisible(),desktop);
  assert.equal(await page.locator('.burger').isVisible(),!desktop);
  if(!desktop) {
   assert.equal(await page.locator('#drawer').isVisible(),false);
   await page.locator('.burger').click();assert.equal(await page.locator('#drawer').evaluate(el=>el.inert),false);
   assert(await page.locator('#drawer .language-switch').isVisible());
   assert.equal(await page.locator('#drawer').evaluate(el=>el.firstElementChild.classList.contains('language-switch')),true);
  }
  const selector=desktop?'header .language-switch':'#drawer .language-switch';
  const target=page.locator(`${selector} a[data-locale="${lang==='en'?'zh':'en'}"]`);
  await target.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  assert(await target.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')));
  const measurements=await page.evaluate(selector=>{
   const rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const header=document.querySelector('header'),nav=header.querySelector('nav'),left=nav.querySelector('.navl'),right=nav.querySelector('.navr');
   return{overflow:document.documentElement.scrollWidth>innerWidth,nav:rect(nav),left:rect(left),right:rect(right),cta:rect(nav.querySelector('.try')),switch:rect(document.querySelector(selector)),links:[...document.querySelectorAll(selector+' a')].map(rect)};
  },selector);
  assert.equal(measurements.overflow,false,`${lang}/${width} overflow`);
  assert(measurements.left.right<=measurements.right.x,`${lang}/${width} nav overlap`);
  assert(measurements.right.right<=width-12,`${lang}/${width} nav clipped`);
  for(const link of measurements.links){assert(link.width>=44&&link.height>=44);assert(link.x>=0&&link.right<=width);}
  if(desktop) {
   assert(measurements.switch.right<=measurements.cta.x);
   assert(measurements.cta.x-measurements.switch.right<=16);
  }
  if(width===1024&&lang==='en')await page.screenshot({path:`${out}/en-1024-keyboard.png`});
  await target.evaluate(el=>el.blur());
  if([320,375,768,1024,1440].includes(width))await page.screenshot({path:`${out}/${lang}-${width}-${desktop?'header':'menu'}.png`});
  if(!desktop){await page.keyboard.press('Escape');assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#drawer').evaluate(el=>el.inert),true);}
  evidence.checks.push({width,lang,desktop,...measurements});
 }
 // Actual language navigation from each added entrance preserves duplicate query keys and hash.
 for(const [width,scope] of [[1440,'header'],[375,'#drawer']]) {
  await page.setViewportSize({width,height:900});
  for(const lang of ['en','zh']) {
   await page.goto(base+(lang==='zh'?'zh/':'')+'?sample=1&sample=2#projects');
   if(scope==='#drawer')await page.locator('.burger').click();
   const next=lang==='en'?'zh':'en';
   await page.locator(`${scope} a[data-locale="${next}"]`).click();
   await page.waitForURL(url=>url.pathname.endsWith(next==='zh'?'/zh/index.html':'/chronoai-site/index.html'));
   assert.equal(await page.locator('html').getAttribute('lang'),next==='zh'?'zh-CN':'en');
   assert.equal(new URL(page.url()).search,'?sample=1&sample=2');assert.equal(new URL(page.url()).hash,'#projects');
   assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
  }
 }
 // Resizing an open mobile menu to desktop closes it and releases scroll lock.
 await page.setViewportSize({width:768,height:900});await page.goto(base);await page.locator('.burger').click();
 await page.setViewportSize({width:1024,height:900});
 await page.waitForFunction(()=>document.querySelector('.burger').getAttribute('aria-expanded')==='false');
 assert.equal(await page.locator('body').evaluate(el=>el.style.overflow),'');
 assert(await page.locator('header .language-switch').isVisible());
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}});
 for(const lang of ['en','zh']){
  const p=await nojs.newPage();await p.goto(base+(lang==='zh'?'zh/':''));const next=lang==='en'?'zh':'en';
  await p.locator(`header a[data-locale="${next}"]`).click();assert.equal(await p.locator('html').getAttribute('lang'),next==='zh'?'zh-CN':'en');await p.close();
 }
 await nojs.close();
 assert.deepEqual(evidence.errors,[]);evidence.nativeDesktopLinksWithoutJs=true;evidence.queryHashPreserved=true;evidence.menuResizeCleanup=true;evidence.status='pass';
} finally {await fs.writeFile(`${out}/navigation.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log('PASS: bilingual header/drawer/footer language entrances, 16 viewport cases, keyboard targets, query/hash, no-JS and menu lifecycle');
