var request = require('request');
var polyline = require('google-polyline');
var mysql = require('mysql');

var SQLconnection = mysql.createConnection({
    user: 'root',
    server: 'localhost',
    database: 'gtfs'
});

SQLconnection.connect();

module.exports = {
    MakeJSON: MakeJSON
};

function GetDataFromBKK(query, callback) {
    var jsonData;
    request(`https://futar.bkk.hu/api/query/v1/ws/otp/api/where/plan-trip.json?key=talli&version=2&fromPlace=${query.fromPlace}&toPlace=${query.toPlace}&date=${query.date}&time=${query.time}`, { json: true }, function (error, response, body) {
        //console.log('Status:', response.statusCode);
        //console.log(response.headers);
        console.log(body);
        callback(body);
    });
}

function MakeJSON(query, callback) {
    GetDataFromBKK(query, function (bkk_response) {
        //const travel_num = FindFastesPlan(bkk_response);
        var plan = bkk_response.data.entry.plan;
        //var references = bkk_response.data.references;


        var json = {
            "data": {
                "plan": {
                    "from": {},
                    "to": {},
                    "itineraries": []
                }
            }
        };
        json.data.plan.from = plan.from;
        json.data.plan.to = plan.to;

        plan.itineraries.forEach(element => {
            var itinerary = {
                "duration": 0,
                "startTime": 0,
                "endTime": 0,
                "transfers": 0,
                "walkDistance": 0,
                "steps": []
            };
            itinerary.duration = element.duration;
            itinerary.startTime = element.startTime;
            itinerary.endTime = element.endTime;
            itinerary.transfers = element.transfers;
            itinerary.walkDistance = element.walkDistance;

            element.legs.forEach(leg => {
                if (leg.mode == "WALK") {
                    var walk = {
                        "mode": "WALK",
                        "startTime": 0,
                        "endTime": 0,
                        "duration": 0,
                        "distance": 0,
                        "from": {},
                        "to": {},
                        "geometry": []
                    };
                    walk.startTime = leg.startTime;
                    walk.endTime = leg.endTime;
                    walk.duration = leg.duration;
                    walk.distance = leg.distance;
                    walk.from = leg.from;
                    walk.to = leg.to;

                    var coordinates = polyline.decode(leg.legGeometry.points);
                    coordinates.forEach(coordinate => {
                        walk.geometry.push([coordinate[1], coordinate[0]]);
                    });
                    itinerary.steps.push(walk);
                }
                if (leg.mode == "RAIL" || leg.mode == "BUS" || leg.mode == "TRAM" || leg.mode == "TROLLEYBUS" || leg.mode == "SUBWAY") {
                    var route = {
                        "mode": "",
                        "startTime": 0,
                        "endTime": 0,
                        "duration": 0,
                        "distance": 0,
                        "headsign": "",
                        "route": "",
                        "routeColor": "",
                        "from": {},
                        "to": {},
                        "stops": [],
                        "geometry": []
                    };
                    route.mode = leg.mode;
                    route.startTime = leg.startTime;
                    route.endTime = leg.endTime;
                    route.duration = leg.duration;
                    route.distance = leg.distance;
                    route.headsign = leg.headsign;
                    route.route = leg.route;
                    route.routeColor = "#" + leg.routeColor;
                    route.from = leg.from;
                    route.to = leg.to;

                    // MySQLSelectStops(leg.tripId.substr(4), leg.from.stopIndex, leg.to.stopIndex, function (results) {
                    //     console.log(results);
                    // });

                    var coordinates = polyline.decode(leg.legGeometry.points);
                    coordinates.forEach(coordinate => {
                        route.geometry.push([coordinate[1], coordinate[0]]);
                    });
                    itinerary.steps.push(route);
                }
            });
            json.data.plan.itineraries.push(itinerary);
        });

        callback(json);
    });
}

function MySQLSelectStops(routeId, fromStopIndex, toStopIndex, callback) {
    var query = 'SELECT s.stop_lat AS "lat", s.stop_lon AS "lon" ' +
        'FROM stops s ' +
        'INNER JOIN stop_times st ON st.stop_id = s.stop_id ' +
        `WHERE st.trip_id = "${routeId}" AND st.stop_sequence BETWEEN ${fromStopIndex} AND ${toStopIndex} ` +
        'ORDER BY st.stop_sequence;';


    SQLconnection.query(query, function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        callback(results);
    });
    //SQLconnection.destroy();
}

function FindFastesPlan(bkk_response) {
    var fastest = Number.POSITIVE_INFINITY;
    var fastestID = 0;
    var array = bkk_response.data.entry.plan.itineraries;
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element.duration <= fastest) {
            fastest = element.duration;
            fastestID = index;
        }
    }
    return fastestID;
}