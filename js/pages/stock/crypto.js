// @ts-nocheck
/* STOCK/CRYPTO.JS — fetch từ Supabase crypto_history */

const StockCrypto = (() => {

  const COINS = [
    { id:'bitcoin',       sym:'BTC',  name:'Bitcoin',       emoji:'₿'  },
    { id:'ethereum',      sym:'ETH',  name:'Ethereum',      emoji:'Ξ'  },
    { id:'binancecoin',   sym:'BNB',  name:'BNB',           emoji:'🔶' },
    { id:'solana',        sym:'SOL',  name:'Solana',        emoji:'◎'  },
    { id:'ripple',        sym:'XRP',  name:'XRP',           emoji:'✕'  },
    { id:'tether',        sym:'USDT', name:'Tether',        emoji:'₮'  },
    { id:'usd-coin',      sym:'USDC', name:'USD Coin',      emoji:'🔵' },
    { id:'cardano',       sym:'ADA',  name:'Cardano',       emoji:'₳'  },
    { id:'avalanche-2',   sym:'AVAX', name:'Avalanche',     emoji:'🔺' },
    { id:'tron',          sym:'TRX',  name:'TRON',          emoji:'🔴' },
    { id:'matic-network', sym:'MATIC',name:'Polygon',       emoji:'🟣' },
    { id:'polkadot',      sym:'DOT',  name:'Polkadot',      emoji:'●'  },
    { id:'chainlink',     sym:'LINK', name:'Chainlink',     emoji:'⬡'  },
    { id:'litecoin',      sym:'LTC',  name:'Litecoin',      emoji:'Ł'  },
    { id:'uniswap',       sym:'UNI',  name:'Uniswap',       emoji:'🦄' },
    { id:'near',          sym:'NEAR', name:'NEAR Protocol', emoji:'Ⓝ'  },
    { id:'dogecoin',      sym:'DOGE', name:'Dogecoin',      emoji:'🐕' },
    { id:'shiba-inu',     sym:'SHIB', name:'Shiba Inu',     emoji:'🐕‍🦺'},
    { id:'pepe',          sym:'PEPE', name:'Pepe',          emoji:'🐸' },
    { id:'floki',         sym:'FLOKI',name:'Floki',         emoji:'⚡' },
    { id:'aave',          sym:'AAVE', name:'Aave',          emoji:'👻' },
    { id:'maker',         sym:'MKR',  name:'Maker',         emoji:'Μ'  },
    { id:'the-sandbox',   sym:'SAND', name:'The Sandbox',   emoji:'🏖' },
    { id:'axie-infinity', sym:'AXS',  name:'Axie Infinity', emoji:'🐾' },
    { id:'decentraland',  sym:'MANA', name:'Decentraland',  emoji:'🌐' },
    { id:'aptos',         sym:'APT',  name:'Aptos',         emoji:'🔷' },
    { id:'arbitrum',      sym:'ARB',  name:'Arbitrum',      emoji:'🔵' },
    { id:'optimism',      sym:'OP',   name:'Optimism',      emoji:'🔴' },
  ];

  const TIME_RANGES = [
    { label:'15p', minutes:15 },
    { label:'30p', minutes:30 },
    { label:'1h',  minutes:60 },
    { label:'6h',  minutes:360 },
    { label:'12h', minutes:720 },
    { label:'24h', minutes:1440 },
  ];

  let selectedCoin  = null;
  let fetchInterval = null;
  let selectedRange = 30;

  async function fetchLatest() {
    const since15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const [latestRes, oldRes] = await Promise.all([
      DB.from('crypto_latest').select('coin_id, price_usd, recorded_at'),
      DB.from('crypto_history')
        .select('coin_id, price_usd')
        .gte('recorded_at', since15)
        .order('recorded_at', { ascending: true }),
    ]);
    if (latestRes.error) { console.error('crypto fetch:', latestRes.error.message); return; }

    // Giá cũ nhất 15 phút qua
    const oldMap = {};
    (oldRes.data || []).forEach(row => {
      if (!oldMap[row.coin_id]) oldMap[row.coin_id] = Number(row.price_usd);
    });

    if (!STATE.stock.cryptoPrices)  STATE.stock.cryptoPrices  = {};
    if (!STATE.stock.cryptoHistory) STATE.stock.cryptoHistory = {};
    if (!STATE.stock.cryptoPrev)    STATE.stock.cryptoPrev    = {};

    latestRes.data.forEach(r => {
      const cur  = Number(r.price_usd);
      const prev = oldMap[r.coin_id] ?? cur;
      STATE.stock.cryptoPrices[r.coin_id] = cur;
      STATE.stock.cryptoPrev[r.coin_id]   = prev;
      if (!STATE.stock.cryptoHistory[r.coin_id]) STATE.stock.cryptoHistory[r.coin_id] = [];
      STATE.stock.cryptoHistory[r.coin_id].push(cur);
      if (STATE.stock.cryptoHistory[r.coin_id].length > 720)
        STATE.stock.cryptoHistory[r.coin_id].shift();
    });
    _refreshTable();
  }

  async function fetchHistory(coinId, minutes) {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { data, error } = await DB
      .from('crypto_history')
      .select('price_usd, recorded_at')
      .eq('coin_id', coinId)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });
    if (error) return [];
    return data.map(r => ({ price: Number(r.price_usd), time: r.recorded_at }));
  }

  function renderHTML() {
    const rows = COINS.map(c => {
      const price = STATE.stock.cryptoPrices?.[c.id] || 0;
      const prev  = STATE.stock.cryptoPrev?.[c.id] ?? price;
      const diff  = price - prev;
      const pct   = prev > 0 ? (diff / prev * 100) : 0;
      const pos   = STATE.stock.cryptoPortfolio?.[c.id];
      return `
        <div class="stock-row crypto-row ${selectedCoin===c.id?'selected':''}" data-coin="${c.id}">
          <span class="crypto-emoji">${c.emoji}</span>
          <span class="stock-sym">${c.sym}</span>
          <span class="stock-name">${c.name}</span>
          <span class="stock-price">$${Format.money(price)}</span>
          <span class="stock-chg ${diff>=0?'up':'dn'}">${diff>=0?'▲':'▼'}${Math.abs(pct).toFixed(2)}%</span>
          ${pos?.amount > 0 ? `<span class="stock-owned-dot">●</span>` : ''}
        </div>`;
    }).join('');
    return `<div class="stock-table" id="crypto-table">${rows}</div>`;
  }

  async function renderDetail(coinId, range) {
    range         = range || selectedRange;
    selectedRange = range;

    const coin    = COINS.find(c => c.id === coinId);
    const price   = STATE.stock.cryptoPrices?.[coinId] || 0;
    const history = await fetchHistory(coinId, range);
    const prices  = history.map(h => h.price);
    const prev    = prices.length > 1 ? prices[prices.length - 2] : price;
    const diff    = price - prev;
    const pct     = prev > 0 ? (diff / prev * 100) : 0;
    const pos     = STATE.stock.cryptoPortfolio?.[coinId] || { amount:0, avgPrice:0 };

    const container = document.getElementById('crypto-section');
    if (!container) return;
    container.innerHTML = `
      <div class="stock-detail">
        <button class="stock-back-btn" id="btn-crypto-back">← Quay Lại</button>
        <div class="stock-detail-header">
          <div>
            <div class="stock-detail-sym">${coin?.emoji} ${coin?.sym}</div>
            <div class="stock-detail-name">${coin?.name}</div>
          </div>
          <div style="text-align:right">
            <div class="stock-detail-price">$${Format.money(price)}</div>
            <div class="stock-detail-chg ${diff>=0?'up':'dn'}">${diff>=0?'▲':'▼'}${Math.abs(pct).toFixed(2)}%</div>
          </div>
        </div>

        <div class="chart-range-bar">
          ${TIME_RANGES.map(r => `
            <button class="chart-range-btn ${selectedRange===r.minutes?'active':''}"
              data-min="${r.minutes}">${r.label}</button>`).join('')}
        </div>

        <div class="stock-chart-wrap">
          ${_renderChart(prices, history, diff >= 0)}
          <div class="stock-chart-label">${_rangeLabel(range)} · ${prices.length} điểm · cập nhật 2 phút</div>
        </div>

        ${pos.amount > 0 ? `
        <div class="stock-position-bar">
          <span>💰 ${pos.amount.toFixed(6)} ${coin?.sym}</span>
          <span>Giá TB: $${Format.money(pos.avgPrice)}</span>
          <span class="${price>=pos.avgPrice?'up':'dn'}">${price>=pos.avgPrice?'▲':'▼'}${Math.abs((price-pos.avgPrice)/pos.avgPrice*100).toFixed(2)}%</span>
        </div>` : ''}

        <div class="stock-trade-panel">
          <div class="stock-trade-pcts">
            ${[25,50,75,100].map(p=>`<button class="stock-pct-btn" data-pct="${p}">${p}%</button>`).join('')}
          </div>
          <input class="stock-qty-input" id="crypto-qty" type="number"
            min="0.000001" step="0.01" value="1" placeholder="Số lượng"/>
          <div class="stock-trade-btns">
            <button class="stock-buy-btn"  id="btn-crypto-buy">📈 MUA</button>
            ${pos.amount>0?`<button class="stock-sell-btn" id="btn-crypto-sell">📉 BÁN</button>`:''}
          </div>
          <div class="stock-balance-info">💰 $${Format.money(STATE.balance)} có</div>
        </div>
      </div>`;
    _bindDetailEvents(coinId, price, pos);
  }

  function _rangeLabel(minutes) {
    if (minutes < 60)   return `${minutes} phút qua`;
    if (minutes < 1440) return `${minutes/60} giờ qua`;
    return '24 giờ qua';
  }

  function _fmtPrice(val) {
    if (val >= 1000)  return '$' + Format.compact(val);
    if (val >= 1)     return '$' + val.toFixed(2);
    if (val >= 0.01)  return '$' + val.toFixed(4);
    return '$' + val.toFixed(8);
  }

  function _renderChart(prices, history, isUp) {
    if (prices.length < 2) return '<div class="stock-chart-empty">Chưa có dữ liệu server</div>';

    const W = 400, H = 200, padL = 58, padR = 12, padT = 14, padB = 26;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const min   = Math.min(...prices);
    const max   = Math.max(...prices);
    const range = max - min || max * 0.001 || 1;
    const color = isUp ? '#00c853' : '#ff4444';
    const uid   = Math.floor(Math.random() * 9999);

    // Grid 5 dòng ngang
    const gridSVG = [0,1,2,3,4].map(i => {
      const val = min + range * i / 4;
      const y   = padT + innerH * (1 - i / 4);
      return `
        <line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}"
          stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <text x="${padL-4}" y="${(y+3.5).toFixed(1)}" font-size="7.5" fill="#666" text-anchor="end">
          ${_fmtPrice(val)}
        </text>`;
    }).join('');

    // Points
    const pts = prices.map((v, i) => {
      const x = padL + (i / (prices.length - 1)) * innerW;
      const y = padT + innerH * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const polyPts = pts.join(' ');
    const lastPt  = pts[pts.length - 1].split(',');
    const firstPt = pts[0].split(',');

    // Time labels
    const timeLabels = [0, Math.floor(prices.length / 2), prices.length - 1].map(i => {
      if (!history[i]) return '';
      const x  = padL + (i / (prices.length - 1)) * innerW;
      const t  = new Date(history[i].time);
      const lb = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
      return `<text x="${x.toFixed(1)}" y="${H-5}" font-size="7.5" fill="#555" text-anchor="middle">${lb}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" class="stock-chart-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="cg${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${gridSVG}
        ${timeLabels}
        <polygon
          points="${polyPts} ${lastPt[0]},${padT+innerH} ${firstPt[0]},${padT+innerH}"
          fill="url(#cg${uid})"/>
        <polyline
          points="${polyPts}"
          fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="3.5" fill="${color}" stroke="#0d0d0d" stroke-width="1.5"/>
      </svg>`;
  }

  function _bindDetailEvents(coinId, price, pos) {
    document.getElementById('btn-crypto-back')?.addEventListener('click', () => {
      selectedCoin = null; _refreshTable();
    });

    document.querySelectorAll('.chart-range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRange = parseInt(btn.dataset.min);
        renderDetail(coinId, selectedRange);
      });
    });

    document.querySelectorAll('.stock-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pct    = parseInt(btn.dataset.pct);
        const maxBuy = STATE.balance / price;
        document.getElementById('crypto-qty').value = (maxBuy * pct / 100).toFixed(4);
      });
    });

    document.getElementById('btn-crypto-buy')?.addEventListener('click', () => {
      const qty   = parseFloat(document.getElementById('crypto-qty').value) || 0;
      if (qty <= 0) return;
      const total = qty * price;
      if (STATE.balance < total) { UI.toast('Không đủ tiền!', 'error'); return; }
      STATE.balance -= total;
      if (!STATE.stock.cryptoPortfolio) STATE.stock.cryptoPortfolio = {};
      const p = STATE.stock.cryptoPortfolio[coinId] || { amount:0, avgPrice:0 };
      const newAmt = p.amount + qty;
      p.avgPrice = (p.avgPrice * p.amount + total) / newAmt;
      p.amount   = newAmt;
      STATE.stock.cryptoPortfolio[coinId] = p;
      UI.toast(`📈 Mua ${qty} · $${Format.money(total)}`, 'success');
      renderDetail(coinId);
    });

    document.getElementById('btn-crypto-sell')?.addEventListener('click', () => {
      const qty   = Math.min(parseFloat(document.getElementById('crypto-qty').value)||0, pos.amount);
      if (qty <= 0) return;
      const total = qty * price;
      STATE.balance += total;
      pos.amount -= qty;
      if (pos.amount <= 0.000001) delete STATE.stock.cryptoPortfolio[coinId];
      else STATE.stock.cryptoPortfolio[coinId] = pos;
      UI.toast(`📉 Bán ${qty} · $${Format.money(total)}`, 'success');
      renderDetail(coinId);
    });
  }

  function _refreshTable() {
    if (selectedCoin) return;
    const el = document.getElementById('crypto-section');
    if (el) { el.innerHTML = renderHTML(); _bindTableEvents(); }
  }

  function bindEvents() {
    _bindTableEvents();
    fetchLatest();
    if (fetchInterval) clearInterval(fetchInterval);
    fetchInterval = setInterval(fetchLatest, 30_000);
  }

  function _bindTableEvents() {
    document.querySelectorAll('.crypto-row').forEach(row => {
      row.addEventListener('click', () => {
        selectedCoin = row.dataset.coin;
        renderDetail(row.dataset.coin);
      });
    });
  }

  function renderHTML_wrap() {
    return `<div id="crypto-section">${renderHTML()}</div>`;
  }

  function init() {}
  return { init, renderHTML: renderHTML_wrap, bindEvents };
})();