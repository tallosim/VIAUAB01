function read_data() {
    var from = document.getElementById("planner-from").value;
    var to = document.getElementById("planner-to").value;
    var date = document.getElementById("planner-date").value;
    var time = document.getElementById("planner-time").value;
    //console.log("from: [" + from + "], to: [" + to + "], date: " + date + ", time: " + time);
    return { fromPlace: from, toPlace: to, date: date, time: time };
}

function loadingShow() {
    document.getElementById("loading").style.display = "block";
}

function loadingHide() {
    document.getElementById("loading").style.display = "none";
}

function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

function addIntineraries(json) {
    const itineraries = json.data.plan.itineraries;
    for (let i = 0; i < itineraries.length; i++) {
        const itinerary = itineraries[i];

        const startTime = pad((new Date(itinerary.startTime)).getHours()) + ":" + pad((new Date(itinerary.startTime)).getMinutes());
        const endTime = pad((new Date(itinerary.endTime)).getHours()) + ":" + pad((new Date(itinerary.endTime)).getMinutes());
        const duration = (((new Date(itinerary.duration)).getUTCHours() > 0) ? (new Date(itinerary.duration)).getUTCHours() + "ó " : "") + (new Date(itinerary.duration)).getMinutes() + "p";
        const distance = Math.floor(itinerary.walkDistance);

        var itineraryHTML = `<div class="itinerary" onclick="addRoute(json, ${i});"><div class="span-itinerary"><p class="p-itinerary">${startTime} ⇒ ${endTime}, ${distance} m séta <span class="right">${duration}</span></p><ul class="route-list" id="itinerary${i}"></ul></div></div>`;
        document.getElementById("itineraries").innerHTML += itineraryHTML;

        //steps
        document.getElementById(`itinerary${i}`).innerHTML = `<li id="${i}_0"><span class="route" style="background-image: url(img/walk.png);"></span></li>`;

        const steps = itinerary.steps;
        for (let j = 1; j < steps.length; j++) {
            const step = steps[j];
            if (step.mode == "WALK") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/walk.png);"></span></li>`;
            }
            if (step.mode == "RAIL" || step.mode == "SUBWAY") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/${step.mode.toLowerCase()}.png);"></span><span class="route-label-box-circle" style="background-color: ${step.routeColor}; color: ${step.routeTextColor};">${step.route.substr(1)}</span></li>`;
            }
            if (step.mode == "BUS" || step.mode == "TRAM" || step.mode == "TROLLEYBUS" || step.mode == "NIGHTBUS") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/${step.mode.toLowerCase()}.png);"></span><span class="route-label-box" style="background-color: ${step.routeColor}; color: ${step.routeTextColor};">${step.route}</span></li>`;
            }
        }
    }
}

function clearIntineraries() {
    document.getElementById("itineraries").innerHTML = ""; 
}
