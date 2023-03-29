document.addEventListener('DOMContentLoaded', () => {
    fillHistory();
});

function getHistoryData() {
    const history = localStorage.getItem("history");

    return history
}

function fillHistory() {
    const historyContainer = document.querySelector(".history-container");

    let history = getHistoryData();
    if (!history) {
        historyContainer.classList.add("text-center", "display-5");
        historyContainer.innerHTML = `<span class="material-symbols-outlined fs-1">block</span>` + gettext("Nothing to see here...");
        return false;
    }

    // Parse history data into JSON format
    history = JSON.parse(history);

    // sort history data based on last_visited
    history.sort(function(a,b) {
        return b.last_visited_epoch - a.last_visited_epoch;
    });
    
    // for every history item, create history card
    history.forEach(item => {
        // Card col
        const newCol = document.createElement("div");
        newCol.setAttribute("class", "col d-flex appearing");

        // Card div
        const newCard = document.createElement("div");
        newCard.setAttribute("class", "card shadow");
        newCard.style = "width: 18rem;"
        
        // Body
        const cardBody = document.createElement("div");
        cardBody.setAttribute("class", "card-body");

        // Title
        const cardTitle = document.createElement("h5");
        cardTitle.setAttribute("class", "card-title text-truncate");
        cardTitle.innerText = item.title;

        // Last visited
        const cardP = document.createElement("p");
        cardP.setAttribute("class", "card-text");
        cardP.innerHTML = `<span class="material-symbols-outlined text-muted">history</span> ` + item.last_visited;

        // Card footer
        const cardFooter = document.createElement("div");
        cardFooter.setAttribute("class", "card-footer");

        // Participation link
        const partLink = document.createElement("a");
        partLink.setAttribute("class", "card-link");
        partLink.setAttribute("href", item.participation_link);
        partLink.innerHTML = `<span class="material-symbols-outlined text-warning p-1 rounded text-bg-light">group</span>`;

        // Administration link
        let admLink = null;
        if (item.hasOwnProperty('admin_link')) {
            admLink = document.createElement("a");
            admLink.setAttribute("class", "card-link");
            admLink.setAttribute("href", item.admin_link);
            admLink.innerHTML = `<span class="material-symbols-outlined text-primary p-1 rounded text-bg-light">badge</span>`;
        }

        // Append elements
        newCol.appendChild(newCard);
        newCard.appendChild(cardBody);
        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardP);
        newCard.appendChild(cardFooter);
        cardFooter.appendChild(partLink);
        if (admLink) {
            cardFooter.appendChild(admLink);
        }
        historyContainer.appendChild(newCol);
    });
}