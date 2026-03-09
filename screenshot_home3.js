const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to home3...');
  await page.goto('http://localhost:3003/home3', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  const positions = [0, 800, 1600, 2400, 3200, 4200, 5200, 6200, 7200, 8200, 9200, 10200, 11200, 12200, 13200, 14200];

  for (const y of positions) {
    await page.evaluate(s => window.scrollTo(0, s), y);
    await new Promise(r => setTimeout(r, 1000));
    const f = path.join(OUT, `home3_y${y}.png`);
    await page.screenshot({ path: f });
    console.log(`y=${y}: ${f}`);
  }

  await browser.close();
  console.log('Done!');

  // Auto-delete screenshots after capture
  const files = fs.readdirSync(OUT).filter(f => f.startsWith('home3_'));
  files.forEach(f => fs.unlinkSync(path.join(OUT, f)));
  console.log(`Deleted ${files.length} screenshots.`);
}

main().catch(console.error);
