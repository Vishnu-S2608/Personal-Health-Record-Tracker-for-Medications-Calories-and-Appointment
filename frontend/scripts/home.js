/* ═══════════════════════════════════════════════════════════
   HEALTH TRACKER — home.js

   Data sources (mirrors your existing files exactly):
   ┌──────────────┬─────────────────────────────────────────┐
   │ Medications  │ GET http://127.0.0.1:5000/medications   │
   │ Med status   │ localStorage "medLogs"                  │
   │ Appointments │ GET http://127.0.0.1:5000/appointments  │
   │ Calories     │ localStorage "foodLogs"  (calories.js)  │
   │              │   entry shape: {date, calories, qty,    │
   │              │    mealType, foodName}                  │
   │ Calorie goal │ hardcoded 2000 kcal  (calories.js L.2)  │
   └──────────────┴─────────────────────────────────────────┘
═══════════════════════════════════════════════════════════ */

const API = "http://127.0.0.1:5000";
const CALORIE_GOAL = 2000; // matches calories.js `const goal = 2000`

/* ── Health Tips ───────────────────────────────────────── */
const TIPS = [
  "Staying hydrated improves concentration and helps your body process medications effectively.",
  "A 10-minute walk after meals can significantly improve blood sugar regulation.",
  "Logging meals consistently is one of the most evidence-backed habits for health.",
  "Never skip a scheduled medication. Set reminders and keep your tracker up to date.",
  "Regular doctor check-ups catch issues early — prevention beats treatment every time.",
  "5 minutes of breathing exercises daily can measurably reduce cortisol levels.",
  "Eating slowly helps your body register fullness and reduces unnecessary intake.",
  "Sleep quality directly affects how your body absorbs and processes medication.",
];

/* ─────────────────────────────────────────────────────────
   SECTION 1 — UI Helpers (no data dependencies)
───────────────────────────────────────────────────────── */

function setGreeting() {
  const h = new Date().getHours();
  const text = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  const el = document.getElementById("greeting");
  if (el) el.textContent = text;
}

function setDate() {
  const el = document.getElementById("today-date");
  if (el) el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function updateClock() {
  const el = document.getElementById("live-time");
  if (!el) return;
  const n = new Date();
  el.textContent =
    n.getHours().toString().padStart(2, "0") + ":" +
    n.getMinutes().toString().padStart(2, "0");
}

/* function setUsername() {
  const el = document.getElementById("username");
  if (!el) return;
  const name = localStorage.getItem("userName") || "User";
  el.innerHTML = `${name} <span class="wave">👋</span>`;
} */

function setUsername() {
  const textEl = document.getElementById("username-text");
  const editHint = document.querySelector(".edit-hint");
  if (!textEl) return;

  // Load saved name
  const saved = localStorage.getItem("userName") || "User";
  textEl.textContent = saved;

  // Click the name or pencil icon to edit
  [textEl, editHint].forEach(el => {
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", () => startEdit(textEl));
  });
}

function startEdit(textEl) {
  const current = textEl.textContent.trim();

  // Replace text with inline input
  const input = document.createElement("input");
  input.type = "text";
  input.value = current;
  input.className = "username-input";
  input.maxLength = 24;

  textEl.replaceWith(input);
  input.focus();
  input.select();

  function save() {
    const newName = input.value.trim() || "User";
    localStorage.setItem("userName", newName);

    const span = document.createElement("span");
    span.id = "username-text";
    span.textContent = newName;
    span.style.cursor = "pointer";
    span.addEventListener("click", () => startEdit(span));
    input.replaceWith(span);
  }

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); input.blur(); }
    if (e.key === "Escape") { input.value = current; input.blur(); }
  });
  input.addEventListener("blur", save);
}

function setHealthTip() {
  const el = document.getElementById("health-tip");
  if (el) el.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
}

/* Animated number count-up */
function animateCount(el, target, duration = 900) {
  if (!el) return;
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(target * e);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(performance.now());
}

/* ─────────────────────────────────────────────────────────
   SECTION 2 — MEDICATIONS
   Source: GET /medications  +  localStorage "medLogs"
   Status logic is a direct copy of medications.js render()
───────────────────────────────────────────────────────── */
async function loadMedications() {
  const container = document.getElementById("medication-list");
  const statEl    = document.getElementById("active-meds");

  let medications = [];

  try {
    const res = await fetch(`${API}/medications`);
    if (!res.ok) throw new Error(res.status);
    medications = await res.json();
  } catch {
    if (container) container.innerHTML = errorState("Could not reach server. Is Flask running?");
    if (statEl) statEl.textContent = "!";
    return;
  }

  /* ── Identical filtering logic to medications.js ── */
  const today   = new Date().toISOString().split("T")[0];
  const hourNow = new Date().getHours();
  const logs    = JSON.parse(localStorage.getItem("medLogs")) || []; // same key as medications.js

  // Active today = startDate <= today <= endDate
  const activeMeds = medications.filter(m => m.startDate <= today && m.endDate >= today);

  if (statEl) animateCount(statEl, activeMeds.length);

  if (!container) return;

  if (activeMeds.length === 0) {
    container.innerHTML = emptyState("fa-pills", "No medications scheduled for today.");
    return;
  }

  /* Status mirrors medications.js exactly */
  const threshold   = { morning: 12, afternoon: 18, night: 23 }; // same as medications.js
  const timingOrder = ["morning", "afternoon", "night"];
  const timingEmoji = { morning: "☀️", afternoon: "🌤️", night: "🌙" };

  const rows = [];
  timingOrder.forEach(time => {
    activeMeds.filter(m => m.timings.includes(time)).forEach(med => {
      const log = logs.find(l => l.medId === med.id && l.date === today && l.timing === time);

      let status = "pending";
      if (log?.status === "taken")       status = "taken";
      else if (hourNow > threshold[time]) status = "missed";

      rows.push({ med, time, status });
    });
  });

  const shown = rows.slice(0, 10);
  const extra = rows.length - shown.length;

  const badge = {
    taken:   `<span class="med-status taken-badge"><i class="fa-solid fa-check"></i> Taken</span>`,
    missed:  `<span class="med-status missed-badge"><i class="fa-solid fa-xmark"></i> Missed</span>`,
    pending: `<span class="med-status pending-badge"><i class="fa-solid fa-clock"></i> Pending</span>`,
  };

  container.innerHTML =
    shown.map(({ med, time, status }) => `
      <div class="med-item med-item--${status}">
        <span class="med-dot med-dot--${status}"></span>
        <span class="med-name">${med.name}<small class="med-dosage">${med.dosage}</small></span>
        <span class="med-timing-tag">${timingEmoji[time]} ${time}</span>
        ${badge[status]}
      </div>
    `).join("") +
    (extra > 0
      ? `<a href="medications.html" class="see-more-link">
           +${extra} more &nbsp;·&nbsp; View full list
           <i class="fa-solid fa-arrow-right"></i>
         </a>`
      : "");
}

/* ─────────────────────────────────────────────────────────
   SECTION 3 — APPOINTMENTS
   Source: GET /appointments
   Field names match appointments.js: doctorName, date,
   time, hospital, specialty, notes
───────────────────────────────────────────────────────── */
async function loadAppointments() {
  const container = document.getElementById("appointment-box");
  const statEl    = document.getElementById("appt-count");

  let appointments = [];

  try {
    const res = await fetch(`${API}/appointments`);
    if (!res.ok) throw new Error(res.status);
    appointments = await res.json();
  } catch {
    if (container) container.innerHTML = errorState("Could not load appointments.");
    if (statEl) statEl.textContent = "!";
    return;
  }

  /* upcoming = same filter as appointments.js render() */
  const now = new Date();
  const upcoming = appointments
    .filter(a => new Date(a.date + "T" + a.time) >= now)
    .sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time));

  if (statEl) animateCount(statEl, upcoming.length);

  if (!container) return;

  if (upcoming.length === 0) {
    container.innerHTML = emptyState("fa-calendar-check", "No upcoming appointments.");
    return;
  }

  const shown = upcoming.slice(0, 10);
  const extra = upcoming.length - shown.length;

  container.innerHTML =
    shown.map(appt => {
      const d     = new Date(appt.date + "T" + appt.time);
      const day   = d.getDate();
      const month = d.toLocaleString("en-US", { month: "short" });
      return `
        <div class="appt-item">
          <div class="appt-date-block">
            <div class="appt-day">${day}</div>
            <div class="appt-month">${month}</div>
          </div>
          <div class="appt-info">
            <div class="appt-doctor">Dr. ${appt.doctorName}</div>
            <div class="appt-specialty">
              ${appt.specialty || ""}${appt.hospital ? " · " + appt.hospital : ""}
            </div>
          </div>
          <span class="appt-time-badge">${appt.time || ""}</span>
        </div>
      `;
    }).join("") +
    (extra > 0
      ? `<a href="appointments.html" class="see-more-link">
           +${extra} more &nbsp;·&nbsp; View all
           <i class="fa-solid fa-arrow-right"></i>
         </a>`
      : "");
}

/* ─────────────────────────────────────────────────────────
   SECTION 4 — CALORIES
   Source: localStorage "foodLogs"  (exact key from calories.js)
   Shape:  [{id, date, mealType, foodName, calories, quantity, unit}]
   Total:  calories * quantity  per entry  (same as calories.js render())
   Goal:   2000 kcal  (same as calories.js `const goal = 2000`)
───────────────────────────────────────────────────────── */
function loadCalories() {
  const statEl = document.getElementById("today-calories");

  const today   = new Date().toISOString().split("T")[0];
  const allLogs = JSON.parse(localStorage.getItem("foodLogs")) || []; // exact key from calories.js
  const dayLogs = allLogs.filter(l => l.date === today);

  /* Same formula as calories.js: calories * quantity */
  const totalCal = dayLogs.reduce((sum, l) => sum + (l.calories * l.quantity), 0);
  const remaining = Math.max(0, CALORIE_GOAL - totalCal);
  const pct = Math.min(100, (totalCal / CALORIE_GOAL) * 100);

  /* ── Stat card ── */
  if (statEl) animateCount(statEl, totalCal, 800);

  /* ── Ring ── */
  const ringEl = document.getElementById("calorie-ring-fill");
  if (ringEl) setTimeout(() => {
    ringEl.style.strokeDashoffset = 314 * (1 - pct / 100);
  }, 300);

  /* ── Number inside ring ── */
  const numEl = document.getElementById("calorie-number");
  if (numEl) animateCount(numEl, totalCal, 900);

  /* ── Bar ── */
  const fillEl = document.getElementById("progress-fill");
  if (fillEl) setTimeout(() => { fillEl.style.width = pct + "%"; }, 300);

  /* ── Labels ── */
  const consEl = document.getElementById("calorie-consumed-label");
  const remEl  = document.getElementById("remaining-calories");
  if (consEl) consEl.textContent = totalCal + " kcal";
  if (remEl)  remEl.textContent  = remaining + " kcal";

  /* ── Meal breakdown badges ── */
  const mealOrder  = ["breakfast", "lunch", "dinner", "snack"];
  const mealEmoji  = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
  const breakdownEl = document.getElementById("meal-breakdown");

  if (breakdownEl) {
    const mealTotals = {};
    mealOrder.forEach(m => {
      mealTotals[m] = dayLogs
        .filter(l => l.mealType === m)
        .reduce((s, l) => s + l.calories * l.quantity, 0);
    });

    breakdownEl.innerHTML = mealOrder.map(m => {
      const kcal = mealTotals[m];
      return `
        <span class="meal-badge ${kcal > 0 ? "has-food" : ""}">
          ${mealEmoji[m]} ${m.charAt(0).toUpperCase() + m.slice(1)}
          ${kcal > 0 ? `· ${kcal} kcal` : ""}
        </span>`;
    }).join("");
  }
}

/* ─────────────────────────────────────────────────────────
   SECTION 5 — Template helpers
───────────────────────────────────────────────────────── */
function emptyState(icon, text) {
  return `<div class="empty-state">
    <i class="fa-solid ${icon}"></i>
    <span>${text}</span>
  </div>`;
}

function errorState(text) {
  return `<div class="empty-state error">
    <i class="fa-solid fa-triangle-exclamation"></i>
    <span>${text}</span>
  </div>`;
}

/* ─────────────────────────────────────────────────────────
   MAIN INIT
───────────────────────────────────────────────────────── */
async function initHomePage() {
  /* Instant — no network needed */
  setGreeting();
  setDate();
  updateClock();
  setHealthTip();
  setUsername();
  setInterval(updateClock, 30000);

  /* Calories live in localStorage — synchronous & instant */
  loadCalories();

  /* Medications & appointments both need the Flask API — run in parallel */
  await Promise.all([
    loadMedications(),
    loadAppointments(),
  ]);
}

/* Boot */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomePage);
} else {
  initHomePage();
}