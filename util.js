/*
 * 
 * Utils for preload
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */
const os = require('os');

module.exports = {
	getIPAdress: () => {
		var interfaces = os.networkInterfaces();
		for (var devName in interfaces) {
			var iface = interfaces[devName];
			for (var i = 0; i < iface.length; i++) {
				var alias = iface[i];
				if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
					return alias.address;
				}
			}
		}
	}
}
