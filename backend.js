const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

var path = require('path');

const port = 3000;

const app = express();

app.use(morgan('common'));
app.use(helmet());
app.use(express.json());

app.get('/', function(req, res) {
    console.log(req.url);
    res.sendFile(path.join(__dirname + '/test.json'));
});

app.use(function (req, res, next) {
    res.status(404).send("Not Found!")
});

app.listen(port);