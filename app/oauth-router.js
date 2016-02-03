"use strict";

const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const needle = require('needle');
const querystring = require('querystring');
const Utility = require('./utility');

router.get('/phase-one', function(req, res) {
	const clientId = req.app.clientId;
	const secretKey = req.app.secretKey;

	let compareObj = {
		'user_id': req.query.user_id,
		'timestamp': req.query.timestamp,
		'site_id': req.query.site_id
	};
	let compareString = querystring.stringify(compareObj);

	if (!Utility.validateHmac(req.query.hmac, compareString)) {
		let messages = [];
		messages.push("The OAuth flow was started, but the hmac calculated didn't match the hmac passed.");
		messages.push(`Expected: ${req.query.hmac}`);
		messages.push(`Computed: ${generateHamc(compareString)}`);
		let message = messages.join("\n");
		return res.status(500).send(message);
	}

	needle.get('https://api.weebly.com/app-center/authorize', function(error, response) {
		let phaseTwoLink = `https://${req.headers.host}/oauth/phase-two`;
		let callbackParams = {
			'client_id': clientId,
			'user_id': req.query.user_id,
			'site_id': req.query.site_id,
			'scope': 'read:blog,read:site,write:site,webhooks',
			'redirect_uri': phaseTwoLink
		};
		let paramsString = querystring.stringify(callbackParams);
		let redirectUrl = `${req.query.callback_url}?${paramsString}`;

		if(req.query.version) {
			redirectUrl += `&version=${req.query.version}`;
		}

		res.redirect(redirectUrl);
	});
});

router.get('/phase-two', function(req, res) {
	const clientId = req.app.clientId;
	const secretKey = req.app.secretKey;

	needle.post(req.query.callback_url, {
		client_id: clientId,
		client_secret: secretKey,
		authorization_code: req.query.authorization_code
	}, function(error, response) {
		if (error) return res.status(500).send('failed');

		let payload = JSON.parse(response.body);

		// we have the token. you can store this wherever
		console.log(payload.access_token);

		let message = `\nAccess token: ${payload.access_token}`;

		fs.appendFile(
			path.resolve(__dirname + '/../message/messages.txt'),
			message,
			function(error) {
				console.error(err);
			}
		);

		res.redirect(payload.callback_url);
	});
});

module.exports = router;
