// @ts-nocheck
/* STOCK/CRYPTO.JS — fetch từ Supabase crypto_history */

const StockCrypto = (() => {

  const COINS = [
    { id:'bitcoin',       sym:'BTC', name:'Bitcoin',       emoji:'₿'  },
    { id:'ethereum',      sym:'ETH', name:'Ethereum',      emoji:'Ξ'  },
    { id:'binancecoin',   sym:'BNB', name:'BNB',           emoji:'🔶' },
    { id:'solana',        sym:'SOL', name:'Solana',        emoji:'◎'  },
    { id:'ripple',        sym:'XRP', name:'XRP',           emoji:'✕'  },
    { id:'tether',        sym:'USDT',name:'Tether',        emoji:'₮'  },
    { id:'usd-coin',      sym:'USDC',name:'USD Coin',      emoji:'🔵' },
    { id:'cardano',       sym:'ADA', name:'Cardano',       emoji:'₳'  },
    { id:'avalanche-2',   sym:'AVAX',name:'Avalanche',     emoji:'🔺' },
    { id:'tron',          sym:'TRX', name:'TRON',          emoji:'🔴' },
    { id:'matic-network', sym:'MATIC',name:'Polygon',      emoji:'🟣' },
    { id:'polkadot',      sym:'DOT', name:'Polkadot',      emoji:'●'  },
    { id:'chainlink',     sym:'LINK',name:'Chainlink',     emoji:'⬡'  },
    { id:'litecoin',      sym:'LTC', name:'Litecoin',      emoji:'Ł'  },
    { id:'uniswap',       sym:'UNI', name:'Uniswap',       emoji:'🦄' },
    { id:'near',          sym:'NEAR',name:'NEAR Protocol', emoji:'Ⓝ'  },
    { id:'dogecoin',      sym:'DOGE',name:'Dogecoin',      emoji:'🐕' },
    { id:'shiba-inu',     sym:'SHIB',name:'Shiba Inu',     emoji:'🐕‍🦺'},
    { id:'pepe',          sym:'PEPE',name:'Pepe',          emoji:'🐸' },
    { id:'floki',         sym:'FLOKI',name:'Floki',        emoji:'⚡' },
    { id:'aave',          sym:'AAVE',name:'Aave',          emoji:'👻' },
    { id:'maker',         sym:'MKR', name:'Maker',         emoji:'Μ'  },
    { id:'the-sandbox',   sym:'SAND',name:'The Sandbox',   emoji:'🏖' },
    { id:'axie-infinity', sym:'AXS', name:'Axie Infinity', emoji:'🐾' },
    { id:'decentraland',  sym:'MANA',name:'Decentraland',  emoji:'🌐' },
    { id:'aptos',         sym:'APT', name:'Aptos',         emoji:'🔷' },
    { id:'arbitrum',      sym:'ARB', name:'Arbitrum',      emoji:'🔵' },
    { id:'optimism',      sym:'OP',  name:'Optimism',      emoji:'🔴' },
  ];

  let selectedCoin = null;
  let fetchInterval = null;

  function _supabase() { return DB; }

  // ── Fetch giá mới nhất ──
  async function fetchLatest() {
    const { data, error } = await _supabase()
      .from('crypto_latest')
      .select('coin_id, price_usd, recorded_at');
    if (error) { console.error('crypto fetch:', error.message); return; }

    const prices = {};
    data.forEach(r => { prices[r.coin_id] = Number(r.price_usd); });

    // Update STATE + lưu lịch sử cho chart
    if (!STATE.stock.cryptoPrices) STATE.stock.cryptoPrices = {};
    if (!STATE.stock.cryptoHistory) STATE.stock.cryptoHistory = {};
    COINS.forEach(c => {
      if (prices[c.id] === undefined) return;
      const newPrice = prices[c.id];
      STATE.stock.cryptoPrices[c.id] = newPrice;
      if (!STATE.stock.cryptoHistory[c.id]) STATE.stock.cryptoHistory[c.id] = [];
      STATE.stock.cryptoHistory[c.id].push(newPrice);
      // Giới hạn 720 điểm (24h × 60 / 2 phút)
      if (STATE.stock.cryptoHistory[c.id].length > 720)
        STATE.stock.cryptoHistory[c.id].shift();
    });
    _refreshTable();
  }

  // ── Fetch lịch sử 24h từ Supabase ──
  async function fetchHistory(coinId) {
    const since = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data, error } = await _supabase()
      .from('crypto_history')
      .select('price_usd, recorded_at')
      .eq('coin_id', coinId)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });
    if (error) return STATE.stock.cryptoHistory?.[coinId] || [];
    return data.map(r => Number(r.price_usd));
  }

  // ── Render list ──
  function renderHTML() {
    const rows = COINS.map(c => {
      const price = STATE.stock.cryptoPrices?.[c.id] || 0;
      const hist  = STATE.stock.cryptoHistory?.[c.id] || [];
      const prev  = hist.length > 1 ? hist[hist.length-2] : price;
      const diff  = price - prev;
      const pct   = prev > 0 ? (diff/prev*100) : 0;
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

  // ── Detail view ──
  async function renderDetail(coinId) {
    const coin  = COINS.find(c => c.id === coinId);
    const price = STATE.stock.cryptoPrices?.[coinId] || 0;
    const history = await fetchHistory(coinId);
    const prev  = history.length > 1 ? history[history.length-2] : price;
    const diff  = price - prev;
    const pct   = prev > 0 ? (diff/prev*100) : 0;
    const pos   = STATE.stock.cryptoPortfolio?.[coinId] || { amount:0, avgPrice:0 };

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

        <div class="stock-chart-wrap">
          ${_renderChart(history, diff >= 0)}
          <div class="stock-chart-label">24 giờ qua (${history.length} điểm · server update 2 phút)</div>
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

  function _renderChart(history, isUp) {
    if (history.length < 2) return '<div class="stock-chart-empty">Chưa có dữ liệu server</div>';
    const W=320, H=100, pad=4;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pts = history.map((v,i) => {
      const x = pad + (i/(history.length-1))*(W-pad*2);
      const y = H - pad - ((v-min)/range)*(H-pad*2);
      return `${x},${y}`;
    }).join(' ');
    const color = isUp ? '#00c853' : '#ff4444';
    const lastX = pad + (W-pad*2);
    const lastY = H - pad - ((history[history.length-1]-min)/range)*(H-pad*2);
    return `
      <svg viewBox="0 0 ${W} ${H}" class="stock-chart-svg">
        <defs>
          <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${pts} ${lastX},${H} ${pad},${H}" fill="url(#cg2)"/>
        <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/>
        <circle cx="${lastX}" cy="${lastY}" r="3" fill="${color}"/>
        <text x="${pad}" y="${H-2}" font-size="8" fill="#555">${Format.money(min)}</text>
        <text x="${W-pad}" y="10" font-size="8" fill="#555" text-anchor="end">${Format.money(max)}</text>
      </svg>`;
  }

  function _bindDetailEvents(coinId, price, pos) {
    document.getElementById('btn-crypto-back')?.addEventListener('click', () => {
      selectedCoin = null; _refreshTable();
    });
    document.querySelectorAll('.stock-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pct = parseInt(btn.dataset.pct);
        const maxBuy = STATE.balance / price;
        document.getElementById('crypto-qty').value = (maxBuy * pct/100).toFixed(4);
      });
    });
    document.getElementById('btn-crypto-buy')?.addEventListener('click', () => {
      const qty = parseFloat(document.getElementById('crypto-qty').value) || 0;
      if (qty <= 0) return;
      const total = qty * price;
      if (STATE.balance < total) { UI.toast('Không đủ tiền!','error'); return; }
      STATE.balance -= total;
      if (!STATE.stock.cryptoPortfolio) STATE.stock.cryptoPortfolio = {};
      const p = STATE.stock.cryptoPortfolio[coinId] || { amount:0, avgPrice:0 };
      const newAmt = p.amount + qty;
      p.avgPrice = (p.avgPrice * p.amount + total) / newAmt;
      p.amount = newAmt;
      STATE.stock.cryptoPortfolio[coinId] = p;
      UI.toast(`📈 Mua ${qty} · $${Format.money(total)}`, 'success');
      renderDetail(coinId);
    });
    document.getElementById('btn-crypto-sell')?.addEventListener('click', () => {
      const qty = Math.min(parseFloat(document.getElementById('crypto-qty').value)||0, pos.amount);
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

  function init() { /* data load khi bindEvents được gọi */ }
  return { init, renderHTML: renderHTML_wrap, bindEvents };
})();