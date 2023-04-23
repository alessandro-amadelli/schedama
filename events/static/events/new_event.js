document.addEventListener('DOMContentLoaded', () => {
    initializeTitleRow();
    // initializeDescriptionRow();

    // Button to save event
    document.querySelector("#btnSaveEvent").onclick = () => {
        sendEventToServer();
    }

    // Add new date on input date change instead of clicking to add date
    document.querySelector("#dateInp").addEventListener('change', () => {
        createNewDate();
        saveLocally();
    });

    // Add participant to event
    document.querySelector("#participantInp").addEventListener('change', () => {
        createNewParticipant();
        saveLocally();
    });

    // Event listener to save event locally
    document.querySelectorAll('input').forEach((item) => {
        item.addEventListener('change', saveLocally);
    });

    // Event listener for duration
    document.querySelectorAll("input[type=range]").forEach((range) => {
        range.addEventListener('input', updateDuration);
    });

    // Check if a local, unsaved event is available
    const unsavedEvent = localStorage.getItem("unsavedEvent");
    if (unsavedEvent) {
        showModalRestoreData();
    }

    // Event listener for theme thumbnails
    document.querySelectorAll(".theme-thumbnail").forEach((item) => {
        item.addEventListener('click', () => {
            selectEventTheme(item);
            saveLocally();
        });
    });
});

function selectEventTheme(clickedItem) {
    if (!clickedItem) {
        return false;
    }
    if (clickedItem.classList.contains("thumbnail-selected")) {
        return true;
    }

    document.querySelectorAll(".thumbnail-selected").forEach((element) => {
        element.classList.remove("thumbnail-selected");
    })
    clickedItem.classList.add("thumbnail-selected");
}

function showModalRestoreData() {
    document.querySelector("#btnRestoreData").onclick = () => {restorePreviousData();};
    document.querySelector("#btnClearData").onclick = () => {clearPreviousData();};
    modal = new bootstrap.Modal(document.querySelector("#modalRestoreData"));
    modal.show();
}

function initializeTitleRow() {
    // Intro animation start
    const titleRow = document.querySelector("#titleRow");
    titleRow.style.animationPlayState = "running";
    
    // Event listener to start animation of next input field
    const titleInput = document.querySelector("#eventTitle");
    titleInput.addEventListener('input', initializeAddDescriptionRow);
}

function initializeAddDescriptionRow() {
    // Intro animation start
    const addDescriptionRow = document.querySelector("#addDescriptionRow");
    addDescriptionRow.style.animationPlayState = "running";

    // Remove event listener from previous field
    document.querySelector("#eventTitle").removeEventListener('input', initializeAddDescriptionRow);

    // Event listener to start animation of next input field
    document.querySelectorAll("input[name=addDescriptionRadio]").forEach((radio) => {
        radio.addEventListener('click', () => {
            showDescriptionRow(radio.value == 'Y');
        })
    });
}

function showDescriptionRow(toShow) {
    if (toShow) {
        document.querySelector("#descriptionRow").style.display = "block";
        initializeDescriptionRow();
    } else {
        document.querySelector("#descriptionRow").style.display = "none";
        initializeAddLocationRow();
    }
}

function initializeDescriptionRow() {
    // Start intro animation in description row
    const descrRow = document.querySelector("#descriptionRow");
    
    if (document.querySelector("#addDescrY").checked) {
        descrRow.style.animationPlayState = "running";
    } else {
        descrRow.style.display = 'none';
    }

    // Event listener to save description data
    const descrInp = document.querySelector("#eventDescription");
    descrInp.addEventListener('change', saveLocally);
    descrInp.addEventListener('keyup', updateCharCount);
    
    updateCharCount();
    
    // Event listener to initialize location row
    descrInp.addEventListener('input', initializeAddLocationRow);
}

function updateCharCount() {
    const eventDescription = document.querySelector("#eventDescription");
    const maxLength = parseInt(eventDescription.getAttribute("maxlength"));
    const countSpan = document.querySelector("#descrCharCount");
    
    let remaining = maxLength - eventDescription.value.length;
    if (remaining < 0) {
        remaining = 0;
    }
    countSpan.innerText = remaining;
}

function initializeAddLocationRow() {
    // Intro animation start
    const addLocationRow = document.querySelector("#addLocationRow");
    addLocationRow.style.animationPlayState = "running";

    // Remove event listener from previous field
    document.querySelector("#eventDescription").removeEventListener('input', initializeAddLocationRow);

    // Event listener to start animation of next input field
    document.querySelectorAll("input[name=addLocationRadio]").forEach((radio) => {
        radio.addEventListener('click', () => {
            showLocationRow(radio.value == 'Y');
        })
    });
}

function showLocationRow(toShow) {
    if (toShow) {
        document.querySelector("#locationRow").style.display = "block";
        initializeLocationRow();
    } else {
        document.querySelector("#locationRow").style.display = "none";
        initializeDateRow();
    }
}

function initializeLocationRow() {
    // Remove of event listener on previous input field
    const eventDescription = document.querySelector("#eventDescription");
    eventDescription.removeEventListener('input', initializeAddLocationRow);

    // Intro animation start
    const locationRow = document.querySelector("#locationRow");

    if (document.querySelector("#addLocY").checked) {
        locationRow.style.animationPlayState = "running";
    } else {
        locationRow.style.display = "none";
    }

    // Event listener to start animation of next input field
    const locationInput = document.querySelector("#eventLocation");
    // const locationSwitch = document.querySelector("#checkEventLocation");
    locationInput.addEventListener('input', initializeDateRow);
}

function initializeDateRow() {
    // Remove of event listener on previous input fields
    const locationInput = document.querySelector("#eventLocation");
    locationInput.removeEventListener('input', initializeDateRow);

    // Intro animation start
    const dateRow = document.querySelector("#dateRow");
    dateRow.style.animationPlayState = "running";

    // Animation start on duration row
    const durationRow = document.querySelector("#durationRow");
    durationRow.style.animationPlayState = "running";

    // Initialize participant row
    initializeParticipantRow();

    // Initialize settings row
    initializeSettingsRow();

    // Initialize theme row with thumbnails
    initializeThemeRow();
}

function initializeParticipantRow() {
    const participantRow = document.querySelector("#participantRow");
    participantRow.style.animationPlayState = "running";

}

function initializeSettingsRow() {
    const settingsRow = document.querySelector("#settingsRow");
    settingsRow.style.animationPlayState = "running";
}

function initializeThemeRow() {
    const themeRow = document.querySelector("#themeRow");
    themeRow.style.animationPlayState = "running";
}

function createNewDate() {
    const dateRow = document.querySelector("#dateRow");
    const firstDate = dateRow.querySelector("#dateInp"); // First date input field

    if (firstDate.value == '') {
        setInvalid(firstDate, true);
        return false;
    } else {
        const btnSave = document.querySelector("#btnSaveEvent");
        btnSave.disabled = false;
        btnSave.classList.remove("visually-hidden");
    }

    // Add new w-100
    const new100 = document.createElement("div");
    new100.classList.add("w-100");

    // Add new date input col
    const newDateCol = document.createElement("div");
    newDateCol.classList.add("col-8", "col-md-4", "mb-3", "appearing");
    const newFormDiv =  document.createElement("div");
    newFormDiv.classList.add("form-floating", "mb-3");
    const newDateInp = document.createElement("input");
    newDateInp.setAttribute("type","datetime-local");
    newDateInp.setAttribute("name","eventDate");
    newDateInp.classList.add("form-control");
    newDateInp.setAttribute("min", new Date().toISOString().slice(0,new Date().toISOString().lastIndexOf(":")));
    const newDateLabel = document.createElement("label");
    newDateLabel.setAttribute("for", "eventDate");
    newDateLabel.innerText = gettext("Event Date");
    newFormDiv.appendChild(newDateInp);
    newFormDiv.appendChild(newDateLabel);
    newDateCol.appendChild(newFormDiv);

    // Add new button col
    const newBtnCol = document.createElement("div");
    newBtnCol.classList.add("col-4", "col-md-8", "mb-3", "fs-1", "align-middle");

    // New btn del
    const newBtnDel = document.createElement("span");
    newBtnDel.classList.add("material-symbols-outlined", "fs-1", "cursor-pointer", "remove-date", "text-danger");
    newBtnDel.innerText = "delete";
    newBtnDel.onclick = () => {
        new100.remove();
        newDateCol.remove();
        newBtnCol.remove();
        saveLocally(); // Save event data
    }
    newBtnCol.appendChild(newBtnDel);

    //Append new children
    dateRow.appendChild(new100);
    dateRow.appendChild(newDateCol);
    dateRow.appendChild(newBtnCol);

    // Event listener for new input
    newDateInp.addEventListener('change', saveLocally);

    // Set new input value to first date and reset first date value
    newDateInp.value = firstDate.value;
    firstDate.value = "";
    setInvalid(firstDate, false);

    // Show notification for the added date
    notify(gettext("Date added"));
}

function updateDuration() {
    const durationText = document.querySelector("#durationText");
    const durationDays = parseInt(document.querySelector("#durationDays").value);
    const durationHours = parseInt(document.querySelector("#durationHours").value);
    const durationMinutes = parseInt(document.querySelector("#durationMinutes").value);

    let text = "";

    if (durationDays > 0) {
        text += durationDays + gettext("d") + " ";
    }

    if (durationHours > 0) {
        text += durationHours + "h" + " ";
    }

    if (durationMinutes > 0) {
        text += durationMinutes + "min"
    }

    durationText.innerText = text;
}

function createNewParticipant() {
    const dateRow = document.querySelector("#participantRow");
    const partInp = document.querySelector("#participantInp");

    if (partInp.value.replaceAll(" ", "").length == 0) {
        setInvalid(partInp, true);
        return false;
    }

    // Add new w-100
    const new100 = document.createElement("div");
    new100.classList.add("w-100");

    // Add new date input col
    const newParticipantCol = document.createElement("div");
    newParticipantCol.classList.add("col-8", "col-md-4", "mb-3", "appearing");
    const newFormDiv =  document.createElement("div");
    newFormDiv.classList.add("form-floating", "mb-3");
    const newParticipantInp = document.createElement("input");
    newParticipantInp.setAttribute("type","text");
    newParticipantInp.setAttribute("name","participantName");
    newParticipantInp.setAttribute("maxlength","30");
    newParticipantInp.classList.add("form-control");
    const newParticipantLabel = document.createElement("label");
    newParticipantLabel.setAttribute("for", "participantName");
    newParticipantLabel.innerText = "Name";
    newFormDiv.appendChild(newParticipantInp);
    newFormDiv.appendChild(newParticipantLabel);
    newParticipantCol.appendChild(newFormDiv);

    // Add new button col
    const newBtnCol = document.createElement("div");
    newBtnCol.classList.add("col-4", "col-md-8", "mb-3", "fs-1", "align-middle");

    // New btn del
    const newBtnDel = document.createElement("span");
    newBtnDel.classList.add("material-symbols-outlined", "fs-1", "cursor-pointer", "remove-date", "text-danger");
    newBtnDel.innerText = "delete";
    newBtnDel.onclick = () => {
        new100.remove();
        newParticipantCol.remove();
        newBtnCol.remove();
        saveLocally(); // Save event data
    }
    newBtnCol.appendChild(newBtnDel);

    //Append new children
    dateRow.appendChild(new100);
    dateRow.appendChild(newParticipantCol);
    dateRow.appendChild(newBtnCol);

    // Event listener for new input
    newParticipantInp.addEventListener('change', saveLocally);

    // Set new input value to first date and reset first date value
    newParticipantInp.value = partInp.value;
    partInp.value = "";
    setInvalid(partInp, false);

    notify(gettext("Participant added"));
}

function setInvalid(element, isInvalid) {
    element.classList.remove("shaking");
    if (isInvalid){
        void element.offsetWidth; // Necessary for shake animation restart
        element.classList.add("is-invalid", "shaking");
    } else {
        element.classList.remove("is-invalid");
    }
}

function validateEvent() {
    validated = true;

    // Check #1 Title
    const title = document.querySelector("#eventTitle");
    if (title.value.replaceAll(" ", "").length == 0) {
        setInvalid(title, true);
        validated = false;
    } else {
        setInvalid(title, false);
    }

    // Check #2 Location
    const locSwitch = document.querySelector("#addLocY");
    const location = document.querySelector("#eventLocation");
    if (locSwitch.checked) {
        if (location.value.replaceAll(" ", "").length == 0) {
            setInvalid(location, true);
            validated = false;
        } else {
            setInvalid(location, false);
        }
    } else {
        setInvalid(location, false);
    }

    //Check #3 Date and time
    const firstDate = document.querySelector("#dateInp");
    const dates = document.querySelectorAll("[name='eventDate']");
    if (dates.length == 0) {
        setInvalid(firstDate, true);
        validated = false;
    } else {
        setInvalid(firstDate, false);
    }

    return validated;
}

function restorePreviousData() {
    const unsavedEvent = JSON.parse(localStorage.getItem("unsavedEvent"));

    if (!unsavedEvent) {
        return false;
    }

    // Event settings
    document.querySelector("#switchAddParticipant").checked = unsavedEvent.settings.add_participant;
    document.querySelector("#switchEditParticipant").checked = unsavedEvent.settings.edit_participant;
    document.querySelector("#switchRemoveParticipant").checked = unsavedEvent.settings.remove_participant;

    // Event title
    document.querySelector("#eventTitle").value = unsavedEvent.title;

    // Event description
    document.querySelector("#eventDescription").value = unsavedEvent.description;
    updateCharCount();

    if (unsavedEvent.description != "") {
        document.querySelector("#addDescrY").checked = true;
    } else {
        document.querySelector("#addDescrN").checked = true;
    }

    initializeAddDescriptionRow();
    initializeDescriptionRow();

    // Event location
    initializeAddLocationRow();
    initializeLocationRow();
    document.querySelector("#eventLocation").value = unsavedEvent.location;
    if (unsavedEvent.has_location) {
        document.querySelector("#addLocY").checked = true;
    } else {
        document.querySelector("#addLocN").checked = true;
    }

    // Event dates
    initializeDateRow();
    unsavedEvent.dates.forEach((item) => {
        document.querySelector("#dateInp").value = item;
        createNewDate();
    });

    // Restoring event duration
    const durationMinutes = document.querySelector("#durationMinutes");
    const durationHours = document.querySelector("#durationHours");
    const durationDays = document.querySelector("#durationDays");
    let eventDuration = unsavedEvent.duration;
    if (!eventDuration) {
        eventDuration = 60;
    }
    // Days
    durationDays.value = 0;
    if (eventDuration >= (24 * 60) ) {
        let days = Math.floor(eventDuration/(24*60));
        durationDays.value = days;
        eventDuration = eventDuration - (days * 24 * 60);
    }
    // Hours
    durationHours.value = 0;
    if (eventDuration >= 60) {
        let hours = Math.floor(eventDuration/60);
        durationHours.value = hours;
        eventDuration = eventDuration - (hours * 60);
    }
    // Minutes
    durationMinutes.value = eventDuration;
    // Duration text
    updateDuration();

    // Event theme
    if (unsavedEvent.event_theme) {
        selectEventTheme(document.querySelector(".theme-thumbnail[data-theme='" + unsavedEvent.event_theme + "']"));
    }

    // Participants
    initializeParticipantRow();
    unsavedEvent.participants.forEach((participant) => {
        document.querySelector("#participantInp"). value = participant.name;
        createNewParticipant();
    });

    // Settings
    initializeSettingsRow();
}

function clearPreviousData() {
    localStorage.removeItem("unsavedEvent");
}

function saveLocally() {
    const eventTitle = document.querySelector("#eventTitle").value;
    const eventDescription = document.querySelector("#eventDescription").value;
    const eventLocation = document.querySelector("#eventLocation").value;
    const locationActive = document.querySelector("#addLocY").checked;
    const eventDates = document.querySelectorAll("[name='eventDate']");
    let eventDuration = 60; // default duration is 1 hour
    const participants = document.querySelectorAll("[name='participantName']");

    // Settings
    const addParticipant = document.querySelector("#switchAddParticipant").checked;
    const editParticipant = document.querySelector("#switchEditParticipant").checked;
    const removeParticipant = document.querySelector("#switchRemoveParticipant").checked;
    
    // Populating date list
    let dateList = [];
    eventDates.forEach((item) => {
        dateList.push(item.value);
    });

    // Populating participant list
    let participantList = [];
    participants.forEach((item) => {
        participantList.push({
            name: item.value,
            dates: []
        });
    });

    // Event duration
    const durationDays = parseInt(document.querySelector("#durationDays").value);
    const durationHours = parseInt(document.querySelector("#durationHours").value);
    const durationMinutes = parseInt(document.querySelector("#durationMinutes").value);
    eventDuration = (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes;

    // Set event theme
    let selectedTheme = document.querySelector(".thumbnail-selected").dataset.theme;
    if (!selectedTheme) {
        selectedTheme = "";
    }

    // Create unsaved event object
    unsavedEvent = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        location: eventLocation,
        has_location: locationActive,
        dates: dateList,
        duration: eventDuration,
        participants: participantList,
        event_theme: selectedTheme,
        settings: {
            add_participant: addParticipant,
            edit_participant: editParticipant,
            remove_participant: removeParticipant
        }
    }

    // Save event data to local storage
    localStorage.setItem("unsavedEvent", JSON.stringify(unsavedEvent)); 
}

async function sendEventToServer() {
    const data = JSON.parse(localStorage.getItem("unsavedEvent"));
    const csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;

    const isValidated = validateEvent();

    if (!isValidated) {
        showPageMsg("alert-danger", gettext("Please, check input fields."));
        return false;
    }

    // Check if description is not active
    if (document.querySelector("#addDescrN").checked) {
        data.description = "";
    }

    // Set event theme
    const selectedTheme = document.querySelector(".thumbnail-selected").dataset.theme;
    if (selectedTheme) {
        data["event_theme"] = selectedTheme;
    } else {
        data["event_theme"] = "";
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

    showLoading();

    await fetch('/save-event/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            eventCreatedSuccessfully(data);
            removeLoading();
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}

function eventCreatedSuccessfully(data) {
    if (data.status == "ERROR") {
        showPageMsg("alert-danger", data.description);
        return false;
    }

    // Saving title of the event (to display it after)
    const eventTitle = document.querySelector("#eventTitle").value;

    // Created event data
    const itemID = data.item_id;
    const adminKey = data.admin_key;

    // Delete page content
    const section = document.querySelector(".section");
    section.innerHTML = ""; // Empty the section area

    // Changing page titles
    document.querySelector("h1").innerText = gettext("Event created");
    document.querySelector("h2").innerText = gettext("Your event has been successfully created");

    // Display event title
    const displayName = document.createElement("h1");
    displayName.innerText = eventTitle;
    displayName.setAttribute("class", "text-center mb-5");

    // Dark or light class for btn
    let darkLightClass = "btn-light";
    if (document.body.classList.contains("dark-mode")) {
        darkLightClass = "btn-dark";
    }

    // Display participant's URL
    const displayPartURL = document.createElement("h3");
    displayPartURL.innerHTML = `<span class="material-symbols-outlined">group</span> ` + gettext("Participant URL");
    displayPartURL.setAttribute("class", "text-center");
    const partRow = document.createElement("div");
    partRow.classList.add("row");
    const partCol1 = document.createElement("div");
    partCol1.setAttribute("class", "col-12 mb-5 text-center display-6 border rounded shadow py-2");
    const participantURL = document.createElement("strong");
    participantURL.innerText = window.location.href.replace("create-event/", "participate/"+itemID);
    participantURL.setAttribute("id", "partURL");
    const sharePartCol = document.createElement("div");
    sharePartCol.classList.add("col-12", "text-center");
    const btnSharePart = generateShareBtn(participantURL.innerText, eventTitle);
    const btnOpenPart = document.createElement("a");
    btnOpenPart.setAttribute("href", participantURL.innerText);
    btnOpenPart.setAttribute("class","btn " + darkLightClass + " m-2");
    btnOpenPart.innerHTML = `<span class="material-symbols-outlined">group</span> ` + gettext("Participant page");

    // Display administration URL
    const displayAdminURL = document.createElement("h3");
    displayAdminURL.innerHTML = `<span class="material-symbols-outlined">badge</span> ` + gettext("Administration URL");
    displayAdminURL.setAttribute("class", "text-center");
    const admRow = document.createElement("div");
    admRow.classList.add("row");
    const admCol1 = document.createElement("div");
    admCol1.setAttribute("class", "col-12 mb-5 text-center display-6 border rounded shadow py-2");
    const adminURL = document.createElement("strong");
    adminURL.innerText = window.location.href.replace("create-event/", "edit-event/"+itemID+"?k="+adminKey);
    adminURL.setAttribute("id", "adminURL");
    const shareAdmCol = document.createElement("div");
    shareAdmCol.classList.add("col-12", "text-center");
    const btnShareAdm = generateShareBtn(adminURL.innerText, eventTitle);
    const btnOpenAdm = document.createElement("a");
    btnOpenAdm.setAttribute("href", adminURL.innerText);
    btnOpenAdm.setAttribute("class","btn " + darkLightClass + " m-2");
    btnOpenAdm.innerHTML = `<span class="material-symbols-outlined">badge</span> ` + gettext("Administration page");

    // Warning instructing user to save URLs
    const warnCol = document.createElement("div");
    warnCol.setAttribute("class", "col-12 text-center mb-2");
    const warn = document.createElement("strong");
    warn.innerHTML = gettext(`<span class="material-symbols-outlined">warning</span> 
    IMPORTANT: make sure to keep this link, it's the only way you'll be able to administrate your event. 
    <span class="material-symbols-outlined">warning</span>`);
    warn.setAttribute("class", "text-danger");

    // hr
    newHr = document.createElement("hr");

    // Append elements
    section.appendChild(displayName);

    section.appendChild(displayPartURL);
    section.appendChild(partRow);
    partRow.appendChild(partCol1);
    partCol1.appendChild(participantURL);
    partRow.appendChild(sharePartCol);
    sharePartCol.appendChild(btnSharePart);
    sharePartCol.appendChild(btnOpenPart);

    section.appendChild(newHr);

    section.appendChild(admRow);
    admRow.appendChild(warnCol);
    warnCol.appendChild(warn);
    admRow.appendChild(displayAdminURL);
    admRow.appendChild(admCol1);
    admCol1.appendChild(adminURL);
    admRow.appendChild(shareAdmCol);
    shareAdmCol.appendChild(btnShareAdm);
    shareAdmCol.appendChild(btnOpenAdm);

    // Save to history
    const eventData = {
        item_id: itemID,
        title: eventTitle,
        participation_link: participantURL.innerText,
        admin_link: adminURL.innerText
    }
    addToHistory(eventData);

    notify(gettext("Data saved to history"));

    // Remove "unsavedEvent" from local storage
    localStorage.removeItem("unsavedEvent");
}