document.addEventListener("DOMContentLoaded", function () {

  const list = document.getElementById("appointmentList");
  const calendarContainer = document.getElementById("calendarContainer");
  const upcomingTab = document.getElementById("upcomingTab");
  const pastTab = document.getElementById("pastTab");
  const countText = document.getElementById("upcomingCount");

  let tab = "upcoming";
  let currentMonth = new Date();
  let appointments = [];

  /* ================= BACKEND API ================= */

  async function fetchAppointments() {
    const res = await fetch("http://127.0.0.1:5000/appointments");
    appointments = await res.json();
  }

  async function deleteAppointment(id) {
    await fetch(`http://127.0.0.1:5000/appointments/${id}`, {
      method: "DELETE"
    });
    await fetchAppointments();
    render();
    renderCalendar();
  }

  /* ================= COUNTDOWN RING ================= */

  function createCountdownRing(app) {

    const totalDuration =
      new Date(app.date + "T" + app.time) -
      new Date(app.createdAt || app.date);

    const remaining =
      new Date(app.date + "T" + app.time) - new Date();

    const percent = Math.max(
      0,
      Math.min(100, (remaining / totalDuration) * 100)
    );

    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset =
      circumference - (percent / 100) * circumference;

    return `
      <div class="ring-wrapper">
        <svg width="70" height="70">
          <circle cx="35" cy="35" r="${radius}" stroke="#eee" stroke-width="6" fill="none"/>
          <circle cx="35" cy="35" r="${radius}"
            stroke="#22c55e"
            stroke-width="6"
            fill="none"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            transform="rotate(-90 35 35)"
            style="transition: stroke-dashoffset 1s linear"/>
        </svg>
        <div class="ring-text">
          ${formatTime(remaining)}
        </div>
      </div>
    `;
  }

  function formatTime(ms) {
    if (ms <= 0) return "Done";

    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days + "d";
    if (hours > 0) return hours + "h";
    return mins + "m";
  }

  /* ================= RENDER LIST ================= */

  function render() {

    const now = new Date();

    const upcoming = appointments
      .filter(a => new Date(a.date + "T" + a.time) >= now)
      .sort((a,b)=> new Date(a.date+"T"+a.time) - new Date(b.date+"T"+b.time));

    const past = appointments
      .filter(a => new Date(a.date + "T" + a.time) < now)
      .sort((a,b)=> new Date(b.date+"T"+b.time) - new Date(a.date+"T"+a.time));

    countText.innerText = upcoming.length + " upcoming";

    const display = tab === "upcoming" ? upcoming : past;

    list.innerHTML = "";

    if(display.length === 0){
      list.innerHTML = "<div class='card'>No appointments</div>";
      return;
    }

    display.forEach(app=>{

      const card=document.createElement("div");
      card.className="card";

      


      /* card.innerHTML = `
  <div class="appointment-header">
    <div>
      <h3>Dr. ${app.doctorName}</h3>
      <small>${app.specialty}</small>
      <div>📅 ${new Date(app.date+"T"+app.time).toLocaleString()}</div>
      <div>🏥 ${app.hospital}</div>
      <div>📝 ${app.notes}</div>
    </div>
    ${tab==="upcoming" ? createCountdownRing(app) : ""}
  </div>

    <div class="actions">
      <button 
        onclick="editApp('${app.id}')"
        style="background-color:#4CAF50;color:white;padding:8px 14px;border:none;border-radius:5px;cursor:pointer;margin:5px;"
      >
        Edit
      </button>
      <button 
        onclick="deleteApp('${app.id}')"
        style="background-color:#f44336;color:white;padding:8px 14px;border:none;border-radius:5px;cursor:pointer;margin:5px;"
      >
        Delete
      </button>
    </div>
  `; */



      card.innerHTML = `
  <div class="appointment-header" style="
    background: linear-gradient(135deg, #3a3acd 0%, #16213e 100%);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.08);
    font-family: 'Segoe UI', sans-serif;
    color: #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  ">
    <div style="display:flex; flex-direction:column; gap:8px;">

      <h3 style="
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 0.3px;
      ">👨‍⚕️ Dr. ${app.doctorName}</h3>

      <small style="
        background: rgba(99,179,237,0.15);
        color: #63b3ed;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        width: fit-content;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      ">${app.specialty}</small>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: 4px;
      ">
        <div style="font-size:0.85rem; color:#cbd5e0;">
          📅 <span style="color:#e2e8f0;">${new Date(app.date+"T"+app.time).toLocaleString()}</span>
        </div>
        <div style="font-size:0.85rem; color:#cbd5e0;">
          🏥 <span style="color:#e2e8f0;">${app.hospital}</span>
        </div>
        <div style="
          font-size:0.82rem;
          color:#a0aec0;
          background: rgba(255,255,255,0.05);
          padding: 6px 10px;
          border-radius: 8px;
          border-left: 3px solid #63b3ed;
          margin-top: 4px;
        ">📝 ${app.notes}</div>
      </div>

    </div>

    ${tab === "upcoming" ? createCountdownRing(app) : ""}
  </div>

  <div class="actions" style="
    display: flex;
    gap: 10px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.03);
    border-top: 1px solid rgba(255,255,255,0.06);
    border-radius: 0 0 16px 16px;
  ">
    <button
      onclick="editApp('${app.id}')"
      style="
        flex: 1;
        background: linear-gradient(135deg, #38a169, #2f855a);
        color: white;
        padding: 9px 0;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.88rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: opacity 0.2s;
        box-shadow: 0 4px 12px rgba(56,161,105,0.3);
      "
      onmouseover="this.style.opacity='0.85'"
      onmouseout="this.style.opacity='1'"
    >✏️ Edit</button>

    <button
      onclick="deleteApp('${app.id}')"
      style="
        flex: 1;
        background: linear-gradient(135deg, #e53e3e, #c53030);
        color: white;
        padding: 9px 0;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.88rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: opacity 0.2s;
        box-shadow: 0 4px 12px rgba(229,62,62,0.3);
      "
      onmouseover="this.style.opacity='0.85'"
      onmouseout="this.style.opacity='1'"
    >🗑️ Delete</button>
  </div>
`;




      list.appendChild(card);
    });
  }

  /* ================= CALENDAR ================= */

  function renderCalendar() {

    calendarContainer.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month+1, 0).getDate();

    const wrapper = document.createElement("div");
    wrapper.className = "card calendar";

    /* let html = `
      <div class="calendar-header">
        <button id="prevMonth">◀</button>
        <h3>${currentMonth.toLocaleString('default',{month:'long'})} ${year}</h3>
        <button id="nextMonth">▶</button>
      </div>
      <div class="calendar-grid">
    `; */



    let html = `
  <div class="calendar-header" style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #3a3acd 0%, #16213e 100%);
    padding: 16px 20px;
    border-radius: 16px 16px 0 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-family: 'Segoe UI', sans-serif;
  ">
    <button id="prevMonth" style="
      background: rgba(99,179,237,0.15);
      color: #63b3ed;
      border: 1px solid rgba(99,179,237,0.25);
      border-radius: 10px;
      width: 36px;
      height: 36px;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    "
      onmouseover="this.style.background='rgba(99,179,237,0.3)'"
      onmouseout="this.style.background='rgba(99,179,237,0.15)'"
    >◀</button>

    <h3 style="
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1px;
      text-transform: uppercase;
    ">📅 ${currentMonth.toLocaleString('default', { month: 'long' })} ${year}</h3>

    <button id="nextMonth" style="
      background: rgba(99,179,237,0.15);
      color: #63b3ed;
      border: 1px solid rgba(99,179,237,0.25);
      border-radius: 10px;
      width: 36px;
      height: 36px;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    "
      onmouseover="this.style.background='rgba(99,179,237,0.3)'"
      onmouseout="this.style.background='rgba(99,179,237,0.15)'"
    >▶</button>
  </div>

  <div class="calendar-grid" style="
    background: linear-gradient(135deg, #3a3acd 0%, #16213e 100%);
    border-radius: 0 0 16px 16px;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    font-family: 'Segoe UI', sans-serif;
  ">
`;







    for(let i=0;i<firstDay;i++) html+="<div></div>";

    for(let d=1; d<=totalDays; d++){

      const localDate = new Date(year, month, d);

      const dateStr =
        localDate.getFullYear() + "-" +
        String(localDate.getMonth()+1).padStart(2,'0') + "-" +
        String(localDate.getDate()).padStart(2,'0');

      const now = new Date();

      const hasApp = appointments.some(a => {
        const appDateTime = new Date(a.date + "T" + a.time);
        return a.date === dateStr && appDateTime >= now;
      });

      html+=`
        <div class="calendar-day ${hasApp?'has-app':''}">
          ${d}
        </div>
      `;
    }

    html+="</div>";
    wrapper.innerHTML = html;
    calendarContainer.appendChild(wrapper);

    document.getElementById("prevMonth").onclick = function(){
      currentMonth.setMonth(currentMonth.getMonth()-1);
      renderCalendar();
    }

    document.getElementById("nextMonth").onclick = function(){
      currentMonth.setMonth(currentMonth.getMonth()+1);
      renderCalendar();
    }
  }

  /* ================= DELETE / EDIT ================= */

  window.deleteApp = function(id){
    deleteAppointment(id);
  }

  window.editApp = function(id){
    window.location.href="add-appointment.html?edit="+id;
  }

  /* ================= TAB SWITCH ================= */

  upcomingTab.onclick=function(){
    tab="upcoming";
    upcomingTab.classList.add("active");
    pastTab.classList.remove("active");
    render();
  }

  pastTab.onclick=function(){
    tab="past";
    pastTab.classList.add("active");
    upcomingTab.classList.remove("active");
    render();
  }

  /* ================= INIT ================= */

  async function init(){
    await fetchAppointments();
    render();
    renderCalendar();
  }

  init();

  setInterval(()=>{
    render();
  },1000);

});