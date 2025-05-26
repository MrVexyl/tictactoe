const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let rooms = {}; // z. B. { freund123: { X: socket.id, O: socket.id }, ... }
let boards = {}; // z. B. { freund123: [null, null, ...] }
let turns = {}; // z. B. { freund123: 'X' }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ room, symbol }) => {
    if (!rooms[room]) {
      rooms[room] = { X: null, O: null };
      boards[room] = Array(9).fill(null);
      turns[room] = "X";
    }

    if (rooms[room][symbol]) {
      socket.emit("errorMsg", `${symbol} ist bereits belegt in diesem Raum.`);
      return;
    }

    rooms[room][symbol] = socket.id;
    socket.join(room);
    socket.emit("joined");

    io.to(room).emit("updateBoard", {
      board: boards[room],
      currentTurn: turns[room],
    });
  });

  socket.on("makeMove", ({ room, index }) => {
    if (!rooms[room]) return;
    const symbol = rooms[room].X === socket.id ? "X" : rooms[room].O === socket.id ? "O" : null;
    if (!symbol || boards[room][index] !== null || turns[room] !== symbol) return;

    boards[room][index] = symbol;
    turns[room] = symbol === "X" ? "O" : "X";

    io.to(room).emit("updateBoard", {
      board: boards[room],
      currentTurn: turns[room],
    });
  });

  socket.on("resetGame", (room) => {
    if (boards[room]) {
      boards[room] = Array(9).fill(null);
      turns[room] = "X";
      io.to(room).emit("updateBoard", {
        board: boards[room],
        currentTurn: turns[room],
      });
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      for (const symbol of ["X", "O"]) {
        if (rooms[room][symbol] === socket.id) {
          rooms[room][symbol] = null;
        }
      }
      if (!rooms[room].X && !rooms[room].O) {
        delete rooms[room];
        delete boards[room];
        delete turns[room];
      }
    }
  });
});

http.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});
