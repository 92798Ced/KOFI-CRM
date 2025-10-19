/* jayvee.js — CRM Copilot Assistant (visual workflow builder, full version)
   Author: Gav x ChatGPT
   Features:
   - Floating chat bubble (above zoom)
   - Random greetings
   - GPT-4o-mini powered workflow builder
   - JSON auto-extraction + fallback
   - Visual refresh + optional action expansion
*/

class JayveeAssistant {
  constructor(context) {
    this.name = "Jayvee";
    this.ctx = context;
    console.log(`${this.name} initialized 🤖`);
  }

  /* 🧩 Explain current workflow */
  async explain() {
    const { workflow } = this.ctx;
    if (!workflow.trigger && !workflow.actions.length)
      return "No workflow yet! Let's start with a trigger like 'Form Submitted'.";

    let desc = `Workflow **${document.getElementById("workflowName")?.textContent || "Untitled"}**:\n\n`;
    if (workflow.trigger) desc += `🟣 Trigger: ${workflow.trigger.label}\n`;
    if (workflow.actions.length) {
      desc += `\nThen:\n`;
      workflow.actions.forEach((a, i) => {
        desc += ` ${i + 1}. ${a.label}${a.config ? " (configured)" : ""}\n`;
      });
    }
    return desc;
  }

  /* 🧠 Create simple action manually */
  async createAutomation(instruction) {
    const { workflow, renderFlow, iconFor, showToast } = this.ctx;
    const id = "a_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    const key = "send_email";
    const action = {
      id,
      key,
      label: "Send Email",
      icon: iconFor(key),
      config: { subject: "AI-Generated Automation", body: instruction }
    };
    workflow.actions.push(action);
    this.refreshCanvas();
    showToast?.();
    console.log(`${this.name} created automation step from: "${instruction}"`);
  }

  /* 🔘 Set a trigger */
  async setTrigger(label) {
    const { workflow, iconForTrigger } = this.ctx;
    workflow.trigger = { key: "form_submitted", label, icon: iconForTrigger(), config: {} };
    this.refreshCanvas();
    console.log(`${this.name} set trigger: ${label}`);
  }

  /* ⚙️ Main GPT-based builder */
  async generateAutomationFromText(prompt) {
  const API_KEY = "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"; // replace with your key

    const editorContext = `
Available triggers:
form_submitted, contact_created, contact_changed, birthday, webhook_in,
scheduler, email_events, customer_replied, survey_submitted, trigger_link

Available actions:
send_email, send_sms, call, voicemail, slack, messenger, instagram_dm, wait,
add_tag, remove_tag, if_else, goal, split, goto, create_contact, find_contact,
update_field, assign_user, remove_assigned, toggle_dnd, add_note

Output ONLY JSON like:
{
  "trigger": {"key": "form_submitted", "label": "Form Submitted"},
  "actions": [
    {"key": "send_email", "label": "Send Email",
      "config": {"subject":"Welcome!","body":"Hi there!"}},
    {"key":"wait","label":"Wait 1 Day",
      "config":{"duration":"1","unit":"days"}},
    {"key":"add_tag","label":"Add Contact Tag",
      "config":{"tag":"Lead"}}
  ]
}`;

    // --- GPT request ---
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Jayvee, an automation builder that returns pure JSON using the editor schema." },
          { role: "user", content: editorContext },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const data = await res.json();
    let text = data?.choices?.[0]?.message?.content || "{}";

    // --- Extract JSON safely ---
    const match = text.match(/\{[\s\S]*\}/);
    if (match) text = match[0];

    let plan;
    try {
      plan = JSON.parse(text);
    } catch {
      console.warn("⚠️ GPT returned invalid JSON, fallback used.", text);
      plan = {
        trigger: { key: "form_submitted", label: "Form Submitted" },
        actions: [
          {
            key: "send_email",
            label: "Send Email",
            config: { subject: "Auto Message", body: prompt }
          }
        ]
      };
    }

    // --- Apply to workflow ---
    const { workflow, iconFor, iconForTrigger } = this.ctx;

    workflow.trigger = {
      key: plan.trigger?.key || "form_submitted",
      label: plan.trigger?.label || "Form Submitted",
      icon: iconForTrigger(),
      config: plan.trigger?.config || {}
    };

    const actions = Array.isArray(plan.actions) && plan.actions.length
      ? plan.actions
      : [
          {
            key: "send_email",
            label: "Send Email",
            config: { subject: "Welcome!", body: "Thanks for signing up!" }
          }
        ];

    workflow.actions = actions.map(a => ({
      id: "a_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
      key: a.key,
      label: a.label,
      icon: iconFor(a.key),
      config: a.config || {}
    }));

    // --- Visually rebuild ---
    this.refreshCanvas();

    // optional: auto-expand first node
    if (window.openActionDrawer && workflow.actions[0]) {
      setTimeout(() => window.openActionDrawer(workflow.actions[0].id), 800);
    }

    const summary = `✅ Added trigger: ${workflow.trigger.label}  
and ${workflow.actions.length} action${workflow.actions.length !== 1 ? "s" : ""}.`;
    console.log("✅ Workflow built:", plan);
    return summary;
  }

  /* 🔄 Refresh visuals */
  refreshCanvas() {
    const { hydrateTriggerUI, renderFlow } = this.ctx;
    hydrateTriggerUI?.();
    renderFlow?.();
    const c = document.getElementById("canvas");
    if (c) c.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ---------- 💬 Chat Bubble + GPT UI ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "sk-YOUR_OPENAI_API_KEY_HERE"; // replace with your key

  /* --- Elements --- */
  const bubble = document.createElement("div");
  bubble.id = "jayveeBubble";
  bubble.innerHTML = "💬";
  document.body.appendChild(bubble);

  const chat = document.createElement("div");
  chat.id = "jayveeChat";
  chat.innerHTML = `
    <div class="jayvee-header">🤖 Jayvee Assistant</div>
    <div class="jayvee-messages"></div>
    <div class="jayvee-input">
      <input type="text" placeholder="Ask Jayvee..." />
      <button>▶</button>
    </div>
  `;
  document.body.appendChild(chat);

  /* --- Styles --- */
  const style = document.createElement("style");
  style.textContent = `
    #jayveeBubble {
      position: fixed;
      bottom: 100px; left: 25px;
      background: #4f46e5; color: #fff;
      width: 60px; height: 60px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; cursor: pointer;
      box-shadow: 0 6px 18px rgba(0,0,0,.25);
      z-index: 9999; transition: transform .2s;
    }
    #jayveeBubble:hover { transform: scale(1.1); }

    #jayveeChat {
      position: fixed;
      bottom: 180px; left: 25px;
      width: 340px; height: 460px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 10px 24px rgba(0,0,0,.2);
      display: none; flex-direction: column;
      overflow: hidden; z-index: 9999;
      font-family: Inter, system-ui, sans-serif;
    }

    .jayvee-header {
      background: #4f46e5; color: #fff;
      padding: 10px 14px;
      font-weight: 700;
      font-size: .95rem;
    }

    .jayvee-messages {
      flex: 1; padding: 14px;
      overflow-y: auto;
      font-size: .9rem; color: #111827;
      display: flex; flex-direction: column; gap: 8px;
      line-height: 1.45;
    }

    .jayvee-input {
      display: flex;
      border-top: 1px solid #e5e7eb;
    }

    .jayvee-input input {
      flex: 1;
      border: none;
      outline: none;
      padding: 12px;
      font-size: .9rem;
    }

    .jayvee-input button {
      border: none;
      background: #4f46e5;
      color: #fff;
      padding: 0 14px;
      cursor: pointer;
      font-weight: bold;
    }

    .jayvee-msg {
      margin-bottom: 6px;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .jayvee-msg.you {
      text-align: right; color: #4f46e5; padding-left: 30px;
    }

    .jayvee-msg.ai {
      text-align: left;
      background:#f3f4f6;
      border-radius:10px;
      padding:8px 12px;
      display:inline-block;
      max-width:80%;
      word-wrap:break-word;
    }
  `;
  document.head.appendChild(style);

  /* --- Chat Logic --- */
  const msgs = chat.querySelector(".jayvee-messages");
  const input = chat.querySelector("input");
  const sendBtn = chat.querySelector("button");

  bubble.addEventListener("click", () => {
    chat.style.display = chat.style.display === "flex" ? "none" : "flex";
  });

  const greetings = [
    "Hey there! Need help setting up a workflow?",
    "👋 Hi! I'm Jayvee — your automation assistant.",
    "Need an automation fast? Let's build one!",
    "Yo! Want me to add a trigger or an action?",
    "✨ Ready to make some CRM magic?"
  ];
  appendMsg("ai", greetings[Math.floor(Math.random() * greetings.length)]);

  sendBtn.addEventListener("click", handleMsg);
  input.addEventListener("keypress", e => { if (e.key === "Enter") handleMsg(); });

  function appendMsg(sender, text) {
    const div = document.createElement("div");
    div.className = "jayvee-msg " + (sender === "you" ? "you" : "ai");
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function handleMsg() {
    const text = input.value.trim();
    if (!text) return;
    appendMsg("you", text);
    input.value = "";
    appendMsg("ai", "Thinking... 🤔");
    const thinking = msgs.lastElementChild;

    try {
      if (text.toLowerCase().includes("create") && text.toLowerCase().includes("automation")) {
        thinking.textContent = "⚙️ Building your automation...";
        const status = await window.jayvee?.generateAutomationFromText(text);
        thinking.remove();
        appendMsg("ai", status || "Done!");
        return;
      }

      if (text.toLowerCase().includes("explain")) {
        thinking.textContent = "📄 Let me summarize that...";
        const summary = await window.jayvee?.explain();
        thinking.remove();
        appendMsg("ai", summary);
        return;
      }

      if (text.toLowerCase().includes("trigger")) {
        thinking.textContent = "🟣 Adding a trigger...";
        window.jayvee?.setTrigger("Form Submitted");
        thinking.remove();
        appendMsg("ai", "Trigger added!");
        return;
      }

      const reply = await fetchChatGPT(text);
      thinking.remove();
      appendMsg("ai", reply);

    } catch (err) {
      thinking.textContent = "⚠️ Error connecting to AI.";
      console.error(err);
    }
  }

  async function fetchChatGPT(message) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Jayvee, a friendly CRM assistant. Keep replies short and practical." },
          { role: "user", content: message }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || "Hmm, no response right now.";
  }
});
