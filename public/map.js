var tile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGFsbG9zaW0iLCJhIjoiY2s5MXRrY3l4MDE0YjNtbzN2bzFheG1kOSJ9.lIaNhU10l-a4t6qTDh_HzQ', { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, });
var map = L.map('map', { center: [47.497798, 19.040324], zoom: 13, layers: [tile], zoomControl: false });
var layerGroup = L.layerGroup().addTo(map);

var layerIDs = [];

const a_icon = L.icon({ iconUrl: "a.png", iconSize: [30, 30], iconAnchor: [15, 30] });
const b_icon = L.icon({ iconUrl: "b.png", iconSize: [30, 30], iconAnchor: [15, 30] });

//addRoute();

function loadJSON(callback) {
  var params = read_data();
  var queryString = Object.keys(params).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
  }).join('&');

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "test.json?" + queryString, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function addRoute() {
  loadingShow();
  removeRoute();
  loadJSON(function (response) {
    var json = JSON.parse(response);
    var bounds = L.latLngBounds();
    json.datas.forEach(element => {
      if (element.type == "Walk") {
        var walk = element;
        walk.type = "LineString";
        walk.style["weight"] = 6;
        walk.style["dashArray"] = "5, 10";

        var geoJSON = L.geoJSON(walk, { style: walk.style }).addTo(layerGroup);
        layerIDs.push(L.stamp(geoJSON));
        bounds.extend(geoJSON.getBounds());
      }
    });
    json.datas.forEach(element => {
      if (element.type == "Route") {
        var route = element;
        route.type = "LineString";
        route.style["weight"] = 6;

        var geoJSON = L.geoJSON(route, { style: route.style }).addTo(layerGroup);
        layerIDs.push(L.stamp(geoJSON));
        bounds.extend(geoJSON.getBounds());
      }
    });
    json.datas.forEach(element => {
      if (element.type == "Stops") {
        var stops = element;
        stops.type = "MultiPoint";
        stops.style["fillColor"] = "#FFFFFF";
        stops.style["radius"] = 7;
        stops.style["weight"] = 3;
        stops.style["fillOpacity"] = 1;

        var geoJSON = L.geoJSON(stops, { pointToLayer: function (feature, latlng) { return L.circleMarker(latlng, stops.style); } }).addTo(layerGroup);
        layerIDs.push(L.stamp(geoJSON));
        bounds.extend(geoJSON.getBounds());
      }
    });
    loadingHide();
    map.flyToBounds(bounds, { paddingTopLeft: L.point(350, 0), duration: 0.5 });
  });
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

  //removeRoute();
}

var from_marker = new L.Marker(L.latLng(90, 0), { icon: a_icon });
map.addLayer(from_marker);

map.on('click', function (e) {
  map.removeLayer(from_marker);
  from_marker = new L.Marker(e.latlng, { icon: a_icon });
  map.addLayer(from_marker);
  document.getElementById("planner-from").value = ((Math.round(e.latlng.lat + "e+6") / 1000000) + "," + (Math.round(e.latlng.lng + "e+6") / 1000000));

  removeRoute();
});

var to_marker = new L.Marker(L.latLng(90, 0), { icon: b_icon });
map.addLayer(to_marker);

map.on('contextmenu', function (e) {
  map.removeLayer(to_marker);
  to_marker = new L.Marker(e.latlng, { icon: b_icon });
  map.addLayer(to_marker);
  document.getElementById("planner-to").value = ((Math.round(e.latlng.lat + "e+6") / 1000000) + "," + (Math.round(e.latlng.lng + "e+6") / 1000000));

  removeRoute();
});