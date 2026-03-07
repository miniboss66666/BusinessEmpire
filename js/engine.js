/* ============================================
   ENGINE.JS - Income tick engine
   Chạy mỗi 1 giây, tính tổng thu nhập
   ============================================ */

const Engine = (() => {

  let tickInterval = null;

  // ============================================
  // DATA - Click power
  // ============================================
  const CLICK_LEVELS = [
    null,
    { value: 1,    price: 100 },
    { value: 2,    price: 500 },
    { value: 5,    price: 2000 },
    { value: 10,   price: 8000 },
    { value: 20,   price: 25000 },
    { value: 35,   price: 75000 },
    { value: 55,   price: 200000 },
    { value: 80,   price: 500000 },
    { value: 110,  price: 1000000 },
    { value: 150,  price: 2000000 },
    { value: 200,  price: 3500000 },
    { value: 260,  price: 5000000 },
    { value: 330,  price: 7000000 },
    { value: 410,  price: 9000000 },
    { value: 500,  price: 12000000 },
    { value: 620,  price: 16000000 },
    { value: 760,  price: 22000000 },
    { value: 920,  price: 33000000 },
    { value: 1200, price: 45000000 },
    { value: 1500, price: 60000000 },
  ];

  // ============================================
  // DATA - Card skin income buff
  // ============================================
  const SKIN_BUFF = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];

  // ============================================
  // Income calculators
  // ============================================
  function getLemonadeIncome() {
    const DATA = [
      null,
      { incomePerUnit: 1 },
      { incomePerUnit: 10 },
      { incomePerUnit: 100 },
      { incomePerUnit: 1000 },
      { incomePerUnit: 10000 },
      { incomePerUnit: 100000 },
      { incomePerUnit: 1000000 },
      { incomePerUnit: 10000000 },
    ];
    const { level, owned } = STATE.business.lemonade;
    return (DATA[level]?.incomePerUnit || 0) * owned;
  }

  function getMarketIncome() {
    const STORE_DATA = {
      retail:      { sellPerMin: 2, sellPrice: 4, cost: 2 },
      toy:         { sellPerMin: 4, sellPrice: 5, cost: 2 },
      supermarket: { sellPerMin: 7, sellPrice: 6, cost: 2 },
      pharmacy:    { sellPerMin: 2, sellPrice: 8, cost: 2 },
      electronics: { sellPerMin: 4, sellPrice: 7, cost: 2 },
    };
    let total = 0;
    const { stores } = STATE.business.market;
    for (const [key, store] of Object.entries(stores)) {
      const data = STORE_DATA[key];
      if (!data || store.owned <= 0) continue;
      const profitPerMin = (data.sellPrice - data.cost) * data.sellPerMin;
      total += profitPerMin * store.owned * store.level;
    }
    return total;
  }

  function getTransportIncome() {
    const VEHICLE_DATA = {
      shipper:    { incomePerMin: 5 },
      taxi:       { incomePerMin: 15 },
      ambulance:  { incomePerMin: 40 },
      bus:        { incomePerMin: 60 },
      firetruck:  { incomePerMin: 80 },
      smalltruck: { incomePerMin: 50 },
      container:  { incomePerMin: 150 },
    };
    const RAILWAY_DATA = {
      tram:      { incomePerTrainPerMin: 200 },
      metro:     { incomePerTrainPerMin: 500 },
      freight:   { incomePerTrainPerMin: 800 },
      oil:       { incomePerTrainPerMin: 1200 },
      highspeed: { incomePerTrainPerMin: 2000 },
    };
    let total = 0;
    const { vehicles, railways, hasApp } = STATE.business.transport;
    const appMultiplier = hasApp ? 2 : 1;
    for (const [key, count] of Object.entries(vehicles)) {
      const data = VEHICLE_DATA[key];
      if (!data || count <= 0) continue;
      total += data.incomePerMin * count * appMultiplier;
    }
    for (const [key, rail] of Object.entries(railways)) {
      const data = RAILWAY_DATA[key];
      if (!data || rail.trains <= 0) continue;
      total += data.incomePerTrainPerMin * rail.trains;
    }
    return total;
  }

  function getRealEstateIncome() { return 0; }

  function getPhoneIncome() {
    const { y, tubeyou } = STATE.phone;
    return Math.floor(y.followers / 1000) + Math.floor(tubeyou.subscribers / 1000);
  }

  // CPS tracking — circular buffer cố định 300 slots
  // 300 là đủ cho ~20 CPS × 3s window, không bao giờ grow vô hạn
  const CLICK_BUF_SIZE = 300;
  const clickTimestamps = new Float64Array(CLICK_BUF_SIZE);
  let clickBufHead = 0; // con trỏ ghi tiếp theo
  let clickBufCount = 0; // tổng số entries hợp lệ

  // ============================================
  // CPS - tính trong 3 giây gần nhất
  // ============================================
  function getCPS() {
    if (clickBufCount === 0) return 0;
    const now = Date.now();
    const cutoff = now - 3000;
    let count = 0;
    const len = Math.min(clickBufCount, CLICK_BUF_SIZE);
    for (let i = 0; i < len; i++) {
      if (clickTimestamps[i] > cutoff) count++;
    }
    return count / 3;
  }

  function getClickIncomePerMin() {
    return getCPS() * getClickValue() * 60;
  }

  // ============================================
  // Passive income (dùng cho tick + offline earn)
  // ============================================
  function calcPassiveIncomePerMin() {
    let total = 0;
    total += getLemonadeIncome();
    total += getMarketIncome();
    total += getTransportIncome();
    total += getRealEstateIncome();
    total += getPhoneIncome();
    const skinBuff = SKIN_BUFF[STATE.cardSkin] || 0;
    total *= (1 + skinBuff);
    return total;
  }

  // ============================================
  // Total income/phút = passive + click realtime
  // ============================================
  function calcTotalIncomePerMin() {
    return calcPassiveIncomePerMin() + getClickIncomePerMin();
  }

  // ============================================
  // Click
  // ============================================
  function getClickValue() {
    return CLICK_LEVELS[STATE.clickLevel]?.value || 1;
  }

  function getClickUpgradePrice() {
    const nextLvl = STATE.clickLevel + 1;
    if (nextLvl > 20) return null;
    return CLICK_LEVELS[nextLvl]?.price || null;
  }

  // rAF batch — chỉ update balance 1 lần/frame dù click bao nhiêu
  let _rafPending = false;
  function _scheduleBalanceUpdate() {
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      if (typeof UI !== 'undefined') UI.updateBalance();
    });
  }

  function handleClick() {
    const value = getClickValue();
    STATE.balance += value;
    STATE.totalEarned += value;
    // Ghi vào circular buffer — overwrite slot cũ nhất khi đầy
    clickTimestamps[clickBufHead] = Date.now();
    clickBufHead = (clickBufHead + 1) % CLICK_BUF_SIZE;
    if (clickBufCount < CLICK_BUF_SIZE) clickBufCount++;
    _scheduleBalanceUpdate();
    return value;
  }

  function upgradeClick() {
    const price = getClickUpgradePrice();
    if (price === null) return false;
    if (STATE.balance < price) return false;
    STATE.balance -= price;
    STATE.clickLevel++;
    return true;
  }

  // ============================================
  // Tick (mỗi 1 giây)
  // ============================================
  function tick() {
    // Chỉ cộng passive vào balance — click đã cộng trực tiếp khi ấn
    const passivePerSec = STATE.passiveIncomePerMin / 60;
    STATE.balance += passivePerSec;
    STATE.totalEarned += passivePerSec;
    STATE.stats.playTime += CONFIG.GAME_TICK_MS;

    // Suspicion tự giảm
    if (!STATE.underground.isLaundering && STATE.underground.suspicion > 0) {
      STATE.underground.suspicion = Math.max(
        0,
        STATE.underground.suspicion - (1 / 120)
      );
    }

    // Recalc (cập nhật CPS mới nhất vào incomePerMin)
    recalcIncome();

    if (typeof UI !== 'undefined') UI.updateHUD();
  }

  // ============================================
  // Start / Stop
  // ============================================
  function start() {
    if (tickInterval) return;
    recalcIncome();
    tickInterval = setInterval(tick, CONFIG.GAME_TICK_MS);
    console.log('[Engine] Started');
  }

  function stop() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    console.log('[Engine] Stopped');
  }

  function recalcIncome() {
    STATE.passiveIncomePerMin = calcPassiveIncomePerMin();
    STATE.incomePerMin = calcTotalIncomePerMin(); // passive + click
  }

  // ============================================
  // Public API
  // ============================================
  return {
    start,
    stop,
    recalcIncome,
    handleClick,
    upgradeClick,
    getClickValue,
    getClickUpgradePrice,
    getCPS,
    getClickIncomePerMin,
    calcTotalIncomePerMin,
    calcPassiveIncomePerMin,
    CLICK_LEVELS,
  };

})();