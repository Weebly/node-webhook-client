"use strict";

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const WeeblyMiddleware = require('./middleware/weebly.js');

const oauthRouter = require('./app/oauth-router.js');
const webhooksRouter = require('./app/webhooks-router.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

const wMiddleware = new WeeblyMiddleware({
	'client_id': '', // set your Client ID here (or even better, in a config file)
	'secret_key': '' // set your Secret Key here (or even better, in a config file)
});

app.use('/oauth', wMiddleware, oauthRouter);
app.use('/webhooks', wMiddleware, webhooksRouter);

app.get('/', function(req, res) {
	res.sendFile(path.resolve(`${__dirname}/messages/messages.txt`));
});

app.listen(process.env.PORT || 8080);

console.log(`Listening on http://localhost:${process.env.PORT || 8080}`);
