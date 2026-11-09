/*
 * CAREECON+ パートナーLP：オンライン説明会の申込フォーム（/webinar/）→ Googleフォーム連携
 *
 * 資料請求フォーム（form-submit.js）とは別のGoogleフォームに送ります（回答が混ざらないようにするため）。
 *
 * 【設定方法】下の CONFIG を、説明会用Googleフォームの値に書き換えてください。
 *   formUrl : 送信先URL（…/forms/d/e/＜フォームID＞/formResponse）
 *   entries : 各質問の entry.数字（「事前入力したURLを取得」で確認できます）
 *   session : 日程を選ばせる場合のみ。選択肢の文言は content/webinar.json の label と一字一句同じにすること
 *   department / position : 部署名（任意）・役職（必須）の質問
 *
 * 送信の成否はブラウザ側では判定できません（通信エラー時のみエラー表示）。
 * 受信確認は、Googleフォームの「回答」タブ／スプレッドシートで行ってください。
 */
(function () {
  'use strict';

  var CONFIG = {
    formUrl: '',
    entries: {
      company: '',   // 会社名
      department: '',// 部署名（任意）
      position: '',  // 役職
      name: '',      // お名前
      email: '',     // メールアドレス
      phone: '',     // 電話番号
      session: '',   // 参加希望日程（日程選択を使う場合のみ）
      question: ''   // ご質問・ご要望（任意）
    }
  };

  var MESSAGES = {
    notReady: '現在フォームの準備中です。恐れ入りますが、しばらくしてからお試しください。',
    required: function (label) { return label + 'を入力してください。'; },
    session: '参加希望日程を選択してください。',
    email: 'メールアドレスの形式をご確認ください。',
    phone: '電話番号の形式をご確認ください。',
    consent: 'プライバシーポリシーへの同意が必要です。チェックを入れてください。',
    network: '送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。'
  };
  var LABELS = { company: '会社名', position: '役職', name: 'お名前', email: 'メールアドレス', phone: '電話番号' };

  function isConfigured(hasSession) {
    if (!/^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/formResponse/.test(CONFIG.formUrl)) return false;
    return Object.keys(CONFIG.entries).every(function (k) {
      if (k === 'session' && !hasSession) return true;
      if (k === 'question') return true; // 任意項目。未設定なら送らない
      return /^entry\.\d+$/.test(CONFIG.entries[k]);
    });
  }

  function collect(form) {
    var v = {};
    ['company', 'department', 'position', 'name', 'email', 'phone', 'session', 'question'].forEach(function (k) {
      var el = form.elements[k];
      v[k] = el ? String(el.value || '').trim() : '';
    });
    return v;
  }

  function validate(v, hasSession) {
    var order = ['company', 'position', 'name', 'email', 'phone'];
    for (var i = 0; i < order.length; i++) if (!v[order[i]]) return MESSAGES.required(LABELS[order[i]]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return MESSAGES.email;
    var digits = v.phone.replace(/[^0-9０-９]/g, '');
    if (digits.length < 9 || digits.length > 15) return MESSAGES.phone;
    if (hasSession && !v.session) return MESSAGES.session;
    return null;
  }

  function msgEl(form) { return form.querySelector('[data-form-msg]'); }
  function showError(form, text) { var el = msgEl(form); el.textContent = text; el.hidden = false; }
  function clearError(form) { var el = msgEl(form); if (el) el.hidden = true; }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? '.6' : '';
  }

  function send(v, hasSession) {
    var body = new URLSearchParams();
    body.append(CONFIG.entries.company, v.company);
    if (v.department) body.append(CONFIG.entries.department, v.department);
    body.append(CONFIG.entries.position, v.position);
    body.append(CONFIG.entries.name, v.name);
    body.append(CONFIG.entries.email, v.email);
    body.append(CONFIG.entries.phone, v.phone);
    if (hasSession) body.append(CONFIG.entries.session, v.session);
    if (v.question && /^entry\.\d+$/.test(CONFIG.entries.question)) body.append(CONFIG.entries.question, v.question);
    // no-cors: 応答は読めない（opaque）。通信自体が成功すれば resolve される
    return fetch(CONFIG.formUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches('form[data-webinar-form]')) return;
    e.preventDefault(); // 入力内容がURLに載るのを防ぐ
    if (form.getAttribute('data-sending') === '1') return;

    var hasSession = !!form.elements.session;
    if (!isConfigured(hasSession)) {
      if (window.console) console.warn('[webinar-form] CONFIG が未設定です。webinar-form.js を編集してください。');
      showError(form, MESSAGES.notReady);
      return;
    }
    var v = collect(form);
    var problem = validate(v, hasSession);
    if (problem) { showError(form, problem); return; }
    var consent = form.elements.privacy_consent;
    if (!consent || !consent.checked) { showError(form, MESSAGES.consent); return; }
    clearError(form);

    form.setAttribute('data-sending', '1');
    setBusy(form, true);
    send(v, hasSession).then(function () {
      // 完了ページ（/thanks/）で GA4 の generate_lead を1回だけ送る
      try { sessionStorage.setItem('careecon_lead', 'オンライン説明会'); } catch (err) {}
      window.location.assign(new URL('../thanks/', document.baseURI).href);
    }).catch(function () {
      showError(form, MESSAGES.network);
      form.removeAttribute('data-sending');
      setBusy(form, false);
    });
  }, true);

  document.addEventListener('input', function (e) {
    if (e.target && e.target.form && e.target.form.matches('form[data-webinar-form]')) clearError(e.target.form);
  });
})();
