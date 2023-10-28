// server.js

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8001 });
const clients = new Set();

wss.on("connection", function connection(ws) {
    clients.add(ws);
    console.log("new client connected");

    ws.on("message", function incoming(message) {
        message = message.slice(0, 50);

        for (let client of clients) {
            client.send(message);
        }
    });

    ws.on("close", function () {
        clients.delete(ws);
    });
});
