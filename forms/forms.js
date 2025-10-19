// ---------- SUPABASE INIT ----------
const SUPABASE_URL = "https://usopxhshfmmtnnvkzelj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzb3B4aHNoZm1tdG5udmt6ZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTc2MzIsImV4cCI6MjA3NjM5MzYzMn0.3qG3t-QTc6UsRt74GXjL_pBVfibG42X5wGyWRLYu3NE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- LOAD DATA ----------
async function loadData() {
  const { data: folders, error: fErr } = await supabase.from("folders").select("*").order("updated_at", { ascending: false });
  const { data: forms, error: formErr } = await supabase.from("forms").select("*").order("updated_at", { ascending: false });
  if (fErr || formErr) {
    console.error("Load error:", fErr || formErr);
    return;
  }
  renderTable(folders, forms);
}

// ---------- REALTIME SYNC ----------
const channel = supabase.channel("forms_sync");

// Listen for any changes in folders
channel
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "folders" },
    (payload) => {
      console.log("Folder change detected:", payload);
      loadData();
    }
  )
  // Listen for any changes in forms
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "forms" },
    (payload) => {
      console.log("Form change detected:", payload);
      loadData();
    }
  )
  .subscribe();


// ---------- RENDER ----------
function renderTable(folders = [], forms = []) {
  const container = document.getElementById("formTable");

  if (!folders.length && !forms.length) {
    container.innerHTML = `
      <div class="muted" style="text-align:center;padding:2rem;">
        No forms yet. Create a folder or add a form to get started.
      </div>`;
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Last Updated</th>
          <th>Updated By</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Show all folders and their forms
  folders.forEach(folder => {
    html += `
      <tr>
        <td class="folder-icon">${folder.name}</td>
        <td>${formatTime(folder.updated_at)}</td>
        <td>${folder.updated_by || "You"}</td>
      </tr>
    `;

    const folderForms = forms.filter(f => f.folder_id === folder.id);
    if (folderForms.length) {
      folderForms.forEach(form => {
        html += `
          <tr>
            <td class="form-icon" style="padding-left:2rem;">
              <a href="builder.html?id=${form.id}" 
                 style="color:var(--accent);text-decoration:none;font-weight:500;">
                ${form.title}
              </a>
            </td>
            <td>${formatTime(form.updated_at)}</td>
            <td>${form.updated_by || "You"}</td>
          </tr>
        `;
      });
    } else {
      html += `
        <tr>
          <td style="padding-left:2rem;color:var(--text-muted);font-style:italic;">
            No forms yet
          </td>
          <td>—</td>
          <td>—</td>
        </tr>
      `;
    }
  });

  // Unsorted forms (no folder)
  const unsorted = forms.filter(f => !f.folder_id);
  if (unsorted.length) {
    html += `
      <tr><td colspan="3" style="padding-top:1rem;font-weight:600;">Unsorted Forms</td></tr>
    `;
    unsorted.forEach(form => {
      html += `
        <tr>
          <td class="form-icon">
            <a href="builder.html?id=${form.id}" 
               style="color:var(--accent);text-decoration:none;font-weight:500;">
              ${form.title}
            </a>
          </td>
          <td>${formatTime(form.updated_at)}</td>
          <td>${form.updated_by || "You"}</td>
        </tr>
      `;
    });
  }

  html += "</tbody></table>";
  container.innerHTML = html;
}


function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

// ---------- CREATE FOLDER ----------
document.getElementById("newFolderBtn").onclick = async () => {
  const name = prompt("Folder name:");
  if (!name) return;
  const { error } = await supabase.from("folders").insert([{ name }]);
  if (error) return alert("Error: " + error.message);
  await loadData();
};

// ---------- CREATE FORM ----------
document.getElementById("newFormBtn").onclick = async () => {
  const title = prompt("Form name:");
  if (!title) return;

  // Choose folder
  const { data: folders } = await supabase.from("folders").select("id,name");
  let folder_id = null;
  if (folders.length) {
    const names = folders.map((f, i) => `${i + 1}. ${f.name}`).join("\n");
    const choice = prompt(`Where do you want to save this form?\n${names}\n(Type number or leave blank for unsorted)`);
    const idx = parseInt(choice);
    if (!isNaN(idx) && folders[idx - 1]) folder_id = folders[idx - 1].id;
  }

  const { error } = await supabase.from("forms").insert([{ title, folder_id }]);
  if (error) return alert("Error: " + error.message);
  await loadData();
};

// ---------- SEARCH ----------
document.getElementById("searchInput").addEventListener("input", async (e) => {
  const term = e.target.value.toLowerCase();
  const { data: folders } = await supabase.from("folders").select("*");
  const { data: forms } = await supabase.from("forms").select("*");
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(term));
  const filteredForms = forms.filter((f) => f.title.toLowerCase().includes(term));
  renderTable(filteredFolders, filteredForms);
});

// ---------- INIT ----------
loadData();
