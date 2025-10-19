// scripts/opportunities.js
// Loom CRM — Opportunities + Contacts Unified Module
// Includes: drag reorder, search/sort, hybrid modal, autofill, Supabase CRUD

const SUPABASE_URL = "https://usopxhshfmmtnnvkzelj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzb3B4aHNoZm1tdG5udmt6ZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTc2MzIsImV4cCI6MjA3NjM5MzYzMn0.3qG3t-QTc6UsRt74GXjL_pBVfibG42X5wGyWRLYu3NE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  loadSidebar("opportunities");

  const modal = document.getElementById("addOpportunityModal");
  const form = document.getElementById("opportunityForm");
  const settingsBtn = document.getElementById("settingsBtn");
  const pipelineModal = document.getElementById("pipelineSettingsModal");
  const pipelineForm = document.getElementById("pipelineForm");
  const addRecordBtn = document.getElementById("addRecordBtn");

  const contactInput = document.getElementById("contactSelectInput");
  const contactEmail = document.getElementById("contact_email");
  const contactPhone = document.getElementById("contact_phone");
  const opportunityFields = document.getElementById("opportunityFields");

  let currentView = "pipeline";
  let stages = [];

  /* ---------------------- Toast Hint ---------------------- */
  function showToast(msg) {
    let toast = document.createElement("div");
    toast.textContent = msg;
    toast.style =
      "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;padding:10px 16px;border-radius:8px;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.2);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  /* ---------------------- Load Stages ---------------------- */
  async function loadStages() {
    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      console.error("Error fetching stages:", error.message);
      return [];
    }
    return data || [];
  }

  function populateStageSelect(stages) {
    const stageSel = document.getElementById("stage");
    if (!stageSel) return;
    stageSel.innerHTML = "";
    stages.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      stageSel.appendChild(opt);
    });
  }

  stages = await loadStages();
  populateStageSelect(stages);

  /* ---------------------- Contacts Datalist ---------------------- */
  async function loadContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, email, phone")
      .order("name");
    if (error) return console.error("Error fetching contacts:", error.message);

    const list = document.getElementById("contactSelectList");
    if (!list) return;
    list.innerHTML = "";
    data.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.label = c.email ? `${c.name} (${c.email})` : c.name;
      opt.textContent = c.name;
      list.appendChild(opt);
    });
    window.contactMap = Object.fromEntries(
      data.map((c) => [c.name.toLowerCase(), c])
    );
  }

  contactInput.addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    const match = window.contactMap?.[val];
    if (match) {
      contactEmail.value = match.email || "";
      contactPhone.value = match.phone || "";
    } else {
      contactEmail.value = "";
      contactPhone.value = "";
    }
  });

  /* ---------------------- Unified Modal Open ---------------------- */
 addRecordBtn.addEventListener("click", async () => {
  await loadContacts();
  const oppName = document.getElementById("opportunity_name");
  const stageSel = document.getElementById("stage");

  if (currentView === "pipeline") {
    modal.querySelector("h2").textContent = "Add New Opportunity";
    opportunityFields.classList.remove("hidden");
    oppName.required = true;
    stageSel.required = true;
  } else {
    modal.querySelector("h2").textContent = "Add New Contact";
    opportunityFields.classList.add("hidden");
    oppName.required = false;
    stageSel.required = false;
  }

  modal.classList.remove("hidden");
});


  document
    .querySelectorAll("#cancelModal, #cancelModalFooter")
    .forEach((btn) =>
      btn.addEventListener("click", () => modal.classList.add("hidden"))
    );

  /* ---------------------- Ensure Contact Exists ---------------------- */
  async function ensureContactByName(name) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("*")
      .ilike("name", name)
      .maybeSingle();
    if (existing) return existing.id;
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert([{ name, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return null;
    return newContact?.id || null;
  }

  /* ---------------------- Form Submit ---------------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = contactInput.value.trim();
    const email = contactEmail.value.trim();
    const phone = contactPhone.value.trim();
    if (!name) return alert("Please enter a contact name.");

    let contact_id = await ensureContactByName(name);
    if (!contact_id) {
      const { data: newC } = await supabase
        .from("contacts")
        .insert([{ name, email, phone, last_activity: new Date().toISOString() }])
        .select()
        .single();
      contact_id = newC?.id;
    }

    if (currentView === "pipeline") {
      const opp = {
        contact_id,
        opportunity_name: document.getElementById("opportunity_name").value,
        pipeline: document.getElementById("pipeline").value,
        stage: document.getElementById("stage").value,
        status: document.getElementById("status").value,
        value: parseFloat(document.getElementById("value").value) || 0,
        business_name: document.getElementById("business_name").value,
        source: document.getElementById("source").value,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("opportunities").insert([opp]);
      if (error) return alert("❌ " + error.message);
      alert("✅ Opportunity added!");
      refreshOpportunities();
    } else {
      const { error } = await supabase
        .from("contacts")
        .insert([{ name, email, phone, last_activity: new Date().toISOString() }]);
      if (error) return alert("❌ " + error.message);
      alert("✅ Contact added!");
      refreshContacts();
    }

    modal.classList.add("hidden");
    form.reset();
  });

  /* ---------------------- Stage Management (Drag) ---------------------- */
  async function renderStagesList() {
    const container = document.getElementById("stagesList");
    container.innerHTML = "";
    stages.forEach((s) => {
      const div = document.createElement("div");
      div.className = "stage-item";
      div.draggable = true;
      div.dataset.id = s.id;
      div.innerHTML = `
        <span>${s.name}</span>
        <button class="stage-delete" data-id="${s.id}">🗑</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll(".stage-item").forEach((item) => {
      item.addEventListener("dragstart", () => item.classList.add("dragging"));
      item.addEventListener("dragend", async () => {
        item.classList.remove("dragging");
        const newOrder = [...container.querySelectorAll(".stage-item")].map(
          (el, i) => ({ id: el.dataset.id, position: i })
        );
        for (const s of newOrder) {
          await supabase
            .from("pipeline_stages")
            .update({ position: s.position })
            .eq("id", s.id);
        }
        stages = await loadStages();
        populateStageSelect(stages);
        refreshOpportunities();
      });
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = container.querySelector(".dragging");
      const after = getDragAfterElement(container, e.clientY);
      if (!after) container.appendChild(dragging);
      else container.insertBefore(dragging, after);
    });

    function getDragAfterElement(container, y) {
      const items = [...container.querySelectorAll(".stage-item:not(.dragging)")];
      return items.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset)
            return { offset, element: child };
          else return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }

    document.querySelectorAll(".stage-delete").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const { error } = await supabase
          .from("pipeline_stages")
          .delete()
          .eq("id", id);
        if (error) return alert("Error deleting stage: " + error.message);
        alert("🗑 Stage deleted.");
        stages = await loadStages();
        populateStageSelect(stages);
        renderStagesList();
        refreshOpportunities();
      })
    );
  }

  settingsBtn.addEventListener("click", async () => {
    pipelineModal.classList.remove("hidden");
    stages = await loadStages();
    renderStagesList();
  });

  document
    .querySelectorAll("#cancelPipelineModal, #cancelPipelineFooter")
    .forEach((b) =>
      b.addEventListener("click", () => pipelineModal.classList.add("hidden"))
    );

  pipelineForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newStage = document.getElementById("newStage").value.trim();
    if (!newStage) return;
    await supabase
      .from("pipeline_stages")
      .insert([{ name: newStage, position: stages.length }]);
    document.getElementById("newStage").value = "";
    stages = await loadStages();
    populateStageSelect(stages);
    renderStagesList();
    refreshOpportunities();
  });

  /* ---------------------- Contact List ---------------------- */
  let contactData = [];
  let currentSort = { column: "name", asc: true };

  async function refreshContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("name");
    if (error) return console.error("Error:", error.message);
    contactData = data || [];
    renderContactTable(contactData);
  }

  function renderContactTable(data) {
    const tbody = document.querySelector("#contactTable tbody");
    tbody.innerHTML = "";
    data.forEach((c) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${c.name}</td>
        <td>${c.email || "-"}</td>
        <td>${c.phone || "-"}</td>
        <td>${
          c.last_activity
            ? new Date(c.last_activity).toLocaleDateString()
            : "-"
        }</td>`;
      tbody.appendChild(row);
    });
  }

  function setupSearch() {
    if (!document.getElementById("contactSearch")) {
      const search = document.createElement("input");
      search.id = "contactSearch";
      search.placeholder = "🔍 Search contacts...";
      search.style =
        "margin: 10px 0; padding: 8px; width: 100%; border-radius: 8px; border:1px solid var(--border);";
      const table = document.getElementById("contactTable");
      table.parentNode.insertBefore(search, table);
      search.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = contactData.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            (c.email || "").toLowerCase().includes(term) ||
            (c.phone || "").toLowerCase().includes(term)
        );
        renderContactTable(filtered);
      });
    }
  }

  function setupSort() {
    const headers = document.querySelectorAll("#contactTable th");
    headers.forEach((th) => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        const column = th.textContent.trim().toLowerCase();
        if (currentSort.column === column) currentSort.asc = !currentSort.asc;
        else currentSort = { column, asc: true };
        const sorted = [...contactData].sort((a, b) => {
          const va = (a[column] || "").toLowerCase();
          const vb = (b[column] || "").toLowerCase();
          if (va < vb) return currentSort.asc ? -1 : 1;
          if (va > vb) return currentSort.asc ? 1 : -1;
          return 0;
        });
        renderContactTable(sorted);
      });
    });
  }

  /* ---------------------- Pipeline View ---------------------- */
  async function refreshOpportunities() {
    const { data: opps, error } = await supabase
      .from("opportunities")
      .select("*, contacts(name)")
      .order("created_at", { ascending: false });
    if (error) return console.error("Error loading opps:", error.message);

    stages = await loadStages();
    const board = document.getElementById("pipelineBoard");
    board.innerHTML = "";

    if (!stages.length) {
      board.innerHTML = `<div class="kanban-column"><h3>No Stages</h3></div>`;
      return;
    }

    stages.forEach((stage) => {
      const col = document.createElement("div");
      col.className = "kanban-column";
      col.innerHTML = `<h3>${stage.name}</h3>`;
      col.addEventListener("dragover", (e) => e.preventDefault());
      col.addEventListener("drop", async (e) => {
        const id = e.dataTransfer.getData("text/plain");
        if (!id) return;
        await supabase.from("opportunities").update({ stage: stage.name }).eq("id", id);
        refreshOpportunities();
      });

      const filtered = opps.filter((o) => o.stage === stage.name);
      filtered.forEach((o) => {
        const card = document.createElement("div");
        card.className = "opportunity-card";
        card.draggable = true;
        card.dataset.id = o.id;
        card.innerHTML = `<strong>${o.opportunity_name}</strong><br><small>${o.contacts?.name || "No contact"}</small>`;
        card.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", o.id));
        col.appendChild(card);
      });
      board.appendChild(col);
    });
  }

  refreshOpportunities();

  /* ---------------------- View Switch ---------------------- */
  const pipelineViewBtn = document.getElementById("pipelineViewBtn");
  const contactsViewBtn = document.getElementById("contactsViewBtn");
  const pipelineView = document.getElementById("pipelineView");
  const contactsView = document.getElementById("contactsView");

  pipelineViewBtn.addEventListener("click", async () => {
    currentView = "pipeline";
    addRecordBtn.textContent = "➕ Add Opportunity";
    showToast("Now adding opportunities");
    pipelineView.classList.remove("hidden");
    contactsView.classList.add("hidden");
    pipelineViewBtn.classList.add("active");
    contactsViewBtn.classList.remove("active");
    await refreshOpportunities();
  });

  contactsViewBtn.addEventListener("click", async () => {
    currentView = "contacts";
    addRecordBtn.textContent = "➕ Add Contact";
    showToast("Now adding contacts");
    pipelineView.classList.add("hidden");
    contactsView.classList.remove("hidden");
    contactsViewBtn.classList.add("active");
    pipelineViewBtn.classList.remove("active");
    await refreshContacts();
    setupSearch();
    setupSort();
  });
});
