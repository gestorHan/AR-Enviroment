import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { Vector3 } from 'three'

const scene: THREE.Scene = new THREE.Scene()
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)



const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry: THREE.ConeGeometry = new THREE.ConeGeometry(50, 100, 32);
const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });

const myObject3D: THREE.Object3D = new THREE.Object3D()
myObject3D.position.x = (Math.random() * 4) - 2
myObject3D.position.z = (Math.random() * 4) - 2

const gridHelper = new THREE.GridHelper(10, 10);
gridHelper.position.y = -.5
scene.add(gridHelper);

camera.position.z = 4

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    render()
}

let myId: string = ""
let timestamp = 0
const clientCubes: { [id: string]: THREE.Mesh } = {}
const socket: SocketIOClient.Socket = io()
socket.on("connect", function () {
    console.log("connect")
})
socket.on("disconnect", function (message: any) {
    console.log("disconnect " + message)
})
socket.on("id", (id: any) => {
    myId = id
    setInterval(() => {
        socket.emit("update", { t: Date.now(), p: myObject3D.position, r: myObject3D.rotation })
    }, 50)
})
socket.on("clients", (clients: any) => {
    let pingStatsHtml = "Socket Ping Stats asdf<br/><br/>"
    Object.keys(clients).forEach((p) => {
        if (p != myId) {
            timestamp = Date.now()
            pingStatsHtml += p + " " + (timestamp - clients[p].t) + "ms<br/>"

            if (!clientCubes[p]) {
                clientCubes[p] = new THREE.Mesh(geometry, material)
                clientCubes[p].name = p
                scene.add(clientCubes[p])
            } else {
                if (clients[p].p) {
                    clientCubes[p].position.set(clients[p].p.x, clients[p].p.y, clients[p].p.z)
                }
                if (clients[p].r) {
                    clientCubes[p].rotation.set(clients[p].r._x, clients[p].r._y, clients[p].r._z)
                }
            }
        }
    });
    (document.getElementById("pingStats") as HTMLDivElement).innerHTML = pingStatsHtml
})
socket.on("removeClient", (id: string) => {
    scene.remove(scene.getObjectByName(id) as THREE.Object3D);
})



const stats = Stats()
document.body.appendChild(stats.dom)


const origen = new Vector3(0, 0, 0)
const animate = function () {
    requestAnimationFrame(animate)

    controls.update()

    render()

    stats.update()
};

const render = function () {
    renderer.render(scene, camera)
}
animate();