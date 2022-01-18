"use strict";
// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const THREE = __importStar(require("three"));
const io = __importStar(require("socket.io-client"));
class App {
    constructor(port, hostname) {
        this.port = port;
        this.hostname = hostname;
        this.socket = io.connect('http://localhost:3000', { reconnection: true });
        this.posActual = new THREE.Vector3((Math.random() * 4) - 2, 1, (Math.random() * 4) - 2);
        this.matRot = new THREE.Matrix4();
        this.matRot.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        this.rotActual = new THREE.Euler(0, 0, 0);
        this.rotActual.setFromRotationMatrix(this.matRot);
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        this.tcp = net_1.default.createServer((sock) => {
            console.log('CONNECTED:', sock.remoteAddress, ':', sock.remotePort);
            sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')
            sock.on('data', (data) => {
                console.log('DATA', sock.remoteAddress, ': ', data, typeof data, "===", typeof "exit");
                let values = data.split(",");
                let numbers = values.map((recived) => Number(recived));
                this.posActual.set(numbers[0], numbers[1], numbers[2]);
                this.matRot.set(numbers[3], numbers[4], numbers[5], 0, numbers[6], numbers[7], numbers[8], 0, numbers[9], numbers[10], numbers[11], 0, 0, 0, 0, 1);
                this.rotActual.setFromRotationMatrix(this.matRot);
                console.log("X: ", numbers[0]);
                console.log("y: ", numbers[1]);
                console.log("z: ", numbers[2]);
                if (data == "exit")
                    console.log('exit message received !');
            });
        });
        this.socket.on("connect", function () {
            console.log("connect");
        });
        this.socket.on("disconnect", function (message) {
            console.log("disconnect " + message);
        });
        this.socket.on("id", (id) => {
            this.id = id;
            setInterval(() => {
                this.socket.emit("update", { t: Date.now(), p: this.posActual, r: this.rotActual });
            }, 50);
        });
    }
    Start() {
        this.tcp.listen(this.port, this.hostname, function () {
            console.log("server acepta conexion ");
        });
    }
}
new App(3001, "0.0.0.0").Start();
