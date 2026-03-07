/* ============================================
   BUSINESS/TRANSPORT.JS
   - 7 xe đường bộ, garage max 10,000
   - App Grab/Uber x2 income
   - 5 loại đường ray, max 20→100 ga
   - Mỗi ga chứa 6 tàu/loại
   ============================================ */

const BusinessTransport = (() => {

  // ── DATA ──────────────────────────────────
  const VEHICLE_DATA = {
    shipper:    { emoji:'🏍️', name:'Shipper',       price:500,       incomePerMin:5,   appBoost:true },
    taxi:       { emoji:'🚕', name:'Taxi',           price:2_000,     incomePerMin:15,  appBoost:true },
    ambulance:  { emoji:'🚑', name:'Cứu Thương',    price:8_000,     incomePerMin:40,  appBoost:false },
    bus:        { emoji:'🚌', name:'Xe Bus',         price:15_000,    incomePerMin:60,  appBoost:false },
    firetruck:  { emoji:'🚒', name:'Cứu Hỏa',       price:20_000,    incomePerMin:80,  appBoost:false },
    smalltruck: { emoji:'🚚', name:'Xe Tải Nhỏ',    price:10_000,    incomePerMin:50,  appBoost:true },
    container:  { emoji:'🚛', name:'Container',     price:50_000,    incomePerMin:150, appBoost:true },
  };

  const RAILWAY_DATA = {
    tram:      { emoji:'🚋', name:'Tram',        gpPrice:30_000,  stationPrice:50_000,  trainPrice:20_000,  incomePerTrainPerMin:200 },
    metro:     { emoji:'🚇', name:'Metro',       gpPrice:50_000,  stationPrice:150_000, trainPrice:80_000,  incomePerTrainPerMin:500 },
    freight:   { emoji:'🚂', name:'Tàu Hàng',   gpPrice:75_000,  stationPrice:200_000, trainPrice:120_000, incomePerTrainPerMin:800 },
    oil:       { emoji:'🚃', name:'Tàu Dầu',    gpPrice:100_000, stationPrice:250_000, trainPrice:180_000, incomePerTrainPerMin:1_200 },
    highspeed: { emoji:'🚆', name:'Cao Tốc',    gpPrice:150_000, stationPrice:500_000, trainPrice:300_000, incomePerTrainPerMin:2_000 },
  };

  const APP_PRICE = 100_000;
  const TRAINS_PER_STATION = 6;
  const MAX_STATIONS = 20;
  const MAX_STATIONS_MULTI = 100;

  // Garage upgrade tiers
  const GARAGE_UPGRADES = [
    { size:50,     price:0 },
    { size:100,    price:1_000 },
    { size:250,    price:5_000 },
    { size:500,    price:20_000 },
    { size:1_000,  price:80_000 },
    { size:2_500,  price:300_000 },
    { size:5_000,  price:1_000_000 },
    { size:10_000, price:5_000_000 },
  ];

  let currentSection = 'road'; // 'road' | 'railway'
  let buyAmounts = {}; // { vehicleKey: number|'Max' }

  // ── HELPERS ───────────────────────────────
  function st() { return STATE.business.transport; }

  function garageUsed() {
    return Object.values(st().vehicles).reduce((a,b) => a+b, 0);
  }

  function garageMax() {
    return st().garageSize || 50;
  }

  function vehicleIncome(key) {
    const count = st().vehicles[key] || 0;
    if (count <= 0) return 0;
    const data = VEHICLE_DATA[key];
    const boost = data.appBoost && st().hasApp ? 2 : 1;
    return data.incomePerMin * count * boost;
  }

  function railwayIncome(key) {
    const rail = st().railways[key];
    if (!rail || rail.trains <= 0) return 0;
    return RAILWAY_DATA[key].incomePerTrainPerMin * rail.trains;
  }

  function getIncome() {
    let total = 0;
    for (const k of Object.keys(VEHICLE_DATA)) total += vehicleIncome(k);
    for (const k of Object.keys(RAILWAY_DATA)) total += railwayIncome(k);
    return total;
  }

  // ── RENDER ────────────────────────────────
  function renderHTML() {
    return `
      <div class="tp-wrap">
        <div class="tp-section-tabs">
          <button class="tp-sec-btn ${currentSection==='road'?'active':''}" data-sec="road">
            🚗 Đường Bộ
          </button>
          <button class="tp-sec-btn ${currentSection==='railway'?'active':''}" data-sec="railway">
            🚂 Đường Ray
          </button>
        </div>
        <div id="tp-content">
          ${currentSection === 'road' ? renderRoad() : renderRailway()}
        </div>
      </div>`;
  }

  // ── ROAD ──────────────────────────────────
  function renderRoad() {
    const s = st();
    const used = garageUsed();
    const max = garageMax();
    const pct = (used / max * 100).toFixed(0);
    const nextGarage = GARAGE_UPGRADES.find(g => g.size > max);
    const totalRoadIncome = Object.keys(VEHICLE_DATA).reduce((a,k) => a+vehicleIncome(k), 0);

    return `
      <div class="road-section">
        <!-- Garage bar -->
        <div class="tp-card">
          <div class="tp-card-header">
            <span class="tp-card-title">🏢 Garage — ${used}/${max} xe</span>
            <span class="tp-income-badge" style="color:var(--green)">${Format.money(totalRoadIncome)}/ph</span>
          </div>
          <div class="tp-bar-wrap">
            <div class="tp-bar">
              <div class="tp-bar-fill ${pct>80?'danger':pct>50?'warn':'ok'}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="tp-garage-row">
            ${nextGarage ? `
            <button class="tp-garage-btn" id="btn-tp-garage"
                    ${STATE.balance < nextGarage.price ? 'disabled':''}>
              ⬆️ MỞ RỘNG → ${Format.money(nextGarage.size)} xe — ${Format.money(nextGarage.price)}
            </button>` : `<div class="tp-garage-max">🏆 GARAGE TỐI ĐA (10,000)</div>`}
            <!-- App -->
            ${!s.hasApp ? `
            <button class="tp-app-btn" id="btn-tp-app"
                    ${STATE.balance < APP_PRICE ? 'disabled':''}>
              📱 MUA APP GRAB/UBER — ${Format.money(APP_PRICE)}
            </button>` : `
            <div class="tp-app-active">📱 App Grab/Uber ✅ <span style="color:var(--green)">x2 income đường bộ</span></div>`}
          </div>
        </div>

        <!-- Vehicle list -->
        ${Object.entries(VEHICLE_DATA).map(([key, data]) => {
          const count = s.vehicles[key] || 0;
          const income = vehicleIncome(key);
          const boost = data.appBoost && s.hasApp ? 2 : 1;
          const canBuy = used < max;
          const buyN = buyAmounts[key] || 1;
          const buyCount = buyN === 'Max' ? max - used : Math.min(buyN, max - used);
          const buyCost = buyCount * data.price;

          return `
          <div class="vehicle-card">
            <div class="vehicle-header">
              <span class="vehicle-emoji">${data.emoji}</span>
              <div class="vehicle-info">
                <div class="vehicle-name">${data.name}</div>
                <div class="vehicle-sub">
                  ${Format.money(data.incomePerMin)}/ph${data.appBoost ? (s.hasApp ? ' <span style="color:var(--green)">×2</span>':'<span style="color:var(--text-dim)"> (app)</span>'):''}
                  &nbsp;·&nbsp; <span style="color:var(--gold)">${Format.money(data.price)}</span>/xe
                </div>
              </div>
              <div class="vehicle-count-col">
                <div class="vehicle-count">${count}</div>
                <div class="vehicle-income" style="color:var(--green)">${Format.money(income)}/ph</div>
              </div>
            </div>
            ${canBuy || count > 0 ? `
            <div class="vehicle-buy-row">
              <div class="vehicle-amts">
                ${[1,5,10,'Max'].map(n=>`
                  <button class="v-amt-btn ${buyN==n?'active':''}" data-key="${key}" data-n="${n}">${n}</button>
                `).join('')}
              </div>
              <button class="vehicle-buy-btn" id="btn-v-${key}"
                      ${!canBuy||STATE.balance<buyCost?'disabled':''}>
                +${buyCount} — ${Format.money(buyCost)}
              </button>
            </div>` : `<div class="vehicle-garage-full">🔒 Garage đầy</div>`}
          </div>`;
        }).join('')}
      </div>`;
  }

  // ── RAILWAY ───────────────────────────────
  function renderRailway() {
    const s = st();
    const totalRailIncome = Object.keys(RAILWAY_DATA).reduce((a,k) => a+railwayIncome(k), 0);

    return `
      <div class="rail-section">
        <div class="tp-card tp-rail-header-card">
          <span class="tp-card-title">🚂 Tổng Thu Đường Ray</span>
          <span class="tp-income-badge" style="color:var(--green)">${Format.money(totalRailIncome)}/ph</span>
        </div>

        ${Object.entries(RAILWAY_DATA).map(([key, data]) => {
          const rail = s.railways[key];
          const stations = rail?.stations || 0;
          const trains = rail?.trains || 0;
          const isMulti = rail?.isMultinational || false;
          const maxSt = isMulti ? MAX_STATIONS_MULTI : MAX_STATIONS;
          const maxTrains = stations * TRAINS_PER_STATION;
          const income = railwayIncome(key);

          return `
          <div class="rail-card">
            <div class="rail-card-header">
              <span class="rail-emoji">${data.emoji}</span>
              <div class="rail-info">
                <div class="rail-name">${data.name}</div>
                <div class="rail-sub">
                  ${stations} ga · ${trains}/${maxTrains} tàu
                  ${isMulti ? '<span class="rail-multi-tag">🌐</span>' : ''}
                </div>
              </div>
              <div class="rail-income-col">
                <div style="color:var(--green);font-weight:700;font-size:0.75rem">${Format.money(income)}/ph</div>
                <div style="color:var(--text-dim);font-size:0.62rem">${Format.money(data.incomePerTrainPerMin)}/tàu</div>
              </div>
            </div>

            <!-- Buy station -->
            <div class="rail-buy-row">
              <div class="rail-buy-info">
                <span style="font-size:0.68rem;color:var(--text-dim)">Ga: ${Format.money(data.stationPrice)}</span>
                <span style="font-size:0.68rem;color:var(--text-dim)">Tàu: ${Format.money(data.trainPrice)}</span>
              </div>
              <div class="rail-buy-btns">
                <button class="rail-station-btn" data-key="${key}" id="btn-rail-st-${key}"
                        ${stations >= maxSt || STATE.balance < data.stationPrice ? 'disabled' : ''}>
                  + Ga (${stations}/${maxSt})
                </button>
                <button class="rail-train-btn" data-key="${key}" id="btn-rail-tr-${key}"
                        ${trains >= maxTrains || stations === 0 || STATE.balance < data.trainPrice ? 'disabled' : ''}>
                  + Tàu (${trains}/${maxTrains})
                </button>
              </div>
            </div>

            <!-- Mở đường ray (nếu chưa có ga nào) -->
            ${stations === 0 ? `
            <button class="rail-unlock-btn" data-key="${key}" id="btn-rail-unlock-${key}"
                    ${STATE.balance < data.gpPrice ? 'disabled' : ''}>
              🔓 MỞ TUYẾN ${data.name.toUpperCase()} — ${Format.money(data.gpPrice)}
            </button>` : ''}

            <!-- Đa quốc gia -->
            ${!isMulti && stations >= MAX_STATIONS ? `
            <button class="rail-multi-btn" data-key="${key}" id="btn-rail-multi-${key}"
                    ${STATE.balance < 500_000 ? 'disabled' : ''}>
              🌐 MỞ RỘNG ĐA QUỐC GIA — ${Format.money(500_000)}
            </button>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  // ── BIND EVENTS ───────────────────────────
  function bindEvents() {
    document.querySelectorAll('.tp-sec-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSection = btn.dataset.sec;
        document.querySelectorAll('.tp-sec-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.sec === currentSection));
        document.getElementById('tp-content').innerHTML =
          currentSection === 'road' ? renderRoad() : renderRailway();
        bindContentEvents();
      });
    });
    bindContentEvents();
  }

  function bindContentEvents() {
    if (currentSection === 'road') bindRoadEvents();
    else bindRailwayEvents();
  }

  function bindRoadEvents() {
    const s = st();

    // Garage upgrade
    document.getElementById('btn-tp-garage')?.addEventListener('click', () => {
      const max = garageMax();
      const next = GARAGE_UPGRADES.find(g => g.size > max);
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      STATE.stats.spentBusiness += next.price;
      s.garageSize = next.size;
      UI.toast(`🏢 Garage mở rộng: ${Format.money(next.size)} xe!`, 'success');
      _refresh();
    });

    // Buy app
    document.getElementById('btn-tp-app')?.addEventListener('click', () => {
      if (STATE.balance < APP_PRICE) return;
      STATE.balance -= APP_PRICE;
      STATE.stats.spentBusiness += APP_PRICE;
      s.hasApp = true;
      UI.toast('📱 App Grab/Uber đã kích hoạt! x2 income đường bộ!', 'success');
      _refresh();
    });

    // Amount buttons
    document.querySelectorAll('.v-amt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const raw = btn.dataset.n;
        buyAmounts[key] = raw === 'Max' ? 'Max' : parseInt(raw);
        document.querySelectorAll(`.v-amt-btn[data-key="${key}"]`).forEach(b =>
          b.classList.toggle('active', b.dataset.n === raw));
        _updateVehicleBtn(key);
      });
    });

    // Buy vehicle
    Object.keys(VEHICLE_DATA).forEach(key => {
      document.getElementById(`btn-v-${key}`)?.addEventListener('click', () => {
        const max = garageMax();
        const used = garageUsed();
        const n = buyAmounts[key] || 1;
        const count = n === 'Max' ? max - used : Math.min(n, max - used);
        const cost = count * VEHICLE_DATA[key].price;
        if (count <= 0 || STATE.balance < cost) { UI.toast('Không đủ tiền hoặc garage đầy!','error'); return; }
        STATE.balance -= cost;
        STATE.stats.spentBusiness += cost;
        s.vehicles[key] = (s.vehicles[key] || 0) + count;
        UI.toast(`${VEHICLE_DATA[key].emoji} Mua ${count} ${VEHICLE_DATA[key].name}!`, 'success');
        _refresh();
      });
    });
  }

  function bindRailwayEvents() {
    const s = st();

    Object.keys(RAILWAY_DATA).forEach(key => {
      const data = RAILWAY_DATA[key];
      const rail = s.railways[key];

      // Unlock
      document.getElementById(`btn-rail-unlock-${key}`)?.addEventListener('click', () => {
        if (STATE.balance < data.gpPrice) return;
        STATE.balance -= data.gpPrice;
        STATE.stats.spentBusiness += data.gpPrice;
        rail.stations = 1;
        UI.toast(`${data.emoji} Mở tuyến ${data.name}!`, 'success');
        _refresh();
      });

      // Buy station
      document.getElementById(`btn-rail-st-${key}`)?.addEventListener('click', () => {
        const maxSt = rail.isMultinational ? MAX_STATIONS_MULTI : MAX_STATIONS;
        if (rail.stations >= maxSt || STATE.balance < data.stationPrice) return;
        STATE.balance -= data.stationPrice;
        STATE.stats.spentBusiness += data.stationPrice;
        rail.stations++;
        UI.toast(`${data.emoji} Xây ga ${data.name} thứ ${rail.stations}!`, 'success');
        _refresh();
      });

      // Buy train
      document.getElementById(`btn-rail-tr-${key}`)?.addEventListener('click', () => {
        const maxTrains = rail.stations * TRAINS_PER_STATION;
        if (rail.trains >= maxTrains || STATE.balance < data.trainPrice) return;
        STATE.balance -= data.trainPrice;
        STATE.stats.spentBusiness += data.trainPrice;
        rail.trains++;
        UI.toast(`${data.emoji} Mua tàu ${data.name} thứ ${rail.trains}!`, 'success');
        _refresh();
      });

      // Multinational
      document.getElementById(`btn-rail-multi-${key}`)?.addEventListener('click', () => {
        if (STATE.balance < 500_000) return;
        STATE.balance -= 500_000;
        STATE.stats.spentBusiness += 500_000;
        rail.isMultinational = true;
        UI.toast(`🌐 ${data.name} đa quốc gia!`, 'success');
        _refresh();
      });
    });
  }

  function _updateVehicleBtn(key) {
    const max = garageMax();
    const used = garageUsed();
    const n = buyAmounts[key] || 1;
    const count = n === 'Max' ? max - used : Math.min(n, max - used);
    const cost = count * VEHICLE_DATA[key].price;
    const btn = document.getElementById(`btn-v-${key}`);
    if (btn) {
      btn.textContent = `+${count} — ${Format.money(cost)}`;
      btn.disabled = count <= 0 || STATE.balance < cost;
    }
  }

  function _refresh() {
    const content = document.getElementById('tp-content');
    if (!content) return;
    content.innerHTML = currentSection === 'road' ? renderRoad() : renderRailway();
    bindContentEvents();
    if (typeof BusinessPage !== 'undefined') BusinessPage.tick();
  }

  function tick() { /* income tính realtime, không cần tick */ }

  return { renderHTML, bindEvents, getIncome, tick };

})();