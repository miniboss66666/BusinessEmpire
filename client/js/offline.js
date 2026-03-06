/* ============================================
   OFFLINE.JS - Tính thu nhập offline
   ============================================ */

const Offline = (() => {

  // Tính tiền kiếm được khi offline
  function calcOfflineEarn() {
    if (!STATE.lastOnline) return 0;

    const now = Date.now();
    const lastOnline = new Date(STATE.lastOnline).getTime();
    const offlineMs = Math.min(now - lastOnline, CONFIG.OFFLINE_MAX_MS);

    if (offlineMs <= 0) return 0;

    const offlineMin = offlineMs / 60000;
    const earned = STATE.incomePerMin * offlineMin;

    return Math.floor(earned);
  }

  // Áp dụng offline earn + hiện popup
  function applyOfflineEarn() {
    Engine.recalcIncome(); // Tính lại income trước

    const earned = calcOfflineEarn();
    if (earned <= 0) return;

    STATE.balance += earned;
    STATE.totalEarned += earned;

    // Tính thời gian offline để hiển thị
    const now = Date.now();
    const lastOnline = new Date(STATE.lastOnline).getTime();
    const offlineMs = Math.min(now - lastOnline, CONFIG.OFFLINE_MAX_MS);

    showOfflinePopup(earned, offlineMs);
  }

  // Hiển thị popup offline earn
  function showOfflinePopup(earned, offlineMs) {
    if (earned <= 0) return;

    const timeStr = Format.time(offlineMs);
    const earnStr = Format.money(earned);

    UI.showModal(`
      <div style="text-align:center">
        <div style="font-size:2.5rem; margin-bottom:12px">💰</div>
        <div style="font-family:'Orbitron',monospace; font-size:0.8rem;
                    letter-spacing:2px; color:var(--text-dim); margin-bottom:8px">
          OFFLINE EARN
        </div>
        <div style="font-family:'Orbitron',monospace; font-size:1.8rem;
                    font-weight:700; color:var(--gold); margin-bottom:8px">
          ${earnStr}
        </div>
        <div style="color:var(--text-dim); font-size:0.85rem; margin-bottom:20px">
          Bạn đã offline <strong style="color:var(--text)">${timeStr}</strong>
        </div>
        <button class="btn-primary" onclick="UI.closeModal()">NHẬN TIỀN</button>
      </div>
    `);
  }

  return {
    calcOfflineEarn,
    applyOfflineEarn,
  };

})();