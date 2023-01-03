document.addEventListener('DOMContentLoaded', () => {
    initializeChartTot();

    initializeChartDates();

    // Add participant functionality
    const btnAddParticipant = document.querySelector("#btnAddParticipant");
    if (btnAddParticipant) {
        btnAddParticipant.onclick = () => {
            addParticipant();
        };
    }

    // Cancel add participant functionality
    const btnCancelAddParticipant = document.querySelector("#btnCancelAddParticipant");
    if (btnCancelAddParticipant) {
        btnCancelAddParticipant.onclick = () => {
            cancelAddParticipant();
        };
    }

    // Save added participants
    const btnSaveParticipants = document.querySelector("#btnSaveParticipants");
    if (btnSaveParticipants) {
        btnSaveParticipants.onclick = () => {
            addParticipants();
        };
    }

});

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
        labels: ["Confirmed","Not confirmed"],
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
            cutout: "85%",
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

    evDates.push("No Indications");
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
            label: "Preferences",
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

function addParticipant() {
    // Check if new participants' name are filled before adding new one
    let isValidated = validateAddParticipants(true);
    if (!isValidated) {
        return false;
    }

    const tableParticipants = document.querySelector("#tableParticipants").querySelector("tbody");
    const newTr = document.createElement("tr");
    const nameTd = document.createElement("td");
    const nameInp = document.createElement("input");
    nameInp.setAttribute("class", "form-control new-participant");
    nameInp.setAttribute("type", "text");
    nameTd.appendChild(nameInp);
    newTr.appendChild(nameTd);
    dates.forEach((date) => {
        let newTd = document.createElement("td");
        let newInp = document.createElement("input");
        newInp.setAttribute("class","form-check-input");
        newInp.setAttribute("type","checkbox");
        newInp.setAttribute("value",date);
        newTd.appendChild(newInp);
        newTr.appendChild(newTd);
    });

    // Append new row to table before first row
    tableParticipants.prepend(newTr);
    nameInp.focus();
}

function cancelAddParticipant() {
    document.querySelectorAll(".new-participant").forEach((item) => {
        item.parentElement.parentElement.remove();
    });
}

function validateAddParticipants(admitEmpty=false) {
    let isValidated = true;
    const newParticipants = document.querySelectorAll(".new-participant");

    // If there is no new participant, return value of admitEmpty {true, false}
    if (newParticipants.length == 0) {
        return admitEmpty;
    }

    newParticipants.forEach((participant) => {
        if (participant.value == "") {
            isValidated = false;
            participant.classList.remove("shaking");
            void participant.offsetWidth; // Necessary for shake animation restart
            participant.classList.add("is-invalid", "shaking");
        } else {
            participant.classList.remove("is-invalid");
        }
    });

    return isValidated;
}

function addParticipants() {

    // Check if new participants' name are filled
    let isValidated = validateAddParticipants();
    if (!isValidated) {
        return false;
    }

    // Create a dict with new participants data
    const newParticipants = document.querySelectorAll(".new-participant");
    let addedParticipants = [];

    newParticipants.forEach((newP) => {
        let newPData = {
            name: newP.value,
            dates: []
        };
        
        newP.parentElement.parentElement.querySelectorAll("input[type=checkbox]").forEach((date) => {
            if (date.checked) {
                newPData.dates.push(date.value);
            }
        });

        addedParticipants.push(newPData);

    });

    // Close modal by "clicking" the close button
    document.querySelector("[data-bs-dismiss=modal]").click();

    showLoading();

    callAddParticipant(addedParticipants);

}

async function callAddParticipant(addedParticipants) {
    const csrftoken = document.querySelector("input[name=csrfmiddlewaretoken]").value;

    const data = {
        item_id: document.querySelector("#item-id").innerText,
        participants: addedParticipants
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
            console.log(data);
            participantAddedSuccessfully(data);
        })
        .catch(function (err) {
            showPageMsg("alert-danger", "An error has occurred. Please try again later.");
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