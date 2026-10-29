import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/',out=process.env.SUBPAGE_EVIDENCE_DIR||'docs/evidence/five-pages';
await fs.mkdir(out,{recursive:true});const bytes=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(bytes);
const evidence={sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(bytes).digest('hex'),pages:[],clicks:[],readingPosition:[],errors:[]};
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
 for(const width of [1440,375])for(const item of manifest.pages){
  await page.setViewportSize({width,height:900});await page.goto(base+item.path);
  const links=await page.locator('a[href]').evaluateAll(anchors=>anchors.map(a=>({href:a.href,locale:a.dataset.locale||null,raw:a.getAttribute('href')})));
  let checked=0;
  for(const link of links){const url=new URL(link.href);assert.notEqual(url.hostname,'chrono-ai.fun',item.path+' leaked official navigation');
   if(url.origin!==new URL(base).origin)continue;
   assert(url.pathname.startsWith(new URL(base).pathname),item.path+' missing basePath '+link.raw);
   if(!link.locale)assert.equal(url.pathname.includes('/zh/'),item.lang==='zh-CN',item.path+' wrong target locale '+link.raw);checked++;
  }
  evidence.pages.push({path:item.path,width,checkedLocalAnchors:checked,noOfficialSiteEscape:true,basePath:true,locale:true});
 }
 // Exercise every distinct local main CTA on all official pages at both widths.
 for(const width of [1440,375])for(const item of manifest.pages.filter(p=>p.kind==='brand')){
  await page.setViewportSize({width,height:900});await page.goto(base+item.path);
  const links=await page.locator('main a[href]').evaluateAll(anchors=>anchors.map(a=>({href:a.href,raw:a.getAttribute('href')})).filter(a=>new URL(a.href).origin===location.origin));
  for(const [index,link] of links.entries()){
   await page.goto(base+item.path);
   const candidates=page.locator('main a[href]');let target;
   for(const anchor of await candidates.all())if(await anchor.getAttribute('href')===link.raw){target=anchor;break;}
   assert(target);await target.click();await page.waitForURL(url=>url.href===link.href);
   assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
   evidence.clicks.push({from:item.path,to:new URL(page.url()).pathname,width,index});
  }
 }
 for(const width of [1440,375])for(const language of ['en','zh-CN'])for(const id of ['products','research']){
  await page.setViewportSize({width,height:900});const item=manifest.pages.find(p=>p.id===id&&p.lang===language),other=manifest.pages.find(p=>p.id===id&&p.lang!==language),next=language==='en'?'zh':'en';
  await page.goto(base+item.path+'?tag=1&tag=2');
  const target=page.locator(id==='products'?'#heca':'.qcard').first();await target.evaluate(el=>el.scrollIntoView({block:'start'}));
  const anchor=await target.getAttribute('id');assert(anchor);
  await page.locator(`header a[data-locale="${next}"]`).click();await page.waitForURL(url=>url.pathname===new URL(base+other.path).pathname);
  assert.equal(new URL(page.url()).search,'?tag=1&tag=2');assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)),anchor);
  evidence.readingPosition.push({id,from:language,width,anchor,repeatedQuery:true});
 }
 await context.close();assert.deepEqual(evidence.errors,[]);evidence.status='pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/site-routes.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
