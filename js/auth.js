/* ============================================
   AUTH.JS - Xử lý auth (login, register, OAuth)
   ============================================ */

const Auth = (() => {

  let turnstileToken = null;
  let turnstileWidgetId = null;

  // ============================================
  // Khởi tạo Turnstile
  // ============================================
  function initTurnstile() {
    if (typeof turnstile === 'undefined') return;

    turnstileWidgetId = turnstile.render('#turnstile-container', {
      sitekey: CONFIG.TURNSTILE_SITE_KEY,
      theme: STATE.settings.theme,
      callback: (token) => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = null; },
      'error-callback': () => { turnstileToken = null; },
    });
  }

  function resetTurnstile() {
    if (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
    }
    turnstileToken = null;
  }

  // ============================================
  // Mobile tabs
  // ============================================
  function initTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (target === 'login') {
          document.getElementById('panel-login').classList.remove('tab-hidden');
          document.getElementById('panel-register').classList.add('tab-hidden');
        } else {
          document.getElementById('panel-login').classList.add('tab-hidden');
          document.getElementById('panel-register').classList.remove('tab-hidden');
        }
      });
    });
  }

  // ============================================
  // Hiển thị lỗi
  // ============================================
  function showError(panelId, msg) {
    const panel = document.getElementById(panelId);
    let errEl = panel.querySelector('.auth-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'auth-error';
      panel.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  function clearError(panelId) {
    const panel = document.getElementById(panelId);
    const errEl = panel?.querySelector('.auth-error');
    if (errEl) errEl.style.display = 'none';
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'ĐANG XỬ LÝ...' : btn.dataset.label;
  }

  // ============================================
  // Đăng nhập
  // ============================================
  async function login() {
    clearError('panel-login');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return showError('panel-login', 'Vui lòng nhập email và mật khẩu');

    setLoading('btn-login', true);

    const { data, error } = await DB.auth.signInWithPassword({ email, password });

    setLoading('btn-login', false);

    if (error) return showError('panel-login', translateError(error.message));

    await onLoginSuccess(data.user);
  }

  // ============================================
  // Đăng ký
  // ============================================
  async function register() {
    clearError('panel-register');
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!email || !password || !confirm)
      return showError('panel-register', 'Vui lòng điền đầy đủ thông tin');

    if (password !== confirm)
      return showError('panel-register', 'Mật khẩu xác nhận không khớp');

    if (password.length < 6)
      return showError('panel-register', 'Mật khẩu tối thiểu 6 ký tự');

    if (!turnstileToken)
      return showError('panel-register', 'Vui lòng xác nhận CAPTCHA');

    setLoading('btn-register', true);

    const { data, error } = await DB.auth.signUp({
      email,
      password,
      options: { data: { turnstile_token: turnstileToken } }
    });

    setLoading('btn-register', false);
    resetTurnstile();

    if (error) return showError('panel-register', translateError(error.message));

    // Supabase yêu cầu confirm email
    if (data.user && !data.session) {
      UI.showModal(`
        <div style="text-align:center">
          <div style="font-size:2.5rem;margin-bottom:12px">📧</div>
          <div style="font-family:'Orbitron',monospace;font-size:0.85rem;
                      letter-spacing:2px;color:var(--gold);margin-bottom:12px">
            XÁC NHẬN EMAIL
          </div>
          <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:20px">
            Chúng tôi đã gửi email xác nhận đến<br>
            <strong style="color:var(--text)">${email}</strong>
          </p>
          <button class="btn-primary" onclick="UI.closeModal()">OK</button>
        </div>
      `);
      return;
    }

    if (data.session) await onLoginSuccess(data.user);
  }

  // ============================================
  // OAuth (Google / Discord)
  // ============================================
  async function loginWithOAuth(provider) {
    const { error } = await DB.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      }
    });
    if (error) console.error('[Auth] OAuth error:', error.message);
  }

  // ============================================
  // Quên mật khẩu
  // ============================================
  async function forgotPassword() {
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
      UI.showModal(`
        <div style="text-align:center">
          <div style="font-size:2rem;margin-bottom:12px">🔑</div>
          <p style="color:var(--text-dim);margin-bottom:16px">
            Nhập email của bạn vào ô đăng nhập trước
          </p>
          <button class="btn-primary" onclick="UI.closeModal()">OK</button>
        </div>
      `);
      return;
    }

    const { error } = await DB.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname + '?reset=true',
    });

    UI.showModal(`
      <div style="text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">📧</div>
        <p style="color:var(--text-dim);margin-bottom:16px">
          ${error ? 'Có lỗi xảy ra, thử lại sau.' : 'Email đặt lại mật khẩu đã được gửi!'}
        </p>
        <button class="btn-primary" onclick="UI.closeModal()">OK</button>
      </div>
    `);
  }

  // ============================================
  // Đăng xuất
  // ============================================
  async function logout() {
    Engine.stop();
    Save.stopAutoSave();
    await Save.saveToCloud();
    await DB.auth.signOut();
    STATE.user = null;
    STATE.profile = null;
    showAuthScreen();
  }

  // ============================================
  // On login success
  // ============================================
  async function onLoginSuccess(user) {
    STATE.user = user;

    // Load save
    await Save.loadFromCloud();

    // Tính offline earn
    Offline.applyOfflineEarn();

    // Lấy profile
    await loadProfile();

    // Ẩn auth, hiện game
    showGameScreen();

    // Start engine + auto-save
    Engine.start();
    Save.startAutoSave();
  }

  // ============================================
  // Load profile từ Supabase
  // ============================================
  async function loadProfile() {
    const { data } = await DB
      .from('profiles')
      .select('*')
      .eq('id', STATE.user.id)
      .single();

    STATE.profile = data;
  }

  // ============================================
  // Show/Hide screens
  // ============================================
  function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
  }

  function showGameScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Đợi 1 frame để browser tính toán layout xong rồi mới init
    // (tránh height=0 khi render lần đầu)
    requestAnimationFrame(() => {
      if (typeof Nav !== 'undefined') Nav.init();
      // KHÔNG gọi HomePage.init() ở đây — Nav.init() đã gọi HomePage.render() rồi
    });
  }

  // ============================================
  // Check session khi load trang
  // ============================================
  async function checkSession() {
    const { data: { session } } = await DB.auth.getSession();

    if (session) {
      await onLoginSuccess(session.user);
    } else {
      showAuthScreen();
      initTurnstile();
      initTabs();
      bindEvents();
    }

    // Lắng nghe thay đổi auth
    DB.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !STATE.user) {
        await onLoginSuccess(session.user);
      }
      if (event === 'SIGNED_OUT') {
        showAuthScreen();
      }
    });
  }

  // ============================================
  // Bind events
  // ============================================
  function bindEvents() {
    document.getElementById('btn-login')?.addEventListener('click', login);
    document.getElementById('btn-register')?.addEventListener('click', register);
    document.getElementById('forgot-pw')?.addEventListener('click', forgotPassword);
    document.getElementById('btn-google-login')?.addEventListener('click', () => loginWithOAuth('google'));
    document.getElementById('btn-discord-login')?.addEventListener('click', () => loginWithOAuth('discord'));
    document.getElementById('btn-google-reg')?.addEventListener('click', () => loginWithOAuth('google'));
    document.getElementById('btn-discord-reg')?.addEventListener('click', () => loginWithOAuth('discord'));

    // Lưu label gốc của button để restore khi hết loading
    document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
      btn.dataset.label = btn.textContent;
    });
  }

  // ============================================
  // Dịch error message
  // ============================================
  function translateError(msg) {
    if (!msg) return 'Có lỗi xảy ra';
    if (msg.includes('Invalid login credentials')) return 'Email hoặc mật khẩu không đúng';
    if (msg.includes('Email not confirmed')) return 'Vui lòng xác nhận email trước';
    if (msg.includes('User already registered')) return 'Email này đã được đăng ký';
    if (msg.includes('Password should be')) return 'Mật khẩu tối thiểu 6 ký tự';
    if (msg.includes('Unable to validate email')) return 'Email không hợp lệ';
    if (msg.includes('rate limit')) return 'Thử lại sau vài phút';
    return msg;
  }

  return {
    checkSession,
    logout,
    loginWithOAuth,
  };

})();