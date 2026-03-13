// @ts-nocheck
/* ============================================
   STOCK/INDEX.JS — Dashboard 3 tab
   ============================================ */
const StockPage = (() => {
  let currentTab = 'market'; // 'market' | 'crypto' | 'miner'

  function _getStockPortfolioValue() {
    let total = 0;
    const portfolio = STATE.stock?.portfolio || {};
    const market = STATE.stock?.market || {};
    for (const sym in portfolio) {
      const shares = portfolio[sym]?.shares || 0;
      const price  = market[sym]?.price || 0;
      total += shares * price;
    }
    return total;
  }

  function _getCryptoPortfolioValue() {
    let total = 0;
    const cp = STATE.stock?.cryptoPortfolio || {};
    const prices = STATE.stock?.cryptoPrices || {};
    for (const coinId in cp) {
      const amount = cp[coinId]?.amount || 0;
      const price  = prices[coinId] || 0;
      total += amount * price;
    }
    return total;
  }

  function init() {
    StockMarket.init();
    StockCrypto.init();
    StockMiner.init();
    render();
  }

  function render() {
    const page = document.getElementById('page-stock');
    if (!page) return;
    page.innerHTML = renderHTML();
    bindEvents();
  }

  function renderHTML() {
    const marketVal = _getStockPortfolioValue();
    const cryptoVal = _getCryptoPortfolioValue();
    const miningInc = StockMiner.getMiningIncome();
    const totalVal  = marketVal + cryptoVal;
    return `
      <div class="stock-wrap">
        <!-- Header -->
        <div class="stock-header">
          <span class="stock-title">📈 STOCK & CRYPTO</span>
          <div class="stock-header-stats">
            ${totalVal > 0 ? `<span class="stock-total-val">${Format.money(totalVal)}</span>` : ''}
            ${miningInc > 0 ? `<span class="stock-mining-val">⛏️ ${Format.money(miningInc)}/ph</span>` : ''}
          </div>
        </div>
        <!-- Tabs -->
        <div class="stock-tabs">
          <button class="stock-tab ${currentTab==='market'?'active':''}" data-tab="market">
            📊 Cổ Phiếu
          </button>
          <button class="stock-tab ${currentTab==='crypto'?'active':''}" data-tab="crypto">
            ⚡ Crypto
          </button>
          <button class="stock-tab ${currentTab==='miner'?'active':''}" data-tab="miner">
            ⛏️ Miner
          </button>
        </div>
        <!-- Content -->
        <div class="stock-content" id="stock-content">
          ${renderTabContent()}
        </div>
      </div>`;
  }

  function renderTabContent() {
    if (currentTab === 'market') return `<div id="stk-market-content">${StockMarket.renderHTML()}</div>`;
    if (currentTab === 'crypto') return `<div id="stk-crypto-content">${StockCrypto.renderHTML()}</div>`;
    return `<div id="stk-miner-content">${StockMiner.renderHTML()}</div>`;
  }

  function bindEvents() {
    document.querySelectorAll('.stock-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        document.querySelectorAll('.stock-tab').forEach(b =>
          b.classList.toggle('active', b.dataset.tab === currentTab));
        document.getElementById('stock-content').innerHTML = renderTabContent();
        bindTabContent();
      });
    });
    bindTabContent();
  }

  function bindTabContent() {
    if (currentTab === 'market')      StockMarket.bindEvents();
    else if (currentTab === 'crypto') StockCrypto.bindEvents();
    else                              StockMiner.bindEvents();
  }

  function tick() {
    const totalVal = _getStockPortfolioValue() + _getCryptoPortfolioValue();
    const miningInc = StockMiner.getMiningIncome();
    const valEl = document.querySelector('.stock-total-val');
    const minEl = document.querySelector('.stock-mining-val');
    if (valEl && totalVal > 0) valEl.textContent = Format.money(totalVal);
    if (minEl && miningInc > 0) minEl.textContent = '⛏️ ' + Format.money(miningInc) + '/ph';
  }

  return { init, render, tick };
})();