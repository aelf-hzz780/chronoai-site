import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/',out=process.env.VIDEO_EVIDENCE_DIR||'docs/evidence/videos';await fs.mkdir(out,{recursive:true});
const raw=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(raw),external=JSON.parse(await fs.readFile('site-config.json','utf8')).external;
const evidence={type:'simulated YouTube integration; not proof of remote playback',sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(raw).digest('hex'),checks:[],errors:[]};
const fixture=`window.__fake={created:0,destroyed:0,play:0,unmute:0};window.__installFakeYT=()=>{window.YT={Player:class{constructor(frame,options){this.frame=frame;this.events=options.events;window.__fake.created++;if(window.__videoMode!=='no-ready')this.timer=setTimeout(()=>this.events.onReady({target:this}),0);}unMute(){window.__fake.unmute++;}playVideo(){window.__fake.play++;if(window.__videoMode==='blocked')this.events.onAutoplayBlocked({target:this});else if(window.__videoMode==='player-error')this.events.onError({data:101,target:this});else this.events.onStateChange({data:1,target:this});}destroy(){window.__fake.destroyed++;clearTimeout(this.timer);this.frame.remove();}}};};if(window.__videoMode==='late'){window.__staleReady=window.onYouTubeIframeAPIReady;}else{window.__installFakeYT();window.onYouTubeIframeAPIReady();}`;
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>evidence.errors.push(e.message));let apiError=false,patch='';let requests=[];
 page.on('request',r=>{if(/youtube|googlevideo|ytimg/.test(r.url()))requests.push(r.url());});
 await page.route('https://www.youtube-nocookie.com/embed/**',r=>r.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><button>Native YouTube controls</button></body></html>'}));
 await page.route('https://www.youtube.com/iframe_api',r=>apiError?r.abort():r.fulfill({contentType:'application/javascript',body:fixture}));
 await page.route(base+'**',async route=>{
  const req=route.request();if(!patch||req.resourceType()!=='document'){await route.continue();return;}
  const response=await route.fetch();let body=await response.text();
  if(patch==='timeout')body=body.replaceAll('"loadTimeoutMs": 20000','"loadTimeoutMs": 150');
  if(patch==='disabled')body=body.replace('"enabled": true','"enabled": false');
  if(patch==='invalid')body=body.replace('"source": {"provider": "youtube", "id": "Vre-ZFYv9as"}','"source": {"provider": "youtube", "id": "bad"}');
  await route.fulfill({response,body});
 });
 for(const width of [320,375,1440])for(const lang of ['en','zh']){
  await page.setViewportSize({width,height:900});requests=[];await page.goto(base+(lang==='zh'?'zh/':''));await page.evaluate(()=>document.fonts.ready);
  assert.equal(requests.length,0);assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const order=await page.evaluate(()=>{const nodes=[document.querySelector('#projects .note5'),document.querySelector('#video-case'),document.querySelector('#cases .lead5'),document.querySelector('#research-video'),document.querySelector('#cases .case2')];return nodes.every((n,i)=>!i||Boolean(nodes[i-1].compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING));});assert(order);
  assert.deepEqual(await page.locator('#cases .case2 a').evaluateAll(nodes=>nodes.map(node=>node.href)),[external.counterexample,external.quantum]);
  assert((await page.locator('.vr-poster img').getAttribute('src')).endsWith(`poster-${lang}.jpg`));
  assert((await page.locator('.vr-poster').boundingBox()).width>=120);
  assert(await page.locator('.vr-research-poster').evaluate(anchor=>{const text=document.createRange();text.selectNodeContents(anchor.querySelector('strong'));const icon=anchor.querySelector('.vr-research-play').getBoundingClientRect();return [...text.getClientRects()].filter(r=>r.width>0).every(r=>r.right<=icon.left-4||r.bottom<=icon.top||r.top>=icon.bottom);}), 'research title must not overlap play icon');
  if([320,375,1440].includes(width))for(const selector of ['#video-case','#research-video']){await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'start'}));if(selector==='#video-case'){await page.locator('.vr-poster img').evaluate(image=>image.decode());assert((await page.locator('.vr-poster img').boundingBox()).width>=120);}await page.screenshot({path:`${out}/${lang}-${width}-${selector.slice(1)}.png`});}
  for(const selector of ['.vr-case .vr-action','.vr-poster','.vr-research-case .vr-action','.vr-research-poster']){
   const trigger=page.locator(selector),kind=await trigger.getAttribute('data-open-video');await trigger.click();
   await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing');
   const iframe=page.locator('.vr-player iframe'),url=new URL(await iframe.getAttribute('src'));
   assert.equal(url.pathname,`/embed/${kind==='case'?'Vre-ZFYv9as':'ilKLSItmT0M'}`);
   assert.equal(url.searchParams.get('autoplay'),'1');assert.equal(url.searchParams.get('playsinline'),'1');assert.equal(url.searchParams.get('controls'),'1');assert.equal(url.searchParams.get('origin'),'http://127.0.0.1:8768');
   assert((await iframe.getAttribute('allow')).includes('autoplay'));assert.equal(await iframe.getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');
   assert.equal(await page.locator('.vr-cover').isVisible(),false);assert.equal(await page.locator('.vr-start').count(),0);
   const box=await iframe.boundingBox();assert(box.width>=200&&box.height>=200);if(kind==='case')assert(Math.abs(box.width/box.height-9/16)<.01);else assert(Math.abs(box.height-Math.max(200,box.width*9/16))<2);
   assert(await page.evaluate(()=>window.__fake.play>0&&window.__fake.unmute>0));
   await page.keyboard.press('Escape');assert.equal(await iframe.count(),0);assert(await page.evaluate(()=>window.__fake.created===window.__fake.destroyed));assert(await trigger.evaluate(el=>el===document.activeElement));assert.equal(await page.locator('body').evaluate(el=>el.style.overflow),'');
  }
  evidence.checks.push({lang,width,entries:4,noPrefetch:true,placement:true,localePoster:true,nativeControlsUncovered:true,closeAndFocus:true});
 }
 // API failure, player error and timeout all clear resources and support retry.
 for(const scenario of ['api-error','player-error','timeout','disabled','invalid']){
  apiError=scenario==='api-error';patch=['timeout','disabled','invalid'].includes(scenario)?scenario:'';
  await page.goto(base);await page.evaluate(mode=>window.__videoMode=mode,scenario==='timeout'?'no-ready':scenario);
  await page.locator('.vr-action[data-open-video="case"]').click();await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='error');
  assert.equal(await page.locator('.vr-player iframe').count(),0);assert(await page.locator('.vr-retry').isVisible());assert((await page.locator('.vr-watch-external').getAttribute('href')).endsWith('Vre-ZFYv9as'));
  if(!['disabled','invalid'].includes(scenario)){apiError=false;await page.evaluate(()=>window.__videoMode='success');await page.locator('.vr-retry').click();await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing');}
  await page.locator('.vr-close').click();
 }
 evidence.errorsTimeoutsDisabledAndRetry=true;patch='';apiError=false;
 // Delayed API completion after close cannot revive a player or retain owned callbacks.
 await page.goto(base);await page.evaluate(()=>window.__videoMode='late');await page.locator('.vr-poster').click();await page.waitForFunction(()=>window.__staleReady);
 assert.equal(await page.locator('.vr-cover').isVisible(),false,'loading cover must not overlay an iframe');
 await page.locator('.vr-close').click();assert.equal(await page.locator('script[data-video-api]').count(),0);assert(await page.evaluate(()=>window.onYouTubeIframeAPIReady===undefined));
 await page.evaluate(()=>{window.__videoMode='success';window.__installFakeYT();window.__staleReady();});
 assert.equal(await page.locator('.vr-player iframe').count(),0);
 await page.locator('.vr-poster').click();await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing');
 // Simulated persisted page transition must not restore an empty modal or resume playback.
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 assert.equal(await page.locator('.vr-player iframe').count(),0);assert.equal(await page.locator('.vr-dialog').evaluate(el=>el.open),false);
 await page.locator('.vr-poster').click();await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing');await page.locator('.vr-close').click();evidence.staleCallbackAndSimulatedPageTransition=true;
 await page.goto(base);await page.evaluate(()=>window.__videoMode='blocked');await page.locator('.vr-research-poster').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='player');
 assert.equal(await page.locator('.vr-cover').isVisible(),false);assert(await page.locator('.vr-player-hint').isVisible());await page.locator('.vr-close').click();evidence.simulatedAutoplayBlock=true;
 await page.setViewportSize({width:667,height:375});
 for(const selector of ['.vr-poster','.vr-research-poster']){await page.locator(selector).click();await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='player');await page.locator('.vr-watch-external').scrollIntoViewIfNeeded();assert(await page.locator('.vr-watch-external').isVisible());await page.locator('.vr-close').scrollIntoViewIfNeeded();await page.locator('.vr-close').click();}evidence.shortViewportControlsReachable=true;
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
 for(const lang of ['en','zh']){const p=await nojs.newPage();await p.goto(base+(lang==='zh'?'zh/':''));assert.equal(await p.locator('a[data-open-video]').count(),4);assert((await p.locator('.vr-poster img').getAttribute('src')).endsWith(`poster-${lang}.jpg`));for(const link of await p.locator('a[data-open-video]').all())assert.match(await link.getAttribute('href'),/^https:\/\/www.youtube.com\/watch\?v=/);assert.equal(await p.locator('iframe').count(),0);await p.close();}await nojs.close();evidence.noJsSourceLinks=true;
 assert.deepEqual(evidence.errors,[]);evidence.status='pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/integration.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
