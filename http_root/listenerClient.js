
let remoteHostSocketAddress = "str_some_address_string_abcd";

console.log("Attempting connection to", remoteHostSocketAddress);

let ws = new WebSocket(
    remoteHostSocketAddress
);

ws.onopen = (evt) => {
    console.log("Connected to server", remoteHostSocketAddress);
};

ws.onmessage = (evt) => {
    console.log("Got message", evt.data);
};
