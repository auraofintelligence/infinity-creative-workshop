const { chromium }=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4186';
const out=path.resolve(__dirname,'../output/browser-check');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-features=PointerLockOptions']});
  const errors=[];const checks=[];
  try{
    for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
      const context=await browser.newContext({viewport,acceptDownloads:true});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      for(const file of ['index.html','learn.html','council.html','production.html','costs.html','test-lab.html','repositories.html','about.html','404.html']){
        const response=await page.goto(base+'/'+file,{waitUntil:'networkidle'});assert.equal(response.status(),200,file);
        await page.locator('img').evaluateAll(async imgs=>{for(const i of imgs)i.loading='eager';await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${size} overflow ${file}`);
        const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[],file);
        checks.push(`${size}: ${file}`);
        if(file==='index.html')await page.screenshot({path:path.join(out,size+'-home.png'),fullPage:true});
      }
      await page.goto(base+'/learn.html',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Teaching',exact:true}).click();assert.match(await page.locator('#route-result').innerText(),/Make an idea easier/);
      await page.goto(base+'/production.html',{waitUntil:'networkidle'});await page.getByRole('button',{name:'A short or reel',exact:true}).click();assert.match(await page.locator('#format-detail').innerText(),/small promise/);
      await page.goto(base+'/costs.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#provider-planning').options.length>1);
      assert.match(await page.locator('#cost-total').innerText(),/0.00/);
      await page.getByRole('button',{name:'Mixed paid example',exact:true}).click();assert.match(await page.locator('#cost-total').innerText(),/3.226/);
      await page.getByRole('button',{name:'Several video attempts',exact:true}).click();assert.match(await page.locator('#cost-total').innerText(),/14.529/);
      await page.locator('#rate-video').fill('0');await page.locator('#rate-video').dispatchEvent('input');assert.match(await page.locator('#cost-total').innerText(),/0.129/);
      await page.locator('#image-quantity').fill('-1');await page.locator('#image-quantity').dispatchEvent('input');assert.match(await page.locator('#cost-error').innerText(),/Check your inputs/);
      await page.getByRole('button',{name:'Mixed paid example',exact:true}).click();
      const budgetDownload=page.waitForEvent('download');await page.locator('#download-budget').click();await (await budgetDownload).saveAs(path.join(out,size+'-budget.json'));
      if(size==='phone')await page.screenshot({path:path.join(out,'phone-costs.png'),fullPage:true});
      await page.goto(base+'/council.html',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Music video',exact:true}).click();assert.equal(await page.locator('[data-queen]:checked').count(),5);
      await page.locator('#decision').fill('Choose a treatment for my chorus.');await page.locator('#options').fill('Footage, typography or a Blender scene.');await page.locator('#constraints').fill('A short draft using owned assets.');await page.getByRole('button',{name:'Prepare my review brief',exact:false}).click();assert.match(await page.locator('#council-output').innerText(),/Choose a treatment for my chorus/);assert.match(await page.locator('#council-output').innerText(),/Dream Queen/);
      await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#decision').inputValue(),'Choose a treatment for my chorus.');assert.equal(await page.locator('[data-queen]:checked').count(),5);
      if(size==='desktop')await page.screenshot({path:path.join(out,'desktop-council.png'),fullPage:true});
      await page.goto(base+'/test-lab.html',{waitUntil:'networkidle'});await page.locator('#status-connection').selectOption('needs-work');await page.locator('#notes-connection').fill('Test connection needs a second attempt.');await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#status-connection').inputValue(),'needs-work');assert.match(await page.locator('#test-progress').innerText(),/1 of 8/);assert.match(await page.locator('#notes-connection').inputValue(),/second attempt/);
      const recordDownload=page.waitForEvent('download');await page.locator('#download-tests').click();await (await recordDownload).saveAs(path.join(out,size+'-record.json'));
      if(size==='phone'){await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#main-nav').getByRole('link',{name:'Learn',exact:true}).click();assert.match(page.url(),/learn.html/);}
      await context.close();
    }
    assert.deepEqual(errors,[],'Browser errors');
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedOn:'2026-10-30',pages:checks,interactiveChecks:['learning choice','production format','provider selection','editable rates','negative input','budget download','council panel','brief generation','brief persistence','test persistence','record download','phone navigation'],errors},null,2));
    console.log(`Passed ${checks.length} page/viewport checks and interactive flows on desktop and phone.`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
