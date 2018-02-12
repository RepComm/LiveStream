# nodestream
### THIS IS NOT USABLE YET, DOCUMENTATION INCOMPLETE
A node based live stream (audio only right now).
It is a stand-alone server that hosts the necessary client files over HTTP, so all that is needed is to type the address of the server in the browser.

I intend to use it by embeding iframe with the ip:port of my host (i'm renting a linux machine, which has node installed), and it will take care of the rest.

### How it works

An small http server is hosted, which modifies and serves the needed web files as if it were a website,
then it launches a WebSocketServer, which is used to stream the data between itself and the client page's javascript.
The client's javascript is modified before it is served to use the server's public ip, and the hardcoded web socket port.

A secret key is generated on launch, and exposed through the console, and also through a file called 'server_log.txt'. This key is used by in the browser like
`
		<publicip>:10209/<secretkey>
`
Which will get the live streamer's client html from the server, and enable recording/streaming to the server, which will then buffer it and send it to all the listening clients (each client can 'mute' the data, which will pause data being sent).

The listening client GUI is pretty simple, and it includes the ability to Mute/Unmute the audio (pauses playback, and tells server to pause sending data).

There is NO catch up! If you pause the stream, you're missing out!
One of the main points of this project is that it doesn't record the audio for the listeners, it just streams it like a radio station. This is a purposeful feature, and will not be changed.

### Usage
You'll need Git:
https://git-scm.com/book/en/v2/Getting-Started-Installing-Git

You'll need NodeJS:
https://nodejs.org/en/download/package-manager/

Run
`git clone https://github.com/RepComm/nodestream.git`
In the directory you want 'nodestream' directory to install in.

Run
`node server.js` or `nodejs server.js` on some linux distros (I'm running Ubuntu, and this was necessary).

TODO: Finish usage instructions..
