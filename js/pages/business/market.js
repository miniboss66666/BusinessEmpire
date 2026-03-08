/* ============================================
   BUSINESS/MARKET.JS
   - Kho chung lv1→50, max $50M worth
   - 5 loại cửa hàng, max 300→1000 chi nhánh
   - Manager kho lv1→5 tự động nhập hàng
   ============================================ */

const BusinessMarket = (() => {

  // ── DATA ──────────────────────────────────
  const STORE_DATA = {
    retail:      { emoji:'🛍️', name:'Bán Lẻ',    sellPerMin:2, sellPrice:4, costPerUnit:2, gpPrice:100,   gpMultiPrice:10000,  maxBranch:300, maxMulti:1000 },
    toy:         { emoji:'🧸', name:'Đồ Chơi',   sellPerMin:4, sellPrice:5, costPerUnit:2, gpPrice:150,   gpMultiPrice:15000,  maxBranch:300, maxMulti:1000 },
    supermarket: { emoji:'🛒', name:'Siêu Thị',  sellPerMin:7, sellPrice:6, costPerUnit:2, gpPrice:500,   gpMultiPrice:25000,  maxBranch:300, maxMulti:1000 },
    pharmacy:    { emoji:'💊', name:'Thuốc',      sellPerMin:2, sellPrice:8, costPerUnit:2, gpPrice:10000,gpMultiPrice:50000,  maxBranch:300, maxMulti:1000 },
    electronics: { emoji:'📱', name:'Điện Tử',   sellPerMin:4, sellPrice:7, costPerUnit:2, gpPrice:1000, gpMultiPrice:35000,  maxBranch:300, maxMulti:1000 },
  };

  // Kho: 20 levels, max 10 tỷ
  const WAREHOUSE_DATA = (() => {
    const levels = 20;
    const minStock = 1_000;
    const maxStock = 10_000_000_000;
    const ratio = Math.pow(maxStock / minStock, 1 / (levels - 1));
    return Array.from({length: levels}, (_, i) => ({
      level: i + 1,
      maxStock: Math.round(minStock * Math.pow(ratio, i)),
      upgradePrice: i === 0 ? 0 : Math.round(500 * Math.pow(8, i)),
    }));
  })();

  const RESTOCK_PRICE = 2; // $2/unit

  // Manager: 20 levels
  // - restockInterval: giây giữa mỗi lần nhập (20s → 1s)
  // - triggerPct: nhập khi kho dưới X% (tùy chọn người dùng)
  // - restockPct: nhập bao nhiêu % chỗ trống (tùy chọn người dùng)
  // - extraCost: +chi phí %
  const MANAGER_DATA = (() => {
    const arr = [null];
    for (let i = 1; i <= 20; i++) {
      const intervalSecs = Math.max(1, Math.round(20 - (20 - 1) * (i - 1) / 19)); // 20→1
      arr.push({
        level: i,
        intervalSecs,
        extraCost: 0.05 + i * 0.01,          // 6%→25%
        price: Math.round(500 * Math.pow(3.5, i - 1)),
      });
    }
    return arr;
  })();
  // Manager settings (người dùng chọn)
  // triggerPct: nhập khi kho còn ≤ X%  (25/50/75/100)
  // restockPct: nhập đủ X% dung lượng kho (25/50/75/100)

  // Store level → consume multiplier (2→10/phút)
  const STORE_LEVEL_CONSUME = [1, 1.5, 3, 6, 10]; // lv1→5

  let currentTab = 'warehouse';
  let currentView = 'dashboard';
  let restockInput = 100;
  let _mgrTimer = null; // interval timer cho manager auto restock

  function _getMgrSettings() {
    const s = st();
    if (!s.mgrSettings) s.mgrSettings = { triggerPct: 50, restockPct: 100 };
    return s.mgrSettings;
  }

  // ── HELPERS ───────────────────────────────
  function st() { return STATE.business.market; }

  function warehouseMax() {
    const lv = st().warehouse.level;
    return WAREHOUSE_DATA[lv - 1]?.maxStock || 1000;
  }

  function storeConsumePerMin(key) {
    const store = st().stores[key];
    return (STORE_DATA[key].sellPerMin) * STORE_LEVEL_CONSUME[Math.min(store.level-1, 4)];
  }

  function storeProfitPerMin(key) {
    const data = STORE_DATA[key];
    const store = st().stores[key];
    if (store.owned <= 0) return 0;
    const profit = (data.sellPrice - data.costPerUnit) * data.sellPerMin * STORE_LEVEL_CONSUME[Math.min(store.level-1,4)] / STORE_DATA[key].sellPerMin * data.sellPerMin;
    // Đơn giản hơn: profit = (sellPrice - cost) * sellPerMin * storeLevel multiplier
    const lvMult = STORE_LEVEL_CONSUME[Math.min(store.level-1,4)];
    return (data.sellPrice - data.costPerUnit) * data.sellPerMin * lvMult * store.owned;
  }

  function getIncome() {
    let total = 0;
    for (const key of Object.keys(STORE_DATA)) {
      total += storeProfitPerMin(key);
    }
    return total;
  }

  function totalConsumePerMin() {
    let t = 0;
    for (const key of Object.keys(STORE_DATA)) {
      t += storeConsumePerMin(key) * st().stores[key].owned;
    }
    return t;
  }

  // ── RENDER HTML ───────────────────────────
  function renderHTML() {
    if (currentView === 'detail') return renderDetail();
    return renderDashboard();
  }

  // ── DASHBOARD CARDS ───────────────────────
  function renderDashboard() {
    const s = st();
    const whPct = warehouseMax() > 0 ? (s.warehouse.stock / warehouseMax() * 100).toFixed(0) : 0;

    const CARDS = [
      {
        key: 'warehouse',
        emoji: '📦',
        name: 'Kho Hàng',
        desc: `Cấp ${s.warehouse.level} · ${Format.money(s.warehouse.stock)} đv`,
        stats: [
          { label: 'Dung lượng', value: `${whPct}% đầy` },
          { label: 'Manager', value: s.manager > 0 ? `Cấp ${s.manager}` : 'Chưa có' },
          { label: 'Tiêu/phút', value: Format.money(totalConsumePerMin()) },
        ],
        income: null,
        disabled: false,
      },
      ...Object.entries(STORE_DATA).map(([key, d]) => {
        const store = s.stores[key];
        return {
          key, emoji: d.emoji, name: d.name,
          desc: store.isMultinational ? '🌐 Đa Quốc Gia' : `${store.owned} chi nhánh`,
          stats: [
            { label: 'Chi nhánh', value: `${store.owned}/${store.isMultinational ? d.maxMulti : d.maxBranch}` },
            { label: 'Cấp', value: `LV.${store.level}` },
            { label: 'Thu nhập', value: Format.money(storeProfitPerMin(key)) + '/ph', green: true },
          ],
          income: storeProfitPerMin(key),
          disabled: false,
        };
      }),
      { key:'cs', emoji:'❓', name:'Coming Soon', desc:'Sắp ra mắt...', stats:[], income:null, disabled:true },
    ];

    return `
      <div class="mkt-dash-wrap">
        <div class="mkt-dash-list">
          ${CARDS.map(card => `
            <div class="mkt-dash-card ${card.disabled ? 'mkt-soon' : ''}">
              <div class="mkt-dash-top">
                <span class="mkt-dash-emoji">${card.emoji}</span>
                <div class="mkt-dash-info">
                  <div class="mkt-dash-name">${card.name}</div>
                  <div class="mkt-dash-desc">${card.desc}</div>
                </div>
                ${card.income !== null ? `<div class="mkt-dash-income">${Format.money(card.income)}<span style="font-size:0.58rem;color:var(--text-dim)">/ph</span></div>` : ''}
              </div>
              ${card.stats.length ? `
              <div class="mkt-dash-stats">
                ${card.stats.map(s => `
                  <div class="mkt-dash-stat">
                    <span>${s.label}</span>
                    <span class="${s.green ? 'mkt-green' : ''}">${s.value}</span>
                  </div>`).join('')}
              </div>` : ''}
              <button class="mkt-manage-btn ${card.disabled ? 'disabled' : ''}"
                      data-key="${card.key}" ${card.disabled ? 'disabled' : ''}>
                ${card.disabled ? '🔒 COMING SOON' : '⚙️ QUẢN LÝ'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  // ── DETAIL VIEW ───────────────────────────
  function renderDetail() {
    const label = currentTab === 'warehouse' ? '📦 Kho Hàng'
      : `${STORE_DATA[currentTab]?.emoji} ${STORE_DATA[currentTab]?.name}`;
    return `
      <div class="mkt-detail-wrap">
        <div class="mkt-detail-topbar">
          <button class="mkt-back-btn" id="btn-mkt-back">← Quay Lại</button>
          <span class="mkt-detail-title">${label}</span>
        </div>
        <div class="mkt-detail-content" id="mkt-content">
          ${renderTabContent()}
        </div>
      </div>`;
  }

  function renderTabContent() {
    if (currentTab === 'warehouse') return renderWarehouse();
    return renderStore(currentTab);
  }

  // ── WAREHOUSE ─────────────────────────────
  function renderWarehouse() {
    const s = st();
    const wh = s.warehouse;
    const max = warehouseMax();
    const pct = max > 0 ? (wh.stock / max * 100).toFixed(1) : 0;
    const consume = totalConsumePerMin();
    const hoursLeft = consume > 0 ? (wh.stock / consume / 60).toFixed(1) : '∞';
    const mgr = MANAGER_DATA[s.manager];
    const nextMgr = MANAGER_DATA[s.manager + 1];
    const nextWh = WAREHOUSE_DATA[wh.level]; // undefined if max

    // Restock cost
    const restockQty = Math.min(restockInput, max - wh.stock);
    const restockCost = restockQty * RESTOCK_PRICE;

    return `
      <div class="wh-section">
        <!-- Kho stats -->
        <div class="wh-card">
          <div class="wh-card-header">
            <span class="wh-title">📦 Kho Hàng — Cấp ${wh.level}</span>
            <span class="wh-tax-badge">8.3%</span>
          </div>
          <div class="wh-bar-wrap" id="wh-stock-live" title="stock">
            <div class="wh-bar">
              <div class="wh-bar-fill ${pct > 80 ? 'high' : pct > 40 ? 'mid' : 'low'}"
                   style="width:${pct}%"></div>
            </div>
            <div class="wh-bar-labels">
              <span id="wh-stock-label">${Format.money(wh.stock)} / ${Format.money(max)}</span>
              <span style="color:var(--text-dim)">⏱ ${hoursLeft}h còn lại</span>
            </div>
          </div>
          <div class="wh-stats-row">
            <div class="wh-stat">
              <span class="wh-stat-val">${Format.money(consume)}</span>
              <span class="wh-stat-lbl">Tiêu/phút</span>
            </div>
            <div class="wh-stat">
              <span class="wh-stat-val" style="color:var(--green)" id="wh-income-live">${Format.money(getIncome())}</span>
              <span class="wh-stat-lbl">Lãi/phút</span>
            </div>
            <div class="wh-stat">
              <span class="wh-stat-val">${Format.money(max - wh.stock)}</span>
              <span class="wh-stat-lbl">Chỗ trống</span>
            </div>
          </div>
        </div>

        <!-- Nhập hàng thủ công -->
        <div class="wh-card">
          <div class="wh-section-title">🚚 Nhập Hàng ($${RESTOCK_PRICE}/đv)</div>
          <div class="wh-restock-pct-row">
            ${[25,50,75,100].map(p => {
              const qty = Math.floor((max - wh.stock) * p / 100);
              return `<button class="wh-pct-btn" data-qty="${qty}">${p}%</button>`;
            }).join('')}
          </div>
          <div class="wh-restock-input-row">
            <input type="number" id="wh-restock-input" class="wh-input"
                   value="${restockInput}" min="1" max="${max - wh.stock}"
                   placeholder="Số lượng"/>
            <span class="wh-restock-cost" id="wh-restock-cost">
              = ${Format.money(restockCost)}
            </span>
          </div>
          <button class="wh-restock-btn" id="btn-wh-restock"
                  ${wh.stock >= max || STATE.balance < restockCost ? 'disabled' : ''}>
            📥 NHẬP ${Format.money(restockQty)} ĐV — ${Format.money(restockCost)}
          </button>
        </div>

        <!-- Manager -->
        <div class="wh-card">
          <div class="wh-section-title">👔 Quản Lý Kho</div>
          ${mgr ? `
            <div class="wh-mgr-active">
              <div class="wh-mgr-info">
                <span>✅ Manager Cấp ${mgr.level}</span>
                <span style="color:var(--accent)">⚡ Nhập mỗi ${mgr.intervalSecs}s</span>
                <span style="color:var(--gold)">+${(mgr.extraCost*100).toFixed(0)}% chi phí</span>
              </div>

              <!-- Trigger threshold -->
              <div class="wh-mgr-setting">
                <div class="wh-mgr-setting-label">🔔 Nhập khi kho còn ≤</div>
                <div class="wh-mgr-btns" id="mgr-trigger-btns">
                  ${[25,50,75,100].map(p => `
                    <button class="wh-mgr-opt-btn ${_getMgrSettings().triggerPct===p?'active':''}"
                            data-trigger="${p}">${p}%</button>`).join('')}
                </div>
              </div>

              <!-- Restock amount -->
              <div class="wh-mgr-setting">
                <div class="wh-mgr-setting-label">📦 Nhập bao nhiêu khi kích hoạt</div>
                <div class="wh-mgr-btns" id="mgr-restock-btns">
                  ${[25,50,75,100].map(p => `
                    <button class="wh-mgr-opt-btn ${_getMgrSettings().restockPct===p?'active':''}"
                            data-restock="${p}">${p}%</button>`).join('')}
                </div>
              </div>
              <div class="wh-mgr-hint">
                Khi kho ≤ <strong>${_getMgrSettings().triggerPct}%</strong> → nhập thêm
                <strong>${_getMgrSettings().restockPct}%</strong> dung lượng còn trống
              </div>
            ` : `
            <div class="wh-mgr-none">Chưa có manager — hàng sẽ hết nếu không nhập thủ công</div>`}
          ${nextMgr ? `
            <button class="wh-mgr-btn" id="btn-wh-mgr"
                    ${STATE.balance < nextMgr.price ? 'disabled' : ''}>
              ${mgr ? `⬆️ NÂNG CẤP → Cấp ${nextMgr.level} (${nextMgr.intervalSecs}s)` : '➕ THUÊ MANAGER'} — ${Format.money(nextMgr.price)}
            </button>` : (mgr ? `
            <div class="wh-mgr-max">👑 Manager MAX (Cấp 20 · 1s)</div>` : '')}
        </div>

        <!-- Nâng cấp kho -->
        ${nextWh ? `
        <div class="wh-card">
          <div class="wh-section-title">⬆️ Nâng Cấp Kho</div>
          <div class="wh-upgrade-row">
            <div>
              <div style="font-size:0.72rem;color:var(--text-dim)">Cấp ${wh.level} → ${wh.level+1}</div>
              <div style="font-size:0.7rem;color:var(--text-dim);margin-top:2px">
                Dung lượng: ${Format.money(max)} → ${Format.money(nextWh.maxStock)}
              </div>
            </div>
            <button class="wh-upgrade-btn" id="btn-wh-upgrade"
                    ${STATE.balance < nextWh.upgradePrice ? 'disabled' : ''}>
              ${Format.money(nextWh.upgradePrice)}
            </button>
          </div>
        </div>` : `
        <div class="wh-card wh-maxed">🏆 KHO ĐẠT CẤP TỐI ĐA (50)</div>`}
      </div>`;
  }

  // ── STORE ─────────────────────────────────
  function renderStore(key) {
    const data = STORE_DATA[key];
    const store = st().stores[key];
    const profit = storeProfitPerMin(key);
    const consume = storeConsumePerMin(key) * store.owned;
    const isMulti = store.isMultinational;
    const maxBranch = isMulti ? data.maxMulti : data.maxBranch;
    const gpPrice = data.gpPrice;
    const gpMultiPrice = data.gpMultiPrice;
    const canBuyGP = !isMulti && store.owned >= data.maxBranch;

    return `
      <div class="store-section">
        <!-- Store header -->
        <div class="store-header-card">
          <div class="store-emoji">${data.emoji}</div>
          <div class="store-header-info">
            <div class="store-name">${data.name}</div>
            <div class="store-badges">
              <span class="store-level-badge">CẤP ${store.level}</span>
              ${isMulti ? '<span class="store-multi-badge">🌐 ĐA QUỐC GIA</span>' : ''}
            </div>
          </div>
          <div class="store-tax-badge">8.3%</div>
        </div>

        <!-- Stats -->
        <div class="store-stats-row">
          <div class="store-stat">
            <span class="store-stat-val">${store.owned}<span style="font-size:0.6rem;color:var(--text-dim)">/${maxBranch}</span></span>
            <span class="store-stat-lbl">Chi Nhánh</span>
          </div>
          <div class="store-stat">
            <span class="store-stat-val">${Format.money(data.sellPerMin)}/ph</span>
            <span class="store-stat-lbl">Bán/chi nhánh</span>
          </div>
          <div class="store-stat">
            <span class="store-stat-val" style="color:var(--green)">${Format.money(profit)}</span>
            <span class="store-stat-lbl">Lãi/phút</span>
          </div>
        </div>

        <!-- Info row -->
        <div class="store-info-row">
          <div class="store-info-item">
            <span>💰 Giá mở</span>
            <span style="color:var(--gold)">${Format.money(gpPrice)}</span>
          </div>
          <div class="store-info-item">
            <span>🏪 Giá bán</span>
            <span>${Format.money(data.sellPrice)}/đv</span>
          </div>
          <div class="store-info-item">
            <span>📦 Tiêu kho</span>
            <span style="color:var(--text-dim)">${Format.money(consume)}/phút</span>
          </div>
          <div class="store-info-item">
            <span>📈 Lãi/đv</span>
            <span style="color:var(--green)">${Format.money(data.sellPrice - data.costPerUnit)}</span>
          </div>
        </div>

        <!-- Mua chi nhánh -->
        ${store.owned < maxBranch ? `
        <div class="store-buy-amounts">
          ${[1,5,10,'Max'].map(n => `
            <button class="store-amt-btn" data-store="${key}" data-n="${n}">${n}</button>
          `).join('')}
        </div>
        <button class="store-buy-btn" data-store="${key}" data-n="1" id="btn-store-buy-${key}">
          ➕ MỞ 1 CHI NHÁNH — ${Format.money(gpPrice)}
        </button>` : `
        <div class="store-full-badge">✅ ĐẦY ĐỦ ${maxBranch} CHI NHÁNH</div>`}

        <!-- Nâng cấp level cửa hàng -->
        ${store.level < 5 ? `
        <div class="store-upgrade-card">
          <div class="store-upgrade-info">
            <span>⬆️ Nâng Cấp Cấp ${store.level} → ${store.level+1}</span>
            <span style="color:var(--text-dim);font-size:0.68rem">Tiêu kho x${STORE_LEVEL_CONSUME[store.level]} → x${STORE_LEVEL_CONSUME[store.level+1] || STORE_LEVEL_CONSUME[4]}</span>
          </div>
          <button class="store-lvup-btn" id="btn-store-lv-${key}"
                  ${STATE.balance < gpPrice * Math.pow(10, store.level) ? 'disabled' : ''}>
            ${Format.money(gpPrice * Math.pow(10, store.level))}
          </button>
        </div>` : `
        <div class="store-lv-maxed">⭐ CỬA HÀNG ĐẠT CẤP TỐI ĐA</div>`}

        <!-- Đa quốc gia -->
        ${!isMulti && canBuyGP ? `
        <div class="store-multi-card">
          <div class="store-multi-title">🌐 Mở Rộng Đa Quốc Gia</div>
          <div class="store-multi-sub">Mở thêm đến ${data.maxMulti} chi nhánh toàn cầu!</div>
          <button class="store-multi-btn" id="btn-store-multi-${key}"
                  ${STATE.balance < gpMultiPrice ? 'disabled' : ''}>
            🌐 ĐA QUỐC GIA — ${Format.money(gpMultiPrice)}
          </button>
        </div>` : !isMulti ? `
        <div class="store-multi-hint">
          Cần đủ ${data.maxBranch} chi nhánh để mở đa quốc gia
          <div class="store-multi-progress">
            <div class="store-multi-bar" style="width:${(store.owned/data.maxBranch*100).toFixed(0)}%"></div>
          </div>
        </div>` : ''}
      </div>`;
  }

  // ── BIND EVENTS ───────────────────────────
  function bindEvents() {
    if (currentView === 'detail') {
      // Back button
      document.getElementById('btn-mkt-back')?.addEventListener('click', () => {
        currentView = 'dashboard';
        _refreshFull();
      });
      // Sub-tab buttons (chỉ trong warehouse detail)
      document.querySelectorAll('.mkt-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentTab = btn.dataset.tab;
          document.querySelectorAll('.mkt-tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === currentTab));
          document.getElementById('mkt-content').innerHTML = renderTabContent();
          bindContentEvents();
        });
      });
      bindContentEvents();
    } else {
      // Dashboard: manage buttons
      document.querySelectorAll('.mkt-manage-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          currentTab = btn.dataset.key;
          currentView = 'detail';
          _refreshFull();
        });
      });
    }
  }

  function bindContentEvents() {
    if (currentTab === 'warehouse') bindWarehouseEvents();
    else bindStoreEvents(currentTab);
  }

  function bindWarehouseEvents() {
    const s = st();
    const max = warehouseMax();

    // % buttons
    document.querySelectorAll('.wh-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        restockInput = parseInt(btn.dataset.qty) || 1;
        const inp = document.getElementById('wh-restock-input');
        if (inp) inp.value = restockInput;
        _updateRestockBtn();
      });
    });

    // Input
    document.getElementById('wh-restock-input')?.addEventListener('input', function() {
      restockInput = Math.max(1, Math.min(parseInt(this.value)||1, max - s.warehouse.stock));
      _updateRestockBtn();
    });

    // Restock
    document.getElementById('btn-wh-restock')?.addEventListener('click', () => {
      const qty = Math.min(restockInput, max - s.warehouse.stock);
      const cost = qty * RESTOCK_PRICE;
      if (qty <= 0 || STATE.balance < cost) return;
      STATE.balance -= cost;
      STATE.stats.spentBusiness += cost;
      s.warehouse.stock += qty;
      UI.toast(`📦 Nhập ${Format.money(qty)} hàng!`, 'success');
      _refresh();
    });

    // Manager
    document.getElementById('btn-wh-mgr')?.addEventListener('click', () => {
      const nextMgr = MANAGER_DATA[s.manager + 1];
      if (!nextMgr || STATE.balance < nextMgr.price) return;
      STATE.balance -= nextMgr.price;
      STATE.stats.spentBusiness += nextMgr.price;
      s.manager++;
      UI.toast(`👔 ${s.manager === 1 ? 'Thuê' : 'Nâng cấp'} Manager Cấp ${s.manager}!`, 'success');
      _refresh();
    });

    // Upgrade warehouse
    document.getElementById('btn-wh-upgrade')?.addEventListener('click', () => {
      const nextWh = WAREHOUSE_DATA[s.warehouse.level];
      if (!nextWh || STATE.balance < nextWh.upgradePrice) return;
      STATE.balance -= nextWh.upgradePrice;
      STATE.stats.spentBusiness += nextWh.upgradePrice;
      s.warehouse.level++;
      UI.toast(`📦 Kho nâng cấp lên ${s.warehouse.level}!`, 'success');
      _refresh();
    });
  }

  function bindStoreEvents(key) {
    const s = st();
    const store = s.stores[key];
    const data = STORE_DATA[key];
    let buyN = 1;

    // Amount buttons
    document.querySelectorAll(`.store-amt-btn[data-store="${key}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset.n;
        buyN = raw === 'Max' ? 'Max' : parseInt(raw);
        document.querySelectorAll(`.store-amt-btn[data-store="${key}"]`).forEach(b =>
          b.classList.toggle('active', b.dataset.n === raw));
        _updateStoreBuyBtn(key, buyN);
      });
    });

    // Buy branch
    document.getElementById(`btn-store-buy-${key}`)?.addEventListener('click', () => {
      const maxB = store.isMultinational ? data.maxMulti : data.maxBranch;
      let count;
      if (buyN === 'Max') {
        const maxByMoney = data.gpPrice > 0 ? Math.floor(STATE.balance / data.gpPrice) : 0;
        count = Math.min(maxByMoney, maxB - store.owned);
      } else {
        count = Math.min(buyN, maxB - store.owned);
      }
      const cost = count * data.gpPrice;
      if (count <= 0 || STATE.balance < cost) { UI.toast('Không đủ tiền!','error'); return; }
      STATE.balance -= cost;
      STATE.stats.spentBusiness += cost;
      store.owned += count;
      UI.toast(`${data.emoji} Mở ${count} chi nhánh!`, 'success');
      _refresh();
    });

    // Level up store
    document.getElementById(`btn-store-lv-${key}`)?.addEventListener('click', () => {
      const cost = data.gpPrice * Math.pow(10, store.level);
      if (store.level >= 5 || STATE.balance < cost) return;
      STATE.balance -= cost;
      STATE.stats.spentBusiness += cost;
      store.level++;
      UI.toast(`${data.emoji} Cửa hàng lên Cấp ${store.level}!`, 'success');
      _refresh();
    });

    // Multinational
    document.getElementById(`btn-store-multi-${key}`)?.addEventListener('click', () => {
      if (STATE.balance < data.gpMultiPrice) return;
      STATE.balance -= data.gpMultiPrice;
      STATE.stats.spentBusiness += data.gpMultiPrice;
      store.isMultinational = true;
      UI.toast(`🌐 ${data.name} đã đa quốc gia!`, 'success');
      _refresh();
    });
  }

  function _updateRestockBtn() {
    const s = st();
    const max = warehouseMax();
    const qty = Math.min(restockInput, max - s.warehouse.stock);
    const cost = qty * RESTOCK_PRICE;
    const btn = document.getElementById('btn-wh-restock');
    const costEl = document.getElementById('wh-restock-cost');
    if (btn) {
      btn.textContent = `📥 NHẬP ${Format.money(qty)} ĐV — ${Format.money(cost)}`;
      btn.disabled = qty <= 0 || STATE.balance < cost;
    }
    if (costEl) costEl.textContent = `= ${Format.money(cost)}`;
  }

  function _updateStoreBuyBtn(key, buyN) {
    const store = st().stores[key];
    const data = STORE_DATA[key];
    const maxB = store.isMultinational ? data.maxMulti : data.maxBranch;
    let count;
    if (buyN === 'Max') {
      const maxByMoney = data.gpPrice > 0 ? Math.floor(STATE.balance / data.gpPrice) : 0;
      count = Math.min(maxByMoney, maxB - store.owned);
    } else {
      count = Math.min(buyN, maxB - store.owned);
    }
    const cost = count * data.gpPrice;
    const btn = document.getElementById(`btn-store-buy-${key}`);
    if (btn) {
      btn.textContent = `➕ MỞ ${count} CHI NHÁNH — ${Format.money(cost)}`;
      btn.disabled = count <= 0 || STATE.balance < cost;
    }
  }

  function _refresh() {
    if (currentView === 'detail') {
      const content = document.getElementById('mkt-content');
      if (!content) return;
      content.innerHTML = renderTabContent();
      bindContentEvents();
    } else {
      _refreshFull();
    }
    if (typeof BusinessPage !== 'undefined') BusinessPage.tick();
  }

  function _refreshFull() {
    const wrap = document.getElementById('biz-detail-content');
    if (!wrap) return;
    wrap.innerHTML = renderHTML();
    bindEvents();
    const detailEl = document.getElementById('biz-detail-income');
    if (detailEl) detailEl.textContent = Format.money(getIncome()) + '/phút';
  }

  // Engine tick: tiêu hàng từ kho mỗi phút
  function tick() {
    const s = st();
    const consume = totalConsumePerMin();
    if (consume > 0 && s.warehouse.stock > 0) {
      s.warehouse.stock = Math.max(0, s.warehouse.stock - consume);
    }
    // Manager auto restock: handled by _startMgrTimer() setInterval
    // Update UI realtime (chỉ các số, không re-render toàn bộ)
    _tickUI();
  }

  function _refreshMgrHint() {
    const hint = document.querySelector('.wh-mgr-hint');
    if (!hint) return;
    const cfg = _getMgrSettings();
    hint.innerHTML = `Khi kho ≤ <strong>${cfg.triggerPct}%</strong> → nhập thêm <strong>${cfg.restockPct}%</strong> dung lượng còn trống`;
  }

  function _startMgrTimer() {
    if (_mgrTimer) clearInterval(_mgrTimer);
    const s = st();
    const mgr = MANAGER_DATA[s.manager];
    if (!mgr) return;
    _mgrTimer = setInterval(() => {
      const ss = st();
      const mgrNow = MANAGER_DATA[ss.manager];
      if (!mgrNow) return;
      const max = warehouseMax();
      const cfg = _getMgrSettings();
      const pct = max > 0 ? ss.warehouse.stock / max * 100 : 100;
      if (pct <= cfg.triggerPct) {
        const spaceLeft = max - ss.warehouse.stock;
        const qty = Math.floor(spaceLeft * cfg.restockPct / 100);
        if (qty <= 0) return;
        const cost = qty * RESTOCK_PRICE * (1 + mgrNow.extraCost);
        if (STATE.balance >= cost) {
          STATE.balance -= cost;
          ss.warehouse.stock += qty;
          _tickUI();
        }
      }
    }, mgr.intervalSecs * 1000);
  }

  function _tickUI() {
    const s = st();
    const wh = s.warehouse;
    const max = warehouseMax();
    const pct = max > 0 ? (wh.stock / max * 100).toFixed(1) : 0;
    const timeLeft = totalConsumePerMin() > 0
      ? (wh.stock / totalConsumePerMin() / 60).toFixed(1)
      : '∞';

    // Progress bar
    const bar = document.querySelector('.wh-bar-fill');
    if (bar) {
      bar.style.width = pct + '%';
      bar.style.background = pct < 20 ? 'var(--red)' : pct < 50 ? '#f4a030' : 'var(--accent)';
    }
    // Stock text
    const stockEl = document.getElementById('wh-stock-live');
    if (stockEl) stockEl.textContent = Format.money(wh.stock) + ' / ' + Format.money(max);
    // Time left
    const timeEl = document.getElementById('wh-time-live');
    if (timeEl) timeEl.textContent = '⏱ ' + timeLeft + 'h còn lại';
    // Income
    const incEl = document.getElementById('wh-income-live');
    if (incEl) incEl.textContent = Format.money(getIncome());
  }

  return { renderHTML, bindEvents, getIncome, tick, startMgrTimer: _startMgrTimer };

})();