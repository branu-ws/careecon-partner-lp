// 記事ごとのOGP画像（1200x630）をヘッドレスChromiumで生成する。
// タイトルとカテゴリを載せた画像を dist/blog/<slug>/og.jpg に保存する。失敗した記事は共通画像にフォールバックする。
import fs from 'node:fs/promises';
import path from 'node:path';
import { serveDir, esc } from './util.mjs';

const html = ({ title, category }) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/fonts.css"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;font-family:'Noto Sans JP',sans-serif;background:#0b3b8c;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;background-image:linear-gradient(135deg,#0b3b8c 0%,#1456c4 100%)}
.cat{display:inline-block;font-size:26px;font-weight:700;background:#fff;color:#0b3b8c;border-radius:999px;padding:6px 22px}
h1{font-size:${title.length > 34 ? 52 : 60}px;line-height:1.38;font-weight:800;letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.foot{display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:700;opacity:.95}
</style></head><body><div><span class="cat">${esc(category || 'パートナー検討ガイド')}</span></div><h1>${esc(title)}</h1><div class="foot"><span>CAREECON Plus 販売パートナープログラム</span><span>BRANU株式会社</span></div></body></html>`;

/** @returns {Promise<Set<string>>} 生成できた記事のスラッグ */
export async function generateOgImages({ distDir, articles, log = console }) {
  const done = new Set();
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    log.warn('  ・OGP画像: playwright が無いため共通画像を使います');
    return done;
  }
  const tmp = path.join(distDir, '_og');
  await fs.mkdir(tmp, { recursive: true });
  const server = await serveDir(distDir);
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const a of articles) {
      try {
        await fs.writeFile(path.join(tmp, `${a.slug}.html`), html({ title: a.title, category: a.category }));
        await page.goto(`${server.url}/_og/${a.slug}.html`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(distDir, 'blog', a.slug, 'og.jpg'), type: 'jpeg', quality: 82 });
        done.add(a.slug);
      } catch (e) {
        log.warn(`  ・[${a.title}] OGP画像を作れませんでした（${e.message.split('\n')[0]}）`);
      }
    }
  } catch (e) {
    log.warn(`  ・OGP画像: ブラウザを起動できませんでした（${e.message.split('\n')[0]}）`);
  } finally {
    if (browser) await browser.close();
    await server.close();
    await fs.rm(tmp, { recursive: true, force: true });
  }
  return done;
}
