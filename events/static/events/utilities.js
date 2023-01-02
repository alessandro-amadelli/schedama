document.addEventListener('DOMContentLoaded', () => {
    // let currentMode = localStorage.getItem("currentMode");
    // setMode(currentMode);

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
    let navbar = document.querySelector("nav");

    if (currentMode == "light") {
        // Activate light mode

        // Applying class to body
        body.classList.remove("dark-mode");

        // Changing meta tag color-scheme
        document.querySelector('meta[name="color-scheme"]').setAttribute('content', 'light');

        // Navbar class change
        navbar.classList.remove("navbar-dark");

        // Icon of dark mode toggle
        document.querySelector("#darkModeToggle").querySelector("span").innerText = "dark_mode";

        // Change all buttons with btn-dark class
        document.querySelectorAll(".btn-dark").forEach((item) => {
            item.classList.remove("btn-dark");
            item.classList.add("btn-light");
        });

        // Change all tables
        document.querySelectorAll(".table-dark").forEach((table) => {
            table.classList.remove("table-dark");
        });

    } else {
        // Activate dark mode

        // Applying class to body
        body.classList.add("dark-mode");

        // Changing meta tag color-scheme
        document.querySelector('meta[name="color-scheme"]').setAttribute('content', 'dark');

        // Navbar class change
        navbar.classList.add("navbar-dark");

        // Icon of dark mode toggle
        document.querySelector("#darkModeToggle").querySelector("span").innerText = "light";

        // Change all buttons with btn-light
        document.querySelectorAll(".btn-light").forEach((item) => {
            item.classList.remove("btn-light");
            item.classList.add("btn-dark");
        });

        // Change all tables
        document.querySelectorAll("table").forEach((table) => {
            table.classList.add("table-dark");
        });
    }
    // Saving new current mode to localStorage
    localStorage.setItem("currentMode", currentMode);
}

function showLoading(message=""){
    // if (message == "") {
    //   //If message is empty, choose a random message from the array
    //   messages = [
    //     gettext("Throwing some ninja stars..."),
    //     gettext("Browsing my interesting recipe book..."),
    //     gettext("Using my ninja techniques..."),
    //     gettext("Polishing my katana..."),
    //     gettext("Lunch break...be right back!"),
    //     gettext("Breaking some boards..."),
    //     gettext("Practicing with nunchacks..."),
    //     gettext("Throwing some kunais..."),
    //     gettext("Hiding somewhere in the shadows..."),
    //     gettext("Doing laundry..."),
    //     gettext("Meditating, please wait..."),
    //     gettext("Doing some top-secret thing...be right back!")
    //   ]
  
    //   let randMsg = Math.floor(Math.random() * messages.length);
    //   message = messages[randMsg];
    // }
  
    let overlay = document.createElement("div");
    overlay.setAttribute("class", "loading-overlay")
    let overlayContent = document.createElement("div");
    overlayContent.setAttribute("class", "overlay-content");
  
    let loadDiv = document.createElement("div");
    loadDiv.setAttribute("class", "spinner-grow text-light overlay-content");
    loadDiv.setAttribute("role", "status");
    let loadSpan = document.createElement("span");
    loadSpan.setAttribute("class", "sr-only");
    loadSpan.innerText = "";
  
    let loadingText = document.createElement("p");
    loadingText.style.color = "white";
    loadingText.innerText = message;
  
    loadDiv.appendChild(loadSpan);
    overlayContent.appendChild(loadDiv);
    overlayContent.appendChild(loadingText);
    overlay.appendChild(overlayContent);
    document.querySelector(".container").appendChild(overlay);
  }
  
  function removeLoading(){
    document.querySelectorAll(".loading-overlay").forEach((item, i) => {
      item.remove();
    });
  }

function showPageMsg(msgClass, msgContent) {
    const newAlert = document.createElement("div");
    newAlert.setAttribute("class", "alert " + msgClass + " alert-dismissible fade show");
    newAlert.setAttribute("role", "alert");
    newAlert.innerHTML = msgContent;
    const newBtn = document.createElement("button");
    newBtn.setAttribute("type","button");
    newBtn.setAttribute("class","btn-close");
    newBtn.setAttribute("data-bs-dismiss","alert");
    newBtn.setAttribute("aria-label","Close");

    // Appending newly created alert
    newAlert.appendChild(newBtn);
    document.querySelector(".container").prepend(newAlert);

    // Scrolling to top of the page so the user can see the alert
    window.scroll(0,0);
}