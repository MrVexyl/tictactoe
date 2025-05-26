const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let players = {};
let board = Array(9).fill(null);
let currentTurn = "X";

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  if (Object.keys(players).length < 2) {
    const symbol = Object.values(players).includes("X") ? "O" : "X";
    players[socket.id] = symbol;
    socket.emit("playerSymbol", symbol);
    io.emit("playerCount", Object.keys(players).length);
  } else {
    socket.emit("full");
    return;
  }

  socket.on("makeMove", (index) => {
    if (players[socket.id] === currentTurn && board[index] === null) {
      board[index] = currentTurn;
      io.emit("updateBoard", { board, currentTurn });
      currentTurn = currentTurn === "X" ? "O" : "X";
    }
  });

  socket.on("resetGame", () => {
    board = Array(9).fill(null);
    currentTurn = "X";
    io.emit("updateBoard", { board, currentTurn });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    delete players[socket.id];
    board = Array(9).fill(null);
    currentTurn = "X";
    io.emit("updateBoard", { board, currentTurn });
    io.emit("playerCount", Object.keys(players).length);
  });
});

http.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});