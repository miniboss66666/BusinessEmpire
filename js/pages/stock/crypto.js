// @ts-nocheck
/* ============================================
   STOCK/CRYPTO.JS — Crypto với giá real CoinGecko
   Tên game khác, giá thật
   ============================================ */

const StockCrypto = (() => {

  const COINS = [
    // Tier 1 — Big caps
    { id:'bitcoin',       gameName:'Bytcoin',      ticker:'BYT', emoji:'⚡', realId:'bitcoin' },
    { id:'ethereum',      gameName:'Ethernium',    ticker:'ETH', emoji:'💎', realId:'ethereum' },
    { id:'binancecoin',   gameName:'BiBo',         ticker:'BBO', emoji:'🔥', realId:'binancecoin' },
    { id:'solana',        gameName:'Solaris',      ticker:'SLR', emoji:'☀️', realId:'solana' },
    { id:'ripple',        gameName:'Rippler',      ticker:'RPL', emoji:'🌊', realId:'ripple' },
    { id:'tether',        gameName:'USDT',         ticker:'UDT', emoji:'💵', realId:'tether' },
    { id:'usd-coin',      gameName:'USD Circle',   ticker:'USC', emoji:'🔵', realId:'usd-coin' },
    // Tier 2 — Mid caps
    { id:'cardano',       gameName:'Cardora',      ticker:'CDR', emoji:'🔷', realId:'cardano' },
    { id:'avalanche-2',   gameName:'Avalanche',    ticker:'AVX', emoji:'🏔️', realId:'avalanche-2' },
    { id:'tron',          gameName:'Tronix',       ticker:'TRX', emoji:'🔴', realId:'tron' },
    { id:'polkadot',      gameName:'DotChain',     ticker:'DOT', emoji:'⚪', realId:'polkadot' },
    { id:'chainlink',     gameName:'ChainLink',    ticker:'CLK', emoji:'🔗', realId:'chainlink' },
    { id:'polygon',       gameName:'Polynet',      ticker:'PLN', emoji:'🟣', realId:'matic-network' },
    { id:'litecoin',      gameName:'LiteCash',     ticker:'LTC', emoji:'🥈', realId:'litecoin' },
    { id:'uniswap',       gameName:'UniSwapper',   ticker:'UNS', emoji:'🦄', realId:'uniswap' },
    { id:'near',          gameName:'NearProto',    ticker:'NPR', emoji:'🌐', realId:'near' },
    // Tier 3 — Meme + Alt
    { id:'dogecoin',      gameName:'DOGE',         ticker:'DGE', emoji:'🐕', realId:'dogecoin' },
    { id:'shiba-inu',     gameName:'SHIBA',        ticker:'SHB', emoji:'🐾', realId:'shiba-inu' },
    { id:'pepe',          gameName:'PEPO',         ticker:'PPO', emoji:'🐸', realId:'pepe' },
    { id:'floki',         gameName:'FLOKI',        ticker:'FLK', emoji:'⚔️', realId:'floki' },
    // Tier 4 — DeFi / infra
    { id:'aave',          gameName:'AaveX',        ticker:'AVX', emoji:'👻', realId:'aave' },
    { id:'maker',         gameName:'MakerDAO',     ticker:'MKR', emoji:'🏛️', realId:'maker' },
    { id:'the-sandbox',   gameName:'SandVerse',    ticker:'SBX', emoji:'🏖️', realId:'the-sandbox' },
    { id:'axie-infinity', gameName:'AxieGame',     ticker:'AXG', emoji:'🐉', realId:'axie-infinity' },
    { id:'decentraland',  gameName:'MetaLand',     ticker:'MTL', emoji:'🌍', realId:'decentraland' },
    { id:'aptos',         gameName:'Aptosia',      ticker:'APS', emoji:'🔺', realId:'aptos' },
    { id:'arbitrum',      gameName:'ArbiNet',      ticker:'ARB', emoji:'💠', realId:'arbitrum' },
    { id:'optimism',      gameName:'OptiChain',    ticker:'OPC', emoji:'🔴', realId:'optimism' },
  ];

  let prices = {};        // realId -> USD price
  let prevPrices = {};
  let lastFetch = 0;
  let fetchInterval = null;

  // ── FETCH PRICES ─────────────────────────
  async function fetchPrices() {
    try {
      const ids = [...new Set(COINS.map(c => c.realId))].join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      if (!res.ok) throw new Error('CoinGecko ' + res.status);
      const data = await res.json();
      prevPrices = { ...prices };
      COINS.forEach(c => {
        if (data[c.realId]?.usd !== undefined) {
          prices[c.realId] = data[c.realId].usd;
        }
      });
      lastFetch = Date.now();
      if (!STATE.stock) STATE.stock = {};
      STATE.stock.cryptoPrices = { ...prices };
      _tickUI();
    } catch (e) {
      // Nếu API fail, dùng cached hoặc fallback
      if (STATE.stock?.cryptoPrices) {
        prices = { ...STATE.stock.cryptoPrices };
      }
      console.warn('[Crypto] Price fetch failed:', e.message);
    }
  }

  function getPrice(realId) {
    return prices[realId] || STATE.stock?.cryptoPrices?.[realId] || 0;
  }

  function getPortfolioValue() {
    const port = STATE.stock?.cryptoPortfolio || {};
    return Object.entries(port).reduce((sum, [realId, pos]) => {
      return sum + (pos.amount || 0) * getPrice(realId);
    }, 0);
  }

  // ── INIT ─────────────────────────────────
  function init() {
    if (!STATE.stock) STATE.stock = {};
    if (!STATE.stock.cryptoPortfolio) STATE.stock.cryptoPortfolio = {};
    prices = STATE.stock.cryptoPrices || {};
    fetchPrices(); // fetch ngay lần đầu
    fetchInterval = setInterval(fetchPrices, 60_000); // mỗi 60s
  }

  // ── RENDER ───────────────────────────────
  function renderHTML() {
    const port = STATE.stock?.cryptoPortfolio || {};
    const totalVal = getPortfolioValue();

    return `
      <div class="crypto-wrap">
        ${totalVal > 0 ? `
        <div class="stk-portfolio-bar">
          <span>💼 Crypto: <strong style="color:var(--green)">${Format.money(totalVal)}</strong></span>
        </div>` : ''}

        <div class="crypto-last-update">
          🕐 CoinGecko · ${lastFetch ? 'Updated ' + timeSince(lastFetch) : 'Loading...'}
          <button class="crypto-refresh-btn" id="btn-crypto-refresh">🔄</button>
        </div>

        <div class="crypto-list">
          ${COINS.map(c => {
            const price = getPrice(c.realId);
            const prev = prevPrices[c.realId] || price;
            const change = price > 0 && prev > 0 ? (price - prev) / prev * 100 : 0;
            const up = change >= 0;
            const pos = port[c.realId];
            const held = pos?.amount || 0;
            const heldVal = held * price;

            return `
              <div class="crypto-row" data-id="${c.realId}">
                <div class="crypto-icon">${c.emoji}</div>
                <div class="crypto-info">
                  <div class="crypto-name">${c.gameName}</div>
                  <div class="crypto-ticker">${c.ticker}</div>
                  ${held > 0 ? `<div class="crypto-held">💰 $${Format.money(heldVal)}</div>` : ''}
                </div>
                <div class="crypto-price-col">
                  <div class="crypto-price ${price===0?'loading':''}">
                    ${price > 0 ? '$' + Format.money(price) : '···'}
                  </div>
                  <div class="crypto-change ${up?'up':'down'}">
                    ${price > 0 ? (up?'▲':'▼') + ' ' + Math.abs(change).toFixed(2) + '%' : ''}
                  </div>
                </div>
                <button class="stk-trade-btn crypto-trade-btn" data-id="${c.realId}">GIAO DỊCH</button>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function timeSince(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + 's trước';
    return Math.floor(s / 60) + 'p trước';
  }

  function renderTradeModal(realId) {
    const coin = COINS.find(c => c.realId === realId);
    if (!coin) return;
    const price = getPrice(realId);
    if (price === 0) { UI.toast('Đang tải giá...', 'error'); return; }
    const port = STATE.stock?.cryptoPortfolio || {};
    const pos = port[realId];
    const held = pos?.amount || 0;
    const avgPrice = pos?.avgPrice || 0;
    const unrealized = held > 0 ? (price - avgPrice) * held : 0;
    const maxBuy = STATE.balance / price;

    UI.showModal(`
      <div class="stk-modal">
        <div class="stk-modal-header">
          <div>
            <div class="stk-modal-ticker">${coin.emoji} ${coin.gameName}</div>
            <div class="stk-modal-name">${coin.ticker} · Real: ${coin.realId}</div>
          </div>
          <div class="stk-modal-price">$${Format.money(price)}</div>
        </div>

        ${held > 0 ? `
        <div class="stk-modal-pos">
          <div>Đang nắm: <strong>${Format.money(held)}</strong> ${coin.ticker}</div>
          <div>Giá TB: $${Format.money(avgPrice)}</div>
          <div style="color:${unrealized>=0?'var(--green)':'var(--red)'}">
            P&L: ${unrealized>=0?'+':''}${Format.money(unrealized)}
          </div>
        </div>` : ''}

        <div class="stk-modal-inputs">
          <div class="stk-modal-label">Số lượng (USD):</div>
          <div class="stk-modal-qty-row">
            <button class="stk-qty-btn" data-pct="25">25%</button>
            <button class="stk-qty-btn" data-pct="50">50%</button>
            <button class="stk-qty-btn" data-pct="75">75%</button>
            <button class="stk-qty-btn" data-pct="100">Max</button>
          </div>
          <input class="stk-qty-input" id="crypto-usd" type="number" min="0.01"
                 step="0.01" value="${Math.min(100, STATE.balance).toFixed(2)}"
                 placeholder="Số USD muốn dùng">
          <div class="stk-modal-cost" id="crypto-cost">
            ≈ ${Format.money(100 / price)} ${coin.ticker}
          </div>
        </div>

        <div class="stk-modal-actions">
          <button class="stk-buy-btn" id="btn-crypto-buy"
                  ${STATE.balance < 0.01 ? 'disabled' : ''}>📈 MUA</button>
          <button class="stk-sell-btn" id="btn-crypto-sell"
                  ${held <= 0 ? 'disabled' : ''}>📉 BÁN HẾT</button>
        </div>
      </div>
    `);

    const usdInput = document.getElementById('crypto-usd');
    const costEl = document.getElementById('crypto-cost');

    function updateCost() {
      const usd = parseFloat(usdInput?.value) || 0;
      if (costEl) costEl.textContent = `≈ ${Format.money(usd / price)} ${coin.ticker}`;
    }
    usdInput?.addEventListener('input', updateCost);

    document.querySelectorAll('.stk-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const usd = STATE.balance * (parseInt(btn.dataset.pct) / 100);
        if (usdInput) usdInput.value = usd.toFixed(2);
        updateCost();
      });
    });

    document.getElementById('btn-crypto-buy')?.addEventListener('click', () => {
      const usd = parseFloat(usdInput?.value) || 0;
      if (usd < 0.01 || STATE.balance < usd) { UI.toast('Không đủ tiền!', 'error'); return; }
      const amount = usd / price;
      STATE.balance -= usd;
      if (!STATE.stock.cryptoPortfolio) STATE.stock.cryptoPortfolio = {};
      const cur = STATE.stock.cryptoPortfolio[realId] || { amount: 0, avgPrice: 0 };
      const newAmt = cur.amount + amount;
      STATE.stock.cryptoPortfolio[realId] = {
        amount: newAmt,
        avgPrice: (cur.avgPrice * cur.amount + usd) / newAmt,
      };
      UI.toast(`⚡ Mua ${Format.money(amount)} ${coin.ticker} — $${Format.money(usd)}`, 'success');
      UI.closeModal();
      _refresh();
    });

    document.getElementById('btn-crypto-sell')?.addEventListener('click', () => {
      const pos2 = STATE.stock?.cryptoPortfolio?.[realId];
      if (!pos2 || pos2.amount <= 0) return;
      const total = pos2.amount * price;
      STATE.balance += total;
      STATE.totalEarned += total;
      delete STATE.stock.cryptoPortfolio[realId];
      UI.toast(`💰 Bán hết ${coin.gameName} — $${Format.money(total)}`, 'success');
      UI.closeModal();
      _refresh();
    });
  }

  // ── BIND ─────────────────────────────────
  function bindEvents() {
    document.getElementById('btn-crypto-refresh')?.addEventListener('click', fetchPrices);
    document.querySelectorAll('.crypto-trade-btn').forEach(btn => {
      btn.addEventListener('click', () => renderTradeModal(btn.dataset.id));
    });
  }

  function _refresh() {
    const el = document.getElementById('stk-crypto-content');
    if (!el) return;
    el.innerHTML = renderHTML();
    bindEvents();
  }

  function _tickUI() {
    _refresh();
  }

  return { init, renderHTML, bindEvents, getPortfolioValue };
})();