
let remoteHostSocketAddress = "str_some_address_string_abcd";

console.log("Attempting connection to", remoteHostSocketAddress);

let audioContext = new AudioContext();
let audioSampleRate;

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
                console.log("Audio sample rate was not specified..");
                audioSampleRate = audioContext.samplerate;
            }
        }
    } else {
        let audioSamples = new Float32Array(evt.data);
        var buffer = audioContext.createBuffer(1, 4096, audioSampleRate);
        
        buffer.copyToChannel(audioSamples, 0);

        var node = audioContext.createBufferSource(0);
        node.buffer = buffer;
        node.connect(audioContext.destination);
        node.start();
    }
};
