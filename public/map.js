var tile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGFsbG9zaW0iLCJhIjoiY2s5MXRrY3l4MDE0YjNtbzN2bzFheG1kOSJ9.lIaNhU10l-a4t6qTDh_HzQ', { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, });
var map = L.map('map', { center: [47.497798, 19.040324], zoom: 13, layers: [tile], zoomControl: false });
var layerGroup = L.layerGroup().addTo(map);

var layerIDs = [];

const a_icon = L.icon({ iconUrl: "img/a_point.png", iconSize: [30, 42], iconAnchor: [15, 42] });
const b_icon = L.icon({ iconUrl: "img/b_point.png", iconSize: [30, 42], iconAnchor: [15, 42] });

var from_marker = new L.Marker(L.latLng(90, 0), { icon: a_icon });
map.addLayer(from_marker);

var to_marker = new L.Marker(L.latLng(90, 0), { icon: b_icon });
map.addLayer(to_marker);

var json;

function loadJSON(params, type, callback) {
  params["type"] = type;
  var queryString = Object.keys(params).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
  }).join('&');

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "../response.php?" + queryString, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function makeRequest(params = read_data(), type = "plan-trip") {
  loadingShow();
  clearIntineraries();
  loadJSON(params, type, function (response) {
    if (response != "ERROR") {
      json = JSON.parse(response);
      if (json.code == 200) {
        ShowRoute();
        ShowItineraryContent();
        setAIcon(L.latLng(json.data.plan.from.lat, json.data.plan.from.lon));
        setBIcon(L.latLng(json.data.plan.to.lat, json.data.plan.to.lon));
        type == "plan-trip" ? addIntineraries(json) : 0;
      }
      if (json.code == 400 || json.code == 500) {
        document.getElementById("planner-from").value = "";
        document.getElementById("planner-to").value = "";
        loadingHide();
        alert("Az útvonaltervezés nem lehetséges. Probálja meg az útvonaltervezést más paraméterekkel.");
      }
    }
    else {
      loadingHide();
      alert("Az útvonaltervezés nem lehetséges. Probálja meg az útvonaltervezést más paraméterekkel.");
    }
  });
}

function addRoute(json, num = 0) {
  var bounds = L.latLngBounds();
  var itinerary = json.data.plan.itineraries[num];

  itinerary.steps.forEach(element => {
    if (element.mode == "WALK") {
      var walk = { "type": "LineString", "coordinates": [] };
      walk.coordinates = element.geometry;
      var style = { "color": "#888888", "weight": 6, "dashArray": "5, 10" };
      var geoJSON = L.geoJSON(walk, { style: style }).addTo(layerGroup);
      layerIDs.push(L.stamp(geoJSON));
      bounds.extend(geoJSON.getBounds());
    }
  });

  itinerary.steps.forEach(element => {
    if (element.mode == "RAIL" || element.mode == "BUS" || element.mode == "TRAM" || element.mode == "TROLLEYBUS" || element.mode == "SUBWAY" || element.mode == "NIGHTBUS") {
      var route = { "type": "LineString", "coordinates": [] };
      route.coordinates = element.geometry;
      var routeStyle = { "color": "", "weight": 6 };
      routeStyle.color = element.routeColor;
      var geoJSON = L.geoJSON(route, { style: routeStyle }).addTo(layerGroup);
      layerIDs.push(L.stamp(geoJSON));
      bounds.extend(geoJSON.getBounds());

      var stops = { "type": "MultiPoint", "coordinates": [] };
      stops.coordinates = element.stops;
      var stopsStyle = { "color": "", "radius": 4, "weight": 1, "fillColor": "#FFFFFF", "fillOpacity": 1 };
      stopsStyle.color = element.routeColor;
      var geoJSON = L.geoJSON(stops, { pointToLayer: function (feature, latlng) { return L.circleMarker(latlng, stopsStyle); } }).addTo(layerGroup);
      layerIDs.push(L.stamp(geoJSON));
      bounds.extend(geoJSON.getBounds());

      var endStops = { "type": "MultiPoint", "coordinates": [] };
      endStops.coordinates.push([element.from.lon, element.from.lat]);
      endStops.coordinates.push([element.to.lon, element.to.lat]);
      var endStopsStyle = { "color": "", "radius": 7, "weight": 3, "fillColor": "#FFFFFF", "fillOpacity": 1 };
      endStopsStyle.color = element.routeColor;
      var geoJSON = L.geoJSON(endStops, { pointToLayer: function (feature, latlng) { return L.circleMarker(latlng, endStopsStyle); } }).addTo(layerGroup);
      layerIDs.push(L.stamp(geoJSON));
      bounds.extend(geoJSON.getBounds());
    }
  });
  loadingHide();
  map.flyToBounds(bounds, { paddingTopLeft: L.point(390, 30), paddingBottomRight: L.point(30, 30), duration: 0.5, easeLinearity: 0.95 });
}


function removeRoute() {
  layerIDs.forEach(element => { layerGroup.removeLayer(element); });
  layerIDs.length = 0;
}

function reverse() {
  var from = document.getElementById("planner-from").value;
  var to = document.getElementById("planner-to").value;
  document.getElementById("planner-from").value = to;
  document.getElementById("planner-to").value = from;

  var from_marker_latlng = from_marker.getLatLng();
  var to_marker_latlng = to_marker.getLatLng();

  map.removeLayer(from_marker);
  map.removeLayer(to_marker);
  from_marker = new L.Marker(to_marker_latlng, { icon: a_icon });
  to_marker = new L.Marker(from_marker_latlng, { icon: b_icon });
  map.addLayer(from_marker);
  map.addLayer(to_marker);

  clearIntineraries();
  clearItineraryContent();
  removeRoute();
}

function setAIcon(latlng) {
  map.removeLayer(from_marker);
  from_marker = new L.Marker(latlng, { icon: a_icon });
  map.addLayer(from_marker);
  document.getElementById("planner-from").value = ((Math.round(latlng.lat + "e+6") / 1000000) + "," + (Math.round(latlng.lng + "e+6") / 1000000));
}

function setBIcon(latlng) {
  map.removeLayer(to_marker);
  to_marker = new L.Marker(latlng, { icon: b_icon });
  map.addLayer(to_marker);
  document.getElementById("planner-to").value = ((Math.round(latlng.lat + "e+6") / 1000000) + "," + (Math.round(latlng.lng + "e+6") / 1000000));
}

map.on('click', function (e) {
  setAIcon(e.latlng);
  removeRoute();
  clearIntineraries();
  clearItineraryContent();
});

map.on('contextmenu', function (e) {
  setBIcon(e.latlng);
  removeRoute();
  clearIntineraries();
  clearItineraryContent();
});