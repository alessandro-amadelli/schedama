document.addEventListener('DOMContentLoaded', () => {
    initializeChartTot();

    initializeChartDates();

    // Add participant functionality
    document.querySelector("#btnAddParticipant").onclick = () => {
        addParticipant();
    };

    // Cancel add participant functionality
    document.querySelector("#btnCancelAddParticipant").onclick = () => {
        cancelAddParticipant();
    };

    // Save added participants
    document.querySelector("#btnSaveParticipants").onclick = () => {
        addParticipants();
    };

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
            backgroundColor: ["#00CF0E", "#6f7372"],
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

    let data = {
        labels: evDates,
        datasets: [{
            label: "Preferences",
            data: values,
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
                        stepSize: 1
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

function validateAddParticipants() {
    let isValidated = true;
    const newParticipants = document.querySelectorAll(".new-participant");

    if (newParticipants.length == 0) {
        return false;
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

    console.log(data);

    await fetch('/add-participant/', initObject)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            participantAddedSuccessfully(data);
        })
        .catch(function (err) {
            console.log("An error occurred: ", err);
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