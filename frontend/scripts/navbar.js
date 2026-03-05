document.addEventListener("DOMContentLoaded", function () {

    fetch("navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-container").innerHTML = data;
            setActiveNav();
        });

    function setActiveNav() {

        const path = window.location.pathname.toLowerCase();

        let currentPage = "";

        if (path.includes("home")) currentPage = "home";
        if (path.includes("medications")) currentPage = "medications";
        if (path.includes("calories")) currentPage = "calories";
        if (path.includes("appointments")) currentPage = "appointments";
        if (path.includes("profile")) currentPage = "profile";

        const navItems = document.querySelectorAll(".nav-item");

        navItems.forEach(item => {
            if (item.dataset.page === currentPage) {
                item.classList.add("active");
            }
        });
    }

});