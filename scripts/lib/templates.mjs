// ブログのHTMLテンプレート（一覧・記事・固定ページ）。LPと同じヘッダー・フッター・CSSを使う。
import { esc, jaDate, jsonForScript, truncate, ymdJst } from './util.mjs';
import { gaTag, JUICER_TAG } from './tracking.mjs';

export const SITE_NAME = 'CAREECON Plus 販売パートナープログラム';
// プライバシーポリシー（全ページ・フォーム共通。固定ページ content/pages/privacy.md から /privacy/ に生成される）
export const PRIVACY_URL = 'https://partner.careecon-plus.com/privacy/';
const ORG = { '@type': 'Organization', name: 'BRANU, Inc.', url: 'https://branu.jp/' };
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
  ['partners', '対象企業'],
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
  return `<footer class="site-footer"><div class="wrap"><div class="footer-main"><div class="footer-brand"><a class="footer-logo" href="${rootRel}#top" aria-label="CAREECON Plus 販売パートナープログラム トップへ"><img src="${rootRel}assets/images/careeconplus_logo.png" alt="CAREECON Plus" width="2048" height="375" loading="lazy"><span>販売パートナープログラム</span></a><p class="footer-company">運営会社：BRANU株式会社</p><p class="footer-vision">建設業界をテクノロジーでアップデートする。</p></div><nav class="footer-nav" aria-label="フッターナビゲーション"><a href="${rootRel}#partner-guide">パートナー検討ガイド</a>${NAV.filter(([id]) => id !== 'partner-guide').map(([id, label]) => `<a href="${rootRel}#${id}">${label}</a>`).join('')}<a href="${rootRel}blog/">ガイド一覧</a></nav><div class="footer-contact"><p>パートナー制度について</p><a class="btn" href="${rootRel}#request">資料を請求する <span aria-hidden="true">→</span></a><small>担当者より個別にご案内します。</small></div></div><div class="footer-bottom"><a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">プライバシーポリシー<span class="visually-hidden">（新しいタブで開きます）</span></a><a class="footer-to-top" href="${rootRel}#top">ページ上部へ <span aria-hidden="true">↑</span></a><small>© BRANU Inc. All Rights Reserved.</small></div></div></footer>`;
}

function layout({ site, rootRel, title, description, canonicalRel, ogImage, ogType = 'website', jsonld = [], noindex = false, body, bodyClass = '', scripts = '' }) {
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
${JUICER_TAG}
${gaTag(site.gaId)}
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

function card(meta, rootRel) {
  const href = `${rootRel}blog/${meta.slug}/`;
  const thumb = meta.coverFile ? `<a class="card-thumb" href="${href}" tabindex="-1" aria-hidden="true"><img src="${rootRel}blog/${meta.slug}/${esc(meta.coverFile)}" alt="" loading="lazy" decoding="async"${meta.coverW && meta.coverH ? ` width="${meta.coverW}" height="${meta.coverH}"` : ''}></a>` : '';
  return `<li class="card">
  ${thumb}
  <div class="card-body">
    <p class="meta"><time datetime="${ymdJst(meta.published)}">${jaDate(meta.published)}</time></p>
    <h2 class="card-title"><a href="${href}">${esc(meta.title)}</a></h2>
    <p class="card-desc">${esc(meta.description)}</p>
    ${tagList(meta)}
  </div>
</li>`;
}

export function blogIndexPage({ site, articles }) {
  const rootRel = '../';
  const title = `パートナー検討ガイド｜${SITE_NAME}`;
  const description = '提案の進め方や提携前の確認事項など、販売パートナーを検討するための情報をご紹介します。CAREECON Plus 販売パートナープログラムのガイドです。';
  const list = articles.length
    ? `<ul class="cards">\n${articles.map((a) => card(a, rootRel)).join('\n')}\n</ul>`
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
  return layout({ site, rootRel, title, description, canonicalRel: 'blog/', ogImage: imageUrl(site, 'assets/images/og-image.png'), jsonld, noindex: articles.length === 0, body, bodyClass: 'page-blog' });
}

export function articlePage({ site, article, html, headings, related }) {
  const rootRel = '../../';
  const title = article.seoTitle || `${article.title}｜${SITE_NAME}`;
  const description = truncate(article.description || article.fallbackDescription || article.title, 120);
  const rel = `blog/${article.slug}/`;
  const ogImage = article.coverFile ? imageUrl(site, `${rel}${article.coverFile}`) : imageUrl(site, 'assets/images/og-image.png');

  const toc = headings.filter((h) => h.level === 2);
  const tocHtml = toc.length >= 3
    ? `<nav class="toc" aria-label="目次"><p class="toc-title">目次</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav>`
    : '';
  const cover = article.coverFile
    ? `<figure class="cover"><img src="${esc(article.coverFile)}" alt=""${article.coverW && article.coverH ? ` width="${article.coverW}" height="${article.coverH}"` : ''} decoding="async" fetchpriority="high"></figure>`
    : '';
  const relatedHtml = related.length
    ? `<section class="related" aria-labelledby="related-title"><h2 id="related-title">新着記事</h2><ul class="cards">\n${related.map((a) => card(a, rootRel)).join('\n')}\n</ul></section>`
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
  return layout({ site, rootRel, title, description, canonicalRel: rel, ogImage, ogType: 'article', jsonld: [posting, ...crumbs], body, bodyClass: 'page-article' });
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
  return layout({ site, rootRel, title, description, canonicalRel: `${page.slug}/`, ogImage: imageUrl(site, 'assets/images/og-image.png'), body, bodyClass: 'page-static' });
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
    ${latest ? `<div class="thanks-guide"><p class="thanks-guide-title">連絡を待つ間に読めるガイド</p><ul>\n${latest}\n</ul></div>` : ''}
  </div>
</main>`;
  // フォーム送信直後の1回だけ、GA4に generate_lead を送る（直接アクセス・再読み込みでは送らない）
  const scripts = `<script>(function(){try{var t=sessionStorage.getItem('careecon_lead');if(!t)return;sessionStorage.removeItem('careecon_lead');if(window.gtag)window.gtag('event','generate_lead',{form_type:t});}catch(e){}})();</script>`;
  return layout({ site, rootRel, title, description, canonicalRel: 'thanks/', ogImage: imageUrl(site, 'assets/images/og-image.png'), noindex: true, body, bodyClass: 'page-thanks', scripts });
}
