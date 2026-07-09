const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log("Navigating to live site...");
  await page.goto('https://b45d7ebb.outpost-app-a0c.pages.dev/app', { waitUntil: 'networkidle2' });
  
  console.log("Waiting a few seconds...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("Dumping localStorage:");
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  console.log(ls);
  
  await browser.close();
})();
