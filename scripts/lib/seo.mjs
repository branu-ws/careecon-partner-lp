// sitemap.xml / feed.xml / robots.txt の生成。どれも絶対URLが必要なので、SITE_URL が設定されたときだけ作る。
import { ymdJst } from './util.mjs';

const xml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function buildSitemap({ siteUrl, articles, pages = [], buildDate = new Date() }) {
  const latest = articles.reduce((m, a) => (a.modified > m ? a.modified : m), new Date(0));
  const urls = [{ loc: `${siteUrl}/`, lastmod: ymdJst(buildDate) }];
  if (articles.length) {
    urls.push({ loc: `${siteUrl}/blog/`, lastmod: ymdJst(latest) });
    for (const a of articles) urls.push({ loc: `${siteUrl}/blog/${a.slug}/`, lastmod: ymdJst(a.modified) });
  }
  for (const p of pages) urls.push({ loc: `${siteUrl}/${p.slug}/`, lastmod: ymdJst(p.updated || buildDate) });
  const items = urls.map((u) => `  <url>\n    <loc>${xml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function buildFeed({ siteUrl, articles, title, description, buildDate = new Date() }) {
  const items = articles
    .slice(0, 30)
    .map((a) => {
      const link = `${siteUrl}/blog/${a.slug}/`;
      return `    <item>\n      <title>${xml(a.title)}</title>\n      <link>${xml(link)}</link>\n      <guid isPermaLink="true">${xml(link)}</guid>\n      <pubDate>${a.published.toUTCString()}</pubDate>\n      <description>${xml(a.description || a.fallbackDescription || '')}</description>\n    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${xml(title)}</title>\n    <link>${xml(`${siteUrl}/blog/`)}</link>\n    <description>${xml(description)}</description>\n    <language>ja</language>\n    <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

// 検索エンジンと主要なAI検索・回答のクローラーを明示的に許可する
export const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

export function buildRobots({ siteUrl }) {
  const ai = AI_CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /\n`).join('\n');
  return `User-agent: *\nAllow: /\n\n${ai}\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

const stripTags = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/** LPの <details><summary>質問</summary><p>回答</p></details> から質問と回答を取り出す（FAQの構造化データ用） */
export function extractFaq(html) {
  const out = [];
  const re = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g;
  let m;
  while ((m = re.exec(html))) out.push({ q: stripTags(m[1]), a: stripTags(m[2]) });
  return out;
}

/** LPの構造化データ（組織・サイト・製品・FAQ）。説明文はHTMLの title / description に合わせる */
export function buildLandingJsonLd({ siteUrl, html }) {
  const pick = (re) => (re.exec(html) || [])[1] || '';
  const title = stripTags(pick(/<title>([\s\S]*?)<\/title>/));
  const description = stripTags(pick(/<meta content="([^"]*)" name="description"/));
  const org = { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'BRANU株式会社', alternateName: 'BRANU, Inc.', url: 'https://branu.jp/' };
  const faq = extractFaq(html);
  const graph = [
    org,
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'CAREECON Plus 販売パートナープログラム', inLanguage: 'ja', publisher: { '@id': org['@id'] } },
    { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, url: `${siteUrl}/`, name: title, description, inLanguage: 'ja', isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#product` } },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#product`,
      name: 'CAREECON Plus',
      alternateName: 'キャリコンプラス',
      applicationCategory: 'BusinessApplication',
      description: 'CAREECON Plus（キャリコンプラス）は、見積・請求書や案件別の収支などの経営管理と、AI日報・工程表などの施工管理を一つにまとめた、建設業向けの統合型ツールです。',
      url: 'https://careecon-plus.com/',
      provider: { '@id': org['@id'] },
    },
  ];
  if (faq.length) {
    graph.push({ '@type': 'FAQPage', '@id': `${siteUrl}/#faq`, mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** AI向けのサイト概要（llms.txt）。LPの内容と公開中の記事から作る */
export function buildLlmsTxt({ siteUrl, articles = [] }) {
  const list = articles.map((a) => `- [${a.title}](${siteUrl}/blog/${a.slug}/): ${a.description || a.fallbackDescription || ''}`.trimEnd()).join('\n');
  return `# CAREECON Plus 販売パートナープログラム

> 建設業向け統合型ツール「CAREECON Plus」（キャリコンプラス）の、代理店・販売パートナーを募集するサイトです。運営はBRANU株式会社。

CAREECON Plus は、見積・請求書や案件別の収支などの経営管理と、AI日報・工程表などの施工管理を一つにまとめた、建設業向けの統合型ツールです。導入は3,000社以上。

## 提携モデル
- 紹介型（トスアップ）: 見込み顧客を紹介。商談・契約・導入支援は本部が担当
- 代理販売型（クローズ）: パートナーが商談から契約まで担当。初期設定・導入後の定着支援は本部が担当
- 加盟金・初期費用は不要。報酬条件は資料請求後に個別案内

## 対象
OA機器販売会社、IT商社、SaaS企業、人材紹介会社、金融機関、士業・コンサルティング会社など。建設業の顧客や取引先をお持ちであれば、これら以外の業種も受け付けています。

## ページ
- [販売パートナー募集（トップ）](${siteUrl}/): 制度の概要、提携モデル、サポート、FAQ、資料請求
- [パートナー検討ガイド](${siteUrl}/blog/): 提案の進め方や提携前の確認事項
- [プライバシーポリシー](${siteUrl}/privacy/)
${list ? `\n## ガイド記事\n${list}\n` : ''}
## 建設会社の方へ
製品の詳細は [CAREECON Plus 製品サイト](https://careecon-plus.com/) をご覧ください。
`;
}
