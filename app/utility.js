"use strict";

var crypto = require('crypto');

let Utility = {};

Utility.validateHmac = function(hmac, compareString, key) {
	let digest = this.generateHmac(compareString, key);
	return (digest == hmac);
};

Utility.generateHmac = function(string, key) {
	let crypt = crypto.createHmac('sha256', new Buffer(key, 'utf-8'));
	crypt.update(string);
	return crypt.digest('hex');
};

module.exports = Utility;
