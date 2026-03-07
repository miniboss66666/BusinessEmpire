/* ============================================
   BUSINESS/INDEX.JS
   - Màn hình chính: danh sách cards
   - Ấn "Quản Lý" → vào detail module
   ============================================ */

const BusinessPage = (() => {

  let currentDetail = null; // null = dashboard, 'lemonade'|'market'|'transport'

  const MODULES = [
    {
      id: 'lemonade',
      emoji: '🍋',
      name: 'Quầy Nước Chanh',
      desc: 'Chỉ là 1 quầy nước nhỏ',
      module: () => typeof BusinessLemonade  !== 'undefined' ? BusinessLemonade  : null,
      getStats: () => {
        const st = STATE.business.lemonade;
        const lvNames = ['Quầy Nước Chanh','Cửa Hàng Chanh','Công Ty Chanh','Tập Đoàn Đa QG','Đa Hành Tinh','Liên Sao','Đa Ngân Hà','Đa Vũ Trụ MAX'];
        return [
          { label: 'Cấp độ', value: `LV.${st.level} — ${lvNames[st.level-1]}` },
          { label: 'Đơn vị', value: `${st.owned}/1000` },
          { label: 'Thu nhập', value: Format.money(typeof BusinessLemonade !== 'undefined' ? BusinessLemonade.getIncome() : 0) + '/phút', green: true },
        ];
      },
    },
    {
      id: 'market',
      emoji: '🏪',
      name: 'Market',
      desc: 'Kho hàng, cửa hàng bán lẻ đa ngành',
      module: () => typeof BusinessMarket !== 'undefined' ? BusinessMarket : null,
      getStats: () => {
        const s = STATE.business.market;
        const totalStores = Object.values(s.stores).reduce((a,b) => a + b.owned, 0);
        return [
          { label: 'Kho hàng', value: `Cấp ${s.warehouse.level} — ${Format.money(s.warehouse.stock)} đv` },
          { label: 'Chi nhánh', value: `${totalStores} cửa hàng` },
          { label: 'Thu nhập', value: Format.money(typeof BusinessMarket !== 'undefined' ? BusinessMarket.getIncome() : 0) + '/phút', green: true },
        ];
      },
    },
    {
      id: 'transport',
      emoji: '🚗',
      name: 'Vận Tải',
      desc: 'Đường bộ, đường ray, hàng không',
      module: () => typeof BusinessTransport !== 'undefined' ? BusinessTransport : null,
      getStats: () => {
        const s = STATE.business.transport;
        const totalVehicles = Object.values(s.vehicles).reduce((a,b) => a+b, 0);
        const totalTrains = Object.values(s.railways).reduce((a,b) => a + (b.trains||0), 0);
        return [
          { label: 'Xe', value: `${totalVehicles}/${s.garageSize} (Garage ${Format.money(s.garageSize)})` },
          { label: 'Tàu', value: `${totalTrains} tàu${s.hasApp ? ' · 📱 App' : ''}` },
          { label: 'Thu nhập', value: Format.money(typeof BusinessTransport !== 'undefined' ? BusinessTransport.getIncome() : 0) + '/phút', green: true },
        ];
      },
    },
    {
      id: 'soon',
      emoji: '❓',
      name: 'Coming Soon',
      desc: 'Nhiều ngành nghề mới sắp ra mắt...',
      module: () => null,
      getStats: () => [],
    },
  ];

  function init() {
    currentDetail = null;
    render();
  }

  // DASHBOARD
  function renderDashboard(page) {
    const totalIncome = MODULES.reduce((sum, m) => {
      const mod = m.module();
      return sum + (mod && mod.getIncome ? mod.getIncome() : 0);
    }, 0);

    page.innerHTML = `
      <div class="biz-dash-wrap">
        <div class="biz-dash-header">
          <div class="biz-dash-title">💼 BUSINESS</div>
          <div class="biz-dash-income">
            <span style="color:var(--text-dim);font-size:0.65rem">TỔNG THU NHẬP</span>
            <span class="biz-dash-income-val" id="biz-total-income">${Format.money(totalIncome)}/phút</span>
          </div>
        </div>
        <div class="biz-card-list">
          ${MODULES.map(m => renderCard(m)).join('')}
        </div>
      </div>`;

    MODULES.forEach(m => {
      document.getElementById('btn-biz-manage-' + m.id)?.addEventListener('click', () => {
        if (!m.module()) return;
        currentDetail = m.id;
        render();
      });
    });
  }

  function renderCard(m) {
    const mod = m.module();
    const stats = m.getStats();
    const isSoon = !mod;
    return `
      <div class="biz-card ${isSoon ? 'biz-card-soon' : ''}">
        <div class="biz-card-top">
          <div class="biz-card-emoji">${m.emoji}</div>
          <div class="biz-card-info">
            <div class="biz-card-name">${m.name}</div>
            <div class="biz-card-desc">${m.desc}</div>
          </div>
          ${!isSoon ? '<div class="biz-card-tax-badge">8.3%</div>' : ''}
        </div>
        ${stats.length > 0 ? `
        <div class="biz-card-stats">
          ${stats.map(s => `
            <div class="biz-card-stat">
              <span class="biz-card-stat-lbl">${s.label}</span>
              <span class="biz-card-stat-val${s.green ? ' green' : ''}">${s.value}</span>
            </div>`).join('')}
        </div>` : ''}
        <button class="biz-card-manage-btn${isSoon ? ' disabled' : ''}"
                id="btn-biz-manage-${m.id}" ${isSoon ? 'disabled' : ''}>
          ${isSoon ? '🔒 COMING SOON' : '⚙️ QUẢN LÝ'}
        </button>
      </div>`;
  }

  // DETAIL
  function renderDetail(page, moduleId) {
    const m = MODULES.find(x => x.id === moduleId);
    const mod = m && m.module();
    if (!mod) { currentDetail = null; render(); return; }

    page.innerHTML = `
      <div class="biz-detail-wrap">
        <div class="biz-detail-topbar">
          <button class="biz-back-btn" id="btn-biz-back">← Quay Lại</button>
          <span class="biz-detail-title">${m.emoji} ${m.name}</span>
          <span class="biz-detail-income" id="biz-detail-income">${Format.money(mod.getIncome ? mod.getIncome() : 0)}/phút</span>
        </div>
        <div class="biz-detail-content" id="biz-detail-content">
          ${mod.renderHTML()}
        </div>
      </div>`;

    document.getElementById('btn-biz-back')?.addEventListener('click', () => {
      currentDetail = null;
      render();
    });

    mod.bindEvents();
  }

  function render() {
    const page = document.getElementById('page-business');
    if (!page) return;
    if (currentDetail) renderDetail(page, currentDetail);
    else renderDashboard(page);
  }

  function tick() {
    const incomeEl = document.getElementById('biz-total-income');
    if (incomeEl) {
      const total = MODULES.reduce((s, m) => s + (m.module() && m.module().getIncome ? m.module().getIncome() : 0), 0);
      incomeEl.textContent = Format.money(total) + '/phút';
    }
    const detailEl = document.getElementById('biz-detail-income');
    if (detailEl && currentDetail) {
      const m = MODULES.find(x => x.id === currentDetail);
      const mod = m && m.module();
      if (mod && mod.getIncome) detailEl.textContent = Format.money(mod.getIncome()) + '/phút';
    }
    if (typeof BusinessMarket !== 'undefined') BusinessMarket.tick();
  }

  return { init, tick };

})();