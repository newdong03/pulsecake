/* Meet your Cake — booth experience
 * Flow: main → loading → result → reply1 → reply2 (+ QR → phone viewer)
 * Message analysis: local word dictionary (no API).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- data
  // 4 cake types. cake index == assets/cakeN.webp / sliceN.webp / cardN.webp
  var TYPES = [
    { id: 'warm', cake: 1, sub: '하루의 끝에 닿는', title: '노을빛 파도 케이크',
      chips: ['다정함', '노을'], slot: '고마움', slot2: '정성', quote: '그 한 마디',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '에 담긴 다정함이 느껴졌어요. \n그래서 노을빛 파도를 얹었어요.'; } },
    { id: 'love', cake: 2, sub: '살며시 피어나는', title: '봄날의 안부 케이크',
      chips: ['설렘', '봄날'], slot: '그리움', slot2: '추억', quote: '그 한 마디',
      desc: function (p, k) { return "'" + p + "'" + josa(p, '이라는', '라는') + ' 말이 봄꽃처럼 ' + k + '의 기억으로 오래 남았어요. \n그래서 꽃잎을 올린 케이크를 구웠어요.'; } },
    { id: 'cheer', cake: 3, sub: '마음이 시원해지는', title: '청량한 파도 케이크',
      chips: ['활기', '청량함'], slot: '웃음', slot2: '에너지', quote: '그 한 마디',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '처럼 환하게 번지는 활기가 느껴졌어요. \n그래서 물빛 크림과 파도를 올렸어요.'; } },
    { id: 'steady', cake: 4, sub: '묵묵히 곁을 지켜주는', title: '풀잎 소풍 케이크',
      chips: ['든든함', '편안함'], slot: '믿음', slot2: '위로', quote: '그 한 마디',
      desc: function (p, k) { return "'" + p + "'에서 " + k + '만큼 든든한 마음이 느껴졌어요. \n그래서 초록빛 크림과 잎을 얹었어요.'; } }
  ];

  // ---------------------------------------------------------------- word dictionary
  // Message analysis runs fully in the browser (no API). Each type has a list of word stems;
  // the type with the most distinct matches wins. Edit these lists freely to tune the result.
  var DICT = [
    // 0 다정형 — 고마움, 챙김, 따뜻한 배려
    ['고마', '감사', '챙겨', '챙기', '챙겼', '곁', '옆에', '따뜻', '다정', '걱정', '보살', '배려', '신경 써', '신경써', '마음 써', '마음써',
     '기억해', '잊지 않', '잊지않', '알아봐', '알아주', '알아채', '먼저 연락', '연락해', '전화', '안부', '편지', '손편지', '카드', '선물', '케이크',
     '초대', '준비해', '밥', '간식', '커피', '음료', '미역국', '도시락', '데리러', '바래다', '마중', '밤새', '새벽', '일부러', '말없이', '조용히',
     '늘 ', '항상', '언제나', '한결같', '소중', '행복했', '눈물', '울컥', '뭉클', '감동', '노을', '정성', '손수', '직접 만', '직접 쓴', '직접 골',
     '덕분', '덕에', '받았', '주셔서', '해줘서', '해줬', '해주셔서', '미안', '다독', '품', '포근', '온기', '쌀쌀', '추운', '우산', '담요', '핫팩'],
    // 1 설렘형 — 사랑, 설렘, 그리움, 추억
    ['예쁘', '이쁘', '사랑', '좋아해', '좋아하', '설레', '설렜', '두근', '보고싶', '보고 싶', '그립', '그리웠', '추억', '처음 만', '처음 봤', '첫눈',
     '첫 만남', '웃는 모습', '귀엽', '반짝', '빛나', '벚꽃', '봄', '꽃', '장미', '향기', '사진', '필름', '영화', '데이트', '연애', '고백', '커플',
     '남자친구', '여자친구', '애인', '썸', '로맨', '달콤', '분홍', '핑크', '하트', '스쳐', '마음에 남', '오래 기억', '잊을 수 없', '잊지 못', '떠올',
     '생각나', '생각이 나', '눈이 마주', '눈빛', '심장', '꿈', '별', '달빛', '밤하늘', '노래 가사', '가사', '시간이 멈', '운명', '인연', '미소',
     '아름다', '멋지', '매력', '빠졌', '반했', '반해', '첫사랑', '오래전', '그날', '그때', '옛날', '어릴 때', '어렸을'],
    // 2 활기형 — 웃음, 신남, 에너지, 응원
    ['웃', 'ㅋㅋ', 'ㅎㅎ', '재밌', '재미', '웃겨', '웃기', '폭소', '빵 터', '신나', '신났', '즐거', '즐겼', '응원', '화이팅', '파이팅', '힘내', '힘났',
     '에너지', '활기', '텐션', '놀', '여행', '노래방', '노래', '춤', '운동', '헬스', '러닝', '축구', '농구', '게임', '파티', '클럽', '페스티벌',
     '콘서트', '최고', '대박', '짱', '미쳤', '레전드', '분위기', '시원', '청량', '바다', '여름', '물놀이', '수영', '캠핑', '드라이브', '맛집',
     '먹방', '치맥', '술', '건배', '소리 질', '박수', '함성', '이벤트', '깜짝', '서프라이즈', '장난', '개그', '드립', '밝', '유쾌', '활발',
     '에너제틱', '인싸', '핵', '짜릿', '두근두근', '신선', '새로운', '도전', '모험', '여행지', '불꽃', '폭죽', '축제', '난리', '떠들', '웃음'],
    // 3 든든형 — 믿음, 위로, 곁을 지켜줌, 응원 이상의 버팀
    ['믿', '든든', '위로', '힘이 됐', '힘이 되', '힘이 돼', '괜찮', '성장', '인정', '지켜', '버텨', '기대', '안심', '편안', '묵묵', '산책', '이겨',
     '해낼', '할 수 있', '쉬어', '쉬엄', '용기', '자신감', '포기하지', '포기 안', '끝까지', '같이 있', '곁에 있', '들어줘', '들어주', '들어줬',
     '이야기 들', '고민', '상담', '조언', '충고', '진심', '솔직', '변함', '변치', '오래된', '오랜 친구', '오랫동안', '시간이 지나도', '힘든 시기',
     '힘들 때', '힘들었', '지쳤', '지칠', '어려운', '위기', '시험', '취업', '합격', '졸업', '인턴', '면접', '취준', '도와', '도움', '의지', '버팀목',
     '기둥', '어깨', '토닥', '안아', '안겨', '숲', '나무', '풀', '소풍', '쉼', '휴식', '평온', '차분', '여유', '느긋', '천천히', '믿음직', '책임',
     '약속', '지지', '든든히', '응급', '병원', '아플', '아팠', '몸살', '간호', '함께 있']
  ];
  // literal nouns that can become the 3rd chip (and the end of the quoted phrase), grouped by type
  var NOUNS = [
    ['간식', '편지', '도시락', '커피', '미역국', '밥', '안부', '전화', '카드', '배려', '정성', '노을', '손편지', '우산', '담요'],
    ['벚꽃', '봄', '꽃', '꽃다발', '사진', '추억', '사랑', '미소', '눈빛', '향기', '영화', '데이트', '별', '밤하늘', '첫눈', '그리움', '장미', '가사'],
    ['웃음', '노래방', '노래', '여행', '응원', '바다', '여름', '운동', '춤', '드라이브', '캠핑', '맛집', '게임', '박수', '에너지', '농담', '장난'],
    ['믿음', '위로', '산책', '어깨', '조언', '상담', '고민', '시험', '합격', '졸업', '용기', '숲', '약속', '진심', '지지', '면접', '휴식']
  ];

  // word stems that are not nouns themselves → the noun shown to the user
  var LABEL = {
    '고마': '고마움', '감사': '감사', '챙겨': '챙김', '챙기': '챙김', '챙겼': '챙김', '걱정': '걱정', '배려': '배려', '감동': '감동', '뭉클': '뭉클함', '울컥': '뭉클함',
    '기억해': '기억', '잊지 않': '기억', '정성': '정성', '덕분': '덕분', '온기': '온기', '포근': '포근함',
    '보고싶': '그리움', '보고 싶': '그리움', '그립': '그리움', '그리웠': '그리움', '예쁘': '예쁨', '이쁘': '예쁨', '사랑': '사랑', '좋아해': '좋아함', '좋아하': '좋아함',
    '귀엽': '귀여움', '반짝': '반짝임', '빛나': '반짝임', '고백': '고백', '인연': '인연', '매력': '매력', '첫사랑': '첫사랑', '그날': '그날', '설레': '설렘', '설렜': '설렘', '두근': '설렘',
    '재밌': '재미', '재미': '재미', '웃겨': '웃음', '웃기': '웃음', '웃': '웃음', 'ㅋㅋ': '웃음', '신나': '신남', '신났': '신남', '즐거': '즐거움', '즐겼': '즐거움',
    '응원': '응원', '화이팅': '응원', '파이팅': '응원', '힘내': '응원', '에너지': '에너지', '텐션': '텐션', '도전': '도전', '모험': '모험', '축제': '축제',
    '믿': '믿음', '든든': '든든함', '위로': '위로', '버텨': '버팀', '성장': '성장', '인정': '인정', '안심': '안심', '용기': '용기', '진심': '진심', '도움': '도움', '도와': '도움',
    '조언': '조언', '고민': '고민', '의지': '의지', '묵묵': '묵묵함', '끝까지': '끝까지', '약속': '약속', '책임': '책임', '여유': '여유', '휴식': '휴식'
  };

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
  function hash(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }

  function classify(text) {
    var scores = [0, 0, 0, 0];
    DICT.forEach(function (words, i) {
      words.forEach(function (w) { if (text.indexOf(w) >= 0) scores[i]++; });
    });
    var max = Math.max.apply(null, scores);
    var tied = [];
    scores.forEach(function (v, i) { if (v === max) tied.push(i); });
    // no match or a tie: pick deterministically from the text, so the same message always gives the same cake
    var best = tied.length === 1 ? tied[0] : tied[hash(text) % tied.length];

    // candidate words found in the message, with the type they belong to (very common words like 생일/축하 are never in the lists)
    var cands = [];
    function add(word, pos, type) { if (pos >= 0) cands.push({ w: word, p: pos, t: type }); }
    NOUNS.forEach(function (list, i) { list.forEach(function (n) { add(n, text.indexOf(n), i); }); });
    DICT.forEach(function (list, i) { list.forEach(function (st) { if (LABEL[st]) add(LABEL[st], text.indexOf(st), i); }); });
    cands.sort(function (x, y) { return x.p - y.p; });
    function pick(typeOnly, skip) {
      for (var i = 0; i < cands.length; i++) {
        var c = cands[i];
        if (typeOnly && c.t !== best) continue;
        if (skip.some(function (k) { return k && (k.indexOf(c.w) >= 0 || c.w.indexOf(k) >= 0); })) continue;
        return c.w;
      }
      return '';
    }
    var quoted = pick(true, []) || pick(false, []);
    var kw = pick(true, [quoted]);
    return { type: best, phrase: quoted, keyword: kw };
  }

  function analyze(text) { return Promise.resolve(classify(text)); }

  // ---------------------------------------------------------------- result
  function showResult(res) {
    var t = TYPES[res.type];
    var phrase = (res.phrase || '').trim() || t.quote;
    var kw = (res.keyword || '').trim();
    var taken = t.chips.concat([phrase]);
    if (!kw || taken.indexOf(kw) >= 0) kw = taken.indexOf(t.slot) < 0 ? t.slot : t.slot2;
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
        if ('letterSpacing' in ctx) ctx.letterSpacing = (-0.03 * size) + 'px'; // -3%
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
