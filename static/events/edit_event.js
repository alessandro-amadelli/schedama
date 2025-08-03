document.addEventListener('DOMContentLoaded', () => {

    // Event listener on every input field to enable btn to save event info
    document.querySelectorAll("input").forEach((inp) => {
        // Ignore input inside modal (managed differently)
        if (inp.getAttribute("id") != "newPartName") {
            inp.addEventListener("change", enableSave);
        }
    });

    // Event listener on description
    document.querySelector("#eventDescription").addEventListener('change', enableSave);
    document.querySelector("#eventDescription").addEventListener('keyup', updateCharCount);
    updateCharCount();

    // Add new date on input date change instead of clicking to add date
    document.querySelector("#dateInp").addEventListener('change', () => {
        createNewDate();
    });

    // Initialize remove dates buttons (if present)
    document.querySelectorAll(".remove-date").forEach((btn) => {
        btn.onclick = () => {
            const delDiv = btn.parentElement;
            const dateDiv = delDiv.previousElementSibling;
            const w100 = delDiv.previousElementSibling;
            w100.remove();
            dateDiv.remove();
            delDiv.remove();

            enableSave();
        };
    });

    // Event listener for duration change
    document.querySelectorAll("input[type=range]").forEach((range) => {
        range.addEventListener('input', updateDuration);
    });

    // Initialize remove participant buttons
    document.querySelectorAll(".remove-participant").forEach((btn) => {
        btn.onclick = () => {
            removeParticipantRow(btn);
        };
    });

    // Initialize button do add participant
    document.querySelector("#btnOpenAddPartModal").onclick = () => {
        prepareModalAddPart();
    };

    // Initialize modal add participant confirm button
    document.querySelector("#btnConfirmAdd").onclick = () => {
        addParticipantToTable();
    };

    // Checkbox to confirm event cancellation
    const checkCancelEvent = document.querySelector("#checkCancelEvent");
    if (checkCancelEvent) {
        checkCancelEvent.removeEventListener('change', enableSave);
        checkCancelEvent.addEventListener('change', enableCancel);
    }

    // Button to cancel event
    const btnCancelEvent = document.querySelector("#btnCancelEvent");
    if (btnCancelEvent) {
        btnCancelEvent.onclick = () => {
            sendEventCancellationToServer();
        }
    }
    
    // Button to reactivate event
    const btnReactivateEvent = document.querySelector("#btnReactivateEvent");
    if (btnReactivateEvent) {
        btnReactivateEvent.onclick = () => {
            sendEventReactivationToServer();
        }
    }

    // Calculate event duration and update duration ranges accordingly
    calculateDuration();

    // Update localStorage history
    updateHistory();

    // Event listener for theme thumbnails
    document.querySelectorAll(".theme-thumbnail").forEach((item) => {
        item.addEventListener('click', () => {selectEventTheme(item)});
    });

    // Event listener for restoring removed participants from event bin
    document.querySelectorAll(".removed-participant").forEach((item) => {
        item.addEventListener("click", () => {restoreParticipant(item)});
    });

    // Event listener to show password inputs based on private_event flag
    document.getElementById("switchPrivateEvent").addEventListener('change', togglePasswordVisibility);
    togglePasswordVisibility();

    document.querySelector("#btnSettingsOk").onclick = () => {
        const btnSaveEvent = document.querySelector("#btnSaveEvent");
        if (btnSaveEvent && !btnSaveEvent.classList.contains("visually-hidden")) {
            setTimeout(() => {
                    btnSaveEvent.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
            }, 400);
        }
    }
    });

var removedParticipantsArray = [];
var restoredParticipantsArray = [];

function togglePasswordVisibility() {
    const switchPrivateEvent = document.getElementById("switchPrivateEvent");
    if (switchPrivateEvent) {
        const passwordDiv = document.querySelectorAll(".password-div");
        if (switchPrivateEvent.checked) {
            passwordDiv.forEach((div) => {
                div.style.display = "block";
            });
        } else {
            passwordDiv.forEach((div) => {
                div.style.display = "none";
                div.querySelector("input").value = "";
            });
        }
    }
}

function restoreParticipant(item) {
    const partUID = item.dataset.partuid;

    if (partUID) {
        let currentMode = localStorage.getItem("currentMode");
        if (!currentMode) {
            currentMode = "dark";
        }
        if (restoredParticipantsArray.includes(partUID)) {
            restoredParticipantsArray.splice(restoredParticipantsArray.indexOf(partUID),1);
            item.classList.add(`text-bg-${currentMode}`);

            item.classList.remove("text-bg-warning");
        } else {
            restoredParticipantsArray.push(partUID);
            item.classList.remove(`text-bg-${currentMode}`);
            item.classList.add("text-bg-warning");
        }
    }

    enableSave();
}


function selectEventTheme(clickedItem) {
    if (clickedItem.classList.contains("thumbnail-selected")) {
        return true;
    }

    document.querySelectorAll(".thumbnail-selected").forEach((element) => {
        element.classList.remove("thumbnail-selected");
    })
    clickedItem.classList.add("thumbnail-selected");

    enableSave();
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


function calculateDuration() {
    let duration = parseInt(document.querySelector("#durationText").innerText);

    if (duration >= (24 * 60)) {
        let days = parseInt(duration / 60 / 24);
        document.querySelector("#durationDays").value = days;
        duration = duration - (days * 60 * 24);
    }
    if (duration >= 60) {
        let hours = parseInt(duration / 60);
        document.querySelector("#durationHours").value = hours;
        duration = duration - (hours * 60);
    }

    document.querySelector("#durationMinutes").value = duration;

    updateDuration();
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


function removeParticipantRow(btn) {
    const partRow = btn.parentElement.parentElement.parentElement.parentElement;
    const partUID = partRow.querySelector("input[name='participantName']").dataset.partuid;
    if (partUID){
        removedParticipantsArray.push(partUID);
    }
    partRow.remove();
    updateParticipantsNum();
    enableSave();
    notify(gettext("Participant removed"));
}


function enableSave() {
    const btnSave = document.querySelector("#btnSaveEvent");
    if (btnSave.disabled) {
        btnSave.onclick =  () => {
            sendUpdateToServer();
        };
        btnSave.disabled = false;
        btnSave.classList.remove("visually-hidden");
    }
}


function enableCancel() {
    document.querySelector("#btnCancelEvent").disabled = !document.querySelector("#checkCancelEvent").checked;
}


function createNewDate() {
    const dateRow = document.querySelector("#dateRow");
    const firstDate = dateRow.querySelector("#dateInp"); // First date input field

    if (firstDate.value == '') {
        setInvalid(firstDate, true);
        return false;
    } else {
        enableSave();
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
    newBtnDel.classList.add("fa-solid", "fa-trash-can", "fs-2", "cursor-pointer", "remove-date", "text-danger");
    newBtnDel.onclick = () => {
        new100.remove();
        newDateCol.remove();
        newBtnCol.remove();
    }
    newBtnCol.appendChild(newBtnDel);

    //Append new children
    dateRow.appendChild(new100);
    dateRow.appendChild(newDateCol);
    dateRow.appendChild(newBtnCol);

    // Set new input value to first date and reset first date value
    newDateInp.value = firstDate.value;
    firstDate.value = "";
    setInvalid(firstDate, false);

    // Show notification for the added date
    notify(gettext("Date added"));
}


function updateParticipantsNum() {
    document.querySelector("#participantsNum").innerText = document.querySelectorAll("input[name=participantName]").length;
}


function prepareModalAddPart() {
    const modalAddPart = document.querySelector("#modalAddParticipant");
    const partName = modalAddPart.querySelector("#newPartName");
    
    // Empty input with participant name
    partName.value = "";

    // Removing old dates
    modalAddPart.querySelectorAll(".modal-date").forEach((date) => {
        date.remove();
    });

    // Adding date switch for each available date to modal
    document.querySelectorAll("input[name=eventDate]").forEach((date, indx) => {
        const newDiv = document.createElement("div");
        //newDiv.classList.add("form-check","form-switch", "modal-date");
        newDiv.classList.add("modal-date", "col-12", "col-md-6", "mb-2");

        const newDateSwitch= document.createElement("input");
        const newInpID = "checkDateParticipant" + indx;
        newDateSwitch.setAttribute("id", newInpID);
        newDateSwitch.setAttribute("type", "checkbox");
        //newDateSwitch.setAttribute("role", "switch");
        newDateSwitch.setAttribute("value", date.value);
        newDateSwitch.setAttribute("name", "switchAddParticipant");
        newDateSwitch.setAttribute("checked", "true");
        //newDateSwitch.classList.add("form-check-input");
        newDateSwitch.classList.add("btn-check");

        const newLabel = document.createElement("label");
        newLabel.setAttribute("for", newInpID);
        newLabel.classList.add("btn", "btn-outline-info", "w-100", "check-label");
        newLabel.innerText = formatDateString(date.value);

        // Append new elements
        newDiv.appendChild(newDateSwitch);
        newDiv.appendChild(newLabel);
        modalAddPart.querySelector(".modal-body").appendChild(newDiv);
    });
}


function addParticipantToTable() {
    const modalAddPart = document.querySelector("#modalAddParticipant");
    const partName = modalAddPart.querySelector("#newPartName");
    if (partName.value == "") {
        setInvalid(partName, true);
        return false;
    }
    
    setInvalid(partName, false);

    const newTr = document.createElement("tr");

    const newTdInp = document.createElement("td");
    newTdInp.style.minWidth = "20em";

    const newRow = document.createElement("div");
    newRow.classList.add("row");

    const newCol1 = document.createElement("div");
    newCol1.classList.add("col-1");

    // Button to remove participant
    const newSpan = document.createElement("i");
    newSpan.classList.add("fa-solid", "fa-trash-can","cursor-pointer","remove-participant","text-danger");
    newSpan.onclick = () => {
        removeParticipantRow(newSpan);
    };

    const newCol2 = document.createElement("div");
    newCol2.classList.add("col-11");

    const newInp = document.createElement("input");
    newInp.setAttribute("type","text");
    newInp.setAttribute("name","participantName");
    newInp.setAttribute("value", partName.value);
    newInp.setAttribute("maxlength","30");
    newInp.classList.add("form-control");

    // Append elements
    document.querySelector("#participantTable").querySelector("tbody").prepend(newTr);
    newTr.appendChild(newTdInp);
    newTdInp.appendChild(newRow);
    newRow.appendChild(newCol1);
    newCol1.appendChild(newSpan);
    newRow.appendChild(newCol2);
    newCol2.appendChild(newInp);

    // Create date TDs and append to table
    modalAddPart.querySelectorAll("input[type=checkbox]").forEach((check) => {
        const newDateTd = document.createElement("td");

        const newDateCheck = document.createElement("input");
        newDateCheck.setAttribute("type","checkbox");
        newDateCheck.setAttribute("value", check.value);
        newDateCheck.classList.add("form-check-input");
        newDateCheck.checked = check.checked;

        // Append elements
        newDateTd.appendChild(newDateCheck);
        newTr.appendChild(newDateTd);
    })

    // Close modal
    modalAddPart.querySelector("[data-bs-dismiss=modal]").click();

    enableSave();
}


function getEventData() {
    const eventAuthor = document.getElementById("eventAuthor").value;
    const eventTitle = document.getElementById("eventTitle").value;
    const eventDescription = document.getElementById("eventDescription").value;
    const hasLocation = document.getElementById("checkEventLocation").checked;
    const eventLocation = document.getElementById("eventLocation").value;

    let eventDates = [];
    document.querySelectorAll("input[name=eventDate]").forEach((date) => {
        eventDates.push(date.value);
    });
    let eventParticipants = [];
    document.querySelectorAll("input[name=participantName]").forEach((participant) => {
        partName = participant.value;
        partDates = [];
        // Select all checked checkboxes for dates
        participant.parentElement.parentElement.parentElement.parentElement.querySelectorAll("input[type=checkbox]").forEach((c) => {
            if (c.checked) {
                partDates.push(c.value);
            }
        });

        partData = {
            name: partName,
            dates: partDates
        }
        // Participant's unique ID
        uid = participant.dataset.partuid;
        if (uid) {
            partData["uid"] = uid;
        }
        eventParticipants.push(partData);
    });

    // Event duration
    const durationDays = parseInt(document.querySelector("#durationDays").value);
    const durationHours = parseInt(document.querySelector("#durationHours").value);
    const durationMinutes = parseInt(document.querySelector("#durationMinutes").value);
    const eventDuration = (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes;

    const eventAddParticipant = document.querySelector("#switchAddParticipant").checked;
    const eventEditParticipant = document.querySelector("#switchEditParticipant").checked;
    const eventRemoveParticipant = document.querySelector("#switchRemoveParticipant").checked;

    const itemID = document.querySelector("#item-id").value;
    const adminKey = document.querySelector("#admin-key").value;
    
    let selectedTheme = document.querySelector(".thumbnail-selected");
    if (!selectedTheme) {
        document.querySelector(".theme-thumbnail").classList.add("thumbnail-selected");
        selectedTheme = document.querySelector(".thumbnail-selected");
    }
    let eventTheme = selectedTheme.dataset.theme;
    if (!eventTheme) {
        eventTheme = "";
    }

    let privateEvent = document.getElementById("switchPrivateEvent") || false;
    if (privateEvent) {
        privateEvent = privateEvent.checked;
    }
    let password1 = document.getElementById("password_1").value;
    let password2 = document.getElementById("password_2").value;

    const eventData = {
        item_id: itemID,
        admin_key: adminKey,
        author: eventAuthor,
        title: eventTitle,
        description: eventDescription,
        has_location: hasLocation,
        location: eventLocation,
        dates: eventDates,
        duration: eventDuration,
        event_theme: eventTheme,
        participants: eventParticipants,
        removed_participants: removedParticipantsArray,
        restored_participants: restoredParticipantsArray,
        private_event: privateEvent,
        password_1: password1,
        password_2: password2,
        settings: {
            add_participant: eventAddParticipant,
            edit_participant: eventEditParticipant,
            remove_participant: eventRemoveParticipant
        }
    };

    return eventData;
}


async function sendUpdateToServer() {
    const data = getEventData();

    const isValidated = validateEvent(data);
    if (!isValidated) {
        showPageMsg("alert-danger", gettext("Please, check input fields."));
        return false;
    }

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
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

    await fetch('/update-event/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            eventUpdated(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}


function eventUpdated(data) {
    if (data.status == "OK") {
        window.location.reload();
    } else {
        showPageMsg("alert-danger", data.description);
        removeLoading();
    }
}


async function sendEventCancellationToServer() {
    const dataFull = getEventData();
    
    const data = {
        item_id: dataFull.item_id,
        admin_key: dataFull.admin_key
    }

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
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

    await fetch('/cancel-event/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            eventCanceled(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}


function eventCanceled(data) {
    removeLoading();

    if (data.status == "ERROR") {
        showPageMsg("alert-danger", data.description);
        return false;
    }

    window.location.reload();
}


async function sendEventReactivationToServer() {
    const dataFull = getEventData();
    
    const data = {
        item_id: dataFull.item_id,
        admin_key: dataFull.admin_key
    }

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;
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

    await fetch('/reactivate-event/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            window.location.reload();
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}


function updateHistory() {
    const eventDataFull = getEventData();
    let itemID = eventDataFull.item_id;
    const partLink = `${window.location.origin}/participate/${itemID}`;

    let privateEventBadge = !!document.getElementById("privateEventBadge");

    const eventData = {
        item_id: eventDataFull.item_id,
        author: eventDataFull.author,
        title: eventDataFull.title,
        participation_link: partLink,
        admin_link: window.location.href,
        private_event: privateEventBadge
    }

    addToHistory(eventData);
}

function formatDateString(dateStr) {
    // Takes an ISO date string and returns a formatted date string
    const date = new Date(dateStr);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = date.toLocaleString('it-IT', options);
    return formattedDate.replace(",", "");
}