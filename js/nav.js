/* ============================================
   NAV.JS - Điều hướng 9 trang
   ============================================ */

const Nav = (() => {

  let currentPage = 'home';

  function init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        navigateTo(page);
      });
    });

    navigateTo('home');
  }

  function navigateTo(page) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.add('hidden');
      p.classList.remove('active');
    });

    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    currentPage = page;

    // Gọi init của page nếu cần
    onPageEnter(page);
  }

  function onPageEnter(page) {
    switch (page) {
      case 'home':       if (typeof HomePage     !== 'undefined') HomePage.render();     break;
      case 'business':   if (typeof BusinessPage !== 'undefined') BusinessPage.init(); break;
      case 'realestate': if (typeof RealEstatePage !== 'undefined') RealEstatePage.init(); break;
      case 'stock':      if (typeof StockPage    !== 'undefined') StockPage.init();      break;
      case 'phone':      if (typeof PhonePage    !== 'undefined') PhonePage.init();      break;
      case 'casino':     if (typeof CasinoPage   !== 'undefined') CasinoPage.render();   break;
      case 'underground':if (typeof UndergroundPage !== 'undefined') UndergroundPage.init(); break;
      case 'knowledge':  if (typeof Knowledge    !== 'undefined') Knowledge.render();    break;
      case 'profile':    if (typeof ProfilePage  !== 'undefined') ProfilePage.init();  break;
    }
  }

  function getCurrentPage() { return currentPage; }

  return { init, navigateTo, getCurrentPage };

})();