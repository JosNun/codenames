const gameModule = require('./game');
const words = require('./words.js');

const { Game } = gameModule;

const games = [];

/**
 * Search through the list of games to see if one exists with a given id
 * @param {String} id - id of the game to find
 * @return {Game}
 */
function findGame(id) {
  return games.find(game => game.id === id.toLowerCase());
}

function getGames() {
  return games;
}

function createGame(id) {
  games.push(new Game(id));
}

module.exports = {
  words,
  findGame,
  getGames,
  createGame,
  setIo: gameModule.setIo,
  loadWordList: words.loadWordList,
};
