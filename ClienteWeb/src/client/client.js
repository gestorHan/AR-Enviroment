"use strict";
exports.__esModule = true;
var THREE = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
var stats_module_1 = require("three/examples/jsm/libs/stats.module");
var three_1 = require("three");
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var controls = new OrbitControls_1.OrbitControls(camera, renderer.domElement);
var geometry = new THREE.ConeGeometry(50, 100, 32);
var material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
var myObject3D = new THREE.Object3D();
myObject3D.position.x = (Math.random() * 4) - 2;
myObject3D.position.z = (Math.random() * 4) - 2;
var gridHelper = new THREE.GridHelper(10, 10);
gridHelper.position.y = -.5;
scene.add(gridHelper);
camera.position.z = 4;
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
var myId = "";
var timestamp = 0;
var clientCubes = {};
var socket = io();
socket.on("connect", function () {
    console.log("connect");
});
socket.on("disconnect", function (message) {
    console.log("disconnect " + message);
});
socket.on("id", function (id) {
    myId = id;
    setInterval(function () {
        socket.emit("update", { t: Date.now(), p: myObject3D.position, r: myObject3D.rotation });
    }, 50);
});
socket.on("clients", function (clients) {
    var pingStatsHtml = "Socket Ping Stats asdf<br/><br/>";
    Object.keys(clients).forEach(function (p) {
        if (p != myId) {
            timestamp = Date.now();
            pingStatsHtml += p + " " + (timestamp - clients[p].t) + "ms<br/>";
            if (!clientCubes[p]) {
                clientCubes[p] = new THREE.Mesh(geometry, material);
                clientCubes[p].name = p;
                scene.add(clientCubes[p]);
            }
            else {
                if (clients[p].p) {
                    clientCubes[p].position.set(clients[p].p.x, clients[p].p.y, clients[p].p.z);
                }
                if (clients[p].r) {
                    clientCubes[p].rotation.set(clients[p].r._x, clients[p].r._y, clients[p].r._z);
                }
            }
        }
    });
    document.getElementById("pingStats").innerHTML = pingStatsHtml;
});
socket.on("removeClient", function (id) {
    scene.remove(scene.getObjectByName(id));
});
var stats = stats_module_1["default"]();
document.body.appendChild(stats.dom);
var origen = new three_1.Vector3(0, 0, 0);
var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
};
var render = function () {
    renderer.render(scene, camera);
};
animate();
