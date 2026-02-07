/* =========================
   SUPABASE SETUP
========================= */
const SUPABASE_URL = "https://zxhbbzjxxwdpafpjcmli.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aGJiemp4eHdkcGFmcGpjbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MzA4NCwiZXhwIjoyMDg2MDQ5MDg0fQ.71lWN8jU7fNbbgrG_NbWCvx4K4Y6VHeSuS60_wtMhwQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let lastSavedState = "";
let autoSaveTimeout = null;

/* ✅ Declare formId ONCE here globally */
const formId = new URLSearchParams(window.location.search).get("id");

/* =========================
   INLINE TITLE RENAME
========================= */
(function () {
  const titleEl = document.getElementById("formTitle");
  let editing = false;
  let originalTitle = titleEl.textContent;

  titleEl.addEventListener("dblclick", () => {
    if (editing) return;
    editing = true;

    const input = document.createElement("input");
    input.type = "text";
    input.value = originalTitle;
    input.className = "inline-title-edit";
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    async function saveTitle() {
      const newTitle = input.value.trim() || originalTitle;
      input.disabled = true;

      const newEl = document.createElement("h1");
      newEl.id = "formTitle";
      newEl.textContent = newTitle;
      input.replaceWith(newEl);
      editing = false;
      originalTitle = newTitle;

      try {
        // ✅ Use the same global formId (don’t redeclare it)
        const { error } = await supabase
          .from("forms")
          .update({
            title: newTitle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formId);

        if (error) throw error;
        showToast("Form renamed successfully ✅");
      } catch (err) {
        showToast("❌ Failed to rename form");
        console.error(err);
      }
    }

    input.addEventListener("blur", saveTitle);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveTitle();
      if (e.key === "Escape") input.blur();
    });
  });

  function showToast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }
})();
/* =========================
   DOM REFS
========================= */
const canvas        = document.getElementById("formCanvas");
const emptyMsg      = document.getElementById("emptyMsg");
const settingsPanel = document.getElementById("settingsPanel");
const saveBtn       = document.getElementById("saveForm");
const backBtn       = document.getElementById("backBtn");
const formTitleEl   = document.getElementById("formTitle");

/* Sidebar tabs (already in your HTML/CSS) */
const formElementsTab = document.getElementById("formElementsTab");
const stylingTab      = document.getElementById("stylingTab");
const formPanel       = document.getElementById("formPanel");
const stylePanel      = document.getElementById("stylePanel");

/* Styling controls (Google Fonts) */
const fontSelect  = document.getElementById("fontSelect");
const baseSizeInp = document.getElementById("fontSize");
const lineHInp    = document.getElementById("lineHeight");

/* =========================
   STATE
========================= */
let fields = [];              // { id,type,label,example,required,content/src,styles:{fontSize,fontWeight,marginBottom,align}, variant }
let selectedField = null;
let isDirty = false;

/* Global typography for the canvas */
let fontSettings = {
  fontFamily: "Poppins",
  fontSize: 16,
  lineHeight: 1.5
};

/* =========================
   TABS
========================= */
formElementsTab.onclick = () => {
  formElementsTab.classList.add("active");
  stylingTab.classList.remove("active");
  formPanel.classList.remove("hidden");
  stylePanel.classList.add("hidden");
};
stylingTab.onclick = () => {
  stylingTab.classList.add("active");
  formElementsTab.classList.remove("active");
  stylePanel.classList.remove("hidden");
  formPanel.classList.add("hidden");
};

/* =========================
   GOOGLE FONTS
========================= */
async function loadGoogleFonts() {
  try {
    const res = await fetch("https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyD-uUDEMO_API_KEY");
    const data = await res.json();
    data.items.slice(0, 200).forEach(font => {
      const opt = document.createElement("option");
      opt.value = font.family;
      opt.textContent = font.family;
      fontSelect.appendChild(opt);
    });
  } catch {
    ["Poppins", "Roboto", "Open Sans", "Montserrat", "Inter"].forEach(f => {
      const o = document.createElement("option");
      o.value = o.textContent = f;
      fontSelect.appendChild(o);
    });
  }
  fontSelect.value = fontSettings.fontFamily;
}
loadGoogleFonts();

function applyFontSettings() {
  const linkId = "google-font-link";
  let link = document.getElementById(linkId);
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${fontSettings.fontFamily.replace(/ /g, "+")}:wght@300;400;600;700&display=swap`;

  canvas.style.fontFamily = `'${fontSettings.fontFamily}', sans-serif`;
  canvas.style.fontSize   = `${fontSettings.fontSize}px`;
  canvas.style.lineHeight = fontSettings.lineHeight;
}
fontSelect.onchange = e => { fontSettings.fontFamily = e.target.value; applyFontSettings(); triggerAutoSave(); };
baseSizeInp.oninput = e => { fontSettings.fontSize   = Number(e.target.value || 16); applyFontSettings(); triggerAutoSave(); };
lineHInp.oninput    = e => { fontSettings.lineHeight = Number(e.target.value || 1.5); applyFontSettings(); triggerAutoSave(); };

/* =========================
   UNSAVED STATE + HEADER
========================= */
function markDirty() {
  isDirty = true;
  saveBtn.textContent = "💾 Save (Unsaved)";
  saveBtn.classList.add("secondary");
}
function markSaved() {
  isDirty = false;
  saveBtn.textContent = "💾 Saved";
  saveBtn.classList.remove("secondary");
}
backBtn.onclick = () => {
  if (isDirty) showLeaveModal();
  else window.location.href = "index.html";
};
window.onbeforeunload = (e) => {
  if (isDirty) { e.preventDefault(); e.returnValue = ""; }
};

/* =========================
   DRAG SOURCES (left cards)
========================= */
document.querySelectorAll(".element-card").forEach(card => {
  card.addEventListener("dragstart", e => {
    e.dataTransfer.setData("type", card.dataset.type);
  });
});
canvas.addEventListener("dragover", e => e.preventDefault());
canvas.addEventListener("drop", e => {
  e.preventDefault();
  const type = e.dataTransfer.getData("type");
  if (!type) return;
  addField(type);
});

/* =========================
   FIELD FACTORY
========================= */
function addField(type) {
  const id = Date.now();
  const baseStyles = { fontSize: 16, fontWeight: "normal", marginBottom: 16, align: "left" };
  let f = { id, type, label: "", example: "", required: false, styles: { ...baseStyles } };

  switch (type) {
    // Inputs
    case "firstname":
      f.label = "First Name";
      f.example = "Juan";
      break;
    case "lastname":
      f.label = "Last Name";
      f.example = "Dela Cruz";
      break;
    case "fullname":
      f.label = "Full Name";
      f.example = "Juan Dela Cruz";
      break;
    case "dob":
      f.label = "Date of Birth";
      f.example = ""; // not used in date inputs
      break;
    case "email":
      f.label = "Email Address";
      f.example = "example@email.com";
      break;
    case "phone":
      f.label = "Phone Number";
      f.example = "09XX XXX XXXX";
      break;

    // Visual
    case "text":
      f.label = "Text";
      f.content = "Edit this text";
      f.variant = "body"; // "header" | "body"
      f.styles.fontSize = 18;
      f.styles.fontWeight = "normal";
      break;
    case "image":
      f.label = "Image";
      f.src   = "https://yourdomain.com/path/image.jpg";
      break;

    // Button
    case "button":
      f.label = "Submit";
      f.styles.background = "#22c55e";
      f.styles.color = "#ffffff";
      f.styles.fontWeight = "600";
      f.styles.fontSize = 16;
      break;
  }

  fields.push(f);
  renderFields();
  selectField(id);
  triggerAutoSave();
}

/* =========================
   RENDER
========================= */
function renderFields() {
  canvas.innerHTML = "";
  if (!fields.length) {
    emptyMsg.style.display = "block";
    canvas.append(emptyMsg);
    return;
  }
  emptyMsg.style.display = "none";

  fields.forEach((f, idx) => {
    const block = document.createElement("div");
    block.className = "field-block";
    block.dataset.id = f.id;
    if (selectedField && selectedField.id === f.id) block.classList.add("active");
    block.style.marginBottom = `${f.styles.marginBottom || 16}px`;

    // Actions
    const actions = document.createElement("div");
    actions.className = "field-actions";
    actions.innerHTML = `
      <button class="drag-handle" title="Drag">☰</button>
      <button class="delete-btn" title="Delete">🗑</button>
    `;
    actions.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this element?")) {
        fields.splice(idx, 1);
        if (selectedField && selectedField.id === f.id) selectedField = null;
        renderFields();
        renderSettings();
        triggerAutoSave();
      }
    };

    // Content
    let inner = "";
    const reqAsterisk = f.required ? " <span style='color:#f87171'>*</span>" : "";

    if (f.type === "button") {
      inner = `
        <button
          style="
            width:100%;
            padding:.9rem;
            border:none;
            border-radius:.6rem;
            font-weight:${f.styles.fontWeight || 600};
            font-size:${f.styles.fontSize || 16}px;
            background:${f.styles.background || "#22c55e"};
            color:${f.styles.color || "#ffffff"};
          "
        >${f.label || "Submit"}</button>`;
    }
    else if (f.type === "text") {
      const size = f.variant === "header" ? (f.styles.fontSize || 28) : (f.styles.fontSize || 18);
      inner = `
        <div
          class="editable-text"
          style="
            text-align:${f.styles.align || "left"};
            font-weight:${f.styles.fontWeight || "normal"};
            font-size:${size}px;
          "
        >${f.content || "Edit this text"}</div>`;
    }
    else if (f.type === "image") {
      inner = `<img src="${f.src}" alt="image" style="max-width:100%;border-radius:.5rem">`;
    }
    else {
      // Inputs
      const inputType =
        f.type === "email" ? "email" :
        f.type === "phone" ? "tel"   :
        f.type === "dob"   ? "date"  : "text";

      const exampleAttr = inputType === "date" ? "" : `placeholder="${f.example || ""}"`;

      inner = `
        <label style="font-weight:${f.styles.fontWeight || "600"};font-size:${(f.styles.fontSize || 16)}px;">
          ${f.label || "Label"}${reqAsterisk}
        </label>
        <input
          type="${inputType}"
          ${exampleAttr}
          ${f.required ? "required" : ""}
          style="
            width:100%;
            border-radius:.5rem;
            border:1px solid var(--card-border);
            background: var(--surface-subtle);
            padding:.65rem .75rem;
            color:var(--text);
            font-size:${(fontSettings.fontSize || 16)}px;
          "
        />`;
    }

    block.innerHTML = inner;
    block.appendChild(actions);
    block.onclick = () => selectField(f.id);
    canvas.appendChild(block);
  });

  enableSortable();
}

/* =========================
   SORTABLE (drag to reorder)
========================= */
function enableSortable() {
  new Sortable(canvas, {
    animation: 150,
    handle: ".drag-handle",
    ghostClass: "sortable-ghost",
    onEnd: (e) => {
      const [moved] = fields.splice(e.oldIndex, 1);
      fields.splice(e.newIndex, 0, moved);
      triggerAutoSave();
    }
  });
}

/* =========================
   SELECT + SETTINGS PANEL
========================= */
function selectField(id) {
  selectedField = fields.find(f => f.id === id) || null;
  renderFields();
  renderSettings();
}

function renderSettings() {
  if (!selectedField) {
    settingsPanel.innerHTML = `<p class="muted">Select an element to edit.</p>`;
    return;
  }
  const f = selectedField;

  // common helpers
  const numberOr = (v, d) => (typeof v === "number" && !Number.isNaN(v) ? v : d);

  let html = `<h3>${(f.type[0].toUpperCase() + f.type.slice(1)).replace("dob","DOB")} Settings</h3>`;

  if (f.type === "text") {
    html += `
      <label>Content</label>
      <textarea id="textContent">${f.content || ""}</textarea>

      <label>Variant</label>
      <select id="variantSel">
        <option value="header" ${f.variant === "header" ? "selected" : ""}>Header</option>
        <option value="body"   ${f.variant !== "header" ? "selected" : ""}>Body</option>
      </select>

      <label>Font Size (px)</label>
      <input type="number" id="fSize" value="${numberOr(f.styles.fontSize, f.variant === "header" ? 28 : 18)}">

      <label>Font Weight</label>
      <select id="fWeight">
        <option ${f.styles.fontWeight === "300" ? "selected" : ""} value="300">Light</option>
        <option ${f.styles.fontWeight === "normal" || f.styles.fontWeight === "400" ? "selected" : ""} value="400">Regular</option>
        <option ${f.styles.fontWeight === "600" ? "selected" : ""} value="600">Semibold</option>
        <option ${f.styles.fontWeight === "700" ? "selected" : ""} value="700">Bold</option>
      </select>

      <label>Align</label>
      <select id="fAlign">
        <option ${f.styles.align === "left"   ? "selected" : ""} value="left">Left</option>
        <option ${f.styles.align === "center" ? "selected" : ""} value="center">Center</option>
        <option ${f.styles.align === "right"  ? "selected" : ""} value="right">Right</option>
      </select>

      <label>Spacing Below (px)</label>
      <input type="number" id="mb" value="${numberOr(f.styles.marginBottom, 16)}">
    `;
  }
  else if (f.type === "image") {
    html += `
      <label>Image URL (hosted on your site)</label>
      <input id="imgURL" value="${f.src || ""}">

      <label>Spacing Below (px)</label>
      <input type="number" id="mb" value="${numberOr(f.styles.marginBottom, 16)}">
    `;
  }
  else if (f.type === "button") {
    html += `
      <label>Label</label>
      <input id="btnLabel" value="${f.label || "Submit"}">

      <label>Background</label>
      <input type="color" id="btnBg" value="${f.styles.background || "#22c55e"}">

      <label>Text Color</label>
      <input type="color" id="btnColor" value="${f.styles.color || "#ffffff"}">

      <label>Font Size (px)</label>
      <input type="number" id="fSize" value="${numberOr(f.styles.fontSize, 16)}">

      <label>Font Weight</label>
      <select id="fWeight">
        <option value="400" ${(!f.styles.fontWeight || f.styles.fontWeight=="400") ? "selected" : ""}>Regular</option>
        <option value="600" ${(f.styles.fontWeight=="600") ? "selected" : ""}>Semibold</option>
        <option value="700" ${(f.styles.fontWeight=="700") ? "selected" : ""}>Bold</option>
      </select>

      <label>Spacing Below (px)</label>
      <input type="number" id="mb" value="${numberOr(f.styles.marginBottom, 16)}">
    `;
  }
  else {
    // INPUTS (firstname, lastname, fullname, dob, email, phone)
    html += `
      <label>Label</label>
      <input id="inLabel" value="${f.label || ""}">

      <label>Example (placeholder)</label>
      <input id="inExample" value="${f.example || ""}" ${f.type==="dob" ? "disabled" : ""}>

      <label class="toggle">Required
        <input type="checkbox" id="inRequired" ${f.required ? "checked" : ""}>
      </label>

      <label>Label Font Size (px)</label>
      <input type="number" id="fSize" value="${numberOr(f.styles.fontSize, 16)}">

      <label>Label Weight</label>
      <select id="fWeight">
        <option value="400" ${(!f.styles.fontWeight || f.styles.fontWeight=="400" || f.styles.fontWeight=="normal") ? "selected" : ""}>Regular</option>
        <option value="600" ${(f.styles.fontWeight=="600") ? "selected" : ""}>Semibold</option>
        <option value="700" ${(f.styles.fontWeight=="700") ? "selected" : ""}>Bold</option>
      </select>

      <label>Spacing Below (px)</label>
      <input type="number" id="mb" value="${numberOr(f.styles.marginBottom, 16)}">
    `;
  }

  settingsPanel.innerHTML = html;

  // Bindings:
  if (f.type === "text") {
    document.getElementById("textContent").oninput = (e) => { f.content = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("variantSel").onchange = (e) => { f.variant = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("fSize").oninput = (e) => { f.styles.fontSize = Number(e.target.value||18); renderFields(); triggerAutoSave(); };
    document.getElementById("fWeight").onchange = (e) => { f.styles.fontWeight = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("fAlign").onchange = (e) => { f.styles.align = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("mb").oninput = (e) => { f.styles.marginBottom = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
  }
  else if (f.type === "image") {
    document.getElementById("imgURL").oninput = (e) => { f.src = e.target.value.trim(); renderFields(); triggerAutoSave(); };
    document.getElementById("mb").oninput   = (e) => { f.styles.marginBottom = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
  }
  else if (f.type === "button") {
    document.getElementById("btnLabel").oninput = (e) => { f.label = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("btnBg").oninput    = (e) => { f.styles.background = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("btnColor").oninput = (e) => { f.styles.color = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("fSize").oninput    = (e) => { f.styles.fontSize = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
    document.getElementById("fWeight").onchange = (e) => { f.styles.fontWeight = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("mb").oninput       = (e) => { f.styles.marginBottom = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
  }
  else {
    // Inputs
    document.getElementById("inLabel").oninput = (e) => { f.label = e.target.value; renderFields(); triggerAutoSave(); };
    if (document.getElementById("inExample")) {
      document.getElementById("inExample").oninput = (e) => { f.example = e.target.value; renderFields(); triggerAutoSave(); };
    }
    document.getElementById("inRequired").onchange = (e) => { f.required = e.target.checked; renderFields(); triggerAutoSave(); };
    document.getElementById("fSize").oninput       = (e) => { f.styles.fontSize = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
    document.getElementById("fWeight").onchange    = (e) => { f.styles.fontWeight = e.target.value; renderFields(); triggerAutoSave(); };
    document.getElementById("mb").oninput          = (e) => { f.styles.marginBottom = Number(e.target.value||16); renderFields(); triggerAutoSave(); };
  }
}

/* =========================
   SAVE / AUTO-SAVE / LOAD
========================= */

async function saveForm() {
  try {
    const schema = { fields, fontSettings };
    const json   = JSON.stringify(schema);
    if (json === lastSavedState) return; // skip identical saves

    // Save JSON (schema) + timestamp to Supabase
    const { error } = await supabase
      .from("forms")
      .update({
        schema, // JSONB column
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId);

    if (error) throw error;

    lastSavedState = json;
    markSaved();
    console.log("✅ Saved to Supabase");
    showToast("Form saved successfully ✅");
  } catch (err) {
    console.error("❌ Save failed:", err);
    showToast("❌ Failed to save form");
  }
}

function triggerAutoSave() {
  markDirty();
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(saveForm, 1000);
}

// Manual save
saveBtn.onclick = () => saveForm();

/* ===========
   LOAD FORM
=========== */
async function loadForm() {
  try {
    const { data, error } = await supabase
      .from("forms")
      .select("title,schema")
      .eq("id", formId)
      .single();

    if (error) throw error;

    // Load title
    formTitleEl.textContent = data.title || "Untitled Form";

    // Load schema (jsonb)
    fields       = data.schema?.fields || [];
    fontSettings = data.schema?.fontSettings || fontSettings;

    renderFields();
    applyFontSettings();

    lastSavedState = JSON.stringify({ fields, fontSettings });
    markSaved();
    console.log("✅ Form loaded from Supabase");
  } catch (err) {
    console.error("❌ Load failed:", err);
    showToast("⚠️ Unable to load form data");
  }
}

// Initialize load
loadForm();


/* =========================
   LEAVE MODAL
========================= */
function showLeaveModal() {
  const m = document.createElement("div");
  m.className = "modal active confirm-leave";
  m.innerHTML = `
    <div class="modal-card">
      <h3>Unsaved Changes</h3>
      <p>You have unsaved changes. Leave anyway?</p>
      <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem;">
        <button class="secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        <button class="danger" id="confirmLeave">Leave Anyway</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  m.querySelector("#confirmLeave").onclick = () => {
    m.remove();
    window.location.href = "index.html";
  };

}
