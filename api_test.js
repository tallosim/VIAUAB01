var timespan = require('timespan');
var request = require('request');
var polyline = require('google-polyline');

module.exports = {
    MakeJSON: MakeJSON
};

function GetDataFromBKK(query, callback) {
    var jsonData;
    request(`https://futar.bkk.hu/api/query/v1/ws/otp/api/where/plan-trip.json?key=apaiary-test&version=2&fromPlace=${query.fromPlace}&toPlace=${query.toPlace}&date=${query.date}&time=${query.time}`, { json: true }, function (error, response, body) {
        //console.log('Status:', response.statusCode);
        //console.log(response.headers);
        console.log(body);
        callback(body);
    });
}

function MakeJSON(query, callback) {
    GetDataFromBKK(query, function (bkk_response) {
        const travel_num = FindFastesPlan(bkk_response);
        var travel = bkk_response.data.entry.plan.itineraries[travel_num];
        var references = bkk_response.data.references;
        var layer = {
            "layername": "test",
            "datas": []
        };
        travel.legs.forEach(leg => {
            if (leg.mode == "WALK") {
                var walk = { "type": "Walk", "lineName": "walk", "coordinates": [], "style": { "color": "#888888" } };
                var coordinates = polyline.decode(leg.legGeometry.points);
                coordinates.forEach(coordinate => {
                    walk.coordinates.push([coordinate[1], coordinate[0]]);
                });
                layer.datas.push(walk);
                //console.log(walk);
            }
            if (leg.mode == "RAIL" || leg.mode == "BUS" || leg.mode == "TRAM" || leg.mode == "TROLLEYBUS" || leg.mode == "SUBWAY") {
                var route = { "type": "Route", "lineName": leg.route, "coordinates": [], "style": { "color": "#" + leg.routeColor } };
                var coordinates = polyline.decode(leg.legGeometry.points);
                coordinates.forEach(coordinate => {
                    route.coordinates.push([coordinate[1], coordinate[0]]);
                });
                layer.datas.push(route);

                var stops = { "type": "Stops", "lineName": leg.route, "coordinates": [], "style": { "color": "#" + leg.routeColor } };
                stops.coordinates.push([leg.from.lon, leg.from.lat]);
                stops.coordinates.push([leg.to.lon, leg.to.lat]);
                layer.datas.push(stops);
            }
        });
        callback(layer);
    });
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