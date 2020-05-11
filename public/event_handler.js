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

        const startTime = FormatTime(itinerary.startTime);
        const endTime = FormatTime(itinerary.endTime);
        const duration = FormatDuration(itinerary.duration + 60000);
        const distance = Math.floor(itinerary.walkDistance);

        var itineraryHTML = `<div class="itinerary" id="itinerary_${i}" onclick="ShowRoute(${i}); ShowItineraryContent(${i}); SelectItinerary(${i});"><div class="span-itinerary"><p class="p-itinerary">${startTime} ⇒ ${endTime}, ${distance} m séta <span class="right">${duration}</span></p><ul class="route-list" id="itinerary${i}"></ul></div></div>`;
        document.getElementById("itineraries").innerHTML += itineraryHTML;

        //steps
        document.getElementById(`itinerary${i}`).innerHTML = `<li id="${i}_0"><span class="route" style="background-image: url(img/walk.png);"></span></li>`;
        var preStep = "WALK";
        const steps = itinerary.steps;
        for (let j = 0; j < steps.length; j++) {
            const step = steps[j];
            if (step.mode == "WALK" && preStep != "WALK") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/walk.png);"></span></li>`;
            }
            if (step.mode == "RAIL" || step.mode == "SUBWAY") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/${step.mode.toLowerCase()}.png);"></span><span class="route-label-box-circle" style="background-color: ${step.routeColor}; color: ${step.routeTextColor};">${step.route.substr(1)}</span></li>`;
            }
            if (step.mode == "BUS" || step.mode == "TRAM" || step.mode == "TROLLEYBUS" || step.mode == "NIGHTBUS") {
                document.getElementById(`itinerary${i}`).innerHTML += `<li  id="${i}_${j}"><span class="arrow"></span><span class="route" style="background-image: url(img/${step.mode.toLowerCase()}.png);"></span><span class="route-label-box" style="background-color: ${step.routeColor}; color: ${step.routeTextColor};">${step.route}</span></li>`;
            }
            preStep = step.mode;
        }
    }
    SelectItinerary();
}

function clearItineraryContent() {
    document.getElementById("itinerary-placeholder").innerHTML = "";
}

function addItineraryContent(json, num = 0) {
    const itinerary = json.data.plan.itineraries[num];

    document.getElementById(`itinerary-placeholder`).innerHTML += `<div class="itinerary-content" id="itinerary-content_${num}"></div>`;

    const start =
    `<div class="place" id="place_${num}_0">
        <span class="time-date">${FormatTime(itinerary.startTime)}<br><span class="date">${FormatDate(itinerary.startTime)}</span></span>
        <span class="stop-container"><span class="line-walk-place"></span><span class="line-stop-end" style="background-image: url(img/a_icon.png);"></span></span>
        <div class="label-content"><span class="name">${GetAddress(json.data.plan.from.address)}</span><p class="subtext">${GetSubAddress(json.data.plan.from.address)}</p></div>
    </div>`;

    document.getElementById(`itinerary-content_${num}`).innerHTML += start;

    var place_count = 1;
    var route_count = 0;
    var endTime = 0;
    var walkDistance = 0;
    var walkDuration = 0;
    var prevStep = "START";

    for (let i = 0; i < itinerary.steps.length; i++) {
        const step = itinerary.steps[i];

        if (step.mode == "WALK") {
            walkDuration += step.duration;
            walkDistance += step.distance;
            prevStep = (prevStep == "START" ? "START" : "WALK");
        }
        else {
            if (prevStep == "START") {
                const walk =
                `<div class="mode-walk">
                    <span class="time"></span>
                    <span class="line-walk"></span>
                    <div class="content"><div class="desc"><div class="walk-icon"><span class="route" style="background-image: url(img/walk.png);"></span></div><div class="walk-desc">${FormatDuration(walkDuration + 60000, 1)} séta (${Math.floor(walkDistance)} m)</div></div></div>
                </div>`;

                document.getElementById(`itinerary-content_${num}`).innerHTML += walk;
                walkDuration = 0;
                walkDistance = 0;
            }
            else if (prevStep == "WALK") {
                const walk =
                `<div class="mode-walk">
                    <span class="time"></span>
                    <span class="line-walk"></span>
                    <div class="content"><div class="desc"><div class="walk-icon"><span class="route" style="background-image: url(img/walk.png);"></span></div><div class="walk-desc">${FormatDuration(walkDuration + 60000, 1)} séta (${Math.floor(walkDistance)} m, ${FormatDuration(step.startTime - endTime - walkDuration, 1)} várakozás)</div></div></div>
                </div>`;

                document.getElementById(`itinerary-content_${num}`).innerHTML += walk;
                walkDuration = 0;
                walkDistance = 0;
            }
            else {
                const walk =
                `<div class="mode-walk">
                    <span class="time"></span>
                    <span class="line-walk"></span>
                    <div class="content"><div class="desc"><div class="walk-icon"><span class="route" style="background-image: url(img/walk.png);"></span></div><div class="walk-desc">átszállás helyben (${FormatDuration(step.startTime - endTime, 1)} várakozás)</div></div></div>
                </div>`;

                document.getElementById(`itinerary-content_${num}`).innerHTML += walk;
            }

            const routeColor = step.routeColor;

            const route =
            `<div class="place">
                <span class="time">${FormatTime(step.startTime)}<br></span>
                <span class="stop-container"><span class="line-route-place"  style="background-color: ${routeColor}"></span><span class="line-stop-route" style="background-color: ${routeColor}"></span></span>
                <div class="label-content"><span class="name">${step.from.name}</span></div>
            </div>
            <div class="mode-route">
                <span class="time"></span>
                <span class="line-route" style="background-color: ${routeColor}"></span>
                <div class="content">
                    <div class="desc">
                       <div class="route-icon${step.mode == "RAIL" || step.mode == "SUBWAY" ? "-circle" : ""}"><span class="route" style="background-image: url(img/${step.mode.toLowerCase()}.png);"></span><span class="route-label-box${step.mode == "RAIL" || step.mode == "SUBWAY" ? "-circle" : ""}" style="background-color: ${routeColor}; color: ${step.routeTextColor};">${step.mode == "RAIL" || step.mode == "SUBWAY" ? step.route.substr(1) : step.route}</span><span class="arrow"></span></div>
                       <div class="route-desc">${step.headsign}</div>
                    </div>
                    <p class="subtext">${FormatDuration(step.duration, 1)} (<span class="stops">${step.stops.length + 1} megálló</span>)</p>
                </div>
            </div>
            <div class="place">
                <span class="time">${FormatTime(step.endTime)}<br></span>
                <span class="stop-container"><span class="line-walk-place"></span><span class="line-stop-route" style="background-color: ${routeColor}"></span></span>
                <div class="label-content"><span class="name">${step.to.name}</span></div>
            </div>`;

            document.getElementById(`itinerary-content_${num}`).innerHTML += route;
            prevStep = step.mode;
            endTime = step.endTime;
        }
    }

    const walk =
    `<div class="mode-walk">
        <span class="time"></span>
        <span class="line-walk"></span>
        <div class="content"><div class="desc"><div class="walk-icon"><span class="route" style="background-image: url(img/walk.png);"></span></div><div class="walk-desc">${FormatDuration(walkDuration + 60000, 1)} séta (${Math.floor(walkDistance)} m)</div></div></div>
    </div>`;

    document.getElementById(`itinerary-content_${num}`).innerHTML += walk;

    const end =
    `<div class="place" id="place_${num}_0">
        <span class="time-date">${FormatTime(itinerary.endTime)}<br><span class="date">${FormatDate(itinerary.endTime)}</span></span>
        <span class="stop-container"><span class="line-stop-end" style="background-image: url(img/b_icon.png);"></span></span>
        <div class="label-content"><span class="name">${GetAddress(json.data.plan.to.address)}</span><p class="subtext">${GetSubAddress(json.data.plan.to.address)}</p></div>
    </div>`;
    document.getElementById(`itinerary-content_${num}`).innerHTML += end;
}

function ShowItineraryContent(num = 0) {
    clearItineraryContent();
    addItineraryContent(json, num);
}

function ShowRoute(num = 0) {
    removeRoute();
    addRoute(json, num);
}

function SelectItinerary(num = 0) {
    for (let index = 0; index < json.data.plan.itineraries.length; index++) {
        document.getElementById(`itinerary_${index}`).style.border = "1px solid #555555";
        document.getElementById(`itinerary_${index}`).style.backgroundColor = "#FFFFFF";
    }
    document.getElementById(`itinerary_${num}`).style.border = "1px dashed #693070";
    document.getElementById(`itinerary_${num}`).style.backgroundColor = "#EEEEEE";
}

function FormatTime(time) {
    return pad((new Date(time)).getHours()) + ":" + pad((new Date(time)).getMinutes());
}

function FormatDuration(duration, format = 0) {
    return (((new Date(duration)).getUTCHours() > 0) ? (new Date(duration)).getUTCHours() + (format == 0 ? "ó " : " óra ") : "") + (new Date(duration)).getMinutes() + (format == 0 ? "p" : " perc");
}

function FormatDate(date) {
    const months = ["jan", "febr", "márc", "ápr", "máj", "jún", "júl", "aug", "szept", "okt", "nov", "dec"];
    return months[(new Date(date).getMonth())] + " " + (new Date(date).getDate()) + ".";
}

function GetAddress(address) {
    if (address.road && address.house_number) {
        return address.road + " " + address.house_number;
    }
    else if (address.road) {
        return address.road;
    }
    else if (address.footway && address.house_number) {
        return address.footway + " " + address.house_number;
    }
    else if (address.footway) {
        return address.footway;
    }
    else {
        return address.suburb;
    }
}
function GetSubAddress(address) {
    if (address.postcode && address.city) {
        return address.postcode + " " + address.city;
    }
    else {
        return "";
    }
}

function clearIntineraries() {
    document.getElementById("itineraries").innerHTML = "";
}
