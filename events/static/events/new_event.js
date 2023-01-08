document.addEventListener('DOMContentLoaded', () => {
    initializeTitleRow();

    // Button to save event
    document.querySelector("#btnSaveEvent").onclick = () => {
        let isValidated = validateEvent();
        if (isValidated) {
            sendEventToServer();
        }
    }

    // Add new date on input date change instead of clicking to add date
    document.querySelector("#dateInp").addEventListener('change', () => {
        createNewDate();
        saveLocally();
    });

    // Button to add participant to event
    const btnAddParticipant = document.querySelector("#add-participant");
    btnAddParticipant.onclick = () => {
        createNewParticipant();
        saveLocally();
    }

    // Event listener to save event locally
    document.querySelectorAll('input').forEach((item) => {
        item.addEventListener('change', ()=> {
            saveLocally();
        });
    });

    // Check if a local, unsaved event is available
    const unsavedEvent = localStorage.getItem("unsavedEvent");
    if (unsavedEvent) {
        showModalRestoreData();
    }

});

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
    titleInput.addEventListener('input', initializeLocationRow);
}

function initializeLocationRow() {
    // Remove of event listener on previous input field
    const titleInput = document.querySelector("#eventTitle");
    titleInput.removeEventListener('input', initializeLocationRow);

    // Intro animation start
    const locationRow = document.querySelector("#locationRow");
    locationRow.style.animationPlayState = "running";

    // Event listener to start animation of next input field
    const locationInput = document.querySelector("#eventLocation");
    const locationSwitch = document.querySelector("#checkEventLocation");
    locationInput.addEventListener('input', initializeDateRow);
    locationSwitch.addEventListener('change', initializeDateRow);

    // Event listener to toggle location input
    locationSwitch.addEventListener('change', toggleLocationInput);
}

function toggleLocationInput() {
    const locationSwitch = document.querySelector("#checkEventLocation");
    const locationRow = document.querySelector("#locationRow");
    const locationInput = document.querySelector("#eventLocation");
    const locationCol = document.querySelector("#locationCol");
    locationInput.disabled = !locationSwitch.checked;
    if (locationInput.disabled) {
        locationRow.classList.add("text-muted");
        locationCol.style.display = "none";
    } else {
        locationRow.classList.remove("text-muted");
        locationCol.style.display = "block";
    }
}

function initializeDateRow() {
    // Remove of event listener on previous input fields
    const locationInput = document.querySelector("#eventLocation");
    locationInput.removeEventListener('input', initializeDateRow);
    const locationSwitch = document.querySelector("#checkEventLocation");
    locationSwitch.removeEventListener('change', initializeDateRow);

    // Intro animation start
    const dateRow = document.querySelector("#dateRow");
    dateRow.style.animationPlayState = "running";

    // Initialize participant row
    initializeParticipantRow();
}

function initializeParticipantRow() {
    const participantRow = document.querySelector("#participantRow");
    participantRow.style.animationPlayState = "running";
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
    newDateLabel.innerText = "Event Date";
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

function createNewParticipant() {
    const dateRow = document.querySelector("#participantRow");
    const partInp = document.querySelector("#participantInp");

    if (partInp.value == '') {
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
    if (title.value == '') {
        setInvalid(title, true);
        validated = false;
    } else {
        setInvalid(title, false);
    }

    // Check #2 Location
    const locSwitch = document.querySelector("#checkEventLocation");
    const location = document.querySelector("#eventLocation");
    if (locSwitch.checked) {
        if (location.value == '') {
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
    // document.querySelector("#switchRemoveParticipant").checked = unsavedEvent.settings.remove_participant;

    // Event title
    document.querySelector("#eventTitle").value = unsavedEvent.title;

    // Event location
    initializeLocationRow();
    document.querySelector("#eventLocation").value = unsavedEvent.location;
    document.querySelector("#checkEventLocation").checked = unsavedEvent.has_location;
    toggleLocationInput();

    // Event dates
    initializeDateRow();
    unsavedEvent.dates.forEach((item) => {
        document.querySelector("#dateInp").value = item;
        createNewDate();
    });

    // Participants
    initializeParticipantRow();
    unsavedEvent.participants.forEach((participant) => {
        document.querySelector("#participantInp"). value = participant.name;
        createNewParticipant();
    });
}

function clearPreviousData() {
    localStorage.removeItem("unsavedEvent");
}

function saveLocally() {
    const eventTitle = document.querySelector("#eventTitle").value;
    const eventLocation = document.querySelector("#eventLocation").value;
    const locationActive = document.querySelector("#checkEventLocation").checked;
    const eventDates = document.querySelectorAll("[name='eventDate']");
    const participants = document.querySelectorAll("[name='participantName']");

    // Settings
    const addParticipant = document.querySelector("#switchAddParticipant").checked;
    // const removeParticipant = document.querySelector("#switchRemoveParticipant").checked;
    
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

    // Create unsaved event object
    unsavedEvent = {
        title: eventTitle,
        location: eventLocation,
        has_location: locationActive,
        dates: dateList,
        participants: participantList,
        settings: {
            add_participant: addParticipant,
            // remove_participant: removeParticipant
        }
    }

    // Save event data to local storage
    localStorage.setItem("unsavedEvent", JSON.stringify(unsavedEvent)); 
}

async function sendEventToServer() {
    const data = JSON.parse(localStorage.getItem("unsavedEvent"));
    const csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;

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

    // Display participant's URL
    const displayPartURL = document.createElement("h3");
    displayPartURL.innerText = "Participation URL";
    displayPartURL.setAttribute("class", "text-center");
    const partRow = document.createElement("div");
    partRow.classList.add("row");
    const partCol1 = document.createElement("div");
    partCol1.setAttribute("class", "col-12 mb-5 text-center display-6");
    const participantURL = document.createElement("strong");
    participantURL.innerText = window.location.href.replace("create-event/", "participate/"+itemID);
    participantURL.setAttribute("id", "partURL");
    const sharePartCol = document.createElement("div");
    sharePartCol.classList.add("col-12", "text-center");
    const btnSharePart = generateShareBtn(participantURL.innerText);

    // Display administration URL
    const displayAdminURL = document.createElement("h3");
    displayAdminURL.innerText = "Administration URL";
    displayAdminURL.setAttribute("class", "text-center");
    const admRow = document.createElement("div");
    admRow.classList.add("row");
    const admCol1 = document.createElement("div");
    admCol1.setAttribute("class", "col-12 mb-5 text-center display-6");
    const adminURL = document.createElement("strong");
    adminURL.innerText = window.location.href.replace("create-event/", "edit-event/"+itemID+"?k="+adminKey);
    adminURL.setAttribute("id", "adminURL");
    const shareAdmCol = document.createElement("div");
    shareAdmCol.classList.add("col-12", "text-center");
    const btnShareAdm = generateShareBtn(adminURL.innerText);

    // Warning instructing user to save URLs
    const warnCol = document.createElement("div");
    warnCol.setAttribute("class", "col-12 text-center mb-2");
    const warn = document.createElement("strong");
    warn.innerHTML = gettext(`<span class="material-symbols-outlined">warning</span> 
    IMPORTANT: before leaving the page make sure to save this link, it's the only way you'll be able to administrate your event. 
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

    section.appendChild(newHr);

    section.appendChild(displayAdminURL);
    section.appendChild(admRow);
    admRow.appendChild(warnCol);
    warnCol.appendChild(warn);
    admRow.appendChild(admCol1);
    admCol1.appendChild(adminURL);
    admRow.appendChild(shareAdmCol);
    shareAdmCol.appendChild(btnShareAdm);

    // Remove "unsavedEvent" from local storage
    localStorage.removeItem("unsavedEvent");
}