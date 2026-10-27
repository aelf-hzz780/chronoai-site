// Reproducible static Open Graph card; no external requests.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630}});
 await page.setContent('<body style="margin:0;background:#040917;color:white;display:flex;align-items:center;justify-content:center;height:630px;font-family:Arial"><div><div style="color:#7691ff;font-size:42px;letter-spacing:4px">ChronoAI</div><h1 style="font-size:84px;line-height:1.04">Build for what<br>comes next.</h1></div></body>');
 await page.screenshot({path:'assets/social.png'});
} finally {await browser.close();}
