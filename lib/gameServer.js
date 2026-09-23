const express = require("express");
const path = require("path");
const settings = require("../config/settings");

const GAMES_DIR = path.join(__dirname, "../games");

const gameList = [
  { id: 1, name: "Tebak Angka", folder: "1-tebakangka" },
  { id: 2, name: "Tebak Kata", folder: "2-tebakkata" },
  { id: 3, name: "Ular (Snake)", folder: "3-ular" },
  { id: 4, name: "2048", folder: "4-2048" },
  { id: 5, name: "Flappy Bird", folder: "5-flappybird" },
  { id: 6, name: "Tic Tac Toe", folder: "6-tictactoe" },
  { id: 7, name: "Memory Card", folder: "7-memori" },
  { id: 8, name: "Hangman", folder: "8-hangman" },
  { id: 9, name: "Quiz", folder: "9-quiz" },
  { id: 10, name: "Batu Gunting Kertas", folder: "10-rps" }
];

function startGameServer() {
  const app = express();

  for (const game of gameList) {
    app.use(`/game/${game.id}`, express.static(path.join(GAMES_DIR, game.folder)));
  }

  app.get("/", (req, res) => {
    const links = gameList
      .map(g => `<li><a href="/game/${g.id}">${g.id}. ${g.name}</a></li>`)
      .join("");
    res.send(`<h1>${settings.botName} - Game List</h1><ul>${links}</ul>`);
  });

  app.listen(settings.gamePort, () => {
    console.log(`[GAME SERVER] Berjalan di ${settings.gameBaseUrl}`);
  });

  return app;
}

function getGameLink(id) {
  const game = gameList.find(g => g.id === Number(id));
  if (!game) return null;
  return {
    ...game,
    url: `${settings.gameBaseUrl}/game/${game.id}`
  };
}

module.exports = { startGameServer, gameList, getGameLink };
