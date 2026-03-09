const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to home2...');
  await page.goto('http://localhost:3003/home2', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for images to load
  await new Promise(r => setTimeout(r, 3000));

  const scrollPositions = [0, 900, 1800, 2700, 3600, 4500, 5400, 6300, 7200, 8100, 9000, 10000];

  for (let i = 0; i < scrollPositions.length; i++) {
    const y = scrollPositions[i];
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await new Promise(r => setTimeout(r, 500));
    const fname = path.join(OUT, `home2_scroll_${y}.png`);
    await page.screenshot({ path: fname });
    console.log(`Screenshot at y=${y}: ${fname}`);
  }

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
