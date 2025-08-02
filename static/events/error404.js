document.addEventListener('DOMContentLoaded', () =>{
    const eventID = document.querySelector("#eventID");
    if (eventID) {
        removeFromHistory(eventID.innerText);
    }
});
