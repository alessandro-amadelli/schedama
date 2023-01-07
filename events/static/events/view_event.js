document.addEventListener('DOMContentLoaded', () => {
    // Draw charts
    if (participants.length > 0) {
        initializeChartTot();
        initializeChartDates();
    } else {
        displayNoData();
    }

    // Button to participate event (shows modal)
    const btnParticipate = document.querySelector("#btnParticipate");
    if (btnParticipate) {
        btnParticipate.onclick = () => {
            prepareParticipateModal();
        };
    }

    // Button to confirm participation
    const btnConfirmParticipate = document.querySelector("#btnConfirmParticipate");
    if (btnConfirmParticipate) {
        btnConfirmParticipate.onclick = () => {
            sendParticipationToServer();
        };
    }

    // Transform location in a Google Maps link
    const locationLink = document.querySelector("#eventLocation");
    if (locationLink) {
        locationLink.setAttribute("href", "https://www.google.com/maps/search/?api=1&query=" + encodeURI(locationLink.innerText));
    }

});

function displayNoData() {
    
    const chartDiv = document.querySelector("#chartAreaDiv");
    chartDiv.innerHTML = `<div class="col-12">
    <span class="material-symbols-outlined">data_usage</span> No data
    </div>
    `;
    chartDiv.classList.add("text-center");
    return false;

}

function initializeChartTot() {
    let confirmed = 0;
    let notConfirmed = 0;
    participants.forEach(p => {
        if (p.dates.length > 0) {
            confirmed += 1;
        } else {
            notConfirmed +=1;
        }
    });

    let data = {
        labels: [gettext("Confirmed"),gettext("Not confirmed")],
        datasets: [{
            backgroundColor: ["#00cc99", "#6f7372"],
            data: [confirmed, notConfirmed],
            hoverOffset: 10,
            borderWidth: 0,
            spacing: 5
        }],        
    };

    let config = {
        type: 'doughnut',
        data,
        options: {
            cutout: "88%",
            plugins: {
                legend: {
                display: false
                },
            },
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart, a, b) {
                const width = chart.width,
                height = chart.height,
                ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height/110).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                const text = confirmed + "/" + (confirmed + notConfirmed),
                textX = Math.round((width - ctx.measureText(text).width) / 2),
                textY = height / 2;
                ctx.fillText(text, textX, textY);
                if (document.querySelector("body").classList.contains("dark-mode")) {
                    ctx.fillStyle = "#ffffff";
                } else {
                    ctx.fillStyle = "#000000";
                }
                ctx.save();
            }
        }]
    };

    let totDoughnutPlot = new Chart(
        document.querySelector("#totChart"),
        config
    );
}

function initializeChartDates() {
    let evDates = dates.slice();
    let values = [];
    let noIndic = 0;
    let color = [];

    evDates.forEach(d => {
        datVal = 0;
        participants.forEach((p, i) => {
            if (p.dates.includes(d)) {
                datVal += 1;
            } 
        });
        values.push(datVal);
    });

    participants.forEach((p) => {
        if (p.dates.length == 0) {
            noIndic += 1;
        }
    });

    evDates.push(gettext("No Indications"));
    values.push(noIndic);

    // Set color of bars (with max bars colored differently)
    values.forEach((val) => {
        if (val == Math.max(...values)) {
            color.push("#00cc99");
        } else {
            color.push("#006699");
        }
    });

    let data = {
        labels: evDates,
        datasets: [{
            label: gettext("Preferences"),
            data: values,
            backgroundColor: color,
            barPercentage: 0.4,
            borderRadius: 5
        }],
    };

    let config = {
        type: "bar",
        data,
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        stepSize: 1,
                        display: false
                    }
                }
            }
        }
    };

    let dateBarChart = new Chart(
        document.querySelector("#datesChart"),
        config
    );
}

function prepareParticipateModal() {
    const modalParticipate = document.querySelector("#modalParticipate");
    const partName = modalParticipate.querySelector("#newPartName");
    
    // Empty input with participant name
    partName.value = "";

    // Removing old dates
    modalParticipate.querySelectorAll(".modal-date").forEach((date) => {
        date.remove();
    });

    // Adding dates with switch
    const dateFormatted = document.querySelectorAll(".date-formatted");
    dates.forEach((date, i) => {
        const newDiv = document.createElement("div");
        newDiv.classList.add("form-check","form-switch", "modal-date");

        const newDateSwitch= document.createElement("input");
        newDateSwitch.setAttribute("type", "checkbox");
        newDateSwitch.setAttribute("role", "switch");
        newDateSwitch.setAttribute("value", date);
        newDateSwitch.setAttribute("name", "switchAddParticipant");
        newDateSwitch.classList.add("form-check-input");

        const newLabel = document.createElement("label");
        newLabel.setAttribute("for","switchAddParticipant");
        newLabel.classList.add("form-check-label");

        // Display label text in a readable format
        let formattedText = dateFormatted[i].querySelector(".formattedDate").innerText + " h." + dateFormatted[i].querySelector(".formattedTime").innerText;
        newLabel.innerText = formattedText;

        // Append new elements
        newDiv.appendChild(newDateSwitch);
        newDiv.appendChild(newLabel);
        modalParticipate.querySelector(".modal-body").appendChild(newDiv);
    });
}

function validateParticipateModal() {
    const partName = document.querySelector("#newPartName");
    if (partName.value == "") {
        setInvalid(partName, true);
        return false;
    }
    setInvalid(partName, false);
    return true;
}

async function sendParticipationToServer() {

    // Modal validation (check if name is empty)
    isValid = validateParticipateModal();
    if (!isValid) {
        return false;
    }

    const csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;

    // New participant data
    const newPartName = document.querySelector("#newPartName").value;
    let newPartDates = [];
    document.querySelector("#modalParticipate").querySelectorAll("input[type=checkbox]").forEach((check) => {
        if (check.checked) {
            newPartDates.push(check.value);
        }
    });

    const data = {
        item_id: document.querySelector("#item-id").innerText,
        new_participant: {
            name: newPartName,
            dates: newPartDates
        }
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

    await fetch('/add-participant/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            participantAddedSuccessfully(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", gettext("An error has occurred. Please try again later."));
            removeLoading();
        });
}

function participantAddedSuccessfully(data) {
    if (data.status == "OK") {
        window.location.reload();
    } else {
        showPageMsg("alert-danger", data.description);
        removeLoading();
    }
}