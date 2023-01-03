document.addEventListener('DOMContentLoaded', () => {

    // Event listener on every input field to enable btn to save event info
    document.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("change", () => {
            enableSave();
        });
    });
    
    // Button to add a new date to the event
    const btnAddDate = document.querySelector("#btnAddDate");
    btnAddDate.onclick = () => {
        createNewDate();
    }

    // Initialize remove dates buttons (if present)
    document.querySelectorAll(".remove-date").forEach((btn) => {
        btn.onclick = () => {
            const delDiv = btn.parentElement;
            const dateDiv = delDiv.previousElementSibling;
            const w100 = delDiv.previousElementSibling;
            w100.remove();
            dateDiv.remove();
            delDiv.remove();
        };
    });

    // Initialize remove participant buttons
    document.querySelectorAll(".remove-participant").forEach((btn) => {
        btn.onclick = () => {
            btn.parentElement.parentElement.parentElement.parentElement.remove();
            enableSave();
        };
    });

});

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
        eventParticipants.push(partData);
    });

    const eventAddParticipant = document.querySelector("#switchAddParticipant").checked;
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
            remove_participant: eventRemoveParticipant
        }
    };

    return eventData;
}

async function sendUpdateToServer() {
    const data = getEventData();
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
            console.log(data);
            eventUpdated(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", "An error has occurred. Please try again later.");
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