/* ============================================
   BUSINESS/LEMONADE.JS
   Boss ẩn 8 levels, max 1000 đv/level
   Giá/income x10 mỗi level
   Giấy phép lên level = 100x giá 1 đv
   ============================================ */

const BusinessLemonade = (() => {

  const LEVELS = [
    { name: 'Quầy Nước Chanh',   emoji: '🍋', incomePerUnit: 1,        pricePerUnit: 100,      licensePrice: 10000 },
    { name: 'Cửa Hàng Chanh',    emoji: '🏪', incomePerUnit: 10,       pricePerUnit: 1000,    licensePrice: 100000 },
    { name: 'Công Ty Chanh',     emoji: '🏢', incomePerUnit: 100,      pricePerUnit: 10000,   licensePrice: 1000000 },
    { name: 'Tập Đoàn Đa QG',   emoji: '🌐', incomePerUnit: 1000,    pricePerUnit: 100000,  licensePrice: 10000000 },
    { name: 'Đa Hành Tinh',      emoji: '🪐', incomePerUnit: 10000,   pricePerUnit: 1000000,licensePrice: 100000000 },
    { name: 'Liên Sao',          emoji: '⭐', incomePerUnit: 100000,  pricePerUnit: 10000000,licensePrice: 1000000000 },
    { name: 'Đa Ngân Hà',        emoji: '🌌', incomePerUnit: 1000000,pricePerUnit: 100000000,licensePrice: 10000000000 },
    { name: 'Đa Vũ Trụ MAX',     emoji: '♾️', incomePerUnit: 10000000,pricePerUnit:1000000000,licensePrice: null },
  ];

  const MAX_UNITS = 1000;

  // Số lượng muốn mua (mặc định 1)
  let buyAmount = 1;

  // ─────────────────────────────────────────
  function getState() { return STATE.business.lemonade; }

  function getIncome() {
    const { level, owned } = getState();
    const lv = LEVELS[level - 1];
    return lv ? lv.incomePerUnit * owned : 0;
  }

  function currentLevel() {
    return LEVELS[getState().level - 1];
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  function renderHTML() {
    const st = getState();
    const lv = currentLevel();
    const nextLv = LEVELS[st.level]; // undefined nếu max
    const income = getIncome();
    const maxReached = st.owned >= MAX_UNITS;
    const isMaxLevel = st.level >= 8;

    // Tax badge
    const taxRate = '8.3%';

    return `
      <div class="lemon-wrap">

        <!-- Header card -->
        <div class="lemon-header-card">
          <div class="lemon-emoji">${lv.emoji}</div>
          <div class="lemon-header-info">
            <div class="lemon-name">${lv.name}</div>
            <div class="lemon-level-badge">LV.${st.level}</div>
          </div>
          <div class="lemon-tax-badge">${taxRate}</div>
        </div>

        <!-- Stats row -->
        <div class="lemon-stats-row">
          <div class="lemon-stat">
            <div class="lemon-stat-val" id="lemon-owned">${st.owned}<span style="color:var(--text-dim);font-size:0.7rem">/${MAX_UNITS}</span></div>
            <div class="lemon-stat-lbl">Đơn Vị</div>
          </div>
          <div class="lemon-stat">
            <div class="lemon-stat-val">${Format.money(lv.incomePerUnit)}</div>
            <div class="lemon-stat-lbl">Income/đv/phút</div>
          </div>
          <div class="lemon-stat">
            <div class="lemon-stat-val" id="lemon-income" style="color:var(--green)">${Format.money(income)}</div>
            <div class="lemon-stat-lbl">Tổng/phút</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="lemon-progress-wrap">
          <div class="lemon-progress-bar">
            <div class="lemon-progress-fill" id="lemon-progress-fill"
                 style="width:${(st.owned/MAX_UNITS*100).toFixed(1)}%"></div>
          </div>
          <div class="lemon-progress-label" id="lemon-progress-label">
            ${st.owned}/${MAX_UNITS} đơn vị
          </div>
        </div>

        <!-- Buy amount selector -->
        <div class="lemon-buy-row">
          <div class="lemon-buy-amounts">
            ${[1,10,100,'Max'].map(n => `
              <button class="lemon-amt-btn ${buyAmount === n ? 'active' : ''}"
                      data-amt="${n}">${n}</button>
            `).join('')}
          </div>
          <div class="lemon-price-preview" id="lemon-price-preview">
            ${_buyPreviewText(lv, st.owned)}
          </div>
        </div>

        <!-- Buy button -->
        <button class="lemon-buy-btn ${maxReached ? 'disabled' : ''}"
                id="btn-lemon-buy" ${maxReached ? 'disabled' : ''}>
          ${maxReached
            ? '✅ ĐẦY ĐỦ 1000 ĐV'
            : `🛒 MUA ${_getBuyCount(st.owned)} ĐV — ${Format.money(_getBuyCost(lv, st.owned))}`}
        </button>

        <!-- Level up section -->
        ${_renderLevelUp(st, lv, nextLv, isMaxLevel)}

        <!-- Info footer -->
        <div class="lemon-footer">
          <div class="lemon-footer-row">
            <span>💰 Giá mỗi đv</span>
            <span style="color:var(--gold)">${Format.money(lv.pricePerUnit)}</span>
          </div>
          ${nextLv ? `
          <div class="lemon-footer-row">
            <span>⬆️ Level tiếp theo</span>
            <span style="color:var(--accent)">${nextLv.emoji} ${nextLv.name}</span>
          </div>` : ''}
          <div class="lemon-footer-row">
            <span>📊 Income/đv tiếp</span>
            <span style="color:var(--green)">${nextLv ? Format.money(nextLv.incomePerUnit) + '/phút' : '— MAX —'}</span>
          </div>
        </div>

      </div>
    `;
  }

  function _renderLevelUp(st, lv, nextLv, isMaxLevel) {
    if (isMaxLevel) return `
      <div class="lemon-levelup-card lemon-maxed">
        <span>♾️ ĐÃ ĐẠT CẤP ĐỘ TỐI ĐA</span>
      </div>`;

    if (!st.hasLicense) {
      // Chưa có giấy phép → mua giấy phép
      const canAfford = STATE.balance >= lv.licensePrice;
      return `
        <div class="lemon-levelup-card">
          <div class="lemon-levelup-title">🪪 Giấy Phép Lên Cấp ${st.level + 1}</div>
          <div class="lemon-levelup-sub">
            Sở hữu đủ 1000 đv + mua giấy phép để lên
            <strong style="color:var(--gold)"> ${nextLv?.emoji} ${nextLv?.name}</strong>
          </div>
          <div class="lemon-levelup-cost">
            <span>Chi phí:</span>
            <span style="color:${canAfford ? 'var(--gold)' : 'var(--red)'}">${Format.money(lv.licensePrice)}</span>
          </div>
          <button class="lemon-license-btn ${canAfford ? '' : 'disabled'}"
                  id="btn-lemon-license" ${canAfford ? '' : 'disabled'}>
            🪪 MUA GIẤY PHÉP (${Format.money(lv.licensePrice)})
          </button>
        </div>`;
    } else {
      // Đã có giấy phép → nâng cấp nếu đủ 1000 đv
      const canUpgrade = st.owned >= MAX_UNITS;
      return `
        <div class="lemon-levelup-card lemon-licensed">
          <div class="lemon-levelup-title">✅ Đã Có Giấy Phép</div>
          <div class="lemon-levelup-sub">
            ${canUpgrade
              ? `Sẵn sàng lên <strong style="color:var(--gold)">${nextLv?.emoji} ${nextLv?.name}</strong>!`
              : `Cần thêm <strong style="color:var(--accent)">${MAX_UNITS - st.owned} đv</strong> để lên cấp`}
          </div>
          <button class="lemon-upgrade-btn ${canUpgrade ? '' : 'disabled'}"
                  id="btn-lemon-upgrade" ${canUpgrade ? '' : 'disabled'}>
            ⬆️ LÊN CẤP ${st.level + 1}: ${nextLv?.emoji} ${nextLv?.name?.toUpperCase()}
          </button>
        </div>`;
    }
  }

  // ─────────────────────────────────────────
  // BUY HELPERS
  // ─────────────────────────────────────────
  function _getBuyCount(owned) {
    const lv = LEVELS[getState().level - 1];
    if (!lv) return 0;
    if (buyAmount === 'Max') {
      // Max theo tiền đang có, không vượt slot còn trống
      const maxByMoney = lv.pricePerUnit > 0 ? Math.floor(STATE.balance / lv.pricePerUnit) : 0;
      return Math.min(maxByMoney, MAX_UNITS - owned);
    }
    return Math.min(buyAmount, MAX_UNITS - owned);
  }

  function _getBuyCost(lv, owned) {
    return _getBuyCount(owned) * lv.pricePerUnit;
  }

  function _buyPreviewText(lv, owned) {
    const count = _getBuyCount(owned);
    if (count <= 0) return 'Đã đầy';
    return `${count} đv × ${Format.money(lv.pricePerUnit)} = ${Format.money(count * lv.pricePerUnit)}`;
  }

  // ─────────────────────────────────────────
  // BIND EVENTS
  // ─────────────────────────────────────────
  function bindEvents() {
    // Amount selector
    document.querySelectorAll('.lemon-amt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.amt;
        buyAmount = val === 'Max' ? 'Max' : parseInt(val);
        document.querySelectorAll('.lemon-amt-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.amt === val));
        _updateBuyBtn();
        _updatePreview();
      });
    });

    // Buy button
    document.getElementById('btn-lemon-buy')?.addEventListener('click', () => {
      const st = getState();
      const lv = currentLevel();
      const count = _getBuyCount(st.owned);
      const cost = count * lv.pricePerUnit;
      if (count <= 0) return;
      if (STATE.balance < cost) { UI.toast('Không đủ tiền!', 'error'); return; }
      STATE.balance -= cost;
      STATE.stats.spentBusiness += cost;
      STATE.totalEarned = (STATE.totalEarned || 0);
      st.owned += count;
      UI.toast(`+${count} đv ${lv.emoji}`, 'success');
      _refresh();
    });

    // Buy license
    document.getElementById('btn-lemon-license')?.addEventListener('click', () => {
      const st = getState();
      const lv = currentLevel();
      if (STATE.balance < lv.licensePrice) { UI.toast('Không đủ tiền!', 'error'); return; }
      STATE.balance -= lv.licensePrice;
      STATE.stats.spentBusiness += lv.licensePrice;
      st.hasLicense = true;
      UI.toast('🪪 Đã mua giấy phép!', 'success');
      _refresh();
    });

    // Level up
    document.getElementById('btn-lemon-upgrade')?.addEventListener('click', () => {
      const st = getState();
      if (st.owned < MAX_UNITS || !st.hasLicense) return;
      const oldName = currentLevel().name;
      st.level += 1;
      st.owned = 0;
      st.hasLicense = false;
      const newLv = currentLevel();
      UI.toast(`⬆️ Lên cấp ${st.level}: ${newLv.emoji} ${newLv.name}!`, 'success');
      _refresh();
    });
  }

  function _updateBuyBtn() {
    const st = getState();
    const lv = currentLevel();
    const count = _getBuyCount(st.owned);
    const cost = _getBuyCost(lv, st.owned);
    const btn = document.getElementById('btn-lemon-buy');
    if (!btn) return;
    if (st.owned >= MAX_UNITS) {
      btn.textContent = '✅ ĐẦY ĐỦ 1000 ĐV';
      btn.disabled = true;
    } else {
      btn.textContent = `🛒 MUA ${count} ĐV — ${Format.money(cost)}`;
      btn.disabled = STATE.balance < cost;
    }
  }

  function _updatePreview() {
    const st = getState();
    const lv = currentLevel();
    const el = document.getElementById('lemon-price-preview');
    if (el) el.textContent = _buyPreviewText(lv, st.owned);
  }

  // Gọi từ engine tick để update income realtime
  function tickIncome() {
    const incEl = document.getElementById('lemon-income-total');
    if (incEl) incEl.textContent = Format.money(getIncome());
    // Update topbar income trong detail view
    const detailEl = document.getElementById('biz-detail-income');
    if (detailEl) detailEl.textContent = Format.money(getIncome()) + '/phút';
    // Update nút mua (giá thay đổi theo balance)
    _updateBuyBtn();
  }

  function _refresh() {
    // Re-render toàn bộ tab
    const content = document.getElementById('biz-content');
    if (!content) return;
    content.innerHTML = renderHTML();
    bindEvents();
    if (typeof BusinessPage !== 'undefined') BusinessPage.tick();
  }

  // Gọi từ engine tick — update số liệu live mà không re-render
  function tick() {
    const st = getState();
    const lv = currentLevel();
    const income = getIncome();

    const ownedEl = document.getElementById('lemon-owned');
    if (ownedEl) ownedEl.innerHTML = `${st.owned}<span style="color:var(--text-dim);font-size:0.7rem">/${MAX_UNITS}</span>`;

    const incomeEl = document.getElementById('lemon-income');
    if (incomeEl) incomeEl.textContent = Format.money(income);

    const fill = document.getElementById('lemon-progress-fill');
    if (fill) fill.style.width = (st.owned / MAX_UNITS * 100).toFixed(1) + '%';

    const lbl = document.getElementById('lemon-progress-label');
    if (lbl) lbl.textContent = `${st.owned}/${MAX_UNITS} đơn vị`;

    _updateBuyBtn();
    _updatePreview();
  }

  return { renderHTML, bindEvents, getIncome, tick };

})();