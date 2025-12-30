document.addEventListener('DOMContentLoaded', () => {
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

    // Event listener to save description data
    const descrInp = document.querySelector("#eventDescription");
    descrInp.addEventListener('change', saveLocally);
    descrInp.addEventListener('keyup', updateCharCount);

    // Event listener to show/hide description row
    document.querySelectorAll("input[name=addDescriptionRadio]").forEach(element => {
        element.addEventListener(
            'change', () => {
            toggleDescrVisibility();
        });
    });
    // Event listener to show/hide location row
    document.querySelectorAll("input[name=addLocationRadio]").forEach(element => {
        element.addEventListener(
            'change', () => {
            toggleLocVisibility();
        });
    });
    // Event listener to show/hide parking row
    document.querySelectorAll("input[name=addParkingRadio]").forEach(element => {
        element.addEventListener(
            'change', () => {
            toggleParkVisibility();
        });
    });

    // Event listener for theme thumbnails
    document.querySelectorAll(".theme-thumbnail").forEach((item) => {
        item.addEventListener('click', () => {
            selectEventTheme(item);
            saveLocally();
        });
    });

    // Event listener for setting descriptions
    document.querySelector("#settingsRow").querySelectorAll("input[type='checkbox']").forEach(element => {
        element.addEventListener('change', updatePermissionDescriptions);
    });

    // Event listeners for step management
    document.querySelectorAll(".next-btn").forEach(element => {
        element.addEventListener('click', () => {
            activateStep(element.dataset.step);
        });
    });
    document.querySelectorAll(".timeline-step").forEach(element => {
        element.addEventListener('click', () => {
            activateStep(element.dataset.step);
        });
    });

    // Event listener to show password inputs
    const checkPrivateEvent = document.querySelector("#checkPrivateEvent");
    checkPrivateEvent.addEventListener('change', () => {
        togglePswVisibility();
    });

    // Initial function calls
    toggleDescrVisibility();
    updateCharCount();
    toggleLocVisibility();
    toggleParkVisibility();
    updatePermissionDescriptions();
    togglePswVisibility();
});


function showModalRestoreData() {
    document.querySelector("#btnRestoreData").onclick = () => {restorePreviousData();};
    document.querySelector("#btnClearData").onclick = () => {clearPreviousData();};
    modal = new bootstrap.Modal(document.querySelector("#modalRestoreData"));
    modal.show();
}


function restorePreviousData() {
    const unsavedEvent = JSON.parse(localStorage.getItem("unsavedEvent"));
    let firstEmptyStep = "9";

    if (!unsavedEvent) {
        activateStep("1");
        return false;
    }

    // Event author
    document.getElementById("eventAuthor").value = unsavedEvent.author;
    if (!unsavedEvent.author) {
        firstEmptyStep = "1";
    }

    // Event title
    document.querySelector("#eventTitle").value = unsavedEvent.title;
    if (!unsavedEvent.title && firstEmptyStep > "2") {
        firstEmptyStep = "2";
    }

    // Event description
    document.querySelector("#eventDescription").value = unsavedEvent.description;
    updateCharCount();

    if (unsavedEvent.description != "") {
        document.querySelector("#addDescrY").checked = true;
    }
    // else {
    //     document.querySelector("#addDescrN").checked = true;
    // }

    if (
        !unsavedEvent.description &&
        !document.querySelector("#addDescrY").checked &&
        !document.querySelector("#addDescrN").checked &&
        firstEmptyStep > "3"
    ) {
        firstEmptyStep = "3";
    }

    // Event location
    document.querySelector("#eventLocation").value = unsavedEvent.location;
    if (unsavedEvent.has_location) {
        document.querySelector("#addLocY").checked = true;
    } else {
        document.querySelector("#addLocN").checked = true;
    }

    // Event parking
    if (unsavedEvent.has_location) {
    }
    document.querySelector("#eventParking").value = unsavedEvent.parking || "";
    if (unsavedEvent.has_parking) {
        document.querySelector("#addParkY").checked = true;
    } else {
        document.querySelector("#addParkN").checked = true;
    }
    if (
        (
            (!unsavedEvent.location && document.querySelector("#addLocY").checked) ||
            (!unsavedEvent.parking && document.querySelector("#addParkY").checked)
        ) && firstEmptyStep > "4"
    ){
        firstEmptyStep = "4";
    }

    // Event dates
    unsavedEvent.dates.forEach((item) => {
        document.querySelector("#dateInp").value = item;
        createNewDate();
    });
    if (unsavedEvent.dates.length==0 && firstEmptyStep > "5") {
        firstEmptyStep = "5";
    }

    // Restoring event duration
    const durationMinutes = document.querySelector("#durationMinutes");
    const durationHours = document.querySelector("#durationHours");
    const durationDays = document.querySelector("#durationDays");
    let eventDuration = unsavedEvent.duration;
    if (!eventDuration) {
        eventDuration = 60;
        if (firstEmptyStep > "6") {
            firstEmptyStep = "6";
        }
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
    } else {
        if (firstEmptyStep > "7") {
            firstEmptyStep = "7";
        }
    }

    // Participants
    unsavedEvent.participants.forEach((participant) => {
        document.querySelector("#participantInp"). value = participant.name;
        createNewParticipant();
    });

    if (!unsavedEvent.participants.length==0 && firstEmptyStep > "8") {
        firstEmptyStep = "8";
    }

    // Event settings & security
    document.querySelector("#checkAddParticipant").checked = unsavedEvent.settings.add_participant;
    document.querySelector("#checkEditParticipant").checked = unsavedEvent.settings.edit_participant;
    document.querySelector("#checkRemoveParticipant").checked = unsavedEvent.settings.remove_participant;
    document.querySelector("#checkPrivateEvent").checked = unsavedEvent.private_event;

    // Activate correct step
    activateStep(firstEmptyStep);

    // Initial function calls
    toggleDescrVisibility();
    updateCharCount();
    toggleLocVisibility();
    toggleParkVisibility();
    updatePermissionDescriptions();
    togglePswVisibility();
}


function clearPreviousData() {
    localStorage.removeItem("unsavedEvent");
}


function setStepStatus(step, status) {
    const currentStep = document.querySelector(`.timeline-step[data-step="${step}"]`);
    if (!currentStep) {
        return;
    }

    if (status === "complete") {
        currentStep.classList.remove("error");
        currentStep.classList.add("complete");
        return;
    } else if (status === "error") {
        currentStep.classList.remove("complete");
        currentStep.classList.add("error");
    }
}


function activateStep(step) {
    let activeCard = document.querySelector(".step-card.active");
    let stepCard = document.querySelector(`.step-card[data-step="${step}"]`);
    let activeTimeline = document.querySelector(".timeline-step.active");
    let timelineStep = document.querySelector(`.timeline-step[data-step="${step}"]`);

    if (!activeCard) {
        activeCard = document.querySelector('.step-card[data-step="1"]');
    }
    if (!activeTimeline) {
        activeTimeline = document.querySelector('.timeline-step[data-step="1"]');
    }

    if (!stepCard || !timelineStep) {
        activateStep("1");
        return;
    }

    // Removing active class from current step card
    activeCard.classList.remove("active");
    // activeCard.classList.add("d-none");
    activeCard.classList.add("exiting");
    activeCard.addEventListener("animationend", function handler() {
        activeCard.classList.remove("exiting");
        activeCard.classList.add("d-none");
        activeCard.removeEventListener('animationend', handler);
    });

    // Removing active class from current timeline step
    activeTimeline.classList.remove("active");

    // Activating correct step card
    stepCard.classList.add("active");
    stepCard.classList.remove("d-none");

    // Activating correct timeline step
    timelineStep.classList.add("active");
}


function toggleDescrVisibility() {
    const descrRow = document.querySelector("#descriptionRow");
    const addDescrY = document.querySelector("#addDescrY");
    if (addDescrY.checked) {
        descrRow.style.display = "block";
    } else {
        descrRow.style.display = "none";
    }
}


function toggleLocVisibility() {
    const locRow = document.querySelector("#locationRow");
    const addLocY = document.querySelector("#addLocY");
    if (addLocY.checked) {
        locRow.style.display = "block";
    } else {
        locRow.style.display = "none";
    }
}


function toggleParkVisibility() {
    const parkRow = document.querySelector("#parkingRow");
    const addParkY = document.querySelector("#addParkY");
    if (addParkY.checked) {
        parkRow.style.display = "block";
    } else {
        parkRow.style.display = "none";
    }
}


function updatePermissionDescriptions() {
    const checkAddParticipant = document.querySelector("#checkAddParticipant").checked;
    const checkEditParticipant = document.querySelector("#checkEditParticipant").checked;
    const checkRemoveParticipant = document.querySelector("#checkRemoveParticipant").checked;

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
    
    if (checkAddParticipant) {
        iconCanAdd = "lock-open fa-beat";
        textCanAdd = gettext("Anyone");
        colorCanAdd = "green";
    }

    if (checkEditParticipant) {
        iconCanEdit = "lock-open fa-beat";
        textCanEdit = gettext("Anyone");
        colorCanEdit = "green";
    }

    if (checkRemoveParticipant) {
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


function togglePswVisibility() {
    const passwordRows = document.querySelectorAll(".password-row");
    const checkPrivateEvent = document.querySelector("#checkPrivateEvent");
    const toShow = checkPrivateEvent.checked;
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
    newParticipantLabel.innerText = gettext("Participant");
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

    // Check #0 Author
    const author = document.querySelector("#eventAuthor");
    if (author.value.replaceAll(" ", "").length == 0) {
        setInvalid(author, true, gettext("Choose a nickname."));
        setStepStatus("1", "error");
        validated = false;
    } else {
        setInvalid(author, false);
        setStepStatus("1", "complete");
    }

    // Check #1 Title
    const title = document.querySelector("#eventTitle");
    if (title.value.replaceAll(" ", "").length == 0) {
        setInvalid(title, true, gettext("Insert a title for your event."));
        setStepStatus("2", "error");
        validated = false;
    } else {
        setInvalid(title, false);
        setStepStatus("2", "complete");
    }

    // Check #2 Description
    const descSwitch = document.querySelector("#addDescrY");
    const description = document.querySelector("#eventDescription");
    if (descSwitch.checked) {
        if (description.value.replaceAll(" ", "").length == 0) {
            setInvalid(description, true, gettext("Please enter a location."));
            validated = false;
            setStepStatus("3", "error");
        } else {
            setInvalid(description, false);
            setStepStatus("3", "complete");
        }
    } else {
        setInvalid(description, false);
        setStepStatus("3", "complete");
    }

    // Check #3 Location
    const locSwitch = document.querySelector("#addLocY");
    const location = document.querySelector("#eventLocation");
    let step4Status = "complete";
    if (locSwitch.checked) {
        if (location.value.replaceAll(" ", "").length == 0) {
            setInvalid(location, true, gettext("Please enter a location."));
            validated = false;
            step4Status = "error";
        } else {
            setInvalid(location, false);
        }
    } else {
        setInvalid(location, false);
    }

    // Check #4 Parking
    const parkSwitch = document.querySelector("#addParkY");
    const parking = document.querySelector("#eventParking");
    if (parkSwitch.checked && locSwitch.checked) {
        if (parking.value.replaceAll(" ", "").length == 0) {
            setInvalid(parking, true, gettext("Please enter a parking location."));
            validated = false;
            step4Status = "error";
        } else {
            setInvalid(parking, false);
        }
    } else {
        setInvalid(parking, false);
    }
    setStepStatus("4", step4Status);

    //Check #5 Date and time
    const firstDate = document.querySelector("#dateInp");
    const dates = document.querySelectorAll("[name='eventDate']");
    if (dates.length == 0) {
        setInvalid(firstDate, true, gettext("You have to choose at least one date."));
        validated = false;
        setStepStatus("5", "error");
    } else {
        setInvalid(firstDate, false);
        setStepStatus("5", "complete");
    }

    // Check #6 Private event
    const isPrivate = document.querySelector("#checkPrivateEvent").checked;
    const eventPassword1 = document.querySelector("#eventPassword1");
    const eventPassword2 = document.querySelector("#eventPassword2");
    if (isPrivate) {
        // Check #6.1 passwords filled
        if (eventPassword1.value == "" || eventPassword2.value == "") {
            setInvalid(
                eventPassword1,
                true,
                gettext("You need to enter a password if you want to make the event private.")
            );
            validated = false;
            setStepStatus("9", "error");
        } else {
            setInvalid(eventPassword1, false);
            setStepStatus("9", "complete");
        }
        // Check #6.2 passwords match
        if (eventPassword1.value !== eventPassword2.value) {
            setInvalid(
                eventPassword2,
                true,
                gettext("Passwords don't match.")
            );
            validated = false;
            setStepStatus("9", "error");
        } else {
            setInvalid(eventPassword2, false);
        }
    } else {
        setInvalid(eventPassword1, false);
        setStepStatus("9", "complete");
    }

    // Setting optional steps as complete
    setStepStatus("6", "complete");
    setStepStatus("7", "complete");
    setStepStatus("8", "complete");

    return validated;
}


function saveLocally() {
    const author = document.getElementById("eventAuthor").value;
    const eventTitle = document.querySelector("#eventTitle").value;
    const eventDescription = document.querySelector("#eventDescription").value;
    const locationActive = document.querySelector("#addLocY").checked;
    const eventLocation = document.querySelector("#eventLocation").value;
    const parkingActive = document.querySelector("#addParkY").checked;
    const eventParking = document.querySelector("#eventParking").value;
    const eventDates = document.querySelectorAll("[name='eventDate']");
    let eventDuration = 60; // default duration is 1 hour
    const participants = document.querySelectorAll("[name='participantName']");

    // Settings
    const addParticipant = document.querySelector("#checkAddParticipant").checked;
    const editParticipant = document.querySelector("#checkEditParticipant").checked;
    const removeParticipant = document.querySelector("#checkRemoveParticipant").checked;
    
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
    const privateEvent = document.querySelector("#checkPrivateEvent").checked;
    const password1 = document.querySelector("#eventPassword1").value;
    const password2 = document.querySelector("#eventPassword2").value;

    // Create unsaved event object
    unsavedEvent = {
        author: author,
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        has_location: locationActive,
        location: eventLocation,
        has_parking: parkingActive,
        parking: eventParking,
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

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
    }

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

    const eventTitle = document.querySelector("#eventTitle").value;

    // Delete page content
    const section = document.querySelector(".section");
    section.innerHTML = ""; // Empty the section area

    // Removing old alert (if present)
    const oldAlert = document.querySelector(".alert");
    oldAlert.remove();

    // Changing page titles
    document.querySelector("h1").innerText = gettext("Event created");
    document.querySelector("h2").innerText = gettext("Your event has been successfully created");

    // Created event's data
    const itemID = data.item_id;
    const adminKey = data.admin_key;

    // Setting dark/light class for buttons
    const darkLightClass = document.body.classList.contains("dark-mode") ? "btn-light" : "btn-dark";

    // New HTML content for the section div
    const newHTMLContent = `
        <h1><i class="fa-solid fa-book-open"></i>&nbsp;${eventTitle}</h1>
        <hr>

        <div class="alert alert-info mb-3">
            <i class="fa-solid fa-floppy-disk fa-beat"></i>
            ${gettext("The following links have been automatically saved to the history page")}
        </div>

        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-2">
            <div class="col mb-3 d-flex">
                <div class="card rounded shadow w-100">
                    <div class="card-body">
                        <h3 class="card-title"><i class="fa-solid fa-user-group"></i> ${gettext("Participant URL")}</h3>
                        <h4 class="card-text">
                            <details>
                                <summary><i class="fa-solid fa-link"></i> ${gettext("View URL")}</summary>
                                <strong id="partURL">${window.location.href.replace("create-event/", "participate/" + itemID)}</strong>
                            </details>
                        </h4>
                    </div>
                    <div class="card-footer">
                        ${generateShareBtn(window.location.href.replace("create-event/", "participate/" + itemID), eventTitle, itemID).innerHTML}
                        <a href="${window.location.href.replace("create-event/", "participate/" + itemID)}" class="btn ${darkLightClass} m-2">
                            <i class="fa-solid fa-user-group"></i> ${gettext("Participant page")}
                        </a>
                    </div>
                </div>
            </div>
            <div class="col mb-3 d-flex">
                <div class="card rounded shadow w-100">
                    <div class="card-body">
                        <h3 class="card-title"><i class="fa-regular fa-id-card"></i> ${gettext("Administration URL")}</h3>
                        <h4 class="card-text">
                            <details>
                                <summary><i class="fa-solid fa-link"></i> ${gettext("View URL")}</summary>
                                <strong id="adminURL">${window.location.href.replace("create-event/", "edit-event/" + itemID + "?k=" + adminKey)}</strong>
                            </details>
                        </h4>
                        <div class="alert alert-warning text-center mb-2">
                            <strong>
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                ${gettext("IMPORTANT: make sure to keep this link, it's the only way you'll be able to administrate your event.")}
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </strong>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${generateShareBtn(window.location.href.replace("create-event/", "edit-event/" + itemID + "?k=" + adminKey), eventTitle, itemID).innerHTML}
                        <a href="${window.location.href.replace("create-event/", "edit-event/" + itemID + "?k=" + adminKey)}" class="btn ${darkLightClass} m-2">
                            <i class="fa-regular fa-id-card"></i> ${gettext("Administration page")}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Save data in history
    const eventData = {
        item_id: itemID,
        title: eventTitle,
        participation_link: window.location.href.replace("create-event/", "participate/" + itemID),
        admin_link: window.location.href.replace("create-event/", "edit-event/" + itemID + "?k=" + adminKey)
    };
    addToHistory(eventData);

    notify(gettext("Data saved to history"));

    // Removing unsaved event from localStorage
    localStorage.removeItem("unsavedEvent");

    section.innerHTML = newHTMLContent;
}
