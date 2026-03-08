/* ============================================
   SAVE.JS - Lưu / Load game qua Supabase
   ============================================ */

const Save = (() => {

  let saveInterval = null;

  // ============================================
  // Serialize STATE → JSON để lưu
  // ============================================
  function serialize() {
    return {
      balance:       STATE.balance,
      dirtyMoney:    STATE.dirtyMoney,
      totalEarned:   STATE.totalEarned,
      clickLevel:    STATE.clickLevel,
      cardSkin:      STATE.cardSkin,
      unlockedSkins: STATE.unlockedSkins,
      settings:      STATE.settings,
      business:      STATE.business,
      realestate:    STATE.realestate,
      tax:           STATE.tax,
      stock:         STATE.stock,
      phone:         STATE.phone,
      underground:   STATE.underground,
      knowledge:     STATE.knowledge,
      stats:         STATE.stats,
      lastOnline:    new Date().toISOString(),
    };
  }

  // ============================================
  // Deserialize JSON → STATE
  // ============================================
  function deserialize(data) {
    if (!data) return;

    const fields = [
      'balance', 'dirtyMoney', 'totalEarned', 'clickLevel',
      'cardSkin', 'unlockedSkins', 'settings', 'business',
      'realestate', 'stock', 'phone', 'underground', 'tax',
      'knowledge', 'stats', 'lastOnline',
    ];

    for (const key of fields) {
      if (data[key] !== undefined) {
        // Deep merge để không mất field mới thêm vào STATE
        if (typeof STATE[key] === 'object' && !Array.isArray(STATE[key]) && STATE[key] !== null) {
          STATE[key] = deepMerge(STATE[key], data[key]);
        } else {
          STATE[key] = data[key];
        }
      }
    }

    // Đảm bảo 3 business tax items luôn tồn tại sau load
    const BIZ_TAX = [
      { id:'lemonade',  type:'business', name:'🍋 Nước Chanh' },
      { id:'market',    type:'business', name:'🏪 Market' },
      { id:'transport', type:'business', name:'🚗 Vận Tải' },
    ];
    if (STATE.tax && Array.isArray(STATE.tax.items)) {
      BIZ_TAX.forEach(biz => {
        if (!STATE.tax.items.find(i => i.id === biz.id)) {
          STATE.tax.items.unshift({
            ...biz, amount: 0,
            deadline: Date.now() + 72 * 3600_000,
            suspended: false,
          });
        }
      });
    }
  }

  // Deep merge: giữ key mặc định nếu save cũ chưa có
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        source[key] !== null &&
        typeof target[key] === 'object'
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ============================================
  // Save lên Supabase
  // ============================================
  async function saveToCloud() {
    if (!STATE.user) return;

    const saveData = serialize();

    const { error } = await DB
      .from('saves')
      .upsert({
        user_id:    STATE.user.id,
        data:       saveData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[Save] Cloud save failed:', error.message);
      return false;
    }

    STATE.lastSave = Date.now();
    console.log('[Save] Cloud saved ✓');
    return true;
  }

  // ============================================
  // Load từ Supabase
  // ============================================
  async function loadFromCloud() {
    if (!STATE.user) return false;

    const { data, error } = await DB
      .from('saves')
      .select('data')
      .eq('user_id', STATE.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Save] No save found, starting fresh');
        return false;
      }
      console.error('[Save] Load failed:', error.message);
      return false;
    }

    if (data?.data) {
      deserialize(data.data);
      console.log('[Save] Loaded from cloud ✓');
      return true;
    }

    return false;
  }

  // ============================================
  // Auto-save
  // ============================================
  function startAutoSave() {
    if (saveInterval) return;
    saveInterval = setInterval(saveToCloud, CONFIG.SAVE_INTERVAL_MS);
    console.log('[Save] Auto-save started (every', CONFIG.SAVE_INTERVAL_MS / 1000, 's)');
  }

  function stopAutoSave() {
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
  }

  // ============================================
  // Reset save (xóa toàn bộ)
  // ============================================
  async function resetSave() {
    if (!STATE.user) return false;

    const { error } = await DB
      .from('saves')
      .delete()
      .eq('user_id', STATE.user.id);

    if (error) {
      console.error('[Save] Reset failed:', error.message);
      return false;
    }

    console.log('[Save] Save reset ✓');
    return true;
  }

  // saveNow — alias public để gọi thủ công từ UI
  async function saveNow() {
    return await saveToCloud();
  }

  return {
    saveToCloud,
    loadFromCloud,
    startAutoSave,
    stopAutoSave,
    resetSave,
    serialize,
    deserialize,
    saveNow,
  };

})();