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
        historyContainer.innerHTML = `<i class="fa-solid fa-ban fs-1"></i>` + gettext("Nothing to see here...");
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
        if (item.hasOwnProperty("private_event")) {
            if (item["private_event"]) {
                cardTitle.innerHTML = `<i class="fa-solid fa-lock"></i>&nbsp;${item.title}`;
            }
        }

        // Last visited
        const cardP = document.createElement("p");
        cardP.setAttribute("class", "card-text");
        cardP.innerHTML = `<i class="fa-solid fa-clock-rotate-left text-muted"></i>&nbsp;${item.last_visited}`;

        // Event author
        const cardP2 = document.createElement("p");
        cardP2.setAttribute("class", "card-text");
        cardP2.innerText = gettext("Author:") + ` ${item.author}`;

        // Card footer
        const cardFooter = document.createElement("div");
        cardFooter.setAttribute("class", "card-footer");

        // Background light/dark for links
        let linkBg = "text-bg-light";
        if (document.querySelector("body").classList.contains("dark-mode")){
            linkBg = "text-bg-dark";
        }

        // Participation link
        const partLink = document.createElement("a");
        partLink.setAttribute("class", "card-link");
        partLink.setAttribute("href", item.participation_link);
        partLink.innerHTML = `<i class="fa-solid fa-user-group text-warning p-1 rounded ` + linkBg + `"></i>`;

        // Administration link
        let admLink = null;
        if (item.hasOwnProperty('admin_link')) {
            admLink = document.createElement("a");
            admLink.setAttribute("class", "card-link");
            admLink.setAttribute("href", item.admin_link);
            admLink.innerHTML = `<i class="fa-regular fa-id-card text-primary p-1 rounded ` + linkBg + `"></i>`;
        }

        // Append elements
        newCol.appendChild(newCard);
        newCard.appendChild(cardBody);
        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardP);
        if (item.author) {
            cardBody.appendChild(cardP2);
        }
        newCard.appendChild(cardFooter);
        cardFooter.appendChild(partLink);
        if (admLink) {
            cardFooter.appendChild(admLink);
        }
        historyContainer.appendChild(newCol);
    });
}