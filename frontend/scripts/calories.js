document.addEventListener("DOMContentLoaded", function () {

    const goal = 2500;
    const waterGoal = 2000;

    const ring = document.getElementById("calorieRing");
    const circumference = 2 * Math.PI * 70;

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;

    document.getElementById("dailyGoalText").innerText = `Daily goal: ${goal} kcal`;

    let selectedDate = new Date();

    /* ============================= */
    /* UTILITIES */
    /* ============================= */

    function formatDate(date) {
        return date.toISOString().split("T")[0];
    }

    function loadLogs() {
        return JSON.parse(localStorage.getItem("foodLogs")) || [];
    }

    function saveLogs(logs) {
        localStorage.setItem("foodLogs", JSON.stringify(logs));
    }

    function loadWater() {
        return JSON.parse(localStorage.getItem("waterLogs")) || {};
    }

    function saveWater(data) {
        localStorage.setItem("waterLogs", JSON.stringify(data));
    }

    /* ============================= */
    /* MAIN RENDER */
    /* ============================= */

    function render() {

        const logs = loadLogs();
        const dateStr = formatDate(selectedDate);
        const dayLogs = logs.filter(l => l.date === dateStr);

        const totalCal = dayLogs.reduce((sum, l) => sum + (l.calories * l.quantity), 0);
        const remaining = Math.max(0, goal - totalCal);
        const pct = Math.min(100, (totalCal / goal) * 100);

        document.getElementById("totalCalories").innerText = totalCal;
        document.getElementById("remainingCalories").innerText = remaining;
        document.getElementById("ringCalories").innerText = totalCal;

        const offset = circumference - (pct / 100) * circumference;
        ring.style.strokeDashoffset = offset;

        renderMeals(dayLogs);
        renderWater();
    }

    /* ============================= */
    /* WATER TRACKER */
    /* ============================= */

    function renderWater() {

        const waterData = loadWater();
        const dateStr = formatDate(selectedDate);

        let amount = waterData[dateStr] || 0;

        document.getElementById("waterAmount").innerText = amount;

        const pct = Math.min(100, (amount / waterGoal) * 100);
        document.getElementById("waterFill").style.width = pct + "%";
    }

    document.querySelectorAll(".water-btn").forEach(btn => {
        btn.addEventListener("click", function () {

            const waterData = loadWater();
            const dateStr = formatDate(selectedDate);

            if (!waterData[dateStr]) waterData[dateStr] = 0;

            if (this.classList.contains("reset")) {
                waterData[dateStr] = 0;
            } else {
                const amount = parseInt(this.dataset.amount);
                waterData[dateStr] += amount;
            }

            saveWater(waterData);
            renderWater();
        });
    });

    /* ============================= */
    /* MEALS RENDER */
    /* ============================= */

    function renderMeals(dayLogs) {

        const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
        dayLogs.forEach(log => meals[log.mealType].push(log));

        const container = document.getElementById("mealGroups");
        container.innerHTML = "";

        Object.keys(meals).forEach(meal => {

            const card = document.createElement("div");
            card.className = "card meal-card";

            const total = meals[meal]
                .reduce((s, l) => s + l.calories * l.quantity, 0);

            card.innerHTML = `<h3>${meal.toUpperCase()} - ${total} kcal</h3>`;

            if (meals[meal].length === 0) {
                card.innerHTML += `<p>No food logged</p>`;
            } else {
                meals[meal].forEach(item => {

                    const div = document.createElement("div");
                    div.className = "food-item";

                    div.innerHTML = `
                        ${item.foodName} (${item.quantity} ${item.unit || ""})
                        <span>
                            ${item.calories * item.quantity} kcal
                            <span class="delete-btn" data-id="${item.id}">🗑</span>
                        </span>
                    `;

                    card.appendChild(div);
                });
            }

            container.appendChild(card);
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                let logs = loadLogs();
                logs = logs.filter(l => l.id != this.dataset.id);
                saveLogs(logs);
                render();
            });
        });
    }

    render();

});