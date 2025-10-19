// /components/sidebar.js — UPDATED WITH NEW PAGES
function loadSidebar(activePage = "") {
  // Clean up any old injected elements
  document.getElementById("sidebar")?.remove();
  document.getElementById("overlay")?.remove();
  document.getElementById("openSidebar")?.remove();

  const html = `
  <nav id="sidebar" class="sidebar">
    <div class="sidebar-header">
      <h2>Loom CRM</h2>
      <button id="closeSidebar">×</button>
    </div>
    <ul class="sidebar-menu">
      <li ${activePage === "dashboard" ? "class='active'" : ""}>
        <a href="/index.html">🏠 Dashboard</a>
      </li>
      <li ${activePage === "forms" ? "class='active'" : ""}>
        <a href="/forms/index.html">📝 Forms</a>
      </li>
      <li ${activePage === "reviews" ? "class='active'" : ""}>
        <a href="/reviews/index.html">⭐ Reviews</a>
      </li>
      <li ${activePage === "automations" ? "class='active'" : ""}>
        <a href="/automations/index.html">⚙️ Automations</a>
      </li>
      <li ${activePage === "opportunities" ? "class='active'" : ""}>
        <a href="/opportunities/index.html">🌐 Opportunities</a>
      </li>
    </ul>
  </nav>

  <div id="overlay" class="sidebar-overlay"></div>
  <button id="openSidebar" class="hamburger" aria-label="Toggle sidebar">
    <span></span><span></span><span></span>
  </button>
  `;

  document.body.insertAdjacentHTML("afterbegin", html);

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");

  const openSidebar = () => {
    sidebar.classList.add("show");
    overlay.classList.add("show");
  };
  const closeSidebarFn = () => {
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
  };

  openBtn.addEventListener("click", openSidebar);
  closeBtn.addEventListener("click", closeSidebarFn);
  overlay.addEventListener("click", closeSidebarFn);
}
