// @ts-nocheck
/* ============================================
   PROFILE.JS — Profile + Leaderboard
   + Upload ảnh thật (Supabase Storage)
   + Đổi tên username
   ============================================ */

const ProfilePage = (() => {

  let _tab = 'profile';
  let _leaderboardData = [];
  let _loading = false;
  let _viewingUser = null;
  let _saving = false;

  const AVATAR_BUCKET = 'avatars'; // Supabase Storage bucket name

  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════
  function init() {
    _tab = 'profile';
    _viewingUser = null;
    // Track playtime
    STATE.stats = STATE.stats || {};
    STATE.stats.playTime = (STATE.stats.playTime || 0) + (Date.now() - (STATE._sessionStart || Date.now()));
    STATE._sessionStart = Date.now();
    render();
  }

  // ═══════════════════════════════════════════
  // RENDER CHÍNH
  // ═══════════════════════════════════════════
  function render() {
    const page = document.getElementById('page-profile');
    if (!page) return;
    page.innerHTML = `
      <div class="profile-wrap">
        <div class="profile-tabs">
          <button class="profile-tab ${_tab==='profile'?'active':''}" data-tab="profile">👤 Hồ Sơ</button>
          <button class="profile-tab ${_tab==='leaderboard'?'active':''}" data-tab="leaderboard">🏆 BXH</button>
        </div>
        <div id="profile-tab-content">
          ${_tab === 'profile' ? renderProfileTab() : renderLeaderboardTab()}
        </div>
      </div>
    `;
    bindEvents();
    if (_tab === 'leaderboard') loadLeaderboard(); // Luôn reload khi ấn tab
  }

  // ═══════════════════════════════════════════
  // TAB: PROFILE
  // ═══════════════════════════════════════════
  function renderProfileTab(user) {
    const isOwn   = !user;
    const username = isOwn ? (STATE.profile?.username || 'Ẩn danh') : user.username;
    const stats    = isOwn ? (STATE.stats || {}) : (user.stats || {});
    const joined   = isOwn ? STATE.profile?.created_at : user.created_at;

    const totalEarned = isOwn ? (STATE.totalEarned || 0) : (user.totalEarned || 0);
    const playTimeMs  = stats.playTime || 0;
    const spentBiz    = stats.spentBusiness   || 0;
    const spentRE     = stats.spentRealestate || 0;
    const spentCasino = stats.spentCasino     || 0;
    const spentAssets = stats.spentAssets     || 0;
    const totalSpent  = spentBiz + spentRE + spentCasino + spentAssets;

    const joinedStr = joined
      ? new Date(joined).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'})
      : '—';
    const ptHours   = Math.floor(playTimeMs / 3600000);
    const ptMinutes = Math.floor((playTimeMs % 3600000) / 60000);
    const ptStr     = ptHours > 0 ? `${ptHours}h ${ptMinutes}m` : `${ptMinutes}m`;

    const avatarUrl  = isOwn ? (STATE.profile?.avatar_url || '') : (user.avatar_url || '');
    const avatarLetter = (username[0] || '?').toUpperCase();
    const avatarColor  = stringToColor(username);

    const spendItems = [
      { label:'💼 Business', value:spentBiz,    color:'#f5c518' },
      { label:'🏢 BĐS',      value:spentRE,     color:'#00d4ff' },
      { label:'🎰 Casino',   value:spentCasino, color:'#ff4455' },
      { label:'🛍️ Assets',   value:spentAssets, color:'#a855f7' },
    ].filter(i => i.value > 0);

    return `
      <div class="profile-card">

        <!-- ── HEADER: Avatar + Tên ── -->
        <div class="profile-header">
          ${!isOwn ? `<button class="profile-back-btn" id="profile-back">← Quay lại</button>` : ''}

          <!-- Avatar -->
          <div class="profile-avatar-wrap">
            <div class="profile-avatar ${avatarUrl?'has-img':''}"
                 style="${avatarUrl?'':`background:${avatarColor}`}"
                 id="profile-avatar-display">
              ${avatarUrl
                ? `<img src="${escHtml(avatarUrl)}" alt="avatar">`
                : `<span>${avatarLetter}</span>`}
            </div>
            ${isOwn ? `
              <label class="profile-avatar-edit" id="profile-avatar-btn" title="Đổi ảnh">
                📷
                <input type="file" id="profile-avatar-input" accept="image/*" style="display:none">
              </label>` : ''}
          </div>

          <!-- Tên + edit -->
          <div class="profile-info">
            <div class="profile-name-row">
              <span class="profile-username" id="profile-username-display">${escHtml(username)}</span>
              ${isOwn ? `<button class="profile-edit-name-btn" id="btn-edit-name" title="Đổi tên">✏️</button>` : ''}
            </div>
            <!-- Form đổi tên (ẩn mặc định) -->
            ${isOwn ? `
              <div class="profile-name-form" id="profile-name-form" style="display:none">
                <input class="profile-name-input" id="profile-name-input"
                  type="text" maxlength="20"
                  placeholder="Tên mới (3-20 ký tự)"
                  value="${escHtml(username)}">
                <div class="profile-name-actions">
                  <button class="profile-name-save" id="btn-save-name">✓ Lưu</button>
                  <button class="profile-name-cancel" id="btn-cancel-name">✕</button>
                </div>
                <div class="profile-name-error" id="name-error"></div>
              </div>` : ''}
            <div class="profile-joined">Tham gia: ${joinedStr}</div>
            ${isOwn && STATE.profile?.role==='admin'
              ? `<div class="profile-badge admin">👑 ADMIN</div>` : ''}
          </div>
        </div>

        <!-- Upload progress (ẩn) -->
        ${isOwn ? `
          <div class="profile-upload-bar" id="profile-upload-bar" style="display:none">
            <div class="profile-upload-progress" id="profile-upload-progress"></div>
            <span id="profile-upload-label">Đang tải ảnh...</span>
          </div>` : ''}

        <!-- ── STATS ── -->
        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <div class="profile-stat-label">💰 Tổng Kiếm Được</div>
            <div class="profile-stat-value gold">${Format.money(totalEarned)}</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-label">⏱️ Thời Gian Chơi</div>
            <div class="profile-stat-value">${ptStr}</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-label">💸 Tổng Chi Tiêu</div>
            <div class="profile-stat-value">${Format.money(totalSpent)}</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-label">💵 Số Dư Hiện Tại</div>
            <div class="profile-stat-value green">${isOwn ? Format.money(STATE.balance) : '—'}</div>
          </div>
        </div>

        <!-- ── SPENDING ── -->
        ${totalSpent > 0 ? `
        <div class="profile-section">
          <div class="profile-section-title">📊 Chi Tiêu Theo Lĩnh Vực</div>
          <div class="profile-spend-list">
            ${spendItems.map(item => {
              const pct = (item.value / totalSpent * 100).toFixed(1);
              return `
                <div class="profile-spend-item">
                  <div class="profile-spend-header">
                    <span class="profile-spend-label">${item.label}</span>
                    <span class="profile-spend-amount" style="color:${item.color}">${Format.money(item.value)}</span>
                  </div>
                  <div class="profile-spend-bar-bg">
                    <div class="profile-spend-bar" style="width:${pct}%;background:${item.color}"></div>
                  </div>
                  <div class="profile-spend-pct">${pct}%</div>
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- ── CASINO STATS ── -->
        ${isOwn ? renderCasinoStats() : ''}

        <!-- ── THUẾ ── -->
        ${isOwn ? renderTaxButton() : ''}
      </div>
    `;
  }

  function renderTaxButton() {
    const tax = STATE.tax || { items: [] };
    const totalOwed = (tax.items || []).reduce((s, i) => s + (i.amount || 0), 0);
    const suspended = (tax.items || []).filter(i => i.suspended).length;
    return `
      <div class="profile-section">
        <div class="profile-section-title">💸 Thuế</div>
        <div class="tax-summary-row">
          <div class="tax-summary-item">
            <span class="tax-sum-lbl">Nợ thuế</span>
            <span class="tax-sum-val" style="color:${totalOwed > 0 ? 'var(--red)' : 'var(--green)'}">${Format.money(totalOwed)}</span>
          </div>
          <div class="tax-summary-item">
            <span class="tax-sum-lbl">Đình chỉ</span>
            <span class="tax-sum-val" style="color:${suspended > 0 ? 'var(--red)' : 'var(--text-dim)'}">${suspended} business</span>
          </div>
        </div>
        <button class="tax-manage-btn" id="btn-open-tax">💸 QUẢN LÝ THUẾ</button>
      </div>
    `;
  }

  function openTaxModal() {
    const tax = STATE.tax || { items: [] };
    const items = tax.items || [];
    const totalOwed = items.reduce((s, i) => s + (i.amount || 0), 0);
    const rate = tax.serverRate || { business: 0.083, realestate: 0.012 };

    UI.showModal(`
      <div class="tax-modal">
        <div class="tax-modal-title">💸 QUẢN LÝ THUẾ</div>
        <div class="tax-modal-sub">
          Rate: Business ${(rate.business*100).toFixed(1)}%/phút · BĐS ${(rate.realestate*100).toFixed(1)}%/phút
        </div>

        ${items.length === 0 ? `
          <div class="tax-empty">✅ Không có khoản thuế nào đang nợ</div>
        ` : `
          <div class="tax-item-list" id="tax-item-list">
            ${items.map((item, idx) => `
              <div class="tax-item ${item.suspended ? 'suspended' : ''}">
                <div class="tax-item-left">
                  <div class="tax-item-name">
                    ${item.type === 'business' ? '💼' : '🏢'} ${item.name}
                    ${item.suspended ? '<span class="tax-suspended-tag">⛔ ĐÌNH CHỈ</span>' : ''}
                  </div>
                  <div class="tax-item-meta">
                    ${item.deadline ? _timeUntilDeadline(item.deadline) : ''}
                  </div>
                </div>
                <div class="tax-item-right">
                  <div class="tax-item-amount">${Format.money(item.amount)}</div>
                  <button class="tax-pay-one-btn" data-idx="${idx}"
                          ${STATE.balance < item.amount ? 'disabled' : ''}>
                    Nộp
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Sticky bottom -->
        <div class="tax-modal-footer">
          <div class="tax-footer-total">
            <span>Tổng nợ:</span>
            <span style="color:var(--red);font-weight:700">${Format.money(totalOwed)}</span>
          </div>
          ${totalOwed > 0 ? `
          <button class="tax-pay-all-btn" id="btn-tax-pay-all"
                  ${STATE.balance < totalOwed ? 'disabled' : ''}>
            💸 NỘP TẤT CẢ — ${Format.money(totalOwed)}
          </button>
          ${STATE.balance < totalOwed ? `
          <div class="tax-cant-afford">Không đủ tiền — cần thêm ${Format.money(totalOwed - STATE.balance)}</div>
          ` : ''}` : ''}
        </div>
      </div>
    `);

    // Bind nộp từng cái
    document.querySelectorAll('.tax-pay-one-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const item = items[idx];
        if (!item || STATE.balance < item.amount) return;
        STATE.balance -= item.amount;
        item.amount = 0;
        item.suspended = false;
        item.deadline = Date.now() + 72 * 3600 * 1000; // reset 72h
        UI.toast(`✅ Đã nộp thuế: ${item.name}`, 'success');
        UI.closeModal();
        openTaxModal(); // re-open để cập nhật
      });
    });

    // Nộp tất cả
    document.getElementById('btn-tax-pay-all')?.addEventListener('click', () => {
      if (STATE.balance < totalOwed) return;
      STATE.balance -= totalOwed;
      items.forEach(item => {
        item.amount = 0;
        item.suspended = false;
        item.deadline = Date.now() + 72 * 3600 * 1000;
      });
      UI.toast('✅ Đã nộp toàn bộ thuế!', 'success');
      UI.closeModal();
      // Re-render profile section thuế
      document.getElementById('btn-open-tax')?.closest('.profile-section')?.remove();
    });
  }

  function _timeUntilDeadline(deadline) {
    const ms = deadline - Date.now();
    if (ms <= 0) return '<span style="color:var(--red)">⛔ Đã quá hạn</span>';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const color = h < 12 ? 'var(--red)' : h < 24 ? 'var(--gold)' : 'var(--text-dim)';
    return `<span style="color:${color}">⏱ Còn ${h}h ${m}m</span>`;
  }

  function renderCasinoStats() {
    const c = STATE.casino || {};
    if (!(c.slotsSpins > 0)) return '';
    return `
      <div class="profile-section">
        <div class="profile-section-title">🎰 Casino Stats</div>
        <div class="profile-casino-stats">
          <div class="profile-casino-item">
            <span>🎰 Slots spins</span><span>${Format.compact(c.slotsSpins||0)}</span>
          </div>
          <div class="profile-casino-item">
            <span>🏆 Slots wins</span><span class="green">${Format.compact(c.slotsWon||0)}</span>
          </div>
          ${c.crashBest ? `
          <div class="profile-casino-item">
            <span>🚀 Crash best</span><span class="gold">×${c.crashBest}</span>
          </div>` : ''}
        </div>
      </div>`;
  }

  // ═══════════════════════════════════════════
  // TAB: LEADERBOARD
  // ═══════════════════════════════════════════
  function renderLeaderboardTab() {
    return `
      <div class="leaderboard-wrap">
        <div class="leaderboard-topbar">
          <span class="lb-title">🏆 XẾP HẠNG</span>
          <button class="lb-refresh-btn" id="btn-lb-refresh">🔄</button>
        </div>
        <div class="leaderboard-header">
          <div class="lb-col rank">Hạng</div>
          <div class="lb-col name">Người Chơi</div>
          <div class="lb-col earned">Tổng Kiếm</div>
        </div>
        <div id="lb-list">
          <div class="lb-loading"><div class="lb-spinner"></div><span>Đang tải...</span></div>
        </div>
      </div>`;
  }

  function renderLeaderboardRows() {
    if (!_leaderboardData.length) return `<div class="lb-empty">Chưa có dữ liệu</div>`;
    const myId = STATE.profile?.id;
    return _leaderboardData.map((entry, i) => {
      const rank = i + 1;
      const isMe = entry.user_id === myId;
      const rankIcon = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':`#${rank}`;
      const avatarUrl = entry.avatar_url || '';
      const avatarLetter = (entry.username?.[0]||'?').toUpperCase();
      const avatarColor  = stringToColor(entry.username||'?');
      return `
        <div class="lb-row ${isMe?'is-me':''}" data-uid="${entry.user_id}">
          <div class="lb-col rank"><span class="lb-rank ${rank<=3?'top3':''}">${rankIcon}</span></div>
          <div class="lb-col name">
            <div class="lb-avatar ${avatarUrl?'has-img':''}"
                 style="${avatarUrl?'':`background:${avatarColor}`}">
              ${avatarUrl ? `<img src="${escHtml(avatarUrl)}" alt="">` : avatarLetter}
            </div>
            <span class="lb-name">${escHtml(entry.username||'Ẩn danh')}</span>
            ${isMe?`<span class="lb-me-tag">Bạn</span>`:''}
          </div>
          <div class="lb-col earned"><span class="lb-earned">${Format.money(entry.total_earned||0)}</span></div>
        </div>`;
    }).join('');
  }

  // ═══════════════════════════════════════════
  // LOAD LEADERBOARD
  // ═══════════════════════════════════════════
  async function loadLeaderboard() {
    _loading = true;
    // Show loading spinner ngay
    const el = document.getElementById('lb-list');
    if (el) el.innerHTML = '<div class="lb-loading"><div class="lb-spinner"></div><span>Đang tải...</span></div>';

    try {
      // Bước 1: Save data người dùng hiện tại trước để có data mới nhất
      if (STATE.user?.id) await Save.saveToCloud();

      // Bước 2: Query saves + profiles riêng (tránh 406 foreign key join)
      const [savesRes, profilesRes] = await Promise.all([
        DB.from('saves').select('user_id, data').limit(200),
        DB.from('profiles').select('id, username, avatar_url'),
      ]);

      if (savesRes.error) throw savesRes.error;

      // Map profiles by id
      const profileMap = {};
      (profilesRes.data || []).forEach(p => { profileMap[p.id] = p; });

      // Bước 3: Parse totalEarned từ jsonb data field
      _leaderboardData = (savesRes.data || [])
        .map(row => {
          let earned = 0;
          try {
            const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            earned = Number(d?.totalEarned) || 0;
          } catch(e) {}
          const prof = profileMap[row.user_id] || {};
          return {
            user_id:      row.user_id,
            username:     prof.username || 'Ẩn danh',
            avatar_url:   prof.avatar_url || '',
            total_earned: earned,
          };
        })
        .filter(r => r.total_earned > 0)
        .sort((a, b) => b.total_earned - a.total_earned)
        .slice(0, 100);

      // Bước 4: Nếu mình không có trong list (totalEarned = 0) thì thêm vào cuối
      if (STATE.user?.id) {
        const inList = _leaderboardData.find(r => r.user_id === STATE.user.id);
        if (!inList && STATE.totalEarned > 0) {
          _leaderboardData.push({
            user_id:      STATE.user.id,
            username:     STATE.profile?.username || 'Ẩn danh',
            avatar_url:   STATE.profile?.avatar_url || '',
            total_earned: STATE.totalEarned || 0,
          });
          _leaderboardData.sort((a,b) => b.total_earned - a.total_earned);
        }
      }

    } catch (err) {
      console.warn('Leaderboard error:', err);
      _leaderboardData = [];
    }
    _loading = false;
    if (el) { el.innerHTML = renderLeaderboardRows(); bindLeaderboardEvents(); }
  }

  // ═══════════════════════════════════════════
  // LOAD USER PROFILE (xem người khác)
  // ═══════════════════════════════════════════
  async function loadUserProfile(userId) {
    const content = document.getElementById('profile-tab-content');
    if (content) content.innerHTML = `<div class="lb-loading"><div class="lb-spinner"></div><span>Đang tải...</span></div>`;
    try {
      const [saveRes, profileRes] = await Promise.all([
        DB.from('saves').select('data').eq('user_id', userId).single(),
        DB.from('profiles').select('username, created_at, avatar_url').eq('id', userId).single(),
      ]);
      if (saveRes.error || profileRes.error) throw new Error();
      const d = saveRes.data?.data || {};
      _viewingUser = {
        user_id:    userId,
        username:   profileRes.data.username,
        created_at: profileRes.data.created_at,
        avatar_url: profileRes.data.avatar_url || '',
        totalEarned: d.totalEarned || 0,
        stats:       d.stats || {},
      };
      if (content) { content.innerHTML = renderProfileTab(_viewingUser); bindBackBtn(); }
    } catch {
      if (content) content.innerHTML = `
        <div class="lb-empty">
          <button class="profile-back-btn" id="profile-back">← Quay lại</button>
          <p style="color:var(--text-dim);margin-top:16px">Không thể tải hồ sơ</p>
        </div>`;
      bindBackBtn();
    }
  }

  // ═══════════════════════════════════════════
  // ĐỔI TÊN
  // ═══════════════════════════════════════════
  function bindEditName() {
    const btnEdit   = document.getElementById('btn-edit-name');
    const btnSave   = document.getElementById('btn-save-name');
    const btnCancel = document.getElementById('btn-cancel-name');
    const form      = document.getElementById('profile-name-form');
    const input     = document.getElementById('profile-name-input');
    const errEl     = document.getElementById('name-error');
    const display   = document.getElementById('profile-username-display');

    btnEdit?.addEventListener('click', () => {
      form.style.display = 'flex';
      btnEdit.style.display = 'none';
      display.style.display = 'none';
      input.focus(); input.select();
    });

    btnCancel?.addEventListener('click', () => {
      form.style.display = 'none';
      btnEdit.style.display = '';
      display.style.display = '';
      errEl.textContent = '';
    });

    btnSave?.addEventListener('click', () => saveName(input.value.trim()));

    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveName(input.value.trim());
      if (e.key === 'Escape') btnCancel.click();
    });
  }

  async function saveName(newName) {
    const errEl   = document.getElementById('name-error');
    const btnSave = document.getElementById('btn-save-name');

    // Validate
    if (newName.length < 3 || newName.length > 20) {
      errEl.textContent = 'Tên phải từ 3-20 ký tự'; return;
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(newName)) {
      errEl.textContent = 'Chỉ dùng chữ, số, _ - và khoảng trắng'; return;
    }
    if (newName === STATE.profile?.username) {
      document.getElementById('btn-cancel-name')?.click(); return;
    }

    btnSave.disabled = true;
    btnSave.textContent = '...';
    errEl.textContent = '';

    try {
      // Kiểm tra tên đã tồn tại chưa
      const { data: existing } = await DB
        .from('profiles')
        .select('id')
        .eq('username', newName)
        .neq('id', STATE.profile.id)
        .maybeSingle();

      if (existing) { errEl.textContent = 'Tên này đã được dùng rồi!'; return; }

      const { error } = await DB
        .from('profiles')
        .update({ username: newName })
        .eq('id', STATE.profile.id);

      if (error) throw error;

      STATE.profile.username = newName;
      UI.toast('Đổi tên thành công! ✓', 'success');

      // Cập nhật UI
      const display = document.getElementById('profile-username-display');
      if (display) display.textContent = newName;
      document.getElementById('btn-cancel-name')?.click();

    } catch (err) {
      console.error(err);
      errEl.textContent = 'Lỗi khi lưu, thử lại sau';
    } finally {
      if (btnSave) { btnSave.disabled = false; btnSave.textContent = '✓ Lưu'; }
    }
  }

  // ═══════════════════════════════════════════
  // UPLOAD ẢNH AVATAR
  // ═══════════════════════════════════════════
  function bindAvatarUpload() {
    const input = document.getElementById('profile-avatar-input');
    if (!input) return;

    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate
      if (!file.type.startsWith('image/')) {
        UI.toast('Chỉ chọn file ảnh!', 'warn'); return;
      }
      if (file.size > 2 * 1024 * 1024) {
        UI.toast('Ảnh tối đa 2MB!', 'warn'); return;
      }

      // Resize ảnh về 200x200 trước khi upload
      const resized = await resizeImage(file, 200, 200);
      await uploadAvatar(resized);
    });
  }

  async function uploadAvatar(blob) {
    const bar      = document.getElementById('profile-upload-bar');
    const progress = document.getElementById('profile-upload-progress');
    const label    = document.getElementById('profile-upload-label');
    const avatarEl = document.getElementById('profile-avatar-display');

    if (bar) bar.style.display = 'flex';
    if (label) label.textContent = 'Đang tải ảnh...';
    if (progress) progress.style.width = '30%';

    try {
      const userId   = STATE.profile.id;
      const filePath = `${userId}/avatar.jpg`;

      // Upload lên Supabase Storage
      const { error: uploadErr } = await DB.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;
      if (progress) progress.style.width = '70%';

      // Lấy public URL
      const { data: urlData } = DB.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl + '?t=' + Date.now(); // cache bust
      if (progress) progress.style.width = '85%';

      // Lưu vào profiles
      const { error: updateErr } = await DB
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      STATE.profile.avatar_url = publicUrl;
      if (progress) progress.style.width = '100%';

      // Cập nhật avatar trên UI
      if (avatarEl) {
        avatarEl.classList.add('has-img');
        avatarEl.style.background = '';
        avatarEl.innerHTML = `<img src="${publicUrl}" alt="avatar">`;
      }

      UI.toast('Cập nhật ảnh thành công! ✓', 'success');

    } catch (err) {
      console.error('Avatar upload error:', err);
      UI.toast('Lỗi upload ảnh, thử lại!', 'error');
    } finally {
      setTimeout(() => { if (bar) bar.style.display = 'none'; }, 800);
    }
  }

  // Resize ảnh về kích thước cố định bằng canvas
  function resizeImage(file, maxW, maxH) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        // Crop vuông từ giữa
        const size = Math.min(img.width, img.height);
        const sx   = (img.width  - size) / 2;
        const sy   = (img.height - size) / 2;
        canvas.width  = maxW;
        canvas.height = maxH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxW, maxH);
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  }

  // ═══════════════════════════════════════════
  // BIND EVENTS
  // ═══════════════════════════════════════════
  function bindEvents() {
    document.querySelectorAll('.profile-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _tab = btn.dataset.tab;
        _viewingUser = null;
        render();
      });
    });
    bindEditName();
    bindAvatarUpload();
    bindLeaderboardEvents();
    bindBackBtn();
    // Tax button
    document.getElementById('btn-open-tax')?.addEventListener('click', openTaxModal);
  }

  function bindLeaderboardEvents() {
    document.getElementById('btn-lb-refresh')?.addEventListener('click', () => {
      _leaderboardData = [];
      loadLeaderboard();
    });
    document.querySelectorAll('.lb-row').forEach(row => {
      row.addEventListener('click', () => {
        const uid = row.dataset.uid;
        if (uid === STATE.profile?.id) { _tab='profile'; render(); }
        else loadUserProfile(uid);
      });
    });
  }

  function bindBackBtn() {
    document.getElementById('profile-back')?.addEventListener('click', () => {
      _viewingUser = null; _tab = 'leaderboard'; render();
    });
  }

  // ═══════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 55%, 38%)`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init };
})();