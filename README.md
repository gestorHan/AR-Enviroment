# AR-Enviroment

![Pose Detection](https://i.ibb.co/T1CKGHN/Reswlutado.png)


![Feature matching](https://i.ibb.co/5WpVXQV/featurem.png)

## Description
Pose (rotation + translation) detection  using feature matching for a given image.  
Pose is then send to web client trough tcp connection and conected trough web sockets to Three.js enviroment. 

 Camera app is the cpp programn which:
 1. Reads an image
 2. Find features matching in the image and camera feed
 3. Computes the pose of the object in space
 4. Sends pose trough TCP contecion to an specified port

 It requires opencv to compile.

 ServerIntermedio is a nodeJs program that:
 1. Recieves the pose information trough TPC 
 2. Send recived info trough websokets 

ClienteWeb is a tree.js based enviroment which:
 1. Serves Enviroment web page
 2. Help connect clients using socket.io  to the Intermediate server in order to receive pose info
 3. Each client grahs a simple 3D model in order to visualize recived info


 ServerIntermedio and ClienteWeb can be used after 
 
 `npm install`

 `npm start`
 


