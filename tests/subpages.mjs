import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/';
const out=process.env.SUBPAGE_EVIDENCE_DIR||'docs/evidence/five-pages';await fs.mkdir(out,{recursive:true});
const bytes=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(bytes),pages=manifest.pages.filter(p=>p.id!=='home');
assert.equal(pages.length,26);
const evidence={sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(bytes).digest('hex'),browser:'Chromium',pages:[],compact:[],noJs:[],locale:[],errors:[],failedResources:[]};
const browser=await chromium.launch({headless:true});
const watch=page=>{page.on('pageerror',e=>evidence.errors.push({url:page.url(),message:e.message}));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)evidence.failedResources.push({url:r.url(),status:r.status()});});page.on('requestfailed',r=>{if(r.url().startsWith(base)&&r.failure()?.errorText!=='net::ERR_ABORTED')evidence.failedResources.push({url:r.url(),error:r.failure()?.errorText});});};
try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();watch(page);
 for(const width of [1440,375])for(const item of pages){
  await page.setViewportSize({width,height:900});await page.goto(base+item.path);await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  assert(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)));
  assert.equal(await page.locator('main h1').count(),1,item.path);assert((await page.locator('main').innerText()).length>100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,item.path+'/'+width);
  const locale=item.lang==='en'?'zh':'en',target=manifest.pages.find(p=>p.id===item.id&&p.lang!==item.lang);
  const header=item.kind==='brand'?'header':'#quarto-header',switcher=page.locator(`${header} a[data-locale="${locale}"]`);
  assert(await switcher.isVisible(),item.path+' language visible outside collapsed menu');
  assert.equal(new URL(await switcher.getAttribute('href'),page.url()).pathname,new URL(base+target.path).pathname);
  if(item.kind==='article'){
   assert.equal(await page.locator('main .lang-switch,main .text-end.text-muted,main nav.article-nav').count(),0);
   assert.equal(await page.locator('[data-locale]').count(),1);
   assert(!(await page.locator('main').evaluate(el=>el.contains(document.querySelector('#quarto-header')))));
   const toc=await page.locator('#TOC a[href]').count();assert.equal(toc>0,['nyxid','ornn','nyxid-dossier'].includes(item.id),item.path+' TOC');
   if(toc){let selector='.article-mobile-toc a[href]';if(width===375)await page.locator('.article-mobile-toc summary').click();else if(await page.locator('#quarto-toc-toggle').isVisible()){await page.locator('#quarto-toc-toggle .quarto-sidebar-toggle-title').click();selector='#quarto-toc-toggle #TOC a[href]';}else selector='#quarto-margin-sidebar #TOC a[href]';const first=page.locator(selector).first();await first.click();const id=decodeURIComponent(new URL(page.url()).hash.slice(1));assert(await page.locator('[id]').evaluateAll((els,id)=>els.some(el=>el.id===id),id));await page.goto(base+item.path);}
  }
  const toggler=page.locator(item.kind==='brand'?'.burger':'.navbar-toggler');
  if(width===375){await toggler.click();assert.equal(await toggler.getAttribute('aria-expanded'),'true');await toggler.click();assert.equal(await toggler.getAttribute('aria-expanded'),'false');}
  else{
   const products=page.locator(item.kind==='brand'?'.menu .dd':'#nav-menu-products').first();
   if(item.kind==='brand'){await products.locator('button').click();assert(await products.locator('.panel').isVisible());await page.keyboard.press('Escape');await page.mouse.move(0,0);assert.equal(await products.locator('button').getAttribute('aria-expanded'),'false');assert.equal(await products.locator('.panel').isVisible(),false);}
   else{await products.click();assert(await page.locator('[aria-labelledby="nav-menu-products"]').isVisible());await page.keyboard.press('Escape');}
  }
  if(item.kind==='brand'||['nyxid','ornn','nyxid-dossier'].includes(item.id))assert(await page.locator('main a[href]').count()>0);
  await page.screenshot({path:`${out}/${item.id}-${item.lang}-${width}.png`,fullPage:true});
  evidence.pages.push({id:item.id,path:item.path,lang:item.lang,width,kind:item.kind,body:true,menu:true,localeTarget:target.path,resources:true,toc:['nyxid','ornn','nyxid-dossier'].includes(item.id),screenshot:`${item.id}-${item.lang}-${width}.png`});
 }
 // Every subpage gets a compact navigation check, not just the new product pages.
 await page.setViewportSize({width:320,height:812});
 for(const item of pages){
  await page.goto(base+item.path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,item.path+'/320');
  const header=item.kind==='brand'?'header':'#quarto-header',locale=item.lang==='en'?'zh':'en';
  const switcher=page.locator(`${header} a[data-locale="${locale}"]`);assert(await switcher.isVisible());
  const rect=await switcher.boundingBox();assert(rect.x>=0&&rect.x+rect.width<=320);
  const toggler=page.locator(item.kind==='brand'?'.burger':'.navbar-toggler');await toggler.click();assert.equal(await toggler.getAttribute('aria-expanded'),'true');await toggler.click();
  if(item.kind==='brand'){const geometry=await page.locator('header').evaluate(el=>{const left=el.querySelector('.navl').getBoundingClientRect(),right=el.querySelector('.navr').getBoundingClientRect();return{left:left.right,right:right.left};});assert(geometry.left<=geometry.right);}
  await page.locator(header).screenshot({path:`${out}/${item.id}-${item.lang}-320-header.png`});evidence.compact.push({path:item.path,width:320,menu:true,locale:true});
 }
 const pairs={nyxid:['How It Works','工作原理'],ornn:['How It Works','工作原理'],philosophy:['An observation','一个观察'],harness:['Order','秩序'],'nyxid-dossier':['In One Line','一句话'],'nyxid-product':['Three layers, working together.','三层保护，协同工作。'],'ornn-product':['From discovery to use.','从发现技能，到实际使用。'],company:['Direction is part of the work.','确定方向，也是工作的一部分。'],cma:['One console, three services.','一个控制台，三项服务。'],godgpt:['Make room for a conversation.','给对话留些空间。'],research:['How a result gets recorded.','一项结果如何被记录。'],developers:['Work with skills in Ornn.','在 Ornn 中使用技能。'],products:['Looking for technical resources?','在寻找技术资源？']};
 // Explicit semantic pairs validate both directions instead of only section counts.
 for(const width of [1440,375])for(const [id,headings] of Object.entries(pairs))for(const language of ['en','zh-CN']){
  await page.setViewportSize({width,height:900});const item=pages.find(p=>p.id===id&&p.lang===language),other=pages.find(p=>p.id===id&&p.lang!==language),index=language==='en'?0:1;
  await page.goto(base+item.path);const heading=page.getByRole('heading',{name:headings[index],exact:true}).first();
  const anchor=await heading.evaluate(el=>el.closest('[data-locale-section],section[id]').id);
  await page.goto(base+item.path+'?sample=1&sample=2#'+encodeURIComponent(anchor));
  const locale=language==='en'?'zh':'en',header=item.kind==='brand'?'header':'#quarto-header';
  await page.locator(`${header} a[data-locale="${locale}"]`).click();await page.waitForURL(url=>url.pathname===new URL(base+other.path).pathname);
  assert.equal(new URL(page.url()).search,'?sample=1&sample=2');
  const targetId=decodeURIComponent(new URL(page.url()).hash.slice(1));
  const actual=await page.getByRole('heading',{name:headings[1-index],exact:true}).first().evaluate(el=>el.closest('[data-locale-section],section[id]').id);
  assert.equal(targetId,actual,id+' translated semantic section');evidence.locale.push({id,from:language,to:other.lang,width,source:anchor,target:targetId,heading:headings[1-index]});
 }
 await context.close();
 const aliases=await browser.newContext(),aliasPage=await aliases.newPage();
 evidence.legacy=[];
 const legacyAnchors={home:'cases',nyxid:'工作原理',ornn:'工作原理',philosophy:'一个观察',harness:'秩序','nyxid-dossier':'一句话'};
 for(const [alias,target] of Object.entries(manifest.aliases)){
  const item=manifest.pages.find(p=>p.path===target),anchor=legacyAnchors[item.id];
  await aliasPage.goto(base+alias+'?legacy=1&legacy=2#'+encodeURIComponent(anchor));await aliasPage.waitForURL(url=>url.pathname===new URL(base+target).pathname);
  assert.equal(new URL(aliasPage.url()).search,'?legacy=1&legacy=2');assert.equal(decodeURIComponent(new URL(aliasPage.url()).hash.slice(1)),anchor);
  assert(await aliasPage.locator('[id]').evaluateAll((els,id)=>els.some(el=>el.id===id),anchor));evidence.legacy.push({alias,target,queryAndHash:true});
 }
 await aliases.close();
 const nojs=await browser.newContext({javaScriptEnabled:false});
 for(const width of [1440,375])for(const item of pages){const p=await nojs.newPage();watch(p);await p.setViewportSize({width,height:900});await p.goto(base+item.path);assert((await p.locator('main').innerText()).length>100);
  const hidden=await p.locator('main p,main h1,main h2').evaluateAll(els=>els.some(el=>getComputedStyle(el).opacity==='0'));assert.equal(hidden,false,item.path+' no-JS body');
  const header=item.kind==='brand'?'header':'#quarto-header',locale=item.lang==='en'?'zh':'en',target=pages.find(o=>o.id===item.id&&o.lang!==item.lang);
  await p.locator(`${header} a[data-locale="${locale}"]`).click();assert.equal(new URL(p.url()).pathname,new URL(base+target.path).pathname);evidence.noJs.push({path:item.path,width,body:true,nativeLocale:true});await p.close();}
 await nojs.close();
 const motion=await browser.newContext({viewport:{width:1440,height:900}}),m=await motion.newPage();watch(m);
 for(const lang of ['en','zh-CN']){const item=pages.find(p=>p.id==='company'&&p.lang===lang);await m.goto(base+item.path);await m.waitForFunction(()=>getComputedStyle(document.querySelector('main h1')).opacity==='1');await m.locator('#sources').scrollIntoViewIfNeeded();await m.waitForFunction(()=>document.querySelector('#sources .rv').classList.contains('in'));}
 await m.goto(base+'products/nyxid.html');await m.locator('.nx-dia').scrollIntoViewIfNeeded();await m.waitForFunction(()=>document.querySelector('.dia-d').dataset.animation==='playing');await m.locator('.playbtn').click();assert.equal(await m.locator('.dia-d').getAttribute('data-animation'),'paused');await m.emulateMedia({reducedMotion:'reduce'});assert.equal(await m.locator('.playbtn').isVisible(),false);await motion.close();evidence.motion={companyReveal:true,nyxidDiagramPause:true,reducedMotion:true};
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failedResources,[]);evidence.status='pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/subpages.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
