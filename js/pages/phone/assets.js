// @ts-nocheck
/* ============================================
   PHONE/ASSETS.JS — Mua assets buff fame
   Xe, máy bay, du thuyền, đảo, cổ vật, đấu giá
   ============================================ */

const PhoneAssets = (() => {

  const CATALOG = [
    // Xe máy
    { id:'scooter',   cat:'🏍️ Xe Máy',   emoji:'🛵', name:'Xe Tay Ga',       price:1200,          fameBuff:0.005 },
    { id:'moto',      cat:'🏍️ Xe Máy',   emoji:'🏍️', name:'Superbike',        price:15000,         fameBuff:0.01 },
    // Xe hơi
    { id:'sedan',     cat:'🚗 Xe Hơi',   emoji:'🚗', name:'Sedan Thường',     price:25000,         fameBuff:0.01 },
    { id:'sport',     cat:'🚗 Xe Hơi',   emoji:'🏎️', name:'Xe Thể Thao',      price:200000,        fameBuff:0.03 },
    { id:'super',     cat:'🚗 Xe Hơi',   emoji:'🚀', name:'Siêu Xe',          price:1500000,       fameBuff:0.08 },
    { id:'hyper',     cat:'🚗 Xe Hơi',   emoji:'⚡', name:'Hypercar',         price:8000000,       fameBuff:0.15 },
    // Máy bay
    { id:'helicopter',cat:'✈️ Máy Bay',  emoji:'🚁', name:'Trực Thăng',       price:3000000,       fameBuff:0.10 },
    { id:'jet',       cat:'✈️ Máy Bay',  emoji:'✈️', name:'Private Jet',      price:50000000,      fameBuff:0.25 },
    { id:'superjet',  cat:'✈️ Máy Bay',  emoji:'🛩️', name:'Jumbo Jet',        price:300000000,     fameBuff:0.50 },
    // Tàu/Du thuyền
    { id:'yacht',     cat:'🛥️ Du Thuyền',emoji:'🛥️', name:'Du Thuyền Nhỏ',   price:5000000,       fameBuff:0.12 },
    { id:'megayacht', cat:'🛥️ Du Thuyền',emoji:'🚢', name:'Mega Yacht',       price:100000000,     fameBuff:0.30 },
    { id:'cruiser',   cat:'🛥️ Du Thuyền',emoji:'🛳️', name:'Du Thuyền QG',    price:1000000000,    fameBuff:0.60 },
    // Đảo
    { id:'island1',   cat:'🏝️ Đảo',     emoji:'🏝️', name:'Đảo Nhỏ Caribbean',price:500000000,     fameBuff:0.40 },
    { id:'island2',   cat:'🏝️ Đảo',     emoji:'🌴', name:'Đảo Nhiệt Đới',   price:5000000000,    fameBuff:1.00 },
    // Cổ vật
    { id:'artifact1', cat:'🏺 Cổ Vật',  emoji:'🏺', name:'Bình Cổ Trung Hoa',price:800000,        fameBuff:0.05 },
    { id:'artifact2', cat:'🏺 Cổ Vật',  emoji:'🗿', name:'Tượng Ai Cập',     price:8000000,       fameBuff:0.15 },
    { id:'artifact3', cat:'🏺 Cổ Vật',  emoji:'💎', name:'Kim Cương Hoàng Gia',price:80000000,     fameBuff:0.35 },
    { id:'painting',  cat:'🏺 Cổ Vật',  emoji:'🖼️', name:'Tranh Danh Họa',   price:500000000,     fameBuff:0.60 },
    // Luxury
    { id:'mansion',   cat:'🏰 Luxury',  emoji:'🏰', name:'Biệt Thự',         price:20000000,      fameBuff:0.20 },
    { id:'penthouse', cat:'🏰 Luxury',  emoji:'🌆', name:'Penthouse NYC',    price:120000000000,  fameBuff:2.00 },
  ];

  const AUCTION_ITEMS = [
    { id:'rare_watch',  emoji:'⌚', name:'Đồng Hồ Hiếm',    basePrice:50000,     fameBuff:0.02 },
    { id:'rare_car',    emoji:'🏎️', name:'Xe Đua Cổ Điển',  basePrice:500000,    fameBuff:0.08 },
    { id:'rare_art',    emoji:'🖼️', name:'Kiệt Tác Nghệ Thuật',basePrice:5000000,fameBuff:0.20 },
    { id:'rare_gem',    emoji:'💎', name:'Viên Đá Quý Hiếm', basePrice:20000000,  fameBuff:0.35 },
    { id:'rare_island', emoji:'🏝️', name:'Đảo Bí Mật',      basePrice:100000000, fameBuff:0.80 },
  ];

  let selectedCat = null;
  let auctionState = null; // { itemId, currentBid, endsAt, myBid }

  function _state() {
    if (!STATE.phone) STATE.phone = {};
    if (!STATE.phone.assets) STATE.phone.assets = {
      owned: [],        // [itemId]
      auctionWon: [],
    };
    return STATE.phone.assets;
  }

  function getTotalFameBuff() {
    const s = _state();
    return s.owned.reduce((sum, id) => {
      const item = [...CATALOG, ...AUCTION_ITEMS].find(x => x.id === id);
      return sum + (item?.fameBuff || 0);
    }, 0);
  }

  function getYBuff() { return getTotalFameBuff() * 0.5; }
  function getTubeyouBuff() { return getTotalFameBuff() * 0.5; }

  function init() { _state(); }

  // Categories
  function getCats() {
    return [...new Set(CATALOG.map(x => x.cat))];
  }

  function renderHTML() {
    const s = _state();
    const cats = getCats();
    const totalBuff = getTotalFameBuff();
    const filteredItems = selectedCat
      ? CATALOG.filter(x => x.cat === selectedCat)
      : CATALOG;

    return `
      <div class="assets-wrap">
        <!-- Summary -->
        <div class="assets-summary">
          <div class="assets-sum-item">
            <span class="assets-sum-val">${s.owned.length}</span>
            <span class="assets-sum-lbl">Items</span>
          </div>
          <div class="assets-sum-item">
            <span class="assets-sum-val" style="color:var(--gold)">+${(totalBuff*100).toFixed(1)}%</span>
            <span class="assets-sum-lbl">Fame Buff</span>
          </div>
        </div>

        <!-- Category filter -->
        <div class="assets-cats">
          <button class="assets-cat-btn ${!selectedCat?'active':''}" data-cat="">Tất Cả</button>
          ${cats.map(cat => `
            <button class="assets-cat-btn ${selectedCat===cat?'active':''}" data-cat="${cat}">
              ${cat.split(' ')[0]} ${cat.split(' ').slice(1).join(' ')}
            </button>`).join('')}
          <button class="assets-cat-btn ${selectedCat==='auction'?'active':''}" data-cat="auction">
            🔨 Đấu Giá
          </button>
        </div>

        <!-- Items -->
        ${selectedCat === 'auction' ? renderAuction(s) : `
        <div class="assets-list">
          ${filteredItems.map(item => {
            const owned = s.owned.includes(item.id);
            const canBuy = !owned && STATE.balance >= item.price;
            return `
            <div class="assets-item ${owned?'owned':''}">
              <span class="assets-emoji">${item.emoji}</span>
              <div class="assets-info">
                <div class="assets-name">${item.name}</div>
                <div class="assets-buff">+${(item.fameBuff*100).toFixed(1)}% fame</div>
              </div>
              <div style="text-align:right">
                <div class="assets-price">${owned ? '✅ Đã có' : Format.money(item.price)}</div>
                ${!owned ? `
                <button class="assets-buy-btn" data-id="${item.id}"
                        ${!canBuy?'disabled':''}>
                  ${canBuy ? 'MUA' : 'Chưa đủ'}
                </button>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>`}
      </div>`;
  }

  function renderAuction(s) {
    const now = Date.now();
    if (!auctionState || now > auctionState.endsAt) {
      // Tạo phiên đấu giá mới
      const item = AUCTION_ITEMS[Math.floor(Math.random() * AUCTION_ITEMS.length)];
      const fee = Math.min(100000, item.basePrice * 0.01);
      auctionState = {
        itemId: item.id, currentBid: item.basePrice,
        endsAt: now + 3600000, myBid: 0, myFee: fee,
      };
    }
    const item = AUCTION_ITEMS.find(x => x.id === auctionState.itemId);
    const timeLeft = Math.max(0, auctionState.endsAt - now);
    const mins = Math.floor(timeLeft / 60000);
    const alreadyBid = auctionState.myBid > 0;
    const isLeading = alreadyBid && auctionState.myBid >= auctionState.currentBid;
    const fee = auctionState.myFee;

    return `
      <div class="auction-wrap">
        <div class="auction-item">
          <div class="auction-emoji">${item?.emoji}</div>
          <div class="auction-info">
            <div class="auction-name">${item?.name}</div>
            <div class="auction-buff">+${((item?.fameBuff||0)*100).toFixed(1)}% fame</div>
          </div>
        </div>
        <div class="auction-status">
          <div>Giá hiện tại: <strong>${Format.money(auctionState.currentBid)}</strong></div>
          <div>⏱ Còn: <strong>${mins} phút</strong></div>
          <div style="font-size:0.6rem;color:var(--text-dim)">Phí vào: ${Format.money(fee)}</div>
        </div>
        ${alreadyBid ? `
        <div class="auction-my-bid ${isLeading?'leading':'losing'}">
          ${isLeading ? '🏆 Đang dẫn đầu' : '⚠️ Bị vượt qua'} — Bid: ${Format.money(auctionState.myBid)}
        </div>` : ''}
        <div class="auction-actions">
          <input class="stk-qty-input" id="auction-bid-input" type="number"
                 min="${auctionState.currentBid * 1.01}"
                 value="${Math.ceil(auctionState.currentBid * 1.05)}"
                 placeholder="Số tiền bid">
          <button class="stk-buy-btn" id="btn-auction-bid"
                  ${STATE.balance < fee ? 'disabled' : ''}>
            🔨 BID ${alreadyBid ? '(tăng)' : `+ Phí ${Format.money(fee)}`}
          </button>
        </div>
        <div style="font-size:0.62rem;color:var(--text-dim);margin-top:6px;text-align:center">
          Bot tăng giá mỗi 5 phút · Thua → hoàn 100% tiền bid
        </div>
      </div>`;
  }

  function bindEvents() {
    // Category filter
    document.querySelectorAll('.assets-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCat = btn.dataset.cat || null;
        _refresh();
      });
    });

    // Buy items
    document.querySelectorAll('.assets-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = CATALOG.find(x => x.id === id);
        if (!item || STATE.balance < item.price) return;
        STATE.balance -= item.price;
        _state().owned.push(id);
        UI.toast(`${item.emoji} Mua ${item.name}! +${(item.fameBuff*100).toFixed(1)}% fame`, 'success');
        _refresh();
      });
    });

    // Auction bid
    document.getElementById('btn-auction-bid')?.addEventListener('click', () => {
      if (!auctionState) return;
      const bidInput = document.getElementById('auction-bid-input');
      const bidAmt = parseFloat(bidInput?.value) || 0;
      const fee = auctionState.myFee;
      const minBid = auctionState.currentBid * 1.01;
      if (bidAmt < minBid) { UI.toast('Bid phải cao hơn giá hiện tại!', 'error'); return; }
      const cost = auctionState.myBid > 0 ? (bidAmt - auctionState.myBid) : bidAmt + fee;
      if (STATE.balance < cost) { UI.toast('Không đủ tiền!', 'error'); return; }
      STATE.balance -= cost;
      auctionState.myBid = bidAmt;
      auctionState.currentBid = bidAmt;
      UI.toast(`🔨 Bid ${Format.money(bidAmt)}!`, 'success');
      _refresh();
    });

    // Bot bidding simulation
    if (auctionState && auctionState.myBid > 0 && auctionState.myBid >= auctionState.currentBid) {
      setTimeout(() => {
        if (!auctionState) return;
        const inc = auctionState.currentBid * (0.001 + Math.random() * 0.15);
        auctionState.currentBid += inc;
        _refresh();
      }, 5000 + Math.random() * 295000); // 5s→5min
    }
  }

  function _refresh() {
    const el = document.getElementById('phone-app-content');
    if (el) { el.innerHTML = renderHTML(); bindEvents(); }
  }

  return { init, renderHTML, bindEvents, getTotalFameBuff, getYBuff, getTubeyouBuff };
})();