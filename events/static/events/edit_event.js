document.addEventListener('DOMContentLoaded', () => {

    // Event listener on every input field to enable btn to save event info
    document.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("change", () => {
            enableSave();
        });
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
        participant.parentElement.parentElement.parentElement.querySelectorAll("input[type=checkbox]").forEach((c) => {
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
    console.log(data);

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