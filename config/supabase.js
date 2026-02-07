// config/supabase.js
// Central Supabase config (single source of truth)
// ✅ Replace these with YOUR project values from Supabase:
//   Project Settings → API → Project URL + anon public key

(function () {
  // IMPORTANT SECURITY NOTE:
  // - Use ONLY the "anon" public key here.
  // - Never put your "service_role" key in a public website.

  const SUPABASE_URL = "https://zxhbbzjxxwdpafpjcmli.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aGJiemp4eHdkcGFmcGpjbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MzA4NCwiZXhwIjoyMDg2MDQ5MDg0fQ.71lWN8jU7fNbbgrG_NbWCvx4K4Y6VHeSuS60_wtMhwQ";


  if (!window.supabase) {
    console.error("Supabase JS not loaded. Add: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    return;
  }

  // Expose a single shared client for every page.
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
