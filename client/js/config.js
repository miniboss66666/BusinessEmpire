/* ============================================
   CONFIG.JS - Cấu hình chung
   ============================================ */

const CONFIG = Object.freeze({
  // Supabase
   SUPABASE_URL: 'https://slsoylcapezzkakgqvmj.supabase.co' ,
   SUPABASE_ANON_KEY: 'sb_publishable_bfWXE5bTRjpDQgIjXFOJsA_tsxB_LdS',

  // Cloudflare Turnstile
  TURNSTILE_SITE_KEY: '0x4AAAAAACnRHKhJuwb2-HTX',

  // Game settings
  GAME_TICK_MS: 1000,        // 1 giây/tick
  OFFLINE_MAX_MS: 86400000,  // 24 tiếng tối đa
  SAVE_INTERVAL_MS: 30000,   // Auto-save mỗi 30 giây

  // Version
  VERSION: '0.1.0',
});