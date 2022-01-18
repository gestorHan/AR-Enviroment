"use strict";
// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080
exports.__esModule = true;
// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000
var express_1 = require("express");
var path_1 = require("path");
var http = require("http");
var socket_io_1 = require("socket.io");
var port = 5000;
var App = /** @class */ (function () {
    function App(port) {
        var _this = this;
        this.clients = {};
        this.port = port;
        var app = express_1["default"]();
        app.use(express_1["default"].static(path_1["default"].join(__dirname, '../client')));
        this.server = new http.Server(app);
        this.io = new socket_io_1.Server(this.server);
        this.io.on('connection', function (socket) {
            console.log(socket.constructor.name);
            _this.clients[socket.id] = {};
            console.log(_this.clients);
            console.log('a user connected : ' + socket.id);
            socket.emit("id", socket.id);
            socket.on('disconnect', function () {
                console.log('socket disconnected : ' + socket.id);
                if (_this.clients && _this.clients[socket.id]) {
                    console.log("deleting " + socket.id);
                    delete _this.clients[socket.id];
                    _this.io.emit("removeClient", socket.id);
                }
            });
            socket.on("update", function (message) {
                if (_this.clients[socket.id]) {
                    _this.clients[socket.id].t = message.t; //client timestamp
                    _this.clients[socket.id].p = message.p; //position
                    _this.clients[socket.id].r = message.r; //rotation
                }
            });
        });
        setInterval(function () {
            _this.io.emit("clients", _this.clients);
        }, 50);
    }
    App.prototype.Start = function () {
        var net = require('net');
        var HOST = '0.0.0.0';
        var PORT = 5000;
        net.createServer(function (sock) {
            console.log('CONNECTED:', sock.remoteAddress, ':', sock.remotePort);
            sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')
            sock.on('data', function (data) {
                console.log('DATA', sock.remoteAddress, ': ', data, typeof data, "===", typeof "exit");
                if (data == "exit")
                    console.log('exit message received !');
            });
        }).listen(PORT, HOST, function () {
            console.log("server accepting connections");
        });
    };
    return App;
}());
new App(port).Start();
