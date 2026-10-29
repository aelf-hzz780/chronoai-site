import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8768/chronoai-site/',out=process.env.SUBPAGE_EVIDENCE_DIR||'docs/evidence/five-pages';
await fs.mkdir(out,{recursive:true});
const raw=await fs.readFile('_preview/publication.json'),manifest=JSON.parse(raw),config=JSON.parse(await fs.readFile('site-config.json'));
const evidence={sourceCommit:manifest.sourceCommit,revision:manifest.revision,manifestSHA256:createHash('sha256').update(raw).digest('hex'),comparedAt:new Date().toISOString(),expectedDifferences:['Header/footer add native locale controls; approved shared navigation breakpoint and compact mobile logo rules','Every declared official-site page stays local in the selected locale, preserving query/hash; service subdomains remain external','Cloudflare email protection resolves to the same mailto contact; no Cloudflare script','Fonts served from the existing local font archive; SEO/AI metadata added','Original motion adapted for translated controls, reduced-motion and lifecycle cleanup; Research canvas positions are random'],checks:[]};
const browser=await chromium.launch({headless:true});
const measure=()=>{
 const main=document.querySelector('main');
 const geometry=element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return{x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor};};
 const elements=[...main.querySelectorAll('h1,h2,h3,p,.flow,.nx-dia')];
 return{title:document.title,text:main.textContent.replace(/\s+/g,' ').trim(),structure:[...main.querySelectorAll('*')].filter(x=>!['SCRIPT','STYLE'].includes(x.tagName)).map(x=>x.tagName),headings:[...main.querySelectorAll('h1,h2,h3')].map(x=>x.textContent.trim()),geometry:elements.map(geometry),svgPaths:[...main.querySelectorAll('svg path')].map(x=>x.getAttribute('d')),cta:[...main.querySelectorAll('a[href]')].map(x=>({text:x.textContent.trim(),href:x.href})),overflow:document.documentElement.scrollWidth>innerWidth,fonts:{Inter:document.fonts.check('400 16px Inter'),Mona:document.fonts.check('400 16px "Mona Sans"')}};
};
try{
 const context=await browser.newContext({reducedMotion:'reduce'}),live=await context.newPage(),local=await context.newPage();
 for(const width of [1440,375])for(const item of manifest.pages.filter(p=>p.kind==='brand'&&p.lang==='en')){
  await live.setViewportSize({width,height:900});await local.setViewportSize({width,height:900});
  const remote=config.onlineOrigin+'/'+item.path;
  await live.goto(remote);await live.evaluate(()=>document.fonts.ready);
  await local.goto(base+item.path);await local.evaluate(()=>document.fonts.ready);
  const online=await live.evaluate(measure),built=await local.evaluate(measure);
  // Source scripts/styles are excluded from semantic body comparison separately
  // by verify_site.py; runtime controls can change labels on mobile/reduced motion.
  assert.deepEqual(built.structure,online.structure);assert.deepEqual(built.headings,online.headings);assert.deepEqual(built.svgPaths,online.svgPaths);assert.equal(built.geometry.length,online.geometry.length);
  const routes=Object.fromEntries(manifest.pages.filter(p=>p.lang==='en').map(p=>['/'+p.path,p.path]));routes['/']='index.html';
  const expectedCta=online.cta.map(link=>{const url=new URL(link.href);if(url.origin===config.onlineOrigin&&routes[url.pathname]){const next=new URL(routes[url.pathname],base);next.search=url.search;next.hash=url.hash;return{text:link.text,href:next.href};}return link;});
  assert.deepEqual(built.cta,expectedCta,item.id+' native CTA destinations');
  assert.equal(built.overflow,false);const differences=[];
  for(let i=0;i<built.geometry.length;i++)for(const field of ['x','y','width','height','fontSize','lineHeight','color','background']){
   const a=online.geometry[i][field],b=built.geometry[i][field];
   if(typeof a==='number'?Math.abs(a-b)>2:a!==b)differences.push({element:i,field,online:a,local:b});
  }
  await live.screenshot({path:`${out}/online-${item.id}-${width}.png`,fullPage:true});
  await local.screenshot({path:`${out}/local-${item.id}-${width}.png`,fullPage:true});
  evidence.checks.push({id:item.id,width,onlineUrl:remote,headingsMatch:true,svgPathsMatch:true,geometryDifferences:differences,online,built});
  assert.deepEqual(differences,[],item.id+'/'+width+' official content geometry');
 }
 await context.close();evidence.status='pass';
}catch(error){evidence.status='failed';evidence.error=error.message;process.exitCode=1;console.error(error.stack);}
finally{await fs.writeFile(`${out}/brand-comparison.json`,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(evidence.status);
