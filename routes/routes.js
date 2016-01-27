var crypto = require('crypto');
var needle = require('needle');
var fs = require('fs');
var path = require('path');

module.exports = function(app, express) {

	// if not using heroku, then you'll need a place to define your secret key and client id.
	// you could hardcode them here, but ideally they should be stored somewhere else.
	var clientId = process.env.WEEBLY_CLIENT_ID || '';
	if (!clientId) {
		throw "Client ID must be defined";
	}

	var secretKey = process.env.WEEBLY_SECRET_KEY || '';
	if (!secretKey) {
		throw "Secret Key must be defined";
	}

	// initial oauth endpoint.
	app.get('/oauth/phase-one', function(req, res) {

		// first, let's verify that our hmac is consistent with what was sent.
		var compareString = 'user_id=' + req.query.user_id;
		compareString += '&timestamp=' + req.query.timestamp;
		compareString += '&site_id=' + req.query.site_id;

		if (!validateHmac(req.query.hmac, compareString)) {
			var message = 'The OAuth flow was started, but the hmac calculated didn\'t match the hmac passed. \n';
			message += 'Expected: ' + req.query.hmac + '\n';
			message += 'Computed: ' + generateHamc(compareString) + '\n';
			res.status(500).send(message);	// let weebly know we failed
			return;
		}

		// if we've reached this point, that means we're set.
		// make a request to start the authorization process
		needle.get('https://api.weebly.com/app-center/authorize', function(error, response) {

			// right now, we're defining the redirect_uri based on the request
			// you can define this to be wherever you want 
			var phaseTwoLink = 'https://' + req.headers.host + '/oauth/phase-two';

			var redirectUrl = req.query.callback_url;
			redirectUrl += '?client_id=' + clientId;	// client ID
			redirectUrl += '&user_id=' + req.query.user_id;
			redirectUrl += '&site_id=' + req.query.site_id;
			redirectUrl += '&scope=' + 'webhooks';	// replace this with whatever scope you desire.
			redirectUrl += '&redirect_uri=' + phaseTwoLink;

			// if a version is included, we're obligated to send that back.
			if (req.query.version) {
				redirectUrl += '&version=' + req.query.version;
			}

			res.redirect(redirectUrl);
		});
	});

	// secondary oauth endpoint
	app.get('/oauth/phase-two', function(req, res) {

		// we have our authorization code. 
		// now we make a request toe xchange it for a token.
		needle.post(req.query.callback_url, {
			client_id: clientId,		// client ID
			client_secret: secretKey,	// secret key
			authorization_code: req.query.authorization_code	// auth code that was getted to us
		}, function(error, response) {

			if (!error) {
				var payload = JSON.parse(response.body);
				// we now have the token!
				// you can store this wherever; right now this is logged to the console.
				console.log(payload.access_token);
				// then send them back to the callback url that was passed.
				res.redirect(payload.callback_url);
			} else {
				// we failed.
				res.status(500).send('failed');
			}
		});
	});

	// endpoint for the webhooks post request.
	// inside your app's manifest.json, you will need to set this URL as its webhook endpoint
	app.post('/webhooks/callback', function(req, res) {

		// first,validate this and make sure it's correct
		var comparisonObject = {
			"client_id": req.body.client_id,
			"client_version": req.body.client_version,
			"event": req.body.event,
			"timestamp": req.body.timestamp,
			"data": req.body.data
		}
		var comparisonString = JSON.stringify(comparisonObject);

		if (!validateHmac(req.body.hmac, comparisonString)) {
			var message = "\nA new webhook was received, but it's calculated hmac didn't match what was passed.\n";
			message += "Expected: " + req.body.hmac + '\n';
			message += "Calculated: " + generateHmac(comparisonString) + '\n';
		} else {
			var message = "\nA new webhook was receieved:\n";
		}

		message += "\nHeaders:\n" + JSON.stringify(req.headers, null, 2) + "\n";
		message += "\nData:\n" + JSON.stringify(req.body, null, 2) + "\n";

		console.log(message);

		fs.appendFile(path.resolve(__dirname + '/../messages/messages.txt'), message, function (err) {
			console.log(err);
		});

		res.status(200).send(message);
	});

	// load up the webhook data we've been storing
	app.get('/', function(req, res) {
		res.sendFile(path.resolve(__dirname + '/../messages/messages.txt'));
	});

	// helper functions to validate hmacs as they come in.
	function validateHmac(hmac, compareString) {
		var digest = generateHmac(compareString);
		return (digest == hmac);
	}

	function generateHmac(string) {
		var crypt = crypto.createHmac('sha256', new Buffer(secretKey, 'utf-8'));
		crypt.update(string);
		return crypt.digest('hex');
	}
}