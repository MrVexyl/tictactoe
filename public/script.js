const socket = io();
let playerSymbol = null;

const boardDiv = document.getElementById("board");
const info = document.getElementById("info");

function renderBoard(board) {
  boardDiv.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell || "";
    div.addEventListener("click", () => {
      socket.emit("makeMove", i);
    });
    boardDiv.appendChild(div);
  });
}

socket.on("playerSymbol", (symbol) => {
  playerSymbol = symbol;
  info.textContent = "Du spielst als: " + symbol;
});

socket.on("playerCount", (count) => {
  if (count < 2) {
    info.textContent = "Warte auf zweiten Spieler...";
  }
});

socket.on("updateBoard", ({ board, currentTurn }) => {
  renderBoard(board);
  info.textContent = currentTurn === playerSymbol
    ? "Du bist dran!"
    : "Gegner ist dran...";
});

socket.on("full", () => {
  info.textContent = "Spiel ist voll.";
});

function resetGame() {
  socket.emit("resetGame");
}