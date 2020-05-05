function read_data() {
    var from = document.getElementById("planner-from").value;
    var to = document.getElementById("planner-to").value;
    var date = document.getElementById("planner-date").value;
    var time = document.getElementById("planner-time").value;
    //console.log("from: [" + from + "], to: [" + to + "], date: " + date + ", time: " + time);
    return {fromPlace: from, toPlace: to, date: date, time: time};
}

function loadingShow() {
    document.getElementById("loading").style.display = "block";
}

function loadingHide() {
    document.getElementById("loading").style.display = "none";
}

