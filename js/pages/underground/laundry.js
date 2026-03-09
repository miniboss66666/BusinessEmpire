// @ts-nocheck
/* ============================================================
   UNDERGROUND/LAUNDRY.JS
   Logic rửa tiền mới:

   🎰 CASINO    — tiền bẩn nạp vào pool, chơi thắng → sạch
   🪙 CRYPTO    — tiền bẩn nạp vào pool, giao dịch lãi → sạch
   🏠 BĐS       — rửa từ từ theo 10% income BĐS/phút
   🏢 BUSINESS  — rửa từ từ theo 20% income Business/phút

   UI: chọn 25/50/75/100% hoặc nhập số → ấn nút
   ============================================================ */

const UGLaundry = (() => {

  function _s() {
    const u = _ug();
    if (!u.laundry) u.laundry = _defaultState();
    // migrate old format
    if (u.laundry.crypto !== undefined || u.laundry.business?.amount === undefined) {
      u.laundry = _defaultState();
    }
    return u.laundry;
  }

  function _defaultState() {
    return {
      realestate: { active: false, amount: 0, washed: 0 },
      business:   { active: false, amount: 0, washed: 0 },
      casinoPool: 0,
      cryptoPool: 0,
    };
  }

  function getDirty() { return _ug().dirtyMoney || 0; }

  function _bizIncome() {
    try { return BusinessLemonade?.getIncome?.() || 0; } catch { return 0; }
  }
  function _reIncome() {
    try { return RealEstatePage?.getIncome?.() || 0; } catch { return 0; }
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  function renderHTML() {
    const dirty  = getDirty();
    const s      = _s();
    const bizInc = _bizIncome();
    const reInc  = _reIncome();
    const bizRate = bizInc * 0.20;
    const reRate  = reInc  * 0.10;

    return `
      <div class="ug-section" id="ug-laundry-section">
        <div class="ug-section-title">🧺 Rửa Tiền
          <span class="ug-dirty-badge">${Format.money(dirty)} bẩn</span>
        </div>

        <div class="laundry-info-box">
          💡 Casino &amp; Crypto: nạp tiền bẩn vào pool — phải chơi thắng/lãi mới thành tiền sạch
        </div>

        <div class="laundry-methods">

          <!-- CASINO -->
          <div class="laundry-card ${s.casinoPool > 0 ? 'active' : ''}">
            <div class="laundry-icon">🎰</div>
            <div class="laundry-info">
              <div class="laundry-name">Casino
                ${s.casinoPool > 0 ? `<span class="laundry-pool-badge">Pool: ${Format.money(s.casinoPool)}</span>` : ''}
              </div>
              <div class="laundry-desc">Chơi thắng → tiền sạch · Thua → mất bẩn</div>
            </div>
            <div class="laundry-right">
              ${_renderPicker('casino', dirty)}
            </div>
          </div>

          <!-- CRYPTO -->
          <div class="laundry-card ${s.cryptoPool > 0 ? 'active' : ''}">
            <div class="laundry-icon">🪙</div>
            <div class="laundry-info">
              <div class="laundry-name">Crypto
                ${s.cryptoPool > 0 ? `<span class="laundry-pool-badge">Pool: ${Format.money(s.cryptoPool)}</span>` : ''}
              </div>
              <div class="laundry-desc">Giao dịch lãi → tiền sạch · Lỗ → mất bẩn</div>
            </div>
            <div class="laundry-right">
              ${_renderPicker('crypto', dirty)}
            </div>
          </div>

          <!-- BĐS -->
          <div class="laundry-card ${s.realestate.active ? 'active' : ''}">
            <div class="laundry-icon">🏠</div>
            <div class="laundry-info">
              <div class="laundry-name">Bất Động Sản</div>
              <div class="laundry-desc">10% income BĐS/phút →
                <span style="color:${reRate>0?'#ffaa44':'#884444'}">
                  ${reRate > 0 ? Format.money(reRate)+'/phút' : 'Cần BĐS có thu nhập'}
                </span>
              </div>
              ${s.realestate.active ? _renderProgress('re', s.realestate) : ''}
            </div>
            ${!s.realestate.active ? `
            <div class="laundry-right">
              ${_renderPicker('re', dirty, reRate <= 0)}
            </div>` : ''}
          </div>

          <!-- BUSINESS -->
          <div class="laundry-card ${s.business.active ? 'active' : ''}">
            <div class="laundry-icon">🏢</div>
            <div class="laundry-info">
              <div class="laundry-name">Business</div>
              <div class="laundry-desc">20% income Business/phút →
                <span style="color:${bizRate>0?'#ffaa44':'#884444'}">
                  ${bizRate > 0 ? Format.money(bizRate)+'/phút' : 'Cần Business có thu nhập'}
                </span>
              </div>
              ${s.business.active ? _renderProgress('biz', s.business) : ''}
            </div>
            ${!s.business.active ? `
            <div class="laundry-right">
              ${_renderPicker('biz', dirty, bizRate <= 0)}
            </div>` : ''}
          </div>

        </div>
      </div>`;
  }

  function _renderPicker(id, dirty, disabled = false) {
    if (disabled) return `<span class="laundry-unavail">Không khả dụng</span>`;
    if (dirty <= 0) return `<span class="laundry-unavail">Hết tiền bẩn</span>`;
    const label = (id === 'casino' || id === 'crypto') ? '➡ NẠP' : '▶ RỬA';
    return `
      <div class="laundry-picker">
        <div class="laundry-pct-row">
          ${[25,50,75,100].map(p=>`
            <button class="laundry-pct-btn" data-id="${id}" data-pct="${p}">${p}%</button>
          `).join('')}
        </div>
        <div class="laundry-input-row">
          <input class="laundry-input" id="laundry-amt-${id}" type="number"
            placeholder="Số tiền..." min="1" max="${dirty}" value="${Math.floor(dirty)}"/>
          <button class="laundry-btn" id="btn-laundry-${id}">${label}</button>
        </div>
      </div>`;
  }

  function _renderProgress(id, st) {
    const pct = st.amount > 0 ? Math.min(100, st.washed / st.amount * 100) : 0;
    return `
      <div class="laundry-progress-wrap">
        <div class="laundry-prog-bar">
          <div class="laundry-prog-fill" id="laundry-fill-${id}" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="laundry-prog-text">
          <span id="laundry-prog-text-${id}">${Format.money(st.washed)} / ${Format.money(st.amount)}</span>
          <button class="laundry-cancel-btn" id="btn-cancel-${id}">✕ Huỷ</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  // BIND EVENTS
  // ══════════════════════════════════════════════════════════
  function bindEvents() {
    // Pct buttons — update input value
    document.querySelectorAll('.laundry-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.id;
        const pct = parseInt(btn.dataset.pct);
        const amt = Math.max(1, Math.floor(getDirty() * pct / 100));
        const inp = document.getElementById(`laundry-amt-${id}`);
        if (inp) inp.value = amt;
        document.querySelectorAll(`.laundry-pct-btn[data-id="${id}"]`).forEach(b =>
          b.classList.toggle('active', b.dataset.pct === btn.dataset.pct));
      });
    });

    // Casino pool
    document.getElementById('btn-laundry-casino')?.addEventListener('click', () => {
      const amt = _getAmt('casino');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().casinoPool  += amt;
      UI.toast(`🎰 Nạp ${Format.money(amt)} vào Casino — cần chơi thắng để sạch!`, 'success');
      _refresh();
    });

    // Crypto pool
    document.getElementById('btn-laundry-crypto')?.addEventListener('click', () => {
      const amt = _getAmt('crypto');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().cryptoPool  += amt;
      UI.toast(`🪙 Nạp ${Format.money(amt)} vào Crypto — cần giao dịch lãi để sạch!`, 'success');
      _refresh();
    });

    // BĐS slow wash
    document.getElementById('btn-laundry-re')?.addEventListener('click', () => {
      if (_s().realestate.active) return;
      if (_reIncome() <= 0) { UI.toast('Cần BĐS có thu nhập!', 'error'); return; }
      const amt = _getAmt('re');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().realestate = { active: true, amount: amt, washed: 0 };
      UGSuspicion.add(5);
      UI.toast(`🏠 Bắt đầu rửa ${Format.money(amt)} qua BĐS...`, 'success');
      _refresh();
    });

    // Business slow wash
    document.getElementById('btn-laundry-biz')?.addEventListener('click', () => {
      if (_s().business.active) return;
      if (_bizIncome() <= 0) { UI.toast('Cần Business có thu nhập!', 'error'); return; }
      const amt = _getAmt('biz');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().business = { active: true, amount: amt, washed: 0 };
      UGSuspicion.add(8);
      UI.toast(`🏢 Bắt đầu rửa ${Format.money(amt)} qua Business...`, 'success');
      _refresh();
    });

    // Cancel BĐS
    document.getElementById('btn-cancel-re')?.addEventListener('click', () => {
      const st = _s().realestate;
      const back = st.amount - st.washed;
      _ug().dirtyMoney += back;
      _s().realestate = { active: false, amount: 0, washed: 0 };
      UI.toast(`🏠 Huỷ — hoàn ${Format.money(back)} tiền bẩn`, 'info');
      _refresh();
    });

    // Cancel Business
    document.getElementById('btn-cancel-biz')?.addEventListener('click', () => {
      const st = _s().business;
      const back = st.amount - st.washed;
      _ug().dirtyMoney += back;
      _s().business = { active: false, amount: 0, washed: 0 };
      UI.toast(`🏢 Huỷ — hoàn ${Format.money(back)} tiền bẩn`, 'info');
      _refresh();
    });
  }

  function _getAmt(id) {
    const inp = document.getElementById(`laundry-amt-${id}`);
    const amt = inp ? Math.floor(parseFloat(inp.value) || 0) : 0;
    const dirty = getDirty();
    if (amt <= 0)    { UI.toast('Nhập số tiền hợp lệ!', 'error');  return 0; }
    if (amt > dirty) { UI.toast('Không đủ tiền bẩn!',  'error');  return 0; }
    return amt;
  }

  // ══════════════════════════════════════════════════════════
  // TICK — gọi mỗi giây từ engine
  // ══════════════════════════════════════════════════════════
  function tick() {
    const s = _s();

    // BĐS: 10% income / 60s
    if (s.realestate.active) {
      const rps = _reIncome() * 0.10 / 60;
      if (rps > 0) {
        const left = s.realestate.amount - s.realestate.washed;
        const gain = Math.min(rps, left);
        s.realestate.washed += gain;
        STATE.balance += gain;
        if (s.realestate.washed >= s.realestate.amount - 0.01) {
          s.realestate = { active: false, amount: 0, washed: 0 };
          UI.toast('🏠 Xong! BĐS đã rửa hết tiền!', 'success');
          _refresh(); return;
        }
        _updateBar('re', s.realestate);
      }
    }

    // Business: 20% income / 60s
    if (s.business.active) {
      const rps = _bizIncome() * 0.20 / 60;
      if (rps > 0) {
        const left = s.business.amount - s.business.washed;
        const gain = Math.min(rps, left);
        s.business.washed += gain;
        STATE.balance += gain;
        if (s.business.washed >= s.business.amount - 0.01) {
          s.business = { active: false, amount: 0, washed: 0 };
          UI.toast('🏢 Xong! Business đã rửa hết tiền!', 'success');
          _refresh(); return;
        }
        _updateBar('biz', s.business);
      }
    }
  }

  function _updateBar(id, st) {
    const pct = Math.min(100, st.washed / st.amount * 100).toFixed(1);
    const fill = document.getElementById(`laundry-fill-${id}`);
    const txt  = document.getElementById(`laundry-prog-text-${id}`);
    if (fill) fill.style.width = pct + '%';
    if (txt)  txt.textContent  = `${Format.money(st.washed)} / ${Format.money(st.amount)}`;
  }

  // ══════════════════════════════════════════════════════════
  // CASINO / CRYPTO HOOKS — gọi từ bên ngoài
  // ══════════════════════════════════════════════════════════
  function onCasinoWin(betAmt, multiplier) {
    const s = _s();
    if (s.casinoPool <= 0) return;
    const ratio   = Math.min(1, s.casinoPool / Math.max(1, STATE.balance + s.casinoPool));
    const dirtyIn = Math.min(s.casinoPool, betAmt * ratio);
    const cleaned = Math.min(s.casinoPool, dirtyIn * multiplier);
    s.casinoPool  = Math.max(0, s.casinoPool - cleaned);
    if (s.casinoPool === 0) UI.toast('🎰 Pool Casino đã sạch!', 'success');
  }

  function onCasinoLose(betAmt) {
    const s = _s();
    if (s.casinoPool <= 0) return;
    const ratio  = Math.min(1, s.casinoPool / Math.max(1, STATE.balance + s.casinoPool));
    const lost   = Math.min(s.casinoPool, betAmt * ratio);
    s.casinoPool = Math.max(0, s.casinoPool - lost);
  }

  function onCryptoProfit(profit) {
    const s = _s();
    if (s.cryptoPool <= 0) return;
    const cleaned = Math.min(s.cryptoPool, profit * 0.5);
    s.cryptoPool  = Math.max(0, s.cryptoPool - cleaned);
    if (s.cryptoPool === 0) UI.toast('🪙 Pool Crypto đã sạch!', 'success');
  }

  function onCryptoLoss(loss) {
    const s = _s();
    if (s.cryptoPool <= 0) return;
    s.cryptoPool = Math.max(0, s.cryptoPool - Math.min(s.cryptoPool, loss * 0.5));
  }

  function getCasinoPool() { return _s().casinoPool; }
  function getCryptoPool() { return _s().cryptoPool; }

  function _refresh() {
    const el = document.getElementById('ug-laundry-section');
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderHTML();
    el.replaceWith(tmp.firstElementChild);
    bindEvents();
  }

  return {
    renderHTML, bindEvents, tick,
    onCasinoWin, onCasinoLose,
    onCryptoProfit, onCryptoLoss,
    getCasinoPool, getCryptoPool,
  };
})();