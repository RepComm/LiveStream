
let remoteHostSocketAddress = "str_some_address_string_abcd";
let secretBroadcasterKey = "str_some_invalid_key_string_abcd";

let audioBufferSize = 4096;
let audioSampleRate;
let audioInputChannels = 1;
let audioOutputChannels = 1;
let audioContext;
let audioGainNode;
let audioStream;
let audioProcessorNode;

let ws;

let dDisplayLog;
let iGain;

function element(id) {
    return document.getElementById(id);
}

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

function onAudioProcess (evt) {
    //logln("Send Audio Buffer");
    ws.send(evt.inputBuffer.getChannelData(0));
}

function initialize () {
    dDisplayLog = element("dDisplayLog");
    iGain = element("iGain");

    logln("Attempting to start audio engine for capture");
    audioContext = new AudioContext();
    audioSampleRate = audioContext.sampleRate;

    logln("Your browser will now ask for recording permission. Please choose the proper audio input (external plugin 'mic', or sterio mix of your device).");
    navigator.mediaDevices.getUserMedia( {
        audio:true
    }).then(function(stream) {
        logln("Successfully got audio control!");
        audioGainNode = audioContext.createGain();

        iGain.onchange = (evt) => {
            audioGainNode.gain.value = iGain.value;
        };

        //audioGainNode.connect( audioContext.destination );
        audioProcessorNode = audioContext.createScriptProcessor(
            audioBufferSize,
            audioInputChannels,
            audioOutputChannels
        );
        audioProcessorNode.onaudioprocess = onAudioProcess;
        audioGainNode.connect(audioProcessorNode);

        audioStream = audioContext.createMediaStreamSource(stream);
        audioStream.connect(audioGainNode);


    }).catch(function(err) {
        logln("Unable to capture audio?", err);
    });

    logln("Attempting connection to", remoteHostSocketAddress, "using your secret broadcaster key");

    ws = new WebSocket(
        remoteHostSocketAddress
    );
    
    ws.onopen = (evt) => {
        logln("Connected to server", remoteHostSocketAddress);
        ws.send( JSON.stringify ( {
            type:"samplerate",
            data:audioSampleRate
        } ) );
    };
    
    ws.onmessage = (evt) => {
        if (evt.data[0] === "{") {
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
        }
    };
    
    ws.onclose = ()=> {
        logln("The connection was closed.")
    };
}

initialize();