document.addEventListener('DOMContentLoaded', () => {
    initializeAuthorRow();

    // Save event button
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

    document.querySelector("#settingsRow").querySelectorAll("input[type='checkbox']").forEach(element => {
        element.addEventListener('change', updatePermissionDescriptions);
    });
});

function showModalRestoreData() {
    document.querySelector("#btnRestoreData").onclick = () => {restorePreviousData();};
    document.querySelector("#btnClearData").onclick = () => {clearPreviousData();};
    modal = new bootstrap.Modal(document.querySelector("#modalRestoreData"));
    modal.show();
}

function updatePermissionDescriptions() {
    const switchAddParticipant = document.querySelector("#switchAddParticipant").checked;
    const switchEditParticipant = document.querySelector("#switchEditParticipant").checked;
    const switchRemoveParticipant = document.querySelector("#switchRemoveParticipant").checked;

    const whoCanAdd = document.querySelector("#whoCanAdd");
    const whoCanEdit = document.querySelector("#whoCanEdit");
    const whoCanRemove = document.querySelector("#whoCanRemove");

    let iconCanAdd = "lock fa-shake";
    let iconCanEdit = "lock fa-shake";
    let iconCanRemove = "lock fa-shake";
    
    let textCanAdd = gettext("Administrator only");
    let textCanEdit = gettext("Administrator only");
    let textCanRemove = gettext("Administrator only");
    
    let colorCanAdd = "red";
    let colorCanEdit = "red";
    let colorCanRemove = "red";
    
    if (switchAddParticipant) {
        iconCanAdd = "lock-open fa-beat";
        textCanAdd = gettext("Anyone");
        colorCanAdd = "green";
    }

    if (switchEditParticipant) {
        iconCanEdit = "lock-open fa-beat";
        textCanEdit = gettext("Anyone");
        colorCanEdit = "green";
    }

    if (switchRemoveParticipant) {
        iconCanRemove = "lock-open fa-beat";
        textCanRemove = gettext("Anyone");
        colorCanRemove = "green";
    }
    
    whoCanAdd.innerHTML = `<i class="fa-solid fa-${iconCanAdd}" style="--fa-animation-iteration-count:1;"></i> ${textCanAdd}`;
    whoCanAdd.style.color = colorCanAdd;
    whoCanEdit.innerHTML = `<i class="fa-solid fa-${iconCanEdit}" style="--fa-animation-iteration-count:1;"></i> ${textCanEdit}`;
    whoCanEdit.style.color = colorCanEdit;
    whoCanRemove.innerHTML = `<i class="fa-solid fa-${iconCanRemove}" style="--fa-animation-iteration-count:1;"></i> ${textCanRemove}`;
    whoCanRemove.style.color = colorCanRemove;

}

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

function initializeAuthorRow() {
    // Intro animation start
    const authorRow = document.getElementById("authorRow");
    authorRow.style.animationPlayState = "running";

    // Event listener to start animation of next input field
    const authorInput = document.getElementById("eventAuthor");
    authorInput.addEventListener('input', initializeTitleRow);
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

    // Event listener to show password inputs
    const switchPrivateEvent = document.querySelector("#switchPrivateEvent");
    switchPrivateEvent.addEventListener('change', () => {
        passwordInputVisibility(switchPrivateEvent.checked);
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

function passwordInputVisibility(toShow) {
    const passwordRows = document.querySelectorAll(".password-row");
    if (toShow) {
        passwordRows.forEach((row) => {
            row.style.display = "block";
            row.style.animationPlayState = "running";
        });
    } else {
        passwordRows.forEach((row) => {
            row.style.display = "none";
            row.querySelector("input").value = "";
        });
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

    document.querySelector("#dateInp").addEventListener('change', ()=> {
        // Initialize participant row
        initializeParticipantRow();
    
        // Initialize theme row with thumbnails
        initializeThemeRow();

        // Initialize settings row
        initializeSettingsRow();

        // Initialize security row
        initializeSecurityRow();
    });
}

function initializeParticipantRow() {
    const participantRow = document.querySelector("#participantRow");
    participantRow.style.animationPlayState = "running";

}

function initializeSettingsRow() {
    const settingsRow = document.querySelector("#settingsRow");
    settingsRow.style.animationPlayState = "running";
    updatePermissionDescriptions();
}

function initializeThemeRow() {
    const themeRow = document.querySelector("#themeRow");
    themeRow.style.animationPlayState = "running";
}

function initializeSecurityRow() {
    const securityRow = document.querySelector("#securityRow");
    securityRow.style.animationPlayState = "running";
}

function createNewDate() {
    const dateRow = document.querySelector("#dateRow");
    const firstDate = dateRow.querySelector("#dateInp"); // First date input field

    if (firstDate.value == '') {
        setInvalid(firstDate, true, gettext("You have to choose at least one date."));
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
    const newBtnDel = document.createElement("i");
    newBtnDel.classList.add("fa-solid", "fa-trash-can", "fs-1", "cursor-pointer", "remove-date", "text-danger");
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

function createNewParticipant(partName=null) {
    const partRow = document.querySelector("#participantRow");
    const partInp = document.querySelector("#participantInp");

    if (partName === null) {
        partName = partInp.value;
    }

    if (partName.replaceAll(" ", "").length === 0) {
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
    const newBtnDel = document.createElement("i");
    newBtnDel.classList.add("fa-solid", "fa-trash-can", "fs-1", "cursor-pointer", "remove-date", "text-danger");
    newBtnDel.onclick = () => {
        new100.remove();
        newParticipantCol.remove();
        newBtnCol.remove();
        saveLocally(); // Save event data
    }
    newBtnCol.appendChild(newBtnDel);

    //Append new children
    partRow.appendChild(new100);
    partRow.appendChild(newParticipantCol);
    partRow.appendChild(newBtnCol);

    // Event listener for new input
    newParticipantInp.addEventListener('change', saveLocally);

    // Set new input value to participant's name
    newParticipantInp.value = partName;
    partInp.value = "";
    setInvalid(partInp, false);

    // Saving event's data after adding new participant
    saveLocally();
    notify(gettext("Participant added"));
}

function validateEvent() {
    validated = true;

    // Check #1 Title
    const title = document.querySelector("#eventTitle");
    if (title.value.replaceAll(" ", "").length == 0) {
        setInvalid(title, true, gettext("Insert a title for your event."));
        validated = false;
    } else {
        setInvalid(title, false);
    }

    // Check #2 Location
    const locSwitch = document.querySelector("#addLocY");
    const location = document.querySelector("#eventLocation");
    if (locSwitch.checked) {
        if (location.value.replaceAll(" ", "").length == 0) {
            setInvalid(location, true, gettext("Please enter a location."));
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
        setInvalid(firstDate, true, gettext("You have to choose at least one date."));
        validated = false;
    } else {
        setInvalid(firstDate, false);
    }

    // Check #4 Private event
    const privateEvent = document.querySelector("#switchPrivateEvent").checked;
    const eventPassword1 = document.querySelector("#eventPassword1");
    const eventPassword2 = document.querySelector("#eventPassword2");

    if (privateEvent) {

    }

    return validated;
}

function restorePreviousData() {
    console.log("restorePreviousData");
    console.log(localStorage.getItem("unsavedEvent"));
    const unsavedEvent = JSON.parse(localStorage.getItem("unsavedEvent"));

    if (!unsavedEvent) {
        return false;
    }

    // Event settings
    document.querySelector("#switchAddParticipant").checked = unsavedEvent.settings.add_participant;
    document.querySelector("#switchEditParticipant").checked = unsavedEvent.settings.edit_participant;
    document.querySelector("#switchRemoveParticipant").checked = unsavedEvent.settings.remove_participant;

    // Event author
    document.getElementById("eventAuthor").value = unsavedEvent.author;    

    // Event title
    document.querySelector("#eventTitle").value = unsavedEvent.title;
    initializeTitleRow();

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
    document.querySelector("#eventLocation").value = unsavedEvent.location;
    if (unsavedEvent.has_location) {
        document.querySelector("#addLocY").checked = true;
        initializeLocationRow();
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

    // Initialize theme row with thumbnails
    initializeThemeRow();

    // Initialize security row
    initializeSecurityRow();
}

function clearPreviousData() {
    console.log("clearPreviousData");
    localStorage.removeItem("unsavedEvent");
}

function saveLocally() {
    console.log("saveLocally");
    const author = document.getElementById("eventAuthor").value;
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

    // Security
    const privateEvent = document.querySelector("#switchPrivateEvent").checked;
    const password1 = document.querySelector("#eventPassword1").value;
    const password2 = document.querySelector("#eventPassword2").value;

    // Create unsaved event object
    unsavedEvent = {
        author: author,
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
        },
        private_event: privateEvent,
        password_1: password1,
        password_2: password2
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

    // Adding author to event participants
    authorPart = [{name: data["author"], dates: []}];
    data["participants"] = authorPart.concat(data["participants"]);

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

    // Let user know that event links are automatically saved
    const linksSavedDisclaimer = document.createElement("h4");
    linksSavedDisclaimer.innerHTML = `<i class="fa-solid fa-floppy-disk fa-beat"></i><br>${gettext("The following links have been automatically saved to the history page")}`;
    linksSavedDisclaimer.setAttribute("class", "text-center mb-3");

    // Display participant's URL
    const displayPartURL = document.createElement("h3");
    displayPartURL.innerHTML = `<i class="fa-solid fa-user-group"></i> ${gettext("Participant URL")}`;
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
    btnOpenPart.innerHTML = `<i class="fa-solid fa-user-group"></i> ${gettext("Participant page")}`;

    // Display administration URL
    const displayAdminURL = document.createElement("h3");
    displayAdminURL.innerHTML = `<i class="fa-regular fa-id-card"></i> ${gettext("Administration URL")}`;
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
    btnOpenAdm.innerHTML = `<i class="fa-regular fa-id-card"></i> ${gettext("Administration page")}`;

    // Warning instructing user to save URLs
    const warnCol = document.createElement("div");
    warnCol.setAttribute("class", "alert alert-warning text-center mb-2");
    const warn = document.createElement("strong");
    warn.innerHTML = `
    <i class="fa-solid fa-triangle-exclamation"></i>
    ${gettext("IMPORTANT: make sure to keep this link, it's the only way you'll be able to administrate your event.")}
    <i class="fa-solid fa-triangle-exclamation"></i>`;

    // hr
    newHr = document.createElement("hr");
    newHr2 = document.createElement("hr");

    // Append elements
    section.appendChild(displayName);

    section.appendChild(linksSavedDisclaimer);
    section.appendChild(newHr);

    section.appendChild(displayPartURL);
    section.appendChild(partRow);
    partRow.appendChild(partCol1);
    partCol1.appendChild(participantURL);
    partRow.appendChild(sharePartCol);
    sharePartCol.appendChild(btnSharePart);
    sharePartCol.appendChild(btnOpenPart);

    section.appendChild(newHr2);

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