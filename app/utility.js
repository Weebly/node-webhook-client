"use strict";

var crypto = require('crypto');

let Utility = {};

Utility.validateHmac = function(hmac, compareString) {
	let digest = this.generateHmac(compareString);
	return (digest == hmac);
};

Utility.generateHmac = function(string) {
	let crypt = crypto.createHmac('sha256', new Buffer(secretKey, 'utf-8'));
	crypt.update(string);
	return crypt.digest('hex');
};

module.exports = Utility;
