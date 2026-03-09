// @ts-nocheck
/* STOCK/MARKET.JS — fetch giá từ Supabase stock_history */

const StockMarket = (() => {

  const EXCHANGES = {
    NYSE:      { label:'🇺🇸 NYSE',      currency:'$',  symbols:['AAPL','MSFT','GOOGL','AMZN','META','TSLA'] },
    NASDAQ:    { label:'🇺🇸 NASDAQ',    currency:'$',  symbols:['NVDA','AMD','INTC','NFLX','SHOP'] },
    LSE:       { label:'🇬🇧 LSE',       currency:'£',  symbols:['HSBC','BP','VOD','RIO'] },
    Tokyo:     { label:'🇯🇵 Tokyo',     currency:'¥',  symbols:['7203','6758','9984','6861'] },
    HongKong:  { label:'🇭🇰 HK',        currency:'HK$',symbols:['0700','9988','1299'] },
    Frankfurt: { label:'🇩🇪 Frankfurt', currency:'€',  symbols:['SAP','BMW','SIE'] },
    Shanghai:  { label:'🇨🇳 Shanghai',  currency:'¥',  symbols:['600519','601318','600036'] },
    HOSE:      { label:'🇻🇳 HOSE',      currency:'₫',  symbols:['VNM','VIC','VHM','FPT','MWG','HPG','DYNX'] },
  };

  const STOCK_INFO = {
    AAPL:{name:'Apple Inc.'},        MSFT:{name:'Microsoft'},
    GOOGL:{name:'Alphabet'},         AMZN:{name:'Amazon'},
    META:{name:'Meta Platforms'},    TSLA:{name:'Tesla'},
    NVDA:{name:'NVIDIA'},            AMD:{name:'AMD'},
    INTC:{name:'Intel'},             NFLX:{name:'Netflix'},
    SHOP:{name:'Shopify'},           HSBC:{name:'HSBC Holdings'},
    BP:{name:'BP p.l.c.'},           VOD:{name:'Vodafone'},
    RIO:{name:'Rio Tinto'},          '7203':{name:'Toyota'},
    '6758':{name:'Sony'},            '9984':{name:'SoftBank'},
    '6861':{name:'Keyence'},         '0700':{name:'Tencent'},
    '9988':{name:'Alibaba'},         '1299':{name:'AIA Group'},
    SAP:{name:'SAP SE'},             BMW:{name:'BMW AG'},
    SIE:{name:'Siemens'},            '600519':{name:'Kweichow Moutai'},
    '601318':{name:'Ping An'},       '600036':{name:'China Merchants'},
    VNM:{name:'Vinamilk'},           VIC:{name:'Vingroup'},
    VHM:{name:'Vinhomes'},           FPT:{name:'FPT Corp'},
    MWG:{name:'Mobile World'},       HPG:{name:'Hoa Phat'},
    DYNX:{name:'DynaTech'},
  };

  let selectedStock = null;
  let fetchInterval = null;

  // ── Fetch giá mới nhất từ Supabase ──
  async function fetchLatest() {
    const { data, error } = await _supabase()
      .from('stock_latest')
      .select('symbol, price, recorded_at');
    if (error) { console.error('stock fetch:', error.message); return; }

    data.forEach(row => {
      if (!STATE.stock.market[row.symbol]) STATE.stock.market[row.symbol] = {};
      const prev = STATE.stock.market[row.symbol].price || Number(row.price);
      STATE.stock.market[row.symbol] = {
        price: Number(row.price),
        prev,
        recorded_at: row.recorded_at,
      };
    });
    _refreshTable();
  }

  // ── Fetch lịch sử 24h của 1 symbol ──
  async function fetchHistory(symbol) {
    const since = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data, error } = await _supabase()
      .from('stock_history')
      .select('price, recorded_at')
      .eq('symbol', symbol)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });
    if (error) return [];
    return data.map(r => Number(r.price));
  }

  function _supabase() { return DB; }

  // ── Render bảng ──
  function renderHTML() {
    const rows = Object.entries(EXCHANGES).map(([exId, ex]) => `
      <div class="stock-exchange-group">
        <div class="stock-exchange-label">${ex.label}</div>
        ${ex.symbols.map(sym => {
          const d = STATE.stock.market[sym] || {};
          const price = d.price || 0;
          const prev  = d.prev  || price;
          const diff  = price - prev;
          const pct   = prev > 0 ? (diff/prev*100) : 0;
          const pos   = STATE.stock.portfolio[sym];
          return `
            <div class="stock-row ${selectedStock===sym?'selected':''}" data-sym="${sym}" data-ex="${exId}">
              <span class="stock-sym">${sym}</span>
              <span class="stock-name">${STOCK_INFO[sym]?.name||''}</span>
              <span class="stock-price">${ex.currency}${Format.money(price)}</span>
              <span class="stock-chg ${diff>=0?'up':'dn'}">${diff>=0?'▲':'▼'}${Math.abs(pct).toFixed(2)}%</span>
              ${pos?.shares > 0 ? `<span class="stock-owned-dot">●</span>` : ''}
            </div>`;
        }).join('')}
      </div>`).join('');

    return `<div class="stock-table" id="stock-market-table">${rows}</div>`;
  }

  // ── Detail view ──
  async function renderDetail(sym, exId) {
    const ex = EXCHANGES[exId];
    const d  = STATE.stock.market[sym] || {};
    const price = d.price || 0;
    const prev  = d.prev  || price;
    const diff  = price - prev;
    const pct   = prev > 0 ? (diff/prev*100) : 0;
    const pos   = STATE.stock.portfolio[sym] || { shares:0, avgPrice:0 };
    const history = await fetchHistory(sym);

    const container = document.getElementById('stock-market-section');
    if (!container) return;
    container.innerHTML = `
      <div class="stock-detail">
        <button class="stock-back-btn" id="btn-stock-back">← Quay Lại</button>
        <div class="stock-detail-header">
          <div>
            <div class="stock-detail-sym">${sym}</div>
            <div class="stock-detail-name">${STOCK_INFO[sym]?.name||''} · ${ex?.label||''}</div>
          </div>
          <div style="text-align:right">
            <div class="stock-detail-price">${ex?.currency}${Format.money(price)}</div>
            <div class="stock-detail-chg ${diff>=0?'up':'dn'}">${diff>=0?'▲':'▼'}${Math.abs(pct).toFixed(2)}%</div>
          </div>
        </div>

        <!-- Chart 24h -->
        <div class="stock-chart-wrap">
          ${_renderChart(history, diff >= 0)}
          <div class="stock-chart-label">24 giờ qua (${history.length} điểm)</div>
        </div>

        <!-- Position -->
        ${pos.shares > 0 ? `
        <div class="stock-position-bar">
          <span>📦 ${Format.money(pos.shares)} cổ phiếu</span>
          <span>Giá TB: ${ex?.currency}${Format.money(pos.avgPrice)}</span>
          <span class="${price>=pos.avgPrice?'up':'dn'}">${price>=pos.avgPrice?'▲':'▼'}${Math.abs((price-pos.avgPrice)/pos.avgPrice*100).toFixed(2)}%</span>
        </div>` : ''}

        <!-- Trade -->
        <div class="stock-trade-panel">
          <div class="stock-trade-pcts">
            ${[25,50,75,100].map(p=>`<button class="stock-pct-btn" data-pct="${p}">${p}%</button>`).join('')}
          </div>
          <input class="stock-qty-input" id="stock-qty" type="number" min="1" value="1" placeholder="Số lượng"/>
          <div class="stock-trade-btns">
            <button class="stock-buy-btn"  id="btn-stock-buy">
              📈 MUA · ${ex?.currency}${Format.money(price)} /cổ
            </button>
            ${pos.shares>0?`<button class="stock-sell-btn" id="btn-stock-sell">
              📉 BÁN · ${Format.money(pos.shares)} có
            </button>`:''}
          </div>
          <div class="stock-balance-info">💰 ${Format.money(STATE.balance)} có</div>
        </div>
      </div>`;
    _bindDetailEvents(sym, exId, price, pos, ex);
  }

  function _renderChart(history, isUp) {
    if (history.length < 2) return '<div class="stock-chart-empty">Chưa có dữ liệu</div>';
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
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${pts} ${lastX},${H} ${pad},${H}"
          fill="url(#cg)"/>
        <polyline points="${pts}"
          fill="none" stroke="${color}" stroke-width="1.5"/>
        <circle cx="${lastX}" cy="${lastY}" r="3" fill="${color}"/>
        <text x="${pad}" y="${H-2}" font-size="8" fill="#555">${Format.money(min)}</text>
        <text x="${W-pad}" y="10" font-size="8" fill="#555" text-anchor="end">${Format.money(max)}</text>
      </svg>`;
  }

  function _bindDetailEvents(sym, exId, price, pos, ex) {
    document.getElementById('btn-stock-back')?.addEventListener('click', () => {
      selectedStock = null;
      _refreshTable();
    });
    document.querySelectorAll('.stock-pct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pct = parseInt(btn.dataset.pct);
        const maxBuy = Math.floor(STATE.balance / price);
        const qty = Math.max(1, Math.floor(maxBuy * pct/100));
        document.getElementById('stock-qty').value = qty;
      });
    });
    document.getElementById('btn-stock-buy')?.addEventListener('click', () => {
      const qty = parseInt(document.getElementById('stock-qty').value) || 1;
      const total = qty * price;
      if (STATE.balance < total) { UI.toast('Không đủ tiền!','error'); return; }
      STATE.balance -= total;
      const p = STATE.stock.portfolio[sym] || { shares:0, avgPrice:0 };
      const newShares = p.shares + qty;
      p.avgPrice = (p.avgPrice * p.shares + total) / newShares;
      p.shares = newShares;
      STATE.stock.portfolio[sym] = p;
      UI.toast(`📈 Mua ${qty} ${sym} · ${ex?.currency}${Format.money(total)}`, 'success');
      renderDetail(sym, exId);
    });
    document.getElementById('btn-stock-sell')?.addEventListener('click', () => {
      const qty = Math.min(parseInt(document.getElementById('stock-qty').value)||1, pos.shares);
      const total = qty * price;
      STATE.balance += total;
      pos.shares -= qty;
      if (pos.shares <= 0) delete STATE.stock.portfolio[sym];
      else STATE.stock.portfolio[sym] = pos;
      UI.toast(`📉 Bán ${qty} ${sym} · ${ex?.currency}${Format.money(total)}`, 'success');
      renderDetail(sym, exId);
    });
  }

  function _refreshTable() {
    if (selectedStock) return;
    const el = document.getElementById('stock-market-section');
    if (el) { el.innerHTML = renderHTML(); _bindTableEvents(); }
  }

  function bindEvents() {
    _bindTableEvents();
    // Fetch ngay + mỗi 30s poll (server update mỗi 2 phút)
    fetchLatest();
    if (fetchInterval) clearInterval(fetchInterval);
    fetchInterval = setInterval(fetchLatest, 30_000);
  }

  function _bindTableEvents() {
    document.querySelectorAll('.stock-row').forEach(row => {
      row.addEventListener('click', () => {
        selectedStock = row.dataset.sym;
        renderDetail(row.dataset.sym, row.dataset.ex);
      });
    });
  }

  function renderHTML_wrap() {
    return `<div id="stock-market-section">${renderHTML()}</div>`;
  }

  function init() { /* data load khi bindEvents được gọi */ }
  return { init, renderHTML: renderHTML_wrap, bindEvents };
})();