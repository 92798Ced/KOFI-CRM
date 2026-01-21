/* =========================================================
   LOOM CRM - MAIN DASHBOARD LOGIC (CLEAN VERSION)
   ========================================================= */

// ========== GLOBAL STATE ==========
const SUPABASE_URL = "https://bvjgyizumizvmrzaqqme.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2amd5aXp1bWl6dm1yemFxcW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDcwMDMsImV4cCI6MjA4NDU4MzAwM30.UuSXijxTbSHfqMcLi-S21w9wna2qlp2czDDVNxgVFm4";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== LIVE TIME + WEATHER ==========
async function initLiveClock() {
  const timeEl = document.getElementById("live-time");
  const cityEl = document.getElementById("live-city");
  const weatherEl = document.getElementById("live-weather");

  async function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeEl.textContent = timeStr;
  }

  async function updateWeather() {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=14.55&longitude=121.03&current_weather=true"
      );
      const data = await res.json();
      const weather = data.current_weather;
      cityEl.textContent = "Manila";
      weatherEl.textContent = `${weather.temperature}°C ${weather.weathercode === 0 ? "☀️" : "☁️"}`;
    } catch {
      cityEl.textContent = "Offline";
      weatherEl.textContent = "N/A";
    }
  }

  updateClock();
  updateWeather();
  setInterval(updateClock, 60000);
  setInterval(updateWeather, 30 * 60 * 1000);
}

// ========== DASHBOARD METRICS ==========
async function loadDashboardMetrics() {
  // Placeholder demo metrics — replace with your Supabase queries later
  document.getElementById("new-leads-count").textContent = 23;
  document.getElementById("conversion-rate").textContent = "67%";

  const sourceList = document.getElementById("lead-source-list");
  sourceList.innerHTML = `
    <li>Facebook Ads — 12</li>
    <li>Website — 5</li>
    <li>Walk-ins — 3</li>
    <li>Referrals — 3</li>
  `;
}

// ========== REVIEW SUMMARY (DASHBOARD CARD) ==========
function loadReviewSummary() {
  const reviewsGrid = document.getElementById("reviews-grid");
  reviewsGrid.innerHTML = `
    <div class="review-card">
      <p><strong>Anna R.</strong> — “Loved the experience!” ★★★★★</p>
    </div>
    <div class="review-card">
      <p><strong>Carlos D.</strong> — “Fast and friendly service.” ★★★★☆</p>
    </div>
  `;
  document.getElementById("average-rating").textContent = "4.8 ★";
}

// ========== CONTACT TABLE ==========
function loadContacts() {
  const table = document.getElementById("contact-table");
  table.innerHTML = `
    <tr><td>Maria Santos</td><td>maria@email.com</td><td>+63 912 345 6789</td><td>2d ago</td></tr>
    <tr><td>James Cruz</td><td>james@email.com</td><td>+63 998 555 2222</td><td>1w ago</td></tr>
    <tr><td>Alyssa Tan</td><td>alyssa@email.com</td><td>+63 917 222 0000</td><td>4h ago</td></tr>
  `;
  document.getElementById("contact-count").textContent = "3";
}

// ========== CALENDAR ==========
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  const monthLabel = document.getElementById("calendar-month");

  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthLabel.textContent = monthNames[now.getMonth()];

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let daysHTML = "";
  for (let i = 1; i <= daysInMonth; i++) {
    daysHTML += `<div class="day"><div class="day-num">${i}</div></div>`;
  }
  calendar.innerHTML = `<div class="calendar-grid">${daysHTML}</div>`;
}

// ========== OPPORTUNITIES ==========
function loadOpportunities() {
  const stages = ["Prospecting", "Negotiation", "Closed Won", "Closed Lost"];
  stages.forEach((stage) => {
    const col = document.getElementById(`stage-${stage}`);
    if (col)
      col.innerHTML = `
        <div class="opportunity-card">
          <strong>${stage} Lead #1</strong><br>
          <small>Last updated today</small>
        </div>
      `;
  });
}

// ========== MODAL ==========
function initOpportunityModal() {
  const modal = document.getElementById("add-modal");
  const openBtn = document.getElementById("add-opportunity");
  const cancelBtn = document.getElementById("opp-cancel");
  const saveBtn = document.getElementById("opp-save");

  openBtn.onclick = () => modal.classList.remove("hidden");
  cancelBtn.onclick = () => modal.classList.add("hidden");
  saveBtn.onclick = () => {
    modal.classList.add("hidden");
    alert("Opportunity saved!");
  };
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", async () => {
  try {
    initLiveClock();
    loadDashboardMetrics();
    loadReviewSummary();
    loadContacts();
    renderCalendar();
    loadOpportunities();
    initOpportunityModal();
  } catch (err) {
    console.error("App init error:", err);
  }
});


// ===============================
// SESSION IDLE SECURITY
// ===============================

const INACTIVITY_LIMIT = 60_000; // 1 minute
const CONFIRM_LIMIT = 30;        // 30 seconds

let idleTimer;
let countdownTimer;
let countdown = CONFIRM_LIMIT;

// Supabase client already exists in app.js
// const supabase = ...

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(showIdleWarning, INACTIVITY_LIMIT);
}

function showIdleWarning() {
  const modal = document.getElementById("idleModal");
  const counter = document.getElementById("idleCounter");

  if (!modal || !counter) {
    forceLogout();
    return;
  }

  modal.style.display = "flex";
  countdown = CONFIRM_LIMIT;
  counter.textContent = countdown;

  countdownTimer = setInterval(() => {
    countdown--;
    counter.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownTimer);
      forceLogout();
    }
  }, 1000);
}

async function forceLogout() {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
}

function stayLoggedIn() {
  clearInterval(countdownTimer);
  document.getElementById("idleModal").style.display = "none";
  resetIdleTimer();
}

// Track user activity
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(event =>
  window.addEventListener(event, resetIdleTimer, { passive: true })
);

// Start tracking
resetIdleTimer();
function validatePassword(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[^\w]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

const error = validatePassword(password);
if (error) {
  alert(error);
  return;
}

