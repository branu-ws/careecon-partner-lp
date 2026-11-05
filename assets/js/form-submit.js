
/*
 * CAREECON+ パートナーLP：フォーム送信 → Googleフォーム連携
 *
 * ページ内のすべてのフォーム（ヒーロー／下部CTA／個別相談モーダル）の送信を
 * Googleフォームの回答として送ります。デザインシステム側は改造していません。
 *
 * 【設定方法】下の CONFIG の2か所を、作成したGoogleフォームの値に書き換えてください。
 *   formUrl : Googleフォームの送信先URL（…/forms/d/e/＜フォームID＞/formResponse）
 *   entries : 各質問の entry.数字（「事前入力したURLを取得」で確認できます）
 *
 * 【注意】Googleフォームへの直接POSTは非公式の使い方のため、ブラウザ側では
 * 送信の成否を判定できません（通信エラー時のみエラー表示）。
 * 受信確認は、Googleフォームの「回答」タブ／スプレッドシートで行ってください。
 */
(function () {
  'use strict';

  var CONFIG = {
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd5Np8OUyEJRBLLlTWOmR9ZG0h5IVFRtvoJkmFfnIPUYbZI5Q/formResponse',
    entries: {
      company: 'entry.609139208',  // 会社名
      name: 'entry.920544992',     // お名前
      email: 'entry.1830845583',   // メールアドレス
      phone: 'entry.985139572',    // 電話番号
      purpose: 'entry.408779846',  // 資料請求目的（ラジオ。最後の選択肢「その他」は自由記述つき）
      type: 'entry.475408195'      // 種別（「資料請求」または「個別相談」）
    }
  };

  var PRIVACY_URL = 'https://partner.careecon-plus.com/privacy/';

  var MESSAGES = {
    notReady: '現在フォームの準備中です。恐れ入りますが、しばらくしてからお試しください。',
    required: function (label) { return label + 'を入力してください。'; },
    email: 'メールアドレスの形式をご確認ください。',
    phone: '電話番号の形式をご確認ください。',
    purpose: '資料請求の目的を選択してください。',
    purposeOther: 'その他の内容をご記入ください。',
    consent: 'プライバシーポリシーへの同意が必要です。チェックを入れてください。',
    network: '送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。'
  };

  // フィールド名 → 送信項目（_m / 2 などの接尾辞はフォームごとの重複回避用）
  function fieldKey(name) {
    var n = String(name || '').replace(/(_m|2)$/, '');
    if (n === 'company') return 'company';
    if (n === 'last_name' || n === 'name') return 'name';
    if (n === 'email') return 'email';
    if (n === 'phone') return 'phone';
    if (n === 'purpose') return 'purpose';
    if (n === 'purpose_other') return 'purposeOther';
    return null;
  }

  var OTHER_CHOICE = 'その他';

  var LABELS = { company: '会社名', name: 'お名前', email: 'メールアドレス', phone: '電話番号' };

  function isConfigured() {
    if (!/^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/formResponse/.test(CONFIG.formUrl)) return false;
    return Object.keys(CONFIG.entries).every(function (k) { return /^entry\.\d+$/.test(CONFIG.entries[k]); });
  }

  // パネル見出しから種別を判定（モーダルは「個別相談を予約する」）
  function detectType(form) {
    var head = form.previousElementSibling;
    var text = head ? head.textContent : '';
    return /個別相談/.test(text) ? '個別相談' : '資料請求';
  }

  function collect(form) {
    var values = {};
    var inputs = form.querySelectorAll('input[name], textarea[name]');
    for (var i = 0; i < inputs.length; i++) {
      var key = fieldKey(inputs[i].name);
      if (!key) continue;
      if (inputs[i].type === 'radio' && !inputs[i].checked) continue;
      values[key] = String(inputs[i].value || '').trim();
    }
    return values;
  }

  function validate(values) {
    var order = ['company', 'name', 'email', 'phone'];
    for (var i = 0; i < order.length; i++) {
      if (!values[order[i]]) return MESSAGES.required(LABELS[order[i]]);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return MESSAGES.email;
    var digits = values.phone.replace(/[^0-9０-９]/g, '');
    if (digits.length < 9 || digits.length > 15) return MESSAGES.phone;
    if (!values.purpose) return MESSAGES.purpose;
    if (values.purpose === OTHER_CHOICE && !values.purposeOther) return MESSAGES.purposeOther;
    return null;
  }

  // 「プライバシーポリシーに同意のうえ送信」チェックボックスを、送信ボタンの直前に差し込む。
  // フォーム部品（デザインシステム）は改造せず、表示されたフォームごとに後から追加する。
  function ensureConsent() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form.querySelector('[data-consent]')) continue;
      var btn = form.querySelector('button[type="submit"]');
      if (!btn || !form.querySelector('input[name]')) continue;

      var label = document.createElement('label');
      label.setAttribute('data-consent', '');
      label.style.cssText = 'display:flex; align-items:flex-start; gap:8px; margin:4px 0 2px; color:#182b50; font-family:var(--font-body); font-size:13px; line-height:1.6; cursor:pointer;';

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.name = 'privacy_consent';
      box.required = true;
      box.setAttribute('aria-label', 'プライバシーポリシーに同意のうえ送信');
      box.style.cssText = 'width:16px; height:16px; margin:3px 0 0; flex-shrink:0; cursor:pointer; accent-color:#244EFF;';
      box.addEventListener('change', function () { clearError(this.form); });

      var text = document.createElement('span');
      var link = document.createElement('a');
      link.href = PRIVACY_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'プライバシーポリシー';
      link.style.cssText = 'color:#244EFF; text-decoration:underline;';
      var tail = document.createTextNode('に同意のうえ送信 ');
      text.appendChild(link);
      text.appendChild(tail);


      label.appendChild(box);
      label.appendChild(text);
      form.insertBefore(label, btn);
    }
  }

  function messageEl(form) {
    var el = form.querySelector('[data-form-msg]');
    if (!el) {
      el = document.createElement('p');
      el.setAttribute('data-form-msg', '');
      el.setAttribute('role', 'alert');
      el.style.cssText = 'margin:2px 0 0; padding:8px 12px; border-radius:6px; background:#fff; color:#c0262d; font-size:13px; font-weight:700; line-height:1.6;';
      form.appendChild(el);
    }
    return el;
  }

  function showError(form, text) {
    var el = messageEl(form);
    el.textContent = text;
    el.style.display = '';
  }

  function clearError(form) {
    var el = form.querySelector('[data-form-msg]');
    if (el) el.style.display = 'none';
  }

  // 送信が済んだら完了ページへ移動する（計測用。移動先ではGA4の generate_lead を1回だけ送る）
  function showDone(form) {
    try { sessionStorage.setItem('careecon_lead', detectType(form)); } catch (e) {}
    window.location.assign(new URL('thanks/', document.baseURI).href);
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? '.6' : '';
    btn.style.cursor = busy ? 'wait' : 'pointer';
  }


  // 「その他」を選んだときだけ自由記述欄を出し、必須にする
  function syncOther(form) {
    var box = form.querySelector('.choice-other');
    if (!box) return;
    var checked = form.querySelector('input[type="radio"][name^="purpose"]:checked');
    var on = !!checked && checked.value === OTHER_CHOICE;
    box.hidden = !on;
    var ta = box.querySelector('textarea');
    if (ta) ta.required = on;
  }

  function syncAll() {
    var forms = document.querySelectorAll('form.lead-form');
    for (var i = 0; i < forms.length; i++) syncOther(forms[i]);
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'radio' || !t.form || !/^purpose/.test(t.name)) return;
    syncOther(t.form);
    clearError(t.form);
  });

  function send(values, type) {
    var body = new URLSearchParams();
    body.append(CONFIG.entries.company, values.company);
    body.append(CONFIG.entries.name, values.name);
    body.append(CONFIG.entries.email, values.email);
    body.append(CONFIG.entries.phone, values.phone);
    // Googleフォームのラジオ「その他」は、特別な値 __other_option__ ＋ 自由記述（.other_option_response）で送る
    if (values.purpose === OTHER_CHOICE) {
      body.append(CONFIG.entries.purpose, '__other_option__');
      body.append(CONFIG.entries.purpose + '.other_option_response', values.purposeOther);
    } else {
      body.append(CONFIG.entries.purpose, values.purpose);
    }
    body.append(CONFIG.entries.type, type);
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
    if (!form || form.tagName !== 'FORM' || !form.matches('.lead-form')) return;
    // 常にページ遷移を止める（入力内容がURLに載るのを防ぐ）
    e.preventDefault();

    if (form.getAttribute('data-sending') === '1') return;

    if (!isConfigured()) {
      if (window.console) console.warn('[form-submit] CONFIG が未設定です。form-submit.js を編集してください。');
      showError(form, MESSAGES.notReady);
      return;
    }

    var values = collect(form);
    var problem = validate(values);
    if (problem) {
      showError(form, problem);
      return;
    }
    ensureConsent();
    var consent = form.querySelector('[data-consent] input');
    if (!consent || !consent.checked) {
      showError(form, MESSAGES.consent);
      return;
    }
    clearError(form);

    form.setAttribute('data-sending', '1');
    setBusy(form, true);
    send(values, detectType(form)).then(function () {
      showDone(form);
    }).catch(function () {
      showError(form, MESSAGES.network);
    }).then(function () {
      form.removeAttribute('data-sending');
      setBusy(form, false);
    });
  }, true);

  // 初回表示と、モーダルなど後から現れるフォームの両方にチェックボックスを付ける
  ensureConsent();
  syncAll();
  if (window.MutationObserver) {
    new MutationObserver(ensureConsent).observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', function () { ensureConsent(); syncAll(); });
})();

