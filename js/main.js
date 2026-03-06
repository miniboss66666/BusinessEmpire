/* ============================================
   MAIN.JS - Khởi động game
   ============================================ */

(async () => {

  // Init UI trước (theme, modal)
  UI.init();

  // Check session → tự động login nếu đã có session
  await Auth.checkSession();

})();