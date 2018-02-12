/* @author Jonathan Crowder
 * @site http://jonathancrowder.com/#nodestream
 * @github http://github.com/RepComm/nodestream
 */

//Begin imports
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const crypto = require("crypto");
const publicIp = require('public-ip');

//Global variables
let streamerClient;
//A secret index that the streamer gets and uses in the browser to claim stream ownership
let streamerSecretKey = crypto.randomBytes(16).toString('hex');
console.log("Stream secret key is", streamerSecretKey);

let httpServer;
let webSocketServer;

//10/20/98 is my birthday, and 102098 is too big, so arbitrary enough...
const httpHostingPort = 10209;
const webSocketServerPort = 10208;

//Content we will need to load to serve as http server
let httpContent = {};

const httpRequestHandler = (request, response) => {
    console.log("Remote client requested:\"" + request.url + "\"");
    
    let reqStr = request.url.substring(1);
    
    if (reqStr == "") reqStr = "default.html";
    
    if (httpContent[reqStr]) {
        response.end(httpContent[reqStr]);
    } else {
        response.end("No content for this request :(");
    }
};

function loadContent (fname) {
    let relativePath = path.join("http_root", fname);
    if (fs.existsSync(relativePath)) {
        httpContent[fname] = fs.readFileSync(
            relativePath,
            "utf8"
        );
    } else {
        console.log("Could not the desired content..", fname);
    }
}

function onWebSocketServerReceived (msg) {

}

function initialize () {
    loadContent("default.html");
    loadContent("styles.css");
    loadContent("client.js");

    publicIp.v4().then(ip => {
        httpContent["client.js"] = httpContent["client.js"].replace(
            "str_some_address_string_abcd",
            "ws://" + ip + ":" + webSocketServerPort
        );
    });
    
    httpServer = http.createServer(httpRequestHandler);
    
    httpServer.listen (httpHostingPort, (err) => {
        if (err) {
            console.log("Couldn't start http server?", err);
            return;
        }
        console.log("Now hosting http server on port", httpHostingPort);
    });

    /*webSocketServer = new WebSocket.Server({
        port: webSocketServerPort
    });

    webSocketServer.on("connection", (ws) => {
        console.log("WebSocket connected", ws);
        ws.on("message", onWebSocketServerReceived);
    });*/

}

initialize();