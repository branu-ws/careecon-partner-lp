// 記事どうしの内部リンク。①記事末尾の「あわせて読みたい」の選び方 ②本文中の自動リンク

export const GROUP_ORDER = [
  ['業種別の提案', '自社の取引先・事業に合わせた、建設業向けSaaSの提案の考え方'],
  ['代理店の始め方・判断', '紹介型と代理販売型の違い、営業工数、社内稟議など、提携前に確認したいこと'],
  ['提案の進め方', '建設会社へのヒアリング、休眠顧客の掘り起こし、提案先の見極め'],
  ['建設DXの基礎', '建設DXやAI活用の基本。提案の前提知識として'],
  ['原価・見積・日報などの業務解説', '建設会社の業務（原価管理・見積・請求・日報・工程表など）を、提案側の視点で解説'],
];

/** 一覧ページ内の見出しID（#g1〜）。GROUP_ORDER の並びで決まる。それ以外は g-other */
export const groupAnchor = (name) => { const i = GROUP_ORDER.findIndex(([g]) => g === name); return i < 0 ? 'g-other' : `g${i + 1}`; };

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** inbound: 他の記事から既にリンクされている数（少ない記事を優先して、リンクが特定の記事に偏らないようにする）
 * 同じグループ → 共通タグの多さ → スラッグから決まる順（毎回同じ結果で、特定の記事に偏らない）で並べて上位を返す */
export function pickRelated(article, all, n = 4, inbound = new Map()) {
  const tags = new Set(article.tags);
  return all
    .filter((m) => m.id !== article.id)
    .map((m) => ({
      m,
      score: (article.group && m.group === article.group ? 100 : 0) + m.tags.filter((t) => tags.has(t)).length * 10 + (article.category && m.category === article.category ? 1 : 0) - (inbound.get(m.slug) || 0) * 4,
      tie: hash(article.slug + '|' + m.slug),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, n)
    .map((x) => x.m);
}

/** 本文中で初めて出てきたキーワードを、関連記事へのリンクにする。長い語を先に判定する */
export const AUTO_LINK_RULES = [
  ['原価管理システム', 'construction-cost-management-system'],
  ['原価管理', 'construction-cost-management'],
  ['工事台帳', 'construction-ledger-basics'],
  ['実行予算', 'execution-budget-basics'],
  ['出来高', 'construction-invoice-progress-billing'],
  ['工程表', 'construction-schedule-chart-basics'],
  ['AI日報', 'construction-daily-report-basics'],
  ['日報', 'construction-daily-report-basics'],
  ['見積書', 'construction-estimate-writing'],
  ['粗利率', 'construction-gross-margin-causes'],
  ['外注費', 'construction-outsourcing-cost-management'],
  ['休眠顧客', 'dormant-customers-follow-up-construction'],
  ['稟議', 'new-product-approval-proposal-template'],
  ['代理販売型', 'referral-vs-reseller-partner-choice'],
  ['建設DX', 'what-is-construction-dx'],
];

const MAX_AUTO_LINKS = 3;

/** <p> の文章中だけを対象に、最大3件までリンクを付ける（見出し・表・既存リンク・自分自身・既にリンク済みの記事は除く） */
export function autoLink(html, { selfSlug, published, rules = AUTO_LINK_RULES, max = MAX_AUTO_LINKS }) {
  const linked = new Set([selfSlug]);
  for (const m of html.matchAll(/href="\.\.\/([a-z0-9-]+)\/"/g)) linked.add(m[1]);
  const usable = rules.filter(([, slug]) => published.has(slug));
  let count = 0;
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (whole, inner) => {
    if (count >= max || /<a\s/.test(inner)) return whole;
    const parts = inner.split(/(<[^>]+>)/);
    let inAnchor = 0;
    for (let i = 0; i < parts.length && count < max; i++) {
      const part = parts[i];
      if (part.startsWith('<')) {
        if (/^<a[\s>]/.test(part)) inAnchor++;
        else if (part === '</a>') inAnchor--;
        continue;
      }
      if (inAnchor) continue;
      for (const [word, slug] of usable) {
        if (linked.has(slug)) continue;
        const at = part.indexOf(word);
        if (at < 0) continue;
        parts[i] = `${part.slice(0, at)}<a href="../${slug}/">${word}</a>${part.slice(at + word.length)}`;
        linked.add(slug);
        count++;
        break;
      }
    }
    return `<p>${parts.join('')}</p>`;
  });
}
