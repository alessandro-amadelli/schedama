document.addEventListener('DOMContentLoaded', () => {
    fillHistory();

    // Event listener for ordering button to toggle between different ordering options
    const orderingBtn = document.querySelector("#orderingBtn");
    if (!orderingBtn) return;
    orderingBtn.addEventListener("click", function() {
        const currentOrdering = this.dataset.ordering;
        let newOrdering;
        switch (currentOrdering) {
            case "last_visited_desc":
                newOrdering = "last_visited_asc";
                this.innerHTML = `<i class="fa-solid fa-arrow-down-short-wide"></i>&nbsp;${gettext("Last visited")}`;
                break;
            case "last_visited_asc":
                newOrdering = "title_asc";
                this.innerHTML = `<i class="fa-solid fa-arrow-down-short-wide"></i>&nbsp;${gettext("Title")}`;
                break;
            case "title_asc":
                newOrdering = "title_desc";
                this.innerHTML = `<i class="fa-solid fa-arrow-down-wide-short"></i>&nbsp;${gettext("Title")}`;
                break;
            case "title_desc":
                newOrdering = "last_visited_desc";
                this.innerHTML = `<i class="fa-solid fa-arrow-down-wide-short"></i>&nbsp;${gettext("Last visited")}`;
                break;
            default:
                newOrdering = "last_visited_desc";
                this.innerHTML = `<i class="fa-solid fa-arrow-down-wide-short"></i>&nbsp;${gettext("Last visited")}`;
        }
        this.dataset.ordering = newOrdering;
        fillHistory();
    });
});


function getHistoryData() {
    const history = localStorage.getItem("history");
    return history;
}


function fillHistory() {
    const historyContainer = document.querySelector(".history-container");
    document.querySelectorAll(".history-col").forEach(card => card.remove());

    let history = getHistoryData();
    if (!history) {
        historyContainer.classList.add("text-center", "display-5");
        historyContainer.innerHTML = `<i class="fa-solid fa-ban fs-1"></i>` + gettext("Nothing to see here...");
        return false;
    }

    // Get ordering preference from the ordering button's data attribute
    const ordering = document.querySelector("#orderingBtn").dataset.ordering;

    // Parse history data into JSON format
    history = JSON.parse(history);

    // sort history data based on last_visited or title
    history.sort(function(a, b) {
        if (ordering === "last_visited_desc") {
            return b.last_visited_epoch - a.last_visited_epoch;
        } else if (ordering === "last_visited_asc") {
            return a.last_visited_epoch - b.last_visited_epoch;
        } else if (ordering === "title_asc") {
            return a.title.localeCompare(b.title);
        } else if (ordering === "title_desc") {
            return b.title.localeCompare(a.title);
        }
    });

    // for every history item, create history card
    history.forEach(item => {
        const linkBg = document.querySelector("body").classList.contains("dark-mode") ? "text-bg-dark" : "text-bg-light";
        const adminLink = item.hasOwnProperty("admin_link") ? `<a class="card-link" href="${item.admin_link}"><i class="fa-regular fa-id-card text-primary p-1 rounded ${linkBg}"></i></a>` : '';

        const shareBtn = generateShareBtn(item.participation_link);

        const cardTemplate = `
            <div class="col history-col d-flex entering-2">
                <div class="card history-card shadow w-100" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title text-truncate">
                            ${item.private_event ? `<i class="fa-solid fa-lock"></i>&nbsp;` : ''}${item.title}
                        </h5>
                        <p class="card-text">
                            <i class="fa-solid fa-clock-rotate-left text-muted"></i>&nbsp;${item.last_visited}
                        </p>
                        ${item.author ? `<p class="card-text">${gettext("Author:")} ${item.author}</p>` : ''}
                    </div>
                    <div class="card-footer">
                        <a class="card-link" href="${item.participation_link}"><i class="fa-solid fa-user-group text-warning p-1 rounded ${linkBg}"></i></a>
                        ${adminLink}
                        <span class="float-end">
                            ${shareBtn.innerHTML}
                        </span>
                    </div>
                </div>
            </div>
        `;

        historyContainer.insertAdjacentHTML('beforeend', cardTemplate);
    });
}