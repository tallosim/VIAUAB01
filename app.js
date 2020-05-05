var http = require('http');
var url = require('url');
var fs = require('fs');

var server = http.createServer(function (request, response) {
    var q = url.parse(request.url, true);
    var filename = q.pathname;

    if(filename == "/") {
        filename = "index.html";
    }

    fs.readFile('./public/' + filename, function(err, data) {
        if (!err) {
            var dotoffset = filename.lastIndexOf('.');
            var mimetype = dotoffset == -1
                            ? 'text/plain'
                            : {
                                '.html' : 'text/html',
                                '.ico' : 'image/x-icon',
                                '.jpg' : 'image/jpeg',
                                '.png' : 'image/png',
                                '.gif' : 'image/gif',
                                '.css' : 'text/css',
                                '.js' : 'text/javascript',
                                '.ttf' : 'text/css'
                                }[ filename.substr(dotoffset) ];
            response.setHeader('Content-type' , mimetype);
            response.end(data);
            console.log( filename, mimetype );
        } else {
            console.log ('file not found: ' + filename);
            response.writeHead(404, "Not Found");
            response.end();
        }
    });
}).listen(8080);

var mysql = require('mysql');

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "gtfs"
// });

var query1 = "SELECT s.shape_pt_lat, s.shape_pt_lon " +
"FROM shapes s " +
"INNER JOIN trips t on t.shape_id = s.shape_id " +
"WHERE t.trip_id = \"C10960119751\" " +
"ORDER BY s.shape_dist_traveled;";

var query2 = "SELECT s.stop_lat, s.stop_lon " +
"FROM stops s " +
"INNER JOIN stop_times st ON st.stop_id = s.stop_id " +
"WHERE st.trip_id = \"C10960119751\" " +
"ORDER BY st.stop_sequence;";

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
//   con.query(query1, function(err, result, fields) {
//       if (err) throw err;
//       console.log(result);
//   })
// });