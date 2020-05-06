const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

const api_test = require('./api_test');

var path = require('path');

const port = 8080;

const app = express();

app.use(morgan('common'));
app.use(helmet());
app.use(express.json());

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/response.json', function(req, res) {
    //console.log(req.url);
    //console.log(req.query);
    api_test.MakeJSON(req.query, function(JSON) {
        res.send(JSON);
    });
    //res.sendFile(path.join(__dirname + '/test.json'));
});


app.use(function (req, res, next) {
    res.status(404).send("Not Found!")
});

app.listen(port);