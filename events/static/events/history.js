document.addEventListener('DOMContentLoaded', () => {
    fillHistory();
});


function getHistoryData() {
    const history = localStorage.getItem("history");
    return history;
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
    history.sort(function(a, b) {
        return b.last_visited_epoch - a.last_visited_epoch;
    });

    // for every history item, create history card
    history.forEach(item => {
        const linkBg = document.querySelector("body").classList.contains("dark-mode") ? "text-bg-dark" : "text-bg-light";
        const adminLink = item.hasOwnProperty("admin_link") ? `<a class="card-link" href="${item.admin_link}"><i class="fa-regular fa-id-card text-primary p-1 rounded ${linkBg}"></i></a>` : '';

        const shareBtn = generateShareBtn(item.participation_link);

        const cardTemplate = `
            <div class="col d-flex appearing">
                <div class="card shadow w-100" style="width: 18rem;">
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