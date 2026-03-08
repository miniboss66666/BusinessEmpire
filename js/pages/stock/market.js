// @ts-nocheck
/* ============================================
   STOCK/MARKET.JS — Cổ phiếu giả
   8 sàn, mỗi sàn 5-6 mã, giá dao động ngẫu nhiên
   ============================================ */

const StockMarket = (() => {

  const EXCHANGES = {
    NYSE:       { flag:'🇺🇸', name:'NYSE',      currency:'$' },
    NASDAQ:     { flag:'🇺🇸', name:'NASDAQ',    currency:'$' },
    LSE:        { flag:'🇬🇧', name:'LSE',        currency:'£' },
    Tokyo:      { flag:'🇯🇵', name:'Tokyo',      currency:'¥' },
    HongKong:   { flag:'🇭🇰', name:'HK',         currency:'HK$' },
    Frankfurt:  { flag:'🇩🇪', name:'Frankfurt',  currency:'€' },
    Shanghai:   { flag:'🇨🇳', name:'Shanghai',   currency:'¥' },
    HOSE:       { flag:'🇻🇳', name:'HOSE',       currency:'₫' },
  };

  // Mỗi mã: { id, exchange, name, ticker, basePrice, volatility }
  const STOCKS_DATA = [
    // NYSE
    { id:'MEGA',  exchange:'NYSE',     name:'MegaCorp',      ticker:'MEGA', basePrice:150,    vol:0.02 },
    { id:'DYNX',  exchange:'NYSE',     name:'DynaTech',      ticker:'DYNX', basePrice:320,    vol:0.025 },
    { id:'GLBF',  exchange:'NYSE',     name:'GlobalFuel',    ticker:'GLBF', basePrice:85,     vol:0.018 },
    { id:'PRMA',  exchange:'NYSE',     name:'PharMax',       ticker:'PRMA', basePrice:210,    vol:0.022 },
    { id:'BNKX',  exchange:'NYSE',     name:'BankEX',        ticker:'BNKX', basePrice:95,     vol:0.015 },
    // NASDAQ
    { id:'AIRI',  exchange:'NASDAQ',   name:'AiRise',        ticker:'AIRI', basePrice:420,    vol:0.035 },
    { id:'QNTM',  exchange:'NASDAQ',   name:'Quantum Inc',   ticker:'QNTM', basePrice:1200,   vol:0.04 },
    { id:'NXVR',  exchange:'NASDAQ',   name:'NexaVR',        ticker:'NXVR', basePrice:88,     vol:0.045 },
    { id:'CLDB',  exchange:'NASDAQ',   name:'CloudBase',     ticker:'CLDB', basePrice:540,    vol:0.03 },
    { id:'ROBX',  exchange:'NASDAQ',   name:'RoboMax',       ticker:'ROBX', basePrice:275,    vol:0.038 },
    // LSE
    { id:'BRTX',  exchange:'LSE',      name:'BritEx',        ticker:'BRTX', basePrice:180,    vol:0.018 },
    { id:'PTRB',  exchange:'LSE',      name:'PetroB',        ticker:'PTRB', basePrice:420,    vol:0.02 },
    { id:'FNLX',  exchange:'LSE',      name:'FinLux',        ticker:'FNLX', basePrice:310,    vol:0.022 },
    { id:'MNRL',  exchange:'LSE',      name:'MineRoyal',     ticker:'MNRL', basePrice:95,     vol:0.025 },
    // Tokyo
    { id:'TKMT',  exchange:'Tokyo',    name:'Tokamotsu',     ticker:'TKMT', basePrice:3200,   vol:0.02 },
    { id:'RNKL',  exchange:'Tokyo',    name:'Rankel Corp',   ticker:'RNKL', basePrice:8500,   vol:0.025 },
    { id:'SLNK',  exchange:'Tokyo',    name:'SoloLink',      ticker:'SLNK', basePrice:1200,   vol:0.03 },
    { id:'HYKM',  exchange:'Tokyo',    name:'Haykoma',       ticker:'HYKM', basePrice:5600,   vol:0.018 },
    // HongKong
    { id:'HKPW',  exchange:'HongKong', name:'HK Power',      ticker:'HKPW', basePrice:28,     vol:0.022 },
    { id:'DRGT',  exchange:'HongKong', name:'DragonTech',    ticker:'DRGT', basePrice:145,    vol:0.035 },
    { id:'CNTL',  exchange:'HongKong', name:'CenTel',        ticker:'CNTL', basePrice:52,     vol:0.028 },
    { id:'SLKR',  exchange:'HongKong', name:'SilkRoad',      ticker:'SLKR', basePrice:89,     vol:0.03 },
    // Frankfurt
    { id:'AUTV',  exchange:'Frankfurt',name:'AutoVerk',       ticker:'AUTV', basePrice:280,    vol:0.02 },
    { id:'CHML',  exchange:'Frankfurt',name:'ChemLab',        ticker:'CHML', basePrice:165,    vol:0.018 },
    { id:'BNKF',  exchange:'Frankfurt',name:'BankFurt',       ticker:'BNKF', basePrice:320,    vol:0.015 },
    { id:'ENGX',  exchange:'Frankfurt',name:'EnergX',         ticker:'ENGX', basePrice:98,     vol:0.022 },
    // Shanghai
    { id:'DRGN',  exchange:'Shanghai', name:'Dragon Corp',   ticker:'DRGN', basePrice:42,     vol:0.03 },
    { id:'SLKM',  exchange:'Shanghai', name:'SilkMart',      ticker:'SLKM', basePrice:18,     vol:0.025 },
    { id:'PHXS',  exchange:'Shanghai', name:'PhoenixStar',   ticker:'PHXS', basePrice:85,     vol:0.035 },
    { id:'GDWL',  exchange:'Shanghai', name:'GoldWall',      ticker:'GDWL', basePrice:130,    vol:0.028 },
    // HOSE
    { id:'VNPW',  exchange:'HOSE',     name:'VN Power',      ticker:'VNP',  basePrice:45000,  vol:0.02 },
    { id:'VNBK',  exchange:'HOSE',     name:'VN Bank',       ticker:'VNB',  basePrice:28000,  vol:0.018 },
    { id:'VNRE',  exchange:'HOSE',     name:'VN RealEst',    ticker:'VNR',  basePrice:62000,  vol:0.025 },
    { id:'VNST',  exchange:'HOSE',     name:'VN Steel',      ticker:'VNS',  basePrice:19000,  vol:0.022 },
    { id:'VNFD',  exchange:'HOSE',     name:'VN Food',       ticker:'VNF',  basePrice:35000,  vol:0.02 },
  ];

  // Price cache — lưu giá hiện tại
  let prices = {};
  let history = {}; // id -> [giá 20 phiên gần nhất]

  let selectedExchange = 'NYSE';
  let selectedStock = null; // id đang xem chart+trade

  // ── INIT ─────────────────────────────────
  function init() {
    // Load prices từ STATE hoặc init từ base
    if (!STATE.stock) STATE.stock = {};
    if (!STATE.stock.market) STATE.stock.market = {};
    if (!STATE.stock.portfolio) STATE.stock.portfolio = {}; // { id: { shares, avgPrice } }

    STOCKS_DATA.forEach(s => {
      if (!prices[s.id]) {
        prices[s.id] = STATE.stock.market[s.id] || s.basePrice;
        history[s.id] = [prices[s.id]];
      }
    });

    // Start price fluctuation
    setInterval(fluctuatePrices, 120_000); // mỗi 8s giá dao động
  }

  function fluctuatePrices() {
    STOCKS_DATA.forEach(s => {
      const change = 1 + (Math.random() - 0.5) * 2 * s.vol;
      prices[s.id] = Math.max(s.basePrice * 0.1, prices[s.id] * change);
      history[s.id].push(prices[s.id]);
      if (history[s.id].length > 30) history[s.id].shift();
    });
    STATE.stock.market = { ...prices };
    // Update UI nếu đang xem
    _tickUI();
  }

  function getPrice(id) { return prices[id] || STOCKS_DATA.find(s => s.id === id)?.basePrice || 0; }

  function getPortfolioValue() {
    return Object.entries(STATE.stock?.portfolio || {}).reduce((sum, [id, pos]) => {
      return sum + (pos.shares || 0) * getPrice(id);
    }, 0);
  }

  // ── RENDER ───────────────────────────────
  function renderHTML() {
    if (selectedStock) return renderStockDetail(selectedStock);
    return renderStockList();
  }

  function renderStockList() {
    const exList = Object.entries(EXCHANGES);
    const stocks = STOCKS_DATA.filter(s => s.exchange === selectedExchange);
    const portfolio = STATE.stock?.portfolio || {};
    const portfolioValue = getPortfolioValue();
    const portfolioStocks = STOCKS_DATA.filter(s => portfolio[s.id]?.shares > 0);

    return `
      <div class="stk-wrap">
        <div class="stk-exchange-row">
          ${exList.map(([key, ex]) => `
            <button class="stk-ex-btn ${selectedExchange===key?'active':''}" data-ex="${key}">
              ${ex.flag} ${ex.name}
            </button>`).join('')}
        </div>
        ${portfolioStocks.length > 0 ? `
        <div class="stk-portfolio-bar">
          <span>💼 Danh mục: <strong style="color:var(--green)">${Format.money(portfolioValue)}</strong></span>
          <span style="font-size:0.62rem;color:var(--text-dim)">${portfolioStocks.length} mã</span>
        </div>` : ''}
        <div class="stk-list">
          ${stocks.map(s => renderStockRow(s)).join('')}
        </div>
      </div>`;
  }

  // ── STOCK DETAIL — chart + trade ─────────
  function renderStockDetail(id) {
    const s = STOCKS_DATA.find(x => x.id === id);
    if (!s) return '';
    const price = getPrice(id);
    const hist = history[id] || [price];
    const prev = hist.length > 1 ? hist[hist.length - 2] : price;
    const change = ((price - prev) / prev * 100);
    const up = change >= 0;
    const ex = EXCHANGES[s.exchange];
    const pos = STATE.stock?.portfolio?.[id];
    const held = pos?.shares || 0;
    const avgPrice = pos?.avgPrice || 0;
    const unrealized = held > 0 ? (price - avgPrice) * held : 0;
    const maxBuy = Math.floor(STATE.balance / price);

    // Build SVG chart từ history
    const chartPts = hist.slice(-30);
    const cMin = Math.min(...chartPts) * 0.998;
    const cMax = Math.max(...chartPts) * 1.002;
    const w = 300, h = 100;
    const svgPts = chartPts.map((v, i) => {
      const x = (i / (chartPts.length - 1)) * w;
      const y = h - ((v - cMin) / (cMax - cMin)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const lastX = ((chartPts.length - 1) / (chartPts.length - 1)) * w;
    const lastY = h - ((chartPts[chartPts.length - 1] - cMin) / (cMax - cMin)) * h;

    return `
      <div class="stk-detail-wrap">
        <!-- Topbar -->
        <div class="stk-detail-topbar">
          <button class="stk-back-btn" id="btn-stk-back">← Quay Lại</button>
          <div class="stk-detail-title-block">
            <span class="stk-detail-ticker">${s.ticker}</span>
            <span class="stk-detail-name">${s.name}</span>
          </div>
          <div class="stk-detail-price-block">
            <span class="stk-detail-price ${up?'up':'down'}">${Format.money(price)}</span>
            <span class="stk-detail-chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(change).toFixed(2)}%</span>
          </div>
        </div>

        <!-- Chart -->
        <div class="stk-chart-wrap">
          <svg class="stk-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" id="stk-chart-${id}">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${up?'#00c853':'#ff4455'}" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="${up?'#00c853':'#ff4455'}" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <polygon points="${svgPts} ${w},${h} 0,${h}"
              fill="url(#chartGrad)"/>
            <polyline points="${svgPts}" fill="none"
              stroke="${up?'#00c853':'#ff4455'}" stroke-width="2"/>
            <circle cx="${lastX}" cy="${lastY.toFixed(1)}" r="3"
              fill="${up?'#00c853':'#ff4455'}"/>
          </svg>
          <div class="stk-chart-labels">
            <span>${Format.money(cMin)}</span>
            <span style="color:var(--text-dim);font-size:0.6rem">${chartPts.length} phiên</span>
            <span>${Format.money(cMax)}</span>
          </div>
        </div>

        <!-- Position info -->
        ${held > 0 ? `
        <div class="stk-pos-bar">
          <div class="stk-pos-item">
            <span>Đang nắm</span>
            <strong>${Format.money(held)} cổ</strong>
          </div>
          <div class="stk-pos-item">
            <span>Giá TB</span>
            <strong>${ex.currency}${Format.money(avgPrice)}</strong>
          </div>
          <div class="stk-pos-item">
            <span>P&L</span>
            <strong style="color:${unrealized>=0?'var(--green)':'var(--red)'}">
              ${unrealized>=0?'+':''}${Format.money(unrealized)}
            </strong>
          </div>
          <div class="stk-pos-item">
            <span>Tổng trị</span>
            <strong style="color:var(--green)">${Format.money(held*price)}</strong>
          </div>
        </div>` : ''}

        <!-- Trade panel -->
        <div class="stk-trade-panel">
          <div class="stk-trade-pct-row">
            <button class="stk-qty-btn" data-pct="25">25%</button>
            <button class="stk-qty-btn" data-pct="50">50%</button>
            <button class="stk-qty-btn" data-pct="75">75%</button>
            <button class="stk-qty-btn" data-pct="100">Max</button>
          </div>
          <div class="stk-trade-input-row">
            <input class="stk-qty-input" id="stk-qty" type="number"
                   min="1" value="1" placeholder="Số cổ">
            <div class="stk-trade-cost" id="stk-cost">
              = ${Format.money(price)}
            </div>
          </div>
          <div class="stk-trade-actions">
            <button class="stk-buy-btn" id="btn-stk-buy"
                    ${maxBuy < 1 ? 'disabled' : ''}>
              📈 MUA · ${Format.money(STATE.balance)} có
            </button>
            <button class="stk-sell-btn" id="btn-stk-sell"
                    ${held < 1 ? 'disabled' : ''}>
              📉 BÁN · ${Format.money(held)} cổ
            </button>
          </div>
        </div>
      </div>`;
  }

  function renderStockRow(s) {
    const price = getPrice(s.id);
    const hist = history[s.id] || [price];
    const prev = hist.length > 1 ? hist[hist.length - 2] : price;
    const change = ((price - prev) / prev * 100);
    const up = change >= 0;
    const pos = STATE.stock?.portfolio?.[s.id];
    const held = pos?.shares || 0;
    const ex = EXCHANGES[s.exchange];

    // Mini sparkline (10 điểm)
    const spark = history[s.id]?.slice(-10) || [price];
    const sparkMin = Math.min(...spark);
    const sparkMax = Math.max(...spark);
    const sparkPts = spark.map((v, i) => {
      const x = (i / (spark.length - 1)) * 60;
      const y = sparkMax === sparkMin ? 10 : 20 - ((v - sparkMin) / (sparkMax - sparkMin)) * 18;
      return `${x},${y}`;
    }).join(' ');

    return `
      <div class="stk-row" data-id="${s.id}" style="cursor:pointer">
        <div class="stk-row-left">
          <div class="stk-ticker">${s.ticker}</div>
          <div class="stk-name">${s.name}</div>
          ${held > 0 ? `<div class="stk-held">📦 ${Format.money(held)} cổ</div>` : ''}
        </div>
        <svg class="stk-spark" viewBox="0 0 60 20" preserveAspectRatio="none">
          <polyline points="${sparkPts}" fill="none"
            stroke="${up ? '#00c853' : '#ff4455'}" stroke-width="1.5"/>
        </svg>
        <div class="stk-row-right">
          <div class="stk-price ${up ? 'up' : 'down'}">
            ${Format.money(price)}
          </div>
          <div class="stk-change ${up ? 'up' : 'down'}">
            ${up ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
          </div>
        </div>

      </div>`;
  }



  // ── BIND ─────────────────────────────────
  function bindEvents() {
    if (selectedStock) {
      _bindDetailEvents(selectedStock);
      return;
    }
    document.querySelectorAll('.stk-ex-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedExchange = btn.dataset.ex;
        _refresh();
      });
    });
    document.querySelectorAll('.stk-row[data-id]').forEach(row => {
      row.addEventListener('click', () => {
        selectedStock = row.dataset.id;
        _refresh();
      });
    });
  }

  function _bindDetailEvents(id) {
    const s = STOCKS_DATA.find(x => x.id === id);
    const ex = EXCHANGES[s?.exchange];
    const price = getPrice(id);
    const pos = STATE.stock?.portfolio?.[id];
    const held = pos?.shares || 0;
    const maxBuy = Math.floor(STATE.balance / price);

    document.getElementById('btn-stk-back')?.addEventListener('click', () => {
      selectedStock = null;
      _refresh();
    });

    const qtyInput = document.getElementById('stk-qty');
    const costEl = document.getElementById('stk-cost');
    function updateCost() {
      const qty = parseInt(qtyInput?.value) || 0;
      if (costEl) costEl.textContent = `= ${ex?.currency}${Format.money(qty * price)} · Còn: ${Format.money(STATE.balance - qty * price)}`;
    }
    qtyInput?.addEventListener('input', updateCost);

    document.querySelectorAll('.stk-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qty = Math.max(1, Math.floor(maxBuy * parseInt(btn.dataset.pct) / 100));
        if (qtyInput) qtyInput.value = qty;
        updateCost();
      });
    });

    document.getElementById('btn-stk-buy')?.addEventListener('click', () => {
      const qty = parseInt(qtyInput?.value) || 0;
      const total = qty * price;
      if (qty < 1 || STATE.balance < total) { UI.toast('Không đủ tiền!', 'error'); return; }
      STATE.balance -= total;
      if (!STATE.stock.portfolio) STATE.stock.portfolio = {};
      const cur = STATE.stock.portfolio[id] || { shares:0, avgPrice:0 };
      const newShares = cur.shares + qty;
      STATE.stock.portfolio[id] = { shares: newShares, avgPrice: (cur.avgPrice * cur.shares + total) / newShares };
      UI.toast(`📈 Mua ${qty} cổ ${s.ticker} — ${Format.money(total)}`, 'success');
      _refresh();
    });

    document.getElementById('btn-stk-sell')?.addEventListener('click', () => {
      const qty = parseInt(qtyInput?.value) || 0;
      const pos2 = STATE.stock?.portfolio?.[id];
      if (qty < 1 || !pos2 || qty > pos2.shares) { UI.toast('Không đủ cổ để bán!', 'error'); return; }
      const total = qty * price;
      STATE.balance += total;
      STATE.totalEarned += total;
      pos2.shares -= qty;
      if (pos2.shares === 0) delete STATE.stock.portfolio[id];
      UI.toast(`📉 Bán ${qty} cổ ${s.ticker} — ${Format.money(total)}`, 'success');
      _refresh();
    });
  }

  function _refresh() {
    const el = document.getElementById('stk-market-content');
    if (!el) return;
    el.innerHTML = renderHTML();
    bindEvents();
  }

  function _tickUI() {
    // Update prices inline mà không re-render toàn bộ
    const rows = document.querySelectorAll('.stk-row[data-id]');
    rows.forEach(row => {
      const id = row.dataset.id;
      if (!id) return;
      const s = STOCKS_DATA.find(x => x.id === id);
      if (!s) return;
      const price = getPrice(id);
      const hist = history[id] || [price];
      const prev = hist.length > 1 ? hist[hist.length - 2] : price;
      const change = (price - prev) / prev * 100;
      const up = change >= 0;
      const ex = EXCHANGES[s.exchange];
      const priceEl = row.querySelector('.stk-price');
      const changeEl = row.querySelector('.stk-change');
      if (priceEl) {
        priceEl.textContent = `${Format.money(price)}`;
        priceEl.className = `stk-price ${up ? 'up' : 'down'}`;
      }
      if (changeEl) {
        changeEl.textContent = `${up ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
        changeEl.className = `stk-change ${up ? 'up' : 'down'}`;
      }
    });
  }

  return { init, renderHTML, bindEvents, getPortfolioValue, fluctuatePrices };
})();