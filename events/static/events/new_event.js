document.addEventListener('DOMContentLoaded', () => {
    initializeTitleRow();

    // Button to save event
    document.querySelector("#btnSaveEvent").onclick = () => {
        validateEvent();
    }

    // Button to add a new date to the event
    const btnAddDate = document.querySelector("#add-date");
    btnAddDate.onclick = () => {
        createNewDate();
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
        let restoreData = confirm("You have an unsaved event. Do you want to load previous data?");
        if (restoreData) {
            restorePreviousData();
        } else {
            localStorage.removeItem("unsavedEvent");
        }
    }

});

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
}

function createNewDate() {
    const dateRow = document.querySelector("#dateRow");
    const firstDate = dateRow.querySelector("input"); // First date input field

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
    const firstDate = document.querySelector("#dateRow").querySelector("input");
    const dates = document.querySelectorAll("[name='eventDate']");
    if (dates.length == 0) {
        setInvalid(firstDate, true);
        validated = false;
    } else {
        setInvalid(firstDate, false);
    }
}

function restorePreviousData() {
    const unsavedEvent = JSON.parse(localStorage.getItem("unsavedEvent"));

    if (!unsavedEvent) {
        return false;
    }

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
        document.querySelector("#dateRow").querySelector("input").value = item;
        createNewDate();
    })

}

function saveLocally() {
    const eventTitle = document.querySelector("#eventTitle").value;
    const eventLocation = document.querySelector("#eventLocation").value;
    const locationActive = document.querySelector("#checkEventLocation").checked;
    const eventDates = document.querySelectorAll("[name='eventDate']");
    
    let dateList = [];
    eventDates.forEach((item) => {
        dateList.push(item.value);
    });

    // Create unsaved event object
    unsavedEvent = {
        "title": eventTitle,
        "location": eventLocation,
        "has_location": locationActive,
        "dates": dateList
    }

    // Save event data to local storage
    localStorage.setItem("unsavedEvent", JSON.stringify(unsavedEvent)); 
}