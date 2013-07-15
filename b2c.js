#!/usr/bin/env node

var help = "usage: portmap.js --lport=80 --rhost=www.baidu.com --rport=80 [--secret xxx <--ec | --dc>]"
var args = require('optimist').argv
if (! (args.lport && args.rport && args.rhost) || args.h || args.help) {
		console.log(help);
		process.exit(0);
} else if (args.secret && !args.ec && !args.dc) {
		console.log(help);
		process.exit(0);
}

var net = require('net')
var cs = require('cipherstream');
var crypto = require('crypto');

var server = net.createServer(function (client) {
		console.log("Portmap: new connection");
		
		if (args.secret) {
				var en = new cs.CipherStream(args.secret, 'rc4');
				var de = new cs.DecipherStream(args.secret, 'rc4');
				// de.on('data', function(d) {
				// 		var str = d + "";
				// 		console.log(str);
				// });
		}

		var msg = new Buffer(0);
		var pre = true;

		client.on('end', function () {
				console.log("Portmap: client disconnect");
				serv.end();
		});
		client.on('data', function (data) {
				// if (! args.dc) {
				// 		var str = data + "";
				// 		console.log(str);
				// }
				if (pre) {
						console.log("Portmap: pre pipe data");
						msg = Buffer.concat([msg, data], msg.length + data.length)
						// console.log(data);
				}
		});
		var serv = new net.Socket();
		serv.connect(parseInt(args.rport), args.rhost, function () {
				console.log("Portmap: connect to server");
				serv.setNoDelay(true);
				// console.log(msg)
				pre = false;										
				if (args.ec) {
						client.pipe(en).pipe(serv);
						serv.pipe(de).pipe(client);
						// pipe before write to catch the 'data' event
						en.write(msg);
				} else if(args.dc) {
						client.pipe(de).pipe(serv);
						serv.pipe(en).pipe(client);
						// pipe before write to catch the 'data' event						
						de.write(msg);						
				} else {
						client.pipe(serv);
						serv.pipe(client);
						// pipe before write to catch the 'data' event												
						serv.write(msg);												
				}

		});
		serv.on('end', function () {
				console.log("Portmap: server disconnect");
				client.end();
		});
		serv.on('data', function (data) {
				// console.log(data);
		});
});

server.listen(parseInt(args.lport), function () {
		console.log("Portmap: server bound");
});
