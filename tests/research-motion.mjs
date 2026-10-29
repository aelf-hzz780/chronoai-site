import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/',out=process.env.SUBPAGE_EVIDENCE_DIR||'docs/evidence/five-pages';
await fs.mkdir(out,{recursive:true});const bytes=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(bytes);
const evidence={sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(bytes).digest('hex'),scope:'Real canvas/pipeline controls; visibility and pagehide/pageshow events are explicitly simulated',checks:[],errors:[]};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,375])for(const language of ['en','zh-CN']){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  const item=manifest.pages.find(p=>p.id==='research'&&p.lang===language);await page.goto(base+item.path);
  await page.waitForFunction(()=>Number(document.querySelector('.rx-canvas').dataset.frames)>2);
  const pixels=await page.locator('.rx-canvas').evaluate(cv=>{const raw=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let alpha=0;for(let i=3;i<raw.length;i+=4)if(raw[i])alpha++;return alpha;});assert(pixels>100);
  const cost=await page.evaluate(()=>new Promise(resolve=>{const samples=[];function sample(){samples.push(Number(document.querySelector('.rx-canvas').dataset.drawMs));if(samples.length===40)resolve(samples);else requestAnimationFrame(sample);}requestAnimationFrame(sample);}));
  const button=page.locator('.rx-pause');await button.click();assert.equal(await button.innerText(),language==='en'?'Resume animation':'继续动效');
  const paused=await page.locator('.rx-canvas').getAttribute('data-frames');await page.waitForTimeout(180);assert.equal(await page.locator('.rx-canvas').getAttribute('data-frames'),paused);
  await button.click();await page.waitForFunction(previous=>Number(document.querySelector('.rx-canvas').dataset.frames)>Number(previous),paused);
  await page.locator('.pipe').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.pipe').dataset.animation==='playing');assert(await page.locator('.pipe .pp.on').count()>0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.pipe').getAttribute('data-animation'),'paused');assert.equal(await page.locator('.pipe').evaluate(el=>getComputedStyle(el,'::after').animationPlayState),'paused');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>document.querySelector('.pipe').dataset.animation==='playing');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.pipe').dataset.animation==='paused');assert.equal(await page.locator('.pipe .pp.on').count(),5);assert.equal(await button.isVisible(),false);
  assert.equal(await page.locator('.pipe').evaluate(el=>getComputedStyle(el,'::after').animationPlayState),'paused');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.rx-canvas').dataset.animation==='playing');
  await page.waitForFunction(()=>document.querySelector('.pipe').dataset.animation==='paused');assert.equal(await page.locator('.pipe').evaluate(el=>getComputedStyle(el,'::after').animationPlayState),'paused');
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal(await page.locator('.rx-canvas').getAttribute('data-animation'),'paused');
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForFunction(()=>document.querySelector('.rx-canvas').dataset.animation==='playing');
  await page.screenshot({path:`${out}/research-motion-${language}-${width}.png`});
  evidence.checks.push({width,language,nontransparentPixels:pixels,drawMs:{samples:cost,mean:cost.reduce((a,b)=>a+b,0)/cost.length,max:Math.max(...cost)},pauseResume:true,pipeline:true,pipelineCssPause:{offscreen:true,simulatedHidden:true,reducedMotion:true},reducedMotion:true,simulatedPersistedTransition:true});await context.close();
 }
 const fallback=await browser.newContext({viewport:{width:375,height:900}}),page=await fallback.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='2d'?null:original.call(this,kind,...args);};});
 await page.goto(base+'zh/research.html');assert((await page.locator('main').innerText()).length>100);assert.equal(await page.locator('.rx-pause').isVisible(),false);await fallback.close();evidence.simulatedCanvasUnavailableRetainsContent=true;
 assert.deepEqual(evidence.errors,[]);evidence.status='pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/research-motion.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
