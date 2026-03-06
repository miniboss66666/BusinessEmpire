/* ============================================
   SUPABASE.JS - Khởi tạo Supabase client
   ============================================ */

const { createClient } = supabase;

const DB = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});