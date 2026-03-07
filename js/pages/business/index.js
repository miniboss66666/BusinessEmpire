/* ============================================
   BUSINESS/INDEX.JS — Tab manager
   3 tabs: Lemonade | Market | Transportation
   ============================================ */

const BusinessPage = (() => {

  let currentTab = 'lemonade';

  const TABS = [
    { id: 'lemonade',  label: '🍋 Nước Chanh', module: () => typeof BusinessLemonade   !== 'undefined' ? BusinessLemonade   : null },
    { id: 'market',    label: '🏪 Market',     module: () => typeof BusinessMarket     !== 'undefined' ? BusinessMarket     : null },
    { id: 'transport', label: '🚗 Vận Tải',    module: () => typeof BusinessTransport  !== 'undefined' ? BusinessTransport  : null },
    { id: 'soon',      label: '❓ Soon',        module: () => null },
  ];

  function init() {
    const page = document.getElementById('page-business');
    if (!page) return;

    page.innerHTML = `
      <div class="biz-wrap">
        <div class="biz-tabs">
          ${TABS.map(t => `
            <button class="biz-tab-btn ${t.id === currentTab ? 'active' : ''}"
                    data-tab="${t.id}">${t.label}</button>
          `).join('')}
        </div>
        <div class="biz-income-bar">
          <span class="biz-income-label">📈 Thu nhập Business</span>
          <span class="biz-income-val" id="biz-total-income">$0/phút</span>
        </div>
        <div id="biz-content"></div>
      </div>
    `;

    document.querySelectorAll('.biz-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    renderTab(currentTab);
    updateIncomeBar();
  }

  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.biz-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    renderTab(tabId);
  }

  function renderTab(tabId) {
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) return;
    const mod = tab.module();
    const content = document.getElementById('biz-content');
    if (!content) return;

    if (!mod) {
      content.innerHTML = `
        <div class="biz-coming-soon">
          <div style="font-size:2.5rem">🔨</div>
          <div style="font-family:'Orbitron',monospace;font-size:0.9rem;
                      color:var(--text-dim);margin-top:8px">COMING SOON</div>
        </div>`;
      return;
    }

    content.innerHTML = mod.renderHTML();
    mod.bindEvents();
  }

  function updateIncomeBar() {
    const el = document.getElementById('biz-total-income');
    if (!el) return;
    // Tính tổng income business (lemonade + market + transport)
    const lemon     = typeof BusinessLemonade  !== 'undefined' ? BusinessLemonade.getIncome()  : 0;
    const market    = typeof BusinessMarket    !== 'undefined' ? BusinessMarket.getIncome()   : 0;
    const transport = typeof BusinessTransport !== 'undefined' ? BusinessTransport.getIncome(): 0;
    el.textContent = Format.money(lemon + market + transport) + '/phút';
  }

  // Gọi từ engine tick để update income bar
  function tick() {
    updateIncomeBar();
  }

  return { init, switchTab, tick };

})();