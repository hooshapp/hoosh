import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const manifest = JSON.parse(await readFile(new URL('../../../../apps/mobile/assets/manifest.json',import.meta.url),'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report={cases:[],originals:[],errors:[],privateRequests:[],physicalDevice:false};
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1100,height:1100}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/\/v1\//.test(r.url()))report.privateRequests.push(r.url());});
 await page.goto('http://127.0.0.1:8093');await page.evaluate(()=>document.fonts.ready);
 const home=page.getByTestId('RN09_HOME_SPECIMEN_ONLY');
 await home.getByRole('combobox').selectOption('Figma example');
 await home.scrollIntoViewIfNeeded();
 const images=[...await page.locator('.asset-gallery img').all(),...await home.locator('img').all(),...await page.getByTestId('RN09D_SETTINGS_SPECIMEN_ONLY').getByTestId('settings-avatar').locator('img').all()];
 for (const img of images) {
  await img.evaluate(async el=>{el.loading='eager';await el.decode();});
  const response=await page.request.get(new URL(await img.getAttribute('src'),page.url()).href);assert(response.ok());
  const bytes=await response.body(),asset=manifest.assets.find(a=>a.sha256===digest(bytes));assert(asset);
  const box=await img.boundingBox();assert(Math.abs(box.width-Number(asset.width))<0.02);assert(Math.abs(box.height-Number(asset.height))<0.02);
  if(!report.originals.some(a=>a.file===asset.file))report.originals.push({file:asset.file,width:box.width,height:box.height,bytesMatch:true});
 }
 await home.locator('.phone').screenshot({path:new URL('./home-originals.png',import.meta.url).pathname});
 await page.locator('.asset-gallery').screenshot({path:new URL('./pack-gallery.png',import.meta.url).pathname});
 for(const width of [280,320,393]) {
  await home.locator('.phone').evaluate((el,width)=>el.style.width=`${width}px`,width);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert(!(await home.locator('.phone').evaluate(el=>el.scrollWidth>el.clientWidth)));report.cases.push({width,overflow:false});
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.privateRequests,[]);
 await writeFile(new URL('./browser-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(`Original-pack browser geometry/bytes passed for ${report.originals.length} assets.`);
} finally {await browser.close();}
