import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.EDGE_PATH || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined);
const dir = mkdtempSync(path.join(tmpdir(), 'farm-p7-browser-')), db = openDatabase(path.join(dir, 'qa.sqlite'));
let { server, io } = createApp(db); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port, url = `http://127.0.0.1:${port}`; mkdirSync('.qa', { recursive: true });
let browser; const checks = [], errors = [];
const run = async (name, fn) => { try { await fn(); checks.push(true); console.log('PASS', name); } catch (error) { checks.push(false); console.log('FAIL', name, error.stack || error.message); } };
async function account(context, username, farmName) {
  const page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(`${username}: ${error.message}`));
  await page.goto(url); await page.locator('#registerTab').click(); await page.locator('[name=username]').fill(username); await page.locator('[name=password]').fill('strong-pass-123'); await page.locator('#authSubmit').click();
  await page.locator('#create:not(.hidden)').waitFor(); await page.locator('[name=name]').fill(farmName); await page.locator('#farmForm button').click();
  await page.locator('#game:not(.hidden)').waitFor(); await page.locator('#status').getByText('Đã kết nối').waitFor(); return page;
}
try {
  browser = await chromium.launch({ headless: true, executablePath });
  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } }), contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } }), contextC = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const suffix = String(Date.now()).slice(-8), nameA = `p7a_${suffix}`, nameB = `p7b_${suffix}`, nameC = `p7c_${suffix}`;
  const a = await account(contextA, nameA, 'Ruộng Sen'), b = await account(contextB, nameB, 'Vườn Tre'), c = await account(contextC, nameC, 'Đồng Lúa');
  const farmA = db.prepare('SELECT id FROM farms WHERE owner_id=(SELECT id FROM users WHERE username=?)').get(nameA).id;
  await run('private farm is hidden from search', async () => { await b.locator('#socialButton').click(); await b.locator('#socialSearch [name=q]').fill('Ruộng Sen'); await b.locator('#socialSearch button').click(); await b.locator('.social-results').getByText('Không tìm thấy').waitFor(); });
  await run('request and approval through UI', async () => {
    await a.locator('#socialButton').click(); await a.locator('#socialPrivacy').selectOption('request'); await a.locator('#closePanel').click();
    await b.locator('#socialSearch [name=q]').fill('Ruộng Sen'); await b.locator('#socialSearch button').click();
    await b.locator('[data-social=request]').click(); await a.locator('#socialButton').click(); await a.locator('[data-social=approve]').click();
    assert.equal(db.prepare("SELECT status FROM farm_visit_requests WHERE farm_id=?").get(farmA).status, 'approved');
  });
  await run('visit, presence, movement and read-only UI', async () => {
    await b.locator('#closePanel').click(); await b.locator('#socialButton').click(); await b.locator('#socialSearch [name=q]').fill('Ruộng Sen'); await b.locator('#socialSearch button').click();
    await b.locator('[data-social=visit]').click(); await b.locator('#visitBanner:not(.hidden)').waitFor();
    assert.match(await b.locator('#visitLabel').textContent(), new RegExp(nameA)); assert.equal(await b.locator('#farmHud').isVisible(), false);
    await b.locator('#canvas').click({ position: { x: 500, y: 450 } }); await b.keyboard.down('d'); await b.waitForTimeout(350); await b.keyboard.up('d');
    await a.locator('#closePanel').click(); await a.locator('#socialButton').click(); await a.locator('[data-social=kick]').waitFor();
    await b.locator('#emoteButton').click(); await a.locator('#closePanel').click(); await a.locator('button[aria-label="Vẫy tay chào"]').click(); await a.locator('#socialButton').click();
    const fps = await b.evaluate(async () => { let frames = 0, start = performance.now(); while (performance.now() - start < 1200) { await new Promise(requestAnimationFrame); frames++; } return Math.round(frames * 1000 / (performance.now() - start)); });
    console.log('Phase7 visit FPS', fps); assert.ok(fps >= 30);
    await b.screenshot({ path: '.qa/phase7-visit.png' });
  });
  await run('kick, privacy revoke and mobile layout', async () => {
    await a.locator('[data-social=kick]').click(); await b.locator('#visitBanner').waitFor({ state: 'hidden' });
    const userB = db.prepare('SELECT id FROM users WHERE username=?').get(nameB).id, before = db.prepare('SELECT x FROM player_states WHERE user_id=?').get(userB).x;
    await b.locator('#canvas').click({ position: { x: 500, y: 450 } }); await b.keyboard.down('d'); await b.waitForTimeout(300); await b.keyboard.up('d'); await b.waitForTimeout(250);
    const after=db.prepare('SELECT x FROM player_states WHERE user_id=?').get(userB).x;assert.ok(after > before + 10, 'movement resumes on own farm after kick');
    await a.locator('#socialPrivacy').selectOption('public'); await a.locator('#closePanel').click();
    await c.locator('#socialButton').click(); await c.locator('#socialSearch [name=q]').fill('Ruộng Sen'); await c.locator('#socialSearch button').click(); await c.locator('[data-social=visit]').click(); await c.locator('#visitBanner:not(.hidden)').waitFor();
    await c.screenshot({ path: '.qa/phase7-mobile.png' });
    assert.equal(await c.evaluate(() => document.documentElement.scrollWidth), 390);
    await a.locator('#socialButton').click(); await a.locator('#socialPrivacy').selectOption('private'); await c.locator('#visitBanner').waitFor({ state: 'hidden' });
    await Promise.all([a.goto('about:blank'),b.goto('about:blank'),c.goto('about:blank')]);
    await new Promise(resolve => io.close(resolve)); if (server.listening) await new Promise(resolve => server.close(resolve));
    ({ server, io } = createApp(db)); await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
    await a.goto(url); await a.locator('#game:not(.hidden)').waitFor(); await a.locator('#socialButton').click();
    assert.equal(await a.locator('#socialPrivacy').inputValue(), 'private');
    assert.equal(await a.locator('[data-social=kick]').count(), 0);
    assert.deepEqual(errors, []);
  });
} finally { await browser?.close(); await new Promise(resolve => io.close(resolve)); if (server.listening) await new Promise(resolve => server.close(resolve)); db.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); }
console.log(`${checks.filter(Boolean).length}/${checks.length} PASS`); if (checks.includes(false)) process.exitCode = 1;
