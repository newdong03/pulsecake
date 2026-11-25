/* Meet your Cake — booth experience
 * Flow: main → loading → result → reply1 → reply2 (+ QR → phone viewer)
 * Message analysis: /api/classify (Claude Haiku) with an offline keyword fallback.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- data
  // 4 cake types. cake index == assets/cakeN.webp / sliceN.webp / cardN.webp
  var TYPES = [
    { id: 'warm', cake: 1, sub: '하루의 끝에 닿는', title: '해 질 녘 조개 케이크',
      chips: ['다정함', '노을'], slot: '고마움',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '에 담긴 다정함이 느껴졌어요. 그래서 노을빛 파도와 조개를 얹었어요.'; } },
    { id: 'love', cake: 2, sub: '살며시 피어나는', title: '봄날의 안부 케이크',
      chips: ['설렘', '봄날'], slot: '그리움',
      desc: function (p, k) { return "'" + p + "'" + josa(p, '이라는', '라는') + ' 말이 봄꽃처럼 ' + k + '의 기억으로 오래 남았어요. 그래서 꽃잎을 올린 케이크를 구웠어요.'; } },
    { id: 'cheer', cake: 3, sub: '마음이 시원해지는', title: '청량한 파도 케이크',
      chips: ['활기', '청량함'], slot: '웃음',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '처럼 환하게 번지는 활기가 느껴졌어요. 그래서 물빛 크림과 조개를 올렸어요.'; } },
    { id: 'steady', cake: 4, sub: '천천히 걷고 싶은', title: '풀잎 소풍 케이크',
      chips: ['든든함', '편안함'], slot: '믿음',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '만큼 든든한 마음이 느껴졌어요. 그래서 초록빛 크림과 잎을 얹었어요.'; } }
  ];

  // offline fallback dictionary (used only when the AI call fails)
  var DICT = [
    ['고마', '감사', '챙겨', '곁', '옆에', '함께', '따뜻', '다정', '걱정', '보살', '밥', '간식', '선물', '늘 ', '항상', '노을', '바다'],
    ['예쁘', '이쁘', '사랑', '좋아', '설레', '보고싶', '보고 싶', '그립', '추억', '처음', '웃는', '귀엽', '반짝', '벚꽃', '봄', '꽃', '두근'],
    ['웃', 'ㅋㅋ', '재밌', '재미', '신나', '응원', '화이팅', '파이팅', '힘내', '에너지', '놀', '여행', '노래방', '운동', '파티', '최고', '대박', '시원'],
    ['믿', '든든', '위로', '힘이 됐', '힘이 되', '괜찮', '성장', '인정', '지켜', '버텨', '기대', '안심', '편안', '묵묵', '산책', '이겨', '해낼', '할 수 있', '쉬어']
  ];
  var NOUNS = ['간식', '편지', '선물', '노래방', '노래', '여행', '웃음', '응원', '믿음', '위로', '추억', '미소', '산책', '바다', '벚꽃', '봄', '밤', '밥', '커피', '친구', '시험', '사진', '목소리', '말'];

  // ---------------------------------------------------------------- helpers
  var $ = function (s) { return document.querySelector(s); };
  var state = { cake: 1, text: '', phrase: '', keyword: '', reply: '', typeIdx: 0 };

  function josa(word, withBatchim, without) {
    for (var i = word.length - 1; i >= 0; i--) {
      var c = word.charCodeAt(i);
      if (c >= 0xAC00 && c <= 0xD7A3) return ((c - 0xAC00) % 28) ? withBatchim : without;
    }
    return withBatchim;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function b64enc(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64dec(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src;
    });
  }

  // ---------------------------------------------------------------- stage fit
  var stage = $('#stage');
  function fit() {
    var s = Math.min(window.innerWidth / 834, window.innerHeight / 1194);
    stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit); fit();

  // ---------------------------------------------------------------- screens
  var screens = {
    main: $('#s-main'), loading: $('#s-loading'), result: $('#s-result'),
    reply1: $('#s-reply1'), reply2: $('#s-reply2')
  };
  var current = 'main';
  function go(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('active', k === name); });
    current = name;
    unlift();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  // ---------------------------------------------------------------- inputs
  var liftTimer = null;
  function unlift() { clearTimeout(liftTimer); stage.classList.remove('typing'); }
  function bindField(inputSel, cntSel, btnSel, max) {
    var inp = $(inputSel), cnt = $(cntSel), btn = $(btnSel);
    function upd() {
      var n = inp.value.length;
      cnt.textContent = '(' + n + '/' + max + ')';
      btn.disabled = inp.value.trim().length === 0;
    }
    inp.addEventListener('input', upd);
    inp.addEventListener('focus', function () { clearTimeout(liftTimer); stage.classList.add('typing'); });
    // do NOT drop the lift right away: the tap that blurs the field must still land on the (lifted) button
    inp.addEventListener('blur', function () { clearTimeout(liftTimer); liftTimer = setTimeout(unlift, 1600); });
    upd();
    return { inp: inp, reset: function () { inp.value = ''; upd(); } };
  }
  var fMain = bindField('#in-main', '#cnt-main', '#btn-submit-main', 200);
  var fReply = bindField('#in-reply', '#cnt-reply', '#btn-submit-reply', 50);

  // tap on empty area closes the keyboard; pressing a button keeps the layout still until the click lands
  stage.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (t.closest && t.closest('.btn')) { clearTimeout(liftTimer); return; }
    if (t.tagName !== 'TEXTAREA') {
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') document.activeElement.blur();
      unlift();
    }
  });

  // ---------------------------------------------------------------- analysis
  function localClassify(text) {
    var scores = [0, 0, 0, 0];
    DICT.forEach(function (words, i) {
      words.forEach(function (w) { if (text.indexOf(w) >= 0) scores[i]++; });
    });
    var best = 0, tie = false;
    for (var i = 1; i < 4; i++) {
      if (scores[i] > scores[best]) { best = i; tie = false; }
      else if (scores[i] === scores[best]) tie = true;
    }
    if (scores[best] === 0 || (tie && scores[best] === 0)) best = 0;
    var kw = '';
    for (var n = 0; n < NOUNS.length; n++) { if (text.indexOf(NOUNS[n]) >= 0) { kw = NOUNS[n]; break; } }
    var phrase;
    var ki = kw ? text.indexOf(kw) : -1;
    if (ki >= 0) { // short window ending at the keyword, trimmed to a word boundary
      var end = ki + kw.length, start = Math.max(0, end - 12);
      if (start > 0 && text.charAt(start - 1) !== ' ') {
        var sp = text.indexOf(' ', start); start = (sp >= 0 && sp < end) ? sp + 1 : start;
      }
      phrase = text.slice(start, end).trim();
    } else {
      var clause = (text.split(/[.,!?~\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 3; })[0]) || text.trim();
      phrase = clause.length > 16 ? clause.slice(0, 15).trim() + '…' : clause;
    }
    return { type: best, phrase: phrase, keyword: kw };
  }

  function aiClassify(text) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 7000);
    return fetch('api/classify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }), signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('api ' + r.status);
      return r.json();
    }).then(function (d) {
      if (typeof d.type !== 'number' || d.type < 0 || d.type > 3) throw new Error('bad type');
      return { type: d.type, phrase: String(d.phrase || '').slice(0, 20), keyword: String(d.keyword || '').slice(0, 8) };
    });
  }

  function analyze(text) {
    return aiClassify(text).catch(function () { return localClassify(text); });
  }

  // ---------------------------------------------------------------- result
  function showResult(res) {
    var t = TYPES[res.type];
    var phrase = (res.phrase || '').trim() || '그 한 마디';
    var kw = (res.keyword || '').trim();
    if (!kw || t.chips.indexOf(kw) >= 0) kw = t.slot;
    state.typeIdx = res.type; state.cake = t.cake; state.phrase = phrase; state.keyword = kw;

    $('#r-sub').textContent = t.sub;
    $('#r-title').textContent = t.title;
    $('#r-cake').src = 'assets/cake' + t.cake + '.webp';
    $('#r-desc').textContent = t.desc(phrase, kw);
    var chips = $('#r-chips'); chips.innerHTML = '';
    t.chips.concat([kw]).forEach(function (c) {
      var el = document.createElement('span'); el.className = 'chip'; el.textContent = c; chips.appendChild(el);
    });
    $('#r1-slice').src = 'assets/slice' + t.cake + '.webp';
    go('result');
  }

  // ---------------------------------------------------------------- card (canvas)
  function wrapLines(ctx, text, maxW) {
    var lines = [], line = '';
    var words = text.split(/\s+/);
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxW) { line = test; return; }
      if (line) lines.push(line);
      if (ctx.measureText(w).width <= maxW) { line = w; return; }
      // long word: break by character
      line = '';
      Array.from(w).forEach(function (ch) {
        if (ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; } else line += ch;
      });
    });
    if (line) lines.push(line);
    return lines;
  }

  function renderCard(cake, text) {
    var fam = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    return Promise.all([
      document.fonts.load('600 56px Pretendard', text),
      loadImg((window.CARD_DATA && window.CARD_DATA[cake]) || ('assets/card' + cake + '.webp'))
    ]).then(function (arr) {
      var img = arr[1];
      var c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var size = Array.from(text).length <= 20 ? 68 : 56;
      var maxW = c.width * 0.86;
      var lines;
      for (;;) {
        ctx.font = '600 ' + size + 'px ' + fam;
        lines = wrapLines(ctx, text, maxW);
        if (lines.length <= 3 || size <= 38) break;
        size -= 2;
      }
      var lh = size * 1.4;
      var cy = c.height * (lines.length > 2 ? 0.74 : 0.754);
      ctx.fillStyle = '#555555'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach(function (ln, i) { ctx.fillText(ln, c.width / 2, cy + (i - (lines.length - 1) / 2) * lh); });
      return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, url: URL.createObjectURL(b) }); }, 'image/png'); });
    });
  }

  // ---------------------------------------------------------------- QR
  function cardLink() {
    var base = location.href.split('#')[0];
    return base + '#c=' + state.cake + '&m=' + b64enc(state.reply);
  }
  function showQR() {
    var qr = qrcode(0, 'M');
    qr.addData(cardLink()); qr.make();
    var svg = qr.createSvgTag(4, 0);
    var box = $('#qr-box'); box.innerHTML = svg;
    var el = box.querySelector('svg');
    if (el) {
      if (!el.getAttribute('viewBox')) el.setAttribute('viewBox', '0 0 ' + el.getAttribute('width') + ' ' + el.getAttribute('height'));
      el.removeAttribute('width'); el.removeAttribute('height');
    }
    $('#qr-modal').classList.add('open');
  }
  function closeQR() { $('#qr-modal').classList.remove('open'); }

  // ---------------------------------------------------------------- reset
  var runId = 0;
  function reset() {
    runId++;
    closeQR(); fMain.reset(); fReply.reset();
    state.text = ''; state.reply = '';
    go('main');
  }

  // ---------------------------------------------------------------- events
  $('#btn-submit-main').addEventListener('click', function () {
    var text = fMain.inp.value.trim().slice(0, 200);
    if (!text) return;
    state.text = text;
    var my = ++runId;
    go('loading');
    Promise.all([analyze(text), sleep(2600)]).then(function (a) {
      if (my !== runId) return;
      showResult(a[0]);
    });
  });
  $('#btn-finish-result').addEventListener('click', reset);
  $('#btn-reply').addEventListener('click', function () { fReply.reset(); go('reply1'); });
  $('#btn-submit-reply').addEventListener('click', function () {
    var text = fReply.inp.value.trim().slice(0, 50);
    if (!text) return;
    state.reply = text;
    renderCard(state.cake, text).then(function (r) {
      $('#r2-card').src = r.url;
      go('reply2');
    }).catch(function (err) {
      console.error('card render failed', err);
      alert('카드를 만들지 못했어요. 한 번 더 눌러주세요.');
    });
  });
  $('#btn-download').addEventListener('click', showQR);
  $('#btn-qr-close').addEventListener('click', closeQR);
  $('#qr-modal').addEventListener('click', function (e) { if (e.target === this) closeQR(); });
  $('#btn-finish-reply').addEventListener('click', reset);
  $('#symbol').addEventListener('click', reset);

  // ---------------------------------------------------------------- preload
  ['bg'].forEach(function (n) { loadImg('assets/' + n + '.webp').catch(function () {}); });
  for (var i = 1; i <= 4; i++) {
    ['cake', 'slice', 'card'].forEach(function (p) { loadImg('assets/' + p + i + '.webp').catch(function () {}); });
  }

  // ---------------------------------------------------------------- routing: phone viewer / debug
  function params() {
    var o = {}; location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var p = kv.split('='); if (p[0]) o[p[0]] = p.slice(1).join('=');
    }); return o;
  }
  function boot() {
    var p = params();
    if (p.m && p.c) { // opened from QR on a phone
      var cake = Math.min(4, Math.max(1, parseInt(p.c, 10) || 1));
      var text = ''; try { text = b64dec(p.m); } catch (e) { text = ''; }
      document.body.classList.add('viewer');
      renderCard(cake, text.slice(0, 50)).then(function (r) {
        var img = $('#v-card'); img.src = r.url;
        $('#v-save').addEventListener('click', function () {
          var file = new File([r.blob], 'pulse-card.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file] }).catch(function () {});
          } else {
            var a = document.createElement('a'); a.href = r.url; a.download = 'pulse-card.png';
            document.body.appendChild(a); a.click(); a.remove();
          }
        });
      });
      return;
    }
    if (p.s) { // debug: #s=result&c=2&t=텍스트
      var idx = Math.min(3, Math.max(0, (parseInt(p.c, 10) || 1) - 1));
      var sample = p.t ? decodeURIComponent(p.t) : '시험 기간에 말없이 간식 챙겨준 게 제일 고마웠어';
      state.text = sample;
      if (p.s === 'result' || p.s === 'reply1' || p.s === 'reply2') {
        showResult({ type: idx, phrase: p.ph ? decodeURIComponent(p.ph) : '말없이 챙겨준 간식', keyword: p.k ? decodeURIComponent(p.k) : '' });
        if (p.s === 'reply1') go('reply1');
        if (p.s === 'reply2') {
          state.reply = p.r ? decodeURIComponent(p.r) : '고마워 내가 정말 아끼는 거 알지?';
          renderCard(state.cake, state.reply).then(function (r) { $('#r2-card').src = r.url; go('reply2'); if (p.q) showQR(); });
        }
      } else if (p.s === 'loading') { go('loading'); }
    }
  }
  boot();
})();
