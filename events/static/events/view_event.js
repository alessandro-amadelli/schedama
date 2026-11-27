let pollingInterval;

document.addEventListener('DOMContentLoaded', () => {
    initializeEntirePage();

    // Event listeners for modals to reset body padding when opening a second modal
    document.getElementById('modalDateView').addEventListener('show.bs.modal', function () {
        document.body.style.paddingRight = '0';
    });
    document.getElementById('modalList').addEventListener('show.bs.modal', function () {
        document.body.style.paddingRight = '0';
    });

    // Emoji container
    const emojiContainer = document.querySelector("#emoji-reactions");
    const eventID = emojiContainer.dataset.eventId;
    emojiContainer.querySelectorAll(".reaction-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            reactToEvent(btn, eventID);
        });
    });
    updateEmojiCounters();
    pollingInterval = setInterval(() => {
        updateEmojiCounters();
    }, 30000);

});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(pollingInterval);
    } else {
        updateEmojiCounters();
        pollingInterval = setInterval(() => {
            updateEmojiCounters();
        }, 30000);
    }
});

var updateInterval = "";
var deadlineStart = "";
var deadlineEnd = "";


function initializeEntirePage() {
    // On page load, delete previous modifications from localStorage
    localStorage.removeItem("modifications");

    // Dropdown menu to share event
    const evTitle = document.querySelector("#eventTitle").innerText;
    const eventID = document.querySelector("#item-id").innerText;
    document.querySelector("#shareEventCol").appendChild(generateShareBtn(window.location.href, evTitle, eventID));

    // QR code generation
    generateQR(window.location.href);

    // Display event duration in readable format
    displayDurationText();

    // Preferences section (doughnut and bars), animated when it becomes visible
    initializePreferences();

    // Button to cancel participation
    const btnCancelParticipate = document.querySelector("#btnCancelParticipate");
    if (btnCancelParticipate) {
        btnCancelParticipate.onclick = () => {
            clearParticipateModal();
        }
    }

    // Button to confirm participation
    const btnConfirmParticipate = document.querySelector("#btnConfirmParticipate");
    if (btnConfirmParticipate) {
        btnConfirmParticipate.onclick = () => {
            sendParticipationToServer();
        };
    }

    // Event listener for modifications on participants (if authorized)
    document.querySelector("#tableParticipants").querySelectorAll("input[type=checkbox]").forEach((check) => {
        check.addEventListener('change', ()  => {
            const tr = check.closest("tr");
            saveModificationsLocally(tr);
        });
    });

    // Buttons to remove participant (if authorized)
    document.querySelectorAll("i[name=btnDeleteRow]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const partTr = btn.closest("tr");
            const partUID = partTr.querySelector(".participant-name-td").dataset.partuid;
            partTr.remove();
            saveDeletionLocally(partUID);
        });
    });

    // Button to edit or remove participants (if authorized)
    const btnSaveParticipants = document.querySelector("#btnSaveParticipants");
    if (btnSaveParticipants) {
        btnSaveParticipants.onclick = () => {
            sendModificationsToServer();
        }
    }

    // Button to cancel participants modifications
    const btnCancelSavePart = document.querySelector("#btnCancelSaveParticipants");
    if (btnCancelSavePart) {
        btnCancelSavePart.onclick = () => {
            // Cancel button reloads the page (if there is any modification) so data is restored
            if (localStorage.getItem("modifications")) {
                window.location.reload();
            }
        }
    };

    // Event listener for dropdown on date view modal
    document.querySelector("#dateViewSelect").addEventListener('change', updateParticipantsListForDate);

    // Transform location in a Google Maps link
    const baseGMapsURL= "https://www.google.com/maps/search/?api=1&query=";
    const locationLink = document.querySelector("#eventLocation");
    if (locationLink) {
        locationLink.setAttribute("href", baseGMapsURL + encodeURI(locationLink.innerText));
    }

    // Transform parking location in a Google Maps link
    const parkingLink = document.querySelector("#eventParking");
    if (parkingLink) {
        parkingLink.setAttribute("href", baseGMapsURL + encodeURI(parkingLink.innerText));
    }

    // Link to Google Calendar
    initializeGCalendarLink();

    // Set countdown deadlines considering best date (if present) or first date
    const durationMin = parseInt(document.querySelector("#durationMin").innerText);
    if (typeof bestDate === 'undefined' || !bestDate) {
        deadlineStart = new Date(dates[0]);
    } else {
        deadlineStart = new Date(bestDate);
    }
    deadlineEnd = new Date(deadlineStart.getTime() + (durationMin * 60000));

    // Start countdown
    updateClock();
    updateInterval = setInterval(() => {updateClock()},1000); 

    // Update localStorage history
    updateHistory();

    // Event for participate modal show
    let modalParticipate = document.getElementById('modalParticipate');
    if (modalParticipate) {
        modalParticipate.addEventListener('show.bs.modal', function () {
            document.querySelector("#btnConfirmParticipate").disabled = false;
        });
    }
}

function updateParticipantsListForDate() {
    const dateViewSelect = document.querySelector("#dateViewSelect");
    const dateViewList = document.querySelector("#dateViewList");
    let selectedDate = dates[dateViewSelect.selectedIndex - 1];
    const dateViewCounter = document.querySelector("#dateViewCounter");
    let partCount = 0;

    // Remove every element from list
    dateViewList.querySelectorAll("li").forEach((element) => {
        element.remove();
    });
    dateViewCounter.innerText = partCount;

    if(!selectedDate) {
        return false;
    }

    participants.forEach((p) => {
        if(p.dates.includes(selectedDate)) {
            let newP = document.createElement("li");
            newP.setAttribute("class", "list-group-item list-group-item-success appearing-sequence");
            newP.innerText = p.name;
            dateViewList.appendChild(newP);
            partCount++;
        }
    });
    dateViewCounter.innerText = partCount;
}

function initializeGCalendarLink() {
    // a element
    const googleCalendarLink = document.querySelector("#googleCalendarLink");
    
    // Relevant event data
    const eventTitle = document.querySelector("#eventTitle").innerText;
    let eventDescription = document.querySelector("#descriptionText");
    if (eventDescription) {
        eventDescription = eventDescription.innerText;
    }
    let eventLocation = document.querySelector("#eventLocation");
    if (eventLocation) {
        eventLocation = eventLocation.innerText;
    } else {
        eventLocation = "";
    }
    let startDate = dates[0];
    if (typeof bestDate !== 'undefined' && bestDate) {
        startDate = bestDate;
    }
    const durationMin = parseInt(document.querySelector("#durationMin").innerText);
    let endDate = new Date(new Date(startDate).getTime() + (durationMin*60000));
    const eventWebsite = window.location.href;

    startDate = (startDate + "00").replaceAll("-","").replaceAll(":","");
    endDate = endDate.getFullYear() + ( "0" + (endDate.getMonth() + 1)).slice(-2) + ("0" + endDate.getDate()).slice(-2) + 
    "T" + ("0" + endDate.getHours()).slice(-2) + ("0" + endDate.getMinutes()).slice(-2) + "00";

    let url = "https://calendar.google.com/calendar/render?action=TEMPLATE&dates=" + encodeURIComponent(startDate + "/" + endDate) +
    "&details=" + encodeURIComponent(eventDescription) + "&text=" + encodeURIComponent(eventTitle) +
    "&sprop=website:" + encodeURIComponent(eventWebsite.replaceAll("https://","").replaceAll("http://","")) + 
    "&sprop=name:Schedama";
    if (eventLocation != "") {
        url += "&location=" + encodeURIComponent(eventLocation);
    }

    googleCalendarLink.setAttribute("href", url);
}

function getRemainingTime(today, deadline) {
    const delta = deadline - today;

    const days = Math.floor( delta/(1000*60*60*24) );
    const hours = Math.floor( (delta/(1000*60*60)) % 24 );
    const minutes = Math.floor( (delta/1000/60) % 60 );
    const seconds = Math.floor( (delta/1000) % 60 );

    return {
        delta,
        days,
        hours,
        minutes,
        seconds
    }
}

function updateClock() {
    const timer = document.querySelector("#clockDiv");
    const days = timer.querySelector(".clockDays");
    const hours = timer.querySelector(".clockHours");
    const mins = timer.querySelector(".clockMins");
    const secs = timer.querySelector(".clockSecs");

    const today = new Date();

    if (today <= deadlineStart) {
        // Event not started yet
        var eventStarted = false;
        var t = getRemainingTime(today, deadlineStart);
    } else {
        // Event already started
        var eventStarted = true;
        var t = getRemainingTime(today, deadlineEnd);
    }

    if (!eventStarted) {
        // Update countdown
        days.innerText = t.days;
        hours.innerText = ('0' + t.hours).slice(-2);
        mins.innerText = ('0' + t.minutes).slice(-2);
        secs.innerText = ('0' + t.seconds).slice(-2);
        return;
    }

    if (t.delta < 0) {
        // Event finished
        clearInterval(updateInterval);  // Stop timer
        timer.classList.remove("clock-event-not-started");
        timer.classList.remove("clock-event-started");
        timer.classList.add("clock-event-ended");
        timer.innerHTML = gettext("Ended");
        return;
    }

    // Event started
    if (timer.classList.contains("clock-event-not-started")) {
        timer.classList.remove("clock-event-not-started");
    }
    if (!timer.classList.contains("clock-event-started")) {
        timer.classList.add("clock-event-started");
        document.querySelector("#clockText").innerText = gettext("In progress");
    }

    days.innerText = t.days;
    hours.innerText = ('0' + t.hours).slice(-2);
    mins.innerText = ('0' + t.minutes).slice(-2);
    secs.innerText = ('0' + t.seconds).slice(-2);
}

function displayDurationText() {
    const durationMin = document.querySelector("#durationMin");
    const durationText = document.querySelector("#durationText");
    let duration = parseInt(durationMin.innerText);
    let text = "";

    if (duration >= (24 * 60)) {
        let days = parseInt(duration / 60 / 24);
        text += days + gettext("d") + " ";
        duration = duration - (days * 60 * 24);
    }
    if (duration >= 60) {
        let hours = parseInt(duration / 60);
        text += hours + "h" + " ";
        duration = duration - (hours * 60);
    }

    if (duration > 0) {
        text += duration + "min";
    }

    durationText.innerText = text;
}

function initializePreferences() {
    const section = document.querySelector("#chartAreaDiv");
    const donut = section ? section.querySelector(".donut") : null;
    if (!donut) {
        return;
    }

    // Doughnut geometry: one arc for each segment, with a gap between them
    const radius = 62;
    const strokeWidth = 12;
    const gap = 6;
    const circumference = 2 * Math.PI * radius;
    const confirmed = parseInt(donut.dataset.confirmed);
    const total = parseInt(donut.dataset.total);
    const segments = [
        [donut.querySelector(".donut-seg-confirmed"), confirmed],
        [donut.querySelector(".donut-seg-none"), total - confirmed],
    ];
    const visibleSegments = segments.filter(([, value]) => value > 0).length;
    let start = 0;

    donut.style.setProperty("--circumference", circumference);
    segments.forEach(([circle, value]) => {
        if (value <= 0) {
            circle.remove();
            return;
        }
        const arc = circumference * value / total;
        // Round caps add half the stroke width at both ends: remove it (and the gap) from the arc
        const length = visibleSegments > 1 ? Math.max(arc - gap - strokeWidth, 0.001) : circumference;
        const offset = visibleSegments > 1 ? start + (gap + strokeWidth) / 2 : 0;
        circle.style.setProperty("--dash", `${length} ${circumference}`);
        circle.style.strokeDashoffset = -offset;
        start += arc;
    });

    // Animation starts only when the section becomes visible
    section.classList.add("will-animate");
    const startAnimation = () => {
        section.classList.add("is-visible");
        countUp(donut.querySelector(".donut-value"), confirmed);
    };
    if (!("IntersectionObserver" in window)) {
        requestAnimationFrame(() => requestAnimationFrame(startAnimation));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            startAnimation();
        }
    }, { threshold: 0.3 });
    observer.observe(section);
}

function countUp(element, target, duration = 900) {
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }
    const startTime = performance.now();
    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased);
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    element.textContent = "0";
    requestAnimationFrame(step);
}

function clearParticipateModal() {
    const partName = document.querySelector("#newPartName");
    partName.value = "";
    document.querySelector("#modalParticipate").querySelectorAll("input[type=checkbox]").forEach((check) => {
        check.checked = true;
    });
    document.querySelector("#btnConfirmParticipate").disabled = false;
}


function validateParticipateModal() {
    const partName = document.querySelector("#newPartName");
    if (partName.value == "") {
        setInvalid(partName, true);
        return false;
    }
    setInvalid(partName, false);
    return true;
}

async function sendParticipationToServer() {
    // Modal validation (check if name is empty)
    isValid = validateParticipateModal();
    if (!isValid) {
        return false;
    }

    // Disabling button to avoid multiple submissions on slow connections (if a user clicks multiple times before page reloads)
    document.querySelector("#btnConfirmParticipate").disabled = true;

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
    }

    // New participant data
    const newPartName = document.querySelector("#newPartName").value;
    let newPartDates = [];
    document.querySelector("#modalParticipate").querySelectorAll("input[type=checkbox]").forEach((check) => {
        if (check.checked) {
            newPartDates.push(check.value);
        }
    });

    const data = {
        item_id: document.querySelector("#item-id").innerText,
        new_participant: {
            name: newPartName,
            dates: newPartDates
        }
    }

    let reqHeaders = new Headers();
    reqHeaders.append('Content-type', 'application/json');
    reqHeaders.append('X-CSRFToken', csrftoken);

    let initObject = {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    await fetch('/add-participant/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            participantAddedSuccessfully(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}

function participantAddedSuccessfully(data) {
    if (data.status == "OK") {
        window.location.reload();
    } else {
        const modalParticipate = bootstrap.Modal.getInstance(document.getElementById('modalParticipate'));
        modalParticipate.hide();
        showPageMsg("alert-danger", data.description);
        removeLoading();
    }
}

function saveModificationsLocally(tr) {
    // When a participant is modified, this function receives the table row
    // and extracts information to register the modification
    const partUID = tr.querySelector(".participant-name-td").dataset.partuid;
    const partName = tr.querySelector(".participant-name-td").innerText;
    let partDates = [];
    tr.querySelectorAll("input[type=checkbox]").forEach((check) => {
        if (check.checked) {
            partDates.push(check.value);
        }
    });

    // Get old modifications
    let oldMods = localStorage.getItem("modifications");
    if (oldMods) {
        oldMods = JSON.parse(oldMods);
    } else {
        oldMods = {
            edited: {},
            deleted: []
        }
    }

    // Add modified participant to modifications
    oldMods["edited"][partUID] = {
        uid: partUID,
        name: partName,
        dates: partDates
    }

    // Save modifications
    localStorage.setItem("modifications", JSON.stringify(oldMods));

    // Enable modal button
    const btnSave = document.querySelector("#btnSaveParticipants");
    if (btnSave) {
        btnSave.disabled = false;
    }
}

function saveDeletionLocally(partUID) {
    oldMods = localStorage.getItem("modifications");
    if (oldMods) {
        oldMods = JSON.parse(oldMods);
    } else {
        oldMods = {
            edited: {},
            deleted: []
        }
    }

    if (!oldMods["deleted"].includes(partUID)) {
        oldMods["deleted"].push(partUID);
        // Save modifications
        localStorage.setItem("modifications", JSON.stringify(oldMods));
    }

    // Enable modal button
    const btnSave = document.querySelector("#btnSaveParticipants");
    if (btnSave) {
        btnSave.disabled = false;
    }
}

async function sendModificationsToServer() {
    document.querySelector("#modalList").querySelector(".btn-close").click();
    showLoading();

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
    }

    const modifications = localStorage.getItem("modifications");
    if (!modifications) {
        return false;
    }
    const data = {
        item_id: document.querySelector("#item-id").innerText,
        modifications: JSON.parse(modifications)
    }

    let reqHeaders = new Headers();
    reqHeaders.append('Content-type', 'application/json');
    reqHeaders.append('X-CSRFToken', csrftoken);

    let initObject = {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    await fetch('/modify-participants/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            modificationSentSuccessfully(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}

function modificationSentSuccessfully(data) {
    if (data.status == "OK") {
        window.location.reload();
    } else {
        showPageMsg("alert-danger", data.description);
        removeLoading();
    }
}

function updateHistory() {
    const itemID = document.querySelector("#item-id").innerText;
    const eventTitle = document.querySelector("#eventTitle").innerText;
    let eventAuthor = document.getElementById("eventAuthor");
    if (eventAuthor) {
        eventAuthor = eventAuthor.innerText;
    }

    let privateEventBadge = document.getElementById("privateEventBadge");
    if (privateEventBadge) {
        privateEventBadge = true;
    } else {
        privateEventBadge = false;
    }

    const eventData = {
        item_id: itemID,
        title: eventTitle,
        participation_link: `${window.location.origin}/participate/${itemID}`,
        author: eventAuthor,
        private_event: privateEventBadge
    };

    addToHistory(eventData);
}

async function updateEmojiCounters() {
  const emojiContainer = document.querySelector("#emoji-reactions");
  const eventID = emojiContainer.dataset.eventId;

  await fetch(`/get-reactions/${eventID}`)
    .then(response => {
      if (!response.ok) throw new Error("Request error");
      return response.json();
    })
    .then(data => {
      const previousReaction = localStorage.getItem("reaction_" + eventID);
      const reactedText = document.querySelector("#reactedText");
      document.querySelectorAll("#emoji-reactions .reaction-btn").forEach(btn => {
        const emojiKey = btn.dataset.emoji;
        const countSpan = btn.querySelector(".count");
        const newValue = data["reactions"][emojiKey] || 0;
        if (countSpan.innerText !== newValue.toString()) {
            updateSingleCounter(countSpan, newValue);
        }
        if (previousReaction === emojiKey) {
          btn.classList.add("selected");
          reactedText.innerText = gettext("You reacted with") + " " + btn.dataset.emojiSymbol;
          reactedText.classList.remove("d-none");
        } else {
          btn.classList.remove("selected");
        }
      });
    })
    .catch(err => {});
}

function updateSingleCounter(countSpan, newValue) {
    countSpan.style.animation = "count-out 0.2s forwards";
    setTimeout(() => {
        countSpan.innerText = newValue;
        countSpan.style.animation = "count-in 0.2s forwards";
    }, 200);
}

async function reactToEvent(btnEmoji, eventID) {
    const previousReaction = localStorage.getItem("reaction_" + eventID);
    if (previousReaction) {
        return;
    }

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
    }

    const emoji = btnEmoji.dataset.emoji;
    const emojiSymbol = btnEmoji.dataset.emojiSymbol;

    const data = {
        emoji: emoji
    }

    let reqHeaders = new Headers();
    reqHeaders.append('Content-type', 'application/json');
    reqHeaders.append('X-CSRFToken', csrftoken);

    let initObject = {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(data),
        credentials: 'include',
    };

    await fetch('/add-reaction/' + eventID, initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            if (data.status == "OK") {
                localStorage.setItem("reaction_" + eventID, emoji);
                updateEmojiCounters();
                notify(emojiSymbol + " +1");
            } else {
                notify(data.description);
            }
        })
        .catch(function (err) {
            console.error("Error reacting to event:", err);
        });
}