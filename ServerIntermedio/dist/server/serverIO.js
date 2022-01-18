"use strict";
// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const net_1 = __importDefault(require("net"));
const port = 3001;
class App {
    constructor(port, hostname) {
        this.port = port;
        this.hostname = hostname;
        this.socket = io("ws://localhost:3000");
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        this.tcp = net_1.default.createServer(function (sock) {
            console.log('CONNECTED:', sock.remoteAddress, ':', sock.remotePort);
            sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')
            sock.on('data', function (data) {
                console.log('DATA', sock.remoteAddress, ': ', data, typeof data, "===", typeof "exit");
                if (data == "exit")
                    console.log('exit message received !');
            });
        });
    }
    Start() {
        this.tcp.listen(this.port, this.hostname, function () {
            console.log("server accepting connections");
        });
    }
}
new App(3001, "0.0.0.0").Start();
