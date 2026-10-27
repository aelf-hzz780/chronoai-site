import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/';
const out='docs/evidence';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const rawManifest=await fs.readFile('_preview/publication.json');const publication=JSON.parse(rawManifest);
const evidence={base,contentRevision:publication.revision,bundleManifestSHA256:createHash('sha256').update(rawManifest).digest('hex'),responsive:[],errors:[],externalRequests:[],failedRequests:[]};
try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage();
 const prototype=await context.newPage();
 await prototype.goto(pathToFileURL(path.resolve(process.env.APPROVED_PROTOTYPE||'../design-review/refined.html')).href+'?lang=en');
 const geometry=()=>Object.fromEntries(['header','.s1','.s1in','.s1text','.bigslogan'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{x:r.x,y:r.y,width:r.width,height:r.height}];}));
 evidence.prototypeGeometry=[];
 page.on('pageerror',err=>evidence.errors.push(err.message));
 page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))evidence.externalRequests.push(request.url());});
 page.on('response',response=>{if(response.status()>=400)evidence.failedRequests.push({url:response.url(),status:response.status()});});
 for(const width of [375,700,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  for(const lang of ['en','zh']) {
   await page.goto(base+(lang==='zh'?'zh/':''));await page.evaluate(()=>document.fonts.ready);
   const measurement=await page.evaluate(()=>({lang:document.documentElement.lang,mode:document.compatMode,overflow:document.documentElement.scrollWidth>innerWidth,hero:document.querySelector('.s1').getBoundingClientRect().toJSON(),h1:document.querySelector('.s1 h1').getBoundingClientRect().toJSON(),tagline:[...document.querySelectorAll('.nyx-tagline span')].map(n=>n.textContent),description:document.querySelector('.bx-nyx .bxd').textContent,logo:document.querySelector('.nyx-white-wordmark').naturalWidth}));
   assert.equal(measurement.overflow,false,`${lang}/${width} overflows`);assert.equal(measurement.mode,'CSS1Compat');
   assert.equal(measurement.lang,lang==='zh'?'zh-CN':'en');assert(measurement.logo>0);
   assert.deepEqual(measurement.tagline,lang==='zh'?['AI，','超越聊天。']:['AI that does','more than chat.']);
   await page.locator('#projects').evaluate(el=>el.scrollIntoView({block:'start'}));
   if(width===375||width===1440)await page.screenshot({path:`${out}/${lang}-${width}-projects.png`});
   evidence.responsive.push({width,...measurement});
   if(lang==='en'){await prototype.setViewportSize({width,height:900});await prototype.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));const expected=await prototype.evaluate(geometry),actual=await page.evaluate(geometry);for(const selector of Object.keys(expected))for(const field of ['x','y','width','height'])assert(Math.abs(expected[selector][field]-actual[selector][field])<1.5,`${width} ${selector}.${field}: ${expected[selector][field]} vs ${actual[selector][field]}`);evidence.prototypeGeometry.push({width,expected,actual});}
   await page.goto(base+(lang==='zh'?'zh/':''));
   if(width===375||width===1440)await page.screenshot({path:`${out}/${lang}-${width}-hero.png`});
  }
 }
 for(const item of publication.pages.filter(p=>p.id!=='home'))for(const width of [375,1440]){await page.setViewportSize({width,height:900});await page.goto(base+item.path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${item.path}/${width} overflow`);}
 evidence.allArticlesResponsive=true;
 await page.setViewportSize({width:375,height:812});await page.goto(base+'zh/');
 await page.locator('.burger').click();assert.equal(await page.locator('.burger').getAttribute('aria-label'),'关闭菜单');
 assert(await page.locator('.drawer').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
 // Locale enhancement preserves the current reading section and real query/hash.
 await page.goto(base+'zh/#projects');
 await page.locator('footer a[data-locale="en"]').click();assert.match(page.url(),/index\.html#projects$/);
 await page.goto(base+'?sample=1&sample=2#method');
 await page.locator('footer a[data-locale="zh"]').click();assert.match(page.url(),/zh\/index\.html\?sample=1&sample=2#method$/);
 assert.equal(await page.locator('.bx-nyx a,.bx-nyx button').count(),0);
 assert.equal(await page.locator('.project-summary,.role-map,.flagship-entry').count(),0);
 await page.goto(base+'philosophy.html#an-observation');
 await page.locator('.article-nav a[data-locale="zh"]').click();
 await page.waitForURL('**/zh/philosophy.html*');
 assert.equal(decodeURIComponent(new URL(page.url()).hash),'#一个观察');
 assert(await page.locator('#一个观察').isVisible());evidence.articleLocaleAnchor=true;
 await page.goto(base+'nyxid-zh.html?legacy=1#工作原理');
 await page.waitForURL('**/zh/nyxid.html*');assert.equal(decodeURIComponent(new URL(page.url()).hash),'#工作原理');assert.equal(new URL(page.url()).search,'?legacy=1');evidence.legacyAnchor=true;
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
 for(const lang of ['en','zh']) {
  const p=await nojs.newPage();await p.goto(base+(lang==='zh'?'zh/':''));
  assert(await p.locator('.bx-nyx .bxd').isVisible());assert(await p.locator('.nyx-tagline').isVisible());
  assert(await p.locator('footer a[data-locale]').first().getAttribute('href'));
  await p.locator('footer a[data-locale="'+(lang==='en'?'zh':'en')+'"]').click();
  assert.equal(await p.locator('html').getAttribute('lang'),lang==='en'?'zh-CN':'en');
  await p.close();
 }
 for(const item of publication.pages.filter(p=>p.id!=='home')){const a=await nojs.newPage();await a.goto(base+item.path);assert(await a.locator('main').isVisible());assert((await a.locator('main').innerText()).length>100);assert.equal(await a.locator('html').getAttribute('lang'),item.lang);await a.close();}
 await nojs.close();evidence.noJsBilingual=true;evidence.allArticlesNoJs=true;
 // Normal-motion WebGL CTA follows pointer, settles, and releases offscreen/reduced motion.
 const motion=await browser.newContext({viewport:{width:1440,height:900}});const p=await motion.newPage();
 p.on('pageerror',error=>evidence.errors.push(error.message));
 p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))evidence.externalRequests.push(r.url());});
 p.on('response',r=>{if(r.status()>=400)evidence.failedRequests.push({url:r.url(),status:r.status()});});
 await p.goto(base);await p.locator('.asciiMark').waitFor();await p.waitForTimeout(1400);
 evidence.heroCanvas=await p.locator('.asciiMark').evaluate(c=>({width:c.width,height:c.height}));assert(evidence.heroCanvas.width>0);
 await p.screenshot({path:`${out}/en-1440-motion-hero.png`});
 await p.locator('.bx-nyx .bxgo').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('.bxgo').dataset.lightState==='active');
 const cta=p.locator('.bx-nyx .bxgo');const box=await cta.boundingBox();await p.mouse.move(box.x+box.width*.7,box.y+box.height/2);await p.waitForTimeout(2000);
 const first=await p.locator('.nyx-cta-light').getAttribute('data-draw-count');await p.waitForTimeout(300);
 assert.equal(await p.locator('.nyx-cta-light').getAttribute('data-draw-count'),first);evidence.ctaSettles=true;
 await p.screenshot({path:`${out}/en-1440-motion-projects.png`});
 await p.evaluate(()=>scrollTo(0,0));await p.waitForFunction(()=>!document.querySelector('.nyx-cta-light'));evidence.ctaOffscreenCleanup=true;
 await p.locator('.bx-nyx .bxgo').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.nyx-cta-light'));
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('.nyx-cta-light'));evidence.ctaReducedMotionCleanup=true;
 // Keyboard focus must light the sole native card link.
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.locator('.bx-nyx').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
 await p.waitForFunction(()=>Number(document.querySelector('.nyx-cta-light')?.dataset.lightLevel)>.9);evidence.ctaKeyboardFocus=true;
 // Visibility event simulation is explicitly labelled; it is not a real OS background test.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await p.waitForFunction(()=>!document.querySelector('.nyx-cta-light'));evidence.simulatedBackgroundCleanup=true;
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await p.waitForFunction(()=>document.querySelector('.nyx-cta-light'));
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
 await p.waitForFunction(()=>!document.querySelector('.nyx-cta-light'));
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await p.waitForFunction(()=>document.querySelector('.nyx-cta-light'));evidence.simulatedPageTransitionRecovery=true;
 const loss=await browser.newContext({viewport:{width:1440,height:900}});const l=await loss.newPage();
 await l.goto(base);await l.locator('.bx-nyx .bxgo').scrollIntoViewIfNeeded();await l.waitForFunction(()=>document.querySelector('.nyx-cta-light'));
 await l.locator('.nyx-cta-light').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await l.waitForFunction(()=>document.querySelector('.bx-nyx .bxgo').dataset.lightState==='lost');
 await Promise.all([l.waitForURL('**/nyxid.html'),l.locator('.bx-nyx').click()]);evidence.actualWebglContextLossLink=true;await loss.close();
 await motion.close();
 const fallback=await browser.newContext();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 const f=await fallback.newPage();await f.goto(base);await f.locator('.bx-nyx').scrollIntoViewIfNeeded();await f.locator('.bx-nyx').click();assert.match(f.url(),/nyxid\.html$/);evidence.webglFallbackLink=true;await fallback.close();
 const touch=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const t=await touch.newPage();await t.goto(base+'zh/');await Promise.all([t.waitForURL('**/zh/nyxid.html'),t.locator('.bx-nyx').tap()]);assert.match(t.url(),/zh\/nyxid\.html$/);evidence.firstTouchNavigation=true;await touch.close();
 // Regression: delayed scene initialization must obey the latest motion setting.
 for(const resumeBeforeResolve of [false,true]) {
  const race=await browser.newContext({viewport:{width:1440,height:900}});
  let release,seen;const gate=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>seen=resolve);
  await race.route('**/assets/us-scene.json',async route=>{seen();await gate;await route.continue();});
  const r=await race.newPage();r.on('pageerror',error=>evidence.errors.push(error.message));await r.goto(base);await requested;
  await r.emulateMedia({reducedMotion:'reduce'});
  if(resumeBeforeResolve)await r.emulateMedia({reducedMotion:'no-preference'});
  release();
  await r.waitForFunction(expected=>window.UnicornStudio.scenes.length===expected&&(expected===1||!document.querySelector('.usScene').hasAttribute('data-us-initialized')), resumeBeforeResolve?1:0);
  await r.waitForTimeout(200);
  assert.equal(await r.locator('.usScene canvas').count(),resumeBeforeResolve?1:0);
  await race.close();
 }
 evidence.delayedSceneLifecycle=true;
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failedRequests,[]);assert.deepEqual(evidence.externalRequests,[]);
 evidence.status='pass';
} finally {await fs.writeFile(`${out}/browser.json`,JSON.stringify(evidence,null,2));await browser.close();}
console.log('PASS: bilingual widths, native locale links, mobile menu, no-JS, motion, CTA idle/cleanup/fallback and first touch; no external requests');
