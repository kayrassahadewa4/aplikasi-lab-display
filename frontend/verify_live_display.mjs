import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const artifactDir = 'C:\\Users\\Herlambang Sahadewa\\.gemini\\antigravity\\brain\\226b5eaa-fef3-44b1-bb34-a6a8e8f6d7ad';

  // Audit Live Display route
  await page.goto('http://localhost:5173/display', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const displayAudit = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent.trim();
    const activeSessionsCount = document.querySelectorAll('main > div:first-child > div:nth-child(2) > div').length;
    const hasLiveBadge = document.body.textContent.includes('MONITOR LANGSUNG');
    const hasMarquee = document.querySelector('footer .animate-marquee')?.textContent?.trim();
    const hasScrollbar = document.body.scrollHeight > window.innerHeight;

    return {
      title,
      activeSessionsCount,
      hasLiveBadge,
      hasMarquee: !!hasMarquee,
      hasScrollbar
    };
  });

  await page.screenshot({ path: path.join(artifactDir, 'live_display_audit.png'), fullPage: false });

  console.log('LIVE DISPLAY AUDIT RESULTS:', JSON.stringify(displayAudit, null, 2));

  await browser.close();
}

run().catch(console.error);
