/* ============================================
   CONFIG.JS - Cấu hình chung
   ============================================ */

const CONFIG = Object.freeze({
  // Supabase
   SUPABASE_URL: 'https://slsoylcapezzkakgqvmj.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc295bGNhcGV6emtha2dxdm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjY2NDUsImV4cCI6MjA4ODMwMjY0NX0.A3Y4vUS7M68KA_3XWkGABdxdjPCISd9mmONA4tDUr-Q',

  // Cloudflare Turnstile
  TURNSTILE_SITE_KEY: '0x4AAAAAACnRHKhJuwb2-HTX',

  // Game settings
  GAME_TICK_MS: 1000,        // 1 giây/tick
  OFFLINE_MAX_MS: 86400000,  // 24 tiếng tối đa
  SAVE_INTERVAL_MS: 30000,   // Auto-save mỗi 30 giây

  // Version
  VERSION: '0.1.19.3',
});