// server.js

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8001 });
const clients = new Set();

wss.on("connection", function connection(ws) {
    clients.add(ws);
    console.log("new client connected");

    ws.on("message", function incoming(message) {
        // message = message.slice(0, 50); // 이부분 필수인건지..?? 데이터 잘려서 받아져서 일단 주석처리

        for (let client of clients) {
            client.send(message);
        }
    });

    ws.on("close", function () {
        clients.delete(ws);
    });
});
