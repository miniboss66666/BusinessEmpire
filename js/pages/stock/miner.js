// @ts-nocheck
/* ============================================
   STOCK/MINER.JS — GPU Mining
   Pool server-side, shop restock mỗi 20 phút
   ============================================ */

const StockMiner = (() => {

  const GPU_TYPES = [
    { id:'noname',  name:'Noname',        emoji:'💀', price:50,     speed:1,  breakRate:0.15, elec:0.05 },
    { id:'amd',     name:'AMD RX',        emoji:'🔴', price:200,    speed:2,  breakRate:0.08, elec:0.20 },
    { id:'gtx',     name:'NVIDIA GTX',    emoji:'🟢', price:500,    speed:4,  breakRate:0.05, elec:0.50 },
    { id:'rtx',     name:'NVIDIA RTX',    emoji:'💚', price:1500,   speed:8,  breakRate:0.02, elec:1.50 },
    { id:'rtxti',   name:'NVIDIA RTX Ti', emoji:'✨', price:3000,   speed:15, breakRate:0.01, elec:3.00 },
    { id:'quantum', name:'Quantum Chip',  emoji:'👑', price:50000,  speed:50, breakRate:0.001,elec:50.0 },
  ];

  // MOBO Server tiers — mỗi tier tăng max GPU slots
  const MOBO_TIERS = [
    { tier:0, name:'Không có',         slots:2,  price:0 },
    { tier:1, name:'MOBO B450',        slots:4,  price:5_000 },
    { tier:2, name:'MOBO B550',        slots:6,  price:15_000 },
    { tier:3, name:'MOBO X570',        slots:8,  price:40_000 },
    { tier:4, name:'MOBO Server E-ATX',slots:10, price:100_000 },
    { tier:5, name:'MOBO Server Pro',  slots:12, price:250_000 },
    { tier:6, name:'MOBO Server Rack', slots:14, price:600_000 },
    { tier:7, name:'MOBO Server Farm', slots:16, price:1_500_000 },
    { tier:8, name:'MOBO Quantum',     slots:18, price:4_000_000 },
    { tier:9, name:'MOBO Quantum MAX', slots:20, price:10_000_000 },
  ];

  function getMaxSlots() {
    const tier = STATE.stock?.miner?.moboTier || 0;
    return MOBO_TIERS[tier]?.slots || 2;
  }

  function getMoboTier() {
    return STATE.stock?.miner?.moboTier || 0;
  }

  // Server shop pool — sẽ restock mỗi 20 phút
  // Dùng Supabase real-time hoặc giả lập bằng timestamp
  const SHOP_RESTOCK_MS = 20 * 60 * 1000; // 20 phút
  const SHOP_POOL_SIZE = 10; // 10 GPU mỗi lần restock

  // Income: 1 hash/min per speed unit → mining income từ crypto
  const BASE_INCOME_PER_HASH = 0.05; // $0.05/hash/phút

  let shopStock = [];       // { gpuId, qty } còn trong shop
  let lastRestock = 0;

  // ── INIT ─────────────────────────────────
  function init() {
    if (!STATE.stock) STATE.stock = {};
    if (!STATE.stock.miner) STATE.stock.miner = {
      gpus: [],    // [{ gpuId, broken }]
      lastElec: 0, // timestamp lần cuối trừ điện
    };
    lastRestock = STATE.stock.minerShopRestock || 0;
    shopStock = STATE.stock.minerShop || [];

    // Nếu chưa có shop hoặc đã quá 20p → restock
    if (Date.now() - lastRestock > SHOP_RESTOCK_MS || shopStock.length === 0) {
      _restockShop();
    }

    setInterval(_miningTick, 60_000); // income mỗi phút
    setInterval(_breakTick, 5 * 60_000); // check hỏng mỗi 5 phút
  }

  function _restockShop() {
    // Random 10 GPU từ pool
    const pool = [];
    GPU_TYPES.forEach(g => {
      const qty = Math.floor(Math.random() * 3) + 1; // 1-3 mỗi loại
      pool.push({ gpuId: g.id, qty });
    });
    // Shuffle + lấy đủ SHOP_POOL_SIZE items
    shopStock = pool.sort(() => Math.random() - 0.5).slice(0, 6);
    lastRestock = Date.now();
    STATE.stock.minerShop = shopStock;
    STATE.stock.minerShopRestock = lastRestock;
  }

  function _miningTick() {
    const gpus = STATE.stock?.miner?.gpus || [];
    const activeGpus = gpus.filter(g => !g.broken);
    if (activeGpus.length === 0) return;

    const totalHash = activeGpus.reduce((sum, g) => {
      const type = GPU_TYPES.find(t => t.id === g.gpuId);
      return sum + (type?.speed || 0);
    }, 0);

    // Trừ điện
    const totalElec = activeGpus.reduce((sum, g) => {
      const type = GPU_TYPES.find(t => t.id === g.gpuId);
      return sum + (type?.elec || 0);
    }, 0);

    const income = totalHash * BASE_INCOME_PER_HASH - totalElec;
    if (income > 0) {
      STATE.balance += income;
      STATE.totalEarned += income;
    }

    // Update UI income
    const el = document.getElementById('miner-income-display');
    if (el) el.textContent = Format.money(income) + '/phút';
  }

  function _breakTick() {
    const gpus = STATE.stock?.miner?.gpus || [];
    let broke = false;
    gpus.forEach(g => {
      if (g.broken) return;
      const type = GPU_TYPES.find(t => t.id === g.gpuId);
      if (!type) return;
      if (Math.random() < type.breakRate / 12) { // breakRate per hour / 12 = per 5min
        g.broken = true;
        broke = true;
      }
    });
    if (broke) {
      UI.toast('⚠️ Một GPU bị hỏng! Kiểm tra Miner.', 'error');
      _refreshUI();
    }
  }

  function getMiningIncome() {
    const gpus = STATE.stock?.miner?.gpus || [];
    const active = gpus.filter(g => !g.broken);
    const totalHash = active.reduce((s, g) => {
      const t = GPU_TYPES.find(x => x.id === g.gpuId);
      return s + (t?.speed || 0);
    }, 0);
    const totalElec = active.reduce((s, g) => {
      const t = GPU_TYPES.find(x => x.id === g.gpuId);
      return s + (t?.elec || 0);
    }, 0);
    return Math.max(0, totalHash * BASE_INCOME_PER_HASH - totalElec);
  }

  // ── RENDER ───────────────────────────────
  function renderHTML() {
    const gpus = STATE.stock?.miner?.gpus || [];
    const active = gpus.filter(g => !g.broken);
    const broken = gpus.filter(g => g.broken);
    const income = getMiningIncome();
    const timeLeft = Math.max(0, SHOP_RESTOCK_MS - (Date.now() - lastRestock));
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);

    // Group owned GPUs by type
    const owned = {};
    gpus.forEach(g => {
      if (!owned[g.gpuId]) owned[g.gpuId] = { total: 0, broken: 0 };
      owned[g.gpuId].total++;
      if (g.broken) owned[g.gpuId].broken++;
    });

    return `
      <div class="miner-wrap">
        <!-- Summary -->
        <div class="miner-summary">
          <div class="miner-stat">
            <span class="miner-stat-label">GPU Active</span>
            <span class="miner-stat-val">${active.length}/${gpus.length}</span>
          </div>
          <div class="miner-stat">
            <span class="miner-stat-label">Tốc độ</span>
            <span class="miner-stat-val">${active.reduce((s,g)=>{const t=GPU_TYPES.find(x=>x.id===g.gpuId);return s+(t?.speed||0);},0)}x</span>
          </div>
          <div class="miner-stat">
            <span class="miner-stat-label">Income</span>
            <span class="miner-stat-val" id="miner-income-display" style="color:var(--green)">${Format.money(income)}/ph</span>
          </div>
          ${broken.length > 0 ? `
          <div class="miner-stat broken">
            <span class="miner-stat-label">⚠️ Hỏng</span>
            <span class="miner-stat-val" style="color:var(--red)">${broken.length}</span>
          </div>` : ''}
        </div>

        <!-- My GPUs -->
        ${gpus.length > 0 ? `
        <div class="miner-section">
          <div class="miner-section-title">⚙️ GPU Của Tôi</div>
          <div class="miner-gpu-list">
            ${GPU_TYPES.filter(t => owned[t.id]).map(t => {
              const o = owned[t.id];
              return `
              <div class="miner-gpu-row ${o.broken>0?'has-broken':''}">
                <span class="miner-gpu-emoji">${t.emoji}</span>
                <div class="miner-gpu-info">
                  <div class="miner-gpu-name">${t.name}</div>
                  <div class="miner-gpu-sub">${t.speed}x · $${t.elec}/ph điện</div>
                </div>
                <div class="miner-gpu-count">
                  <span style="color:var(--green)">${o.total - o.broken} active</span>
                  ${o.broken > 0 ? `<span style="color:var(--red)"> · ${o.broken} hỏng</span>` : ''}
                </div>
                <div class="miner-gpu-actions">
                  ${o.broken > 0 ? `
                  <button class="miner-repair-btn" data-gpu="${t.id}">
                    🔧 Sửa (${Format.money(t.price * 0.3 * o.broken)})
                  </button>` : ''}
                  <button class="miner-sell-gpu-btn" data-gpu="${t.id}">
                    💰 Bán 1 (${Format.money(t.price * 0.5)})
                  </button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>` : `
        <div class="re-empty">
          <div style="font-size:2rem">⛏️</div>
          <div>Chưa có GPU nào</div>
          <div style="font-size:0.65rem;color:var(--text-dim)">Mua GPU từ shop bên dưới</div>
        </div>`}

        <!-- Shop -->
        <div class="miner-section">
          <div class="miner-section-title" style="display:flex;justify-content:space-between">
            🛒 Shop GPU
            <span class="miner-restock-timer" id="miner-restock-timer">
              🔄 Restock: ${mins}p${secs}s
            </span>
          </div>
          <div class="miner-shop-list">
            ${GPU_TYPES.map(t => {
              const inShop = shopStock.find(s => s.gpuId === t.id);
              const qty = inShop?.qty || 0;
              const canAfford = STATE.balance >= t.price;
              return `
              <div class="miner-shop-row ${qty===0||!canAfford?'unavail':''}">
                <span class="miner-gpu-emoji">${t.emoji}</span>
                <div class="miner-gpu-info">
                  <div class="miner-gpu-name">${t.name}</div>
                  <div class="miner-gpu-sub">
                    ${t.speed}x hash · ${t.breakRate*100}% hỏng/h · $${t.elec}/ph
                  </div>
                </div>
                <div style="text-align:right">
                  <div class="miner-shop-price">${Format.money(t.price)}</div>
                  <div class="miner-shop-stock">Còn: ${qty}</div>
                </div>
                <button class="miner-buy-btn" data-gpu="${t.id}"
                        ${qty===0||!canAfford?'disabled':''}>
                  ${qty===0 ? 'Hết hàng' : !canAfford ? 'Không đủ tiền' : 'MUA'}
                </button>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- MOBO Upgrade -->
        <div class="miner-section">
          <div class="miner-section-title">🖥️ MOBO Server — GPU Slots</div>
          ${(() => {
            const tier = getMoboTier();
            const cur = MOBO_TIERS[tier];
            const next = MOBO_TIERS[tier + 1];
            return `
            <div class="miner-mobo-card">
              <div class="miner-mobo-info">
                <div class="miner-gpu-name">${cur.name}</div>
                <div class="miner-gpu-sub">
                  ${gpus.length}/${cur.slots} slots đang dùng
                </div>
              </div>
              <div class="miner-mobo-slots">
                ${Array.from({length: cur.slots}, (_, i) => `
                  <div class="miner-slot ${i < gpus.length ? (gpus[i]?.broken ? 'broken' : 'used') : 'empty'}"></div>
                `).join('')}
              </div>
            </div>
            ${next ? `
            <button class="miner-mobo-upgrade-btn" id="btn-mobo-upgrade"
                    ${STATE.balance < next.price ? 'disabled' : ''}>
              ⬆️ Nâng lên ${next.name} — ${Format.money(next.price)}
              <span style="font-size:0.6rem;opacity:0.7"> (+${next.slots - cur.slots} slots → ${next.slots} tổng)</span>
            </button>` : `
            <div style="text-align:center;padding:8px;font-size:0.7rem;color:var(--gold)">
              👑 MAX — ${cur.slots} slots
            </div>`}`;
          })()}
        </div>
      </div>`;
  }

  function bindEvents() {
    // Buy GPU
    document.querySelectorAll('.miner-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gpuId = btn.dataset.gpu;
        const type = GPU_TYPES.find(t => t.id === gpuId);
        if (!type || STATE.balance < type.price) return;
        const shop = shopStock.find(s => s.gpuId === gpuId);
        if (!shop || shop.qty <= 0) { UI.toast('Hết hàng!', 'error'); return; }
        const currentGpus = (STATE.stock?.miner?.gpus || []).length;
        if (currentGpus >= getMaxSlots()) {
          UI.toast(`⚠️ Đã đầy ${getMaxSlots()} slots! Nâng cấp MOBO để mở thêm.`, 'error');
          return;
        }
        STATE.balance -= type.price;
        shop.qty--;
        if (!STATE.stock.miner) STATE.stock.miner = { gpus: [], moboTier: 0 };
        STATE.stock.miner.gpus.push({ gpuId, broken: false });
        STATE.stock.minerShop = shopStock;
        UI.toast(`${type.emoji} Mua ${type.name}!`, 'success');
        _refreshUI();
      });
    });

    // Repair GPU
    document.querySelectorAll('.miner-repair-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gpuId = btn.dataset.gpu;
        const type = GPU_TYPES.find(t => t.id === gpuId);
        if (!type) return;
        const brokenGpus = (STATE.stock?.miner?.gpus || []).filter(g => g.gpuId === gpuId && g.broken);
        const cost = type.price * 0.3 * brokenGpus.length;
        if (STATE.balance < cost) { UI.toast('Không đủ tiền sửa!', 'error'); return; }
        STATE.balance -= cost;
        brokenGpus.forEach(g => g.broken = false);
        UI.toast(`🔧 Đã sửa ${brokenGpus.length} ${type.name}!`, 'success');
        _refreshUI();
      });
    });

    // Bán GPU
    document.querySelectorAll('.miner-sell-gpu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gpuId = btn.dataset.gpu;
        const type = GPU_TYPES.find(t => t.id === gpuId);
        if (!type) return;
        const gpus = STATE.stock?.miner?.gpus || [];
        // Ưu tiên bán cái đang hỏng trước
        const idx = gpus.findIndex(g => g.gpuId === gpuId && g.broken);
        const sellIdx = idx >= 0 ? idx : gpus.findIndex(g => g.gpuId === gpuId);
        if (sellIdx < 0) return;
        const sellPrice = type.price * 0.5;
        STATE.balance += sellPrice;
        STATE.totalEarned += sellPrice;
        STATE.stock.miner.gpus.splice(sellIdx, 1);
        UI.toast(`💰 Bán ${type.name} — ${Format.money(sellPrice)}`, 'success');
        _refreshUI();
      });
    });

    // MOBO upgrade
    document.getElementById('btn-mobo-upgrade')?.addEventListener('click', () => {
      const tier = getMoboTier();
      const next = MOBO_TIERS[tier + 1];
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      STATE.stock.miner.moboTier = tier + 1;
      UI.toast(`🖥️ Nâng cấp lên ${next.name} — ${next.slots} slots!`, 'success');
      _refreshUI();
    });

    // Restock timer countdown
    _startRestockTimer();
  }

  function _startRestockTimer() {
    const timerEl = document.getElementById('miner-restock-timer');
    if (!timerEl) return;
    const interval = setInterval(() => {
      if (!document.getElementById('miner-restock-timer')) { clearInterval(interval); return; }
      const left = Math.max(0, SHOP_RESTOCK_MS - (Date.now() - lastRestock));
      if (left === 0) {
        _restockShop();
        _refreshUI();
        clearInterval(interval);
        return;
      }
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      timerEl.textContent = `🔄 Restock: ${m}p${s}s`;
    }, 1000);
  }

  function _refreshUI() {
    const el = document.getElementById('stk-miner-content');
    if (!el) return;
    el.innerHTML = renderHTML();
    bindEvents();
  }

  return { init, renderHTML, bindEvents, getMiningIncome };
})();