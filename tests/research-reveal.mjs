import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/';
const out='docs/evidence/research-reveal',reproduce=process.argv.includes('--reproduce');
await fs.mkdir(out,{recursive:true});
const raw=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(raw);
const evidence={scope:'Local research reveal; video API and frame simulated, no remote playback claim',sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(raw).digest('hex'),checks:[],errors:[]};
const browser=await chromium.launch({headless:true});
const snapshot=page=>page.evaluate(()=>Object.fromEntries(['h2','.lead5','#research-video'].map(selector=>{
 const el=document.querySelector(selector==='#research-video'?selector:'#cases '+selector),style=getComputedStyle(el),rect=el.getBoundingClientRect();
 return[selector,{opacity:Number(style.opacity),transform:style.transform,transition:style.transitionDuration,delay:style.transitionDelay,top:rect.top,bottom:rect.bottom,revealed:el.classList.contains('in')}];
})));
try{
 for(const width of [375,1440])for(const lang of ['en','zh']){
  const height=width===375?812:900,url=base+(lang==='zh'?'zh/':'');
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'}),page=await context.newPage();
  page.on('pageerror',error=>evidence.errors.push(error.message));
  await page.route('https://www.youtube-nocookie.com/embed/**',route=>route.fulfill({contentType:'text/html',body:'<button>Simulated native controls</button>'}));
  await page.route('https://www.youtube.com/iframe_api',route=>route.fulfill({contentType:'application/javascript',body:'window.YT={Player:class{constructor(frame,options){this.frame=frame;this.events=options.events;setTimeout(()=>this.events.onReady({target:this}),0)}unMute(){}playVideo(){this.events.onStateChange({data:1,target:this})}destroy(){this.frame.remove()}}};window.onYouTubeIframeAPIReady();'}));
  await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('iframe').count(),0);
  const before=await snapshot(page);
  const entry=await page.locator('#research-video').evaluate(el=>el.getBoundingClientRect().top+scrollY-innerHeight+40);
  // Scroll from above the section in small steps; capture the first card pixels
  // while they are below the existing observer's 75% viewport reveal boundary.
  await page.evaluate(y=>scrollTo(0,y-250),entry);
  for(let y=entry-225;y<=entry;y+=25){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(30);}
  const boundary=await snapshot(page);
  assert(boundary['#research-video'].top>height*.75&&boundary['#research-video'].top<height);
  if(reproduce){
   assert.equal(boundary['#research-video'].opacity,1);
   assert(boundary.h2.opacity<1||boundary['.lead5'].opacity<1);
   await page.screenshot({path:`${out}/before-${lang}-${width}.png`});
   evidence.checks.push({width,lang,before,boundary,cardVisibleBeforeIntroSettles:true});
   await context.close();continue;
  }
  assert.equal(before['#research-video'].opacity,0,'card starts hidden under normal motion');
  assert.equal(boundary['#research-video'].opacity,0,'card cannot show before its observer entry');
  let cardEntered=false;
  for(let step=0;step<30;step++){
   await page.evaluate(()=>scrollBy(0,25));await page.waitForTimeout(40);
   const state=await snapshot(page);
   if(state['#research-video'].opacity>0){
    assert(state.h2.revealed&&state['.lead5'].revealed,'intro observer runs before card');
    assert(state.h2.opacity>=state['#research-video'].opacity&&state['.lead5'].opacity>=state['#research-video'].opacity,'intro leads the card fade');
    cardEntered=true;break;
   }
  }
  assert(cardEntered);await page.waitForTimeout(900);
  const complete=await snapshot(page);assert.equal(complete['#research-video'].opacity,1);
  await page.screenshot({path:`${out}/after-${lang}-${width}.png`});
  const navigations=[];
  for(const hash of ['#cases','#research-video']){
   await page.goto(url+hash);await page.waitForFunction(()=>document.querySelector('#research-video').classList.contains('in'));
   await page.waitForTimeout(900);const state=await snapshot(page);
   assert.equal(state['#research-video'].opacity,1);assert(state['#research-video'].bottom>0&&state['#research-video'].top<height);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('.vr-research-case .vr-action').click();
   await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing');
   assert.equal(await page.locator('.vr-player iframe').count(),1);
   await page.keyboard.press('Escape');assert.equal(await page.locator('.vr-player iframe').count(),0);
   assert(await page.locator('.vr-research-case .vr-action').evaluate(el=>el===document.activeElement));
   navigations.push({hash,state,simulatedClickAndClose:true});
  }
  evidence.checks.push({width,lang,mode:'normal',before,boundary,complete,navigations});await context.close();
  for(const mode of ['reduced-motion','no-js']){
   const fallback=await browser.newContext({viewport:{width,height},reducedMotion:mode==='reduced-motion'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
   const p=await fallback.newPage();p.on('pageerror',error=>evidence.errors.push(error.message));
   const visits=[];
   for(const hash of ['','#cases','#research-video']){
    await p.goto(url+hash);if(!hash)await p.locator('#cases').evaluate(el=>el.scrollIntoView());
    const state=await snapshot(p);
    for(const item of Object.values(state)){assert.equal(item.opacity,1);assert.equal(item.transform,'none');assert.equal(item.transition,'0s');}
    const anchor=p.locator('.vr-research-case .vr-action');assert.match(await anchor.getAttribute('href'),/^https:\/\/www.youtube.com\/watch\?v=ilKLSItmT0M$/);
    assert.equal(await p.locator('iframe').count(),0);visits.push({hash:hash||'scroll-from-top',state,nativeSourceLink:true});
   }
   evidence.checks.push({width,lang,mode,visits});await fallback.close();
  }
 }
 assert.deepEqual(evidence.errors,[]);evidence.status=reproduce?'reproduced':'pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/${reproduce?'reproduction':'verification'}.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
