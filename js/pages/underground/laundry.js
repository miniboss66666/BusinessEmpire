// @ts-nocheck
/* UNDERGROUND/LAUNDRY.JS — Rửa tiền 4 cách */

const UGLaundry = (() => {

  function _s() {
    const u = _ug();
    if (!u.laundry) u.laundry = {
      business: { active: false, amount: 0 }, // locked in, can't withdraw
      crypto:   { active: false, amount: 0 },
    };
    return u.laundry;
  }

  function getDirty() { return _ug().dirtyMoney || 0; }

  function renderHTML() {
    const dirty = getDirty();
    const s = _s();

    return `
      <div class="ug-section">
        <div class="ug-section-title">🧺 Rửa Tiền
          <span class="ug-dirty-badge">${Format.money(dirty)} bẩn</span>
        </div>

        <div class="laundry-methods">

          <!-- Business -->
          <div class="laundry-card ${s.business.active?'active':''}">
            <div class="laundry-icon">🏢</div>
            <div class="laundry-info">
              <div class="laundry-name">Business</div>
              <div class="laundry-desc">Chuyển vào không rút được · Nghi vấn tăng khi rửa</div>
              ${s.business.active ? `<div class="laundry-amount">Đang rửa: ${Format.money(s.business.amount)}</div>` : ''}
            </div>
            ${!s.business.active ? `
            <button class="laundry-btn" id="btn-laundry-biz" ${dirty<=0?'disabled':''}>
              RỬA
            </button>` : `<span style="color:var(--green);font-size:0.7rem">✅ Đã xong</span>`}
          </div>

          <!-- Casino -->
          <div class="laundry-card">
            <div class="laundry-icon">🎰</div>
            <div class="laundry-info">
              <div class="laundry-name">Casino</div>
              <div class="laundry-desc">Rủi ro 0% · Max $1M/lần · Tức thì</div>
            </div>
            <button class="laundry-btn" id="btn-laundry-casino" ${dirty<=0?'disabled':''}>RỬA</button>
          </div>

          <!-- BĐS -->
          <div class="laundry-card">
            <div class="laundry-icon">🏠</div>
            <div class="laundry-info">
              <div class="laundry-name">Bất Động Sản</div>
              <div class="laundry-desc">Rủi ro 0% · Mất 15% phí · Tức thì</div>
            </div>
            <button class="laundry-btn" id="btn-laundry-re" ${dirty<=0?'disabled':''}>RỬA</button>
          </div>

          <!-- Crypto -->
          <div class="laundry-card ${s.crypto.active?'active':''}">
            <div class="laundry-icon">🪙</div>
            <div class="laundry-info">
              <div class="laundry-name">Crypto</div>
              <div class="laundry-desc">Nghi vấn tăng chậm · Mất 5% phí · 30 phút</div>
              ${s.crypto.active ? `<div class="laundry-amount">Đang rửa: ${Format.money(s.crypto.amount)} · Còn ${Math.ceil((_ug().laundry.crypto.endsAt - Date.now())/60000)} phút</div>` : ''}
            </div>
            ${!s.crypto.active ? `
            <button class="laundry-btn" id="btn-laundry-crypto" ${dirty<=0?'disabled':''}>RỬA</button>`
            : `<span style="color:#f4a030;font-size:0.65rem">⏳ Đang xử lý</span>`}
          </div>

        </div>
      </div>`;
  }

  function bindEvents() {
    // Business: chuyển hết dirty money vào, không rút, nghi vấn +10%
    document.getElementById('btn-laundry-biz')?.addEventListener('click', () => {
      const dirty = getDirty();
      if (dirty <= 0) return;
      UI.confirm(`Rửa ${Format.money(dirty)} qua Business?\nKhông thể rút lại, nghi vấn +10%`, () => {
        STATE.balance += dirty;
        _ug().dirtyMoney = 0;
        _s().business = { active: true, amount: dirty };
        UGSuspicion.add(10);
        UI.toast(`🏢 Rửa ${Format.money(dirty)} qua Business!`, 'success');
        _refresh();
      });
    });

    // Casino: tức thì, max 1M, 0% risk
    document.getElementById('btn-laundry-casino')?.addEventListener('click', () => {
      const dirty = getDirty();
      if (dirty <= 0) return;
      const amt = Math.min(dirty, 1_000_000);
      _ug().dirtyMoney -= amt;
      STATE.balance += amt;
      UI.toast(`🎰 Rửa ${Format.money(amt)} qua Casino!`, 'success');
      _refresh();
    });

    // BĐS: mất 15% phí
    document.getElementById('btn-laundry-re')?.addEventListener('click', () => {
      const dirty = getDirty();
      if (dirty <= 0) return;
      const fee = dirty * 0.15;
      const clean = dirty - fee;
      _ug().dirtyMoney = 0;
      STATE.balance += clean;
      UI.toast(`🏠 Rửa ${Format.money(dirty)} → ${Format.money(clean)} (mất ${Format.money(fee)} phí)`, 'success');
      _refresh();
    });

    // Crypto: 30 phút, mất 5%
    document.getElementById('btn-laundry-crypto')?.addEventListener('click', () => {
      const dirty = getDirty();
      if (dirty <= 0) return;
      _ug().dirtyMoney = 0;
      _s().crypto = { active: true, amount: dirty, endsAt: Date.now() + 30 * 60 * 1000 };
      UGSuspicion.setWashing(true);
      UI.toast(`🪙 Đang rửa ${Format.money(dirty)} qua Crypto (30 phút)...`, 'success');
      _refresh();
      _startCryptoTimer();
    });
  }

  function _startCryptoTimer() {
    const iv = setInterval(() => {
      const crypto = _s().crypto;
      if (!crypto.active) { clearInterval(iv); return; }
      if (Date.now() >= crypto.endsAt) {
        const clean = crypto.amount * 0.95;
        STATE.balance += clean;
        _s().crypto = { active: false, amount: 0 };
        UGSuspicion.setWashing(false);
        UI.toast(`🪙 Xong! Nhận ${Format.money(clean)} tiền sạch!`, 'success');
        clearInterval(iv);
        _refresh();
      }
    }, 5000);
  }

  function tick() {
    // Check crypto timer
    const crypto = _s().crypto;
    if (crypto.active && Date.now() >= crypto.endsAt) {
      const clean = crypto.amount * 0.95;
      STATE.balance += clean;
      _s().crypto = { active: false, amount: 0 };
      UGSuspicion.setWashing(false);
    }
  }

  function _refresh() {
    const el = document.getElementById('ug-laundry-section');
    if (el) { el.innerHTML = renderHTML(); bindEvents(); }
  }

  return { renderHTML, bindEvents, tick };
})();