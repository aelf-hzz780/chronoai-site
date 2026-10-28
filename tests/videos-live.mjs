import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/',out='docs/evidence/videos';await fs.mkdir(out,{recursive:true});
const raw=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(raw),strict=process.env.VIDEO_STRICT_POLICY==='1';
const evidence={type:strict?'real YouTube with stricter Chromium media policy':'real YouTube playback under default Chromium policy',sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(raw).digest('hex'),checks:[],errors:[]};
const browser=await chromium.launch({headless:true,...(strict?{args:['--autoplay-policy=document-user-activation-required']}: {})});
async function observe(page,kind){
 await page.waitForFunction(()=>['playing','error',...(document.querySelector('.vr-dialog')?.dataset.state==='player'?['player']:[])].includes(document.querySelector('.vr-dialog').dataset.state),null,{timeout:25000}).catch(()=>{});
 // Ready may precede actual playback. Give the official player a bounded opportunity to start.
 if(!strict)await page.waitForFunction(()=>document.querySelector('.vr-dialog').dataset.state==='playing',null,{timeout:12000}).catch(()=>{});
 const state=await page.locator('.vr-dialog').getAttribute('data-state'),frame=page.frames().find(f=>f.url().startsWith('https://www.youtube-nocookie.com/embed/'));
 let first=null,media=null,identity=null,controls=null;
 if(frame){
  first=await frame.locator('video').evaluate(v=>v.currentTime).catch(()=>null);await page.waitForTimeout(700);
  media=await frame.locator('video').evaluate(v=>{const r=v.getBoundingClientRect();return{time:v.currentTime,duration:v.duration,paused:v.paused,muted:v.muted,volume:v.volume,audioDecodedBytes:v.webkitAudioDecodedByteCount??null,width:v.videoWidth,height:v.videoHeight,renderedWidth:r.width,renderedHeight:r.height};}).catch(()=>null);
  identity=await frame.evaluate(()=>{const p=document.querySelector('#movie_player');return{videoId:p?.getVideoData?.()?.video_id??null,adShowing:Boolean(document.querySelector('.ad-showing,.ad-interrupting'))};}).catch(()=>null);
  const box=await page.locator('.vr-player iframe').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(250);
  controls={play:await frame.getByRole('button',{name:/pause|play|暂停|播放/i}).first().isVisible().catch(()=>false),fullscreen:await frame.getByRole('button',{name:/full.?screen|全屏/i}).first().isVisible().catch(()=>false)};
 }
 const result={state,media,identity,controls,timeAdvanced:media&&first!==null?media.time>first:null};
 if(!strict){
  assert.equal(state,'playing');assert(media&&!media.paused&&!media.muted&&media.volume>0&&result.timeAdvanced,'real unmuted media must advance after one click');
  assert(media.audioDecodedBytes>0,'audio track must actually decode');
  assert.equal(identity?.videoId,kind==='case'?'Vre-ZFYv9as':'ilKLSItmT0M');assert.equal(identity?.adShowing,false);
  assert(Math.abs(media.duration-(kind==='case'?59.061:92.021))<2,'observe the requested content, not an advertisement');
  assert(Math.abs(media.renderedWidth/media.renderedHeight-media.width/media.height)<.03,'no video cropping');
  assert.equal(await page.locator('.vr-cover').isVisible(),false,'no application overlay may obscure the native player');
 }else{assert(['playing','player'].includes(state));assert.equal(await page.locator('.vr-cover').isVisible(),false);}
 return{result,frame};
}
try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
 for(const width of (strict?[375]:[320,375,1440]))for(const lang of ['en','zh'])for(const kind of ['case','research']){
  if(width===320&&lang==='en')continue;
  await page.setViewportSize({width,height:900});let requested=0;const listener=r=>{if(/youtube|googlevideo|ytimg/.test(r.url()))requested++;};page.on('request',listener);
  await page.goto(base+(lang==='zh'?'zh/':''));await page.evaluate(()=>document.fonts.ready);assert.equal(requested,0,'third-party player contacted before click');
  const selector=kind==='case'?(lang==='en'?'.vr-case .vr-action':'.vr-poster'):(lang==='en'?'.vr-research-poster':'.vr-research-case .vr-action');
  await page.locator(selector).click();const {result,frame}=await observe(page,kind);
  const check={width,lang,kind,...result};evidence.checks.push(check);console.log(JSON.stringify(check));
  await page.screenshot({path:`${out}/${strict?'strict':'live'}-${lang}-${width}-${kind}.png`});
  await page.locator('.vr-close').click();assert.equal(await page.locator('.vr-player iframe').count(),0);assert.equal(await page.locator('.vr-dialog').evaluate(el=>el.open),false);if(frame)assert(frame.isDetached());
  assert(await page.locator(selector).evaluate(el=>el===document.activeElement));
  if(!strict&&width===375){
   await page.locator(selector).click();const reopened=await observe(page,kind);check.samePageReopen=reopened.result;
   await page.locator('.vr-close').click();assert.equal(await page.locator('.vr-player iframe').count(),0);assert(reopened.frame.isDetached());
  }
  page.off('request',listener);
 }
 assert.deepEqual(evidence.errors,[]);evidence.status='pass';await context.close();
}catch(error){evidence.status='failed';evidence.error=error.message;console.error(error.stack);process.exitCode=1;}
finally{await fs.writeFile(`${out}/${strict?'live-strict-policy':'live'}.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
