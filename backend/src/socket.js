const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.on("connection", (socket) => {
        socket.emit("socket:ready", {
            message: "WebSocket connection established."
        });
    });

    return io;
};

const emitRequestCreated = (request) => {
    if (!io) return;
    io.emit("request:created", {
        message: "A new time off request was submitted.",
        data: { request }
    });
};

const emitRequestUpdated = (request) => {
    if (!io) return;
    io.emit("request:updated", {
        message: "A time off request was updated.",
        data: { request }
    });
};

const emitRequestDeleted = (request) => {
    if (!io) return;
    io.emit("request:deleted", {
        message: "A time off request was deleted.",
        data: { request }
    });
};

module.exports = { initializeSocket, emitRequestCreated, emitRequestUpdated, emitRequestDeleted };