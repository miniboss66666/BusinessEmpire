// @ts-nocheck
/* ============================================
   REALESTATE/INDEX.JS
   Tab 1: Nhà Đất Đang Có (danh sách owned)
   Tab 2: Mua Nhà Đất (browse + filter + mua)
   ============================================ */

const RealEstatePage = (() => {

  let currentTab = 'owned';     // 'owned' | 'market'
  let filterType = 'all';       // type filter trên market
  let sortBy = 'price_asc';
  let searchQ = '';

  // ── HELPERS ──────────────────────────────
  function owned() { return STATE.realestate || []; }

  function findOwned(id) { return owned().find(x => x.id === id); }

  function calcIncome(prop, renovLv) {
    const type = RE_DATA.TYPES[prop.type];
    const reno = RE_DATA.RENOVATION[renovLv || 0];
    const buff = reno ? reno.incomeBuff : 0;
    return Math.floor(prop.price * type.incomeRate * (1 + buff));
  }

  function getIncome() {
    return owned().reduce((sum, o) => {
      const prop = RE_DATA.PROPERTIES.find(p => p.id === o.id);
      if (!prop) return sum;
      return sum + calcIncome(prop, o.renovationLevel);
    }, 0);
  }

  function sellPrice(prop) {
    return Math.floor(prop.price * 0.70); // bán lại 70%
  }

  // ── INIT ─────────────────────────────────
  function init() { render(); }

  function render() {
    const page = document.getElementById('page-realestate');
    if (!page) return;
    page.innerHTML = renderHTML();
    bindEvents();
  }

  // ── RENDER MAIN ──────────────────────────
  function renderHTML() {
    const income = getIncome();
    return `
      <div class="re-wrap">
        <div class="re-header">
          <span class="re-title">🏢 BẤT ĐỘNG SẢN</span>
          <span class="re-income-val">${Format.money(income)}/phút</span>
        </div>
        <div class="re-tabs">
          <button class="re-tab ${currentTab==='owned'?'active':''}" data-tab="owned">
            🏠 Đang Có <span class="re-tab-count">${owned().length}</span>
          </button>
          <button class="re-tab ${currentTab==='market'?'active':''}" data-tab="market">
            🛒 Mua BĐS
          </button>
        </div>
        <div class="re-content" id="re-content">
          ${currentTab === 'owned' ? renderOwned() : renderMarket()}
        </div>
      </div>`;
  }

  // ── TAB: ĐANG CÓ ─────────────────────────
  function renderOwned() {
    const list = owned();
    if (list.length === 0) return `
      <div class="re-empty">
        <div style="font-size:2.5rem">🏗️</div>
        <div>Chưa có bất động sản nào</div>
        <div style="font-size:0.68rem;color:var(--text-dim);margin-top:4px">
          Sang tab Mua BĐS để bắt đầu đầu tư!
        </div>
      </div>`;

    return `
      <div class="re-owned-list">
        ${list.map(o => {
          const prop = RE_DATA.PROPERTIES.find(p => p.id === o.id);
          if (!prop) return '';
          return renderOwnedCard(prop, o);
        }).join('')}
      </div>`;
  }

  function renderOwnedCard(prop, owned) {
    const type = RE_DATA.TYPES[prop.type];
    const reno = RE_DATA.RENOVATION[owned.renovationLevel || 0];
    const nextReno = RE_DATA.RENOVATION[(owned.renovationLevel || 0) + 1];
    const income = calcIncome(prop, owned.renovationLevel);
    const sell = sellPrice(prop);
    const renoCost = nextReno ? Math.floor(prop.price * nextReno.costPct) : 0;

    return `
      <div class="re-owned-card" data-id="${prop.id}">
        <div class="re-card-top">
          <div class="re-card-emoji">${type.emoji}</div>
          <div class="re-card-info">
            <div class="re-card-name">${prop.name}</div>
            <div class="re-card-loc">${prop.country} ${prop.city}</div>
            <div class="re-card-type-badge">${type.label}</div>
          </div>
          <div class="re-card-income">
            <span class="re-income-num">${Format.money(income)}</span>
            <span class="re-income-lbl">/phút</span>
          </div>
        </div>

        <!-- Renovation -->
        <div class="re-reno-row">
          <div class="re-reno-steps">
            ${[1,2,3,4,5,6].map(lv => `
              <div class="re-reno-step ${lv <= (owned.renovationLevel||0) ? 'done' : lv === (owned.renovationLevel||0)+1 ? 'next' : ''}"
                   title="${RE_DATA.RENOVATION[lv].name}">
                ${RE_DATA.RENOVATION[lv].emoji}
              </div>`).join('')}
          </div>
          <div class="re-reno-label">
            ${reno ? `${reno.emoji} ${reno.name} (+${(reno.incomeBuff*100).toFixed(0)}%)` : 'Chưa nâng cấp'}
          </div>
        </div>

        <!-- Actions -->
        <div class="re-card-actions">
          ${nextReno ? `
          <button class="re-reno-btn" data-id="${prop.id}"
                  ${STATE.balance < renoCost ? 'disabled' : ''}>
            ${nextReno.emoji} ${nextReno.name} — ${Format.money(renoCost)}
          </button>` : `
          <div class="re-reno-max">✨ Renovation MAX</div>`}
          <button class="re-sell-btn" data-id="${prop.id}">
            💰 Bán — ${Format.money(sell)}
          </button>
        </div>
      </div>`;
  }

  // ── TAB: MUA BĐS ─────────────────────────
  function renderMarket() {
    // Filter + sort
    let list = RE_DATA.PROPERTIES.filter(p => !findOwned(p.id));
    if (filterType !== 'all') list = list.filter(p => p.type === filterType);
    if (searchQ) list = list.filter(p =>
      p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQ.toLowerCase())
    );
    if (sortBy === 'price_asc')  list.sort((a,b) => a.price - b.price);
    if (sortBy === 'price_desc') list.sort((a,b) => b.price - a.price);
    if (sortBy === 'income')     list.sort((a,b) => calcIncome(b,0) - calcIncome(a,0));

    return `
      <div class="re-market-wrap">
        <!-- Search + sort -->
        <div class="re-market-toolbar">
          <input class="re-search" id="re-search" placeholder="🔍 Tìm kiếm..."
                 value="${searchQ}">
          <select class="re-sort" id="re-sort">
            <option value="price_asc"  ${sortBy==='price_asc' ?'selected':''}>Giá ↑</option>
            <option value="price_desc" ${sortBy==='price_desc'?'selected':''}>Giá ↓</option>
            <option value="income"     ${sortBy==='income'    ?'selected':''}>Income ↓</option>
          </select>
        </div>

        <!-- Type filter -->
        <div class="re-type-filter">
          <button class="re-type-btn ${filterType==='all'?'active':''}" data-type="all">Tất Cả</button>
          ${Object.entries(RE_DATA.TYPES).map(([k,v]) => `
            <button class="re-type-btn ${filterType===k?'active':''}" data-type="${k}">
              ${v.emoji}
            </button>`).join('')}
        </div>

        <!-- List -->
        <div class="re-market-list">
          ${list.length === 0
            ? '<div class="re-empty">Không có kết quả</div>'
            : list.map(p => renderMarketCard(p)).join('')
          }
        </div>
      </div>`;
  }

  function renderMarketCard(prop) {
    const type = RE_DATA.TYPES[prop.type];
    const income = calcIncome(prop, 0);
    const canAfford = STATE.balance >= prop.price;
    const roi = (income / prop.price * 100).toFixed(2); // %/phút

    return `
      <div class="re-market-card ${!canAfford ? 'cant-afford' : ''}">
        <div class="re-card-top">
          <div class="re-card-emoji">${type.emoji}</div>
          <div class="re-card-info">
            <div class="re-card-name">${prop.name}</div>
            <div class="re-card-loc">${prop.country} ${prop.city}</div>
            <div class="re-card-type-badge">${type.label}</div>
          </div>
          <div class="re-card-price-col">
            <div class="re-card-price">${Format.money(prop.price)}</div>
            <div class="re-card-roi" style="color:var(--green)">${Format.money(income)}/ph</div>
            <div style="font-size:0.58rem;color:var(--text-dim)">ROI ${roi}%/ph</div>
          </div>
        </div>
        <div class="re-card-tax-badge">1.2%</div>
        <button class="re-buy-btn" data-id="${prop.id}"
                ${!canAfford ? 'disabled' : ''}>
          ${canAfford ? '🏠 MUA NGAY' : '🔒 ' + Format.money(prop.price - STATE.balance) + ' nữa'}
        </button>
      </div>`;
  }

  // ── BIND EVENTS ──────────────────────────
  function bindEvents() {
    // Tabs
    document.querySelectorAll('.re-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        _refreshContent();
      });
    });
    bindContentEvents();
  }

  function bindContentEvents() {
    if (currentTab === 'owned') bindOwnedEvents();
    else bindMarketEvents();
  }

  function bindOwnedEvents() {
    // Renovation
    document.querySelectorAll('.re-reno-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prop = RE_DATA.PROPERTIES.find(p => p.id === id);
        const o = findOwned(id);
        if (!prop || !o) return;
        const lv = (o.renovationLevel || 0) + 1;
        const reno = RE_DATA.RENOVATION[lv];
        if (!reno) return;
        const cost = Math.floor(prop.price * reno.costPct);
        if (STATE.balance < cost) { UI.toast('Không đủ tiền!', 'error'); return; }
        STATE.balance -= cost;
        STATE.stats.spentRealestate = (STATE.stats.spentRealestate||0) + cost;
        o.renovationLevel = lv;
        UI.toast(`${reno.emoji} ${prop.name} — ${reno.name} hoàn thành!`, 'success');
        _refreshContent();
      });
    });

    // Sell
    document.querySelectorAll('.re-sell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prop = RE_DATA.PROPERTIES.find(p => p.id === id);
        if (!prop) return;
        const sp = sellPrice(prop);
        UI.confirm(
          `Bán ${prop.name} với giá ${Format.money(sp)}? (70% giá mua)`,
          () => {
            STATE.balance += sp;
            STATE.totalEarned += sp;
            STATE.realestate = owned().filter(o => o.id !== id);
            UI.toast(`💰 Đã bán ${prop.name} — ${Format.money(sp)}!`, 'success');
            _refreshContent();
          }
        );
      });
    });
  }

  function bindMarketEvents() {
    // Search
    document.getElementById('re-search')?.addEventListener('input', function() {
      searchQ = this.value;
      _refreshMarketList();
    });
    // Sort
    document.getElementById('re-sort')?.addEventListener('change', function() {
      sortBy = this.value;
      _refreshMarketList();
    });
    // Type filter
    document.querySelectorAll('.re-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterType = btn.dataset.type;
        document.querySelectorAll('.re-type-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.type === filterType));
        _refreshMarketList();
      });
    });
    // Buy
    document.querySelectorAll('.re-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prop = RE_DATA.PROPERTIES.find(p => p.id === id);
        if (!prop || STATE.balance < prop.price) return;
        STATE.balance -= prop.price;
        STATE.stats.spentRealestate = (STATE.stats.spentRealestate||0) + prop.price;
        STATE.realestate = owned().concat([{ id, renovationLevel: 0, purchasePrice: prop.price }]);
        // Thêm tax item
        if (STATE.tax && STATE.tax.items) {
          STATE.tax.items.push({
            id, type:'realestate', name: prop.name,
            amount: 0,
            deadline: Date.now() + 72 * 3600_000,
            suspended: false,
            purchasePrice: prop.price,
          });
        }
        UI.toast(`${RE_DATA.TYPES[prop.type].emoji} Đã mua ${prop.name}!`, 'success');
        _refreshContent();
      });
    });
  }

  function _refreshContent() {
    const el = document.getElementById('re-content');
    if (!el) return;
    el.innerHTML = currentTab === 'owned' ? renderOwned() : renderMarket();
    bindContentEvents();
    // Update tab count
    document.querySelectorAll('.re-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === currentTab));
    const countEl = document.querySelector('.re-tab-count');
    if (countEl) countEl.textContent = owned().length;
    // Update header income
    const incEl = document.querySelector('.re-income-val');
    if (incEl) incEl.textContent = Format.money(getIncome()) + '/phút';
  }

  function _refreshMarketList() {
    const el = document.getElementById('re-content');
    if (!el) return;
    el.innerHTML = renderMarket();
    bindMarketEvents();
  }

  function tick() {
    const incEl = document.querySelector('.re-income-val');
    if (incEl) incEl.textContent = Format.money(getIncome()) + '/phút';
  }

  return { init, getIncome, tick };
})();
