import net from "net"

//const net = require('net');
const HOST:string = '0.0.0.0';
const PORT:number = 5000;

net.createServer(function(sock) {

    console.log('CONNECTED:',sock.remoteAddress,':',sock.remotePort);
    
    sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')
    
    sock.on('data', function(data:string) {
        console.log('DATA',sock.remoteAddress,': ',data,typeof data,"===",typeof "exit");
        if(data == "exit") console.log('exit message received !');
    });

}).listen(PORT, HOST, function() {
    console.log("server accepting connections");
});


