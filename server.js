"use strict";

var express = require('express');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var port_number = process.env.PORT || 8080;

var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
	extended: true
}));

require('./routes/routes.js')(app, express);

var server = app.listen(port_number, function() {
	console.log('ready!');
});

process.on('SIGINT', function() {
	console.log('shutting down');
	process.exit(0);
});