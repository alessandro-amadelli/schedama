document.addEventListener('DOMContentLoaded', () => {

    // Event listener on every input field to enable btn to save event info
    document.querySelectorAll("input").forEach((inp) => {
        // Ignore input inside modal (managed differently)
        if (inp.getAttribute("id") != "newPartName") {
            inp.addEventListener("change", () => {
                enableSave();
            });
        }
    });

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

    // Update localStorage history
    updateHistory();
});

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
    const locSwitch = document.querySelector("#checkEventLocation");
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

function removeParticipantRow(btn) {
    btn.parentElement.parentElement.parentElement.parentElement.remove();
    updateParticipantsNum();
    enableSave();
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
    const newBtnDel = document.createElement("span");
    newBtnDel.classList.add("material-symbols-outlined", "fs-1", "cursor-pointer", "remove-date", "text-danger");
    newBtnDel.innerText = "delete";
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
    document.querySelectorAll("input[name=eventDate]").forEach((date) => {
        const newDiv = document.createElement("div");
        newDiv.classList.add("form-check","form-switch", "modal-date");

        const newDateSwitch= document.createElement("input");
        newDateSwitch.setAttribute("type", "checkbox");
        newDateSwitch.setAttribute("role", "switch");
        newDateSwitch.setAttribute("value", date.value);
        newDateSwitch.setAttribute("name", "switchAddParticipant");
        newDateSwitch.setAttribute("checked", "true");
        newDateSwitch.classList.add("form-check-input");

        const newLabel = document.createElement("label");
        newLabel.setAttribute("for","switchAddParticipant");
        newLabel.classList.add("form-check-label");
        newLabel.innerText = date.value;

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
    const newSpan = document.createElement("span");
    newSpan.classList.add("material-symbols-outlined","cursor-pointer","remove-participant","text-danger");
    newSpan.innerText = "delete";
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
    const eventTitle = document.querySelector("#eventTitle").value;
    const hasLocation = document.querySelector("#checkEventLocation").checked;
    const eventLocation = document.querySelector("#eventLocation").value;
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

    const eventAddParticipant = document.querySelector("#switchAddParticipant").checked;
    const eventEditParticipant = document.querySelector("#switchEditParticipant").checked;
    const eventRemoveParticipant = document.querySelector("#switchRemoveParticipant").checked;

    const itemID = document.querySelector("#item-id").value;
    const adminKey = document.querySelector("#admin-key").value;

    const eventData = {
        item_id: itemID,
        admin_key: adminKey,
        title: eventTitle,
        has_location: hasLocation,
        location: eventLocation,
        dates: eventDates,
        participants: eventParticipants,
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

function updateHistory() {
    const eventDataFull = getEventData();
    const partLink = (window.location.href.slice(0, window.location.href.indexOf("?k="))).replace("edit-event", "participate");

    const eventData = {
        item_id: eventDataFull.item_id,
        title: eventDataFull.title,
        participation_link: partLink,
        admin_link: window.location.href
    }

    addToHistory(eventData);
}