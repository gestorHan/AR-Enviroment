// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080

// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000

import express from "express"
import path from "path"

import net from "net"
import * as THREE from 'three'
import { Vector3 } from "three"

import * as io from 'socket.io-client';


class App {
    private port: number
    private hostname: string
    private tcp: net.Server
    private socket: SocketIOClient.Socket
    private posActual: Vector3
    private rotActual: THREE.Euler
    private matRot: THREE.Matrix4


    private id: string;
    private update: Function;


    constructor(port: number, hostname: string) {
        this.port = port
        this.hostname = hostname
        this.socket = io.connect('http://localhost:3000', { reconnection: true });

        this.posActual = new THREE.Vector3((Math.random() * 4) - 2, 1, (Math.random() * 4) - 2);
        this.matRot = new THREE.Matrix4();
        this.matRot.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        )
        this.rotActual = new THREE.Euler(0, 0, 0);
        this.rotActual.setFromRotationMatrix(this.matRot);
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.tcp = net.createServer((sock) => {

            console.log('CONNECTED:', sock.remoteAddress, ':', sock.remotePort);

            sock.setEncoding("utf8"); //set data encoding (either 'ascii', 'utf8', or 'base64')


            sock.on('data', (data: string) => {
                console.log('DATA', sock.remoteAddress, ': ', data, typeof data, "===", typeof "exit");
                let values: string[] = data.split(",")
                let numbers: number[] = values.map((recived) => Number(recived))
                this.posActual.set(-numbers[0], -numbers[1], -numbers[2])
                this.matRot.set(
                    numbers[3], numbers[6], numbers[9], 0,
                    numbers[4], numbers[7], numbers[10], 0,
                    numbers[5], numbers[8], numbers[11], 0,
                    0, 0, 0, 1
                )
                this.rotActual.setFromRotationMatrix(this.matRot)
                console.log("X-: ", -numbers[0]);
                console.log("y-: ", -numbers[1]);
                console.log("z-: ", -numbers[2]);


                if (data == "exit") console.log('exit message received !');
            });
        });



        this.socket.on("connect", function () {
            console.log("connect")
        })
        this.socket.on("disconnect", function (message: any) {
            console.log("disconnect " + message)
        })
        this.socket.on("id", (id: any) => {
            this.id = id
            setInterval(() => {
                this.socket.emit("update", { t: Date.now(), p: this.posActual, r: this.rotActual })
            }, 50)
        })
    }

    public Start() {
        this.tcp.listen(this.port, this.hostname, function () {
            console.log("server acepta conexion ");
        });

    }
}

new App(3001, "0.0.0.0").Start()