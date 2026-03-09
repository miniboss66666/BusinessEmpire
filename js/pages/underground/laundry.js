// @ts-nocheck
/* ============================================================
   UNDERGROUND/LAUNDRY.JS — Logic rửa tiền v3

   🎰 CASINO  — dùng chung dirtyMoney. Thắng = tiền thắng sạch,
                thua = mất từ dirtyMoney trước (nếu còn)
   🪙 CRYPTO  — lock một lượng dirtyMoney, ủ theo thời gian
                (100 bẩn = 1 phút). Trong lúc ủ nghi vấn tăng dần.
                Hết giờ → tiền sạch vào balance
   🏠 BĐS     — lock + rửa dần 10% income BĐS/phút
                Nghi vấn tăng dần trong lúc active
   🏢 Business— lock + rửa dần 20% income Business/phút
                Nghi vấn tăng dần trong lúc active

   Nghi vấn KHÔNG tăng ngay khi bắt đầu, chỉ tăng dần theo thời gian
   ============================================================ */

const UGLaundry = (() => {

  // ── State helpers ──────────────────────────────────────────
  function _s() {
    const u = _ug();
    if (!u.laundry) u.laundry = _def();
    // migrate cũ
    if (u.laundry.casinoPool !== undefined || u.laundry.crypto !== undefined) {
      u.laundry = _def();
    }
    return u.laundry;
  }

  function _def() {
    return {
      // Crypto: lock tiền bẩn, ủ theo giờ
      crypto: { active: false, amount: 0, startedAt: 0, minutesNeeded: 0 },
      // BĐS & Business: lock + rửa dần
      realestate: { active: false, amount: 0, washed: 0 },
      business:   { active: false, amount: 0, washed: 0 },
    };
  }

  function getDirty() { return _ug().dirtyMoney || 0; }

  function _bizIncome() {
    try { return BusinessLemonade?.getIncome?.() || 0; } catch { return 0; }
  }
  function _reIncome() {
    try { return RealEstatePage?.getIncome?.() || 0; } catch { return 0; }
  }

  // Nghi vấn tăng dần mỗi giây khi đang active (nhỏ, nhưng tích luỹ)
  // BĐS: 0.015%/s, Business: 0.025%/s, Crypto: 0.02%/s
  const SUSP_RATE = { realestate: 0.015, business: 0.025, crypto: 0.02 };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  function renderHTML() {
    const dirty  = getDirty();
    const s      = _s();
    const bizRate = _bizIncome() * 0.20;
    const reRate  = _reIncome()  * 0.10;

    // Crypto: tính thời gian còn lại
    let cryptoTimeLeft = 0, cryptoPct = 0;
    if (s.crypto.active) {
      const elapsed  = (Date.now() - s.crypto.startedAt) / 60000; // phút
      cryptoPct      = Math.min(100, elapsed / s.crypto.minutesNeeded * 100);
      cryptoTimeLeft = Math.max(0, s.crypto.minutesNeeded - elapsed);
    }

    return `
      <div class="ug-section" id="ug-laundry-section">
        <div class="ug-section-title">🧺 Rửa Tiền
          <span class="ug-dirty-badge">${Format.money(dirty)} bẩn</span>
        </div>

        <div class="laundry-methods">

          <!-- ═══ CASINO ═══ -->
          <div class="laundry-card ${dirty > 0 ? 'active' : ''}">
            <div class="laundry-icon">🎰</div>
            <div class="laundry-info">
              <div class="laundry-name">Casino</div>
              <div class="laundry-desc">Vào Casino → chọn "Tiền Bẩn" khi đặt cược · Thắng = tiền sạch</div>
              ${dirty > 0
                ? `<div class="laundry-amount" style="color:#ffaa44">⚡ ${Format.money(dirty)} sẵn sàng trong Casino</div>`
                : `<div class="laundry-desc" style="color:#664444">Chưa có tiền bẩn</div>`
              }
            </div>
          </div>

          <!-- ═══ CRYPTO ═══ -->
          <div class="laundry-card ${s.crypto.active ? 'active' : ''}">
            <div class="laundry-icon">🪙</div>
            <div class="laundry-info">
              <div class="laundry-name">Crypto</div>
              ${s.crypto.active ? `
                <div class="laundry-desc" style="color:#ff9944">
                  ⏳ Đang ủ ${Format.money(s.crypto.amount)} · còn ${_fmtTime(cryptoTimeLeft)}
                </div>
                ${_renderProgress('crypto', cryptoPct, s.crypto.amount, s.crypto.amount * cryptoPct/100)}
                <div class="laundry-desc" style="color:#884444;margin-top:4px">
                  ⚠ Nghi vấn tăng dần ${SUSP_RATE.crypto*60 | 0}%/phút
                </div>
              ` : `
                <div class="laundry-desc">Khoá tiền bẩn · 100 bẩn = 1 phút ủ · Hết giờ → tiền sạch</div>
                <div class="laundry-desc" style="color:#884444">⚠ Nghi vấn tăng dần khi đang ủ</div>
                ${dirty > 0 ? _renderPicker('crypto', dirty) : '<div class="laundry-unavail">Không có tiền bẩn</div>'}
              `}
            </div>
          </div>

          <!-- ═══ BĐS ═══ -->
          <div class="laundry-card ${s.realestate.active ? 'active' : ''}">
            <div class="laundry-icon">🏠</div>
            <div class="laundry-info">
              <div class="laundry-name">Bất Động Sản</div>
              <div class="laundry-desc">10% income BĐS/phút →
                <span style="color:${reRate>0?'#ffaa44':'#664444'}">
                  ${reRate > 0 ? Format.money(reRate)+'/phút' : 'Cần BĐS có thu nhập'}
                </span>
                <span style="color:#884444"> · nghi vấn tăng dần</span>
              </div>
              ${s.realestate.active
                ? _renderProgress('re', s.realestate.amount > 0 ? s.realestate.washed/s.realestate.amount*100 : 0, s.realestate.amount, s.realestate.washed)
                : (dirty > 0 && reRate > 0 ? _renderPicker('re', dirty) : `<div class="laundry-unavail">${reRate<=0?'Cần BĐS có thu nhập':'Không có tiền bẩn'}</div>`)}
            </div>
            ${s.realestate.active ? `<button class="laundry-cancel-btn" id="btn-cancel-re">✕</button>` : ''}
          </div>

          <!-- ═══ BUSINESS ═══ -->
          <div class="laundry-card ${s.business.active ? 'active' : ''}">
            <div class="laundry-icon">🏢</div>
            <div class="laundry-info">
              <div class="laundry-name">Business</div>
              <div class="laundry-desc">20% income Business/phút →
                <span style="color:${bizRate>0?'#ffaa44':'#664444'}">
                  ${bizRate > 0 ? Format.money(bizRate)+'/phút' : 'Cần Business có thu nhập'}
                </span>
                <span style="color:#884444"> · nghi vấn tăng dần</span>
              </div>
              ${s.business.active
                ? _renderProgress('biz', s.business.amount > 0 ? s.business.washed/s.business.amount*100 : 0, s.business.amount, s.business.washed)
                : (dirty > 0 && bizRate > 0 ? _renderPicker('biz', dirty) : `<div class="laundry-unavail">${bizRate<=0?'Cần Business có thu nhập':'Không có tiền bẩn'}</div>`)}
            </div>
            ${s.business.active ? `<button class="laundry-cancel-btn" id="btn-cancel-biz">✕</button>` : ''}
          </div>

        </div>
      </div>`;
  }

  function _renderPicker(id, dirty) {
    return `
      <div class="laundry-picker">
        <div class="laundry-pct-row">
          ${[25,50,75,100].map(p=>`<button class="laundry-pct-btn" data-id="${id}" data-pct="${p}">${p}%</button>`).join('')}
        </div>
        <div class="laundry-input-row">
          <input class="laundry-input" id="laundry-amt-${id}" type="number"
            placeholder="Số tiền..." min="1" max="${dirty}" value="${Math.floor(dirty)}"/>
          <button class="laundry-btn" id="btn-laundry-${id}">▶ RỬA</button>
        </div>
      </div>`;
  }

  function _renderProgress(id, pct, total, done) {
    return `
      <div class="laundry-progress-wrap">
        <div class="laundry-prog-bar">
          <div class="laundry-prog-fill" id="laundry-fill-${id}" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="laundry-prog-text">
          <span id="laundry-prog-text-${id}">${Format.money(done)} / ${Format.money(total)}</span>
        </div>
      </div>`;
  }

  function _fmtTime(minutes) {
    if (minutes <= 0) return '0s';
    const m = Math.floor(minutes);
    const s = Math.floor((minutes - m) * 60);
    return m > 0 ? `${m}p${s}s` : `${s}s`;
  }

  // ══════════════════════════════════════════════════════════
  // BIND EVENTS
  // ══════════════════════════════════════════════════════════
  function bindEvents() {
    // Pct buttons
    document.querySelectorAll('.laundry-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.id;
        const pct = parseInt(btn.dataset.pct);
        const inp = document.getElementById(`laundry-amt-${id}`);
        if (inp) inp.value = Math.max(1, Math.floor(getDirty() * pct / 100));
        document.querySelectorAll(`.laundry-pct-btn[data-id="${id}"]`).forEach(b =>
          b.classList.toggle('active', b.dataset.pct === btn.dataset.pct));
      });
    });

    // Crypto: lock + bắt đầu ủ
    document.getElementById('btn-laundry-crypto')?.addEventListener('click', () => {
      if (_s().crypto.active) return;
      const amt = _getAmt('crypto');
      if (!amt) return;
      const mins = Math.max(0.1, amt / 100); // 100 bẩn = 1 phút
      _ug().dirtyMoney -= amt;
      _s().crypto = { active: true, amount: amt, startedAt: Date.now(), minutesNeeded: mins };
      UI.toast(`🪙 Ủ ${Format.money(amt)} trong Crypto · chờ ${_fmtTime(mins)}`, 'success');
      _refresh();
    });

    // BĐS: lock + rửa dần
    document.getElementById('btn-laundry-re')?.addEventListener('click', () => {
      if (_s().realestate.active) return;
      if (_reIncome() <= 0) { UI.toast('Cần BĐS có thu nhập!', 'error'); return; }
      const amt = _getAmt('re');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().realestate = { active: true, amount: amt, washed: 0 };
      UI.toast(`🏠 Bắt đầu rửa ${Format.money(amt)} qua BĐS...`, 'success');
      _refresh();
    });

    // Business: lock + rửa dần
    document.getElementById('btn-laundry-biz')?.addEventListener('click', () => {
      if (_s().business.active) return;
      if (_bizIncome() <= 0) { UI.toast('Cần Business có thu nhập!', 'error'); return; }
      const amt = _getAmt('biz');
      if (!amt) return;
      _ug().dirtyMoney -= amt;
      _s().business = { active: true, amount: amt, washed: 0 };
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
    if (amt <= 0)           { UI.toast('Nhập số tiền hợp lệ!', 'error'); return 0; }
    if (amt > getDirty())   { UI.toast('Không đủ tiền bẩn!',  'error'); return 0; }
    return amt;
  }

  // ══════════════════════════════════════════════════════════
  // TICK — mỗi giây
  // ══════════════════════════════════════════════════════════
  function tick() {
    const s = _s();
    let needRefresh = false;

    // ── Crypto: kiểm tra hết giờ ủ ──
    if (s.crypto.active) {
      UGSuspicion.add(SUSP_RATE.crypto); // tăng dần mỗi giây
      const elapsed = (Date.now() - s.crypto.startedAt) / 60000;
      const pct = Math.min(100, elapsed / s.crypto.minutesNeeded * 100);
      _updateBar('crypto', pct, s.crypto.amount, s.crypto.amount * pct / 100);
      if (elapsed >= s.crypto.minutesNeeded) {
        const clean = s.crypto.amount;
        STATE.balance += clean;
        s.crypto = { active: false, amount: 0, startedAt: 0, minutesNeeded: 0 };
        UI.toast(`🪙 Crypto xong! +${Format.money(clean)} tiền sạch`, 'success');
        needRefresh = true;
      }
    }

    // ── BĐS: rửa dần ──
    if (s.realestate.active) {
      UGSuspicion.add(SUSP_RATE.realestate);
      const rps  = _reIncome() * 0.10 / 60;
      if (rps > 0) {
        const gain = Math.min(rps, s.realestate.amount - s.realestate.washed);
        s.realestate.washed += gain;
        STATE.balance += gain;
        if (s.realestate.washed >= s.realestate.amount - 0.01) {
          s.realestate = { active: false, amount: 0, washed: 0 };
          UI.toast('🏠 BĐS xong! Tiền đã sạch!', 'success');
          needRefresh = true;
        } else {
          _updateBar('re',
            s.realestate.washed / s.realestate.amount * 100,
            s.realestate.amount, s.realestate.washed);
        }
      }
    }

    // ── Business: rửa dần ──
    if (s.business.active) {
      UGSuspicion.add(SUSP_RATE.business);
      const rps  = _bizIncome() * 0.20 / 60;
      if (rps > 0) {
        const gain = Math.min(rps, s.business.amount - s.business.washed);
        s.business.washed += gain;
        STATE.balance += gain;
        if (s.business.washed >= s.business.amount - 0.01) {
          s.business = { active: false, amount: 0, washed: 0 };
          UI.toast('🏢 Business xong! Tiền đã sạch!', 'success');
          needRefresh = true;
        } else {
          _updateBar('biz',
            s.business.washed / s.business.amount * 100,
            s.business.amount, s.business.washed);
        }
      }
    }

    if (needRefresh) _refresh();
  }

  function _updateBar(id, pct, total, done) {
    const fill = document.getElementById(`laundry-fill-${id}`);
    const txt  = document.getElementById(`laundry-prog-text-${id}`);
    if (fill) fill.style.width = Math.min(100, pct).toFixed(1) + '%';
    if (txt)  txt.textContent  = `${Format.money(done)} / ${Format.money(total)}`;
  }

  // Casino dùng UI chọn tiền bẩn/sạch riêng trong casino/index.js
  // deductBet() tự trừ dirtyMoney, addWin() luôn vào balance (sạch)
  // Không cần hook thêm gì ở đây

  function _refresh() {
    const el = document.getElementById('ug-laundry-section');
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderHTML();
    el.replaceWith(tmp.firstElementChild);
    bindEvents();
  }

  return { renderHTML, bindEvents, tick };
})();