// ブログのHTMLテンプレート（一覧・記事・固定ページ）。LPと同じヘッダー・フッター・CSSを使う。
import { extractArticleFaq } from './seo.mjs';
import { GROUP_ORDER, groupAnchor } from './linking.mjs';
import { esc, jaDate, jsonForScript, truncate, ymdJst } from './util.mjs';
import { gaTag, JUICER_TAG } from './tracking.mjs';

export const SITE_NAME = 'CAREECON Plus 販売パートナープログラム';
// プライバシーポリシー（全ページ・フォーム共通。固定ページ content/pages/privacy.md から /privacy/ に生成される）
export const PRIVACY_URL = 'https://partner.careecon-plus.com/privacy/';
const ORG_ID = 'https://partner.careecon-plus.com/#organization';
const ORG = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'BRANU株式会社',
  alternateName: 'BRANU, Inc.',
  url: 'https://branu.jp/',
  sameAs: ['https://branu.jp/', 'https://careecon-plus.com/'],
};
// SITE_URL が未設定のときの、画像URL用の基準URL（og:image は絶対URLが必要なため）。本番URLにしておく
export const FALLBACK_BASE = 'https://partner.careecon-plus.com';

/** 絶対URL（SITE_URL が無ければ空） */
export function absUrl(site, rel) {
  return site.siteUrl ? `${site.siteUrl}/${rel}` : '';
}
/** OGP画像などに使う絶対URL（SITE_URL が無ければ仮の基準URL） */
export function imageUrl(site, rel) {
  return `${site.siteUrl || FALLBACK_BASE}/${rel}`;
}

const NAV = [
  ['product', 'プロダクト'],
  ['customer-results', '導入事例'],
  ['model', '提携モデル'],
  ['partners', '対象業種'],
  ['partner-guide', '検討ガイド'],
  ['support', 'サポート'],
  ['getting-started', '開始の流れ'],
  ['faq', 'よくある質問'],
];

// ヘッダーは主要な導線だけに絞る（フッターは全項目）
const HEADER_NAV = ['product', 'customer-results', 'partners', 'partner-guide', 'faq'];

function siteHeader(rootRel) {
  const links = () => NAV.filter(([id]) => HEADER_NAV.includes(id)).map(([id, label]) => `<a href="${rootRel}#${id}">${label}</a>`).join('');
  return `<header class="topbar"><div class="wrap nav"><a aria-label="CAREECON Plus 販売パートナープログラム" class="brand" href="${rootRel}#top"><img alt="CAREECON Plus" src="${rootRel}assets/images/careeconplus_logo.png" width="2048" height="375"><span>販売パートナープログラム</span></a><nav class="nav-right" aria-label="メインナビゲーション">${links()}<a class="btn" href="${rootRel}#request">資料請求 <span aria-hidden="true">↗</span></a></nav><details class="mobile-nav"><summary aria-label="メニューを開閉"><span class="menu-lines" aria-hidden="true">☰</span><span>メニュー</span></summary><nav aria-label="モバイルナビゲーション">${links()}</nav></details></div></header>`;
}

function siteFooter(rootRel) {
  return `<footer class="site-footer"><div class="wrap"><div class="footer-main"><div class="footer-brand"><a class="footer-logo" href="${rootRel}#top" aria-label="CAREECON Plus 販売パートナープログラム トップへ"><img src="${rootRel}assets/images/careeconplus_logo.png" alt="CAREECON Plus" width="2048" height="375" loading="lazy"><span>販売パートナープログラム</span></a><p class="footer-company">運営会社：BRANU株式会社</p><p class="footer-vision">建設業界をテクノロジーでアップデートする。</p><p class="footer-note">建設会社の方は <a href="https://careecon-plus.com/">CAREECON Plus 製品サイト</a> をご覧ください。</p></div><nav class="footer-nav" aria-label="フッターナビゲーション"><a href="${rootRel}#partner-guide">パートナー検討ガイド</a>${NAV.filter(([id]) => id !== 'partner-guide').map(([id, label]) => `<a href="${rootRel}#${id}">${label}</a>`).join('')}<a href="${rootRel}blog/">ガイド一覧</a></nav><div class="footer-contact"><p>パートナー制度について</p><a class="btn" href="${rootRel}#request">資料を請求する <span aria-hidden="true">→</span></a><small>担当者より個別にご案内します。</small></div></div><div class="footer-bottom"><a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">プライバシーポリシー<span class="visually-hidden">（新しいタブで開きます）</span></a><a class="footer-to-top" href="${rootRel}#top">ページ上部へ <span aria-hidden="true">↑</span></a><small>© BRANU Inc. All Rights Reserved.</small></div></div></footer>`;
}

const TOP_SCRIPT = `<style>body:not(.page-home){scroll-behavior:auto}html{scroll-behavior:auto}</style>
<script>(function(){try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward')return;if('scrollRestoration' in history)history.scrollRestoration='manual';function top(){if(!location.hash)window.scrollTo({top:0,left:0,behavior:'instant'})}top();document.addEventListener('DOMContentLoaded',top);window.addEventListener('load',top)}catch(e){}})();</script>`;

function layout({ site, rootRel, title, description, canonicalRel, ogImage, ogType = 'website', jsonld = [], noindex = false, body, bodyClass = '', scripts = '', extraCss = [] }) {
  const canonical = canonicalRel !== undefined ? absUrl(site, canonicalRel) : '';
  const ld = jsonld.length ? `<script type="application/ld+json">\n${jsonForScript(jsonld.length === 1 ? jsonld[0] : { '@context': 'https://schema.org', '@graph': jsonld.map((j) => { const { '@context': _c, ...rest } = j; return rest; }) })}\n</script>` : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#244EFF">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ''}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<link rel="alternate" type="application/rss+xml" title="${esc(SITE_NAME)} ガイド" href="${esc(absUrl(site, 'feed.xml'))}">\n` : ''}<link rel="icon" href="${rootRel}assets/images/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${rootRel}assets/images/favicon-32.png">
<link rel="apple-touch-icon" href="${rootRel}assets/images/apple-touch-icon.png">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">\n` : ''}<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
${ld}
<link rel="stylesheet" href="${rootRel}assets/css/style.css">
<link rel="stylesheet" href="${rootRel}assets/css/guide.css">
<link rel="stylesheet" href="${rootRel}assets/css/fonts.css">
${extraCss.map((f) => `<link rel="stylesheet" href="${rootRel}assets/css/${f}">`).join('\n')}
${JUICER_TAG}
${gaTag(site.gaId)}
${TOP_SCRIPT}
</head>
<body class="${bodyClass}">
${siteHeader(rootRel)}
${body}
${siteFooter(rootRel)}
<script src="${rootRel}assets/js/main.js" defer></script>
${scripts}
</body>
</html>
`;
}

function ctaBand(rootRel) {
  return `<section class="cta-band" aria-labelledby="cta-title">
  <p class="cta-title" id="cta-title">CAREECON Plus の販売パートナーを募集しています</p>
  <p class="cta-lead">建設業界の知識がなくても大丈夫。本部が営業から導入まで伴走します。</p>
  <a class="btn btn-primary btn-lg" href="${rootRel}#request">パートナー資料を請求する</a>
</section>`;
}

function tagList(meta) {
  const items = [...(meta.category ? [`<li class="chip chip-cat">${esc(meta.category)}</li>`] : []), ...meta.tags.filter((t) => t !== meta.category).map((t) => `<li class="chip">${esc(t)}</li>`)];
  return items.length ? `<ul class="chips">${items.join('')}</ul>` : '';
}

function card(meta, rootRel, level = 2) {
  const href = `${rootRel}blog/${meta.slug}/`;
  const thumb = meta.coverFile ? `<a class="card-thumb" href="${href}" tabindex="-1" aria-hidden="true"><img src="${rootRel}blog/${meta.slug}/${esc(meta.coverFile)}" alt="" loading="lazy" decoding="async"${meta.coverW && meta.coverH ? ` width="${meta.coverW}" height="${meta.coverH}"` : ''}></a>` : '';
  return `<li class="card">
  ${thumb}
  <div class="card-body">
    <p class="meta"><time datetime="${ymdJst(meta.published)}">${jaDate(meta.published)}</time></p>
    <h${level} class="card-title"><a href="${href}">${esc(meta.title)}</a></h${level}>
    <p class="card-desc">${esc(meta.description)}</p>
    ${tagList(meta)}
  </div>
</li>`;
}

export function blogIndexPage({ site, articles }) {
  const rootRel = '../';
  const title = `パートナー検討ガイド｜${SITE_NAME}`;
  const description = '提案の進め方や提携前の確認事項など、販売パートナーを検討するための情報をご紹介します。CAREECON Plus 販売パートナープログラムのガイドです。';
  const known = new Set(GROUP_ORDER.map(([g]) => g));
  const groups = GROUP_ORDER.map(([name, lead]) => ({ name, lead, items: articles.filter((a) => a.group === name) }));
  const rest = articles.filter((a) => !known.has(a.group));
  if (rest.length) groups.push({ name: 'その他', lead: '', items: rest });
  const shown = groups.filter((g) => g.items.length);
  const nav = shown.length > 1
    ? `<nav class="guide-jump" aria-label="テーマ別に探す"><p class="guide-jump-title">テーマ別に探す</p><ul>${shown.map((g, i) => `<li><a href="#${groupAnchor(g.name)}"><span class="gj-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="gj-body"><span class="gj-name">${esc(g.name)}</span>${g.lead ? `<span class="gj-lead">${esc(g.lead)}</span>` : ''}</span><span class="gj-count">${g.items.length}<small>本</small></span></a></li>`).join('')}</ul></nav>`
    : '';
  const list = articles.length
    ? nav + shown.map((g, i) => `<section class="guide-section" aria-labelledby="${groupAnchor(g.name)}"><h2 class="guide-section-title" id="${groupAnchor(g.name)}">${esc(g.name)}</h2>${g.lead ? `<p class="guide-section-lead">${esc(g.lead)}</p>` : ''}<ul class="cards">\n${g.items.map((a) => card(a, rootRel, 3)).join('\n')}\n</ul></section>`).join('\n')
    : '<p class="empty">記事を準備中です。公開までしばらくお待ちください。</p>';
  const body = `<main class="container">
  <nav class="breadcrumb" aria-label="パンくずリスト"><a href="${rootRel}">ホーム</a><span aria-hidden="true">›</span><span aria-current="page">パートナー検討ガイド</span></nav>
  <h1 class="page-title">パートナー検討ガイド</h1>
  <p class="page-lead">提案の進め方や提携前の確認事項など、販売パートナーを検討するための情報をご紹介します。</p>
  ${list}
</main>
${ctaBand(rootRel)}`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: title,
      description,
      inLanguage: 'ja',
      publisher: ORG,
      ...(site.siteUrl ? { url: absUrl(site, 'blog/') } : {}),
      blogPost: articles.slice(0, 20).map((a) => ({
        '@type': 'BlogPosting',
        headline: a.title,
        datePublished: a.published.toISOString(),
        ...(site.siteUrl ? { url: absUrl(site, `blog/${a.slug}/`) } : {}),
      })),
    },
  ];
  return layout({ site, rootRel, title, description, canonicalRel: 'blog/', ogImage: imageUrl(site, 'assets/images/og-image.jpg'), jsonld, noindex: articles.length === 0, body, bodyClass: 'page-blog' });
}

export function articlePage({ site, article, html, headings, related }) {
  const rootRel = '../../';
  const title = article.seoTitle || `${article.title}｜${SITE_NAME}`;
  const description = truncate(article.description || article.fallbackDescription || article.title, 120);
  const rel = `blog/${article.slug}/`;
  const ogImage = article.coverFile ? imageUrl(site, `${rel}${article.coverFile}`) : article.ogFile ? imageUrl(site, `${rel}${article.ogFile}`) : imageUrl(site, 'assets/images/og-image.jpg');

  const toc = headings.filter((h) => h.level === 2);
  const tocHtml = toc.length >= 3
    ? `<nav class="toc" aria-label="目次"><p class="toc-title">目次</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav>`
    : '';
  const cover = article.coverFile
    ? `<figure class="cover"><img src="${esc(article.coverFile)}" alt=""${article.coverW && article.coverH ? ` width="${article.coverW}" height="${article.coverH}"` : ''} decoding="async" fetchpriority="high"></figure>`
    : '';
  const relatedHtml = related.length
    ? `<section class="related" aria-labelledby="related-title"><h2 id="related-title">あわせて読みたい記事</h2><ul class="cards">\n${related.map((a) => card(a, rootRel)).join('\n')}\n</ul><p class="related-more">${article.group ? `<a href="${rootRel}blog/#${groupAnchor(article.group)}">「${esc(article.group)}」の記事をすべて見る <span aria-hidden="true">→</span></a>` : ''}<a href="${rootRel}blog/">パートナー検討ガイドの記事一覧 <span aria-hidden="true">→</span></a></p></section>`
    : '';

  const body = `<main class="container">
  <nav class="breadcrumb" aria-label="パンくずリスト"><a href="${rootRel}">ホーム</a><span aria-hidden="true">›</span><a href="../">パートナー検討ガイド</a><span aria-hidden="true">›</span><span aria-current="page">${esc(truncate(article.title, 40))}</span></nav>
  <article class="article">
    <header class="article-header">
      <p class="meta"><time datetime="${ymdJst(article.published)}">${jaDate(article.published)}</time>${ymdJst(article.modified) !== ymdJst(article.published) ? `<span class="meta-sep">・</span>更新 <time datetime="${ymdJst(article.modified)}">${jaDate(article.modified)}</time>` : ''}</p>
      <h1>${esc(article.title)}</h1>
      ${tagList(article)}
    </header>
    ${cover}
    ${tocHtml}
    <div class="prose">
${html}
    </div>
  </article>
  ${relatedHtml}
</main>
${ctaBand(rootRel)}`;

  const posting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description,
    inLanguage: 'ja',
    datePublished: article.published.toISOString(),
    dateModified: article.modified.toISOString(),
    image: [ogImage],
    author: ORG,
    publisher: ORG,
    ...(article.tags.length ? { keywords: article.tags.join(', ') } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(site.siteUrl ? { mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(site, rel) } } : {}),
  };
  const faq = extractArticleFaq(html);
  const faqLd = faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : [];
  const crumbs = site.siteUrl
    ? [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${site.siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'パートナー検討ガイド', item: absUrl(site, 'blog/') },
          { '@type': 'ListItem', position: 3, name: article.title, item: absUrl(site, rel) },
        ],
      }]
    : [];
  return layout({ site, rootRel, title, description, canonicalRel: rel, ogImage, ogType: 'article', jsonld: [posting, ...crumbs, ...faqLd], body, bodyClass: 'page-article' });
}

/** 固定ページ（プライバシーポリシーなど）。content/pages/*.md から生成 */
export function staticPage({ site, page, html }) {
  const rootRel = '../';
  const title = page.seoTitle || `${page.title}｜${SITE_NAME}`;
  const description = truncate(page.description || page.fallbackDescription || page.title, 120);
  const updated = page.updated ? `<p class="meta">最終改訂：<time datetime="${ymdJst(page.updated)}">${jaDate(page.updated)}</time></p>` : '';
  const body = `<main class="container">
  <nav class="breadcrumb" aria-label="パンくずリスト"><a href="${rootRel}">ホーム</a><span aria-hidden="true">›</span><span aria-current="page">${esc(page.title)}</span></nav>
  <article class="article">
    <header class="article-header">
      <h1>${esc(page.title)}</h1>
      ${updated}
    </header>
    <div class="prose">
${html}
    </div>
  </article>
</main>`;
  return layout({ site, rootRel, title, description, canonicalRel: `${page.slug}/`, ogImage: imageUrl(site, 'assets/images/og-image.jpg'), body, bodyClass: 'page-static' });
}

/** 送信完了ページ（/thanks/）。検索には載せず、フォーム送信後にだけ表示して計測に使う */
export function thanksPage({ site, articles = [] }) {
  const rootRel = '../';
  const title = `お問い合わせありがとうございました｜${SITE_NAME}`;
  const description = 'お問い合わせありがとうございました。担当者より追ってご連絡差し上げます。';
  const latest = articles.slice(0, 3).map((a) => `<li><a href="${rootRel}blog/${a.slug}/">${esc(a.title)}</a></li>`).join('\n');
  const body = `<main class="container thanks">
  <div class="thanks-card" role="status">
    <span class="thanks-mark" aria-hidden="true">✓</span>
    <h1>お問い合わせありがとうございました</h1>
    <p class="thanks-lead">担当者より追ってご連絡差し上げます。</p>
    <div class="thanks-actions"><a class="btn" href="${rootRel}">トップページへ戻る</a></div>
    ${latest ? `<div class="thanks-guide"><p class="thanks-guide-title">連絡を待つ間に読めるガイド</p><ul>\n${latest}\n</ul><p><a href="${rootRel}blog/">ガイド記事の一覧を見る →</a></p></div>` : ''}
  </div>
</main>`;
  // フォーム送信直後の1回だけ、GA4に generate_lead を送る（直接アクセス・再読み込みでは送らない）
  const scripts = `<script>(function(){try{var t=sessionStorage.getItem('careecon_lead');if(!t)return;sessionStorage.removeItem('careecon_lead');if(window.gtag)window.gtag('event','generate_lead',{form_type:t});}catch(e){}})();</script>`;
  return layout({ site, rootRel, title, description, canonicalRel: 'thanks/', ogImage: imageUrl(site, 'assets/images/og-image.jpg'), noindex: true, body, bodyClass: 'page-thanks', scripts });
}

/** CAREECON+ のロゴマーク（角丸の三角形6つで作る六角形）。座標は 0〜315 × 0〜375 */
const LOGO_TRIANGLES = ['145,40 145,180 20,110', '190,6 190,140 313,72', '2,138 2,280 125,208', '310,138 310,278 185,208', '145,232 145,372 20,300', '165,232 165,372 292,300'];
function logoMark(main, accent) {
  return LOGO_TRIANGLES.map((pts, i) => `<polygon points="${pts}" fill="${i === 1 ? accent : main}" stroke="${i === 1 ? accent : main}" stroke-width="16" stroke-linejoin="round"/>`).join('');
}

/** 「パートナーとつながり広がるエコシステム」を表す背景のネットワーク図（装飾。CSSでゆっくり動く） */
function webinarNetwork() {
  const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const hub = [1010, 95];
  const sat = [[700, 60, 8], [800, 150, 10], [1100, 40, 9], [1150, 200, 10], [1060, 330, 8], [880, 300, 12], [640, 230, 9], [520, 120, 7], [400, 60, 8], [300, 200, 8], [760, 420, 10], [1000, 520, 9], [560, 380, 8], [180, 330, 7], [860, 600, 8], [1120, 640, 9], [420, 520, 7], [700, 700, 9]];
  const pts = [hub, ...sat];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [1, 8], [8, 9], [8, 10], [2, 7], [7, 6], [4, 5], [5, 12], [6, 11], [7, 13], [11, 13], [11, 12], [12, 16], [13, 17], [10, 14], [11, 15], [15, 18], [17, 18], [15, 12], [14, 17]];
  const lines = edges.map(([a, b], i) => `<line class="wb-edge" style="animation-delay:-${(i * 0.7).toFixed(1)}s" x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`).join('');
  const nodes = sat.map(([x, y, r], i) => `<g class="wb-node${i % 4 === 1 ? ' is-accent' : ''}" style="animation-delay:-${(i * 0.9).toFixed(1)}s"><circle class="o" cx="${x}" cy="${y}" r="${(r * 1.1).toFixed(1)}"/><circle class="i" cx="${x}" cy="${y}" r="${(r * 0.4).toFixed(1)}"/></g>`).join('');
  return `<svg class="wb-net" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
<defs><linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#29d8ff"/><stop offset="1" stop-color="#7a5cff"/></linearGradient><radialGradient id="wbh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3d63ff" stop-opacity=".55"/><stop offset="1" stop-color="#3d63ff" stop-opacity="0"/></radialGradient></defs>
<circle cx="${hub[0]}" cy="${hub[1]}" r="230" fill="url(#wbh)"/>
<g class="wb-edges">${lines}</g>
<g class="wb-rings"><circle class="wb-ring" cx="${hub[0]}" cy="${hub[1]}" r="90"/><circle class="wb-ring r2" cx="${hub[0]}" cy="${hub[1]}" r="90"/><circle class="wb-ring r3" cx="${hub[0]}" cy="${hub[1]}" r="90"/></g>
${nodes}
<g class="wb-hub"><circle cx="${hub[0]}" cy="${hub[1]}" r="74" fill="#0c1f80" fill-opacity=".72" stroke="#ffffff55" stroke-width="1.5"/><g transform="translate(${hub[0] - 55} ${hub[1] - 66}) scale(.35)">${logoMark('#ffffff', '#29d8ff')}</g></g>
</svg>`;
}

/** オンライン説明会の申込ページ（/webinar/）。content/webinar.json の内容から生成する */
export function webinarPage({ site, config = {} }) {
  const rootRel = '../';
  const name = config.title || 'CAREECON Plus 販売パートナー オンライン説明会';
  const title = `${name}｜申込フォーム｜${SITE_NAME}`;
  const lead = config.lead || 'CAREECON Plus の販売パートナー制度について、オンラインでご説明します。';
  const description = truncate(`${name}の申込ページです。提携モデルや本部の支援内容、開始までの流れをオンラインでご説明します。加盟金・初期費用不要。`, 120);
  const sessions = (config.sessions || []).map((s) => String(s.label ?? '').trim()).filter(Boolean);
  const agenda = (config.agenda || []).filter((a) => a && a.title);
  const sessionField = sessions.length
    ? `<div class="field"><label for="wb-session">参加希望日程 <span>必須</span></label><select id="wb-session" name="session" required><option value="" selected disabled>選択してください</option>${sessions.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></div>`
    : '';
  const dateHtml = sessions.length ? sessions.map((s) => `<span>${esc(s)}</span>`).join('') : '<span>お申し込み後、担当者よりメールでご案内</span>';
  const agendaHtml = agenda.length
    ? `<section class="wb-agenda" aria-labelledby="wb-agenda"><h2 id="wb-agenda"><span>// AGENDA</span>説明会の内容</h2><ol>${agenda.map((a) => `<li><b>${esc(a.title)}</b>${a.text ? `<p>${esc(a.text)}</p>` : ''}</li>`).join('')}</ol></section>`
    : '';
  const body = `<main class="page-webinar-main">
  <div class="wb-split">
    <div class="wb-left">
      <svg class="wb-mark" viewBox="0 0 315 375" aria-hidden="true" focusable="false">${logoMark('#fff', '#fff')}</svg>
      ${webinarNetwork()}<div class="wb-left-in">
      <nav class="wb-crumb" aria-label="パンくずリスト"><a href="${rootRel}">ホーム</a><span aria-hidden="true">/</span><span aria-current="page">オンライン説明会</span></nav>
      <p class="wb-eyebrow"><i aria-hidden="true"></i>ONLINE SEMINAR</p>
      <p class="wb-catch">${esc(config.catch || '建設業界のエコシステムを、ともにつくる。').replace('、', '、<br>')}</p>
      <h1>${esc(name)}</h1>
      <p class="wb-lead">${esc(lead)}</p>
      <dl class="wb-spec">
        <div><dt><small>FORMAT</small>開催形式</dt><dd><span>オンライン</span></dd></div>
        <div><dt><small>DATE</small>開催日程</dt><dd>${dateHtml}</dd></div>
        <div><dt><small>FOR</small>対象</dt><dd><span>販売パートナーをご検討の企業様</span></dd></div>
      </dl>
      ${agendaHtml}
      <ul class="wb-proof" aria-label="CAREECON Plus の実績">
        <li><b>3,000<small>社以上</small></b><span>導入実績</span></li>
        <li><b>99.67<small>%</small></b><span>顧客継続率</span></li>
        <li><b>17<small>年以上</small></b><span>建設業界への支援実績</span></li>
      </ul>
      <p class="wb-proof-note">※2026年9月時点／自社調べ</p>
    </div></div>
    <div class="wb-right"><div class="wb-right-in">
      <div class="form-card webinar-form-card" id="apply">
        <div class="form-tag"><i aria-hidden="true"></i>ENTRY FORM</div>
        <h2>説明会に申し込む</h2>
        <p>必要事項をご入力のうえ、お申し込みください。</p>
        <form class="lead-form" data-webinar-form aria-label="オンライン説明会 申込フォーム" method="post" action="#apply" novalidate>
          <noscript><p>お申し込みにはJavaScriptを有効にしてください。</p></noscript>
          ${sessionField}
          <div class="field"><label for="wb-company">会社名 <span>必須</span></label><input autocomplete="organization" id="wb-company" name="company" placeholder="例）株式会社〇〇商事" required></div>
          <div class="field"><label for="wb-name">お名前 <span>必須</span></label><input autocomplete="name" id="wb-name" name="name" placeholder="例）山田 太郎" required></div>
          <div class="field"><label for="wb-email">メールアドレス <span>必須</span></label><input autocomplete="email" id="wb-email" name="email" placeholder="example@company.co.jp" required type="email"></div>
          <div class="field"><label for="wb-phone">電話番号 <span>必須</span></label><input autocomplete="tel" id="wb-phone" name="phone" placeholder="例）03-0000-0000" required inputmode="tel" type="tel"></div>
          <div class="field"><label for="wb-question">ご質問・ご要望 <em>任意</em></label><textarea id="wb-question" name="question" rows="3" maxlength="500" placeholder="事前に聞きたいことがあればご記入ください"></textarea></div>
          <label class="consent"><input type="checkbox" name="privacy_consent" required><span><a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>に同意のうえ送信</span></label>
          <button class="btn" type="submit">説明会に申し込む <span class="arrow">→</span></button>
          <p data-form-msg role="alert" hidden></p>
        </form>
      </div>
    </div></div>
  </div>
</main>`;
  const crumbs = site.siteUrl
    ? [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${site.siteUrl}/` },
        { '@type': 'ListItem', position: 2, name, item: absUrl(site, 'webinar/') },
      ] }]
    : [];
  return layout({ site, rootRel, title, description, canonicalRel: 'webinar/', ogImage: imageUrl(site, 'assets/images/og-image.jpg'), jsonld: crumbs, body, bodyClass: 'page-webinar', extraCss: ['webinar.css'], scripts: `<script src="${rootRel}assets/js/webinar-form.js" defer></script>` });
}
