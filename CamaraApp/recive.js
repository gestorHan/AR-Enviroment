"use strict";
var net = require('net');
var HOST = '0.0.0.0';
var PORT = 5000;

net.createServer(function(sock) {
    console.log('CONNECTED:',sock.remoteAddress,':',sock.remotePort);
    sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')
    sock.on('data', function(data) {
        console.log('DATA',sock.remoteAddress,': ',data,typeof data,"===",typeof "exit");
        if(data === "exit") console.log('exit message received !');
    });

}).listen(PORT, HOST, function() {
    console.log("server accepting connections");
});
