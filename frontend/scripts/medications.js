document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // INPUT ELEMENTS
    // ==============================
    const nameInput = document.getElementById("name");
    const dosageInput = document.getElementById("dosage");
    const frequencyInput = document.getElementById("frequency");
    const foodTimingInput = document.getElementById("foodTiming");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const reminderTimeInput = document.getElementById("reminderTime");

    const form = document.getElementById("medForm");
    const medList = document.getElementById("medList");
    const timeline = document.getElementById("timeline");

    const popup = document.getElementById("reminderPopup");
    const popupMedName = document.getElementById("popupMedName");
    const takenBtn = document.getElementById("takenBtn");
    const snoozeBtn = document.getElementById("snoozeBtn");

    // ==============================
    // DATA
    // ==============================
    let medications = [];
    let editMode = false;
    let editId = null;

    const API_URL = "http://127.0.0.1:5000/medications";

    // ==============================
    // LOAD FROM BACKEND
    // ==============================
    async function loadMedications() {
        const res = await fetch(API_URL);
        medications = await res.json();
        render();
    }

    // ==============================
    // ADD OR UPDATE MEDICATION
    // ==============================
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const timingChecks = document.querySelectorAll(".timing-select input:checked");
        const timings = Array.from(timingChecks).map(c => c.value);

        if (timings.length === 0) {
            alert("Please select at least one timing.");
            return;
        }

        const med = {
            id: editMode ? editId : Date.now(),
            name: nameInput.value.trim(),
            dosage: dosageInput.value.trim(),
            frequency: frequencyInput.value,
            timings: timings,
            foodTiming: foodTimingInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            reminderTime: reminderTimeInput.value
        };

        if (editMode) {
            await fetch(`${API_URL}/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(med)
            });
            editMode = false;
            editId = null;
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(med)
            });
        }

        form.reset();
        loadMedications();
    });

    // ==============================
    // RENDER UI
    // ==============================
    function render() {

        medList.innerHTML = "";
        timeline.innerHTML = "";

        const today = new Date().toISOString().split("T")[0];

        // ------------------------------
        // MEDICATION LIST
        // ------------------------------
        medications.forEach(med => {

            const card = document.createElement("div");
            card.className = "med-card";

            card.innerHTML = `
                <div class="med-header">
                    <div>
                        <strong>${med.name}</strong><br>
                        <small>${med.dosage}</small>
                    </div>
                    <div>
                        <i class="fa fa-edit edit-btn" data-id="${med.id}"></i>
                        <i class="fa fa-trash delete-btn" data-id="${med.id}"></i>
                    </div>
                </div>

                <div class="med-details">
                    ${med.timings.join(", ")} (${med.foodTiming} food)<br>
                    ⏰ ${med.reminderTime} daily<br>
                    📅 ${med.startDate} → ${med.endDate}
                </div>
            `;

            medList.appendChild(card);
        });

        // ------------------------------
        // TIMELINE VIEW
        // ------------------------------
        const timingOrder = ["morning", "afternoon", "night"];

        timingOrder.forEach(time => {

            const section = document.createElement("div");
            section.className = "timeline-section";
            section.innerHTML = `<h3 class="timeline-title">${time.toUpperCase()}</h3>`;

            const activeMeds = medications.filter(m =>
                m.timings.includes(time) &&
                m.startDate <= today &&
                m.endDate >= today
            );

            if (activeMeds.length === 0) {
                section.innerHTML += `<p class="no-med">No medications</p>`;
            }

            activeMeds.forEach(med => {

                let status = "pending";

                // ✅ PERMANENT STATUS FROM BACKEND
                if (med.status && med.status[today]) {
                    status = med.status[today];
                }

                const item = document.createElement("div");
                item.className = "timeline-item";

                item.innerHTML = `
                    <span>${med.name}</span>
                    <span class="status ${status}">
                        ${status === "taken" ? "✅ Taken" :
                          status === "missed" ? "❌ Missed" :
                          "⏰ Pending"}
                    </span>
                `;

                section.appendChild(item);
            });

            timeline.appendChild(section);
        });
    }

    // ==============================
    // DELETE & EDIT HANDLER
    // ==============================
    document.addEventListener("click", async function (e) {

        if (e.target.classList.contains("delete-btn")) {
            const id = Number(e.target.dataset.id);
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            loadMedications();
        }

        if (e.target.classList.contains("edit-btn")) {
            const id = Number(e.target.dataset.id);
            const med = medications.find(m => m.id === id);
            if (!med) return;

            nameInput.value = med.name;
            dosageInput.value = med.dosage;
            frequencyInput.value = med.frequency;
            foodTimingInput.value = med.foodTiming;
            startDateInput.value = med.startDate;
            endDateInput.value = med.endDate;
            reminderTimeInput.value = med.reminderTime;

            document.querySelectorAll(".timing-select input").forEach(cb => {
                cb.checked = med.timings.includes(cb.value);
            });

            editMode = true;
            editId = id;
        }
    });

    // ==============================
    // KEEP AUTO REFRESH
    // ==============================
    setInterval(loadMedications, 3000);

    loadMedications();
});