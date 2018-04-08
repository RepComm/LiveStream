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

//Keep track of the stream owner client separately
let streamerClient;
//A secret index that the streamer gets and uses in the browser to claim stream ownership
let streamerSecretKey = crypto.randomBytes(16).toString('hex');
console.log("Stream secret key is", streamerSecretKey);

let httpServer;
let webSocketServer;
let audioSampleRate; //Sent from streamer client to us

//10/20/98 is my birthday, and 102098 is too big, so arbitrary enough...
const httpHostingPort = 10209;
const webSocketServerPort = 10208;

//Content we will need to load to serve as http server
let httpContent = {};

const httpRequestHandler = (request, response) => {
    
    let reqStr = request.url.substring(1);
    if (reqStr === "") {
        //Default address to this server will just use listener.html (could use *address*/listener.html also)
        reqStr = "listener.html";
    }
    
    if (httpContent[reqStr]) {
        response.end(httpContent[reqStr]);
    } else {
        response.end(httpContent["illegal_content_request.html"]);
    }
};

function loadContent (fname, loadAsOptional) {
    //Only load content from http_root directory
    let relativePath = path.join("http_root", fname);

    //Make sure the content exists -- TODO: Check permissions?
    if (fs.existsSync(relativePath)) {
        if (loadAsOptional && typeof(loadAsOptional) == "string") {
            httpContent[loadAsOptional] = fs.readFileSync(
                relativePath,
                "utf8"
            );
        } else {
            httpContent[fname] = fs.readFileSync(
                relativePath,
                "utf8"
            );
        }
    } else {
        console.log("Could not the desired content..", fname);
    }
}

function setAsBroadcaster (socket) {
    streamerClient = socket;

    let time = new Date();
    let preMsg = "[ws server " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] ";
    let msg = "had the secret key, now broadcaster!";

    streamerClient.send( JSON.stringify ( {
        type:"log",
        data:preMsg + "You " + msg
    } ) );

    console.log("Client <client> ", msg);
}

function broadcastToListeners (rawData) {
    webSocketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client !== streamerClient) {
            client.send(rawData);
        }
    });
}

function onWebSocketServerReceived (msg, socket) {
    //If the message is a JSON object string
    if (msg[0] === "{") {
        let json = JSON.parse(msg);
        if (json.type) {
            switch (json.type) {
                case "init":
                    if (json.data) {
                        if (json.data === streamerSecretKey) {
                            setAsBroadcaster(socket);
                        } else {
                            socket.send( JSON.stringify ( {
                                type:"rejectedkey",
                                data:"Your authentication key was rejected as it did not match. Closing your connection now."
                            } ) );
                            socket.close();
                        }
                    }
                    break;
                case "samplerate":
                    //if (socket === streamerClient) {
                        audioSampleRate = json.data;
                    //} //TODO - Else, close socket for illegal action
                    break;
            }
        }
    } else {
        //If the message isn't json, it's a raw audio arraybuffer
        if (socket === streamerClient) {
            //If the socket is the streamer
            broadcastToListeners(msg); //Forward the arraybuffer
        } else {
            //If the socket is some other client, reject and disconnect them
            socket.send( JSON.stringify ( {
                type:"log",
                data:"Rejected audio from your client because it's not registered as the broadcaster. Closing your connection."
            } ) );
            socket.close();
        }
    }
}

function initialize () {
    loadContent("listener.html");
    loadContent("listenerStyles.css");
    loadContent("listenerClient.js");

    //Load streamer with name as secret key to avoid being able to use 'streamer.html' in browser.
    loadContent("streamer.html", streamerSecretKey);
    loadContent("streamerClient.js");
    loadContent("streamerStyles.css");

    //Content to serve if URL is illegal or invalid
    loadContent("illegal_content_request.html");

    httpContent["listenerClient.js"] = httpContent["listenerClient.js"].replace(
        "str_some_port_string_abcd",
        webSocketServerPort
    );

    httpContent["streamerClient.js"] = httpContent["streamerClient.js"].replace(
        "str_some_port_string_abcd",
        webSocketServerPort
    ).replace(
        "str_some_invalid_key_string_abcd",
        streamerSecretKey
    );

    /*
    publicIp.v4().then(ip => {
        //DEBUG TODO - Debug address hardcoded!
        let wsAddressStr = "ws://" + ip + ":" + webSocketServerPort;
        //let wsAddressStr = "ws://localhost:10208";

        httpContent["listenerClient.js"] = httpContent["listenerClient.js"].replace(
            "str_some_address_string_abcd",
            wsAddressStr
        );

        httpContent["streamerClient.js"] = httpContent["streamerClient.js"].replace(
            "str_some_address_string_abcd",
            wsAddressStr
        ).replace(
            "str_some_invalid_key_string_abcd",
            streamerSecretKey
        );
    });
    */
    httpServer = http.createServer(httpRequestHandler);
    
    httpServer.listen (httpHostingPort, (err) => {
        if (err) {
            console.log("Couldn't start http server?", err);
            return;
        }
        console.log("Now hosting http server on port", httpHostingPort);
    });

    webSocketServer = new WebSocket.Server({
        port: webSocketServerPort
    });

    webSocketServer.on("connection", (ws) => {
        ws.send( JSON.stringify( {
            type:"init",
            data:audioSampleRate //Could be undefined
        } ));
        ws.on("message", (msg) => onWebSocketServerReceived(msg, ws));
    });

    //TIME TO READ UP
    //https://stackoverflow.com/questions/28440262/web-audio-api-for-live-streaming
    //https://stackoverflow.com/questions/43366627/cracks-in-webaudio-playback-during-streaming-of-raw-audio-data

}

initialize();