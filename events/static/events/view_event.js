document.addEventListener('DOMContentLoaded', () => {
    initializeEntirePage();
    document.addEventListener('modeChanged', updateCharts);

    // Event listeners for modals to reset body padding when opening a second modal
    document.getElementById('modalDateView').addEventListener('show.bs.modal', function () {
        document.body.style.paddingRight = '0';
    });
    document.getElementById('modalList').addEventListener('show.bs.modal', function () {
        document.body.style.paddingRight = '0';
    });

    // Emoji container
    const emojiContainer = document.querySelector("#emoji-reactions");
    const eventID= emojiContainer.dataset.eventId;
    emojiContainer.querySelectorAll(".reaction-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            reactToEvent(btn, eventID);
        });
    });
    updateEmojiCounters(eventID);
    setInterval(() => {
        updateEmojiCounters(eventID);
    }, 30000);

});

function updateCharts() {
    // Render and update charts
    document.querySelectorAll("canvas").forEach((element) => {
        try {
            // Awful try-catch to make things work because...JS!
            const ctx = element.getContext('2d');
            const chart = Chart.getChart(ctx);
            chart.render();
            chart.update();
        } catch {}
    });
}

var updateInterval = "";
var deadlineStart = "";
var deadlineEnd = "";

var totDoughnutPlot = null;
var dateBarChart = null;

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

    // Draw charts
    if (participants.length > 0) {
        initializeChartTot();
        initializeChartDates();
    } else {
        displayNoData();
    }

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
            const tr = check.parentElement.parentElement;
            saveModificationsLocally(tr);
        });
    });

    // Buttons to remove participant (if authorized)
    document.querySelectorAll("i[name=btnDeleteRow]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const partUID = btn.parentElement.parentElement.querySelector(".participant-name-td").dataset.partuid;
            btn.parentElement.parentElement.remove();
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
    const locationLink = document.querySelector("#eventLocation");
    if (locationLink) {
        locationLink.setAttribute("href", "https://www.google.com/maps/search/?api=1&query=" + encodeURI(locationLink.innerText));
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
    document.querySelector("#modalParticipate").addEventListener('show.bs.modal', function () {
        document.querySelector("#btnConfirmParticipate").disabled = false;
    });

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
            newP.setAttribute("class", "list-group-item list-group-item-success entering");
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

function displayNoData() {
    const chartDiv = document.querySelector("#chartAreaDiv");
    chartDiv.innerHTML = `<div class="col-12">
    <i class="fa-solid fa-chart-pie"></i> No data
    </div>
    `;
    chartDiv.classList.add("text-center");
    return false;
}

function initializeChartTot() {
    if (totDoughnutPlot) {
        totDoughnutPlot.destroy();
    }

    let confirmed = 0;
    let notConfirmed = 0;
    participants.forEach(p => {
        if (p.dates.length > 0) {
            confirmed += 1;
        } else {
            notConfirmed +=1;
        }
    });

    let data = {
        labels: [gettext("Confirmed"),gettext("Not confirmed")],
        datasets: [{
            backgroundColor: ["#06d6a0", "#6f7372"],
            data: [confirmed, notConfirmed],
            hoverOffset: 10,
            borderWidth: 0,
            spacing: 5
        }],        
    };

    let config = {
        type: 'doughnut',
        data,
        options: {
            cutout: "88%",
            plugins: {
                legend: {
                display: false
                },
            },
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart, a, b) {
                const width = chart.width,
                height = chart.height,
                ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height/110).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                const text = confirmed + "/" + (confirmed + notConfirmed),
                textX = Math.round((width - ctx.measureText(text).width) / 2),
                textY = height / 2;
                ctx.fillText(text, textX, textY);
                if (document.querySelector("body").classList.contains("dark-mode")) {
                    ctx.fillStyle = "#ffffff";
                } else {
                    ctx.fillStyle = "#000000";
                }
                ctx.save();
            }
        }]
    };

    totDoughnutPlot = new Chart(
        document.querySelector("#totChart"),
        config
    );
}

function initializeChartDates() {
    if (dateBarChart) {
        dateBarChart.destroy();
    }

    let evDates = dates.slice();
    let values = [];
    let labels = [];
    let noIndic = 0;
    let colors = [];

    // Build values and labels arrays for chart
    evDates.forEach(d => {
        let datVal = 0;
        participants.forEach((p, i) => {
            if (p.dates.includes(d)) {
                datVal += 1;
            }
        });
        if (datVal > 0) {
            values.push(datVal);
            // Chart labels (in "dd/mm h.HH:MM" format)
            let s = d.substring(8,10) + "/" + d.substring(5,7) + " h." + d.substring(11);
            labels.push(s);
        }
    });

    // Adding bar for no indications
    participants.forEach((p) => {
        if (p.dates.length == 0) {
            noIndic += 1;
        }
    });
    if (noIndic > 0) {
        labels.push(gettext("No Indications"));
        values.push(noIndic);
    }

    // Set color of bars (with max bars colored differently)
    values.forEach((val) => {
        if (val == Math.max(...values)) {
            colors.push("#06d6a0"); // Color of preferred date
        } else {
            colors.push("#118ab2");
        }
    });

    let data = {
        labels: labels,
        datasets: [{
            axis: 'y',
            label: gettext("Preferences"),
            data: values,
            backgroundColor: colors,
            barPercentage: 0.4,
            borderRadius: 6,
        }],
    };

    let config = {
        type: "bar",
        data,
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        },
        plugins: [{
            id: 'changeLabelColor',
            beforeDraw: (chart) => {
                let labelColor = "#000000";
                if (document.querySelector("body").classList.contains("dark-mode")) {
                    labelColor = "#ffffff";
                }
                const ctx = chart.ctx;
                chart.options.scales.y.ticks.color = labelColor;
            }
        }]
    };

    dateBarChart = new Chart(
        document.querySelector("#datesChart"),
        config
    );
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

async function updateEmojiCounters(eventID) {
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
    .catch(err => {
      console.error(err);
    });
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
            localStorage.setItem("reaction_" + eventID, emoji);
            updateEmojiCounters(eventID);
            notify(emojiSymbol + " +1");
        })
        .catch(function (err) {
            console.error("Error reacting to event:", err);
        });
}