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
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = 'C:\\Users\\Herlambang Sahadewa\\.gemini\\antigravity-ide\\brain\\94a19508-d8ca-42c9-997f-8bcf1d6776f1';

  // 1. Visit origin and set auth tokens
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('lab_access_token', 'mock_token');
    localStorage.setItem('lab_user', JSON.stringify({
      id: '1',
      full_name: 'Administrator',
      email: 'admin@lab.com',
      role: 'ADMIN',
      status: 'ACTIVE'
    }));
  });

  // 2. Audit Dashboard
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  const dashboardGreeting = await page.evaluate(() => document.querySelector('h1.text-2xl')?.textContent.trim());

  // 3. Audit Profile Edit Page
  await page.goto('http://localhost:5173/admin/profile/edit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const editAudit = await page.evaluate(() => {
    const heading = document.querySelector('h1.text-2xl')?.textContent.trim();
    const backLinkText = document.querySelector('a')?.textContent.trim();
    const nameInputVal = document.querySelector('input[type="text"]')?.value;

    return {
      heading,
      backLinkText,
      nameInputVal
    };
  });

  await page.screenshot({ path: path.join(artifactDir, 'profile_edit_page_audit.png'), fullPage: false });

  // 4. Audit Profile Change Password Page
  await page.goto('http://localhost:5173/admin/profile/change-password', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const passwordAudit = await page.evaluate(() => {
    const heading = document.querySelector('h1.text-2xl')?.textContent.trim();
    const backLinkText = document.querySelector('a')?.textContent.trim();
    const passwordInputsCount = document.querySelectorAll('input[type="password"]').length;

    return {
      heading,
      backLinkText,
      passwordInputsCount
    };
  });

  await page.screenshot({ path: path.join(artifactDir, 'profile_change_password_page_audit.png'), fullPage: false });

  console.log('SEPTENDECUPLE PORTAL AUDIT RESULTS:');
  console.log('Dashboard Greeting:', dashboardGreeting);
  console.log('PROFILE EDIT AUDIT:', JSON.stringify(editAudit, null, 2));
  console.log('CHANGE PASSWORD AUDIT:', JSON.stringify(passwordAudit, null, 2));

  await browser.close();
}

run().catch(console.error);
