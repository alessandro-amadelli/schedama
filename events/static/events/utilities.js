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
    let navbar = document.querySelector("nav");

    if (currentMode == "light") {
        // Activate light mode

        // Applying class to body
        body.classList.remove("dark-mode");

        // Navbar logo
        document.querySelector("#navLogoDark").classList.add("visually-hidden");
        document.querySelector("#navLogo").classList.remove("visually-hidden");

        // Page logo
        const logo = document.querySelector("#schedamaLogo");
        const logoDark = document.querySelector("#schedamaLogoDark");
        if (logo) {
            logo.classList.remove("visually-hidden");
        }
        if (logoDark) {
            logoDark.classList.add("visually-hidden");
        }

        // Changing meta tag color-scheme
        document.querySelector('meta[name="color-scheme"]').setAttribute('content', 'light');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', "#118ab2");

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

        // Change text-bg class
        document.querySelectorAll(".text-bg-dark").forEach((item) => {
            item.classList.remove("text-bg-dark");
            item.classList.add("text-bg-light");
        });

    } else {
        // Activate dark mode

        // Applying class to body
        body.classList.add("dark-mode");

        // Navbar logo
        document.querySelector("#navLogoDark").classList.remove("visually-hidden");
        document.querySelector("#navLogo").classList.add("visually-hidden");

        // Page logo
        const logo = document.querySelector("#schedamaLogo");
        const logoDark = document.querySelector("#schedamaLogoDark");
        if (logo) {
            logo.classList.add("visually-hidden");
        }
        if (logoDark) {
            logoDark.classList.remove("visually-hidden");
        }

        // Changing meta tag color-scheme
        document.querySelector('meta[name="color-scheme"]').setAttribute('content', 'dark');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', "#073b4c");

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

        // Change text-bg class
        document.querySelectorAll(".text-bg-light").forEach((item) => {
            item.classList.remove("text-bg-light");
            item.classList.add("text-bg-dark");
        });
    }
    // Saving new current mode to localStorage
    localStorage.setItem("currentMode", currentMode);
}

function showLoading(message=""){
    if (message == "") {
        message = gettext("Loading, please wait.")
    }
  
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

function notify(text) {
    //Deletion of pre-existing toasts
    let toastList = document.querySelectorAll(".toast");
    toastList.forEach((toast, i) => {
      toast.remove();
    });
  
    let divAlign = document.createElement("div");
    divAlign.setAttribute("class", "position-fixed bottom-0 end-0 p-3");
    divAlign.style = "z-index:5;color:black;";
  
    let toast = document.createElement("div");
    toast.setAttribute("class", "toast fade");
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
  
    let body = document.createElement("div");
    body.setAttribute("class", "toast-body");
    body.innerHTML = text;
  
    toast.appendChild(body);
    divAlign.appendChild(toast);
    document.querySelector("body").appendChild(divAlign);

    // Initialize toast to show message
    toast = new bootstrap.Toast(toast, {
        animation: true,
        autohide: true,
        delay: 3000
        });
    toast.show();
  
  }

function generateShareBtn(contentURL, eventTitle="", text="") {
    // Generates a share dropdown button with links
    if (text == "") {
        text = gettext("You've been invited to an event on Schedama: ");
    }

    if (eventTitle.length > 25) {
        eventTitle = eventTitle.substring(0,25) + ".."
    }
    if (eventTitle != "") {
        text += eventTitle;
    }

    text = encodeURIComponent(text);

    const btnDiv = document.createElement("div");
    btnDiv.classList.add("btn-group");
    
    const btn = document.createElement("button");
    btn.setAttribute("type","button");
    btn.setAttribute("data-bs-toggle","dropdown");
    btn.setAttribute("aria-expanded","false");
    let btnLightDark = "btn-light";
    if (document.body.classList.contains("dark-mode")) {
        btnLightDark = "btn-dark";
    }
    btn.classList.add("btn", btnLightDark, "dropdown-toggle", "p-2");
    btn.innerHTML = `<span class="material-symbols-outlined">share</span>`;

    const btnUl = document.createElement("ul");
    btnUl.classList.add("dropdown-menu");
    
    const telegramLi = document.createElement("li");
    telegramLi.innerHTML = `<a class="dropdown-item" href="https://telegram.me/share/url?url=` + contentURL + `&text=` + text + `" target="_blank"><span class="material-symbols-outlined">send</span> Telegram </a>`;
    const whatsappLi = document.createElement("li");
    whatsappLi.innerHTML = `<a class="dropdown-item" href="https://api.whatsapp.com/send?text=` + text + encodeURIComponent("\n") + contentURL + `" data-action="share/whatsapp/share" target="_blank"><span class="material-symbols-outlined">chat</span> Whatsapp </a>`;
    const emailLi = document.createElement("li");
    emailLi.innerHTML = `<a class="dropdown-item" href="mailto:?subject='Schedama Event'&body=` + text + ` ` + contentURL + `" target="_blank"><span class="material-symbols-outlined">email</span> e-mail</a>`;
    const dividerLi = document.createElement("li");
    dividerLi.innerHTML = `<hr class="dropdown-divider">`;
    const copyLi = document.createElement("li");
    copyLi.innerHTML = `<a class="dropdown-item" href=""><span class="material-symbols-outlined">content_copy</span> ` + gettext("Copy to clipboard") + `</a>`;
    copyLi.querySelector("a").addEventListener("click", (e) => {
        const copyContent = async () => {
            await navigator.clipboard.writeText(contentURL);
        }
        copyContent();
        e.preventDefault();
    }, false);

    // Append elements
    btnDiv.appendChild(btn);
    btnDiv.appendChild(btnUl);
    btnUl.appendChild(telegramLi);
    btnUl.appendChild(whatsappLi);
    btnUl.appendChild(emailLi);
    btnUl.appendChild(dividerLi);
    btnUl.appendChild(copyLi);

    return btnDiv;
}

function setInvalid(element, isInvalid) {
    // Sets an element as invalid (not validated)
    element.classList.remove("shaking");
    if (isInvalid){
        void element.offsetWidth; // Necessary for shake animation restart
        element.classList.add("is-invalid", "shaking");
    } else {
        element.classList.remove("is-invalid");
    }
}

function addToHistory(eventData) {
    // Adds current visited event to history
    let history = localStorage.getItem("history");
    if (!history) {
        history = "[]";
    }
    
    let historyData = JSON.parse(history);

    // Get item_id of event to save and set last_visited
    const itemID = eventData.item_id;
    const epoch = Date.now();
    const now = new Date();
    const day = ('0' + now.getDate()).slice(-2);
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const year = now.getFullYear();
    const hour = ('0' + now.getHours()).slice(-2);
    const min = ('0' + now.getMinutes()).slice(-2);
    const sec = ('0' + now.getSeconds()).slice(-2);
    eventData["last_visited"] = [day, "/", month, "/", year, " h.", hour, ":", min, ":", sec].join('');    
    eventData["last_visited_epoch"] = epoch; // For ordering purposes

    // Iterating history items to see if the same event is already present
    let present = false;
    historyData.every((item, i) => {
        if (item.item_id == itemID) {
            // Updating already present event (preserving the admin version)
            if (eventData.hasOwnProperty("admin_link")) {
                historyData[i] = eventData;
            } else {
                item.title = eventData.title;
                item.participation_link = eventData.participation_link,
                item.last_visited = eventData.last_visited
                item.last_visited_epoch = eventData.last_visited_epoch
            }
            present = true;
        }
        return !present; // every() stops if the return is false
    });

    // Append event data to history if not present
    if (!present) {
        historyData.push(eventData);
    }

    // Updating history content in localStorage
    localStorage.setItem("history", JSON.stringify(historyData));
}

function removeFromHistory(eventID) {
    let history = localStorage.getItem("history");
    if (!history) {
        return false;
    }

    // Parse history data into JSON format
    history = JSON.parse(history);

    let historyData = [];

    history.forEach((item) => {
        if (item.item_id != eventID) {
            historyData.push(item);
        }
    });

    // Updating history content in localStorage
    localStorage.setItem("history", JSON.stringify(historyData));
    
}