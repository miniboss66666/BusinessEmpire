// @ts-nocheck
/* UNDERGROUND/HACK.JS — Minigame chữ rơi */

const UGHack = (() => {

  // Level config: [clickValue, suspPerHack, price, cols, wordLen, speedMult]
  const UPGRADES = [
    { level:1, name:'Script Cơ Bản',   value:500,    susp:2.0, price:0,       cols:6, wordLen:6, speedMult:1.0 },
    { level:2, name:'Keylogger',        value:2500,   susp:1.8, price:5000,    cols:6, wordLen:6, speedMult:0.85 },
    { level:3, name:'Botnet Nhỏ',       value:10000,  susp:1.5, price:25000,   cols:5, wordLen:5, speedMult:0.75 },
    { level:4, name:'Ransomware',       value:50000,  susp:1.2, price:150000,  cols:5, wordLen:5, speedMult:0.65 },
    { level:5, name:'Zero-Day Exploit', value:200000, susp:0.8, price:1000000, cols:4, wordLen:4, speedMult:0.55 },
  ];

  // wordLen 3 chỉ unlock nếu KN node tương ứng đã mở
  // (check bên ngoài khi cần)

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const WORDS = [
    'ACCESS','BYPASS','CIPHER','DECODE','EXPLOIT','FIREWALL',
    'GHOST','HIJACK','INJECT','KERNEL','LOGIC','MALWARE',
    'NEXUS','OVERFLOW','PROXY','QUERY','ROOTKIT','STEALTH',
    'TROJAN','UNLOCK','VECTOR','WORM','XPLOIT','ZERODAY',
    'HACK','CODE','DATA','SCAN','LOOP','PORT',
  ];

  // State minigame
  let _game = null;
  /*
    _game = {
      word: string,          // từ cần gõ đúng
      cols: [{               // mỗi cột
        chars: string[],     // buffer ký tự đang hiển thị (7 dòng)
        speed: number,       // px/tick
        offset: number,      // offset hiện tại (0–CELL_H)
        locked: bool,        // đã bấm lock
        lockedChar: string,  // ký tự bị lock
        targetIdx: number,   // index trong buffer mà ký tự mục tiêu cần ở
      }],
      animId: null,
      result: null,          // null | 'success' | 'fail'
      combo: number,         // số hack thành công liên tiếp
    }
  */

  const CELL_H = 36; // px mỗi ô
  const VISIBLE = 7; // số ô hiển thị mỗi cột
  const CENTER  = 3; // index của hàng giữa (0-based)

  function _s() {
    const u = _ug();
    if (!u.hack) u.hack = { level:1, totalHacks:0 };
    return u.hack;
  }

  function _getLevelCfg() {
    const s = _s();
    const cfg = { ...UPGRADES[s.level - 1] };
    // Check KN buff giảm tốc
    if (typeof KnowledgePage !== 'undefined') {
      // placeholder — sau tích hợp KN
    }
    // Nếu knowledge unlock 3-char
    const kn3char = typeof KnowledgePage !== 'undefined' && KnowledgePage.getBuff?.('hack_3char');
    if (kn3char && cfg.wordLen > 3) cfg.wordLen = Math.max(3, cfg.wordLen - 1);
    return cfg;
  }

  // ── Tạo từ mục tiêu phù hợp với wordLen ──
  function _pickWord(len) {
    const pool = WORDS.filter(w => w.length === len);
    if (pool.length === 0) {
      // Sinh ngẫu nhiên
      let w = '';
      for (let i = 0; i < len; i++) w += CHARS[Math.floor(Math.random() * 26)];
      return w;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── Khởi tạo minigame ──
  function _startGame() {
    if (_game?.animId) cancelAnimationFrame(_game.animId);
    const cfg  = _getLevelCfg();
    const word = _pickWord(cfg.wordLen);

    const cols = Array.from({ length: cfg.wordLen }, (_, ci) => {
      // Tạo buffer đủ dài
      const buf = [];
      for (let i = 0; i < VISIBLE + 2; i++) {
        buf.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
      }
      // Đặt ký tự mục tiêu vào vị trí CENTER trong buffer
      buf[CENTER] = word[ci];

      // Speed ngẫu nhiên mỗi cột, khác nhau
      const baseSpd = 1.2 + Math.random() * 1.8;
      return {
        chars: buf,
        speed: baseSpd * cfg.speedMult,
        offset: 0,
        locked: false,
        lockedChar: null,
        targetIdx: CENTER,
      };
    });

    _game = { word, cols, animId: null, result: null, combo: _game?.combo || 0 };
    _renderGame();
    _runAnim();
  }

  // ── Animation loop ──
  function _runAnim() {
    if (!_game) return;

    _game.animId = requestAnimationFrame(() => {
      _game.cols.forEach((col, ci) => {
        if (col.locked) return;
        col.offset += col.speed;
        if (col.offset >= CELL_H) {
          col.offset -= CELL_H;
          // Scroll chars: drop đầu, thêm cuối
          col.chars.shift();
          col.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
          col.targetIdx--;
          // Nếu target đã qua đỉnh → inject lại xuống dưới
          if (col.targetIdx < 0) {
            col.targetIdx = VISIBLE + 1;
            col.chars[col.targetIdx] = _game.word[ci];
          }
        }
        _updateColDOM(ci, col);
      });

      // Kiểm tra nếu tất cả locked
      if (_game.cols.every(c => c.locked)) {
        _evaluate();
        return;
      }

      if (_game.result === null) _runAnim();
    });
  }

  // ── Cập nhật DOM 1 cột ──
  function _updateColDOM(ci, col) {
    const colEl = document.getElementById(`hack-col-${ci}`);
    if (!colEl) return;

    // Chỉ lấy VISIBLE ký tự kể từ đầu buffer
    const visible = col.chars.slice(0, VISIBLE);

    colEl.querySelectorAll('.hack-char').forEach((el, ri) => {
      const ch = visible[ri] ?? ' ';
      el.textContent = ch;
      const isCenter = ri === CENTER;
      const isTarget = ch === _game.word[ci] && ri === col.targetIdx && col.targetIdx < VISIBLE;
      el.className = 'hack-char' +
        (isCenter ? ' center' : '') +
        (col.locked && isCenter ? ' locked' : '') +
        (isTarget ? ' target' : '');
    });

    // Transform offset
    colEl.style.transform = `translateY(${-col.offset}px)`;
  }

  // ── Render giao diện game ──
  function _renderGame() {
    const gameEl = document.getElementById('hack-game-area');
    if (!gameEl || !_game) return;

    const cfg = _getLevelCfg();

    gameEl.innerHTML = `
      <div class="hack-game">
        <div class="hack-word-target">
          ${_game.word.split('').map((ch, i) => `
            <span class="hack-target-char" id="hack-target-${i}">${ch}</span>
          `).join('')}
        </div>
        <div class="hack-cols-wrap">
          ${_game.cols.map((col, ci) => `
            <div class="hack-col-container" id="hack-col-wrap-${ci}">
              <div class="hack-col" id="hack-col-${ci}">
                ${Array.from({length: VISIBLE}, (_, ri) => `
                  <div class="hack-char ${ri === CENTER ? 'center' : ''}">
                    ${col.chars[ri] ?? ' '}
                  </div>`).join('')}
              </div>
              <button class="hack-lock-btn" data-col="${ci}" ${col.locked ? 'disabled' : ''}>
                ${col.locked ? (col.lockedChar === _game.word[ci] ? '✓' : '✗') : '⬇ LOCK'}
              </button>
            </div>
          `).join('')}
        </div>
        <div class="hack-hint">
          Bấm <b>LOCK</b> khi ký tự mục tiêu rơi vào ô giữa
        </div>
        ${_game.result ? `
          <div class="hack-result ${_game.result}">
            ${_game.result === 'success'
              ? `✅ HACK THÀNH CÔNG! +${Format.money(UPGRADES[_s().level-1].value)} 🔥 Combo ×${_game.combo}`
              : `❌ THẤT BẠI! Thử lại`}
          </div>
          <button class="hack-retry-btn" id="btn-hack-retry">
            ${_game.result === 'success' ? '💻 HACK TIẾP' : '🔄 THỬ LẠI'}
          </button>
        ` : ''}
      </div>
    `;

    // Bind lock buttons
    document.querySelectorAll('.hack-lock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ci = parseInt(btn.dataset.col);
        _lockCol(ci);
      });
    });

    document.getElementById('btn-hack-retry')?.addEventListener('click', () => {
      _startGame();
    });
  }

  // ── Lock một cột ──
  function _lockCol(ci) {
    if (!_game || _game.cols[ci].locked) return;
    const col = _game.cols[ci];

    // Lấy ký tự ở CENTER
    const visible = col.chars.slice(0, VISIBLE);
    const lockedChar = visible[CENTER] ?? ' ';
    col.locked     = true;
    col.lockedChar = lockedChar;

    // Visual feedback trên target char
    const tEl = document.getElementById(`hack-target-${ci}`);
    if (tEl) {
      tEl.classList.add(lockedChar === _game.word[ci] ? 'correct' : 'wrong');
    }

    // Cập nhật button
    const btn = document.querySelector(`.hack-lock-btn[data-col="${ci}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = lockedChar === _game.word[ci] ? '✓' : '✗';
      btn.className = 'hack-lock-btn ' + (lockedChar === _game.word[ci] ? 'ok' : 'fail');
    }

    // Nếu tất cả locked → evaluate
    if (_game.cols.every(c => c.locked)) {
      setTimeout(_evaluate, 200);
    }
  }

  // ── Đánh giá kết quả ──
  function _evaluate() {
    if (!_game || _game.result !== null) return;
    cancelAnimationFrame(_game.animId);

    const matched = _game.cols.filter((col, ci) =>
      col.lockedChar === _game.word[ci]
    ).length;

    const success = matched === _game.word.length;
    _game.result = success ? 'success' : 'fail';

    if (success) {
      _game.combo = (_game.combo || 0) + 1;
      const cfg   = _getLevelCfg();
      const bonus = Math.floor(cfg.value * (1 + (_game.combo - 1) * 0.2));
      _ug().dirtyMoney = (_ug().dirtyMoney || 0) + bonus;
      _s().totalHacks  = (_s().totalHacks || 0) + 1;
      UGSuspicion.add(cfg.susp);
      UI.toast(`💻 +${Format.money(bonus)} tiền bẩn!`, 'success');
    } else {
      _game.combo = 0;
      UGSuspicion.add(0.5); // fail cũng tốn ít susp
      UI.toast('❌ Hack thất bại!', 'error');
    }

    _renderGame();
  }

  // ── Render wrapper (section bên ngoài) ──
  function renderHTML() {
    const s   = _s();
    const cfg = _getLevelCfg();
    const next = UPGRADES[s.level];

    return `
      <div class="ug-section" id="ug-hack-section-inner">
        <div class="ug-section-title">💻 Hack
          <span style="font-size:0.6rem;color:#884444;font-family:monospace">
            ${cfg.name} · ${cfg.wordLen} ký tự · ×${cfg.speedMult} tốc độ
          </span>
        </div>

        <div id="hack-game-area">
          <div class="hack-start-wrap">
            <div style="font-size:0.7rem;color:#cc6666;margin-bottom:10px;text-align:center">
              Phần thưởng: <b style="color:#ff9900">${Format.money(cfg.value)}</b> tiền bẩn / hack thành công
            </div>
            <button class="ug-hack-btn" id="btn-hack-start">💻 BẮT ĐẦU HACK</button>
            ${_s().totalHacks > 0 ? `<div style="font-size:0.6rem;color:#664444;text-align:center;margin-top:6px">Tổng hacks: ${_s().totalHacks}</div>` : ''}
          </div>
        </div>

        ${next ? `
        <button class="ug-upgrade-btn" id="btn-hack-upgrade"
                ${STATE.balance < next.price ? 'disabled' : ''}>
          ⬆️ ${next.name} — ${Format.money(next.price)}
        </button>` : `<div class="ug-maxed">👑 MAX LEVEL</div>`}
      </div>`;
  }

  function bindEvents() {
    document.getElementById('btn-hack-start')?.addEventListener('click', () => {
      _startGame();
    });

    document.getElementById('btn-hack-upgrade')?.addEventListener('click', () => {
      const s    = _s();
      const next = UPGRADES[s.level];
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      s.level++;
      UI.toast(`💻 Nâng cấp: ${UPGRADES[s.level-1].name}!`, 'success');
      // Re-render section
      const el = document.getElementById('ug-hack-section');
      if (el) { el.innerHTML = renderHTML(); bindEvents(); }
    });
  }

  return { renderHTML, bindEvents };
})();