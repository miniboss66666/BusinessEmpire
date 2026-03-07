/* ============================================
   STATE.JS - Trạng thái game toàn cục
   ============================================ */

const STATE = {

  // --- Auth ---
  user: null,           // Supabase user object
  profile: null,        // { id, username, role, created_at }

  // --- Wallet ---
  balance: 0,           // Tiền sạch hiện tại
  dirtyMoney: 0,        // Tiền bẩn (underground)
  totalEarned: 0,       // Tổng tiền kiếm được all-time
  incomePerMin: 0,      // Thu nhập/phút tổng (passive + click realtime)
  passiveIncomePerMin: 0, // Thu nhập/phút chỉ passive (dùng cho tick + offline)

  // --- Click ---
  clickLevel: 1,        // Level click power (1-20)

  // --- Card skin ---
  cardSkin: 0,          // Skin đang dùng (0-9)
  unlockedSkins: [0],   // Danh sách skin đã mở khóa

  // --- Settings ---
  settings: {
    theme: 'dark',            // 'dark' | 'light'
    numberFormat: 'shorthand' // 'shorthand' | 'scientific'
  },

  // --- Business ---
  business: {
    lemonade: {
      level: 1,
      owned: 0,
      hasLicense: false,
    },
    market: {
      warehouse: { level: 1, stock: 0 },
      manager: 0,       // 0 = không có, 1-5 = level
      stores: {
        retail:       { owned: 0, level: 1, isMultinational: false },
        toy:          { owned: 0, level: 1, isMultinational: false },
        supermarket:  { owned: 0, level: 1, isMultinational: false },
        pharmacy:     { owned: 0, level: 1, isMultinational: false },
        electronics:  { owned: 0, level: 1, isMultinational: false },
      }
    },
    transport: {
      garageSize: 50,
      hasApp: false,
      vehicles: {
        shipper:    0,
        taxi:       0,
        ambulance:  0,
        bus:        0,
        firetruck:  0,
        smalltruck: 0,
        container:  0,
      },
      railways: {
        tram:      { stations: 0, trains: 0, isMultinational: false },
        metro:     { stations: 0, trains: 0, isMultinational: false },
        freight:   { stations: 0, trains: 0, isMultinational: false },
        oil:       { stations: 0, trains: 0, isMultinational: false },
        highspeed: { stations: 0, trains: 0, isMultinational: false },
      }
    }
  },

  // --- Tax ---
  tax: {
    items: [],      // [{ id, type:'business'|'realestate', name, amount, deadline, suspended }]
    serverRate: {
      business:    0.083,   // 8.3%/phút của income_per_min
      realestate:  0.012,   // 1.2%/phút của giá mua
    },
  },

  // --- Real Estate ---
  realestate: [],       // [{ id, renovationLevel, purchasePrice }]

  // --- Stock ---
  stock: {
    portfolio: {},      // { 'AAPL': { shares: 10, avgPrice: 150 } }
    crypto: {},         // { 'bytcoin': { amount: 0.5, avgPrice: 30000 } }
    gpus: [],           // [{ id, type, broken: false }]
  },

  // --- Phone ---
  phone: {
    y: {
      followers: 0,
      contentCount: 0,
    },
    tubeyou: {
      subscribers: 0,
      contentCount: 0,
    },
    team: 0,            // 0 = không có, 1-5 = cấp nhân viên
    assets: [],         // [{ id, name, price }]
  },

  // --- Underground ---
  underground: {
    suspicion: 0,       // 0-100%
    isLaundering: false,
    hackLevel: 1,
    plantLevel: 1,
    printerOn: false,
    printerLevel: 1,
  },

  // --- Knowledge ---
  knowledge: {
    unlocked: [],       // Danh sách node đã unlock
    libraryUnlocked: false,
  },

  // --- Stats ---
  stats: {
    playTime: 0,        // ms
    spentBusiness: 0,
    spentRealestate: 0,
    spentCasino: 0,
    spentAssets: 0,
  },

  // --- Timestamps ---
  lastSave: null,
  lastOnline: null,

  // --- Casino ---
  casino: {
    slotsWon: 0,
    slotsSpins: 0,
    crashBest: 1,
    crashProfit: 0,
  },

};