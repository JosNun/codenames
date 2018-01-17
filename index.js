/*
TODO:
[ ] check player socket id before joining game
[ ] Clean up everything, and reorder it
*/

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let fs = require('fs');

app.use(express.static('site'));

let wordList;
let games = [];

loadWordList();

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('game list request', (id) => {
    socket.emit('game list', games);
  });

  socket.on('game query', (id, msg) => {
    let game = findGame(msg);
    if (typeof game === 'object') {
      socket.emit('game query response', game.makeClientCopy());
    } else {
      socket.emit('game query response', false);
    }
  });

  socket.on('create game', (msg) => {
    console.log('creating game... ' + msg);
    new Game(msg);
  });

  socket.on('join game', (req) => {
    console.log(
      'join game request recieved for ' + req.gameId + ' from ' + req.socketId
    );
    let gameId = req.gameId;

    let playerReq = req;
    delete playerReq.gameId;

    let playerAdded = findGame(gameId).addPlayer(playerReq);

    socket.emit('game join response', !playerAdded, playerAdded);
  });

  socket.on('games list request', (callback) => {
    console.log('Games list request recieved');

    let gameNames = [];

    games.forEach((game, i) => {
      let name = game.id;
      gameNames.push(name);
    });

    callback(gameNames);
  });
});

http.listen(3000, function() {
  console.log('Listening on *:3000');
});

/**
 * a game room
 */
class Game {
  /**
   * @param {String} id - the games unique id
   */
  constructor(id) {
    this.id = id.toLowerCase();
    this.players = [];
    this.board = [];
    this.usedWords = [];
    this.teams = {
      blue: {
        color: 'blue',
        cards: 8,
        cardsRemaining: 8,
      },
      red: {
        color: 'red',
        cards: 8,
        cardsRemaining: 8,
      },
      neutral: {
        color: 'tan',
        cards: 7,
        cardsRemaining: 7,
      },
      assassin: {
        color: 'black',
        cards: 1,
        cardsRemaining: 1,
      },
    };

    this.generateBoard();
    games.push(this);
  }

  /**
   * generate a new game board
   */
  generateBoard() {
    // Choose which team goes first
    if (Math.random >= 0.5) {
      this.teams['blue'].cards++;
      this.teams['blue'].isFirst = true;
    } else {
      this.teams['red'].cards++;
      this.teams['red'].isFirst = true;
    }

    for (let i = 0; i < 25; i++) {
      let word = getRandomWord();
      while (this.usedWords.includes(word)) {
        // console.log(word + ' is in used words list');
        word = getRandomWord();
      }
      this.usedWords.push(word);

      this.board.push(new Card(word));
    }

    this.board.forEach((card, i) => {
      if (this.teams['blue'].cards > 0) {
        this.teams['blue'].cards--;
        card.team = 'blue';
      } else if (this.teams['red'].cards > 0) {
        this.teams['red'].cards--;
        card.team = 'red';
      } else if (this.teams['assassin'].cards > 0) {
        this.teams['assassin'].cards--;
        card.team = 'assassin';
      } else {
        this.teams['neutral'].cards--;
        card.team = 'neutral';
      }
    });
    this.board = shuffle(this.board);
    // console.log(this.board);
  }

  /**
   * Add a player to the game
   * @param {string} req - the request object
   * @return {String} an error if there is one, otherwise an empty string
   */
  addPlayer(req) {
    let error;

    /**
     *
     * @param {String} team - Team of the joining player
     * @param {*} players - list of players to check
     * @return {boolean} If the array of players already has a spymaster already
     */
    function teamHasSpymaster(team, players) {
      let hasSpymaster = false;
      for (let player of players) {
        if (player.team === team && player.role === 'spymaster') {
          hasSpymaster = true;
          break;
        }
      }
      return hasSpymaster;
    }

    for (let player of this.players) {
      if (player.name.toLowerCase() === req.nickname.toLowerCase()) {
        error = 'Player already joined';
        break;
      } else if (
        req.role === 'spymaster' &&
        teamHasSpymaster(req.team, this.players)
      ) {
        error = 'There is already a Spymaster';
        break;
      } else {
        error = '';
      }
    }

    if (!error) {
      this.players.push({
        name: req.nickname,
        socket: req.socketId,
        team: req.team,
        role: req.role,
      });
      this.updateClients();
    }

    return error;
  }

  /**
   * make a simplified version of the game object to send to the client
   * @return {Object} - striped version of the game object
   */
  makeClientCopy() {
    let clientGame = (({id, players, board, teams}) => ({
      id,
      players,
      board,
      teams,
    }))(this);
    // delete the team info so we don't send it to the client
    clientGame.board.forEach((card) => {
      delete card.team;
    });

    // and additional junk
    Object.keys(clientGame.teams).forEach((key) => {
      delete clientGame.teams[key].cards;
    });

    return clientGame;
  }

  /**
   * update the client versions of the game
   */
  updateClients() {
    io.emit('game update', this.makeClientCopy());
  }
}

/**
 * Clue card
 */
class Card {
  /**
   * @param {string} word
   * @param {string} team
   */
  constructor(word, team) {
    this.team = team;
    this.word = word || getRandomWord();
  }
}

/**
 * fetch the list of words to use
 */
function loadWordList() {
  fs.readFile(__dirname + '/assets/words.txt', 'utf8', (err, data) => {
    if (err) {
      console.log('an error has occured while loading the word list: ' + err);
      return;
    }
    let words = data.split('\n');
    wordList = words;
  });
}

/**
 * Pull a random word from the word list
 * @return {string} - the selected word
 */
function getRandomWord() {
  let word = wordList[Math.floor(Math.random() * wordList.length)];
  return word;
}

/**
 * Shuffles array in place.
 * @param {Array} a - items An array containing the items.
 * @return {Array} - shuffled array
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Search through the list of games to see if one exists with a given id
 * @param {String} id - id of the game to find
 * @return {Game}
 */
function findGame(id) {
  let result;
  games.forEach((game) => {
    if (game.id == id.toLowerCase()) {
      result = game;
      return;
    }
  });
  return result;
}
