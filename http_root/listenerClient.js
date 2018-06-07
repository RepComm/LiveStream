
let remoteHostSocketPort = "str_some_port_string_abcd";
//let remoteHostSocketAddress = "str_some_address_string_abcd";
let remoteHostSocketAddress = "ws://" + location.hostname + ":" + remoteHostSocketPort;
let audioContext;
let audioSampleRate;
let ws;
let audioSamplesBuffer = []; //List of chunks that have arrived
let audioSamplePlaying; //Current chunk of audio data we're playing
let currentAudioBuffer;

let audioSourceNode;

function onFinishedPlaying () {
    audioSamplePlaying = audioSamplesBuffer.shift();

}

function initialize () {
    console.log("Starting audio engine");
    audioContext = new AudioContext();
    
    console.log("Attempting connection to", remoteHostSocketAddress);
    let ws = new WebSocket(
        remoteHostSocketAddress
    );

    ws.binaryType = "arraybuffer";

    ws.onopen = (evt) => {
        console.log("Connected to server", remoteHostSocketAddress);
    };
    
    ws.onmessage = (evt) => {
        if (evt.data[0] === "{") {
            let json = JSON.parse(evt.data);
            if (json.type === "init") {
                if (json.data) {
                    audioSampleRate = json.data;
                    console.log("Audio Sample Rate from streamer is", audioSampleRate);
                } else {
                    audioSampleRate = audioContext.sampleRate;
                    console.log("Audio sample rate was not specified.. Using default", audioSampleRate);
                }
                currentAudioBuffer = audioContext.createBuffer(1, 4096*4, audioSampleRate);
                audioSourceNode = audioContext.createBufferSource(0);
                audioSourceNode.loop = true;
                audioSourceNode.connect(audioContext.destination);
                audioSourceNode.start();
            }
        } else {
            if (!audioSamplePlaying) {
                audioSamplePlaying = new Float32Array(evt.data);
            } else {
                audioSamplePlaying.set(evt.data);//= new Float32Array(evt.data);
            }
            //buffer = audioContext.createBuffer(1, 4096, audioSampleRate);
            
            currentAudioBuffer.copyToChannel(audioSamplePlaying, 0);
    
            /*var node = audioContext.createBufferSource(0);
            node.buffer = currentAudioBuffer; //buffer;
            node.connect(audioContext.destination);
            node.start();*/
            audioSourceNode.buffer = currentAudioBuffer;
            //audioSourceNode.connect(audioContext.destination);
        }
    };    
}

initialize();