"use strict";

var crypto = require('crypto');

let Utility = {};

/**
 * Helper function to validate Hmac
 * @param hmac
 * @param compareString
 * @param key
 * @returns {boolean}
 */
Utility.validateHmac = function(hmac, compareString, key) {
	let digest = this.generateHmac(compareString, key);
	return (digest == hmac);
};

/**
 * Helper function to generate Hmac
 * @param string
 * @param key
 * @returns {*}
 */
Utility.generateHmac = function(string, key) {
	let crypt = crypto.createHmac('sha256', new Buffer(key, 'utf-8'));
	crypt.update(string);
	return crypt.digest('hex');
};

module.exports = Utility;
