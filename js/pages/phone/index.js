// @ts-nocheck
/* ============================================
   PHONE/INDEX.JS — Giao diện điện thoại
   5 app: Y, Tubeyou, Team, Assets, Coming Soon
   ============================================ */

const PhonePage = (() => {

  let currentApp = null; // null = home screen

  const APPS = [
    { id:'y',      emoji:'📣', name:'Y',           color:'#1a1a2e' },
    { id:'tubeyou',emoji:'📺', name:'Tubeyou',     color:'#1a0a0a' },
    { id:'team',   emoji:'👥', name:'Team',         color:'#0a1a1a' },
    { id:'assets', emoji:'🛍️', name:'Assets',       color:'#1a1500' },
    { id:'soon',   emoji:'❓', name:'Coming Soon',  color:'#111' },
  ];

  function init() {
    PhoneY.init();
    PhoneTubeyou.init();
    PhoneTeam.init();
    PhoneAssets.init();
    render();
  }

  function render() {
    const page = document.getElementById('page-phone');
    if (!page) return;
    page.innerHTML = renderHTML();
    bindEvents();
  }

  function renderHTML() {
    return `
      <div class="phone-wrap">
        ${currentApp ? renderAppShell() : renderHomeScreen()}
      </div>`;
  }

  function renderHomeScreen() {
    const state = PhoneY.getStats();
    const yt = PhoneTubeyou.getStats();
    const income = (state.followers + yt.subscribers) / 1000;

    return `
      <div class="phone-home">
        <!-- Status bar -->
        <div class="phone-statusbar">
          <span class="phone-time" id="phone-clock">${_clock()}</span>
          <span class="phone-income-pill">💰 ${Format.money(income)}/ph</span>
        </div>

        <!-- Fame summary -->
        <div class="phone-fame-bar">
          <div class="phone-fame-item">
            <span class="phone-fame-val">📣 ${Format.money(state.followers)}</span>
            <span class="phone-fame-lbl">Followers Y</span>
          </div>
          <div class="phone-fame-divider"></div>
          <div class="phone-fame-item">
            <span class="phone-fame-val">📺 ${Format.money(yt.subscribers)}</span>
            <span class="phone-fame-lbl">Sub Tubeyou</span>
          </div>
        </div>

        <!-- App grid -->
        <div class="phone-app-grid">
          ${APPS.map(app => `
            <div class="phone-app-icon" data-app="${app.id}"
                 style="--app-color:${app.color}">
              <div class="phone-app-emoji">${app.emoji}</div>
              <div class="phone-app-name">${app.name}</div>
              ${app.id === 'y' && state.followers > 0 ? `<div class="phone-app-badge">${Format.money(state.followers)}</div>` : ''}
              ${app.id === 'tubeyou' && yt.subscribers > 0 ? `<div class="phone-app-badge">${Format.money(yt.subscribers)}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderAppShell() {
    let content = '';
    if (currentApp === 'y')       content = PhoneY.renderHTML();
    else if (currentApp === 'tubeyou') content = PhoneTubeyou.renderHTML();
    else if (currentApp === 'team')    content = PhoneTeam.renderHTML();
    else if (currentApp === 'assets')  content = PhoneAssets.renderHTML();
    else content = `<div class="re-empty" style="padding:40px">
      <div style="font-size:3rem">❓</div>
      <div style="font-size:1rem;margin-top:10px;color:var(--gold)">Coming Soon</div>
    </div>`;

    return `
      <div class="phone-app-shell">
        <div class="phone-app-topbar">
          <button class="phone-back-btn" id="btn-phone-back">← Home</button>
          <span class="phone-app-title">
            ${APPS.find(a=>a.id===currentApp)?.emoji}
            ${APPS.find(a=>a.id===currentApp)?.name}
          </span>
          <span></span>
        </div>
        <div class="phone-app-content" id="phone-app-content">
          ${content}
        </div>
      </div>`;
  }

  function _clock() {
    const now = new Date();
    return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  }

  function bindEvents() {
    document.getElementById('btn-phone-back')?.addEventListener('click', () => {
      currentApp = null;
      render();
    });
    document.querySelectorAll('.phone-app-icon').forEach(el => {
      el.addEventListener('click', () => {
        currentApp = el.dataset.app;
        render();
        _bindAppEvents();
      });
    });
    if (currentApp) _bindAppEvents();
  }

  function _bindAppEvents() {
    if (currentApp === 'y')        PhoneY.bindEvents();
    else if (currentApp === 'tubeyou') PhoneTubeyou.bindEvents();
    else if (currentApp === 'team')    PhoneTeam.bindEvents();
    else if (currentApp === 'assets')  PhoneAssets.bindEvents();
  }

  // Passive income tick (gọi từ engine)
  function tick() {
    PhoneY.tick();
    PhoneTubeyou.tick();
    PhoneTeam.tick();
  }

  return { init, render, tick };
})();