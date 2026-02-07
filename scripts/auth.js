// scripts/auth.js
// Shared auth helpers for the static CRM

async function requireAuth() {
  try {
    if (!window.sb) throw new Error("Supabase client not initialized. Make sure /config/supabase.js is loaded.");

    const { data, error } = await window.sb.auth.getSession();
    if (error) throw error;

    if (!data.session) {
      // Keep where the user was going
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?next=${next}`;
      return null;
    }

    return data.session;
  } catch (e) {
    console.error("Auth guard error:", e);
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?next=${next}`;
    return null;
  }
}

async function signOutAndRedirect() {
  try {
    if (window.sb) await window.sb.auth.signOut();
  } finally {
    window.location.href = "/login.html";
  }
}
