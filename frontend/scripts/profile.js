document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("profileForm");
    const profileView = document.getElementById("profileView");

    const API_URL = "http://127.0.0.1:5000/api/profile";

    async function loadProfile() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) return;

            const data = await res.json();
            if (Object.keys(data).length === 0) return;

            showProfile(data);
        } catch (err) {
            console.log("No profile yet");
        }
    }

    function showProfile(data) {

        form.classList.add("hidden");
        profileView.classList.remove("hidden");

        profileView.innerHTML = `
            <div class="view-section-title">Personal Information</div>

            <div class="view-grid">
                <div class="view-field">
                    <div class="field-label">Name</div>
                    <div class="field-value">${data.name || "-"}</div>
                </div>

                <div class="view-field">
                    <div class="field-label">Email</div>
                    <div class="field-value">${data.email || "-"}</div>
                </div>

                <div class="view-field">
                    <div class="field-label">Mobile</div>
                    <div class="field-value">${data.mobile || "-"}</div>
                </div>

                <div class="view-field">
                    <div class="field-label">DOB</div>
                    <div class="field-value">${data.dob || "-"}</div>
                </div>

                <div class="view-field">
                    <div class="field-label">Height</div>
                    <div class="field-value">${data.height || "-"} cm</div>
                </div>

                <div class="view-field">
                    <div class="field-label">Weight</div>
                    <div class="field-value">${data.weight || "-"} kg</div>
                </div>
            </div>

            <div class="view-section-title">Health Information</div>

            <div class="view-field">
                <div class="field-label">Allergies</div>
                <div class="field-value">${data.allergies || "-"}</div>
            </div>

            <div class="view-field">
                <div class="field-label">Conditions</div>
                <div class="field-value">${data.conditions || "-"}</div>
            </div>

            <div class="view-field">
                <div class="field-label">Medications</div>
                <div class="field-value">${data.medications || "-"}</div>
            </div>

            <button class="edit-btn" id="editProfile">Edit Profile</button>
        `;

        document.getElementById("editProfile").addEventListener("click", () => {
            profileView.classList.add("hidden");
            form.classList.remove("hidden");

            Object.keys(data).forEach(key => {
                if (form.elements[key]) {
                    form.elements[key].value = data[key];
                }
            });
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        showProfile(data);
    });

    loadProfile();
});