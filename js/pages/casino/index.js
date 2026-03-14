/* ============================================
   CASINO/INDEX.JS — Tab manager + shared utils
   ============================================ */

const CasinoPage = (() => {

  // ============================================
  // SHARED BET CONTROLS
  // ============================================
  function renderBetControls(prefix) {
    const dirty = STATE.underground?.dirtyMoney || STATE.dirtyMoney || 0;
    return `
      <div class="bet-controls" data-prefix="${prefix}">
        <div class="bet-money-toggle">
          <button class="bet-money-btn active" data-type="clean" data-for="${prefix}">
            💵 Sạch
            <span class="bet-money-bal" id="bet-bal-clean-${prefix}">${Format.money(STATE.balance)}</span>
          </button>
          <button class="bet-money-btn" data-type="dirty" data-for="${prefix}">
            🩸 Bẩn
            <span class="bet-money-bal" id="bet-bal-dirty-${prefix}">${Format.money(dirty)}</span>
          </button>
        </div>
        <div class="bet-row">
          <div class="bet-presets">
            <button class="bet-preset" data-preset="20"  data-for="${prefix}">20%</button>
            <button class="bet-preset" data-preset="50"  data-for="${prefix}">50%</button>
            <button class="bet-preset" data-preset="100" data-for="${prefix}">100%</button>
          </div>
          <input class="bet-input" id="bet-input-${prefix}"
                 type="number" min="1" placeholder="Tự nhập...">
        </div>
        <input type="hidden" id="bet-type-${prefix}" value="clean">
      </div>
    `;
  }

  function bindBetControls() {
    document.querySelectorAll('.bet-money-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.dataset.for;
        document.querySelectorAll(`.bet-money-btn[data-for="${prefix}"]`)
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('bet-type-' + prefix).value = btn.dataset.type;
        document.getElementById('bet-input-' + prefix).value = '';
        updateAllBalances();
      });
    });

    document.querySelectorAll('.bet-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.dataset.for;
        const input  = document.getElementById('bet-input-' + prefix);
        const typeEl = document.getElementById('bet-type-' + prefix);
        if (!input || !typeEl) return;
        const dirty = STATE.underground?.dirtyMoney || STATE.dirtyMoney || 0;
        const bal = Math.floor(typeEl.value === 'dirty' ? dirty : STATE.balance);
        const pct = parseInt(btn.dataset.preset);
        input.value = Math.max(1, Math.floor(bal * pct / 100));
      });
    });
  }

  // ============================================
  // SHARED MONEY HELPERS
  // ============================================
  function getBet(prefix) {
    const v = parseFloat(document.getElementById('bet-input-' + prefix)?.value) || 0;
    return Math.max(1, Math.floor(v));
  }

  function getBetType(prefix) {
    return document.getElementById('bet-type-' + prefix)?.value || 'clean';
  }

  function deductBet(prefix) {
    const bet  = getBet(prefix);
    const type = getBetType(prefix);
    if (type === 'dirty') {
      // Lấy dirtyMoney từ đúng chỗ
      const dirty = STATE.underground?.dirtyMoney ?? STATE.dirtyMoney ?? 0;
      if (dirty < bet) { UI.toast('Không đủ tiền bẩn!', 'error'); return false; }
      if (STATE.underground?.dirtyMoney !== undefined) {
        STATE.underground.dirtyMoney -= bet;
      } else {
        STATE.dirtyMoney = (STATE.dirtyMoney || 0) - bet;
      }
    } else {
      if (STATE.balance < bet) { UI.toast('Không đủ tiền!', 'error'); return false; }
      STATE.balance -= bet;
    }
    return bet;
  }

  function addWin(amount) {
    STATE.balance += amount;
  }

  function showResult(id, type, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `casino-result show ${type}`;
    el.textContent = msg;
  }

  function updateAllBalances() {
    const dirty = STATE.underground?.dirtyMoney ?? STATE.dirtyMoney ?? 0;
    document.querySelectorAll('[id^="bet-bal-clean-"]').forEach(el => {
      el.textContent = Format.money(STATE.balance);
    });
    document.querySelectorAll('[id^="bet-bal-dirty-"]').forEach(el => {
      el.textContent = Format.money(dirty);
    });
    const hdr = document.getElementById('casino-bal');
    if (hdr) hdr.textContent = Format.money(STATE.balance);
    if (typeof UI !== 'undefined') UI.updateHUD();
  }

  // ============================================
  // RENDER MAIN SHELL
  // ============================================
  function render() {
    const container = document.getElementById('page-casino');
    if (!container) return;

    container.innerHTML = `
      <div class="casino-header">
        <div class="casino-title">🎰 CASINO</div>
        <div class="casino-balance">
          Balance: <span id="casino-bal">${Format.money(STATE.balance)}</span>
        </div>
      </div>

      <div class="casino-tabs">
        <button class="casino-tab active" data-game="slots">🎰 Slots</button>
        <button class="casino-tab" data-game="blackjack">🃏 Blackjack</button>
        <button class="casino-tab" data-game="roulette">🎲 Roulette</button>
        <button class="casino-tab" data-game="baccarat">🎴 Baccarat</button>
        <button class="casino-tab" data-game="dice">🎯 Xúc Xắc</button>
        <button class="casino-tab" data-game="football">⚽ Bóng Đá</button>
        <button class="casino-tab" data-game="horse">🐴 Đua Ngựa</button>
        <button class="casino-tab casino-tab-coming" data-game="coming">❓ Coming Soon</button>
      </div>

      <div id="casino-game-area"></div>
    `;

    bindTabs();
    loadGame('slots');
  }

  function bindTabs() {
    document.querySelectorAll('.casino-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        document.querySelectorAll('.casino-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadGame(tab.dataset.game);
      });
    });
  }

  function loadGame(name) {
    const area = document.getElementById('casino-game-area');
    if (!area) return;

    const map = {
      slots:     typeof CasinoSlots     !== 'undefined' ? CasinoSlots     : null,
      blackjack: typeof CasinoBlackjack !== 'undefined' ? CasinoBlackjack : null,
      roulette:  typeof CasinoRoulette  !== 'undefined' ? CasinoRoulette  : null,
      baccarat:  typeof CasinoBaccarat  !== 'undefined' ? CasinoBaccarat  : null,
      dice:      typeof CasinoDice      !== 'undefined' ? CasinoDice      : null,
      football:  typeof CasinoFootball  !== 'undefined' ? CasinoFootball  : null,
      horse:     typeof CasinoHorse     !== 'undefined' ? CasinoHorse     : null,
    };

    const mod = map[name];
    if (!mod) { area.innerHTML = '<div class="casino-coming-soon">🚧 Coming Soon</div>'; return; }

    area.innerHTML = mod.renderHTML();
    bindBetControls();
    mod.bindEvents();
    updateAllBalances();
  }

  const API = {
    renderBetControls,
    getBet,
    getBetType,
    deductBet,
    addWin,
    showResult,
    updateAllBalances,
  };

  return { render, ...API };
})();

const Casino = CasinoPage;