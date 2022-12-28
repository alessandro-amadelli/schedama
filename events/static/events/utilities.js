document.addEventListener('DOMContentLoaded', () => {
    let currentMode = localStorage.getItem("currentMode");
    setMode(currentMode);

    document.querySelector("#darkModeToggle").addEventListener('click', () => {
        toggleMode();
    });
});

function toggleMode() {
    let currentMode = localStorage.getItem("currentMode");

    if (currentMode == "dark") {
        currentMode = "light";
    } else {
        currentMode = "dark";
    }

    setMode(currentMode);
}

function setMode(currentMode) {
    if (!currentMode) {
        currentMode = "light";
    }

    // DOM Elements
    let body = document.querySelector("body");
    const navbar = document.querySelector("nav");

    if (currentMode == "dark") {
        // Activate light mode

        // Applying class to body
        body.classList.remove("dark-mode");

        // Navbar class change
        navbar.classList.remove("navbar-dark");
        navbar.classList.add("navbar-light");

        document.querySelector("#darkModeToggle").querySelector("span").innerText = "dark_mode";
    } else {
        // Activate dark mode

        // Applying class to body
        body.classList.add("dark-mode");

        // Navbar class change
        navbar.classList.remove("navbar-light");
        navbar.classList.add("navbar-dark");

        document.querySelector("#darkModeToggle").querySelector("span").innerText = "light";
    }
    // Saving new current mode to localStorage
    localStorage.setItem("currentMode", currentMode);
}