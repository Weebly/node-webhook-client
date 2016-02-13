"use strict";

const express = require('express');

/**
 * Simple middleware which requires WEEBLY_CLIENT_ID
 * and WEEBLY_SECRET_KEY to be set before continuing
 *
 * @param options
 * @returns {Function}
 * @constructor
 */
let WeeblyMiddleware = function(options) {
	let clientId = process.env.WEEBLY_CLIENT_ID || options.client_id;
	let secretKey = process.env.WEEBLY_SECRET_KEY || options.secret_key;

	return function(req, res, next) {
		if (!clientId) {
			throw "Client ID must be defined";
		}

		if (!secretKey) {
			throw "Secret Key must be defined";
		}

		req.app.clientId = clientId;
		req.app.secretKey = secretKey;

		next();
	};
};

module.exports = WeeblyMiddleware;
