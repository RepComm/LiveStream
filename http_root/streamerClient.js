
let remoteHostSocketAddress = "str_some_address_string_abcd";
let secretBroadcasterKey = "str_some_invalid_key_string_abcd";

function element(id) {
    return document.getElementById(id);
}

let dDisplayLog = element("dDisplayLog");

function loglnNoTimestamp () {
    if (arguments.length < 1) return;
    let message = arguments[0].toString();

    if (arguments.length > 1) {
        for (let i=1; i<arguments.length-1; i++) {
            message += " " + arguments[i].toString();
        }
        message += " " + arguments[arguments.length-1];
    }

    //Log in the browser's console
    console.log(message);

    if (dDisplayLog) {
        message += "<br>"; //Append an HTML break line
        dDisplayLog.innerHTML += message;

        //Make the log snap to the bottom if it's scrolled near the bottom
        let scrollBottom = dDisplayLog.scrollTop+dDisplayLog.getBoundingClientRect().height;

        //If we are 35 (arbitrary, small number) away from the bottom, scroll to the bottom
        if (scrollBottom >= dDisplayLog.scrollHeight - 35) {
            dDisplayLog.scrollTop = dDisplayLog.scrollHeight;
        }
    }
}

function logln () {
    if (arguments.length < 1) return;

    let time = new Date();

    //Start with the first message to avoid the initial space
    let message = "[stream client " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + "] ";

    message += arguments[0].toString();

    if (arguments.length > 1) {
        for (let i=1; i<arguments.length-1; i++) {
            message += " " + arguments[i].toString();
        }
        message += " " + arguments[arguments.length-1];
    }

    //Log in the browser's console
    console.log(message);

    if (dDisplayLog) {
        message += "<br>"; //Append an HTML break line
        dDisplayLog.innerHTML += message;

        //Make the log snap to the bottom if it's scrolled near the bottom
        let scrollBottom = dDisplayLog.scrollTop+dDisplayLog.getBoundingClientRect().height;

        //If we are 35 (arbitrary, small number) away from the bottom, scroll to the bottom
        if (scrollBottom >= dDisplayLog.scrollHeight - 35) {
            dDisplayLog.scrollTop = dDisplayLog.scrollHeight;
        }
    }
}

logln("Attempting connection to", remoteHostSocketAddress, "using your secret broadcaster key");

let ws = new WebSocket(
    remoteHostSocketAddress
);

ws.onopen = (evt) => {
    logln("Connected to server", remoteHostSocketAddress);
};

ws.onmessage = (evt) => {
    let json = JSON.parse(evt.data);
    if (json.type) {
        switch (json.type) {
            case "init":
                logln("Attempting to authenticate using key " + secretBroadcasterKey);
                ws.send( JSON.stringify ( {
                    type:"init",
                    data:secretBroadcasterKey
                } ) );
                break;
            case "rejectedkey":
                if (json.data) {
                    logln("Server refused key:", json.data);
                }
                break;
            case "log":
                if (json.data) {
                    loglnNoTimestamp(json.data);
                }
                break;
        }
    }
};

ws.onclose = ()=> {
    logln("The connection was closed.")
};